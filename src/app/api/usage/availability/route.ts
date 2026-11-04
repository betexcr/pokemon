import { NextRequest, NextResponse } from 'next/server';
import { getUsageAvailability } from '@/lib/usage/service';
import type { Platform } from '@/types/usage';
import { checkRateLimit, clientIpFromRequest } from '@/lib/server/rate-limit';

// Availability probes up to 18 monthly Smogon indexes on a cold start.
export const maxDuration = 60;

const PLATFORMS: Platform[] = ['SMOGON_SINGLES', 'VGC_OFFICIAL', 'BSS_OFFICIAL', 'OTHER'];

function isOneOf<T extends string>(value: string, allowed: readonly T[]): value is T {
  return allowed.includes(value as T);
}

export async function GET(req: NextRequest) {
  try {
    const rl = await checkRateLimit(`usage-availability:${clientIpFromRequest(req)}`, 30, 60_000, {
      onRedisError: 'memory',
    });
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const search = req.nextUrl.searchParams;
    const platformRaw = search.get('platform') ?? 'SMOGON_SINGLES';
    if (!isOneOf(platformRaw, PLATFORMS)) {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
    }

    const data = await getUsageAvailability(platformRaw);
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=600' },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load usage availability', detail: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
