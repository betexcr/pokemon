import { NextRequest, NextResponse } from 'next/server'
import { redisCache, getRedisCacheKey, REDIS_CACHE_TTL } from '@/lib/redis'

export const dynamic = 'force-dynamic'
export const revalidate = 0 // No caching

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') || '100'
    const offset = searchParams.get('offset') || '0'
    
    // Generate cache key
    const cacheKey = getRedisCacheKey('pokemon-list', { limit, offset })
    
    // Check Redis cache first
    const cached = await redisCache.get(cacheKey)
    if (cached) {
      console.log('Redis cache hit for Pokemon list:', { limit, offset })
      return NextResponse.json(cached)
    }
    
    console.log('Redis cache miss for Pokemon list:', { limit, offset }, '- fetching from PokeAPI')
    
    // Fetch from PokeAPI
    const response = await fetch(
      `https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`
    )
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch Pokemon list' },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    
    // Cache in Redis for 1 hour (reduced from 24 hours to prevent stale data)
    await redisCache.set(cacheKey, data, 60 * 60)
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching Pokemon list:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

