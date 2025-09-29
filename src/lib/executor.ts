import { type CompiledMove } from "./adapters/pokeapiMoveAdapter";
import { BattlePokemon } from "./team-battle-engine";
import { TypeName } from "@/lib/damage-calculator";
import { getMove } from "./moveCache";

// --- Utilities ---
function hasSTAB(user: BattlePokemon, moveType: TypeName): boolean {
  return user.pokemon.types.some(t => 
    (typeof t === 'string' ? t : t.type?.name || 'normal') === moveType
  );
}

function stabValue(user: BattlePokemon, moveType: TypeName, hasAdaptability = false): number {
  return hasSTAB(user, moveType) ? (hasAdaptability ? 2.0 : 1.5) : 1.0;
}

function weatherModFor(moveType: TypeName, weather: string): number {
  if (weather === "rain") return moveType === "Water" ? 1.5 : moveType === "Fire" ? 0.5 : 1;
  if (weather === "sun") return moveType === "Fire" ? 1.5 : moveType === "Water" ? 0.5 : 1;
  return 1;
}

function screenMod(isPhysical: boolean, field: unknown, doubles = false): number {
  const m = doubles ? 2/3 : 0.5;
  const fieldObj = field as { auroraVeilTurns?: number; reflectTurns?: number; lightScreenTurns?: number };
  if (fieldObj.auroraVeilTurns && fieldObj.auroraVeilTurns > 0) return m;
  if (isPhysical && fieldObj.reflectTurns && fieldObj.reflectTurns > 0) return m;
  if (!isPhysical && fieldObj.lightScreenTurns && fieldObj.lightScreenTurns > 0) return m;
  return 1;
}

function pickMultiHit(hits: { min: number; max: number }): number {
  // Gen V+ typical 2–5 distribution: 2:3/8, 3:3/8, 4:1/8, 5:1/8
  if (hits.min === 2 && hits.max === 5) {
    const r = Math.random();
    if (r < 3/8) return 2;
    if (r < 6/8) return 3;
    if (r < 7/8) return 4;
    return 5;
  }
  // Otherwise uniform in [min..max]
  return Math.floor(Math.random() * (hits.max - hits.min + 1)) + hits.min;
}

function rollCrit(critStage: number): boolean {
  const CRIT_RATE = [1/24, 1/8, 1/2, 1]; // Gen VI+ crit rates
  const p = CRIT_RATE[Math.max(0, Math.min(3, critStage))] ?? 1/24;
  return Math.random() < p;
}

function applyAilment(target: BattlePokemon, ailment: { kind: string; chance: number }): { applied: boolean; kind?: string } {
  if (Math.random() * 100 >= (ailment.chance ?? 0)) return { applied: false };
  const k = ailment.kind;
  
  // Map common PokeAPI ailments to our status system
  if (k === "paralysis" && !target.status) { 
    target.status = "paralyzed"; 
    return { applied: true, kind: "PAR" }; 
  }
  if (k === "burn" && !target.status) { 
    target.status = "burned"; 
    return { applied: true, kind: "BRN" }; 
  }
  if (k === "poison" && !target.status) { 
    target.status = "poisoned"; 
    return { applied: true, kind: "PSN" }; 
  }
  if (k === "toxic" && !target.status) { 
    target.status = "poisoned"; 
    return { applied: true, kind: "TOX" }; 
  }
  if (k === "sleep" && !target.status) { 
    target.status = "asleep"; 
    return { applied: true, kind: "SLP" }; 
  }
  if (k === "freeze" && !target.status) { 
    target.status = "frozen"; 
    return { applied: true, kind: "FRZ" }; 
  }
  return { applied: false };
}

function applyStatChanges(target: BattlePokemon, list: NonNullable<CompiledMove["statChanges"]>, log: string[]): void {
  for (const sc of list) {
    if (Math.random() * 100 >= (sc.chance ?? 100)) continue;
    
    const statName = mapStatName(sc.stat);
    const oldValue = target.statModifiers[statName];
    target.statModifiers[statName] = Math.max(-6, Math.min(6, oldValue + sc.stages));
    
    log.push(`stat:${sc.stat} ${sc.stages > 0 ? "+" : ""}${sc.stages}`);
  }
}

function mapStatName(stat: "atk" | "def" | "spa" | "spd" | "spe" | "acc" | "eva"): keyof BattlePokemon['statModifiers'] {
  const mapping: Record<"atk" | "def" | "spa" | "spd" | "spe" | "acc" | "eva", keyof BattlePokemon['statModifiers']> = {
    'atk': 'attack',
    'def': 'defense',
    'spa': 'specialAttack',
    'spd': 'specialDefense',
    'spe': 'speed',
    'acc': 'accuracy',
    'eva': 'evasion'
  };
  return mapping[stat];
}

function willMoveHit(baseAccuracy: number, attackerAccStage: number, defenderEvaStage: number): boolean {
  const accuracyMod = Math.max(0.33, Math.min(3, (3 + attackerAccStage) / (3 + defenderEvaStage)));
  const finalAccuracy = baseAccuracy * accuracyMod;
  return Math.random() * 100 < finalAccuracy;
}

function modifiedAttack(baseStat: number, isPhysical: boolean, pokemon: BattlePokemon): number {
  const stage = isPhysical ? pokemon.statModifiers.attack : pokemon.statModifiers.specialAttack;
  const stageMod = stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage);
  return Math.floor(baseStat * stageMod);
}

function modifiedDefense(baseStat: number, isPhysical: boolean, pokemon: BattlePokemon, _weather: string): number {
  const stage = isPhysical ? pokemon.statModifiers.defense : pokemon.statModifiers.specialDefense;
  const stageMod = stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage);
  return Math.floor(baseStat * stageMod);
}

function modifiedSpeed(baseStat: number, pokemon: BattlePokemon): number {
  const stage = pokemon.statModifiers.speed;
  const stageMod = stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage);
  return Math.floor(baseStat * stageMod);
}

export type TurnResult = {
  move: string;
  hits: number;
  crits: boolean[];
  perHitDamage: number[];
  totalDamage: number;
  missed: boolean;
  typeEffectiveness: number;
  flinchedTarget?: boolean;
  binding?: { kind: string; turns: number; fraction: number };
  appliedAilment?: string;
  statChanges?: string[];
  drained?: number; // HP restored to attacker
  recoil?: number;  // HP lost by attacker
};

export type ExecuteTurnOptions = {
  move: number | string;          // PokeAPI id or name
  attacker: BattlePokemon;
  defender: BattlePokemon;
  field?: unknown; // Field state (optional for now)
  attackerHasAdaptability?: boolean;
  doubles?: boolean;
};

export async function executeTurn(opts: ExecuteTurnOptions): Promise<TurnResult> {
  const {
    attacker, defender, field = {},
    attackerHasAdaptability = false
  } = opts;

  const move = await getMove(opts.move);
  const isStatus = move.category === "Status";

  const result: TurnResult = {
    move: move.name,
    hits: 0, crits: [], perHitDamage: [], totalDamage: 0,
    missed: false, typeEffectiveness: 1,
  };

  // --- Accuracy check (skip if Status with no harm OR accuracy=null) ---
  const bypass = !!move.bypassAccuracyCheck || isStatus;
  if (!bypass) {
    const hit = willMoveHit(
      move.accuracy ?? 100,
      attacker.statModifiers.accuracy,
      defender.statModifiers.evasion
    );
    if (!hit) {
      result.missed = true;
      return result;
    }
  }

  // --- If Status, just apply secondaries (ailment / stat changes) and exit ---
  if (isStatus) {
    if (move.ailment) {
      const res = applyAilment(defender, move.ailment);
      if (res.applied) result.appliedAilment = res.kind!;
    }
    if (move.statChanges?.length) {
      const before: string[] = [];
      applyStatChanges(defender, move.statChanges, before);
      if (before.length) result.statChanges = before;
    }
    return result;
  }

  // --- Offensive category + stats ---
  const isPhysical = move.category === "Physical";
  const attackerBaseAtk = attacker.pokemon.stats.find(s => s.stat.name === 'attack')?.base_stat || 50;
  const attackerBaseSpa = attacker.pokemon.stats.find(s => s.stat.name === 'special-attack')?.base_stat || 50;
  const defenderBaseDef = defender.pokemon.stats.find(s => s.stat.name === 'defense')?.base_stat || 50;
  const defenderBaseSpd = defender.pokemon.stats.find(s => s.stat.name === 'special-defense')?.base_stat || 50;

  const atkStat = modifiedAttack(isPhysical ? attackerBaseAtk : attackerBaseSpa, isPhysical, attacker);
  const fieldObj = field as { weather?: { kind?: string } };
  const defStat = modifiedDefense(isPhysical ? defenderBaseDef : defenderBaseSpd, isPhysical, defender, fieldObj.weather?.kind || 'none');

  // --- Power (static or dynamic) ---
  const dynCtx = {
    attacker: {
      level: attacker.level,
      weightKg: attacker.pokemon.weight / 10, // Convert from hectograms to kg
      speed: modifiedSpeed(attacker.pokemon.stats.find(s => s.stat.name === 'speed')?.base_stat || 50, attacker),
      curHP: attacker.currentHp,
      maxHP: attacker.maxHp
    },
    defender: {
      weightKg: defender.pokemon.weight / 10,
      speed: modifiedSpeed(defender.pokemon.stats.find(s => s.stat.name === 'speed')?.base_stat || 50, defender),
      curHP: defender.currentHp,
      maxHP: defender.maxHp,
      types: defender.pokemon.types.map(t => 
        (typeof t === 'string' ? t : t.type?.name || 'normal') as TypeName
      )
    }
  };
  const power = move.getPower ? move.getPower(dynCtx) : (move.power ?? 0);

  // --- Multipliers ---
  const typeEff = calculateTypeEffectiveness(move.type, defender.pokemon.types.map(t => 
    (typeof t === 'string' ? t : t.type?.name || 'normal') as TypeName
  ));
  result.typeEffectiveness = typeEff;
  if (typeEff === 0) return result; // immune ⇒ no damage

  const stab = stabValue(attacker, move.type, attackerHasAdaptability);
  const wth = weatherModFor(move.type, fieldObj.weather?.kind || 'none');
  const burn = (attacker.status === "burned" && isPhysical) ? 0.5 : 1;
  const screens = screenMod(isPhysical, field, false);

  // --- Hits ---
  const hits = move.hits ? pickMultiHit(move.hits) : 1;
  result.hits = hits;

  // --- Per-hit loop ---
  let total = 0;
  let drainGained = 0;
  let recoilLost = 0;

  for (let i = 0; i < hits; i++) {
    const crit = rollCrit(move.critRateStage);
    result.crits.push(crit);

    const dmg = calculateDamage({
      level: attacker.level,
      movePower: power,
      attackStat: atkStat,
      defenseStat: defStat,
      isCrit: crit,
      stab,
      typeEffect: typeEff,
      weatherMod: wth,
      burnMod: burn,
      otherMods: screens
    });

    // Apply damage
    defender.currentHp = Math.max(0, defender.currentHp - dmg);
    total += dmg;
    result.perHitDamage.push(dmg);

    // If defender fainted, stop further hits
    if (defender.currentHp === 0) break;
  }

  result.totalDamage = total;

  // --- Drain (healing) ---
  if (move.drain?.fraction) {
    drainGained = Math.floor(total * move.drain.fraction);
    attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + drainGained);
    result.drained = drainGained;
  }

  // --- Recoil ---
  if (move.recoil?.fraction) {
    recoilLost = Math.max(1, Math.floor(total * move.recoil.fraction));
    attacker.currentHp = Math.max(0, attacker.currentHp - recoilLost);
    result.recoil = recoilLost;
  }

  // --- Secondary effects (on hit) ---
  if (defender.currentHp > 0) {
    if (move.ailment) {
      const res = applyAilment(defender, move.ailment);
      if (res.applied) result.appliedAilment = res.kind!;
    }
    if (move.statChanges?.length) {
      const logs: string[] = [];
      applyStatChanges(defender, move.statChanges, logs);
      if (logs.length) result.statChanges = logs;
    }
    // Flinch secondaries for common moves (use PokeAPI shortEffect if available in future)
    const flinchMoves: Record<string, number> = {
      'headbutt': 0.3,
      'rock-slide': 0.3,
      'air-slash': 0.3,
      'bite': 0.3,
      'iron-head': 0.3,
      'zen-headbutt': 0.2,
      'stomp': 0.3,
      'extrasensory': 0.1,
      'dark-pulse': 0.2
    };
    const f = flinchMoves[move.name.toLowerCase()];
    if (f && Math.random() < f) {
      (defender.volatile as any).flinched = true;
      result.flinchedTarget = true;
    }

    // Binding/trapping residuals (apply on hit)
    const bindingMoves: Record<string, { fraction: number }> = {
      'bind': { fraction: 1/8 },
      'wrap': { fraction: 1/8 },
      'clamp': { fraction: 1/8 },
      'whirlpool': { fraction: 1/8 },
      'fire-spin': { fraction: 1/8 },
      'sand-tomb': { fraction: 1/8 },
      'magma-storm': { fraction: 1/8 },
      'infestation': { fraction: 1/8 }
    };
    const b = bindingMoves[move.name.toLowerCase()];
    if (b) {
      const turns = (Math.random() < 0.5 ? 4 : 5);
      result.binding = { kind: move.name.toLowerCase(), turns, fraction: b.fraction };
    }
  }

  return result;
}

// Helper functions for damage calculation
function calculateTypeEffectiveness(attackType: TypeName, defenderTypes: TypeName[]): number {
  const TYPE_CHART: Record<TypeName, Record<TypeName, number>> = {
    Normal: { Normal: 1, Fire: 1, Water: 1, Electric: 1, Grass: 1, Ice: 1, Fighting: 1, Poison: 1, Ground: 1, Flying: 1, Psychic: 1, Bug: 1, Rock: 0.5, Ghost: 0, Dragon: 1, Dark: 1, Steel: 0.5, Fairy: 1 },
    Fire: { Normal: 1, Fire: 0.5, Water: 0.5, Electric: 1, Grass: 2, Ice: 2, Fighting: 1, Poison: 1, Ground: 1, Flying: 1, Psychic: 1, Bug: 2, Rock: 0.5, Ghost: 1, Dragon: 0.5, Dark: 1, Steel: 2, Fairy: 1 },
    Water: { Normal: 1, Fire: 2, Water: 0.5, Electric: 1, Grass: 0.5, Ice: 1, Fighting: 1, Poison: 1, Ground: 2, Flying: 1, Psychic: 1, Bug: 1, Rock: 2, Ghost: 1, Dragon: 0.5, Dark: 1, Steel: 1, Fairy: 1 },
    Electric: { Normal: 1, Fire: 1, Water: 2, Electric: 0.5, Grass: 0.5, Ice: 1, Fighting: 1, Poison: 1, Ground: 0, Flying: 2, Psychic: 1, Bug: 1, Rock: 1, Ghost: 1, Dragon: 0.5, Dark: 1, Steel: 1, Fairy: 1 },
    Grass: { Normal: 1, Fire: 0.5, Water: 2, Electric: 1, Grass: 0.5, Ice: 1, Fighting: 1, Poison: 0.5, Ground: 2, Flying: 0.5, Psychic: 1, Bug: 0.5, Rock: 2, Ghost: 1, Dragon: 0.5, Dark: 1, Steel: 0.5, Fairy: 1 },
    Ice: { Normal: 1, Fire: 0.5, Water: 0.5, Electric: 1, Grass: 2, Ice: 0.5, Fighting: 1, Poison: 1, Ground: 2, Flying: 2, Psychic: 1, Bug: 1, Rock: 1, Ghost: 1, Dragon: 2, Dark: 1, Steel: 0.5, Fairy: 1 },
    Fighting: { Normal: 2, Fire: 1, Water: 1, Electric: 1, Grass: 1, Ice: 2, Fighting: 1, Poison: 0.5, Ground: 1, Flying: 0.5, Psychic: 0.5, Bug: 1, Rock: 2, Ghost: 0, Dragon: 1, Dark: 2, Steel: 2, Fairy: 0.5 },
    Poison: { Normal: 1, Fire: 1, Water: 1, Electric: 1, Grass: 2, Ice: 1, Fighting: 1, Poison: 0.5, Ground: 0.5, Flying: 1, Psychic: 1, Bug: 1, Rock: 0.5, Ghost: 0.5, Dragon: 1, Dark: 1, Steel: 0, Fairy: 2 },
    Ground: { Normal: 1, Fire: 2, Water: 1, Electric: 2, Grass: 0.5, Ice: 1, Fighting: 1, Poison: 2, Ground: 1, Flying: 0, Psychic: 1, Bug: 1, Rock: 2, Ghost: 1, Dragon: 1, Dark: 1, Steel: 2, Fairy: 1 },
    Flying: { Normal: 1, Fire: 1, Water: 1, Electric: 0.5, Grass: 2, Ice: 1, Fighting: 2, Poison: 1, Ground: 1, Flying: 1, Psychic: 1, Bug: 2, Rock: 0.5, Ghost: 1, Dragon: 1, Dark: 1, Steel: 0.5, Fairy: 1 },
    Psychic: { Normal: 1, Fire: 1, Water: 1, Electric: 1, Grass: 1, Ice: 1, Fighting: 2, Poison: 2, Ground: 1, Flying: 1, Psychic: 0.5, Bug: 1, Rock: 1, Ghost: 1, Dragon: 1, Dark: 0, Steel: 0.5, Fairy: 1 },
    Bug: { Normal: 1, Fire: 0.5, Water: 1, Electric: 1, Grass: 2, Ice: 1, Fighting: 0.5, Poison: 0.5, Ground: 1, Flying: 0.5, Psychic: 2, Bug: 1, Rock: 1, Ghost: 0.5, Dragon: 1, Dark: 2, Steel: 0.5, Fairy: 0.5 },
    Rock: { Normal: 1, Fire: 2, Water: 1, Electric: 1, Grass: 1, Ice: 2, Fighting: 0.5, Poison: 1, Ground: 0.5, Flying: 2, Psychic: 1, Bug: 2, Rock: 1, Ghost: 1, Dragon: 1, Dark: 1, Steel: 0.5, Fairy: 1 },
    Ghost: { Normal: 0, Fire: 1, Water: 1, Electric: 1, Grass: 1, Ice: 1, Fighting: 1, Poison: 1, Ground: 1, Flying: 1, Psychic: 2, Bug: 1, Rock: 1, Ghost: 2, Dragon: 1, Dark: 0.5, Steel: 1, Fairy: 1 },
    Dragon: { Normal: 1, Fire: 1, Water: 1, Electric: 1, Grass: 1, Ice: 1, Fighting: 1, Poison: 1, Ground: 1, Flying: 1, Psychic: 1, Bug: 1, Rock: 1, Ghost: 1, Dragon: 2, Dark: 1, Steel: 0.5, Fairy: 0 },
    Dark: { Normal: 1, Fire: 1, Water: 1, Electric: 1, Grass: 1, Ice: 1, Fighting: 0.5, Poison: 1, Ground: 1, Flying: 1, Psychic: 2, Bug: 1, Rock: 1, Ghost: 2, Dragon: 1, Dark: 0.5, Steel: 1, Fairy: 0.5 },
    Steel: { Normal: 1, Fire: 0.5, Water: 0.5, Electric: 0.5, Grass: 1, Ice: 2, Fighting: 1, Poison: 1, Ground: 1, Flying: 1, Psychic: 1, Bug: 1, Rock: 2, Ghost: 1, Dragon: 1, Dark: 1, Steel: 0.5, Fairy: 2 },
    Fairy: { Normal: 1, Fire: 0.5, Water: 1, Electric: 1, Grass: 1, Ice: 1, Fighting: 2, Poison: 0.5, Ground: 1, Flying: 1, Psychic: 1, Bug: 1, Rock: 1, Ghost: 1, Dragon: 2, Dark: 2, Steel: 0.5, Fairy: 1 }
  };

  let effectiveness = 1;
  for (const defenderType of defenderTypes) {
    const normalizedAttackType = attackType.charAt(0).toUpperCase() + attackType.slice(1).toLowerCase() as TypeName;
    const normalizedDefenderType = defenderType.charAt(0).toUpperCase() + defenderType.slice(1).toLowerCase() as TypeName;
    effectiveness *= TYPE_CHART[normalizedAttackType]?.[normalizedDefenderType] ?? 1;
  }
  return effectiveness;
}

function calculateDamage(params: {
  level: number;
  movePower: number;
  attackStat: number;
  defenseStat: number;
  isCrit: boolean;
  stab: number;
  typeEffect: number;
  weatherMod: number;
  burnMod: number;
  otherMods: number;
}): number {
  const { level, movePower, attackStat, defenseStat, isCrit, stab, typeEffect, weatherMod, burnMod, otherMods } = params;
  
  if (typeEffect === 0) return 0; // Immunity
  
  const levelFactor = (2 * level + 10) / 250;
  const statRatio = attackStat / defenseStat;
  const baseDamage = Math.floor(levelFactor * statRatio * movePower + 2);
  
  const critMod = isCrit ? 1.5 : 1;
  const randomFactor = 0.85 + Math.random() * 0.15; // 0.85-1.00
  
  const finalDamage = Math.floor(baseDamage * critMod * stab * typeEffect * weatherMod * burnMod * otherMods * randomFactor);
  
  return Math.max(1, finalDamage);
}
