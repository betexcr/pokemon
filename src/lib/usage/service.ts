import type { Format, Generation, Platform, UsageRow } from '@/types/usage';
import { inferPokemonId, parseSmogonUsageText } from '@/lib/usage/parseSmogonUsage';
import { smogonStatsMonthPath } from '@/lib/usage/smogonMonth';
import { SMOGON_STATS_BASE } from '@/lib/usage/smogonDiscovery';
import { resolveSmogonUsageFile } from '@/lib/usage/smogonResolve';
import { enrichRowsWithMovesetSubstats } from '@/lib/usage/smogonMoveset';
import { probeSmogonUsageFileExists } from '@/lib/usage/smogonProbe';

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
type MonthHasDataMode = 'availability' | 'strict';

interface MonthlyUsageResponse {
  data: UsageRow[];
  total: number;
  metadata: {
    platforms: Platform[];
    generations: Generation[];
    formats: Format[];
    months: string[];
    sampleSize?: number;
    source: string;
    dataQuality: 'live' | 'empty';
    lastUpdated: string;
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

const monthlyCache = new Map<UsageKey, { expires: number; data: UsageRow[] }>();
const monthExistsCache = new Map<string, { expires: number; exists: boolean }>();
/** Shared raw text for a stats file URL so monthly fetch and strict probes can reuse work. */
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
): Promise<UsageRow[]> {
  const normalizedMonth = normalizeMonth(month);
  const resolved = await resolveSmogonUsageFile(platform, generation, format, normalizedMonth);
  if (!resolved) {
    return allowUsageFallback() ? getFallbackRows(platform, generation, format, normalizedMonth) : [];
  }

  const pathMonth = smogonStatsMonthPath(normalizedMonth);
  const sourceUrl = `${SMOGON_STATS_BASE}/${pathMonth}/${resolved.filename}`;
  const fk = usageFileCacheKey(pathMonth, resolved.filename);
  const cachedFile = usageFileCache.get(fk);
  let text: string;
  if (cachedFile && cachedFile.expires > Date.now()) {
    text = cachedFile.text;
  } else {
    const res = await fetch(sourceUrl, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return allowUsageFallback() ? getFallbackRows(platform, generation, format, normalizedMonth) : [];
    }

    text = await res.text();
    usageFileCache.set(fk, { expires: Date.now() + CACHE_TTL_MS, text });
  }

  const sourceLabel = rowSourceLabel(platform, generation, format, normalizedMonth);
  let parsed = parseSmogonUsageText(text, {
    platform,
    generation,
    format,
    month: normalizedMonth,
    sourceUrl,
    sourceLabel,
  });

  if (parsed.length === 0) {
    return allowUsageFallback() ? getFallbackRows(platform, generation, format, normalizedMonth) : [];
  }

  try {
    parsed = await enrichRowsWithMovesetSubstats(parsed, normalizedMonth, resolved.stem);
  } catch {
    // Moveset is optional; combined usage still valid
  }

  return parsed;
}

function cacheKey(platform: Platform, generation: Generation, format: Format, month: string): UsageKey {
  return `${platform}|${generation}|${format}|${normalizeMonth(month)}`;
}

async function getMonthlyRows(
  platform: Platform,
  generation: Generation,
  format: Format,
  month: string
): Promise<UsageRow[]> {
  const normalizedMonth = normalizeMonth(month);
  const key = cacheKey(platform, generation, format, normalizedMonth);
  const cached = monthlyCache.get(key);
  if (cached && cached.expires > Date.now()) return cached.data;

  const rows = await fetchSmogonMonthlyRows(platform, generation, format, normalizedMonth);
  monthlyCache.set(key, { expires: Date.now() + CACHE_TTL_MS, data: rows });
  return rows;
}

function getRecentMonths(months: number): string[] {
  const result: string[] = [];
  const now = new Date();
  for (let i = 0; i < months; i += 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return result;
}

async function monthHasData(
  platform: Platform,
  generation: Generation,
  format: Format,
  month: string,
  mode: MonthHasDataMode
): Promise<boolean> {
  const cacheKey = `${platform}|${generation}|${format}|${normalizeMonth(month)}|${mode}`;
  const cached = monthExistsCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached.exists;

  const normalizedMonth = normalizeMonth(month);
  const resolved = await resolveSmogonUsageFile(platform, generation, format, normalizedMonth);
  if (!resolved) {
    const exists = allowUsageFallback();
    monthExistsCache.set(cacheKey, { expires: Date.now() + CACHE_TTL_MS, exists });
    return exists;
  }

  if (mode === 'availability') {
    monthExistsCache.set(cacheKey, { expires: Date.now() + CACHE_TTL_MS, exists: true });
    return true;
  }

  const pathMonth = smogonStatsMonthPath(normalizedMonth);
  const sourceUrl = `${SMOGON_STATS_BASE}/${pathMonth}/${resolved.filename}`;
  const fk = usageFileCacheKey(pathMonth, resolved.filename);
  const cachedFile = usageFileCache.get(fk);
  if (cachedFile && cachedFile.expires > Date.now()) {
    const sourceLabel = rowSourceLabel(platform, generation, format, normalizedMonth);
    const parsed = parseSmogonUsageText(cachedFile.text, {
      platform,
      generation,
      format,
      month: normalizedMonth,
      sourceUrl,
      sourceLabel,
    });
    const exists = parsed.length > 0 || allowUsageFallback();
    monthExistsCache.set(cacheKey, { expires: Date.now() + CACHE_TTL_MS, exists });
    return exists;
  }

  const ok = await probeSmogonUsageFileExists(sourceUrl);
  if (!ok) {
    const exists = allowUsageFallback();
    monthExistsCache.set(cacheKey, { expires: Date.now() + CACHE_TTL_MS, exists });
    return exists;
  }

  monthExistsCache.set(cacheKey, { expires: Date.now() + CACHE_TTL_MS, exists: true });
  return true;
}

export async function getMonthlyUsageSummary(params: {
  platform: Platform;
  generation: Generation;
  format: Format;
  month: string;
  top50Only?: boolean;
}): Promise<MonthlyUsageResponse> {
  const rows = await getMonthlyRows(params.platform, params.generation, params.format, params.month);
  const filtered = params.top50Only ? rows.filter((row) => row.rank <= 50) : rows;
  const sampleSize = filtered.find((row) => typeof row.sampleSize === 'number')?.sampleSize;

  return {
    data: filtered,
    total: filtered.length,
    metadata: {
      platforms: [params.platform],
      generations: [params.generation],
      formats: [params.format],
      months: [normalizeMonth(params.month)],
      sampleSize,
      source: metadataSourceLabel(params.platform),
      dataQuality: filtered.length > 0 ? 'live' : 'empty',
      lastUpdated: nowIso(),
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
  const candidates = getRecentMonths(Math.max(months + 4, months));
  const historicalData: Array<{ month: string; data: UsageRow[] }> = [];

  for (const month of candidates) {
    if (historicalData.length >= months) break;
    const hasData = await monthHasData(params.platform, params.generation, params.format, month, 'strict');
    if (!hasData) continue;
    const rows = await getMonthlyRows(params.platform, params.generation, params.format, month);
    historicalData.push({
      month,
      data: params.top50Only ? rows.filter((row) => row.rank <= 50) : rows,
    });
  }

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
        monthHasData(platform, generation, format, m, 'availability')
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
