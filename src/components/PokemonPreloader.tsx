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

    const preloadAround = async () => {
      try {
        await sharedPokemonCache.preloadAroundId(pokemonId, range)
      } catch (error) {
        console.warn(`Failed to preload Pokemon around ID ${pokemonId}:`, error)
      }
    }

    // Preload after component mounts
    preloadAround()
  }, [pokemonId, range])
}

/**
 * Hook for preloading visible Pokemon in a list
 * Useful for main dex page
 */
export function usePreloadVisiblePokemon(visibleIds: number[]) {
  useEffect(() => {
    if (!visibleIds.length || typeof window === 'undefined') return

    const preloadVisible = async () => {
      try {
        await sharedPokemonCache.preloadPokemon(visibleIds, 6)
      } catch (error) {
        console.warn('Failed to preload visible Pokemon:', error)
      }
    }

    // Debounce preloading to avoid excessive calls
    const timeoutId = setTimeout(preloadVisible, 500)

    return () => clearTimeout(timeoutId)
  }, [visibleIds])
}

