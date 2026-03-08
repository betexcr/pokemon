import { NextRequest, NextResponse } from 'next/server';
import { buildEvoGraph } from '@/lib/evo/build';

export async function GET(request: NextRequest) {
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
  const offset = offsetRaw ? parseInt(offsetRaw, 10) : 0;
  const limit = limitRaw ? parseInt(limitRaw, 10) : 20;

  try {
    const data = await buildEvoGraph({ gens, methods, offset, limit });
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
    });
  } catch (error) {
    console.error('Evolution API error:', error);
    return NextResponse.json(
      { families: [] },
      { status: 500 }
    );
  }
}
