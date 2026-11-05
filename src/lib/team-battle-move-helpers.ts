// Move-execution helpers used by the turn pipeline: accuracy, hit counts, ailments, secondary effects,
// flinch, Substitute, Protect punishments, crash damage, move bookkeeping, type-changing abilities,
// absorb immunities and Beast Boost. Split out of team-battle-engine-additional.ts.

import { BattleState, BattlePokemon, getTeamForPokemon, isSafeguardActive } from './team-battle-engine';
import { calculateTypeEffectiveness, TypeName } from './damage-calculator';
import { isGrounded, getPokemonTypes } from './team-battle-hazards';
import { RECHARGE_MOVE_ID } from './battle-multiturn';
import { applyStatus, terrainPreventsStatus } from './team-battle-status';
import { BattleRng, rngRollChance, rngNextInt, rngNextFloat } from './battle-rng';
import { SELF_STATUS_MOVES } from './battle-move-constants';
import { changeStatStage } from './team-battle-stat-stages';
import { abilityOf, targetAbility } from './team-battle-ability-rules';
import { CRASH_MOVES, HALF_HP_COST_MOVES, SELF_KO_MOVES, typesOf } from './team-battle-gen9-moves';
import { applySynchronize } from './team-battle-gen9-abilities';
import { forceEatBerry } from './team-battle-items';
import { applyIceFaceStats } from './team-battle-forms';

// Accuracy stage multiplier: stage 0 = 1.0, each +1 gives 4/3 ratio, each -1 gives 3/4 ratio
export function getAccuracyMultiplier(netStage: number): number {
  const clamped = Math.max(-6, Math.min(6, netStage));
  if (clamped >= 0) return (3 + clamped) / 3;
  return 3 / (3 + Math.abs(clamped));
}

/** King's Shield / Spiky Shield / Baneful Bunker / Burning Bulwark / Silk Trap punish contact. */
export function applyProtectContactEffects(state: BattleState, attacker: BattlePokemon, defender: BattlePokemon, contact: boolean): void {
  const kind = defender.volatile.protect?.kind;
  if (!contact || !kind || attacker.currentHp <= 0) return;
  const types = typesOf(attacker);
  switch (kind) {
    case 'kings-shield':
    case 'king-s-shield':
      changeStatStage(state, attacker, 'attack', -1, { source: defender });
      break;
    case 'silk-trap':
      changeStatStage(state, attacker, 'speed', -1, { source: defender });
      break;
    case 'spiky-shield': {
      if (abilityOf(attacker) === 'magic-guard') break;
      attacker.currentHp = Math.max(0, attacker.currentHp - Math.floor(attacker.maxHp / 8));
      state.battleLog.push({ type: 'status_damage', message: `${attacker.pokemon.name} was hurt!`, pokemon: attacker.pokemon.name });
      if (attacker.currentHp <= 0) state.battleLog.push({ type: 'pokemon_fainted', message: `${attacker.pokemon.name} fainted!`, pokemon: attacker.pokemon.name });
      break;
    }
    case 'baneful-bunker':
      if (!attacker.status && !types.includes('poison') && !types.includes('steel')) {
        applyStatus(attacker, 'poisoned');
        state.battleLog.push({ type: 'status_applied', message: `${attacker.pokemon.name} was poisoned!`, pokemon: attacker.pokemon.name, status: 'POISONED' });
      }
      break;
    case 'burning-bulwark':
      if (!attacker.status && !types.includes('fire')) {
        applyStatus(attacker, 'burned');
        state.battleLog.push({ type: 'status_applied', message: `${attacker.pokemon.name} was burned!`, pokemon: attacker.pokemon.name, status: 'BURNED' });
      }
      break;
    default:
      break;
  }
}

/** Fling: some thrown items affect the target. */
export function applyFlungItem(state: BattleState, attacker: BattlePokemon, defender: BattlePokemon, item: string): void {
  const types = typesOf(defender);
  const inflict = (status: NonNullable<BattlePokemon['status']>, label: string, immune: string[]) => {
    if (defender.status || immune.some((t) => types.includes(t))) return;
    applyStatus(defender, status);
    state.battleLog.push({ type: 'status_applied', message: `${defender.pokemon.name} was ${label}!`, pokemon: defender.pokemon.name, status: status.toUpperCase() });
  };
  if (item === 'flame-orb') inflict('burned', 'burned', ['fire']);
  else if (item === 'toxic-orb') inflict('badly-poisoned', 'badly poisoned', ['poison', 'steel']);
  else if (item === 'poison-barb') inflict('poisoned', 'poisoned', ['poison', 'steel']);
  else if (item === 'light-ball') inflict('paralyzed', 'paralyzed', ['electric']);
  else if (item === 'kings-rock' || item === 'razor-fang') defender.volatile.flinched = true;
  else if (item === 'white-herb') {
    for (const k of Object.keys(defender.statModifiers) as Array<keyof BattlePokemon['statModifiers']>) {
      if (defender.statModifiers[k] < 0) defender.statModifiers[k] = 0;
    }
  } else if (item === 'mental-herb') {
    defender.volatile.taunt = undefined;
    defender.volatile.encore = undefined;
    defender.volatile.disable = undefined;
    defender.volatile.torment = undefined;
    defender.volatile.infatuated = undefined;
  } else if (item.endsWith('-berry')) {
    forceEatBerry(state, defender, item);
  }
  void attacker;
}

/** Remember that the user's move failed / missed (Stomping Tantrum, Temper Flare) and break streaks. */
export function markMoveFailed(attacker: BattlePokemon): void {
  attacker.volatile.lastMoveFailed = true;
  attacker.volatile.rollout = undefined;
  attacker.volatile.furyCutter = undefined;
}

/** High Jump Kick, Jump Kick, Axe Kick, Supercell Slam: 1/2 max HP crash damage on a miss or failure. */
export function applyCrashDamage(state: BattleState, attacker: BattlePokemon, moveLower: string): void {
  if (!CRASH_MOVES.has(moveLower) || attacker.currentHp <= 0 || abilityOf(attacker) === 'magic-guard') return;
  attacker.currentHp = Math.max(0, attacker.currentHp - Math.floor(attacker.maxHp / 2));
  state.battleLog.push({ type: 'status_damage', message: `${attacker.pokemon.name} kept going and crashed!`, pokemon: attacker.pokemon.name });
  if (attacker.currentHp <= 0) {
    state.battleLog.push({ type: 'pokemon_fainted', message: `${attacker.pokemon.name} fainted!`, pokemon: attacker.pokemon.name });
  }
}

/**
 * After a move ran (hit or miss): self-KO moves, Steel Beam / Chloroblast HP cost, Rollout / Fury Cutter
 * streaks, Beak Blast ending, and "last move this turn" for the Fusion moves.
 */
export function finishMove(state: BattleState, attacker: BattlePokemon, moveLower: string, damageDealt: number): void {
  attacker.volatile.beakBlast = undefined;
  state.lastMoveThisTurn = moveLower;
  const faint = (why?: string) => {
    if (attacker.currentHp <= 0) return;
    attacker.currentHp = 0;
    if (why) state.battleLog.push({ type: 'status_damage', message: why, pokemon: attacker.pokemon.name });
    state.battleLog.push({ type: 'pokemon_fainted', message: `${attacker.pokemon.name} fainted!`, pokemon: attacker.pokemon.name });
  };
  if (SELF_KO_MOVES.has(moveLower)) faint();
  if (attacker.currentHp > 0 && HALF_HP_COST_MOVES.has(moveLower) && (moveLower === 'steel-beam' || damageDealt > 0)
      && abilityOf(attacker) !== 'magic-guard') {
    attacker.currentHp = Math.max(0, attacker.currentHp - Math.ceil(attacker.maxHp / 2));
    state.battleLog.push({ type: 'status_damage', message: `${attacker.pokemon.name} lost some of its HP!`, pokemon: attacker.pokemon.name });
    if (attacker.currentHp <= 0) {
      state.battleLog.push({ type: 'pokemon_fainted', message: `${attacker.pokemon.name} fainted!`, pokemon: attacker.pokemon.name });
    }
  }
  if (moveLower === 'rollout' && damageDealt > 0) {
    const count = (attacker.volatile.rollout?.count ?? 0) + 1;
    attacker.volatile.rollout = count >= 5 ? undefined : { count };
  } else if (moveLower !== 'rollout') {
    attacker.volatile.rollout = undefined;
  }
  attacker.volatile.furyCutter = moveLower === 'fury-cutter' && damageDealt > 0 ? (attacker.volatile.furyCutter ?? 0) + 1 : undefined;
}

// Determine hit count for multi-hit moves
export function determineHitCount(move: any, attacker: BattlePokemon, rng: BattleRng): number {
  // Check if move is multi-hit
  if (!move.hits) return 1;
  
  const minHits = move.hits.min || 1;
  const maxHits = move.hits.max || 1;
  
  // Fixed hit count moves (e.g., Double Kick = 2, Triple Kick = 3)
  if (minHits === maxHits) return minHits;
  
  // Skill Link ability always gives max hits
  const ability = attacker.currentAbility?.toLowerCase();
  if (ability === 'skill-link') return maxHits;
  
  // For 2-5 hit moves, use Gen 9 distribution:
  // 35% for 2 hits, 35% for 3 hits, 15% for 4 hits, 15% for 5 hits
  if (minHits === 2 && maxHits === 5) {
    const roll = rngNextFloat(rng);
    if (roll < 0.35) return 2;
    if (roll < 0.70) return 3;
    if (roll < 0.85) return 4;
    return 5;
  }
  
  // Default: random between min and max
  return minHits + rngNextInt(rng, maxHits - minHits + 1);
}

export const AILMENT_TO_STATUS: Record<string, BattlePokemon['status']> = {
  paralysis: 'paralyzed',
  burn: 'burned',
  poison: 'poisoned',
  toxic: 'badly-poisoned',
  sleep: 'asleep',
  freeze: 'frozen',
};

export const STATUS_LABELS: Record<string, string> = {
  paralyzed: 'paralyzed',
  burned: 'burned',
  poisoned: 'poisoned',
  'badly-poisoned': 'badly poisoned',
  asleep: 'fell asleep',
  frozen: 'was frozen solid',
};

export const STAT_ABBR_TO_NAME: Record<string, keyof BattlePokemon['statModifiers']> = {
  atk: 'attack', def: 'defense', spa: 'specialAttack',
  spd: 'specialDefense', spe: 'speed', acc: 'accuracy', eva: 'evasion',
};

export function applyMoveAilment(
  state: BattleState, move: any,
  _attacker: BattlePokemon, defender: BattlePokemon,
  isSecondary = false,
): void {
  if (!move.ailment || move.ailment.kind === 'flinch' || move.ailment.kind === 'none') return;
  // Burning Jealousy (burn) / Alluring Voice (confusion) only affect a target whose stats rose this turn
  const ailmentMove = String(move.name ?? '').toLowerCase();
  if ((ailmentMove === 'burning-jealousy' || ailmentMove === 'alluring-voice') && !defender.volatile.statsRaisedThisTurn) return;

  if (move.ailment.kind === 'confusion') {
    if (defender.volatile.confusion) return;
    // Misty Terrain protects grounded Pokemon from confusion
    if (state.field.terrain?.kind === 'misty' && isGrounded(defender)) {
      return;
    }
    const chance = move.ailment.chance === 0 ? 1 : (move.ailment.chance ?? (isSecondary ? 0 : 100)) / 100;
    if (chance > 0 && !rngRollChance(state.rng, chance)) return;
    defender.volatile.confusion = { turns: 2 + rngNextInt(state.rng, 4) };
    state.battleLog.push({ type: 'status_applied', message: `${defender.pokemon.name} became confused!`, pokemon: defender.pokemon.name, status: 'CONFUSED' });
    return;
  }

  const status = AILMENT_TO_STATUS[move.ailment.kind];
  if (!status || defender.status) return;

  // Terrain blocks certain statuses on grounded Pokemon
  if (terrainPreventsStatus(state.field.terrain?.kind, defender, status)) {
    return;
  }

  // Safeguard blocks non-volatile status (and confusion is handled above)
  if (isSafeguardActive(getTeamForPokemon(state, defender))) {
    return;
  }

  if (isSecondary) {
    const chance = move.ailment.chance === 0 ? 1 : (move.ailment.chance ?? 0) / 100;
    if (!rngRollChance(state.rng, chance)) return;
  } else {
    const chance = move.ailment.chance === 0 ? 1 : (move.ailment.chance ?? 100) / 100;
    if (!rngRollChance(state.rng, chance)) return;
  }

  applyStatus(defender, status, status === 'asleep' ? { rng: state.rng } : undefined);
  const label = STATUS_LABELS[status!] ?? status;
  state.battleLog.push({
    type: 'status_applied',
    message: `${defender.pokemon.name} was ${label}!`,
    pokemon: defender.pokemon.name,
    status: status as string,
  });
  applySynchronize(state, defender, _attacker);
}

export const SELF_STAT_DROP_MOVES = new Set([
  'close-combat', 'superpower', 'overheat', 'draco-meteor', 'leaf-storm',
  'v-create', 'hammer-arm', 'psycho-boost', 'shell-smash', 'fleur-cannon',
  'hyperspace-fury', 'clanging-scales', 'scale-shot', 'make-it-rain', 'armor-cannon', 'headlong-rush', 'spin-out',
  'ice-hammer', 'dragon-ascent', 'hammer-arm',
]);

/** Ailments that are part of a move's main effect rather than a Sheer Force-able secondary. */
export const PRIMARY_AILMENTS = new Set(['none', 'trap', 'unknown']);

/** Damaging moves whose extra effects are "secondary" (Sheer Force boosts them and removes the effects). */
export function hasSheerForceSecondary(move: any, moveLower: string): boolean {
  if (move.category === 'Status' || SELF_STAT_DROP_MOVES.has(moveLower)) return false;
  if (move.ailment?.kind && !PRIMARY_AILMENTS.has(move.ailment.kind)) return true;
  if (typeof move.flinchChance === 'number' && move.flinchChance > 0) return true;
  return Array.isArray(move.statChanges) && move.statChanges.length > 0;
}

/** PokeAPI targets of status moves whose stat changes land on the user. */
export const SELF_TARGETS = new Set(['user', 'users-field', 'user-and-allies', 'user-or-ally', 'ally', 'all-allies']);

export function applyMoveSecondaryStatChanges(
  state: BattleState, move: any,
  attacker: BattlePokemon, defender: BattlePokemon,
  isSecondary = false,
  /** Covert Cloak: skip changes aimed at the defender. */
  defenderShielded = false,
): void {
  if (!move.statChanges || move.statChanges.length === 0) return;
  const selfDrop = SELF_STAT_DROP_MOVES.has(move.name?.toLowerCase?.() ?? '');
  const isStatus = move.category === 'Status';
  const declaredTarget: string | undefined = typeof move.target === 'string' ? move.target : undefined;
  for (const sc of move.statChanges) {
    const chance = (sc.chance ?? 100) / 100;
    if (!rngRollChance(state.rng, chance)) continue;
    let target: BattlePokemon;
    if (selfDrop) target = attacker;
    else if (isStatus && declaredTarget) target = SELF_TARGETS.has(declaredTarget) ? attacker : defender;
    // Damaging moves (and status moves without target metadata): boosts go to the user, drops to the foe
    else target = sc.stages > 0 ? attacker : defender;
    const statName = STAT_ABBR_TO_NAME[sc.stat];
    if (!statName) continue;
    if (defenderShielded && target === defender) continue;
    changeStatStage(state, target, statName, sc.stages, {
      source: attacker,
      // Chance-based riders on attacks fail silently; status moves announce "won't go any higher"
      quietFailure: isSecondary && !isStatus,
    });
  }
}

/** Flinch from PokeAPI `flinchChance` (or an explicit `ailment.kind === 'flinch'` in hand-written move data). */
export function moveFlinchChance(move: any): number {
  if (typeof move?.flinchChance === 'number' && move.flinchChance > 0) return move.flinchChance / 100;
  if (move?.ailment?.kind === 'flinch') {
    const raw = move.ailment.chance ?? 0;
    return raw === 0 ? 1 : raw / 100;
  }
  return 0;
}

export function applyMoveFlinch(state: BattleState, move: any, defender: BattlePokemon): void {
  const chance = moveFlinchChance(move);
  if (chance > 0 && rngRollChance(state.rng, chance)) {
    defender.volatile.flinched = true;
  }
}

export function syncUnburdenAfterItemChange(
  pokemon: BattlePokemon,
  hadItem: boolean,
  hasItem: boolean
): void {
  if (pokemon.currentAbility?.toLowerCase() !== 'unburden') return;
  if (hadItem && !hasItem) {
    pokemon.volatile.unburdenActive = true;
  } else if (hasItem) {
    pokemon.volatile.unburdenActive = undefined;
  }
}

/** Apply absorbed hit to Substitute; returns true if the Substitute took the hit. */
export function absorbHitWithSubstitute(
  state: BattleState,
  defender: BattlePokemon,
  damage: number
): boolean {
  if (!defender.volatile.substitute || damage <= 0) return false;
  const sub = defender.volatile.substitute;
  if (damage >= sub.hp) {
    state.battleLog.push({
      type: 'status_effect',
      message: `${defender.pokemon.name}'s substitute faded!`,
      pokemon: defender.pokemon.name,
    });
    defender.volatile.substitute = undefined;
  } else {
    sub.hp -= damage;
    state.battleLog.push({
      type: 'status_effect',
      message: `${defender.pokemon.name}'s substitute took the hit!`,
      pokemon: defender.pokemon.name,
    });
  }
  return true;
}

/** PokeAPI targets that aim a status move at the foe (or its side), i.e. what Magic Bounce can reflect. */
export const FOE_TARGETS = new Set(['selected-pokemon', 'all-opponents', 'opponents-field', 'random-opponent', 'all-other-pokemon']);
export const HAZARD_MOVES = new Set(['stealth-rock', 'spikes', 'toxic-spikes', 'sticky-web']);
/** Foe-targeting status moves without Showdown's `reflectable` flag. */
export const NON_REFLECTABLE_MOVES = new Set(['trick', 'switcheroo', 'transform', 'sketch', 'mimic', 'curse', 'destiny-bond', 'baton-pass', 'magic-room', 'wonder-room', 'trick-room']);

export function isReflectableStatusMove(move: { category?: string; target?: string }, moveLower: string): boolean {
  if (move.category !== 'Status' || NON_REFLECTABLE_MOVES.has(moveLower)) return false;
  if (typeof move.target === 'string') return FOE_TARGETS.has(move.target);
  return HAZARD_MOVES.has(moveLower) || !SELF_STATUS_MOVES.has(moveLower);
}

/** Items consumed for +1 to a stat when hit by a move of their type. */
export const TYPE_HIT_ITEMS: Record<string, { type: string; stat: keyof BattlePokemon['statModifiers']; label: string }> = {
  'absorb-bulb': { type: 'water', stat: 'specialAttack', label: 'Absorb Bulb' },
  'cell-battery': { type: 'electric', stat: 'attack', label: 'Cell Battery' },
  'snowball': { type: 'ice', stat: 'attack', label: 'Snowball' },
  'luminous-moss': { type: 'water', stat: 'specialDefense', label: 'Luminous Moss' },
};

/** Protean / Libero: the user becomes the move's type before acting (once per entry; not while Terastallized). */
export function applyProtean(state: BattleState, mon: BattlePokemon, moveTypeRaw: string, moveLower: string): void {
  const ability = abilityOf(mon);
  if ((ability !== 'protean' && ability !== 'libero') || mon.volatile.proteanUsed || mon.terastallized) return;
  if (moveLower === 'struggle' || moveLower === RECHARGE_MOVE_ID) return;
  const moveType = moveTypeRaw.toLowerCase();
  const current = getPokemonTypes(mon).map((t) => String(t).toLowerCase());
  mon.volatile.proteanUsed = true;
  if (current.length === 1 && current[0] === moveType) return;
  if (!mon.volatile.typeChange) mon.volatile.typeChange = mon.pokemon.types;
  mon.pokemon = { ...mon.pokemon, types: [{ slot: 1, type: { name: moveType, url: '' } }] as any };
  state.battleLog.push({
    type: 'status_effect',
    message: `${mon.pokemon.name} transformed into the ${moveType.charAt(0).toUpperCase()}${moveType.slice(1)} type!`,
    pokemon: mon.pokemon.name,
  });
}

/**
 * Disguise (any damaging hit) and Ice Face (physical hits) take one hit for the holder.
 * Mold Breaker ignores both. Returns the damage that still reaches HP.
 */
export function applyDisguiseShields(state: BattleState, attacker: BattlePokemon, defender: BattlePokemon, damage: number, category: string): number {
  if (damage <= 0 || defender.currentHp <= 0) return damage;
  const ability = targetAbility(attacker, defender);
  if (ability === 'disguise' && !defender.disguiseBusted) {
    defender.disguiseBusted = true;
    state.battleLog.push({ type: 'status_effect', message: 'Its disguise served it as a decoy!', pokemon: defender.pokemon.name });
    const chip = Math.max(1, Math.floor(defender.maxHp / 8));
    defender.currentHp = Math.max(0, defender.currentHp - chip);
    state.battleLog.push({ type: 'status_damage', message: `${defender.pokemon.name}'s disguise was busted!`, pokemon: defender.pokemon.name });
    return 0;
  }
  if (ability === 'ice-face' && category === 'Physical' && !defender.iceFaceBroken) {
    defender.iceFaceBroken = true;
    applyIceFaceStats(defender, 'noice');
    state.battleLog.push({ type: 'status_effect', message: `${defender.pokemon.name}'s Ice Face took the hit!`, pokemon: defender.pokemon.name });
    state.battleLog.push({ type: 'status_effect', message: `${defender.pokemon.name} transformed into Noice Face!`, pokemon: defender.pokemon.name });
    return 0;
  }
  return damage;
}

export function tryAbilityAbsorb(
  state: BattleState,
  attacker: BattlePokemon,
  defender: BattlePokemon,
  moveTypeRaw: string,
  moveCategory: string,
): boolean {
  const ability = targetAbility(attacker, defender);
  if (!ability) return false;
  const moveType = moveTypeRaw.toLowerCase();

  const healQuarter = () => {
    const heal = Math.floor(defender.maxHp / 4);
    if (heal > 0 && defender.currentHp < defender.maxHp) {
      defender.currentHp = Math.min(defender.maxHp, defender.currentHp + heal);
      state.battleLog.push({
        type: 'healing',
        message: `${defender.pokemon.name} restored HP with ${ability}!`,
        pokemon: defender.pokemon.name,
        healing: Math.round((heal / defender.maxHp) * 100),
      });
    } else {
      state.battleLog.push({
        type: 'status_effect',
        message: `${defender.pokemon.name}'s ${ability} made it immune!`,
        pokemon: defender.pokemon.name,
      });
    }
  };

  const boostStat = (key: 'attack' | 'specialAttack' | 'speed') => {
    changeStatStage(state, defender, key, 1, { reason: `thanks to its ${ability}` });
  };

  if (ability === 'flash-fire' && moveType === 'fire') {
    defender.volatile.flashFireActive = true;
    state.battleLog.push({
      type: 'status_effect',
      message: `${defender.pokemon.name}'s Flash Fire raised its Fire power!`,
      pokemon: defender.pokemon.name,
    });
    return true;
  }
  if (ability === 'volt-absorb' && moveType === 'electric') {
    healQuarter();
    return true;
  }
  if (ability === 'water-absorb' && moveType === 'water') {
    healQuarter();
    return true;
  }
  if (ability === 'storm-drain' && moveType === 'water') {
    boostStat('specialAttack');
    return true;
  }
  if (ability === 'lightning-rod' && moveType === 'electric') {
    boostStat('specialAttack');
    return true;
  }
  if (ability === 'sap-sipper' && moveType === 'grass') {
    boostStat('attack');
    return true;
  }
  if (ability === 'motor-drive' && moveType === 'electric') {
    boostStat('speed');
    return true;
  }
  if (ability === 'levitate' && moveType === 'ground' && !defender.volatile.gravityGrounded) {
    state.battleLog.push({
      type: 'status_effect',
      message: `${defender.pokemon.name} is immune via Levitate!`,
      pokemon: defender.pokemon.name,
    });
    return true;
  }
  if (ability === 'wonder-guard' && moveCategory !== 'Status') {
    const atkType = (moveType.charAt(0).toUpperCase() + moveType.slice(1)) as TypeName;
    const defTypes = getPokemonTypes(defender).map((t) => {
      const s = String(t);
      return (s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()) as TypeName;
    });
    const effectiveness = calculateTypeEffectiveness(atkType, defTypes);
    if (effectiveness <= 1) {
      state.battleLog.push({
        type: 'status_effect',
        message: `${defender.pokemon.name}'s Wonder Guard blocked the attack!`,
        pokemon: defender.pokemon.name,
      });
      return true;
    }
  }
  return false;
}

export function applyBeastBoost(attacker: BattlePokemon, state: BattleState): void {
  const findBase = (name: string): number => {
    const stats = attacker.pokemon.stats;
    if (!Array.isArray(stats)) return 50;
    const found = stats.find((s: any) => (s.stat?.name || s.name) === name);
    return found?.base_stat ?? 50;
  };
  const stageMult = (stage: number) => {
    const clamped = Math.max(-6, Math.min(6, stage));
    return clamped >= 0 ? (2 + clamped) / 2 : 2 / (2 - clamped);
  };
  const candidates: Array<{
    key: 'attack' | 'defense' | 'specialAttack' | 'specialDefense' | 'speed';
    value: number;
    label: string;
  }> = [
    { key: 'attack', value: findBase('attack') * stageMult(attacker.statModifiers.attack), label: 'Attack' },
    { key: 'defense', value: findBase('defense') * stageMult(attacker.statModifiers.defense), label: 'Defense' },
    { key: 'specialAttack', value: findBase('special-attack') * stageMult(attacker.statModifiers.specialAttack), label: 'Special Attack' },
    { key: 'specialDefense', value: findBase('special-defense') * stageMult(attacker.statModifiers.specialDefense), label: 'Special Defense' },
    { key: 'speed', value: findBase('speed') * stageMult(attacker.statModifiers.speed), label: 'Speed' },
  ];
  let best = candidates[0];
  for (const c of candidates) {
    if (c.value > best.value) best = c;
  }
  changeStatStage(state, attacker, best.key, 1, { reason: 'thanks to Beast Boost', quietFailure: true });
}
