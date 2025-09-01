'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pokemon } from '@/types/pokemon'
import { formatPokemonName, typeColors } from '@/lib/utils'
import { getPokemonImageUrl } from '@/lib/api'
import { Star, ChevronRight, Heart } from 'lucide-react'
import TypeBadge from './TypeBadge'

interface ModernPokemonCardProps {
  pokemon: Pokemon
  isInComparison: boolean
  onToggleComparison: (id: number) => void
  onSelect?: (pokemon: Pokemon) => void
  isSelected?: boolean
  className?: string
  density?: 'cozy' | 'compact' | 'ultra'
}

export default function ModernPokemonCard({
  pokemon,
  isInComparison,
  onToggleComparison,
  onSelect,
  isSelected = false,
  className = '',
  density = 'compact'
}: ModernPokemonCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const router = useRouter()

  const handleClick = (e: React.MouseEvent) => {
    if (onSelect) {
      e.preventDefault()
      onSelect(pokemon)
    }
    // If no onSelect, navigate to detail page
    if (!onSelect) {
      router.push(`/pokemon/${pokemon.id}`)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (onSelect) {
        onSelect(pokemon)
      } else {
        router.push(`/pokemon/${pokemon.id}`)
      }
    }
  }

  const handleComparisonClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onToggleComparison(pokemon.id)
  }

  const primaryType = pokemon.types[0]?.type.name || 'normal'
  const accentColor = `var(--type-${primaryType})`

  // Calculate card styling based on density
  const getCardClasses = () => {
    const baseClasses = `
      group relative bg-surface border border-border overflow-hidden
      transition-all duration-200 hover:shadow-lg focus:outline-none
      focus:ring-2 focus:ring-poke-blue focus:ring-offset-2 focus:ring-offset-bg
      ${isSelected ? 'ring-2 ring-poke-blue ring-offset-2' : ''}
      ${className}
    `

    // Grid view with different densities
    const densityClasses = {
      cozy: 'rounded-xl hover:scale-[1.02]',
      compact: 'rounded-lg hover:scale-[1.02]',
      ultra: 'rounded-md hover:scale-[1.01]'
    }

    return `${baseClasses} ${densityClasses[density]}`
  }

  return (
    <div
      onClick={handleClick}
      className={getCardClasses()}
      style={{
        viewTransitionName: onSelect ? undefined : `pokemon-${pokemon.id}`
      }}
      aria-label={`View details for ${formatPokemonName(pokemon.name)}`}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Type accent bar */}
      <div
        className="h-1 w-full"
        style={{ backgroundColor: accentColor }}
        aria-hidden="true"
      />

      {/* Card content */}
        <div className="p-4">
          {/* Header: ID and Favorite */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-muted">
              #{String(pokemon.id).padStart(3, '0')}
            </span>
            <button
              onClick={handleComparisonClick}
              className={`
                p-1.5 rounded-full transition-all duration-200
                ${isInComparison 
                  ? 'bg-blue-500 text-white shadow-lg' 
                  : 'bg-white/80 text-gray-400 hover:bg-blue-500 hover:text-white'
                }
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
              `}
              aria-label={isInComparison ? 'Remove from comparison' : 'Add to comparison'}
            >
              <svg className={`h-4 w-4 ${isInComparison ? 'fill-current' : ''}`} viewBox="0 0 24 24">
                <path d="M9 3l-1.5 1.5L6 3 4.5 4.5 3 3v18l1.5-1.5L6 21l1.5-1.5L9 21V3zm6 0l-1.5 1.5L12 3l-1.5 1.5L9 3v18l1.5-1.5L12 21l1.5-1.5L15 21V3z"/>
              </svg>
            </button>
          </div>

          {/* Pokémon Image */}
          <div className={`relative bg-gradient-to-br from-white/20 to-white/5 rounded-lg flex items-center justify-center overflow-hidden mb-3 ${
            density === 'cozy' ? 'h-44' : density === 'compact' ? 'h-36' : 'h-20'
          }`}>
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
            )}
            
            {!imageError ? (
              <img
                src={getPokemonImageUrl(pokemon.id)}
                alt={formatPokemonName(pokemon.name)}
                className={`
                  w-full h-full object-contain transition-opacity duration-300
                  ${imageLoaded ? 'opacity-100' : 'opacity-0'}
                `}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                loading="lazy"
              />
            ) : (
              <div className="flex items-center justify-center text-muted">
                <span className="text-2xl">?</span>
              </div>
            )}
          </div>

          {/* Pokémon Info */}
          <div className="space-y-2">
            {/* Name */}
                                 <h3 className={`font-semibold text-text text-center group-hover:text-poke-blue transition-colors ${
                       density === 'ultra' ? 'text-xs' : 'text-base'
                     }`}>
              {formatPokemonName(pokemon.name)}
            </h3>

            {/* Type badges */}
            <div className="flex flex-wrap gap-2 justify-center">
              {pokemon.types.map((type) => (
                <TypeBadge
                  key={type.type.name}
                  type={type.type.name}
                  className={`transition-transform duration-200 group-hover:scale-105 ${
                    density === 'ultra' ? 'text-[10px]' : 'text-xs'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
    </div>
  )
}
