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
}

export default function VirtualizedPokemonGrid({
  pokemonList,
  onToggleComparison,
  onSelectPokemon,
  selectedPokemon,
  comparisonList,
  density,
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

  // Calculate layout based on density
  const getLayoutClasses = () => {
    switch (density) {
      case 'cozy': return 'grid grid-cols-3 gap-6'
      case 'compact': return 'grid grid-cols-6 gap-6'
      case 'ultra': return 'grid grid-cols-12 gap-6'
      case 'list': return 'flex flex-col gap-2'
      default: return 'grid grid-cols-3 gap-6'
    }
  }

  return (
    <div className={`${className}`}>
      <div className={getLayoutClasses()}>
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
