import { NextRequest, NextResponse } from 'next/server'
import { getRedis, withTimeout } from '@/lib/server/upstashRedis'
import { CACHE_TTL } from '@/lib/memcached'
import { checkRateLimit, clientIpFromRequest } from '@/lib/server/rate-limit'
import { getRequestId, withRequestIdHeaders } from '@/lib/server/request-context'
import { logger } from '@/lib/server/logger'

const POKEAPI_BASE = 'https://pokeapi.co/api/v2'

/** Must match resources used in src/lib/api.ts */
const ALLOWED_ROOTS = new Set([
  'pokemon',
  'pokemon-species',
  'evolution-chain',
  'type',
  'ability',
  'move',
])

const TTL_SECONDS = CACHE_TTL.POKEMON_DETAIL
const MAX_SEGMENTS = 4
const MAX_PATH_CHARS = 120

function normalizeQuery(searchParams: URLSearchParams): string {
  const keys = Array.from(searchParams.keys()).sort()
  const sp = new URLSearchParams()
  for (const k of keys) {
    const vals = searchParams.getAll(k).sort()
    for (const v of vals) {
      sp.append(k, v)
    }
  }
  const s = sp.toString()
  return s ? `?${s}` : ''
}

function cacheKeyFor(pathname: string, queryKey: string): string {
  return `pokeapi:v2:${pathname}${queryKey}`
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  const requestId = getRequestId(request)
  const ip = clientIpFromRequest(request)
  const rl = await checkRateLimit(`pokeapi:${ip}`, 120, 60_000)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: withRequestIdHeaders(requestId) }
    )
  }

  const { path: rawPath } = await context.params
  const segments = (rawPath ?? []).filter(Boolean)
  if (segments.length === 0) {
    return NextResponse.json({ error: 'Missing path' }, { status: 400 })
  }
  if (segments.length > MAX_SEGMENTS || segments.join('/').length > MAX_PATH_CHARS) {
    return NextResponse.json({ error: 'Path too long' }, { status: 400 })
  }
  if (segments.some((s) => s.includes('..') || s.includes('\\'))) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }

  const root = segments[0]
  if (!ALLOWED_ROOTS.has(root)) {
    return NextResponse.json({ error: 'Unsupported resource' }, { status: 400 })
  }

  const pathname = segments.join('/')
  const queryKey = normalizeQuery(request.nextUrl.searchParams)
  const upstreamUrl = `${POKEAPI_BASE}/${pathname}${queryKey}`

  const redisKey = cacheKeyFor(pathname, queryKey)
  const redis = getRedis()
  const isDev = process.env.NODE_ENV === 'development'

  const cacheHeaders = {
    'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
  } as const

  if (redis) {
    try {
      const cached = await withTimeout(redis.get<string>(redisKey))
      if (cached != null && cached !== '') {
        const body = JSON.parse(cached) as unknown
        return NextResponse.json(body, {
          headers: {
            ...cacheHeaders,
            ...(isDev ? { 'x-cache': 'HIT' } : {}),
          },
        })
      }
    } catch {
      // ignore Redis read errors; fetch from origin
    }
  }

  const ac = new AbortController()
  const timeout = setTimeout(() => ac.abort(), 15000)
  let res: Response
  try {
    res = await fetch(upstreamUrl, {
      signal: ac.signal,
      headers: { Accept: 'application/json' },
    })
  } catch {
    logger.warn('Upstream PokeAPI fetch failed', { route: 'pokeapi', requestId, path: pathname })
    return NextResponse.json(
      { error: 'Upstream fetch failed' },
      { status: 502, headers: withRequestIdHeaders(requestId) }
    )
  } finally {
    clearTimeout(timeout)
  }

  const text = await res.text()

  if (!res.ok) {
    return new NextResponse(text, {
      status: res.status,
      headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json' },
    })
  }

  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON from upstream' }, { status: 502 })
  }

  if (redis) {
    try {
      await withTimeout(redis.set(redisKey, text, { ex: TTL_SECONDS }))
    } catch {
      // ignore cache write errors
    }
  }

  return NextResponse.json(json, {
    status: 200,
    headers: {
      ...cacheHeaders,
      ...(isDev ? { 'x-cache': 'MISS' } : {}),
    },
  })
}
