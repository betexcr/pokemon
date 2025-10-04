import { NextRequest, NextResponse } from 'next/server'
import { redisCache, getRedisCacheKey, REDIS_CACHE_TTL } from '@/lib/redis'

export const dynamic = 'force-static'
export const revalidate = 86400 // 24 hours

export async function GET(request: NextRequest) {
  try {
    // Generate cache key
    const cacheKey = getRedisCacheKey('pokemon-total-count', {})
    
    // Check Redis cache first
    const cached = await redisCache.get(cacheKey)
    if (cached) {
      console.log('Redis cache hit for Pokemon total count')
      return NextResponse.json(cached)
    }
    
    console.log('Redis cache miss for Pokemon total count - fetching from PokeAPI')
    
    // Fetch from PokeAPI
    const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1')
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch Pokemon count' },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    const totalCount = data.count
    
    // Cache in Redis for 24 hours
    await redisCache.set(cacheKey, { count: totalCount }, REDIS_CACHE_TTL.POKEMON_TOTAL_COUNT)
    
    return NextResponse.json({ count: totalCount })
  } catch (error) {
    console.error('Error fetching Pokemon total count:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

