// Raw (unboosted) battle stats. Moves like Power Split, Guard Split, Speed Swap and Power Trick
// replace them for as long as the Pokémon stays in (`volatile.statOverrides`).

import type { BattlePokemon } from './team-battle-engine';

export type RawStatName = 'attack' | 'defense' | 'special-attack' | 'special-defense' | 'speed';

export function baseStat(mon: BattlePokemon, name: RawStatName | 'hp'): number {
  return mon.pokemon.stats?.find((s: any) => (s.stat?.name || s.name) === name)?.base_stat || 50;
}

/** Same formula the engine uses for battle stats (31 IVs, no EVs, neutral nature). */
export function statFromBase(base: number, level: number): number {
  return Math.floor(((2 * base + 31) * level) / 100) + 5;
}

/** The Pokémon's raw stat, honouring split / swap overrides. */
export function rawStat(mon: BattlePokemon, name: RawStatName): number {
  const override = mon.volatile?.statOverrides?.[name];
  if (typeof override === 'number') return override;
  return statFromBase(baseStat(mon, name), mon.level);
}

export function stageMultiplier(stage: number): number {
  return stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage);
}
