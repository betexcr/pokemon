/**
 * Pure helpers for the live damage path (`executeMoveAction` → `calculateComprehensiveDamage`).
 * Behavior must match the previous inline prep in team-battle-engine-additional.ts.
 */
import type { BattlePokemon } from './team-battle-engine';
import type { TypeName } from './damage-calculator';
import type { BattleRng } from './battle-rng';
import { rngRollChance } from './battle-rng';
import {
  CRIT_STAGE_RATES,
  GUTS_ACTIVE_STATUSES,
  TYPE_BOOST_ITEMS,
} from './battle-move-constants';

export type DamageWeather = 'None' | 'Rain' | 'Sun' | 'Sandstorm' | 'Hail';
export type DamageTerrain = 'None' | 'Electric' | 'Grassy' | 'Psychic' | 'Misty';

export function toDamageTypeName(raw: string): TypeName {
  if (!raw) return 'Normal';
  const lower = raw.toLowerCase();
  return (lower.charAt(0).toUpperCase() + lower.slice(1)) as TypeName;
}

export function fieldWeatherToDamageWeather(kind?: string | null): DamageWeather {
  switch (kind) {
    case 'rain':
      return 'Rain';
    case 'sun':
      return 'Sun';
    case 'sandstorm':
      return 'Sandstorm';
    case 'snow':
      return 'Hail';
    default:
      return 'None';
  }
}

export function fieldTerrainToDamageTerrain(kind?: string | null): DamageTerrain {
  switch (kind) {
    case 'electric':
      return 'Electric';
    case 'grassy':
      return 'Grassy';
    case 'psychic':
      return 'Psychic';
    case 'misty':
      return 'Misty';
    default:
      return 'None';
  }
}

/** Dynamic BP hooks (Knock Off / Facade / Hex / Acrobatics) + Technician + Flash Fire. */
export function applyDynamicBasePower(params: {
  basePower: number;
  moveId: string;
  moveType: string;
  attacker: BattlePokemon;
  defender: BattlePokemon;
}): number {
  const { attacker, defender } = params;
  const moveLower = params.moveId.toLowerCase();
  let power = params.basePower || 0;

  if (moveLower === 'knock-off' && defender.heldItem) {
    power = Math.floor(power * 1.5);
  }
  if (moveLower === 'facade' && attacker.status) {
    power = Math.floor(power * 2);
  }
  if (moveLower === 'hex' && defender.status) {
    power = Math.floor(power * 2);
  }
  if (moveLower === 'acrobatics' && !attacker.heldItem) {
    power = Math.floor(power * 2);
  }

  const attackerAbility = attacker.currentAbility?.toLowerCase();
  if (attackerAbility === 'technician' && power > 0 && power <= 60) {
    power = Math.floor(power * 1.5);
  }
  if (attacker.volatile.flashFireActive && params.moveType.toLowerCase() === 'fire') {
    power = Math.floor(power * 1.5);
  }

  return power;
}

export function attackerHasGuts(attacker: BattlePokemon): boolean {
  const ability = attacker.currentAbility?.toLowerCase();
  return (
    ability === 'guts' &&
    attacker.status != null &&
    (GUTS_ACTIVE_STATUSES as readonly string[]).includes(attacker.status)
  );
}

/** Choice items, Assault Vest, Eviolite, Fur Coat, Ice Scales, type-boost items. */
export function computeAttackDefensePowerMultipliers(params: {
  isPhysical: boolean;
  moveType: string;
  attacker: BattlePokemon;
  defender: BattlePokemon;
}): { attackMultiplier: number; defenseMultiplier: number; powerMultiplier: number } {
  const { isPhysical, attacker, defender } = params;
  const attackerItem = attacker.heldItem?.toLowerCase();
  const defenderItem = defender.heldItem?.toLowerCase();
  const defenderAbility = defender.currentAbility?.toLowerCase();

  let attackMultiplier = 1;
  let defenseMultiplier = 1;
  let powerMultiplier = 1;

  if (attackerItem === 'choice-band' && isPhysical) attackMultiplier *= 1.5;
  if (attackerItem === 'choice-specs' && !isPhysical) attackMultiplier *= 1.5;
  if (defenderItem === 'assault-vest' && !isPhysical) defenseMultiplier *= 1.5;
  if (defenderItem === 'eviolite') defenseMultiplier *= 1.5;
  if (defenderAbility === 'fur-coat' && isPhysical) defenseMultiplier *= 2;
  if (defenderAbility === 'ice-scales' && !isPhysical) defenseMultiplier *= 2;

  const moveTypeLower = params.moveType.toLowerCase();
  if (attackerItem && TYPE_BOOST_ITEMS[attackerItem] === moveTypeLower) {
    powerMultiplier *= 1.2;
  }

  return { attackMultiplier, defenseMultiplier, powerMultiplier };
}

export function resolveCritAndStatStages(params: {
  rng: BattleRng;
  isPhysical: boolean;
  critRateStage: number;
  attacker: BattlePokemon;
  defender: BattlePokemon;
}): {
  isCrit: boolean;
  attackStatStages: number;
  defenseStatStages: number;
  cannotCrit: boolean;
} {
  const { attacker, defender, isPhysical, rng } = params;
  const attackerAbility = attacker.currentAbility?.toLowerCase();
  const defenderAbility = defender.currentAbility?.toLowerCase();
  const unawareAtk = attackerAbility === 'unaware';
  const unawareDef = defenderAbility === 'unaware';
  const cannotCrit =
    defenderAbility === 'battle-armor' || defenderAbility === 'shell-armor';

  const critStage = Math.max(0, params.critRateStage || 0);
  const rate = CRIT_STAGE_RATES[Math.min(critStage, CRIT_STAGE_RATES.length - 1)];
  const isCrit = cannotCrit ? false : rngRollChance(rng, rate);

  const atkStage = isPhysical
    ? attacker.statModifiers.attack
    : attacker.statModifiers.specialAttack;
  const defStage = isPhysical
    ? defender.statModifiers.defense
    : defender.statModifiers.specialDefense;

  const attackStatStages =
    unawareDef && !isCrit ? 0 : isCrit ? Math.max(0, atkStage) : atkStage;
  const defenseStatStages =
    unawareAtk && !isCrit ? 0 : isCrit ? Math.min(0, defStage) : defStage;

  return { isCrit, attackStatStages, defenseStatStages, cannotCrit };
}

export type LiveDamagePrep = {
  movePower: number;
  moveType: TypeName;
  weather: DamageWeather;
  terrain: DamageTerrain;
  isPhysical: boolean;
  hasGuts: boolean;
  attackMultiplier: number;
  defenseMultiplier: number;
  powerMultiplier: number;
  attackStatStages: number;
  defenseStatStages: number;
  isCrit: boolean;
  cannotCrit: boolean;
  attackerAbility?: string;
  defenderAbility?: string;
  attackerItem?: string;
};

/** Assemble live-path modifiers for one hit (matches executeMoveAction behavior). */
export function prepareLiveDamageModifiers(params: {
  rng: BattleRng;
  move: { power?: number | null; type?: string; category?: string; critRateStage?: number };
  moveId: string;
  weatherKind?: string | null;
  terrainKind?: string | null;
  attacker: BattlePokemon;
  defender: BattlePokemon;
}): LiveDamagePrep {
  const { attacker, defender, move, moveId, rng } = params;
  const isPhysical = move.category === 'Physical';
  const moveTypeRaw = String(move.type || 'normal');
  const movePower = applyDynamicBasePower({
    basePower: move.power || 0,
    moveId,
    moveType: moveTypeRaw,
    attacker,
    defender,
  });
  const multis = computeAttackDefensePowerMultipliers({
    isPhysical,
    moveType: moveTypeRaw,
    attacker,
    defender,
  });
  const crit = resolveCritAndStatStages({
    rng,
    isPhysical,
    critRateStage: typeof move.critRateStage === 'number' ? move.critRateStage : 0,
    attacker,
    defender,
  });

  return {
    movePower,
    moveType: toDamageTypeName(moveTypeRaw),
    weather: fieldWeatherToDamageWeather(params.weatherKind),
    terrain: fieldTerrainToDamageTerrain(params.terrainKind),
    isPhysical,
    hasGuts: attackerHasGuts(attacker),
    ...multis,
    attackStatStages: crit.attackStatStages,
    defenseStatStages: crit.defenseStatStages,
    isCrit: crit.isCrit,
    cannotCrit: crit.cannotCrit,
    attackerAbility: attacker.currentAbility?.toLowerCase(),
    defenderAbility: defender.currentAbility?.toLowerCase(),
    attackerItem: attacker.heldItem?.toLowerCase(),
  };
}
