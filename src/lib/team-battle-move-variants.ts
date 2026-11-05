// Moves whose type, power or accuracy depend on the field or on levels.

import type { BattlePokemon } from './team-battle-engine';

type WeatherKind = 'sun' | 'rain' | 'sandstorm' | 'snow' | string | undefined;
type TerrainKind = 'electric' | 'grassy' | 'misty' | 'psychic' | string | undefined;

/** Weather Ball: 100 BP and the weather's type while weather is up. */
export function weatherBallVariant(weather: WeatherKind): { type: string; power: number } | null {
  switch (weather) {
    case 'sun': return { type: 'Fire', power: 100 };
    case 'rain': return { type: 'Water', power: 100 };
    case 'sandstorm': return { type: 'Rock', power: 100 };
    case 'snow': return { type: 'Ice', power: 100 };
    default: return null;
  }
}

/** Terrain Pulse: 100 BP and the terrain's type while the user is on terrain. */
export function terrainPulseVariant(terrain: TerrainKind, userGrounded: boolean): { type: string; power: number } | null {
  if (!userGrounded) return null;
  switch (terrain) {
    case 'electric': return { type: 'Electric', power: 100 };
    case 'grassy': return { type: 'Grass', power: 100 };
    case 'misty': return { type: 'Fairy', power: 100 };
    case 'psychic': return { type: 'Psychic', power: 100 };
    default: return null;
  }
}

export const OHKO_MOVES = new Set(['fissure', 'guillotine', 'horn-drill', 'sheer-cold']);

const typeNames = (p: BattlePokemon) =>
  (p.pokemon.types ?? []).map((t: any) => String(typeof t === 'string' ? t : t?.type?.name ?? '').toLowerCase());

/** Failure message for a one-hit KO move, or null if it may roll to hit. */
export function ohkoFailure(user: BattlePokemon, target: BattlePokemon, moveId: string, targetAbility: string | undefined): string | null {
  if (target.level > user.level) return 'But it failed!';
  if (moveId === 'sheer-cold' && typeNames(target).includes('ice')) return `It doesn't affect ${target.pokemon.name}...`;
  if (targetAbility === 'sturdy') return `${target.pokemon.name} is protected by Sturdy!`;
  return null;
}

/** OHKO hit chance: 30% + level gap (Sheer Cold from a non-Ice user starts at 20%); ignores stat stages. */
export function ohkoHitChance(user: BattlePokemon, target: BattlePokemon, moveId: string): number {
  const baseAcc = moveId === 'sheer-cold' && !typeNames(user).includes('ice') ? 20 : 30;
  return Math.min(1, Math.max(0, (baseAcc + user.level - target.level) / 100));
}
