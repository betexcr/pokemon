import { Redis } from '@upstash/redis'

// Redis client configuration with fallback
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null

// Cache configuration - Daily TTL (24 hours)
export const CACHE_TTL = {
  POKEMON_LIST: 24 * 60 * 60, // 24 hours in seconds
  POKEMON_DETAIL: 24 * 60 * 60, // 24 hours in seconds
  POKEMON_SPECIES: 24 * 60 * 60, // 24 hours in seconds
  EVOLUTION_CHAIN: 24 * 60 * 60, // 24 hours in seconds
  TYPE: 24 * 60 * 60, // 24 hours in seconds
  ABILITY: 24 * 60 * 60, // 24 hours in seconds
  MOVE: 24 * 60 * 60, // 24 hours in seconds
  POKEMON_SKELETONS: 24 * 60 * 60, // 24 hours in seconds
  POKEMON_TOTAL_COUNT: 24 * 60 * 60, // 24 hours in seconds
}

// Cache key generation
export function getCacheKey(prefix: string, params: Record<string, any>): string {
  return `pokemon:${prefix}:${JSON.stringify(params)}`
}

// Redis cache operations
export class RedisCache {
  private redis: Redis | null

  constructor(redisClient: Redis | null) {
    this.redis = redisClient
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) return null
    try {
      const result = await this.redis.get(key)
      // Upstash Redis returns objects directly, no need to parse JSON
      return result as T | null
    } catch (error) {
      console.error('Redis GET error:', error)
      return null
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    if (!this.redis) return false
    try {
      if (ttlSeconds) {
        await this.redis.setex(key, ttlSeconds, value)
      } else {
        await this.redis.set(key, value)
      }
      return true
    } catch (error) {
      console.error('Redis SET error:', error)
      return false
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.redis) return false
    try {
      await this.redis.del(key)
      return true
    } catch (error) {
      console.error('Redis DEL error:', error)
      return false
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.redis) return false
    try {
      const result = await this.redis.exists(key)
      return result === 1
    } catch (error) {
      console.error('Redis EXISTS error:', error)
      return false
    }
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (!this.redis) return keys.map(() => null)
    try {
      const results = await this.redis.mget(...keys)
      return results.map(result => result as T | null)
    } catch (error) {
      console.error('Redis MGET error:', error)
      return keys.map(() => null)
    }
  }

  async mset(keyValuePairs: Record<string, any>, ttlSeconds?: number): Promise<boolean> {
    if (!this.redis) return false
    try {
      if (ttlSeconds) {
        // Use pipeline for atomic operations with TTL
        const pipeline = this.redis.pipeline()
        for (const [key, value] of Object.entries(keyValuePairs)) {
          pipeline.setex(key, ttlSeconds, value)
        }
        await pipeline.exec()
      } else {
        await this.redis.mset(keyValuePairs)
      }
      return true
    } catch (error) {
      console.error('Redis MSET error:', error)
      return false
    }
  }

  // Batch operations for Pokemon data
  async getPokemonBatch(ids: number[]): Promise<Record<number, any>> {
    const keys = ids.map(id => getCacheKey('pokemon', { id }))
    const results = await this.mget(keys)
    
    const pokemonData: Record<number, any> = {}
    ids.forEach((id, index) => {
      if (results[index]) {
        pokemonData[id] = results[index]
      }
    })
    
    return pokemonData
  }

  async setPokemonBatch(pokemonData: Record<number, any>, ttlSeconds = CACHE_TTL.POKEMON_DETAIL): Promise<boolean> {
    const keyValuePairs: Record<string, any> = {}
    Object.entries(pokemonData).forEach(([id, data]) => {
      keyValuePairs[getCacheKey('pokemon', { id: parseInt(id) })] = data
    })
    
    return this.mset(keyValuePairs, ttlSeconds)
  }

  // Clear cache patterns
  async clearPattern(pattern: string): Promise<boolean> {
    if (!this.redis) return false
    try {
      const keys = await this.redis.keys(pattern)
      if (keys.length > 0) {
        await this.redis.del(...keys)
      }
      return true
    } catch (error) {
      console.error('Redis clear pattern error:', error)
      return false
    }
  }

  // Health check
  async ping(): Promise<boolean> {
    if (!this.redis) return false
    try {
      const result = await this.redis.ping()
      return result === 'PONG'
    } catch (error) {
      console.error('Redis ping error:', error)
      return false
    }
  }
}

// Export singleton instance
export const redisCache = new RedisCache(redis)

// Export redis client for direct operations if needed
export { redis }
