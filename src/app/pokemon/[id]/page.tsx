import { Pokemon } from '@/types/pokemon'
import { getPokemon } from '@/lib/api'
import PokemonDetailClient from './PokemonDetailClient'

// Generate static params for the first 151 Pokemon (Gen 1)
export async function generateStaticParams() {
  const pokemonIds = Array.from({ length: 151 }, (_, i) => i + 1)
  
  return pokemonIds.map((id) => ({
    id: id.toString(),
  }))
}

interface PokemonDetailPageProps {
  params: {
    id: string
  }
}

export default async function PokemonDetailPage({ params }: PokemonDetailPageProps) {
  let pokemon: Pokemon | null = null
  let error: string | null = null

  try {
    pokemon = await getPokemon(Number(params.id))
  } catch (err) {
    error = 'Failed to load Pokémon data'
    console.error(err)
  }

  return <PokemonDetailClient pokemon={pokemon} error={error} />
}