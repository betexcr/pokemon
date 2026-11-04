import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseSmogonUsageText } from '../parseSmogonUsage';
import { parseSmogonMovesetBlockForPokemon } from '../smogonMoveset';
import { normalizeUsageMonth, smogonStatsMonthPath } from '../smogonMonth';
import { filterCombinedUsageFiles } from '../smogonDiscovery';
import { resolveSmogonUsageFile } from '../smogonResolve';

const __dirname = dirname(fileURLToPath(import.meta.url));

vi.mock('../smogonDiscovery', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../smogonDiscovery')>();
  return {
    ...actual,
    fetchSmogonIndexFilenames: vi.fn(),
  };
});

import { fetchSmogonIndexFilenames } from '../smogonDiscovery';

describe('usage / Smogon', () => {
  beforeEach(() => {
    vi.mocked(fetchSmogonIndexFilenames).mockResolvedValue([
      'gen9ou-0.txt',
      'gen9vgc2025regg-0.txt',
      'gen9vgc2025regg-bo3-0.txt',
      'gen9bssregg-0.txt',
      'gen8battlestadiumsingles-0.txt',
    ]);
  });
  it('normalizes months to YYYY-MM for URL paths', () => {
    expect(normalizeUsageMonth('2025-1')).toBe('2025-01');
    expect(smogonStatsMonthPath('2025-01')).toBe('2025-01');
  });

  it('filters combined -0.txt usage files', () => {
    const names = ['gen9ou-0.txt', 'gen9ou-1500-0.txt', 'gen9ou-1760-0.txt', 'readme.txt'];
    expect(filterCombinedUsageFiles(names)).toEqual(['gen9ou-0.txt']);
  });

  it('parses the real Smogon 7-column usage layout (Usage %, Raw, %, Real, %)', () => {
    const text = readFileSync(join(__dirname, '../__fixtures__/smogon-usage-real-format.txt'), 'utf8');
    const rows = parseSmogonUsageText(text, {
      platform: 'SMOGON_SINGLES',
      generation: 'GEN9',
      format: 'OU',
      month: '2026-10',
      sourceUrl: 'https://www.smogon.com/stats/2026-10/gen9ou-0.txt',
      sourceLabel: 'Smogon Gen 9 OU (2026-10)',
    });
    expect(rows.map((r) => r.pokemonName)).toEqual(['Great Tusk', 'Kingambit', 'Ting-Lu', 'Samurott-Hisui']);
    expect(rows[0].usagePercent).toBeCloseTo(31.32479, 4);
    expect(rows[0].sampleSize).toBe(134557);
    expect(rows[1].sampleSize).toBe(120333);
    expect(rows[3].rank).toBe(10);
    expect(rows[3].usagePercent).toBeCloseTo(9.87654, 4);
  });

  it('parses combined usage snippet', () => {
    const text = readFileSync(join(__dirname, '../__fixtures__/smogon-usage-snippet.txt'), 'utf8');
    const rows = parseSmogonUsageText(text, {
      platform: 'SMOGON_SINGLES',
      generation: 'GEN9',
      format: 'OU',
      month: '2025-01',
      sourceUrl: 'https://www.smogon.com/stats/2025-01/gen9ou-0.txt',
      sourceLabel: 'Smogon Gen 9 OU (2025-01)',
    });
    expect(rows).toHaveLength(2);
    expect(rows[0].pokemonName).toBe('Great Tusk');
    expect(rows[0].rank).toBe(1);
    expect(rows[0].usagePercent).toBeCloseTo(28.5, 2);
    expect(rows[0].source.label).toBe('Smogon Gen 9 OU (2025-01)');
    expect(rows[0].source.url).toContain('gen9ou-0.txt');
  });

  it('parses moveset block for a Pokémon', () => {
    const text = readFileSync(join(__dirname, '../__fixtures__/smogon-moveset-snippet.txt'), 'utf8');
    const sub = parseSmogonMovesetBlockForPokemon(text, 'Great Tusk');
    expect(sub?.moves?.map((m) => m.name)).toEqual(['Rapid Spin', 'Headlong Rush']);
    expect(sub?.items?.[0]?.name).toBe('Heavy-Duty Boots');
    expect(sub?.abilities?.[0]?.name).toBe('Protosynthesis');
  });

  it('parses a real-format Smogon moveset block (spreads, tera, teammates, counters)', () => {
    const text = readFileSync(join(__dirname, '../__fixtures__/smogon-moveset-real-format.txt'), 'utf8');
    const tusk = parseSmogonMovesetBlockForPokemon(text, 'Great Tusk');
    expect(tusk?.abilities).toEqual([{ name: 'Protosynthesis', pct: 100 }]);
    expect(tusk?.items?.map((i) => i.name)).toEqual(['Booster Energy', 'Leftovers']);
    expect(tusk?.moves?.map((m) => m.name)).toEqual(['Headlong Rush', 'Rapid Spin']);
    expect(tusk?.spreads?.[0]).toEqual({ nature: 'Jolly', evs: '0/252/4/0/0/252', pct: 30.123 });
    expect(tusk?.teraTypes?.map((t) => t.name)).toEqual(['Steel', 'Water']);
    expect(tusk?.teammates?.map((t) => t.name)).toEqual(['Kingambit', 'Gholdengo']);

    const gambit = parseSmogonMovesetBlockForPokemon(text, 'Kingambit');
    expect(gambit?.abilities?.[0]?.name).toBe('Supreme Overlord');
    expect(gambit?.moves?.map((m) => m.name)).toEqual(['Sucker Punch']);
  });

  describe('resolveSmogonUsageFile (index mock)', () => {
    beforeEach(() => {
      vi.mocked(fetchSmogonIndexFilenames).mockResolvedValue([
        'gen9ou-0.txt',
        'gen9vgc2025regg-0.txt',
        'gen9vgc2025regg-bo3-0.txt',
        'gen9bssregg-0.txt',
        'gen8battlestadiumsingles-0.txt',
      ]);
    });

    it('resolves Singles OU', async () => {
      const r = await resolveSmogonUsageFile('SMOGON_SINGLES', 'GEN9', 'OU', '2025-01');
      expect(r?.filename).toBe('gen9ou-0.txt');
      expect(r?.stem).toBe('gen9ou');
    });

    it('prefers non-bo3 VGC for regulation letter', async () => {
      const r = await resolveSmogonUsageFile('VGC_OFFICIAL', 'GEN9', 'VGC_REG_G', '2025-01');
      expect(r?.filename).toBe('gen9vgc2025regg-0.txt');
    });

    it('resolves BSS regulation from index', async () => {
      const r = await resolveSmogonUsageFile('BSS_OFFICIAL', 'GEN9', 'BSS_SERIES_12', '2025-01');
      expect(r?.filename).toBe('gen9bssregg-0.txt');
    });
  });

  it('resolves Singles OU via static HEAD when monthly index is empty', async () => {
    vi.mocked(fetchSmogonIndexFilenames).mockResolvedValue([]);
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockImplementation(async (input: RequestInfo, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.includes('/2025-01/gen9ou-0.txt') && init?.method === 'HEAD') {
        return new Response(null, { status: 200 });
      }
      return new Response(null, { status: 404 });
    }) as typeof fetch;
    try {
      const r = await resolveSmogonUsageFile('SMOGON_SINGLES', 'GEN9', 'OU', '2025-01');
      expect(r?.filename).toBe('gen9ou-0.txt');
      expect(r?.stem).toBe('gen9ou');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
