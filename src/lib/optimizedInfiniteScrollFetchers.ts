import { Pokemon } from '@/types/pokemon'
import { getPokemonWithPagination, getPokemonList, getPokemon, getPokemonPageSkeleton } from '@/lib/api'
import { ensureTypeCache, applyCachedTypes, cachePokemonTypes } from '@/lib/typeCache'
import { sharedPokemonCache } from '@/lib/sharedPokemonCache'

// Use shared cache instead of separate caches
const inFlightDetailFetches = new Set<number>()

async function fetchAndCachePokemonDetails(ids: number[], concurrency = 4) {
  const queue = [...ids]
  const workers: Promise<void>[] = []

  const runWorker = async () => {
    while (queue.length > 0) {
      const id = queue.shift()
      if (id == null) return
      if (inFlightDetailFetches.has(id)) continue
      inFlightDetailFetches.add(id)
      try {
        const fullPokemon = await getPokemon(id)
        sharedPokemonCache.set(id, fullPokemon)
        cachePokemonTypes(
          id,
          (fullPokemon.types || []).map(t => t.type?.name).filter(Boolean)
        )
      } catch (error) {
        console.warn(`Failed to fetch full data for Pokémon ${id}:`, error)
      } finally {
        inFlightDetailFetches.delete(id)
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
 * Optimized Pokemon fetcher for main dex with smaller batches, cached types, and throttled detail hydration
 */
export async function fetchOptimizedPokemonForMainDex(offset: number, limit: number): Promise<Pokemon[]> {
  try {
    const optimizedLimit = Math.min(limit, 20)
    await ensureTypeCache()

    const skeletonData = await getPokemonPageSkeleton(optimizedLimit)

    if (Array.isArray(skeletonData) && skeletonData.length > 0) {
      const enrichedFromCache = skeletonData.map(pokemon => {
        const cached = sharedPokemonCache.get(pokemon.id)
        if (cached) {
          return applyCachedTypes(cached)
        }
        const withTypes = applyCachedTypes(pokemon)
        sharedPokemonCache.set(pokemon.id, withTypes)
        return withTypes
      })

      const idsNeedingDetail = enrichedFromCache
        .filter(pokemon => (pokemon.stats?.length || 0) === 0 || pokemon.height === 0 || pokemon.weight === 0)
        .map(pokemon => pokemon.id)
        .filter(id => !inFlightDetailFetches.has(id))

      if (idsNeedingDetail.length > 0) {
        await fetchAndCachePokemonDetails(idsNeedingDetail, 6)
      }

      const finalData = enrichedFromCache.map(pokemon => {
        const cached = sharedPokemonCache.get(pokemon.id)
        if (cached) {
          return applyCachedTypes(cached)
        }
        return pokemon
      })

      return finalData
    }

    const fallbackData = await getPokemonWithPagination(optimizedLimit, offset)

    if (Array.isArray(fallbackData) && fallbackData.length > 0) {
      fallbackData.forEach(pokemon => {
        sharedPokemonCache.set(pokemon.id, pokemon)
        cachePokemonTypes(
          pokemon.id,
          (pokemon.types || []).map(t => t.type?.name).filter(Boolean)
        )
      })

      return fallbackData.filter(pokemon => pokemon && typeof pokemon.id === 'number' && pokemon.id > 0)
    }

    return []
  } catch (error) {
    console.error('Error fetching optimized Pokemon for main dex:', error)
    throw new Error(`Failed to load Pokemon: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export function getCachedPokemon(id: number): Pokemon | undefined {
  const cached = sharedPokemonCache.get(id)
  if (!cached) return undefined
  return applyCachedTypes(cached)
}

/**
 * Ultra-lightweight fetcher for initial load (10 items)
 * Returns minimal data for fastest initial render
 */
export async function fetchInitialPokemon(offset: number, limit: number): Promise<Pokemon[]> {
  try {
    const optimizedLimit = Math.min(limit, 10)
    
    // Get basic list data first
    const listData = await getPokemonList(optimizedLimit, offset)
    
    if (!listData || !Array.isArray(listData.results)) {
      return []
    }
    
    // Create minimal Pokemon objects for fast rendering
    const minimalPokemon = listData.results.map((pokemonRef) => {
      const url = (pokemonRef as { url?: string }).url || ''
      if (!url) return null
      
      const pokemonId = url.split('/').slice(-2)[0]
      const id = parseInt(pokemonId)
      
      if (isNaN(id) || id <= 0) return null
      
      return {
        id,
        name: pokemonRef.name,
        base_experience: 0,
        height: 0,
        weight: 0,
        is_default: true,
        order: id,
        abilities: [],
        forms: [],
        game_indices: [],
        held_items: [],
        location_area_encounters: '',
        moves: [],
        sprites: {
          front_default: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`,
          front_shiny: null,
          front_female: null,
          front_shiny_female: null,
          back_default: null,
          back_shiny: null,
          back_female: null,
          back_shiny_female: null,
          other: {
            dream_world: { front_default: null, front_female: null },
            home: { front_default: null, front_female: null, front_shiny: null, front_shiny_female: null },
            'official-artwork': {
              front_default: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`,
              front_shiny: null
            }
          }
        },
        stats: [],
        types: [], // Will be populated on demand
        species: { name: pokemonRef.name, url: '' }
      } as Pokemon
    }).filter(Boolean) as Pokemon[]
    
    // Cache the minimal data
    minimalPokemon.forEach(pokemon => {
      sharedPokemonCache.set(pokemon.id, pokemon)
    })
    
    return minimalPokemon
  } catch (error) {
    console.error('Error fetching initial Pokemon:', error)
    throw new Error(`Failed to load initial Pokemon: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Progressive enhancement fetcher
 * Loads basic data first, then enhances with full details in background
 */
export async function fetchProgressivePokemon(offset: number, limit: number): Promise<Pokemon[]> {
  try {
    // Start with minimal data for fast initial render
    const basicData = await fetchInitialPokemon(offset, limit)
    
    if (basicData.length === 0) {
      return []
    }
    
    // Enhance with full details in background (non-blocking)
    setTimeout(async () => {
      try {
        const enhancedData = await Promise.allSettled(
          basicData.map(async (pokemon) => {
            // Skip if already enhanced
            if (pokemon.types?.length > 0 && pokemon.stats?.length > 0) {
              return pokemon
            }
            
            try {
              const fullPokemon = await getPokemon(pokemon.id)
              // Update cache with enhanced data
              sharedPokemonCache.set(pokemon.id, fullPokemon)
              return fullPokemon
            } catch (error) {
              console.warn(`Failed to enhance Pokemon ${pokemon.id}:`, error)
              return pokemon
            }
          })
        )
        
        // Update cache with any successfully enhanced data
        enhancedData.forEach((result) => {
          if (result.status === 'fulfilled' && result.value) {
            sharedPokemonCache.set(result.value.id, result.value)
          }
        })
      } catch (error) {
        console.warn('Background enhancement failed:', error)
      }
    }, 100) // Small delay to not block initial render
    
    return basicData
  } catch (error) {
    console.error('Error fetching progressive Pokemon:', error)
    throw new Error(`Failed to load progressive Pokemon: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Smart fetcher that adapts based on scroll position and device capabilities
 */
export async function fetchAdaptivePokemon(offset: number, limit: number, scrollPosition?: number): Promise<Pokemon[]> {
  try {
    // Detect device capabilities
    const isLowEndDevice = typeof window !== 'undefined' && (
      navigator.hardwareConcurrency < 4 || 
      (navigator as any).deviceMemory < 4 ||
      window.innerWidth < 768
    )
    
    // Adjust batch size based on device and scroll position
    let adaptiveLimit = limit
    
    if (isLowEndDevice) {
      adaptiveLimit = Math.min(limit, 10)
    } else if (scrollPosition && scrollPosition > 1000) {
      // Load more items when user has scrolled far
      adaptiveLimit = Math.min(limit, 30)
    } else {
      adaptiveLimit = Math.min(limit, 20)
    }
    
    // Use progressive loading for better UX
    return await fetchProgressivePokemon(offset, adaptiveLimit)
  } catch (error) {
    console.error('Error fetching adaptive Pokemon:', error)
    throw new Error(`Failed to load adaptive Pokemon: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Clear cache function for memory management
 */
export function clearPokemonCache(): void {
  sharedPokemonCache.clear()
}

/**
 * Get cache statistics for debugging
 */
export function getCacheStats() {
  return sharedPokemonCache.getStats()
}
