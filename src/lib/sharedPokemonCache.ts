import { Pokemon } from '@/types/pokemon'

/**
 * Shared Pokemon cache that works across main dex and detail pages
 * Replaces separate caches with a unified, efficient system
 */
class SharedPokemonCache {
  private cache = new Map<number, Pokemon>()
  private cacheTimestamps = new Map<number, number>()
  private preloadQueue = new Set<number>()
  private inFlightFetches = new Set<number>()
  private failedRequests = new Set<number>() // Track failed requests to prevent retries
  
  // Cache TTL: 10 minutes for in-memory cache
  private readonly CACHE_TTL = 10 * 60 * 1000
  
  // Maximum cache size to prevent memory issues
  private readonly MAX_CACHE_SIZE = 300
  
  /**
   * Get Pokemon from cache
   */
  get(id: number): Pokemon | null {
    // Don't return cached data for known failed requests
    if (this.failedRequests.has(id)) {
      return null
    }
    
    const cached = this.cache.get(id)
    const timestamp = this.cacheTimestamps.get(id)
    
    if (cached && timestamp && Date.now() - timestamp < this.CACHE_TTL) {
      return cached
    }
    
    // Remove expired entries
    if (cached) {
      this.cache.delete(id)
      this.cacheTimestamps.delete(id)
    }
    
    return null
  }
  
  /**
   * Set Pokemon in cache with LRU eviction
   */
  set(id: number, pokemon: Pokemon): void {
    // Evict old entries if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictOldest()
    }
    
    this.cache.set(id, pokemon)
    this.cacheTimestamps.set(id, Date.now())
    
    // Remove from failed requests if successfully cached
    this.failedRequests.delete(id)
  }
  
  /**
   * Mark a request as failed to prevent repeated attempts
   */
  markFailed(id: number): void {
    this.failedRequests.add(id)
    
    // Clean up failed requests after 5 minutes
    setTimeout(() => {
      this.failedRequests.delete(id)
    }, 5 * 60 * 1000)
  }
  
  /**
   * Check if a request has failed recently
   */
  hasFailed(id: number): boolean {
    return this.failedRequests.has(id)
  }
  
  /**
   * Check if Pokemon is cached and not expired
   */
  has(id: number): boolean {
    const cached = this.cache.get(id)
    const timestamp = this.cacheTimestamps.get(id)
    
    if (cached && timestamp && Date.now() - timestamp < this.CACHE_TTL) {
      return true
    }
    
    // Clean up expired entry
    if (cached) {
      this.cache.delete(id)
      this.cacheTimestamps.delete(id)
    }
    
    return false
  }
  
  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now()
    let expiredCount = 0
    
    for (const [id, timestamp] of this.cacheTimestamps) {
      if (now - timestamp >= this.CACHE_TTL) {
        expiredCount++
      }
    }
    
    return {
      totalEntries: this.cache.size,
      expiredEntries: expiredCount,
      validEntries: this.cache.size - expiredCount,
      memoryUsage: this.cache.size * 50, // Rough estimate in KB
      hitRate: this.calculateHitRate()
    }
  }
  
  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
    this.cacheTimestamps.clear()
    this.preloadQueue.clear()
    this.inFlightFetches.clear()
    this.failedRequests.clear()
  }
  
  /**
   * Preload Pokemon data in background
   */
  async preloadPokemon(ids: number[], concurrency = 4): Promise<void> {
    const queue = ids.filter(id => !this.has(id) && !this.inFlightFetches.has(id) && !this.hasFailed(id))
    
    if (queue.length === 0) return
    
    const workers: Promise<void>[] = []
    
    const runWorker = async () => {
      while (queue.length > 0) {
        const id = queue.shift()
        if (id == null) return
        
        if (this.inFlightFetches.has(id)) continue
        this.inFlightFetches.add(id)
        
        try {
          // Import dynamically to avoid circular dependencies
          const { getPokemon } = await import('@/lib/api')
          const pokemon = await getPokemon(id)
          this.set(id, pokemon)
        } catch (error) {
          console.warn(`Failed to preload Pokemon ${id}:`, error)
          // Mark as failed to prevent repeated attempts
          this.markFailed(id)
        } finally {
          this.inFlightFetches.delete(id)
        }
      }
    }
    
    const workerCount = Math.min(concurrency, queue.length)
    for (let i = 0; i < workerCount; i++) {
      workers.push(runWorker())
    }
    
    await Promise.all(workers)
  }
  
  /**
   * Preload popular Pokemon (Gen 1)
   */
  async preloadPopularPokemon(): Promise<void> {
    // Preload only the most popular Pokemon to prevent memory issues
    const popularPokemon = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 25, 26, 39, 40, 133, 134, 135, 136, 150, 151] // First 10 + popular ones
    await this.preloadPokemon(popularPokemon, 3) // Reduced concurrency
  }
  
  /**
   * Preload Pokemon around a given ID (for detail page navigation)
   */
  async preloadAroundId(id: number, range = 10): Promise<void> {
    const startId = Math.max(1, id - range)
    const endId = Math.min(1025, id + range)
    const idsToPreload = Array.from({ length: endId - startId + 1 }, (_, i) => startId + i)
    
    await this.preloadPokemon(idsToPreload, 4)
  }
  
  /**
   * Evict oldest cache entries (LRU)
   */
  private evictOldest(): void {
    let oldestId = -1
    let oldestTime = Date.now()
    
    for (const [id, timestamp] of this.cacheTimestamps) {
      if (timestamp < oldestTime) {
        oldestTime = timestamp
        oldestId = id
      }
    }
    
    if (oldestId !== -1) {
      this.cache.delete(oldestId)
      this.cacheTimestamps.delete(oldestId)
    }
  }
  
  /**
   * Calculate approximate hit rate (simplified)
   */
  private calculateHitRate(): number {
    // This is a simplified calculation
    // In a real implementation, you'd track hits/misses
    return this.cache.size > 0 ? Math.min(0.95, this.cache.size / 100) : 0
  }
}

// Export singleton instance
export const sharedPokemonCache = new SharedPokemonCache()

// Export types for TypeScript
export type SharedPokemonCacheStats = ReturnType<SharedPokemonCache['getStats']>

// Utility functions
export const cacheUtils = {
  /**
   * Get Pokemon from shared cache or fetch if not available
   */
  async getOrFetchPokemon(id: number): Promise<Pokemon | null> {
    // Check if this request has failed recently
    if (sharedPokemonCache.hasFailed(id)) {
      console.log(`🚫 Skipping failed request for Pokemon ${id}`)
      return null
    }
    
    // Check cache first
    const cached = sharedPokemonCache.get(id)
    if (cached) return cached
    
    // If not in cache, fetch it
    try {
      const { getPokemon } = await import('@/lib/api')
      const pokemon = await getPokemon(id)
      sharedPokemonCache.set(id, pokemon)
      return pokemon
    } catch (error) {
      console.warn(`Failed to fetch Pokemon ${id}:`, error)
      // Mark as failed to prevent repeated attempts
      sharedPokemonCache.markFailed(id)
      return null
    }
  },
  
  /**
   * Preload Pokemon for better UX
   */
  async preloadForDetailPage(pokemonId: number): Promise<void> {
    // Preload current Pokemon and surrounding ones
    await sharedPokemonCache.preloadAroundId(pokemonId, 5)
  },
  
  /**
   * Preload for main dex page
   */
  async preloadForMainDex(visibleIds: number[]): Promise<void> {
    // Preload visible Pokemon and some ahead
    const idsToPreload = [...visibleIds]
    
    // Add some Pokemon ahead of the visible ones
    const maxId = Math.max(...visibleIds)
    const aheadIds = Array.from({ length: 20 }, (_, i) => maxId + i + 1)
    idsToPreload.push(...aheadIds)
    
    await sharedPokemonCache.preloadPokemon(idsToPreload, 6)
  }
}

