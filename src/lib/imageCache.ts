'use client'

interface CachedImage {
  url: string
  blob: Blob
  timestamp: number
  size: number
}

interface ImageCacheConfig {
  maxMemoryItems: number // Maximum items in memory cache
  maxAge: number // Maximum age in milliseconds (default: 7 days)
  useServiceWorker: boolean // Use service worker for persistence
  useIndexedDB: boolean // Use IndexedDB for large storage
}

class ImageCache {
  private memoryCache = new Map<string, { url: string; timestamp: number }>() // URL -> {ObjectURL, timestamp}
  private config: ImageCacheConfig
  private useServiceWorker: boolean
  private useIndexedDB: boolean
  private cleanupInterval: ReturnType<typeof setInterval> | null = null

  constructor(config: Partial<ImageCacheConfig> = {}) {
    this.config = {
      maxMemoryItems: 150, // Reduced from 200 to prevent memory bloat
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      useServiceWorker: true,
      useIndexedDB: false, // Disabled for now, can be enabled later
      ...config
    }
    
    this.useServiceWorker = this.config.useServiceWorker && typeof window !== 'undefined' && 'serviceWorker' in navigator
    this.useIndexedDB = this.config.useIndexedDB && typeof window !== 'undefined' && 'indexedDB' in window
    
    this.initializeCache()
  }

  private initializeCache() {
    // Initialize cache and check service worker availability
    if (this.useServiceWorker) {
      this.checkServiceWorkerSupport()
    }
    
    // Start periodic cleanup of old cached images (every 5 minutes)
    if (typeof window !== 'undefined') {
      this.cleanupInterval = setInterval(() => {
        this.cleanupOldEntries()
      }, 5 * 60 * 1000)
    }
  }

  private cleanupOldEntries() {
    const now = Date.now()
    const entriesToDelete: string[] = []
    
    for (const [url, entry] of this.memoryCache.entries()) {
      // Remove entries older than half the maxAge
      if (now - entry.timestamp > (this.config.maxAge / 2)) {
        entriesToDelete.push(url)
      }
    }
    
    for (const url of entriesToDelete) {
      const entry = this.memoryCache.get(url)
      if (entry?.url) {
        URL.revokeObjectURL(entry.url)
      }
      this.memoryCache.delete(url)
    }
    
    if (entriesToDelete.length > 0) {
      console.log(`[ImageCache] Cleaned up ${entriesToDelete.length} old cached images`)
    }
  }

  private async checkServiceWorkerSupport() {
    try {
      if ('serviceWorker' in navigator && 'caches' in window) {
        console.log('Service Worker and Cache API available for image caching')
      } else {
        console.warn('Service Worker or Cache API not available, falling back to memory-only cache')
        this.useServiceWorker = false
      }
    } catch (error) {
      console.warn('Error checking service worker support:', error)
      this.useServiceWorker = false
    }
  }

  private manageMemoryCache() {
    // Aggressively clean up oldest items when exceeding max
    if (this.memoryCache.size > this.config.maxMemoryItems) {
      const entries = Array.from(this.memoryCache.entries())
      // Sort by timestamp (oldest first)
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
      
      // Remove oldest 25% of cache when limit exceeded
      const itemsToRemove = Math.ceil(this.config.maxMemoryItems * 0.25)
      
      for (let i = 0; i < itemsToRemove; i++) {
        const [url, entry] = entries[i]
        if (entry.url) {
          URL.revokeObjectURL(entry.url)
        }
        this.memoryCache.delete(url)
      }
      
      console.log(`[ImageCache] Memory cleanup: removed ${itemsToRemove} oldest images (cache size: ${this.memoryCache.size}/${this.config.maxMemoryItems})`)
    }
  }

  async getImage(url: string): Promise<string> {
    // 1. Check memory cache first (fastest)
    const cached = this.memoryCache.get(url)
    if (cached?.url) {
      // Update timestamp for LRU
      cached.timestamp = Date.now()
      return cached.url
    }

    // 2. Check service worker cache (persistent)
    if (this.useServiceWorker) {
      try {
        const cachedResponse = await caches.match(url)
        if (cachedResponse) {
          const blob = await cachedResponse.blob()
          const objectURL = URL.createObjectURL(blob)
          
          // Add to memory cache for faster future access
          this.memoryCache.set(url, { url: objectURL, timestamp: Date.now() })
          this.manageMemoryCache()
          
          console.log(`[ImageCache] Served from SW: ${url}`)
          return objectURL
        }
      } catch (error) {
        console.warn('[ImageCache] SW cache lookup failed:', error)
      }
    }

    // 3. Fetch from network
    try {
      const response = await fetch(url)
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`[ImageCache] Not found (404): ${url}`)
        } else {
          console.warn(`[ImageCache] Fetch failed: ${url} (${response.status})`)
        }
        return url // Return original URL on error
      }

      const blob = await response.blob()
      const objectURL = URL.createObjectURL(blob)

      // Add to memory cache
      this.memoryCache.set(url, { url: objectURL, timestamp: Date.now() })
      this.manageMemoryCache()

      // Service worker will automatically cache this response
      console.log(`[ImageCache] Fetched: ${url} (${(blob.size / 1024).toFixed(2)} KB)`)
      return objectURL

    } catch (error) {
      console.warn(`[ImageCache] Fetch failed for ${url}:`, error)
      return url // Return original URL on error
    }
  }

  // Preload images for better UX
  async preloadImages(urls: string[], maxConcurrent = 5): Promise<void> {
    const chunks = []
    for (let i = 0; i < urls.length; i += maxConcurrent) {
      chunks.push(urls.slice(i, i + maxConcurrent))
    }

    for (const chunk of chunks) {
      await Promise.allSettled(chunk.map(url => this.getImage(url)))
    }
  }

  // Get cache statistics
  getStats() {
    return {
      memoryItems: this.memoryCache.size,
      maxMemoryItems: this.config.maxMemoryItems,
      useServiceWorker: this.useServiceWorker,
      useIndexedDB: this.useIndexedDB,
      memoryUsage: (this.memoryCache.size / this.config.maxMemoryItems) * 100,
      cacheEfficiency: this.calculateCacheEfficiency(),
      lastUpdated: new Date().toISOString()
    }
  }

  private calculateCacheEfficiency() {
    // Simple efficiency calculation based on cache utilization
    const utilization = (this.memoryCache.size / this.config.maxMemoryItems) * 100
    return Math.min(100, Math.max(0, utilization))
  }

  async getServiceWorkerStats() {
    if (!this.useServiceWorker) return null
    
    try {
      const cache = await caches.open('pokemon-images-v1.0.3')
      const keys = await cache.keys()
      return {
        swCacheItems: keys.length,
        swCacheSize: keys.length, // Approximate
        swCacheUrls: keys.map(request => request.url).slice(0, 10) // First 10 URLs
      }
    } catch (error) {
      console.warn('Failed to get Service Worker cache stats:', error)
      return null
    }
  }

  // Clear all cached images properly
  clear() {
    // Revoke all object URLs to free memory
    for (const entry of this.memoryCache.values()) {
      if (entry.url) {
        URL.revokeObjectURL(entry.url)
      }
    }
    
    this.memoryCache.clear()
    
    // Clear service worker cache if available
    if (this.useServiceWorker && 'caches' in window) {
      caches.open('pokemon-images-v1.0.3').then(cache => {
        cache.keys().then(keys => {
          keys.forEach(request => {
            if (this.isPokemonImage(request.url)) {
              cache.delete(request).catch(err => 
                console.warn('[ImageCache] Failed to delete cache entry:', err)
              )
            }
          })
        }).catch(err => console.warn('[ImageCache] Failed to enumerate cache keys:', err))
      }).catch(err => console.warn('[ImageCache] Failed to open SW cache:', err))
    }
    
    console.log('[ImageCache] Cleared all cached images')
  }

  // Destructor-like cleanup
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.clear()
  }

  // Helper to check if URL is a Pokemon image
  private isPokemonImage(url: string): boolean {
    return url.includes('raw.githubusercontent.com/PokeAPI/sprites') ||
           url.includes('sprites.pmdcollab.org') ||
           url.includes('play.pokemonshowdown.com/sprites')
  }
}

// Create a singleton instance
export const imageCache = new ImageCache({
  maxMemoryItems: 300, // Keep 300 most recent images in memory for better performance
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  useServiceWorker: true, // Use service worker for persistence
  useIndexedDB: false // Disabled for now
})

// Helper function to get cached image URL
export async function getCachedImageUrl(url: string): Promise<string> {
  return imageCache.getImage(url)
}

// Helper function to preload Pokémon images
export async function preloadPokemonImages(pokemonIds: number[]): Promise<void> {
  const urls = pokemonIds.map(id => 
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${id}.png`
  )
  await imageCache.preloadImages(urls, 3) // Load 3 at a time to avoid overwhelming
}

// Popular Pokemon IDs for intelligent preloading
const POPULAR_POKEMON_IDS = [
  1, 4, 7, 25, 39, 52, 54, 58, 63, 66, 72, 74, 81, 84, 86, 88, 90, 92, 95, 96, 98, 100, 102, 104, 108, 109, 111, 113, 114, 115, 116, 118, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151
]

// Intelligent preloading based on user behavior and popularity
export async function preloadPopularPokemon(): Promise<void> {
  console.log('🚀 Preloading popular Pokemon images...')
  const startTime = performance.now()
  
  // Preload first 20 most popular Pokemon
  const popularIds = POPULAR_POKEMON_IDS.slice(0, 20)
  await preloadPokemonImages(popularIds)
  
  const endTime = performance.now()
  console.log(`✅ Preloaded ${popularIds.length} popular Pokemon images in ${(endTime - startTime).toFixed(2)}ms`)
}

// Preload Pokemon based on current viewport and scroll position
export async function preloadVisiblePokemon(visibleIds: number[]): Promise<void> {
  if (visibleIds.length === 0) return
  
  console.log(`🔍 Preloading ${visibleIds.length} visible Pokemon images...`)
  const startTime = performance.now()
  
  await preloadPokemonImages(visibleIds)
  
  const endTime = performance.now()
  console.log(`✅ Preloaded visible Pokemon images in ${(endTime - startTime).toFixed(2)}ms`)
}

// Preload Pokemon based on search patterns
export async function preloadSearchResults(searchTerm: string, resultIds: number[]): Promise<void> {
  if (resultIds.length === 0) return
  
  console.log(`🔍 Preloading search results for "${searchTerm}": ${resultIds.length} Pokemon`)
  const startTime = performance.now()
  
  // Preload first 10 search results
  const idsToPreload = resultIds.slice(0, 10)
  await preloadPokemonImages(idsToPreload)
  
  const endTime = performance.now()
  console.log(`✅ Preloaded search results in ${(endTime - startTime).toFixed(2)}ms`)
}

// Cache warming for frequently accessed Pokemon
export async function warmCache(): Promise<void> {
  console.log('🔥 Warming image cache...')
  const startTime = performance.now()
  
  try {
    // Warm cache with popular Pokemon
    await preloadPopularPokemon()
    
    // Warm cache with first generation Pokemon (1-151)
    const gen1Ids = Array.from({ length: 151 }, (_, i) => i + 1)
    const gen1Urls = gen1Ids.map(id => 
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${id}.png`
    )
    
    // Preload in batches to avoid overwhelming the network
    const batchSize = 10
    for (let i = 0; i < gen1Urls.length; i += batchSize) {
      const batch = gen1Urls.slice(i, i + batchSize)
      await imageCache.preloadImages(batch, 5) // 5 concurrent requests
      
      // Small delay between batches to be nice to the network
      if (i + batchSize < gen1Urls.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    
    const endTime = performance.now()
    console.log(`🔥 Cache warming completed in ${(endTime - startTime).toFixed(2)}ms`)
    
    // Log cache stats after warming
    const stats = imageCache.getStats()
    console.log('📊 Cache stats after warming:', stats)
    
  } catch (error) {
    console.error('❌ Cache warming failed:', error)
  }
}

// Progressive cache warming - warm cache in background
export function startProgressiveCacheWarming(): void {
  if (typeof window === 'undefined') return
  
  // Start warming after a short delay to not block initial page load
  setTimeout(async () => {
    try {
      await warmCache()
    } catch (error) {
      console.warn('Progressive cache warming failed:', error)
    }
  }, 2000) // 2 second delay
  
  console.log('🚀 Progressive cache warming started')
}

// Cache test utility available in development
// Access via: import { CacheTest } from '@/lib/cacheTest'
