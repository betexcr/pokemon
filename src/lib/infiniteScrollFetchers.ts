import { Pokemon } from '@/types/pokemon'
import { getPokemonWithPagination, getPokemonList, getPokemon, getPokemonPageSkeleton } from '@/lib/api'

/**
 * Secure Pokemon fetcher for main dex view (100 items per fetch)
 */
export async function fetchPokemonForMainDex(offset: number, limit: number): Promise<Pokemon[]> {
  try {
    const pokemon = await getPokemonWithPagination(limit, offset)
    
    // Validate the response
    if (!Array.isArray(pokemon)) {
      throw new Error('Invalid response format from API')
    }

    // Ensure all Pokemon have required properties
    const validatedPokemon = pokemon.filter(p => 
      p && 
      typeof p.id === 'number' && 
      typeof p.name === 'string' &&
      p.id > 0
    )

    if (validatedPokemon.length === 0) {
      return []
    }

    return validatedPokemon
  } catch (error) {
    console.error('Error fetching Pokemon for main dex:', error)
    throw new Error(`Failed to load Pokemon: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Lightweight skeleton fetcher for main dex (uses list endpoint only)
 * Returns real Pokémon ids/names with small images, details hydrated elsewhere
 */
export async function fetchPokemonSkeletonForMainDex(offset: number, limit: number): Promise<Pokemon[]> {
  return getPokemonWithPagination(limit, offset)
}

/**
 * Secure Pokemon fetcher for team/compare views (50 items per fetch)
 */
export async function fetchPokemonForTeamCompare(offset: number, limit: number): Promise<Pokemon[]> {
  try {
    const pokemonList = await getPokemonList(limit, offset)
    
    // Validate the response
    if (!pokemonList || !Array.isArray(pokemonList.results)) {
      throw new Error('Invalid response format from API')
    }

    if (pokemonList.results.length === 0) {
      return []
    }

    // Create basic Pokemon objects with minimal data
    const basicPokemon = pokemonList.results.map((pokemonRef) => {
      const url = (pokemonRef as { url?: string }).url || ''
      if (!url) return null
      const pokemonId = url.split('/').slice(-2)[0]
      const id = parseInt(pokemonId)
      
      // Validate ID
      if (isNaN(id) || id <= 0) {
        return null
      }

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
        types: [], // Will be populated when needed
        species: { name: pokemonRef.name, url: '' }
      } as Pokemon
    }).filter(Boolean) as Pokemon[]

    return basicPokemon
  } catch (error) {
    console.error('Error fetching Pokemon for team/compare:', error)
    throw new Error(`Failed to load Pokemon: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Secure Pokemon fetcher for PokemonSelector (30 items per fetch)
 */
export async function fetchPokemonForSelector(offset: number, limit: number): Promise<Pokemon[]> {
  try {
    const pokemonList = await getPokemonList(limit, offset)
    
    // Validate the response
    if (!pokemonList || !Array.isArray(pokemonList.results)) {
      throw new Error('Invalid response format from API')
    }

    if (pokemonList.results.length === 0) {
      return []
    }

    // Create basic Pokemon objects with minimal data
    const basicPokemon = pokemonList.results.map((pokemonRef) => {
      const url = (pokemonRef as { url?: string }).url || ''
      if (!url) return null
      const pokemonId = url.split('/').slice(-2)[0]
      const id = parseInt(pokemonId)
      
      // Validate ID
      if (isNaN(id) || id <= 0) {
        return null
      }

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
        types: [], // Will be populated when needed
        species: { name: pokemonRef.name, url: '' }
      } as Pokemon
    }).filter(Boolean) as Pokemon[]

    return basicPokemon
  } catch (error) {
    console.error('Error fetching Pokemon for selector:', error)
    throw new Error(`Failed to load Pokemon: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Enhanced Pokemon fetcher that enriches basic Pokemon with full details
 */
export async function fetchEnrichedPokemon(offset: number, limit: number): Promise<Pokemon[]> {
  try {
    // First get basic Pokemon list
    const basicPokemon = await fetchPokemonForMainDex(offset, limit)
    
    if (basicPokemon.length === 0) {
      return []
    }

    // Enrich with full details in batches to avoid overwhelming the API
    const batchSize = 10
    const enrichedPokemon: Pokemon[] = []
    
    for (let i = 0; i < basicPokemon.length; i += batchSize) {
      const batch = basicPokemon.slice(i, i + batchSize)
      const enrichedBatch = await Promise.allSettled(
        batch.map(async (pokemon) => {
          try {
            const fullPokemon = await getPokemon(pokemon.id)
            return fullPokemon
          } catch (error) {
            console.warn(`Failed to enrich Pokemon ${pokemon.id}:`, error)
            return pokemon // Return basic version if enrichment fails
          }
        })
      )
      
      enrichedPokemon.push(
        ...enrichedBatch
          .filter((result): result is PromiseFulfilledResult<Pokemon> => result.status === 'fulfilled')
          .map(result => result.value)
      )
    }

    return enrichedPokemon
  } catch (error) {
    console.error('Error fetching enriched Pokemon:', error)
    throw new Error(`Failed to load enriched Pokemon: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
