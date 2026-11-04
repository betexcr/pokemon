import { NextRequest, NextResponse } from 'next/server'
import { PopularityNotFoundError, getPokemonPopularity } from '@/lib/trends/popularityService'
import { toSpeciesSlug } from '@/lib/trends/wikipedia'
import { checkRateLimit, clientIpFromRequest } from '@/lib/server/rate-limit'

export const runtime = 'nodejs'

/**
 * GET /api/trends/popularity?pokemon=pikachu
 * Real popularity trend for one species from Wikipedia pageviews.
 */
export async function GET(req: NextRequest) {
  const ip = clientIpFromRequest(req)
  const rl = await checkRateLimit(`trends-popularity:${ip}`, 60, 60_000, { onRedisError: 'memory' })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const raw = req.nextUrl.searchParams.get('pokemon') ?? ''
  const slug = /^\d{1,4}$/.test(raw.trim()) ? String(Number(raw.trim())) : toSpeciesSlug(raw)
  if (!slug || slug.length > 40) {
    return NextResponse.json({ error: 'Missing or invalid "pokemon" parameter' }, { status: 400 })
  }

  try {
    const data = await getPokemonPopularity(slug)
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=43200, stale-while-revalidate=86400' },
    })
  } catch (error) {
    if (error instanceof PopularityNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    console.error('trends/popularity failed:', error)
    return NextResponse.json({ error: 'Failed to load popularity data' }, { status: 502 })
  }
}
