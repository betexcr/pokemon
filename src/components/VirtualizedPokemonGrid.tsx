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
  density: '3cols' | '6cols' | '9cols' | 'list'
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
      case '3cols': return 'grid grid-cols-3 gap-4'
      case '6cols': return 'grid grid-cols-6 gap-3'
      case '9cols': return 'grid grid-cols-9 gap-2'
      case 'list': return 'flex flex-col gap-2'
      default: return 'grid grid-cols-6 gap-3'
    }
  }

  // Find the transition point from regular Pokemon to special forms
  const specialFormsStartIndex = pokemonList.findIndex(pokemon => pokemon.id >= 10001)
  
  // Split the Pokemon list into regular and special forms
  const regularPokemon = specialFormsStartIndex >= 0 ? pokemonList.slice(0, specialFormsStartIndex) : pokemonList
  const specialFormsPokemon = specialFormsStartIndex >= 0 ? pokemonList.slice(specialFormsStartIndex) : []

  return (
    <div className={`w-full max-w-full ${className}`}>
      {/* Regular Pokemon */}
      {regularPokemon.length > 0 && (
        <div className={`${getLayoutClasses()} w-full max-w-full`} data-pokemon-grid>
          {regularPokemon.map((pokemon) => (
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
      )}

      {/* Special Forms Header */}
      {specialFormsPokemon.length > 0 && (
        <div className="w-full py-4">
          <div className="w-full bg-background border-y border-border">
            <div className="flex items-center justify-center py-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                ⭐ Special Forms & Variants
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* Special Forms Pokemon */}
      {specialFormsPokemon.length > 0 && (
        <div className={`${getLayoutClasses()} w-full max-w-full`} data-pokemon-grid>
          {specialFormsPokemon.map((pokemon) => (
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
      )}

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
