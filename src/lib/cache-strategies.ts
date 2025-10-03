// Advanced caching strategies for Pokemon data
// Implements different caching patterns for optimal performance

export interface CacheStrategy {
  name: string
  get<T>(key: string, fetcher: () => Promise<T>): Promise<T>
  set<T>(key: string, data: T, ttl?: number): Promise<void>
  invalidate(key: string): Promise<void>
}

// Stale While Revalidate Strategy
export class StaleWhileRevalidateStrategy implements CacheStrategy {
  name = 'stale-while-revalidate'
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private pendingRequests = new Map<string, Promise<any>>()

  async get<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key)
    const now = Date.now()

    // Return cached data if it exists and is not expired
    if (cached && now - cached.timestamp < cached.ttl) {
      // Trigger background revalidation if data is stale but not expired
      if (now - cached.timestamp > cached.ttl * 0.5) {
        this.revalidateInBackground(key, fetcher)
      }
      return cached.data
    }

    // If there's a pending request, wait for it
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!
    }

    // Fetch fresh data
    const request = this.fetchAndCache(key, fetcher)
    this.pendingRequests.set(key, request)

    try {
      const result = await request
      return result
    } finally {
      this.pendingRequests.delete(key)
    }
  }

  async set<T>(key: string, data: T, ttl = 5 * 60 * 1000): Promise<void> {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  async invalidate(key: string): Promise<void> {
    this.cache.delete(key)
    this.pendingRequests.delete(key)
  }

  private async fetchAndCache<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    try {
      const data = await fetcher()
      await this.set(key, data)
      return data
    } catch (error) {
      // If fetch fails, try to return stale data
      const cached = this.cache.get(key)
      if (cached) {
        console.warn(`Fetch failed for ${key}, returning stale data`)
        return cached.data
      }
      throw error
    }
  }

  private revalidateInBackground<T>(key: string, fetcher: () => Promise<T>): void {
    // Don't await this - let it run in background
    this.fetchAndCache(key, fetcher).catch(error => {
      console.warn(`Background revalidation failed for ${key}:`, error)
    })
  }
}

// Cache First Strategy
export class CacheFirstStrategy implements CacheStrategy {
  name = 'cache-first'
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

  async get<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key)
    const now = Date.now()

    if (cached && now - cached.timestamp < cached.ttl) {
      return cached.data
    }

    try {
      const data = await fetcher()
      await this.set(key, data)
      return data
    } catch (error) {
      // If fetch fails and we have cached data, return it even if expired
      if (cached) {
        console.warn(`Fetch failed for ${key}, returning expired cached data`)
        return cached.data
      }
      throw error
    }
  }

  async set<T>(key: string, data: T, ttl = 24 * 60 * 60 * 1000): Promise<void> {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  async invalidate(key: string): Promise<void> {
    this.cache.delete(key)
  }
}

// Network First Strategy
export class NetworkFirstStrategy implements CacheStrategy {
  name = 'network-first'
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

  async get<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    try {
      const data = await fetcher()
      await this.set(key, data)
      return data
    } catch (error) {
      // If network fails, try cache
      const cached = this.cache.get(key)
      if (cached) {
        console.warn(`Network failed for ${key}, returning cached data`)
        return cached.data
      }
      throw error
    }
  }

  async set<T>(key: string, data: T, ttl = 5 * 60 * 1000): Promise<void> {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  async invalidate(key: string): Promise<void> {
    this.cache.delete(key)
  }
}

// Write Through Strategy
export class WriteThroughStrategy implements CacheStrategy {
  name = 'write-through'
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private writeQueue = new Map<string, Promise<void>>()

  async get<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key)
    const now = Date.now()

    if (cached && now - cached.timestamp < cached.ttl) {
      return cached.data
    }

    const data = await fetcher()
    await this.set(key, data)
    return data
  }

  async set<T>(key: string, data: T, ttl = 5 * 60 * 1000): Promise<void> {
    // If there's already a write in progress, wait for it
    if (this.writeQueue.has(key)) {
      await this.writeQueue.get(key)
    }

    const writePromise = this.performWrite(key, data, ttl)
    this.writeQueue.set(key, writePromise)

    try {
      await writePromise
    } finally {
      this.writeQueue.delete(key)
    }
  }

  async invalidate(key: string): Promise<void> {
    this.cache.delete(key)
    this.writeQueue.delete(key)
  }

  private async performWrite<T>(key: string, data: T, ttl: number): Promise<void> {
    // Update cache immediately
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })

    // In a real implementation, this would also write to persistent storage
    // For now, we'll simulate this with a small delay
    await new Promise(resolve => setTimeout(resolve, 10))
  }
}

// Cache Strategy Manager
export class CacheStrategyManager {
  private strategies = new Map<string, CacheStrategy>()
  private defaultStrategy: CacheStrategy

  constructor() {
    this.defaultStrategy = new StaleWhileRevalidateStrategy()
    
    // Register default strategies
    this.registerStrategy('stale-while-revalidate', new StaleWhileRevalidateStrategy())
    this.registerStrategy('cache-first', new CacheFirstStrategy())
    this.registerStrategy('network-first', new NetworkFirstStrategy())
    this.registerStrategy('write-through', new WriteThroughStrategy())
  }

  registerStrategy(name: string, strategy: CacheStrategy): void {
    this.strategies.set(name, strategy)
  }

  getStrategy(name: string): CacheStrategy {
    return this.strategies.get(name) || this.defaultStrategy
  }

  // Pokemon-specific strategy selection
  getPokemonStrategy(dataType: 'pokemon' | 'list' | 'search' | 'image'): CacheStrategy {
    switch (dataType) {
      case 'pokemon':
        // Individual Pokemon data - use stale while revalidate for freshness
        return this.getStrategy('stale-while-revalidate')
      case 'list':
        // Pokemon lists - use cache first for performance
        return this.getStrategy('cache-first')
      case 'search':
        // Search results - use network first for accuracy
        return this.getStrategy('network-first')
      case 'image':
        // Images - use cache first with long TTL
        return this.getStrategy('cache-first')
      default:
        return this.defaultStrategy
    }
  }
}

// Global strategy manager instance
export const cacheStrategyManager = new CacheStrategyManager()

// Utility functions for different data types
export const pokemonCacheStrategies = {
  // Pokemon data with stale-while-revalidate
  async getPokemon<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const strategy = cacheStrategyManager.getPokemonStrategy('pokemon')
    return strategy.get(key, fetcher)
  },

  // Pokemon list with cache-first
  async getPokemonList<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const strategy = cacheStrategyManager.getPokemonStrategy('list')
    return strategy.get(key, fetcher)
  },

  // Search results with network-first
  async getSearchResults<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const strategy = cacheStrategyManager.getPokemonStrategy('search')
    return strategy.get(key, fetcher)
  },

  // Images with cache-first
  async getImage<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const strategy = cacheStrategyManager.getPokemonStrategy('image')
    return strategy.get(key, fetcher)
  }
}

// Cache warming utilities
export const cacheWarming = {
  // Warm cache with popular Pokemon
  async warmPopularPokemon(): Promise<void> {
    const popularIds = [1, 4, 7, 25, 39, 52, 54, 63, 66, 69, 72, 74, 77, 79, 81, 84, 86, 88, 90, 92]
    
    const promises = popularIds.map(id => 
      pokemonCacheStrategies.getPokemon(`pokemon_${id}`, async () => {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
        return response.json()
      })
    )

    await Promise.allSettled(promises)
  },

  // Warm cache with type data
  async warmTypeData(): Promise<void> {
    const types = ['normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying']
    
    const promises = types.map(type =>
      pokemonCacheStrategies.getPokemonList(`type_${type}`, async () => {
        const response = await fetch(`https://pokeapi.co/api/v2/type/${type}`)
        return response.json()
      })
    )

    await Promise.allSettled(promises)
  },

  // Warm cache with generation data
  async warmGenerationData(): Promise<void> {
    const generations = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    
    const promises = generations.map(gen =>
      pokemonCacheStrategies.getPokemonList(`generation_${gen}`, async () => {
        const response = await fetch(`https://pokeapi.co/api/v2/generation/${gen}`)
        return response.json()
      })
    )

    await Promise.allSettled(promises)
  }
}

export default cacheStrategyManager
