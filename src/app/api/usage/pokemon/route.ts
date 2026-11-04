import { NextRequest, NextResponse } from 'next/server';
import { getPokemonSubstats } from '@/lib/usage/service';
import type { Format, Generation, Platform } from '@/types/usage';
import { checkRateLimit, clientIpFromRequest } from '@/lib/server/rate-limit';

// A cold request downloads Smogon's multi-MB moveset dump for the month.
export const maxDuration = 60;

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

/** GET /api/usage/pokemon?platform=&generation=&format=&month=YYYY-MM&name=Great%20Tusk */
export async function GET(req: NextRequest) {
  try {
    const rl = await checkRateLimit(`usage-pokemon:${clientIpFromRequest(req)}`, 60, 60_000, {
      onRedisError: 'memory',
    });
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const search = req.nextUrl.searchParams;
    const platform = search.get('platform') ?? 'SMOGON_SINGLES';
    const generation = search.get('generation') ?? 'GEN9';
    const format = search.get('format') ?? 'OU';
    const month = search.get('month') ?? '';
    const name = (search.get('name') ?? '').trim();

    if (!isOneOf(platform, PLATFORMS) || !isOneOf(generation, GENERATIONS) || !isOneOf(format, FORMATS)) {
      return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
    }
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: 'Invalid month; expected YYYY-MM' }, { status: 400 });
    }
    if (!name || name.length > 60) {
      return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
    }

    const data = await getPokemonSubstats({ platform, generation, format, month, pokemonName: name });
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600' },
    });
  } catch (error) {
    console.error('usage/pokemon failed:', error);
    return NextResponse.json({ error: 'Failed to load Pokémon usage details' }, { status: 500 });
  }
}
