import { NextRequest, NextResponse } from 'next/server';
import { buildEvoGraph } from '@/lib/evo/build';
import { checkRateLimit, clientIpFromRequest } from '@/lib/server/rate-limit';
import { logger } from '@/lib/server/logger';

export async function GET(request: NextRequest) {
  const ip = clientIpFromRequest(request);
  const rl = await checkRateLimit(`evolutions-search:${ip}`, 60, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const sp = request.nextUrl.searchParams;
  const query = (sp.get('q') || '').toLowerCase().trim();
  const genRaw = sp.get('gen');

  if (!query || query.length < 2) {
    return NextResponse.json({ families: [] });
  }

  const gens = genRaw
    ? genRaw.split(',').map(Number).filter(Number.isFinite)
    : undefined;

  try {
    const data = await buildEvoGraph({ gens, offset: 0, limit: 200 });

    const matched = data.families.filter((fam) =>
      fam.species.some((s) => s.name.toLowerCase().includes(query))
    );

    return NextResponse.json(
      { families: matched },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' } }
    );
  } catch (error) {
    logger.error('Evolution search error', { route: 'evolutions/search', err: error });
    return NextResponse.json({ families: [] }, { status: 500 });
  }
}
