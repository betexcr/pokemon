// Intelligent prefetching hook for Pokemon data
// Implements smart prefetching strategies based on user behavior

import { useEffect, useCallback, useRef } from 'react'
import { usePrefetchPokemon, useBackgroundSync } from '@/lib/react-query'
import { prefetchUtils } from '@/lib/cache'

interface PrefetchConfig {
  enabled: boolean
  maxConcurrent: number
  delay: number
  prefetchDistance: number
}

const DEFAULT_CONFIG: PrefetchConfig = {
  enabled: true,
  maxConcurrent: 3,
  delay: 1000,
  prefetchDistance: 5
}

export function useIntelligentPrefetching(config: Partial<PrefetchConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  const { prefetchPokemon, prefetchPokemonList } = usePrefetchPokemon()
  const { syncPokemonData } = useBackgroundSync()
  const prefetchQueue = useRef<Set<number>>(new Set())
  const isPrefetching = useRef(false)

  // Prefetch Pokemon data
  const prefetchPokemonData = useCallback(async (ids: number[]) => {
    if (!finalConfig.enabled || isPrefetching.current) return

    isPrefetching.current = true
    
    try {
      // Limit concurrent prefetches
      const limitedIds = ids.slice(0, finalConfig.maxConcurrent)
      
      // Add to queue to prevent duplicates
      limitedIds.forEach(id => prefetchQueue.current.add(id))
      
      // Prefetch using React Query
      const promises = limitedIds.map(id => prefetchPokemon(id))
      await Promise.allSettled(promises)
      
      // Also prefetch using cache utils for redundancy
      await prefetchUtils.prefetchPokemon(limitedIds)
      
    } catch (error) {
      console.warn('Prefetching failed:', error)
    } finally {
      isPrefetching.current = false
      // Clear queue
      limitedIds.forEach(id => prefetchQueue.current.delete(id))
    }
  }, [finalConfig.enabled, finalConfig.maxConcurrent, prefetchPokemon])

  // Prefetch Pokemon list data
  const prefetchPokemonListData = useCallback(async (limit: number, offset: number) => {
    if (!finalConfig.enabled) return

    try {
      await prefetchPokemonList(limit, offset)
    } catch (error) {
      console.warn('List prefetching failed:', error)
    }
  }, [finalConfig.enabled, prefetchPokemonList])

  // Prefetch based on current Pokemon ID (for pagination)
  const prefetchAdjacentPokemon = useCallback((currentId: number) => {
    if (!finalConfig.enabled) return

    const idsToPrefetch: number[] = []
    
    // Prefetch next and previous Pokemon
    for (let i = 1; i <= finalConfig.prefetchDistance; i++) {
      if (currentId + i <= 1025) {
        idsToPrefetch.push(currentId + i)
      }
      if (currentId - i >= 1) {
        idsToPrefetch.push(currentId - i)
      }
    }

    // Filter out already queued items
    const filteredIds = idsToPrefetch.filter(id => !prefetchQueue.current.has(id))
    
    if (filteredIds.length > 0) {
      setTimeout(() => {
        prefetchPokemonData(filteredIds)
      }, finalConfig.delay)
    }
  }, [finalConfig.enabled, finalConfig.prefetchDistance, finalConfig.delay, prefetchPokemonData])

  // Prefetch based on search results
  const prefetchSearchResults = useCallback((pokemonIds: number[]) => {
    if (!finalConfig.enabled) return

    // Prefetch first few results immediately
    const immediateIds = pokemonIds.slice(0, 3)
    const delayedIds = pokemonIds.slice(3, 8)

    if (immediateIds.length > 0) {
      prefetchPokemonData(immediateIds)
    }

    if (delayedIds.length > 0) {
      setTimeout(() => {
        prefetchPokemonData(delayedIds)
      }, finalConfig.delay * 2)
    }
  }, [finalConfig.enabled, finalConfig.delay, prefetchPokemonData])

  // Prefetch based on user interaction patterns
  const prefetchOnHover = useCallback((pokemonId: number) => {
    if (!finalConfig.enabled) return

    // Debounce hover events
    const timeoutId = setTimeout(() => {
      if (!prefetchQueue.current.has(pokemonId)) {
        prefetchPokemonData([pokemonId])
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [finalConfig.enabled, prefetchPokemonData])

  // Prefetch based on viewport intersection
  const prefetchOnViewport = useCallback((pokemonIds: number[]) => {
    if (!finalConfig.enabled) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pokemonId = parseInt(entry.target.getAttribute('data-pokemon-id') || '0')
            if (pokemonId && !prefetchQueue.current.has(pokemonId)) {
              prefetchPokemonData([pokemonId])
            }
          }
        })
      },
      { rootMargin: '200px' }
    )

    return observer
  }, [finalConfig.enabled, prefetchPokemonData])

  // Background sync for offline support
  const syncInBackground = useCallback(async (pokemonIds: number[]) => {
    if (!finalConfig.enabled) return

    try {
      await syncPokemonData(pokemonIds)
    } catch (error) {
      console.warn('Background sync failed:', error)
    }
  }, [finalConfig.enabled, syncPokemonData])

  return {
    prefetchPokemonData,
    prefetchPokemonListData,
    prefetchAdjacentPokemon,
    prefetchSearchResults,
    prefetchOnHover,
    prefetchOnViewport,
    syncInBackground,
    isPrefetching: isPrefetching.current,
    queueSize: prefetchQueue.current.size
  }
}

// Hook for prefetching Pokemon images
export function useImagePrefetching() {
  const imageCache = useRef<Set<string>>(new Set())

  const prefetchImages = useCallback(async (urls: string[]) => {
    const filteredUrls = urls.filter(url => !imageCache.current.has(url))
    
    if (filteredUrls.length === 0) return

    try {
      await prefetchUtils.prefetchImages(filteredUrls)
      filteredUrls.forEach(url => imageCache.current.add(url))
    } catch (error) {
      console.warn('Image prefetching failed:', error)
    }
  }, [])

  const prefetchPokemonImages = useCallback((pokemonId: number) => {
    const imageUrls = [
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`,
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${pokemonId}.png`,
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`
    ]

    prefetchImages(imageUrls)
  }, [prefetchImages])

  return {
    prefetchImages,
    prefetchPokemonImages
  }
}

// Hook for intelligent prefetching based on user behavior
export function useBehavioralPrefetching() {
  const { prefetchAdjacentPokemon, prefetchSearchResults } = useIntelligentPrefetching()
  const { prefetchPokemonImages } = useImagePrefetching()
  const userBehavior = useRef({
    lastPokemonId: 0,
    searchQueries: [] as string[],
    visitedPokemon: new Set<number>(),
    timeOnPage: 0
  })

  // Track user behavior
  const trackPokemonView = useCallback((pokemonId: number) => {
    const behavior = userBehavior.current
    
    if (behavior.lastPokemonId !== pokemonId) {
      behavior.visitedPokemon.add(pokemonId)
      behavior.lastPokemonId = pokemonId
      
      // Prefetch adjacent Pokemon
      prefetchAdjacentPokemon(pokemonId)
      
      // Prefetch images
      prefetchPokemonImages(pokemonId)
    }
  }, [prefetchAdjacentPokemon, prefetchPokemonImages])

  const trackSearch = useCallback((query: string, results: number[]) => {
    const behavior = userBehavior.current
    behavior.searchQueries.push(query)
    
    // Keep only last 10 queries
    if (behavior.searchQueries.length > 10) {
      behavior.searchQueries = behavior.searchQueries.slice(-10)
    }
    
    // Prefetch search results
    prefetchSearchResults(results)
  }, [prefetchSearchResults])

  const trackTimeOnPage = useCallback(() => {
    userBehavior.current.timeOnPage += 1
  }, [])

  // Get user behavior insights
  const getBehaviorInsights = useCallback(() => {
    const behavior = userBehavior.current
    
    return {
      totalVisited: behavior.visitedPokemon.size,
      lastPokemon: behavior.lastPokemonId,
      searchCount: behavior.searchQueries.length,
      timeOnPage: behavior.timeOnPage,
      mostVisited: Array.from(behavior.visitedPokemon).slice(-5)
    }
  }, [])

  return {
    trackPokemonView,
    trackSearch,
    trackTimeOnPage,
    getBehaviorInsights
  }
}

export default useIntelligentPrefetching
