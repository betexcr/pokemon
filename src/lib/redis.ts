import { Redis } from '@upstash/redis'

// Redis client configuration
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Cache configuration - Daily TTL (24 hours)
export const REDIS_CACHE_TTL = {
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
export function getRedisCacheKey(prefix: string, params: Record<string, any>): string {
  return `pokemon:${prefix}:${JSON.stringify(params)}`
}

// Redis cache operations
export class RedisCache {
  private redis: Redis

  constructor() {
    this.redis = redis
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const result = await this.redis.get(key)
      return result as T | null
    } catch (error) {
      console.error('Redis GET error:', error)
      return null
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    try {
      if (ttlSeconds) {
        await this.redis.setex(key, ttlSeconds, JSON.stringify(value))
      } else {
        await this.redis.set(key, JSON.stringify(value))
      }
      return true
    } catch (error) {
      console.error('Redis SET error:', error)
      return false
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      await this.redis.del(key)
      return true
    } catch (error) {
      console.error('Redis DEL error:', error)
      return false
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key)
      return result === 1
    } catch (error) {
      console.error('Redis EXISTS error:', error)
      return false
    }
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const results = await this.redis.mget(...keys)
      return results.map(result => result ? JSON.parse(result as string) : null)
    } catch (error) {
      console.error('Redis MGET error:', error)
      return keys.map(() => null)
    }
  }

  async mset(keyValuePairs: Record<string, any>, ttlSeconds?: number): Promise<boolean> {
    try {
      const pipeline = this.redis.pipeline()
      
      for (const [key, value] of Object.entries(keyValuePairs)) {
        if (ttlSeconds) {
          pipeline.setex(key, ttlSeconds, JSON.stringify(value))
        } else {
          pipeline.set(key, JSON.stringify(value))
        }
      }
      
      await pipeline.exec()
      return true
    } catch (error) {
      console.error('Redis MSET error:', error)
      return false
    }
  }

  async clearPattern(pattern: string): Promise<boolean> {
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

  async ping(): Promise<boolean> {
    try {
      const result = await this.redis.ping()
      return result === 'PONG'
    } catch (error) {
      console.error('Redis PING error:', error)
      return false
    }
  }

  async close(): Promise<void> {
    // Upstash Redis doesn't need explicit closing
  }
}

// Export singleton instance
export const redisCache = new RedisCache()

