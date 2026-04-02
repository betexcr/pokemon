import { NextRequest, NextResponse } from 'next/server';
import { getMonthlyUsageSummary } from '@/lib/usage/service';
import type { Format, Generation, Platform } from '@/types/usage';

const PLATFORMS: Platform[] = ['SMOGON_SINGLES', 'VGC_OFFICIAL', 'BSS_OFFICIAL', 'OTHER'];
const GENERATIONS: Generation[] = ['GEN5', 'GEN6', 'GEN7', 'GEN8', 'GEN9'];
const FORMATS: Format[] = [
  'OU', 'UU', 'RU', 'NU', 'UBERS', 'PU', 'MONOTYPE',
  'VGC_REG_A', 'VGC_REG_B', 'VGC_REG_C', 'VGC_REG_D', 'VGC_REG_E', 'VGC_REG_F', 'VGC_REG_G', 'VGC_REG_H', 'VGC_REG_I',
  'BSS_SERIES_8', 'BSS_SERIES_9', 'BSS_SERIES_12', 'BSS_SERIES_13', 'BSS_REG_C', 'BSS_REG_D', 'BSS_REG_E', 'BSS_REG_I',
  'UNKNOWN',
];

function isOneOf<T extends string>(value: string, allowed: readonly T[]): value is T {
  return allowed.includes(value as T);
}

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams;
    const platformRaw = search.get('platform') ?? 'SMOGON_SINGLES';
    const generationRaw = search.get('generation') ?? 'GEN9';
    const formatRaw = search.get('format') ?? 'OU';
    const month = search.get('month') ?? new Date().toISOString().slice(0, 7);
    const top50Only = search.get('top50Only') === 'true';

    if (!isOneOf(platformRaw, PLATFORMS) || !isOneOf(generationRaw, GENERATIONS) || !isOneOf(formatRaw, FORMATS)) {
      return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
    }

    const data = await getMonthlyUsageSummary({
      platform: platformRaw,
      generation: generationRaw,
      format: formatRaw,
      month,
      top50Only,
    });

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=600' },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load monthly usage data', detail: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
