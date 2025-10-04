import { NextRequest, NextResponse } from 'next/server'
import { redisCache, getRedisCacheKey, REDIS_CACHE_TTL } from '@/lib/redis'

export const dynamic = 'force-static'
export const revalidate = 86400 // 24 hours

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Generate cache key
    const cacheKey = getRedisCacheKey('ability', { id })
    
    // Check Redis cache first
    const cached = await redisCache.get(cacheKey)
    if (cached) {
      console.log('Redis cache hit for Ability:', id)
      return NextResponse.json(cached)
    }
    
    console.log('Redis cache miss for Ability:', id, '- fetching from PokeAPI')
    
    // Fetch from PokeAPI
    const response = await fetch(`https://pokeapi.co/api/v2/ability/${id}`)
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Ability not found' },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    
    // Cache in Redis for 24 hours
    await redisCache.set(cacheKey, data, REDIS_CACHE_TTL.ABILITY)
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching Ability:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

