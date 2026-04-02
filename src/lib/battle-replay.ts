import type { BattleAction, BattleState } from './team-battle-engine';
import type { BattleRng } from './battle-rng';

export type ReplayArtifact = {
  turn: number;
  p1Action: BattleAction;
  p2Action: BattleAction;
  rngBefore: BattleRng;
  rngAfter: BattleRng;
  stateHashAfter: string;
};

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a.localeCompare(b)
    );
    const out: Record<string, unknown> = {};
    for (const [k, v] of entries) out[k] = sortValue(v);
    return out;
  }
  return value;
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

/** Small deterministic hash for replay equivalence checks. */
export function hashBattleState(state: BattleState): string {
  const raw = stableStringify(state);
  let h = 2166136261 >>> 0; // FNV-1a
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}
