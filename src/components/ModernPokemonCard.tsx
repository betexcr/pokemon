'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pokemon } from '@/types/pokemon'
import { formatPokemonName } from '@/lib/utils'
import { Scale } from 'lucide-react'
import TypeBadge from './TypeBadge'
import PokemonCardFrame from './PokemonCardFrame'

interface ModernPokemonCardProps {
  pokemon: Pokemon
  isInComparison: boolean
  onToggleComparison: (id: number) => void
  onSelect?: (pokemon: Pokemon) => void
  isSelected?: boolean
  className?: string
  density?: '3cols' | '6cols' | '9cols' | 'list'
}

export default function ModernPokemonCard({
  pokemon,
  isInComparison,
  onToggleComparison,
  onSelect,
  isSelected = false,
  className = '',
  density = '6cols'
}: ModernPokemonCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const router = useRouter()
  
  // Use direct image URLs with fallbacks
  const primaryImageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${pokemon.id}.png`
  const fallbackImageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`
  const placeholderImageUrl = '/placeholder-pokemon.png'

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

  return (
    <PokemonCardFrame
      onClick={handleClick}
      className={className}
      density={density}
      isSelected={isSelected}
      onKeyDown={handleKeyDown}
      aria-label={`View details for ${formatPokemonName(pokemon.name)}`}
      data-pokemon-id={pokemon.id}
    >
      {/* Type accent bar */}
      <div
        className="h-1 w-full"
        style={{ backgroundColor: accentColor }}
        aria-hidden="true"
      />

      {/* Card content */}
      {density === 'list' ? (
        // List layout - clean horizontal list item
        <div className="flex items-center w-full">
          {/* Pokémon Image */}
          <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center overflow-hidden mr-4 w-12 h-12 flex-shrink-0">
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse rounded-lg" />
            )}
            
            {/* Pokémon Image */}
            <img
              src={primaryImageUrl}
              alt={formatPokemonName(pokemon.name)}
              className={`w-full h-full object-contain transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.src === primaryImageUrl) {
                  // Try fallback URL
                  target.src = fallbackImageUrl;
                } else if (target.src === fallbackImageUrl) {
                  // Try placeholder
                  target.src = placeholderImageUrl;
                  setImageError(true);
                }
              }}
              loading="lazy"
            />
            
            {/* Loading spinner */}
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            
            {/* Error state */}
            {imageError && (
              <div className="absolute inset-0 flex items-center justify-center text-muted">
                <span className="text-xs">?</span>
              </div>
            )}
          </div>

          {/* Pokémon Info */}
          <div className="flex-1 min-w-0 flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0">
              <span className="text-xs font-mono text-gray-500 font-medium flex-shrink-0">
                #{String(pokemon.id).padStart(3, '0')}
              </span>
              <h3 className="font-semibold text-gray-800 group-hover:text-poke-blue transition-colors truncate">
                {formatPokemonName(pokemon.name)}
              </h3>
            </div>
            
            <div className="flex items-center space-x-3 flex-shrink-0">
              {/* Type badges */}
              <div className="flex gap-1">
                {pokemon.types.map((type) => (
                  <TypeBadge
                    key={type.type.name}
                    type={type.type.name}
                    className="transition-transform duration-200 group-hover:scale-105 text-xs"
                  />
                ))}
              </div>
              
              {/* Comparison button */}
              <button
                onClick={handleComparisonClick}
                className={`
                  p-1.5 rounded-full transition-all duration-200 border
                  ${isInComparison 
                    ? 'bg-blue-500 text-white border-blue-500 shadow-md' 
                    : 'bg-white text-gray-400 border-gray-200 hover:bg-blue-500 hover:text-white hover:border-blue-500'
                  }
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                `}
                aria-label={isInComparison ? 'Remove from comparison' : 'Add to comparison'}
              >
                <Scale className={`h-3 w-3 ${isInComparison ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Grid layout for 3cols, 6cols, and 9cols
        <div className={`${density === '3cols' ? 'p-6' : density === '6cols' ? 'p-4' : 'p-3'} h-full flex flex-col`}>
          {/* Header: ID and Comparison */}
          <div className="flex items-center justify-between mb-3 card-header">
            <span className="text-xs font-mono text-gray-500 font-medium card-number">
              #{String(pokemon.id).padStart(3, '0')}
            </span>
            <button
              onClick={handleComparisonClick}
              className={`
                p-1.5 rounded-full transition-all duration-200 border
                ${isInComparison 
                  ? 'bg-blue-500 text-white border-blue-500 shadow-md' 
                  : 'bg-white text-gray-400 border-gray-200 hover:bg-blue-500 hover:text-white hover:border-blue-500'
                }
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
              card-control
              `}
              aria-label={isInComparison ? 'Remove from comparison' : 'Add to comparison'}
            >
              <Scale className={`h-4 w-4 ${isInComparison ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Pokémon Image */}
          <div className={`relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center overflow-hidden mb-3 card-art ${
            density === '3cols' ? 'aspect-square max-h-48' : density === '6cols' ? 'aspect-square max-h-40' : 'aspect-square max-h-24'
          }`} style={{
            width: '100%'
          }}>
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
            )}
            
            <img
              src={primaryImageUrl}
              alt={formatPokemonName(pokemon.name)}
              className={`
                w-full h-full object-contain transition-opacity duration-300
                ${imageLoaded ? 'opacity-100' : 'opacity-0'}
              `}
              onLoad={() => setImageLoaded(true)}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.src === primaryImageUrl) {
                  // Try fallback URL
                  target.src = fallbackImageUrl;
                } else if (target.src === fallbackImageUrl) {
                  // Try placeholder
                  target.src = placeholderImageUrl;
                  setImageError(true);
                }
              }}
              loading="lazy"
            />
            
            {/* Loading spinner */}
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            
            {/* Error state */}
            {imageError && (
              <div className="absolute inset-0 flex items-center justify-center text-muted">
                <span className="text-2xl">?</span>
              </div>
            )}
          </div>

          {/* Pokémon Info */}
          <div className="space-y-3 flex-1 flex flex-col justify-end card-info">
            {/* Name */}
            <h3 className={`font-semibold text-center group-hover:text-poke-blue transition-colors card-name ${
              density === '9cols' ? 'text-xs' : density === '6cols' ? 'text-sm' : 'text-base'
            }`} style={{color: '#1f2937', fontWeight: '600'}}>
              {pokemon.name ? formatPokemonName(pokemon.name) : 'No Name'}
            </h3>

            {/* Type badges */}
            <div className="flex flex-wrap gap-1 justify-center card-badges">
              {pokemon.types && pokemon.types.length > 0 ? pokemon.types.map((type) => (
                <TypeBadge
                  key={type.type.name}
                  type={type.type.name}
                  className={`transition-transform duration-200 group-hover:scale-105 ${
                    density === '9cols' ? 'text-xs px-2 py-1' : 'text-xs px-2 py-1'
                  }`}
                />
              )) : <span className="text-xs text-gray-500">No Types</span>}
            </div>
          </div>
        </div>
      )}
    </PokemonCardFrame>
  )
}