'use client'

import { useState } from 'react'
import { Pokemon } from '@/types/pokemon'
import ModernPokemonCard from './ModernPokemonCard'
import { useTheme } from './ThemeProvider'

interface VirtualizedPokemonGridProps {
  pokemonList: Pokemon[]
  onToggleFavorite: (id: number) => void
  onSelectPokemon?: (pokemon: Pokemon) => void
  selectedPokemon: Pokemon | null
  favorites: number[]
  density: 'cozy' | 'compact' | 'ultra'
  viewMode: 'grid' | 'list'
  className?: string
}

export default function VirtualizedPokemonGrid({
  pokemonList,
  onToggleFavorite,
  onSelectPokemon,
  selectedPokemon,
  favorites,
  density,
  viewMode,
  className = ''
}: VirtualizedPokemonGridProps) {
  const [isLoading, setIsLoading] = useState(false)

  let theme = 'light'
  try {
    const themeContext = useTheme()
    theme = themeContext.theme
  } catch {
    // Theme provider not available, use default
  }

  // Calculate grid columns based on density and view mode
  const getGridColumns = () => {
    if (viewMode === 'list') {
      return 'grid-cols-1'
    }
    
    switch (density) {
      case 'cozy': return 'grid-cols-3'
      case 'compact': return 'grid-cols-6'
      case 'ultra': return 'grid-cols-12'
      default: return 'grid-cols-3'
    }
  }

  return (
    <div className={`${className}`}>
      <div className={`grid gap-4 ${getGridColumns()} ${viewMode === 'list' ? 'gap-2' : ''}`}>
        {pokemonList.map((pokemon) => (
          <ModernPokemonCard
            key={pokemon.id}
            pokemon={pokemon}
            isFavorite={favorites.includes(pokemon.id)}
            onToggleFavorite={onToggleFavorite}
            onSelect={undefined}
            isSelected={selectedPokemon?.id === pokemon.id}
            viewMode={viewMode}
            density={density}
          />
        ))}
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center py-4">
          <div className={`animate-spin rounded-full h-6 w-6 border-b-2 ${
            theme === 'gold' ? 'border-gold-accent'
            : theme === 'red' ? 'border-red-accent'
            : theme === 'ruby' ? 'border-ruby-accent'
            : 'border-poke-blue'
          }`} />
        </div>
      )}
    </div>
  )
}
