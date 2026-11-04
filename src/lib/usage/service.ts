import type { Format, Generation, Platform, UsageRow, UsageSubstats } from '@/types/usage';
import { inferPokemonId, parseSmogonUsageHeader, parseSmogonUsageText } from '@/lib/usage/parseSmogonUsage';
import {
  clampToPublishableMonth,
  latestPublishableUsageMonth,
  monthsBackFrom,
  smogonStatsMonthPath,
} from '@/lib/usage/smogonMonth';
import { SMOGON_STATS_BASE, smogonFetch } from '@/lib/usage/smogonDiscovery';
import { resolveSmogonUsageFile } from '@/lib/usage/smogonResolve';
import { fetchSmogonMovesetText, parseSmogonMovesetBlockForPokemon } from '@/lib/usage/smogonMoveset';

const CACHE_TTL_MS = 1000 * 60 * 30;

/** Dev-only synthetic rows when remote data is missing (never used in production). */
const allowUsageFallback = (): boolean =>
  process.env.NODE_ENV === 'development' || process.env.USAGE_DEBUG_FALLBACK === '1';

function availabilityMonthLookback(): number {
  const raw = process.env.USAGE_AVAILABILITY_MONTHS;
  if (!raw) return 18;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 1 && n <= 36 ? n : 18;
}

function availabilityConcurrency(): number {
  const raw = process.env.USAGE_AVAILABILITY_CONCURRENCY;
  if (!raw) return 6;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 1 && n <= 32 ? n : 6;
}

type UsageKey = `${Platform}|${Generation}|${Format}|${string}`;
type UsageMonth = `${number}-${number}`;

interface MonthlyUsageResponse {
  data: UsageRow[];
  total: number;
  metadata: {
    platforms: Platform[];
    generations: Generation[];
    formats: Format[];
    months: string[];
    sampleSize?: number;
    /** "Total battles" from the Smogon file header. */
    totalBattles?: number;
    source: string;
    sourceUrl?: string;
    dataQuality: 'live' | 'empty';
    lastUpdated: string;
    /** Month the caller asked for (YYYY-MM). */
    requestedMonth: string;
    /** Month actually served; differs from requestedMonth when that month is not published yet. */
    resolvedMonth: string;
  };
}

interface TrendsResponse {
  historicalData: Array<{ month: string; data: UsageRow[] }>;
  metadata: {
    platform: Platform;
    generation: Generation;
    format: Format;
    monthsRequested: number;
  };
}

interface AvailabilityResponse {
  platform: Platform;
  formats: Format[];
  availability: Partial<Record<Format, Partial<Record<Generation, string[]>>>>;
}

interface MonthlyRows {
  rows: UsageRow[];
  totalBattles?: number;
}

export interface PokemonSubstatsResponse {
  pokemonName: string;
  month: string;
  substats: UsageSubstats | null;
  sourceUrl?: string;
}

const monthlyCache = new Map<UsageKey, { expires: number; data: MonthlyRows }>();
/** Moveset dumps are several MB each: keep only a few in memory. */
const movesetTextCache = new Map<string, { expires: number; text: string }>();
const MOVESET_CACHE_MAX = 4;
const monthExistsCache = new Map<string, { expires: number; exists: boolean }>();
/** Raw usage-file text by stats URL, shared across monthly and trends requests. */
const usageFileCache = new Map<string, { expires: number; text: string }>();

function usageFileCacheKey(pathMonth: string, filename: string): string {
  return `${pathMonth}/${filename}`;
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;

  async function worker(): Promise<void> {
    while (true) {
      const i = next;
      next += 1;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
    }
  }

  const n = Math.min(Math.max(1, limit), items.length);
  await Promise.all(Array.from({ length: n }, () => worker()));
  return results;
}

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeMonth(month: string): string {
  const match = month.match(/^(\d{4})-(\d{1,2})$/);
  if (!match) return month;
  const year = match[1];
  const mm = match[2].padStart(2, '0');
  return `${year}-${mm}`;
}

function asUsageMonth(month: string): UsageMonth {
  return normalizeMonth(month) as UsageMonth;
}

function getFallbackRows(platform: Platform, generation: Generation, format: Format, month: string): UsageRow[] {
  const usageMonth = asUsageMonth(month);
  const sample = [
    ['Great Tusk', 28.6],
    ['Kingambit', 26.8],
    ['Gholdengo', 23.1],
    ['Landorus-Therian', 19.7],
    ['Iron Valiant', 17.4],
    ['Dragapult', 16.2],
    ['Raging Bolt', 13.3],
    ['Gliscor', 11.8],
    ['Samurott-Hisui', 10.4],
    ['Heatran', 9.6],
  ] as const;

  return sample.map(([pokemonName, usagePercent], idx) => ({
    pokemonId: inferPokemonId(pokemonName),
    pokemonName,
    month: usageMonth,
    platform,
    generation,
    format,
    usagePercent,
    rank: idx + 1,
    sampleSize: undefined,
    source: {
      label: 'Fallback usage sample (development)',
      collectedAt: nowIso(),
    },
  }));
}

function metadataSourceLabel(platform: Platform): string {
  if (platform === 'SMOGON_SINGLES') return 'Smogon (Singles)';
  if (platform === 'VGC_OFFICIAL') return 'Smogon (VGC)';
  if (platform === 'BSS_OFFICIAL') return 'Smogon (BSS)';
  return 'Smogon usage stats';
}

function rowSourceLabel(platform: Platform, generation: Generation, format: Format, month: string): string {
  const gen = generation.replace('GEN', '');
  if (platform === 'SMOGON_SINGLES') {
    return `Smogon Gen ${gen} ${format} (${month})`;
  }
  if (platform === 'VGC_OFFICIAL') {
    return `Smogon Gen ${gen} VGC ${format.replace(/_/g, ' ')} (${month})`;
  }
  if (platform === 'BSS_OFFICIAL') {
    return `Smogon Gen ${gen} BSS ${format.replace(/_/g, ' ')} (${month})`;
  }
  return `Smogon ${generation} ${format} (${month})`;
}

async function fetchSmogonMonthlyRows(
  platform: Platform,
  generation: Generation,
  format: Format,
  month: string
): Promise<MonthlyRows> {
  const normalizedMonth = normalizeMonth(month);
  const fallback = (): MonthlyRows => ({
    rows: allowUsageFallback() ? getFallbackRows(platform, generation, format, normalizedMonth) : [],
  });
  const resolved = await resolveSmogonUsageFile(platform, generation, format, normalizedMonth);
  if (!resolved) return fallback();

  const pathMonth = smogonStatsMonthPath(normalizedMonth);
  const sourceUrl = `${SMOGON_STATS_BASE}/${pathMonth}/${resolved.filename}`;
  const fk = usageFileCacheKey(pathMonth, resolved.filename);
  const cachedFile = usageFileCache.get(fk);
  let text: string;
  if (cachedFile && cachedFile.expires > Date.now()) {
    text = cachedFile.text;
  } else {
    const res = await smogonFetch(sourceUrl, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) return fallback();

    text = await res.text();
    usageFileCache.set(fk, { expires: Date.now() + CACHE_TTL_MS, text });
  }

  const sourceLabel = rowSourceLabel(platform, generation, format, normalizedMonth);
  const parsed = parseSmogonUsageText(text, {
    platform,
    generation,
    format,
    month: normalizedMonth,
    sourceUrl,
    sourceLabel,
  });

  if (parsed.length === 0) return fallback();

  // Moveset details (moves, items, spreads, …) are loaded per Pokémon by getPokemonSubstats:
  // the moveset dump is several MB, too heavy to fetch for every snapshot or trends month.
  return { rows: parsed, totalBattles: parseSmogonUsageHeader(text).totalBattles };
}

function cacheKey(platform: Platform, generation: Generation, format: Format, month: string): UsageKey {
  return `${platform}|${generation}|${format}|${normalizeMonth(month)}`;
}

async function getMonthlyRows(
  platform: Platform,
  generation: Generation,
  format: Format,
  month: string
): Promise<MonthlyRows> {
  const normalizedMonth = normalizeMonth(month);
  const key = cacheKey(platform, generation, format, normalizedMonth);
  const cached = monthlyCache.get(key);
  if (cached && cached.expires > Date.now()) return cached.data;

  const result = await fetchSmogonMonthlyRows(platform, generation, format, normalizedMonth);
  monthlyCache.set(key, { expires: Date.now() + CACHE_TTL_MS, data: result });
  return result;
}

/** Most recent publishable months, newest first (the in-progress month never has stats). */
function getRecentMonths(months: number): string[] {
  return monthsBackFrom(latestPublishableUsageMonth(), months);
}

/** Rows per month returned by the trends endpoint. */
const TRENDS_ROW_LIMIT = 50;

/** How many months to walk back when the requested month has no published stats. */
const MONTHLY_FALLBACK_LOOKBACK = 6;

/** Whether Smogon's monthly index lists a usage file for these filters (no download). */
async function monthHasData(
  platform: Platform,
  generation: Generation,
  format: Format,
  month: string
): Promise<boolean> {
  const key = `${platform}|${generation}|${format}|${normalizeMonth(month)}`;
  const cached = monthExistsCache.get(key);
  if (cached && cached.expires > Date.now()) return cached.exists;

  const resolved = await resolveSmogonUsageFile(platform, generation, format, normalizeMonth(month));
  const exists = resolved ? true : allowUsageFallback();
  monthExistsCache.set(key, { expires: Date.now() + CACHE_TTL_MS, exists });
  return exists;
}

export async function getMonthlyUsageSummary(params: {
  platform: Platform;
  generation: Generation;
  format: Format;
  month: string;
  top50Only?: boolean;
}): Promise<MonthlyUsageResponse> {
  const requestedMonth = normalizeMonth(params.month);
  // Walk back from the requested month (clamped to what Smogon can have published) until a
  // month with real data is found, so links like ?month=<current month> still show stats.
  const candidates = monthsBackFrom(clampToPublishableMonth(requestedMonth), MONTHLY_FALLBACK_LOOKBACK);
  let resolvedMonth = candidates[0] ?? requestedMonth;
  let rows: UsageRow[] = [];
  let totalBattles: number | undefined;
  for (const month of candidates) {
    const result = await getMonthlyRows(params.platform, params.generation, params.format, month);
    if (result.rows.length > 0) {
      rows = result.rows;
      totalBattles = result.totalBattles;
      resolvedMonth = month;
      break;
    }
  }
  const filtered = params.top50Only ? rows.filter((row) => row.rank <= 50) : rows;
  const sampleSize = filtered.find((row) => typeof row.sampleSize === 'number')?.sampleSize;

  return {
    data: filtered,
    total: filtered.length,
    metadata: {
      platforms: [params.platform],
      generations: [params.generation],
      formats: [params.format],
      months: [resolvedMonth],
      sampleSize,
      totalBattles,
      source: metadataSourceLabel(params.platform),
      sourceUrl: filtered[0]?.source.url,
      dataQuality: filtered.length > 0 ? 'live' : 'empty',
      lastUpdated: nowIso(),
      requestedMonth,
      resolvedMonth,
    },
  };
}

export async function getUsageTrends(params: {
  platform: Platform;
  generation: Generation;
  format: Format;
  months?: number;
  top50Only?: boolean;
}): Promise<TrendsResponse> {
  const months = Math.max(1, Math.min(params.months ?? 6, 12));
  // A couple of spare months in case the newest ones are not published for this format yet.
  const candidates = getRecentMonths(months + 2);
  // Fetch usage files in parallel (no moveset dumps): sequential fetching with movesets
  // exceeded the function time limit, so the Trends tab never finished loading.
  const perMonth = await mapWithConcurrency(candidates, 4, async (month) => {
    try {
      return { month, rows: (await getMonthlyRows(params.platform, params.generation, params.format, month)).rows };
    } catch {
      return { month, rows: [] as UsageRow[] };
    }
  });
  // Trends only chart the leaders: keep payloads small.
  const limit = params.top50Only ? 50 : TRENDS_ROW_LIMIT;
  const historicalData = perMonth
    .filter((entry) => entry.rows.length > 0)
    .slice(0, months)
    .map((entry) => ({ month: entry.month, data: entry.rows.filter((row) => row.rank <= limit) }));

  return {
    historicalData: historicalData.reverse(),
    metadata: {
      platform: params.platform,
      generation: params.generation,
      format: params.format,
      monthsRequested: months,
    },
  };
}

export async function getUsageAvailability(platform: Platform): Promise<AvailabilityResponse> {
  const emptyGenRecord = (): Partial<Record<Generation, string[]>> => ({
    GEN5: [],
    GEN6: [],
    GEN7: [],
    GEN8: [],
    GEN9: [],
  });

  if (platform === 'OTHER') {
    return {
      platform,
      formats: ['UNKNOWN'],
      availability: {
        UNKNOWN: emptyGenRecord(),
      },
    };
  }

  const availability: AvailabilityResponse['availability'] = {};
  const formatsByPlatform: Record<Platform, Format[]> = {
    SMOGON_SINGLES: ['OU', 'UU', 'RU', 'NU', 'UBERS', 'PU', 'MONOTYPE'],
    VGC_OFFICIAL: ['VGC_REG_A', 'VGC_REG_B', 'VGC_REG_C', 'VGC_REG_D', 'VGC_REG_E', 'VGC_REG_F', 'VGC_REG_G', 'VGC_REG_H', 'VGC_REG_I'],
    BSS_OFFICIAL: [
      'BSS_SERIES_8',
      'BSS_SERIES_9',
      'BSS_SERIES_12',
      'BSS_SERIES_13',
      'BSS_REG_C',
      'BSS_REG_D',
      'BSS_REG_E',
      'BSS_REG_I',
    ],
    OTHER: ['UNKNOWN'],
  };

  const generations: Generation[] = ['GEN9', 'GEN8', 'GEN7', 'GEN6', 'GEN5'];
  const formats = formatsByPlatform[platform] ?? ['UNKNOWN'];
  const recentMonths = getRecentMonths(availabilityMonthLookback());
  const concurrency = availabilityConcurrency();

  for (const format of formats) {
    availability[format] = {};
    for (const generation of generations) {
      const existsFlags = await mapWithConcurrency(recentMonths, concurrency, (m) =>
        monthHasData(platform, generation, format, m)
      );
      const foundMonths = recentMonths.filter((_, i) => existsFlags[i]);
      availability[format]![generation] = foundMonths;
    }
  }

  return {
    platform,
    formats,
    availability,
  };
}

async function getMovesetText(month: string, stem: string): Promise<string | null> {
  const key = `${normalizeMonth(month)}/${stem}`;
  const hit = movesetTextCache.get(key);
  if (hit && hit.expires > Date.now()) return hit.text;
  const text = await fetchSmogonMovesetText(month, stem);
  if (!text) return null;
  if (movesetTextCache.size >= MOVESET_CACHE_MAX) {
    const oldest = movesetTextCache.keys().next().value;
    if (oldest !== undefined) movesetTextCache.delete(oldest);
  }
  movesetTextCache.set(key, { expires: Date.now() + CACHE_TTL_MS, text });
  return text;
}

/**
 * Moves, items, abilities, Tera types, EV spreads and teammates for one Pokémon, from
 * Smogon's moveset dump for the given month (the Deep Dive view).
 */
export async function getPokemonSubstats(params: {
  platform: Platform;
  generation: Generation;
  format: Format;
  month: string;
  pokemonName: string;
}): Promise<PokemonSubstatsResponse> {
  const month = normalizeMonth(params.month);
  const empty: PokemonSubstatsResponse = { pokemonName: params.pokemonName, month, substats: null };
  const resolved = await resolveSmogonUsageFile(params.platform, params.generation, params.format, month);
  if (!resolved) return empty;
  const text = await getMovesetText(month, resolved.stem);
  if (!text) return empty;
  return {
    pokemonName: params.pokemonName,
    month,
    substats: parseSmogonMovesetBlockForPokemon(text, params.pokemonName) ?? null,
    sourceUrl: `${SMOGON_STATS_BASE}/${smogonStatsMonthPath(month)}/moveset/${resolved.stem}-0.txt`,
  };
}
