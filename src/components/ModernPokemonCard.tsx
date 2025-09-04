'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Pokemon } from '@/types/pokemon'
import { formatPokemonName, typeColors } from '@/lib/utils'
import { getPokemonMainPageImage } from '@/lib/api'
import { usePokemonImage } from '@/hooks/useCachedImage'
import { Star, ChevronRight, Heart, Scale } from 'lucide-react'
import TypeBadge from './TypeBadge'

interface ModernPokemonCardProps {
  pokemon: Pokemon
  isInComparison: boolean
  onToggleComparison: (id: number) => void
  onSelect?: (pokemon: Pokemon) => void
  isSelected?: boolean
  className?: string
  density?: 'cozy' | 'compact' | 'ultra' | 'list'
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
  const router = useRouter()
  
  // Use cached image hook
  const { imageUrl, isLoading: imageLoading, hasError: imageError } = usePokemonImage(pokemon.id)
  
  // Temporary: Use direct URL for debugging
  const directImageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${pokemon.id}.png`
  
  // Debug logging for list view
  useEffect(() => {
    if (density === 'list') {
      console.log(`List view - ${pokemon.name} (ID: ${pokemon.id}):`, {
        imageUrl,
        imageLoading,
        imageError,
        imageLoaded
      })
    }
  }, [pokemon.name, pokemon.id, imageUrl, imageLoading, imageError, imageLoaded, density])

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

    // Layout and styling based on density
    const densityClasses = {
      cozy: 'rounded-xl hover:scale-[1.02]',
      compact: 'rounded-lg hover:scale-[1.02]',
      ultra: 'rounded-md hover:scale-[1.01]',
      list: 'rounded-lg hover:scale-[1.01] flex items-center'
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
      {density === 'list' ? (
        // List layout
        <div className="flex items-center w-full p-3">
          {/* Pokémon Image */}
          <div className="relative bg-gradient-to-br from-white/20 to-white/5 rounded-lg flex items-center justify-center overflow-hidden mr-4 w-16 h-16 flex-shrink-0 border-2 border-red-500">
            {imageLoading && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse rounded-lg" />
            )}
            
            {/* Test with multiple image sources */}
            <img
              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`}
              alt={formatPokemonName(pokemon.name)}
              className="w-full h-full object-contain"
              onLoad={() => {
                console.log('✅ Image loaded successfully for:', pokemon.name, 'ID:', pokemon.id);
                setImageLoaded(true);
              }}
              onError={(e) => {
                console.log('❌ Image failed to load for:', pokemon.name, 'ID:', pokemon.id);
                console.log('Error event:', e);
                // Try fallback
                const img = e.target as HTMLImageElement;
                img.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`;
              }}
              loading="lazy"
            />
            
            {/* Fallback image */}
            <img
              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`}
              alt={`${formatPokemonName(pokemon.name)} (fallback)`}
              className="w-full h-full object-contain opacity-0 absolute inset-0"
              onLoad={() => {
                console.log('✅ Fallback image loaded for:', pokemon.name);
              }}
              onError={() => {
                console.log('❌ Fallback image also failed for:', pokemon.name);
              }}
            />
            
            {/* Debug: Show loading state */}
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            
            {/* Debug: Show container info */}
            <div className="absolute top-0 left-0 text-xs bg-black text-white p-1 rounded">
              {pokemon.id}
            </div>
          </div>

          {/* Pokémon Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-xs font-mono text-muted">
                  #{String(pokemon.id).padStart(3, '0')}
                </span>
                <h3 className="font-semibold text-text group-hover:text-poke-blue transition-colors truncate text-sm">
                  {formatPokemonName(pokemon.name)}
                </h3>
              </div>
              
              <div className="flex items-center space-x-2">
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
                    p-1 rounded-full transition-all duration-200
                    ${isInComparison 
                      ? 'bg-blue-500 text-white shadow-lg' 
                      : 'bg-white/80 text-gray-400 hover:bg-blue-500 hover:text-white'
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
        </div>
      ) : (
        // Grid layout for cozy, compact, and ultra
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
              <Scale className={`h-4 w-4 ${isInComparison ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Pokémon Image */}
          <div className={`relative bg-gradient-to-br from-white/20 to-white/5 rounded-lg flex items-center justify-center overflow-hidden mb-3 ${
            density === 'cozy' ? 'h-44' : density === 'compact' ? 'h-36' : 'h-20'
          }`}>
            {imageLoading && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
            )}
            
            {!imageError ? (
              <img
                src={imageUrl}
                alt={formatPokemonName(pokemon.name)}
                className={`
                  w-full h-full object-contain transition-opacity duration-300
                  ${imageLoaded ? 'opacity-100' : 'opacity-0'}
                `}
                onLoad={() => setImageLoaded(true)}
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
                  className="transition-transform duration-200 group-hover:scale-105"
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
