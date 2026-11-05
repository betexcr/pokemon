// Effort values (EVs) and the main-series stat formulas. IVs are fixed at 31.
// A team slot may carry an EV spread; the engine uses it with the slot's nature for every stat.

import { getNature, type NatureName } from '@/data/natures';

export const EV_STATS = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'] as const;
export type EvStat = (typeof EV_STATS)[number];
export type EvSpread = Partial<Record<EvStat, number>>;

export const MAX_EVS_PER_STAT = 252;
export const MAX_EVS_TOTAL = 510;
export const IV = 31;

export const EV_STAT_LABEL: Record<EvStat, string> = {
  hp: 'HP',
  attack: 'Atk',
  defense: 'Def',
  'special-attack': 'SpA',
  'special-defense': 'SpD',
  speed: 'Spe',
};

export function evTotal(evs: EvSpread | undefined): number {
  return EV_STATS.reduce((sum, s) => sum + (evs?.[s] ?? 0), 0);
}

/**
 * Clamp a raw spread to legal values: whole numbers 0-252 per stat and 510 in total (later stats are
 * trimmed first when over). Returns undefined when nothing is invested, so empty spreads are not stored.
 */
export function sanitizeEvs(raw: unknown): EvSpread | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const src = raw as Record<string, unknown>;
  const out: EvSpread = {};
  let remaining = MAX_EVS_TOTAL;
  for (const stat of EV_STATS) {
    const n = Number(src[stat]);
    if (!Number.isFinite(n) || n <= 0) continue;
    const value = Math.min(MAX_EVS_PER_STAT, Math.floor(n), remaining);
    if (value > 0) {
      out[stat] = value;
      remaining -= value;
    }
  }
  return Object.keys(out).length ? out : undefined;
}

/** Nature multiplier for a stat (1.1 / 0.9 / 1). HP is never affected. */
export function natureMultiplier(nature: string | undefined, stat: EvStat): number {
  if (!nature || stat === 'hp') return 1;
  const n = getNature(nature as NatureName);
  if (n.increasedStat === stat) return 1.1;
  if (n.decreasedStat === stat) return 0.9;
  return 1;
}

/** Max HP: floor((2B + IV + EV/4) * L / 100) + L + 10. Shedinja (base 1) always has 1 HP. */
export function hpFromBase(base: number, level: number, ev = 0): number {
  if (base === 1) return 1;
  return Math.floor(((2 * base + IV + Math.floor(ev / 4)) * level) / 100) + level + 10;
}

/** Other stats: floor((floor((2B + IV + EV/4) * L / 100) + 5) * nature). */
export function otherStatFromBase(base: number, level: number, ev = 0, natureMult = 1): number {
  return Math.floor((Math.floor(((2 * base + IV + Math.floor(ev / 4)) * level) / 100) + 5) * natureMult);
}

/** Max HP for a species stat list (PokeAPI shape) with an optional EV spread. */
export function maxHpFor(stats: Array<{ base_stat?: number; stat?: { name?: string }; name?: string }> | undefined, level: number, evs?: EvSpread): number {
  const base = stats?.find((s) => (s.stat?.name || s.name) === 'hp')?.base_stat ?? 50;
  return hpFromBase(base, level, evs?.hp ?? 0);
}
