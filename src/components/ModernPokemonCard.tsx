'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Pokemon } from '@/types/pokemon'
import { formatPokemonName, typeColors } from '@/lib/utils'
import { getPokemonImageUrl } from '@/lib/api'
import { Star, ChevronRight, Heart } from 'lucide-react'

interface ModernPokemonCardProps {
  pokemon: Pokemon
  isFavorite: boolean
  onToggleFavorite: (id: number) => void
  onSelect?: (pokemon: Pokemon) => void
  isSelected?: boolean
  className?: string
  viewMode?: 'grid' | 'list'
  density?: 'cozy' | 'compact' | 'ultra'
}

export default function ModernPokemonCard({
  pokemon,
  isFavorite,
  onToggleFavorite,
  onSelect,
  isSelected = false,
  className = '',
  viewMode = 'grid',
  density = 'compact'
}: ModernPokemonCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const router = useRouter()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    
    if (onSelect) {
      onSelect(pokemon)
    } else {
      // Navigate to detail page
      router.push(`/pokemon/${pokemon.id}`)
    }
  }

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onToggleFavorite(pokemon.id)
  }

  const primaryType = pokemon.types[0]?.type.name || 'normal'
  const accentColor = `var(--type-${primaryType})`

  // Calculate card styling based on view mode and density
  const getCardClasses = () => {
    const baseClasses = `
      group relative bg-surface border border-border overflow-hidden
      transition-all duration-200 hover:shadow-lg focus:outline-none
      focus:ring-2 focus:ring-poke-blue focus:ring-offset-2 focus:ring-offset-bg
      ${isSelected ? 'ring-2 ring-poke-blue ring-offset-2' : ''}
      ${className}
    `

    if (viewMode === 'list') {
      return `${baseClasses} rounded-lg flex items-center p-3 hover:scale-[1.01]`
    }

    // Grid view with different densities
    const densityClasses = {
      cozy: 'rounded-xl hover:scale-[1.02]',
      compact: 'rounded-lg hover:scale-[1.02]',
      ultra: 'rounded-md hover:scale-[1.01]'
    }

    return `${baseClasses} ${densityClasses[density]}`
  }

  return (
    <Link
      href={`/pokemon/${pokemon.id}`}
      onClick={handleClick}
      className={getCardClasses()}
      style={{
        viewTransitionName: onSelect ? undefined : `pokemon-${pokemon.id}`
      }}
      aria-label={`View details for ${formatPokemonName(pokemon.name)}`}
    >
      {/* Type accent bar */}
      <div
        className="h-1 w-full"
        style={{ backgroundColor: accentColor }}
        aria-hidden="true"
      />

      {/* Card content */}
      {viewMode === 'list' ? (
        <div className="flex items-center w-full">
          {/* Pokémon Image */}
          <div className="relative h-12 w-12 bg-gradient-to-br from-white/20 to-white/5 rounded-lg flex items-center justify-center overflow-hidden mr-4">
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
                <span className="text-sm">?</span>
              </div>
            )}
          </div>

          {/* Pokémon Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-text group-hover:text-poke-blue transition-colors truncate">
                  {formatPokemonName(pokemon.name)}
                </h3>
                <span className="text-xs font-mono text-muted">
                  #{String(pokemon.id).padStart(3, '0')}
                </span>
              </div>
              
              {/* Type badges */}
              <div className="flex gap-1 mr-4">
                {pokemon.types.map((type) => (
                  <span
                    key={type.type.name}
                    className={`px-2 py-1 text-xs font-medium rounded-full border`}
                    style={{ 
                      backgroundColor: `var(--type-${type.type.name})`,
                      color: 'white',
                      textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                    }}
                  >
                    {formatPokemonName(type.type.name)}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Favorite Button */}
          <button
            onClick={handleFavoriteClick}
            className={`
              p-1.5 rounded-full transition-all duration-200 ml-2
              ${isFavorite 
                ? 'bg-red-500 text-white shadow-lg' 
                : 'bg-white/80 text-gray-400 hover:bg-red-500 hover:text-white'
              }
              focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1
            `}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>
      ) : (
        <div className="p-4">
          {/* Header: ID and Favorite */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-muted">
              #{String(pokemon.id).padStart(3, '0')}
            </span>
            <button
              onClick={handleFavoriteClick}
              className={`
                p-1.5 rounded-full transition-all duration-200
                ${isFavorite 
                  ? 'bg-red-500 text-white shadow-lg' 
                  : 'bg-white/80 text-gray-400 hover:bg-red-500 hover:text-white'
                }
                focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1
              `}
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
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
            <div className="flex flex-wrap gap-1 justify-center">
              {pokemon.types.map((type) => (
                <span
                  key={type.type.name}
                  className={`
                    font-medium rounded-full border
                    ${density === 'ultra' ? 'px-1 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'}
                    ${typeColors[type.type.name].bg} ${typeColors[type.type.name].text} 
                    ${typeColors[type.type.name].border}
                    transition-transform duration-200 group-hover:scale-105
                  `}
                  style={{ 
                    backgroundColor: `var(--type-${type.type.name})`,
                    color: 'white',
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                  }}
                >
                  {formatPokemonName(type.type.name)}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </Link>
  )
}
