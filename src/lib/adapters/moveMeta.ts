import type { RuntimeMove } from '@/types/move';

/**
 * PokeAPI encodes healing drain as positive `drain` (e.g. 50 = 50% heal)
 * and recoil as negative `drain` (e.g. -33 = 33% recoil). A separate `recoil`
 * field is usually absent on modern move endpoints.
 */
export function parseRecoilDrain(meta: unknown): {
  recoil?: RuntimeMove['recoil'];
  drain?: RuntimeMove['drain'];
} {
  const out: { recoil?: RuntimeMove['recoil']; drain?: RuntimeMove['drain'] } = {};
  const metaObj = meta as { recoil?: number; drain?: number };
  const drain = metaObj?.drain;
  if (typeof drain === 'number' && drain !== 0) {
    if (drain > 0) {
      out.drain = { fraction: drain / 100 };
    } else {
      out.recoil = { fraction: Math.abs(drain) / 100 };
    }
  }
  if (typeof metaObj?.recoil === 'number' && metaObj.recoil !== 0) {
    out.recoil = { fraction: Math.abs(metaObj.recoil) / 100 };
  }
  return out;
}

/**
 * Hit counts live under `meta.min_hits` / `meta.max_hits` in PokeAPI
 * (top-level fields are usually null). Fall back to top-level if present.
 */
export function parseHits(move: unknown): RuntimeMove['hits'] {
  const moveObj = move as {
    min_hits?: number | null;
    max_hits?: number | null;
    meta?: { min_hits?: number | null; max_hits?: number | null } | null;
  };
  const min =
    (typeof moveObj.meta?.min_hits === 'number' ? moveObj.meta.min_hits : undefined) ??
    (typeof moveObj.min_hits === 'number' ? moveObj.min_hits : undefined);
  const max =
    (typeof moveObj.meta?.max_hits === 'number' ? moveObj.meta.max_hits : undefined) ??
    (typeof moveObj.max_hits === 'number' ? moveObj.max_hits : undefined);
  if (typeof min === 'number' && typeof max === 'number' && min > 0 && max > 0) {
    return { min, max };
  }
  return null;
}
