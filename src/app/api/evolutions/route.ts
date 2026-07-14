import { NextRequest, NextResponse } from 'next/server';
import { buildEvoGraph } from '@/lib/evo/build';
import { checkRateLimit, clientIpFromRequest } from '@/lib/server/rate-limit';
import { logger } from '@/lib/server/logger';

export async function GET(request: NextRequest) {
  const ip = clientIpFromRequest(request);
  const rl = await checkRateLimit(`evolutions:${ip}`, 60, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const sp = request.nextUrl.searchParams;

  const genRaw = sp.get('gen');
  const methodRaw = sp.get('method');
  const offsetRaw = sp.get('offset');
  const limitRaw = sp.get('limit');

  const gens = genRaw
    ? genRaw.split(',').map(Number).filter(Number.isFinite)
    : undefined;
  const methods = methodRaw
    ? methodRaw.split(',').filter(Boolean)
    : undefined;
  const rawOffset = offsetRaw ? parseInt(offsetRaw, 10) : 0;
  const rawLimit = limitRaw ? parseInt(limitRaw, 10) : 20;
  const offset = Number.isFinite(rawOffset) ? Math.max(0, rawOffset) : 0;
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(1, rawLimit), 200) : 20;

  try {
    const data = await buildEvoGraph({ gens, methods, offset, limit });
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
    });
  } catch (error) {
    logger.error('Evolution API error', { route: 'evolutions', err: error });
    return NextResponse.json(
      { families: [] },
      { status: 500 }
    );
  }
}
