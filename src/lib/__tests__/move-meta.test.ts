import { describe, it, expect } from 'vitest';
import { parseHits, parseRecoilDrain } from '../adapters/moveMeta';

describe('parseRecoilDrain', () => {
  it('maps negative PokeAPI drain to recoil (Double-Edge / Flare Blitz)', () => {
    expect(parseRecoilDrain({ drain: -33 })).toEqual({
      recoil: { fraction: 0.33 },
    });
  });

  it('maps Take Down 25% recoil from negative drain', () => {
    expect(parseRecoilDrain({ drain: -25 })).toEqual({
      recoil: { fraction: 0.25 },
    });
  });

  it('maps positive drain to healing (Giga Drain)', () => {
    expect(parseRecoilDrain({ drain: 50 })).toEqual({
      drain: { fraction: 0.5 },
    });
  });

  it('uses absolute value when meta.recoil is present', () => {
    expect(parseRecoilDrain({ recoil: -33 })).toEqual({
      recoil: { fraction: 0.33 },
    });
    expect(parseRecoilDrain({ recoil: 33 })).toEqual({
      recoil: { fraction: 0.33 },
    });
  });

  it('ignores zero / missing values', () => {
    expect(parseRecoilDrain({})).toEqual({});
    expect(parseRecoilDrain({ drain: 0, recoil: 0 })).toEqual({});
  });
});

describe('parseHits', () => {
  it('reads Fury Swipes hit range from meta (top-level null)', () => {
    expect(
      parseHits({
        min_hits: null,
        max_hits: null,
        meta: { min_hits: 2, max_hits: 5 },
      })
    ).toEqual({ min: 2, max: 5 });
  });

  it('reads fixed Double Kick hits from meta', () => {
    expect(parseHits({ meta: { min_hits: 2, max_hits: 2 } })).toEqual({ min: 2, max: 2 });
  });

  it('falls back to top-level min/max hits when meta is absent', () => {
    expect(parseHits({ min_hits: 3, max_hits: 3 })).toEqual({ min: 3, max: 3 });
  });

  it('returns null when hit counts are missing', () => {
    expect(parseHits({ meta: {} })).toBeNull();
    expect(parseHits({})).toBeNull();
  });
});
