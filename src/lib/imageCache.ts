'use client'

interface CachedImage {
  url: string
  blob: Blob
  timestamp: number
  size: number
}

interface ImageCacheConfig {
  maxSize: number // Maximum cache size in bytes (default: 50MB)
  maxAge: number // Maximum age in milliseconds (default: 7 days)
  maxImages: number // Maximum number of images to cache
}

class ImageCache {
  private cache = new Map<string, CachedImage>()
  private config: ImageCacheConfig
  private currentSize = 0

  constructor(config: Partial<ImageCacheConfig> = {}) {
    this.config = {
      maxSize: 50 * 1024 * 1024, // 50MB
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      maxImages: 1000, // 1000 images
      ...config
    }
    
    this.loadFromStorage()
    this.startCleanupInterval()
  }

  private loadFromStorage() {
    try {
      if (typeof window === 'undefined') return
      const stored = window.localStorage.getItem('pokemon-image-cache')
      if (stored) {
        const data = JSON.parse(stored)
        this.currentSize = data.size || 0
        
        // Note: We can't store Blobs in localStorage, so we'll rebuild the cache
        // by re-fetching images as needed. The stored data helps us track what we've cached.
        console.log('Image cache metadata loaded from storage')
      }
    } catch (error) {
      console.warn('Failed to load image cache from storage:', error)
    }
  }

  private saveToStorage() {
    try {
      if (typeof window === 'undefined') return
      const metadata = {
        size: this.currentSize,
        count: this.cache.size,
        timestamp: Date.now()
      }
      window.localStorage.setItem('pokemon-image-cache', JSON.stringify(metadata))
    } catch (error) {
      console.warn('Failed to save image cache metadata:', error)
    }
  }

  private startCleanupInterval() {
    // Clean up expired images every hour
    if (typeof window !== 'undefined') {
      // Temporarily disable cleanup to prevent errors
      // setInterval(() => {
      //   this.cleanup()
      // }, 60 * 60 * 1000)
    }
  }

  private cleanup() {
    const now = Date.now()
    const expiredKeys: string[] = []
    
    // Remove expired images
    for (const [key, image] of this.cache.entries()) {
      if (now - image.timestamp > this.config.maxAge) {
        expiredKeys.push(key)
        this.currentSize -= image.size
      }
    }
    
    expiredKeys.forEach(key => this.cache.delete(key))
    
    // Remove oldest images if we exceed size or count limits
    let toRemove = 0
    if (this.currentSize > this.config.maxSize || this.cache.size > this.config.maxImages) {
      const sortedEntries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
      
      toRemove = Math.max(
        this.cache.size - this.config.maxImages,
        Math.ceil((this.currentSize - this.config.maxSize) / (this.currentSize / this.cache.size))
      )
      
      for (let i = 0; i < toRemove && i < sortedEntries.length; i++) {
        const [key, image] = sortedEntries[i]
        this.cache.delete(key)
        this.currentSize -= image.size
      }
    }
    
    if (expiredKeys.length > 0 || toRemove > 0) {
      console.log(`Image cache cleanup: removed ${expiredKeys.length + toRemove} images`)
      this.saveToStorage()
    }
  }

  async getImage(url: string): Promise<string> {
    // Check if we have it in cache
    const cached = this.cache.get(url)
    if (cached && Date.now() - cached.timestamp < this.config.maxAge) {
      return URL.createObjectURL(cached.blob)
    }

    // Fetch and cache the image
    try {
      const response = await fetch(url)
      if (!response.ok) {
        // Handle 404 and other errors gracefully
        if (response.status === 404) {
          console.warn(`Image not found (404): ${url}`)
        } else {
          console.warn(`Failed to fetch image: ${url} (${response.status})`)
        }
        return url // Return original URL on error
      }

      const blob = await response.blob()
      const size = blob.size

      // Check if we have space for this image
      if (size > this.config.maxSize) {
        console.warn(`Image too large to cache: ${url} (${size} bytes)`)
        return url // Return original URL for very large images
      }

      // Make space if needed
      while (this.currentSize + size > this.config.maxSize && this.cache.size > 0) {
        const oldestEntry = Array.from(this.cache.entries())
          .sort((a, b) => a[1].timestamp - b[1].timestamp)[0]
        if (oldestEntry) {
          this.cache.delete(oldestEntry[0])
          this.currentSize -= oldestEntry[1].size
        }
      }

      // Add to cache
      const cachedImage: CachedImage = {
        url,
        blob,
        timestamp: Date.now(),
        size
      }

      this.cache.set(url, cachedImage)
      this.currentSize += size
      this.saveToStorage()

      console.log(`Cached image: ${url} (${size} bytes)`)
      return URL.createObjectURL(blob)

    } catch (error) {
      console.warn(`Failed to cache image ${url}:`, error)
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
      size: this.currentSize,
      count: this.cache.size,
      maxSize: this.config.maxSize,
      maxImages: this.config.maxImages,
      usage: (this.currentSize / this.config.maxSize) * 100
    }
  }

  // Clear all cached images
  clear() {
    // Revoke all object URLs to free memory
    for (const image of this.cache.values()) {
      URL.revokeObjectURL(URL.createObjectURL(image.blob))
    }
    
    this.cache.clear()
    this.currentSize = 0
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('pokemon-image-cache')
    }
    console.log('Image cache cleared')
  }
}

// Create a singleton instance
export const imageCache = new ImageCache({
  maxSize: 30 * 1024 * 1024, // 30MB for Pokémon images
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  maxImages: 500 // 500 Pokémon images
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
