import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const usageText = readFileSync(join(here, '../__fixtures__/smogon-usage-real-format.txt'), 'utf8');
const movesetText = readFileSync(join(here, '../__fixtures__/smogon-moveset-real-format.txt'), 'utf8');

/** Fake smogon.com/stats where only the given months are published (gen9ou). */
function mockSmogon(publishedMonths: string[]) {
  const calls: string[] = [];
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    calls.push(url);
    const m = url.match(/\/stats\/(\d{4}-\d{2})\/(.*)$/);
    if (!m || !publishedMonths.includes(m[1])) return new Response('not found', { status: 404 });
    const [, , rest] = m;
    if (rest === '') return new Response('<a href="gen9ou-0.txt">gen9ou-0.txt</a>', { status: 200 });
    if (rest === 'gen9ou-0.txt') return new Response(usageText, { status: 200 });
    if (rest === 'moveset/gen9ou-0.txt') return new Response(movesetText, { status: 200 });
    return new Response('not found', { status: 404 });
  }) as typeof fetch;
  return calls;
}

describe('usage service', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(Date.UTC(2026, 10, 4))); // 2026-11-04
    vi.resetModules();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('monthly summary reports total battles and never downloads moveset dumps', async () => {
    const calls = mockSmogon(['2026-10']);
    const { getMonthlyUsageSummary } = await import('../service');
    const res = await getMonthlyUsageSummary({ platform: 'SMOGON_SINGLES', generation: 'GEN9', format: 'OU', month: '2026-10' });
    expect(res.metadata.totalBattles).toBe(1234567);
    expect(res.data[0]).toMatchObject({ pokemonName: 'Great Tusk', pokemonId: 984 });
    expect(calls.some((u) => u.includes('/moveset/'))).toBe(false);
  });

  it('trends returns the newest published months in chronological order, without movesets', async () => {
    const calls = mockSmogon(['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10']);
    const { getUsageTrends } = await import('../service');
    const res = await getUsageTrends({ platform: 'SMOGON_SINGLES', generation: 'GEN9', format: 'OU', months: 3 });
    expect(res.historicalData.map((h) => h.month)).toEqual(['2026-08', '2026-09', '2026-10']);
    expect(res.historicalData[2].data[0].pokemonName).toBe('Great Tusk');
    expect(calls.some((u) => u.includes('/moveset/'))).toBe(false);
  });

  it('trends skips unpublished months instead of returning empty ones', async () => {
    mockSmogon(['2026-07', '2026-09']);
    const { getUsageTrends } = await import('../service');
    const res = await getUsageTrends({ platform: 'SMOGON_SINGLES', generation: 'GEN9', format: 'OU', months: 6 });
    expect(res.historicalData.map((h) => h.month)).toEqual(['2026-07', '2026-09']);
  });

  it('getPokemonSubstats parses one Pokémon from the moveset dump and caches the dump', async () => {
    const calls = mockSmogon(['2026-10']);
    const { getPokemonSubstats } = await import('../service');
    const args = { platform: 'SMOGON_SINGLES', generation: 'GEN9', format: 'OU', month: '2026-10' } as const;

    const tusk = await getPokemonSubstats({ ...args, pokemonName: 'Great Tusk' });
    expect(tusk.substats?.moves?.[0]).toEqual({ name: 'Headlong Rush', pct: 85 });
    expect(tusk.substats?.teammates?.[0]?.name).toBe('Kingambit');
    expect(tusk.sourceUrl).toBe('https://www.smogon.com/stats/2026-10/moveset/gen9ou-0.txt');

    const gambit = await getPokemonSubstats({ ...args, pokemonName: 'Kingambit' });
    expect(gambit.substats?.abilities?.[0]?.name).toBe('Supreme Overlord');
    expect(calls.filter((u) => u.includes('/moveset/'))).toHaveLength(1);

    const missing = await getPokemonSubstats({ ...args, pokemonName: 'Missingno' });
    expect(missing.substats).toBeNull();
  });
});
