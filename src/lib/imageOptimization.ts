/**
 * Image Loading Optimization
 * 
 * Provides utilities for optimized image loading in the Pokedex view,
 * including lazy loading, prefetching, and blurhash support.
 */

/**
 * Image loading states
 */
export type ImageLoadState = 'idle' | 'loading' | 'loaded' | 'error'

/**
 * Create an intersection observer for lazy loading images
 */
export function createImageLazyLoadObserver(
  onIntersect: (element: HTMLImageElement, entry: IntersectionObserverEntry) => void,
  options: IntersectionObserverInit = {}
) {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '500px', // Start loading 500px before visible
    threshold: 0.01,
    ...options
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement
        onIntersect(img, entry)
      }
    })
  }, defaultOptions)

  return observer
}

/**
 * Prefetch an image URL by loading it in the background
 */
export function prefetchImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => reject(new Error(`Failed to prefetch image: ${url}`))
    img.src = url
  })
}

/**
 * Prefetch multiple images with concurrency limit
 */
export async function prefetchImages(urls: string[], concurrency = 3): Promise<void> {
  const results: Promise<void>[] = []
  
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency)
    const batchPromises = batch.map(url => 
      prefetchImage(url).catch(() => {
        // Silently fail for individual images
      })
    )
    await Promise.all(batchPromises)
  }
}

/**
 * Generate blurhash placeholder for images
 * Returns a data URL for a simple colored placeholder
 */
export function getPlaceholderDataUrl(color: string = '#e5e7eb'): string {
  // Create a simple single-color placeholder as a data URL
  // This is much faster than generating a blurhash
  const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null
  if (!canvas) return ''
  
  canvas.width = 10
  canvas.height = 10
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 10, 10)
  
  return canvas.toDataURL()
}

/**
 * Optimize image URL for different screen sizes and densities
 */
export function getOptimizedImageUrl(baseUrl: string, size: 'small' | 'medium' | 'large' = 'medium'): string {
  // Detect device pixel ratio for retina displays
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
  
  const sizeMap = {
    small: 100,
    medium: 200,
    large: 300
  }
  
  const sizePx = sizeMap[size]
  const actualSize = Math.round(sizePx * dpr)
  
  // For GitHub raw content, we can't do responsive images easily
  // So just return the base URL as-is
  // CDN providers would add query params here
  return baseUrl
}

/**
 * Image loading manager for batch loading with priority
 */
export class ImageLoadingManager {
  private loadedImages = new Set<string>()
  private failedImages = new Set<string>()
  private loadingImages = new Map<string, Promise<void>>()
  private readonly maxConcurrent = 4

  async loadImage(url: string): Promise<void> {
    // Return cached result
    if (this.loadedImages.has(url)) return Promise.resolve()
    if (this.failedImages.has(url)) return Promise.reject(new Error(`Failed to load: ${url}`))
    
    // Return existing loading promise
    if (this.loadingImages.has(url)) {
      return this.loadingImages.get(url)!
    }
    
    // Create new loading promise
    const promise = prefetchImage(url)
      .then(() => {
        this.loadedImages.add(url)
        this.loadingImages.delete(url)
      })
      .catch((error) => {
        this.failedImages.add(url)
        this.loadingImages.delete(url)
        throw error
      })
    
    this.loadingImages.set(url, promise)
    return promise
  }

  async loadImages(urls: string[]): Promise<void> {
    await prefetchImages(urls, this.maxConcurrent)
  }

  isLoaded(url: string): boolean {
    return this.loadedImages.has(url)
  }

  isFailed(url: string): boolean {
    return this.failedImages.has(url)
  }

  clear(): void {
    this.loadedImages.clear()
    this.failedImages.clear()
    this.loadingImages.clear()
  }

  getStats() {
    return {
      loaded: this.loadedImages.size,
      failed: this.failedImages.size,
      loading: this.loadingImages.size
    }
  }
}

// Export singleton instance
export const imageLoadingManager = new ImageLoadingManager()

/**
 * Smart image preloading for viewport
 * Preloads images for Pokemon that are about to enter viewport
 */
export function createViewportImagePreloader() {
  const preloadedUrls = new Set<string>()

  const preloadImagesForPokemon = async (pokemonIds: number[]) => {
    const urlsToPreload = pokemonIds
      .filter(id => !preloadedUrls.has(`pokemon-${id}`))
      .map(id => {
        preloadedUrls.add(`pokemon-${id}`)
        return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
      })

    if (urlsToPreload.length > 0) {
      // Preload asynchronously without blocking
      imageLoadingManager.loadImages(urlsToPreload).catch(() => {
        // Silently fail
      })
    }
  }

  return { preloadImagesForPokemon }
}
