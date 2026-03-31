'use client'

import { useEffect } from 'react'
import { sharedPokemonCache } from '@/lib/sharedPokemonCache'

/**
 * Component that handles preloading popular Pokemon on app startup
 * Runs in the background to improve user experience
 */
export default function PokemonPreloader() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const preloadEssentials = async () => {
      try {
        const { preloadTypeData, buildSearchIndex } = await import('@/lib/offlinePrefetch')
        await preloadTypeData()
        await buildSearchIndex()
      } catch {
        // non-critical
      }
    }

    const timeoutId = setTimeout(preloadEssentials, 3000)
    return () => clearTimeout(timeoutId)
  }, [])

  // This component doesn't render anything
  return null
}

/**
 * Hook for preloading Pokemon around a specific ID
 * Useful for detail page navigation
 */
export function usePreloadAroundId(pokemonId: number, range = 5) {
  useEffect(() => {
    if (!pokemonId || typeof window === 'undefined') return

    let cancelled = false
    const preloadAround = async () => {
      try {
        await sharedPokemonCache.preloadAroundId(pokemonId, range)
      } catch (error) {
        if (cancelled) return
        console.warn(`Failed to preload Pokemon around ID ${pokemonId}:`, error)
      }
    }

    preloadAround()
    return () => { cancelled = true }
  }, [pokemonId, range])
}


