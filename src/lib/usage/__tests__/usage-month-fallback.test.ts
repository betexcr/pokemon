import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import {
  clampToPublishableMonth,
  latestPublishableUsageMonth,
  monthsBackFrom,
} from '../smogonMonth';

describe('Smogon month helpers', () => {
  const now = new Date(Date.UTC(2026, 10, 4)); // 2026-11-04

  it('treats the previous month as the latest publishable one', () => {
    expect(latestPublishableUsageMonth(now)).toBe('2026-10');
    expect(latestPublishableUsageMonth(new Date(Date.UTC(2027, 0, 2)))).toBe('2026-12');
  });

  it('clamps current/future months and keeps published ones', () => {
    expect(clampToPublishableMonth('2026-11', now)).toBe('2026-10');
    expect(clampToPublishableMonth('2030-01', now)).toBe('2026-10');
    expect(clampToPublishableMonth('2026-03', now)).toBe('2026-03');
    expect(clampToPublishableMonth('2026-3', now)).toBe('2026-03');
  });

  it('lists months backwards across year boundaries', () => {
    expect(monthsBackFrom('2026-02', 4)).toEqual(['2026-02', '2026-01', '2025-12', '2025-11']);
    expect(monthsBackFrom('bad', 3)).toEqual([]);
  });
});

describe('getMonthlyUsageSummary month fallback', () => {
  const originalFetch = globalThis.fetch;
  const usageText = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), '../__fixtures__/smogon-usage-snippet.txt'),
    'utf8'
  );

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(Date.UTC(2026, 10, 4)));
    vi.resetModules();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('serves the latest published month when the requested one is not out yet', async () => {
    const calls: string[] = [];
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      calls.push(url);
      // Only September 2026 has been published in this scenario.
      if (url === 'https://www.smogon.com/stats/2026-09/') {
        return new Response('<a href="gen9ou-0.txt">gen9ou-0.txt</a>', { status: 200 });
      }
      if (url === 'https://www.smogon.com/stats/2026-09/gen9ou-0.txt') {
        return new Response(usageText, { status: 200 });
      }
      return new Response('not found', { status: 404 });
    }) as typeof fetch;

    const { getMonthlyUsageSummary } = await import('../service');
    const result = await getMonthlyUsageSummary({
      platform: 'SMOGON_SINGLES',
      generation: 'GEN9',
      format: 'OU',
      month: '2026-11',
    });

    expect(result.metadata.requestedMonth).toBe('2026-11');
    expect(result.metadata.resolvedMonth).toBe('2026-09');
    expect(result.metadata.dataQuality).toBe('live');
    expect(result.metadata.sourceUrl).toBe('https://www.smogon.com/stats/2026-09/gen9ou-0.txt');
    expect(result.data.slice(0, 2).map((r) => r.pokemonName)).toEqual(['Great Tusk', 'Kingambit']);
    // The unpublished in-progress month is never requested.
    expect(calls.some((u) => u.includes('/2026-11/'))).toBe(false);
  });
});
