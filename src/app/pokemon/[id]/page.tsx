import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import PokemonPageClient from './PokemonPageClient'
import { getPokemonById, getAllValidPokemonIds } from '@/lib/api'

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
    const pokemon = await getPokemonById(pokemonId)
    
    return {
      title: `${pokemon.name} - Pokémon Details`,
      description: `Learn about ${pokemon.name}, a ${pokemon.types.map(t => t.type.name).join('/')} type Pokémon.`,
      openGraph: {
        title: `${pokemon.name} - Pokémon Details`,
        description: `Learn about ${pokemon.name}, a ${pokemon.types.map(t => t.type.name).join('/')} type Pokémon.`,
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
    const pokemon = await getPokemonById(pokemonId)
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
