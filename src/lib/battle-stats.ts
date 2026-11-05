// Raw (unboosted) battle stats: base stat, level, 31 IVs, the slot's EVs and nature. Moves like
// Power Split, Guard Split, Speed Swap and Power Trick replace them while the Pokémon stays in
// (`volatile.statOverrides`).

import type { BattlePokemon } from './team-battle-engine';
import { natureMultiplier, otherStatFromBase } from './battle-evs';

export type RawStatName = 'attack' | 'defense' | 'special-attack' | 'special-defense' | 'speed';

export function baseStat(mon: BattlePokemon, name: RawStatName | 'hp'): number {
  return mon.pokemon.stats?.find((s: any) => (s.stat?.name || s.name) === name)?.base_stat || 50;
}

/** Stat with 31 IVs and no EVs or nature (kept for callers that only know the base stat). */
export function statFromBase(base: number, level: number): number {
  return otherStatFromBase(base, level);
}

/** The Pokémon's raw stat: EVs and nature included, honouring split / swap overrides. */
export function rawStat(mon: BattlePokemon, name: RawStatName): number {
  const override = mon.volatile?.statOverrides?.[name];
  if (typeof override === 'number') return override;
  return otherStatFromBase(baseStat(mon, name), mon.level, mon.evs?.[name] ?? 0, natureMultiplier(mon.nature, name));
}

export function stageMultiplier(stage: number): number {
  return stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage);
}
