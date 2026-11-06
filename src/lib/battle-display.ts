import type { BattleConditions } from './battle-conditions';

// Names, icons and short explanations for status conditions, weather and terrain. Shared by the
// battle guide and the battle screens (offline and multiplayer) so they always show the same symbols.

export type StatusInfo = { key: string; name: string; icon: string; effect: string };

export const STATUS_CONDITIONS: StatusInfo[] = [
  { key: 'burn', name: 'Burn', icon: '🔥', effect: 'Halves physical attack. Deals 1/16 max HP damage each turn. Fire-types are immune.' },
  { key: 'paralysis', name: 'Paralysis', icon: '⚡', effect: 'Halves speed. 25% chance of being unable to move each turn. Electric-types are immune.' },
  { key: 'poison', name: 'Poison', icon: '☠️', effect: 'Deals 1/8 max HP damage each turn. Poison and Steel-types are immune.' },
  { key: 'badly-poisoned', name: 'Badly Poisoned', icon: '💀', effect: 'Damage increases each turn (1/16, 2/16, 3/16...). Resets on switch. Poison and Steel-types are immune.' },
  { key: 'sleep', name: 'Sleep', icon: '💤', effect: 'Cannot move for 1-3 turns. Some moves (Sleep Talk, Snore) can still be used.' },
  { key: 'freeze', name: 'Freeze', icon: '❄️', effect: 'Cannot move. 20% chance to thaw each turn. Fire moves and Scald thaw the user. Ice-types are immune.' },
  { key: 'confusion', name: 'Confusion', icon: '💫', effect: 'Volatile condition (1-4 turns). 33% chance to hit self for 40 base power typeless physical damage.' },
];

const STATUS_BY_KEY = new Map(STATUS_CONDITIONS.map((s) => [s.key, s]));

// Engine values (offline / server state) and multiplayer public codes → status key
const STATUS_ALIASES: Record<string, string> = {
  burned: 'burn', burn: 'burn', brn: 'burn',
  paralyzed: 'paralysis', paralysis: 'paralysis', par: 'paralysis',
  poisoned: 'poison', poison: 'poison', psn: 'poison',
  'badly-poisoned': 'badly-poisoned', toxic: 'badly-poisoned', tox: 'badly-poisoned',
  asleep: 'sleep', sleep: 'sleep', slp: 'sleep',
  frozen: 'freeze', freeze: 'freeze', frz: 'freeze',
  confused: 'confusion', confusion: 'confusion',
};

/** Display info for a status value in any of the formats the battle state uses, or null for none. */
export function statusInfo(status: string | null | undefined): StatusInfo | null {
  if (!status) return null;
  const key = STATUS_ALIASES[String(status).toLowerCase()];
  return key ? STATUS_BY_KEY.get(key) ?? null : null;
}

export type FieldEffectInfo = { kind: string; name: string; icon: string; effect: string };

export const WEATHER_INFO: FieldEffectInfo[] = [
  { kind: 'sun', name: 'Harsh sunlight', icon: '☀️', effect: 'Fire moves 1.5x, Water moves 0.5x. Solar Beam charges instantly. Abilities: Drought, Chlorophyll, Solar Power.' },
  { kind: 'rain', name: 'Rain', icon: '🌧️', effect: 'Water moves 1.5x, Fire moves 0.5x. Thunder and Hurricane never miss. Abilities: Drizzle, Swift Swim, Rain Dish.' },
  { kind: 'sandstorm', name: 'Sandstorm', icon: '🌪️', effect: 'Rock-types get 1.5x Sp.Def. Deals 1/16 chip to non-Rock/Ground/Steel. Abilities: Sand Stream, Sand Rush.' },
  { kind: 'snow', name: 'Snow', icon: '🌨️', effect: 'Ice-types get 1.5x Defense. Blizzard never misses. Abilities: Snow Warning, Slush Rush, Ice Body.' },
];

export const TERRAIN_INFO: FieldEffectInfo[] = [
  { kind: 'electric', name: 'Electric Terrain', icon: '⚡', effect: 'Grounded Pokemon cannot fall asleep. Electric moves 1.3x for grounded Pokemon.' },
  { kind: 'grassy', name: 'Grassy Terrain', icon: '🌿', effect: 'Grounded Pokemon heal 1/16 HP each turn. Grass moves 1.3x, Earthquake/Bulldoze/Magnitude halved.' },
  { kind: 'psychic', name: 'Psychic Terrain', icon: '🔮', effect: 'Grounded Pokemon are immune to priority moves. Psychic moves 1.3x for grounded Pokemon.' },
  { kind: 'misty', name: 'Misty Terrain', icon: '🌫️', effect: 'Grounded Pokemon cannot be statused or confused. Dragon moves halved on grounded targets.' },
];

export const weatherInfo = (kind: string | null | undefined) => WEATHER_INFO.find((w) => w.kind === kind) ?? null;
export const terrainInfo = (kind: string | null | undefined) => TERRAIN_INFO.find((t) => t.kind === kind) ?? null;

/** Whether a side's active Pokémon is confused (from the public battle conditions). */
export function hasConfusion(conditions: BattleConditions | null | undefined, side: 'p1' | 'p2'): boolean {
  return !!conditions?.[side]?.some((t) => t.id === 'confusion');
}
