'use client'

import { useState } from 'react'
import { Pokemon } from '@/types/pokemon'
import ModernPokemonCard from './ModernPokemonCard'
import { useTheme } from './ThemeProvider'

interface VirtualizedPokemonGridProps {
  pokemonList: Pokemon[]
  onToggleComparison: (id: number) => void
  onSelectPokemon?: (pokemon: Pokemon) => void
  selectedPokemon: Pokemon | null
  comparisonList: number[]
  density: 'cozy' | 'compact' | 'ultra' | 'list'
  className?: string
  isLoading?: boolean
}

export default function VirtualizedPokemonGrid({
  pokemonList,
  onToggleComparison,
  onSelectPokemon,
  selectedPokemon,
  comparisonList,
  density,
  className = '',
  isLoading = false
}: VirtualizedPokemonGridProps) {

  let theme = 'light'
  try {
    const themeContext = useTheme()
    theme = themeContext.theme
  } catch {
    // Theme provider not available, use default
  }

  // Calculate layout based on density
  const getLayoutClasses = () => {
    switch (density) {
      case 'cozy': return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6'
      case 'compact': return 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-3 md:gap-4'
      case 'ultra': return 'grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2 sm:gap-3 md:gap-4'
      case 'list': return 'flex flex-col gap-2'
      default: return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6'
    }
  }

  return (
    <div className={`${className}`}>
      <div className={getLayoutClasses()} data-pokemon-grid>
        {pokemonList.map((pokemon) => (
          <ModernPokemonCard
            key={pokemon.id}
            pokemon={pokemon}
            isInComparison={comparisonList.includes(pokemon.id)}
            onToggleComparison={onToggleComparison}
            onSelect={undefined}
            isSelected={selectedPokemon?.id === pokemon.id}
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
