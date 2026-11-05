// Terastallization (Gen 9): once per battle per side, a Pokémon becomes its Tera Type.
// - Defensive typing becomes the Tera Type alone (the engine swaps `pokemon.pokemon.types`).
// - It keeps STAB on its original types and gains STAB on the Tera Type; a Tera Type that matches an
//   original type gets 2x STAB (2.25x with Adaptability).
// - Tera-type moves below 60 base power are raised to 60 (not multi-hit or priority moves).
// The change lasts for the rest of the battle, including after switching out.

import type { BattlePokemon, BattleState, BattleTeam } from './team-battle-engine';

export const TERA_TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground',
  'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
] as const;
export type TeraType = (typeof TERA_TYPES)[number];

export function isTeraType(value: unknown): value is TeraType {
  return typeof value === 'string' && (TERA_TYPES as readonly string[]).includes(value.toLowerCase());
}

type TypeEntry = string | { type?: { name?: string }; name?: string };
const typeName = (t: TypeEntry): string =>
  String(typeof t === 'string' ? t : t?.type?.name ?? t?.name ?? '').toLowerCase();

/** A slot's chosen Tera Type if valid, else the species' primary type. */
export function resolveTeraType(chosen: unknown, types: TypeEntry[] | undefined): TeraType | undefined {
  if (isTeraType(chosen)) return chosen.toLowerCase() as TeraType;
  const primary = (types ?? []).map(typeName).find(isTeraType);
  return primary as TeraType | undefined;
}

function originalTypeNames(pokemon: BattlePokemon): string[] {
  const src = (pokemon.originalTypes ?? pokemon.pokemon.types) as TypeEntry[];
  return (src ?? []).map(typeName).filter(Boolean);
}

/** Why this side cannot Terastallize right now, or null when it can. */
export function teraBlockedReason(state: Pick<BattleState, 'featureFlags'>, team: BattleTeam): string | null {
  if (state.featureFlags?.teraEnabled === false) return 'tera_disabled';
  if (team.teraUsed) return 'tera_already_used';
  const active = team.pokemon[team.currentIndex];
  if (!active || active.currentHp <= 0) return 'no_active';
  if (active.terastallized) return 'tera_already_used';
  if (!isTeraType(active.teraType)) return 'no_tera_type';
  return null;
}

export function canTerastallize(state: Pick<BattleState, 'featureFlags'>, team: BattleTeam): boolean {
  return teraBlockedReason(state, team) === null;
}

/** Terastallize `side`'s active Pokémon. Returns false when not allowed. */
export function terastallize(state: BattleState, side: 'player' | 'opponent'): boolean {
  const team = side === 'player' ? state.player : state.opponent;
  if (!canTerastallize(state, team)) return false;
  const mon = team.pokemon[team.currentIndex];
  const tera = mon.teraType!.toLowerCase();
  mon.originalTypes = mon.originalTypes ?? mon.pokemon.types;
  mon.pokemon = { ...mon.pokemon, types: [{ slot: 1, type: { name: tera, url: '' } }] as any };
  mon.terastallized = true;
  team.teraUsed = true;
  state.battleLog.push({
    type: 'status_effect',
    message: `${mon.pokemon.name} terastallized into the ${tera.charAt(0).toUpperCase()}${tera.slice(1)} type!`,
    pokemon: mon.pokemon.name,
  });
  return true;
}

/** Types that give this attacker STAB: its original types plus, once Terastallized, the Tera Type. */
export function stabTypeNames(pokemon: BattlePokemon): string[] {
  const types = originalTypeNames(pokemon);
  if (pokemon.terastallized && pokemon.teraType) types.push(pokemon.teraType.toLowerCase());
  return Array.from(new Set(types));
}

/** STAB override for a Terastallized attacker using its Tera Type that is also an original type. */
export function teraStabOverride(pokemon: BattlePokemon, moveType: string, hasAdaptability: boolean): number | undefined {
  if (!pokemon.terastallized || !pokemon.teraType) return undefined;
  const mt = moveType.toLowerCase();
  if (mt !== pokemon.teraType.toLowerCase()) return undefined;
  if (!originalTypeNames(pokemon).includes(mt)) return undefined;
  return hasAdaptability ? 2.25 : 2;
}

/** Tera-type moves under 60 BP hit at 60 (multi-hit and priority moves excluded). */
export function teraPowerFloor(
  pokemon: BattlePokemon,
  moveType: string,
  power: number,
  move: { hits?: unknown; priority?: number },
): number {
  if (!pokemon.terastallized || !pokemon.teraType) return power;
  if (moveType.toLowerCase() !== pokemon.teraType.toLowerCase()) return power;
  if (power <= 0 || power >= 60 || move.hits || (move.priority ?? 0) > 0) return power;
  return 60;
}
