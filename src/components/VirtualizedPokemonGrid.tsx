'use client'

import React, { useMemo } from 'react'
import { Pokemon } from '@/types/pokemon'
import ModernPokemonCard from './ModernPokemonCard'
import PokemonCard from './PokemonCard'
import { useTheme } from './ThemeProvider'
import { useVirtualizer } from '@tanstack/react-virtual'

interface VirtualizedPokemonGridProps {
  pokemonList: Pokemon[]
  onToggleComparison: (id: number) => void
  onSelectPokemon?: (pokemon: Pokemon) => void
  selectedPokemon: Pokemon | null
  comparisonList: number[]
  density: '3cols' | '6cols' | '9cols' | 'list'
  className?: string
  isLoading?: boolean
  enableVirtualization?: boolean
  showSpecialForms?: boolean // New prop to control special forms display
}

export default function VirtualizedPokemonGrid({
  pokemonList,
  onToggleComparison,
  onSelectPokemon,
  selectedPokemon,
  comparisonList,
  density,
  className = '',
  isLoading = false,
  enableVirtualization = false,
  showSpecialForms = true // Default to true for backward compatibility
}: VirtualizedPokemonGridProps) {

  let theme = 'light'
  try {
    const themeContext = useTheme()
    theme = themeContext.theme
  } catch {
    // Theme provider not available, use default
  }

  // Calculate layout based on density - fixed column counts
  const getLayoutClasses = () => {
    switch (density) {
      case '3cols': return 'grid grid-cols-3 gap-4 items-stretch content-stretch' // Always 3 columns
      case '6cols': return 'grid grid-cols-6 gap-3 items-stretch content-stretch' // Always 6 columns  
      case '9cols': return 'grid grid-cols-9 gap-2 items-stretch content-stretch' // Always 9 columns
      case 'list': return 'flex flex-col gap-1' // List view with tighter spacing
      default: return 'grid grid-cols-6 gap-3 items-stretch content-stretch' // Default to 6 columns
    }
  }

  // Calculate grid dimensions for virtualization - Aspect ratio aware heights
  const getGridDimensions = useMemo(() => {
    switch (density) {
      case '3cols': return { cols: 3, itemHeight: 360, gap: 16 } // Max height with aspect ratio constraint
      case '6cols': return { cols: 6, itemHeight: 280, gap: 12 } // Max height with aspect ratio constraint
      case '9cols': return { cols: 9, itemHeight: 200, gap: 8 }  // Max height with aspect ratio constraint
      case 'list': return { cols: 1, itemHeight: 60, gap: 4 }
      default: return { cols: 6, itemHeight: 280, gap: 12 }
    }
  }, [density])

  // Find the transition point from regular Pokemon to special forms (only if showSpecialForms is true)
  const specialFormsStartIndex = showSpecialForms ? pokemonList.findIndex(pokemon => pokemon.id >= 10001) : -1
  
  // Split the Pokemon list into regular and special forms
  const regularPokemon = showSpecialForms && specialFormsStartIndex >= 0 ? pokemonList.slice(0, specialFormsStartIndex) : pokemonList
  const specialFormsPokemon = showSpecialForms && specialFormsStartIndex >= 0 ? pokemonList.slice(specialFormsStartIndex) : []

  // Calculate total rows for virtualization (including special forms section)
  const regularRows = Math.ceil(regularPokemon.length / getGridDimensions.cols)
  const specialFormsRows = specialFormsPokemon.length > 0 ? Math.ceil(specialFormsPokemon.length / getGridDimensions.cols) + 1 : 0 // +1 for header
  const totalRows = regularRows + specialFormsRows

  // Create virtualizer for virtualization
  const parentRef = React.useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: totalRows,
    getScrollElement: () => {
      // Use the main scroll container instead of creating our own
      return document.querySelector('.flex-1.min-h-0.overflow-y-auto') || parentRef.current
    },
    estimateSize: () => getGridDimensions.itemHeight + getGridDimensions.gap,
    overscan: 5, // Render 5 extra rows for smooth scrolling
  })

  // Render a row of pokemon cards or special forms header
  const renderRow = (rowIndex: number) => {
    // Check if this is the special forms header row
    if (specialFormsPokemon.length > 0 && rowIndex === regularRows) {
      return (
        <div
          key={`special-forms-header-${rowIndex}`}
          className="w-full py-4"
          style={{ height: 60 }} // Fixed height for header
        >
          <div className="w-full bg-background border-y border-border">
            <div className="flex items-center justify-center py-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                ⭐ Special Forms & Variants
              </h3>
            </div>
          </div>
        </div>
      )
    }

    // Handle regular Pokemon rows
    if (rowIndex < regularRows) {
      // For list view, each row contains only one Pokemon
      if (density === 'list') {
        const pokemon = regularPokemon[rowIndex]
        if (!pokemon) return null

        return (
          <div
            key={pokemon.id}
            className="w-full"
            style={{
              height: getGridDimensions.itemHeight,
            }}
          >
            <ModernPokemonCard
              key={pokemon.id}
              pokemon={pokemon}
              isInComparison={comparisonList.includes(pokemon.id)}
              onToggleComparison={onToggleComparison}
              onSelect={undefined}
              isSelected={selectedPokemon?.id === pokemon.id}
              density={density}
            />
          </div>
        )
      }

      // For grid views, use the original logic
      const startIndex = rowIndex * getGridDimensions.cols
      const endIndex = Math.min(startIndex + getGridDimensions.cols, regularPokemon.length)
      const rowPokemon = regularPokemon.slice(startIndex, endIndex)

      return (
        <div
          key={rowIndex}
          className={`${getLayoutClasses()} w-full max-w-full`}
          style={{
            height: getGridDimensions.itemHeight,
            gap: getGridDimensions.gap,
          }}
        >
          {rowPokemon.map((pokemon) => {
            // Use PokemonCard for the smallest density (9cols) to show comparison button
            if (density === '9cols') {
              return (
                <PokemonCard
                  key={pokemon.id}
                  pokemon={pokemon}
                  isFavorite={false} // You might want to implement favorites
                  onToggleFavorite={() => {}} // You might want to implement favorites
                  isInComparison={comparisonList.includes(pokemon.id)}
                  onToggleComparison={onToggleComparison}
                  cardSize="compact"
                  mode="grid"
                />
              )
            }
            
            // Use ModernPokemonCard for other densities
            return (
              <ModernPokemonCard
                key={pokemon.id}
                pokemon={pokemon}
                isInComparison={comparisonList.includes(pokemon.id)}
                onToggleComparison={onToggleComparison}
                onSelect={undefined}
                isSelected={selectedPokemon?.id === pokemon.id}
                density={density}
              />
            )
          })}
        </div>
      )
    }

    // Handle special forms Pokemon rows
    const specialFormsRowIndex = rowIndex - regularRows - 1 // -1 for header
    
    // For list view, each row contains only one Pokemon
    if (density === 'list') {
      const pokemon = specialFormsPokemon[specialFormsRowIndex]
      if (!pokemon) return null

      return (
        <div
          key={pokemon.id}
          className="w-full"
          style={{
            height: getGridDimensions.itemHeight,
          }}
        >
          <ModernPokemonCard
            key={pokemon.id}
            pokemon={pokemon}
            isInComparison={comparisonList.includes(pokemon.id)}
            onToggleComparison={onToggleComparison}
            onSelect={undefined}
            isSelected={selectedPokemon?.id === pokemon.id}
            density={density}
          />
        </div>
      )
    }

    // For grid views, use the original logic
    const startIndex = specialFormsRowIndex * getGridDimensions.cols
    const endIndex = Math.min(startIndex + getGridDimensions.cols, specialFormsPokemon.length)
    const rowPokemon = specialFormsPokemon.slice(startIndex, endIndex)

    return (
      <div
        key={`special-forms-${rowIndex}`}
        className={`${getLayoutClasses()} w-full max-w-full`}
        style={{
          height: getGridDimensions.itemHeight,
          gap: getGridDimensions.gap,
        }}
      >
        {rowPokemon.map((pokemon) => {
          if (density === '9cols') {
            return (
              <PokemonCard
                key={pokemon.id}
                pokemon={pokemon}
                isFavorite={false}
                onToggleFavorite={() => {}}
                isInComparison={comparisonList.includes(pokemon.id)}
                onToggleComparison={onToggleComparison}
                cardSize="ultra"
                mode="grid"
              />
            )
          }
          
          return (
            <ModernPokemonCard
              key={pokemon.id}
              pokemon={pokemon}
              isInComparison={comparisonList.includes(pokemon.id)}
              onToggleComparison={onToggleComparison}
              onSelect={undefined}
              isSelected={selectedPokemon?.id === pokemon.id}
              density={density}
            />
          )
        })}
      </div>
    )
  }

  // Deduplicate Pokemon to ensure unique keys
  const uniqueRegularPokemon = useMemo(() => {
    const seen = new Set();
    return regularPokemon.filter(pokemon => {
      if (seen.has(pokemon.id)) {
        console.warn('Duplicate Pokemon found:', pokemon);
        return false;
      }
      seen.add(pokemon.id);
      return true;
    });
  }, [regularPokemon]);

  // Render virtualized content when enabled and pokemon count is high
  if (enableVirtualization && uniqueRegularPokemon.length > 50) {
    return (
      <div className={`w-full max-w-full ${className}`}>
        {/* Virtualized Regular Pokemon */}
        {uniqueRegularPokemon.length > 0 && (
          <div
            ref={parentRef}
            className="w-full h-full"
            data-pokemon-grid
            style={{
              height: 'auto', // Let content determine height for proper overflow
              minHeight: 'calc(100vh - 9rem)', // Balanced height for proper scrolling
            }}
          >
            <div
              style={{
                height: virtualizer.getTotalSize(),
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map((virtualRow) => (
                <div
                  key={virtualRow.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {renderRow(virtualRow.index)}
                </div>
              ))}
              {/* Infinite scroll sentinel for virtualized content */}
              <div
                style={{
                  position: 'absolute',
                  top: virtualizer.getTotalSize(),
                  left: 0,
                  width: '100%',
                  height: '1px',
                  backgroundColor: 'transparent',
                  zIndex: 1,
                }}
                data-infinite-scroll-sentinel="true"
              />
            </div>
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

  // Render non-virtualized content (original implementation)
  return (
    <div className={`w-full max-w-full overflow-x-hidden ${className}`}>
      {/* Regular Pokemon */}
      {uniqueRegularPokemon.length > 0 && (
        <div className={`${getLayoutClasses()} w-full max-w-full ${density === 'list' ? 'pl-0 pr-0' : 'pl-0 pr-0'}`} data-pokemon-grid>
          {uniqueRegularPokemon.map((pokemon) => (
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
        <div className={`${getLayoutClasses()} w-full max-w-full ${density === 'list' ? 'pl-0 pr-0' : 'pl-0 pr-0'}`} data-pokemon-grid>
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

      {/* Infinite scroll sentinel for non-virtualized content */}
      <div
        style={{
          width: '100%',
          height: '1px',
          backgroundColor: 'transparent',
        }}
        data-infinite-scroll-sentinel="true"
      />

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
