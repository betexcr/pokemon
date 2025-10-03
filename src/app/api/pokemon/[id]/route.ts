import { NextRequest, NextResponse } from 'next/server'
import { redisCache, getRedisCacheKey, REDIS_CACHE_TTL } from '@/lib/redis'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Generate cache key
    const cacheKey = getRedisCacheKey('pokemon', { id })
    
    // Check Redis cache first
    const cached = await redisCache.get(cacheKey)
    if (cached) {
      console.log('Redis cache hit for Pokemon:', id)
      return NextResponse.json(cached)
    }
    
    console.log('Redis cache miss for Pokemon:', id, '- fetching from PokeAPI')
    
    // Fetch from PokeAPI
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Pokemon not found' },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    
    // Cache in Redis for 24 hours
    await redisCache.set(cacheKey, data, REDIS_CACHE_TTL.POKEMON_DETAIL)
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching Pokemon:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
