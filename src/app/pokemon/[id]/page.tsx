import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import PokemonPageClient from './PokemonPageClient'
import { getPokemonById, getAllValidPokemonIds } from '@/lib/api'
import { cacheUtils } from '@/lib/sharedPokemonCache'

// Preload evolution chain Pokemon for faster navigation
async function preloadEvolutionChain(pokemon: any) {
  try {
    // This will be called in the background and won't block the page render
    const { getEvolutionChainNodes } = await import('@/lib/api')
    const evolutionChain = await getEvolutionChainNodes(pokemon.id)
    
    if (evolutionChain && evolutionChain.length > 0) {
      // Preload Pokemon in the evolution chain
      const evolutionIds = evolutionChain.map((evo: any) => evo.id).filter(Boolean)
      if (evolutionIds.length > 0) {
        console.log(`🔄 Preloading evolution chain Pokemon: ${evolutionIds.join(', ')}`)
        await cacheUtils.preloadForDetailPage(evolutionIds[0]) // Preload first evolution
      }
    }
  } catch (error) {
    // Don't let preloading errors affect the main page
    console.debug('Failed to preload evolution chain:', error)
  }
}

export async function generateStaticParams() {
  try {
    // Get all valid Pokemon IDs from the API
    const validPokemonIds = await getAllValidPokemonIds()
    return validPokemonIds.map(id => ({ 
      id: id.toString() 
    }))
  } catch (error) {
    console.error('Failed to generate static params:', error)
    // Fallback to a reasonable range if the API fails
    const fallbackIds = Array.from({ length: 1000 }, (_, i) => i + 1)
    return fallbackIds.map(id => ({ 
      id: id.toString() 
    }))
  }
}

export async function generateMetadata(props: any): Promise<Metadata> {
  const params = await props.params
  const pokemonId = parseInt(params?.id ?? '', 10)
  
  if (isNaN(pokemonId) || pokemonId < 1) {
    return {
      title: 'Pokémon Not Found',
      description: 'The requested Pokémon could not be found.'
    }
  }

  try {
    // Use the same cached data that will be used by the main component
    const pokemon = await cacheUtils.getOrFetchPokemon(pokemonId)
    
    if (!pokemon) {
      return {
        title: 'Pokémon Not Found',
        description: 'The requested Pokémon could not be found.'
      }
    }
    
    const capitalizedName = pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)
    
    return {
      title: `${capitalizedName} - Pokémon Details`,
      description: `Learn about ${capitalizedName}, a ${pokemon.types.map(t => t.type.name).join('/')} type Pokémon.`,
      openGraph: {
        title: `${capitalizedName} - Pokémon Details`,
        description: `Learn about ${capitalizedName}, a ${pokemon.types.map(t => t.type.name).join('/')} type Pokémon.`,
        images: [
          {
            url: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`,
            width: 475,
            height: 475,
            alt: pokemon.name
          }
        ]
      }
    }
  } catch (error) {
    console.error('Failed to generate metadata for Pokemon:', pokemonId, error)
    // Log the error for debugging in production
    if (process.env.NODE_ENV === 'production') {
      console.error('Production metadata error details:', {
        pokemonId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
    }
    return {
      title: 'Pokémon Not Found',
      description: 'The requested Pokémon could not be found.'
    }
  }
}

export default async function PokemonPage(props: any) {
  const params = await props.params
  const pokemonId = parseInt(params?.id ?? '', 10)
  
  if (isNaN(pokemonId) || pokemonId < 1) {
    notFound()
  }

  try {
    // The Pokemon data should already be cached from generateMetadata
    // This will be a cache hit, making it much faster
    const pokemon = await cacheUtils.getOrFetchPokemon(pokemonId)
    
    if (!pokemon) {
      notFound()
    }

    // Preload surrounding Pokemon for better navigation UX
    cacheUtils.preloadForDetailPage(pokemonId)
    
    // Preload evolution chain Pokemon for faster navigation
    preloadEvolutionChain(pokemon)
    
    return <PokemonPageClient pokemon={pokemon} />
  } catch (error) {
    console.error('Failed to load Pokemon:', pokemonId, error)
    // Log the error for debugging in production
    if (process.env.NODE_ENV === 'production') {
      console.error('Production error details:', {
        pokemonId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
    }
    notFound()
  }
}
