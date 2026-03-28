import { describe, it, expect } from 'vitest';
import {
  NATIONAL_DEX_MAX_BY_GENERATION,
  getMaxNationalDexForGeneration,
  getGenerationExclusiveDexRange,
  teamWithinMaxGeneration,
  validateTeamMaxGeneration,
  formatChampionshipGenerationRule,
} from '../nationalDexByGeneration';
import type { TeamSlot } from '@/lib/userTeams';

function slot(id: number | null): TeamSlot {
  return {
    id,
    level: 50,
    moves: [],
    nature: 'hardy',
  };
}

describe('getMaxNationalDexForGeneration', () => {
  it('returns cumulative National Dex cap per generation', () => {
    expect(getMaxNationalDexForGeneration(1)).toBe(151);
    expect(getMaxNationalDexForGeneration(5)).toBe(649);
    expect(getMaxNationalDexForGeneration(9)).toBe(1025);
  });

  it('throws on invalid generation', () => {
    expect(() => getMaxNationalDexForGeneration(0)).toThrow('Invalid generation');
    expect(() => getMaxNationalDexForGeneration(10)).toThrow('Invalid generation');
    expect(() => getMaxNationalDexForGeneration(3.5)).toThrow('Invalid generation');
  });
});

describe('getGenerationExclusiveDexRange', () => {
  it('matches per-generation slice used for API fetches', () => {
    expect(getGenerationExclusiveDexRange(1)).toEqual({ start: 1, end: 151 });
    expect(getGenerationExclusiveDexRange(2)).toEqual({ start: 152, end: 251 });
    expect(getGenerationExclusiveDexRange(9)).toEqual({ start: 906, end: 1025 });
  });
});

describe('teamWithinMaxGeneration', () => {
  it('allows all when maxGen is undefined', () => {
    expect(teamWithinMaxGeneration([slot(9999)], undefined)).toBe(true);
  });

  it('allows empty or all-null teams', () => {
    expect(teamWithinMaxGeneration(undefined, 5)).toBe(true);
    expect(teamWithinMaxGeneration([slot(null), slot(null)], 1)).toBe(true);
  });

  it('allows id exactly at Gen 5 cap', () => {
    const max = NATIONAL_DEX_MAX_BY_GENERATION[5];
    expect(teamWithinMaxGeneration([slot(max)], 5)).toBe(true);
  });

  it('rejects id one over Gen 5 cap', () => {
    const max = NATIONAL_DEX_MAX_BY_GENERATION[5];
    expect(teamWithinMaxGeneration([slot(max + 1)], 5)).toBe(false);
  });

  it('rejects id below 1', () => {
    expect(teamWithinMaxGeneration([slot(0)], 9)).toBe(false);
  });
});

describe('validateTeamMaxGeneration', () => {
  it('returns ok for valid team', () => {
    expect(validateTeamMaxGeneration([slot(1), slot(151)], 1)).toEqual({ ok: true });
  });

  it('returns message with slot index on failure', () => {
    const r = validateTeamMaxGeneration([slot(1), slot(500)], 1);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain('Slot 2');
  });
});

describe('formatChampionshipGenerationRule', () => {
  it('returns null when no cap', () => {
    expect(formatChampionshipGenerationRule(undefined)).toBeNull();
  });

  it('formats valid generation', () => {
    const s = formatChampionshipGenerationRule(5);
    expect(s).toContain('Gen 5');
    expect(s).toContain('649');
  });

  it('returns null for invalid stored values', () => {
    expect(formatChampionshipGenerationRule(0 as unknown as number)).toBeNull();
    expect(formatChampionshipGenerationRule(99 as unknown as number)).toBeNull();
  });
});
