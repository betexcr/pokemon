// Modern Frontend Caching Utilities
// Provides client-side caching strategies and cache management

export interface CacheConfig {
  maxAge: number // in milliseconds
  maxSize: number // maximum number of items
  strategy: 'memory' | 'localStorage' | 'sessionStorage' | 'indexedDB'
}

export interface CacheEntry<T> {
  data: T
  timestamp: number
  expires: number
  accessCount: number
  lastAccessed: number
}

// Memory cache implementation
class MemoryCache<T> {
  private cache = new Map<string, CacheEntry<T>>()
  private maxSize: number
  private maxAge: number

  constructor(maxSize = 100, maxAge = 5 * 60 * 1000) { // 5 minutes default
    this.maxSize = maxSize
    this.maxAge = maxAge
  }

  set(key: string, data: T, customMaxAge?: number): void {
    const now = Date.now()
    const expires = now + (customMaxAge || this.maxAge)
    
    // Remove expired entries
    this.cleanup()
    
    // If cache is full, remove least recently used item
    if (this.cache.size >= this.maxSize) {
      this.evictLRU()
    }
    
    this.cache.set(key, {
      data,
      timestamp: now,
      expires,
      accessCount: 0,
      lastAccessed: now
    })
  }

  get(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }
    
    const now = Date.now()
    
    // Check if expired
    if (now > entry.expires) {
      this.cache.delete(key)
      return null
    }
    
    // Update access statistics
    entry.accessCount++
    entry.lastAccessed = now
    
    return entry.data
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false
    
    const now = Date.now()
    if (now > entry.expires) {
      this.cache.delete(key)
      return false
    }
    
    return true
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    this.cleanup()
    return this.cache.size
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        this.cache.delete(key)
      }
    }
  }

  private evictLRU(): void {
    let oldestKey = ''
    let oldestTime = Date.now()
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed
        oldestKey = key
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  // Get cache statistics
  getStats() {
    this.cleanup()
    const entries = Array.from(this.cache.values())
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      totalAccesses: entries.reduce((sum, entry) => sum + entry.accessCount, 0),
      averageAccesses: entries.length > 0 ? entries.reduce((sum, entry) => sum + entry.accessCount, 0) / entries.length : 0,
      oldestEntry: entries.length > 0 ? Math.min(...entries.map(e => e.timestamp)) : null,
      newestEntry: entries.length > 0 ? Math.max(...entries.map(e => e.timestamp)) : null
    }
  }
}

// LocalStorage cache implementation
class LocalStorageCache<T> {
  private prefix: string
  private maxAge: number

  constructor(prefix = 'pokemon_cache_', maxAge = 24 * 60 * 60 * 1000) { // 24 hours default
    this.prefix = prefix
    this.maxAge = maxAge
  }

  set(key: string, data: T, customMaxAge?: number): void {
    try {
      const now = Date.now()
      const expires = now + (customMaxAge || this.maxAge)
      
      const entry: CacheEntry<T> = {
        data,
        timestamp: now,
        expires,
        accessCount: 0,
        lastAccessed: now
      }
      
      localStorage.setItem(this.prefix + key, JSON.stringify(entry))
    } catch (error) {
      console.warn('Failed to save to localStorage:', error)
    }
  }

  get(key: string): T | null {
    try {
      const stored = localStorage.getItem(this.prefix + key)
      if (!stored) return null
      
      const entry: CacheEntry<T> = JSON.parse(stored)
      const now = Date.now()
      
      // Check if expired
      if (now > entry.expires) {
        this.delete(key)
        return null
      }
      
      // Update access statistics
      entry.accessCount++
      entry.lastAccessed = now
      localStorage.setItem(this.prefix + key, JSON.stringify(entry))
      
      return entry.data
    } catch (error) {
      console.warn('Failed to read from localStorage:', error)
      return null
    }
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  delete(key: string): boolean {
    try {
      localStorage.removeItem(this.prefix + key)
      return true
    } catch (error) {
      console.warn('Failed to delete from localStorage:', error)
      return false
    }
  }

  clear(): void {
    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.warn('Failed to clear localStorage cache:', error)
    }
  }

  size(): number {
    try {
      const keys = Object.keys(localStorage)
      return keys.filter(key => key.startsWith(this.prefix)).length
    } catch (error) {
      console.warn('Failed to get localStorage cache size:', error)
      return 0
    }
  }
}

// Cache manager that combines multiple cache strategies
export class CacheManager<T> {
  private memoryCache: MemoryCache<T>
  private localStorageCache: LocalStorageCache<T>
  private strategy: 'memory' | 'localStorage' | 'hybrid'

  constructor(
    strategy: 'memory' | 'localStorage' | 'hybrid' = 'hybrid',
    memoryConfig = { maxSize: 100, maxAge: 5 * 60 * 1000 },
    localStorageConfig = { maxAge: 24 * 60 * 60 * 1000 }
  ) {
    this.strategy = strategy
    this.memoryCache = new MemoryCache(memoryConfig.maxSize, memoryConfig.maxAge)
    this.localStorageCache = new LocalStorageCache('pokemon_cache_', localStorageConfig.maxAge)
  }

  set(key: string, data: T, customMaxAge?: number): void {
    switch (this.strategy) {
      case 'memory':
        this.memoryCache.set(key, data, customMaxAge)
        break
      case 'localStorage':
        this.localStorageCache.set(key, data, customMaxAge)
        break
      case 'hybrid':
        this.memoryCache.set(key, data, customMaxAge)
        this.localStorageCache.set(key, data, customMaxAge)
        break
    }
  }

  get(key: string): T | null {
    switch (this.strategy) {
      case 'memory':
        return this.memoryCache.get(key)
      case 'localStorage':
        return this.localStorageCache.get(key)
      case 'hybrid':
        // Try memory first, then localStorage
        let data = this.memoryCache.get(key)
        if (data) return data
        
        data = this.localStorageCache.get(key)
        if (data) {
          // Promote to memory cache
          this.memoryCache.set(key, data)
          return data
        }
        return null
    }
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  delete(key: string): boolean {
    let deleted = false
    
    if (this.strategy === 'memory' || this.strategy === 'hybrid') {
      deleted = this.memoryCache.delete(key) || deleted
    }
    
    if (this.strategy === 'localStorage' || this.strategy === 'hybrid') {
      deleted = this.localStorageCache.delete(key) || deleted
    }
    
    return deleted
  }

  clear(): void {
    if (this.strategy === 'memory' || this.strategy === 'hybrid') {
      this.memoryCache.clear()
    }
    
    if (this.strategy === 'localStorage' || this.strategy === 'hybrid') {
      this.localStorageCache.clear()
    }
  }

  size(): number {
    switch (this.strategy) {
      case 'memory':
        return this.memoryCache.size()
      case 'localStorage':
        return this.localStorageCache.size()
      case 'hybrid':
        return Math.max(this.memoryCache.size(), this.localStorageCache.size())
    }
  }

  getStats() {
    return {
      strategy: this.strategy,
      memory: this.memoryCache.getStats(),
      localStorage: {
        size: this.localStorageCache.size()
      }
    }
  }
}

// Pokemon-specific cache instances
export const pokemonCache = new CacheManager<any>('hybrid', 
  { maxSize: 200, maxAge: 10 * 60 * 1000 }, // 10 minutes in memory
  { maxAge: 24 * 60 * 60 * 1000 } // 24 hours in localStorage
)

export const imageCache = new CacheManager<string>('hybrid',
  { maxSize: 500, maxAge: 30 * 60 * 1000 }, // 30 minutes in memory
  { maxAge: 7 * 24 * 60 * 60 * 1000 } // 7 days in localStorage
)

export const searchCache = new CacheManager<any[]>('memory',
  { maxSize: 50, maxAge: 5 * 60 * 1000 } // 5 minutes only
)

// Cache utilities
export const cacheUtils = {
  // Generate cache key for Pokemon data
  pokemonKey: (id: number) => `pokemon_${id}`,
  
  // Generate cache key for Pokemon list
  pokemonListKey: (limit: number, offset: number) => `pokemon_list_${limit}_${offset}`,
  
  // Generate cache key for search results
  searchKey: (query: string) => `search_${query.toLowerCase().trim()}`,
  
  // Generate cache key for Pokemon images
  imageKey: (url: string) => `image_${btoa(url)}`,
  
  // Check if cache is available
  isCacheAvailable: () => {
    try {
      return typeof Storage !== 'undefined' && typeof Map !== 'undefined'
    } catch {
      return false
    }
  },
  
  // Clear all Pokemon caches
  clearAll: () => {
    pokemonCache.clear()
    imageCache.clear()
    searchCache.clear()
  },
  
  // Get cache statistics
  getStats: () => ({
    pokemon: pokemonCache.getStats(),
    images: imageCache.getStats(),
    search: searchCache.getStats()
  })
}

// Prefetch utilities
export const prefetchUtils = {
  // Prefetch Pokemon data
  async prefetchPokemon(ids: number[]): Promise<void> {
    const promises = ids.map(async (id) => {
      const key = cacheUtils.pokemonKey(id)
      if (!pokemonCache.has(key)) {
        try {
          const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
          if (response.ok) {
            const data = await response.json()
            pokemonCache.set(key, data)
          }
        } catch (error) {
          console.warn(`Failed to prefetch Pokemon ${id}:`, error)
        }
      }
    })
    
    await Promise.allSettled(promises)
  },
  
  // Prefetch Pokemon images
  async prefetchImages(urls: string[]): Promise<void> {
    const promises = urls.map(async (url) => {
      const key = cacheUtils.imageKey(url)
      if (!imageCache.has(key)) {
        try {
          const response = await fetch(url)
          if (response.ok) {
            const blob = await response.blob()
            const objectUrl = URL.createObjectURL(blob)
            imageCache.set(key, objectUrl)
          }
        } catch (error) {
          console.warn(`Failed to prefetch image ${url}:`, error)
        }
      }
    })
    
    await Promise.allSettled(promises)
  }
}

export default CacheManager
