import { NextResponse } from 'next/server';
export const dynamic = 'force-static';
import type { MetaDataset, PokemonMeta } from '@/lib/meta/types';

function isPokemonMeta(v: any): v is PokemonMeta {
  return (
    v &&
    typeof v.id === 'number' &&
    typeof v.name === 'string' &&
    typeof v.usage === 'number' &&
    typeof v.winrate === 'number' &&
    Array.isArray(v.topMoves) &&
    typeof v.topItem === 'string' &&
    typeof v.topTeammate === 'string'
  );
}

function isMetaDataset(v: any): v is MetaDataset {
  return (
    v &&
    typeof v.format === 'string' &&
    typeof v.month === 'string' &&
    Array.isArray(v.top) &&
    v.top.every(isPokemonMeta)
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const format = url.searchParams.get('format') || 'OU';
  const month = url.searchParams.get('month') || '2024-08';

  const base = process.env.META_API_BASE || 'http://localhost:3001';
  const target = `${base}/meta?format=${encodeURIComponent(format)}&month=${encodeURIComponent(month)}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(target, { next: { revalidate: 3600 }, signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`Upstream responded ${res.status}`);
    const data = await res.json();
    if (isMetaDataset(data)) {
      return NextResponse.json(data, { headers: { 'Cache-Control': 'public, max-age=3600' } });
    }
    throw new Error('Validation failed');
  } catch (err) {
    // Return error response instead of mock data
    return NextResponse.json(
      { error: 'Meta data unavailable', message: 'Unable to fetch competitive meta data at this time' },
      { status: 503, headers: { 'Cache-Control': 'no-cache' } }
    );
  }
}
