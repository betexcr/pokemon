'use client'

import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react'
import { Pokemon } from '@/types/pokemon'
import ModernPokemonCard from './ModernPokemonCard'
import PokemonCard from './PokemonCard'
import { PokemonCardSkeleton } from './PokemonCard'
import { useTheme } from './ThemeProvider'
import { motion, AnimatePresence } from 'framer-motion'

interface OptimizedVirtualizedPokemonGridProps {
  pokemonList: Pokemon[]
  onToggleComparison: (id: number) => void
  onSelectPokemon?: (pokemon: Pokemon) => void
  selectedPokemon: Pokemon | null
  comparisonList: number[]
  density: '3cols' | '6cols' | '9cols' | 'list'
  className?: string
  isLoading?: boolean
  enableVirtualization?: boolean
  showSpecialForms?: boolean
  sortBy?: string
  isSorting?: boolean
  // Infinite scroll props
  hasMorePokemon?: boolean
  isLoadingMore?: boolean
  onLoadMore?: () => void
  sentinelRef?: (node: HTMLDivElement | null) => void
  // Performance props
  virtualItems?: Array<{
    index: number
    start: number
    end: number
    size: number
  }>
  totalSize?: number
  scrollElement?: HTMLElement | null
}

export default function OptimizedVirtualizedPokemonGrid({
  pokemonList,
  onToggleComparison,
  onSelectPokemon,
  selectedPokemon,
  comparisonList,
  density,
  className = '',
  isLoading = false,
  enableVirtualization = false,
  showSpecialForms = true,
  sortBy = 'id',
  isSorting = false,
  hasMorePokemon = true,
  isLoadingMore = false,
  onLoadMore,
  sentinelRef,
  virtualItems = [],
  totalSize = 0,
  scrollElement
}: OptimizedVirtualizedPokemonGridProps) {

  const SKELETON_BATCH_SIZE = 50

  let theme = 'light'
  try {
    const themeContext = useTheme()
    theme = themeContext.theme
  } catch {
    // Theme provider not available, use default
  }

  // Calculate layout based on density
  const getLayoutClasses = useCallback(() => {
    switch (density) {
      case '3cols': return 'grid grid-cols-3 gap-4 items-start'
      case '6cols': return 'grid grid-cols-6 gap-3 items-start'
      case '9cols': return 'grid grid-cols-9 gap-2 items-start'
      case 'list': return 'flex flex-col gap-1'
      default: return 'grid grid-cols-6 gap-3 items-start'
    }
  }, [density])

  // Calculate grid dimensions
  const getGridDimensions = useMemo(() => {
    switch (density) {
      case '3cols': return { cols: 3, itemHeight: 200, gap: 16 }
      case '6cols': return { cols: 6, itemHeight: 180, gap: 12 }
      case '9cols': return { cols: 9, itemHeight: 160, gap: 8 }
      case 'list': return { cols: 1, itemHeight: 60, gap: 4 }
      default: return { cols: 6, itemHeight: 180, gap: 12 }
    }
  }, [density])

  const gridCols = getGridDimensions.cols

  // Memoize Pokemon list processing
  const processedPokemonData = useMemo(() => {
    const specialFormsStartIndex = showSpecialForms ? pokemonList.findIndex(pokemon => pokemon.id >= 10001) : -1
    
    const regularPokemon = showSpecialForms && specialFormsStartIndex >= 0 ? pokemonList.slice(0, specialFormsStartIndex) : pokemonList
    const specialFormsPokemon = showSpecialForms && specialFormsStartIndex >= 0 ? pokemonList.slice(specialFormsStartIndex) : []

    const regularRows = Math.ceil(regularPokemon.length / getGridDimensions.cols)
    const specialFormsRows = specialFormsPokemon.length > 0 ? Math.ceil(specialFormsPokemon.length / getGridDimensions.cols) + 1 : 0
    const totalRows = regularRows + specialFormsRows

    return {
      regularPokemon,
      specialFormsPokemon,
      regularRows,
      specialFormsRows,
      totalRows
    }
  }, [pokemonList, showSpecialForms, getGridDimensions.cols])

  const { regularPokemon, specialFormsPokemon, regularRows, specialFormsRows } = processedPokemonData

  // Render skeleton grid
  const skeletonBatchCount = useMemo(() => {
    if (density === 'list') {
      return SKELETON_BATCH_SIZE
    }
    return Math.ceil(SKELETON_BATCH_SIZE / gridCols) * gridCols
  }, [density, gridCols])

  const renderSkeletonGrid = useCallback((config?: { rows?: number; useBatchSize?: boolean }) => {
    const rows = config?.rows ?? 2
    const baseCount = config?.useBatchSize ? skeletonBatchCount : rows * gridCols
    const skeletonCount = density === 'list'
      ? Math.max(baseCount, skeletonBatchCount)
      : Math.max(baseCount, gridCols)
    const skeletonDensity: 'comfy' | 'compact' = density === 'list' ? 'compact' : 'comfy'

    return (
      <div className={`${getLayoutClasses()} w-full max-w-full`} data-testid="pokemon-skeleton-grid">
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <PokemonCardSkeleton key={`pokedex-skeleton-${index}`} density={skeletonDensity} />
        ))}
      </div>
    )
  }, [density, gridCols, skeletonBatchCount, getLayoutClasses])

  // Optimized row renderer with memoization
  const renderRow = useCallback((rowIndex: number) => {
    // Check if this is the special forms header row
    if (specialFormsPokemon.length > 0 && rowIndex === regularRows) {
      return (
        <div
          key={`special-forms-header-${rowIndex}`}
          className="w-full py-4"
          style={{ height: 60 }}
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
      if (density === 'list') {
        const pokemon = regularPokemon[rowIndex]
        if (!pokemon) return null

        return (
          <div key={pokemon.id} className="w-full">
            <ModernPokemonCard
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

      const startIndex = rowIndex * getGridDimensions.cols
      const endIndex = Math.min(startIndex + getGridDimensions.cols, regularPokemon.length)
      const rowPokemon = regularPokemon.slice(startIndex, endIndex)

      return (
        <div
          key={rowIndex}
          className={`${getLayoutClasses()} w-full max-w-full`}
          style={{ gap: getGridDimensions.gap }}
        >
          {rowPokemon.map((pokemon) => {
            const key = pokemon.id
            if (density === '9cols') {
              return (
                <PokemonCard
                  key={key}
                  pokemon={pokemon}
                  isFavorite={false}
                  onToggleFavorite={() => {}}
                  isInComparison={comparisonList.includes(pokemon.id)}
                  onToggleComparison={onToggleComparison}
                  cardSize="compact"
                  mode="grid"
                />
              )
            }

            return (
              <ModernPokemonCard
                key={key}
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
    if (rowIndex > regularRows) {
      const specialFormsRowIndex = rowIndex - regularRows - 1
      
      if (density === 'list') {
        const pokemon = specialFormsPokemon[specialFormsRowIndex]
        if (!pokemon) return null

        return (
          <div key={pokemon.id} className="w-full">
            <ModernPokemonCard
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

      const startIndex = specialFormsRowIndex * getGridDimensions.cols
      const endIndex = Math.min(startIndex + getGridDimensions.cols, specialFormsPokemon.length)
      const rowPokemon = specialFormsPokemon.slice(startIndex, endIndex)

      return (
        <div
          key={`special-forms-${rowIndex}`}
          className={`${getLayoutClasses()} w-full max-w-full`}
          style={{ gap: getGridDimensions.gap }}
        >
          {rowPokemon.map((pokemon) => {
            const key = pokemon.id
            if (density === '9cols') {
              return (
                <PokemonCard
                  key={key}
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
                key={key}
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

    return null
  }, [regularPokemon, specialFormsPokemon, regularRows, density, getGridDimensions, comparisonList, selectedPokemon, onToggleComparison, getLayoutClasses])

  // Deduplicate Pokemon
  const uniqueRegularPokemon = useMemo(() => {
    const seen = new Set()
    return regularPokemon.filter(pokemon => {
      if (seen.has(pokemon.id)) {
        return false
      }
      seen.add(pokemon.id)
      return true
    })
  }, [regularPokemon])

  // Show loading state
  if ((isLoading || isSorting) && pokemonList.length === 0) {
    return (
      <div className={`w-full max-w-full ${className}`}>
        {renderSkeletonGrid({ rows: 3 })}
      </div>
    )
  }

  // Render virtualized content when enabled
  if (enableVirtualization && uniqueRegularPokemon.length > 50) {
    return (
      <div className={`w-full max-w-full ${className}`}>
        {uniqueRegularPokemon.length > 0 && (
          <div
            className="w-full h-full"
            data-pokemon-grid
            style={{
              height: 'auto',
              minHeight: 'calc(100vh - 9rem)',
            }}
          >
            <div
              style={{
                height: totalSize,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualItems.map((virtualRow) => (
                <div
                  key={virtualRow.index}
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
              
              {/* Infinite scroll sentinel */}
              <div
                ref={sentinelRef}
                style={{
                  position: 'absolute',
                  top: totalSize,
                  left: 0,
                  width: '100%',
                  height: '20px',
                  backgroundColor: 'transparent',
                  zIndex: 1,
                }}
                data-infinite-scroll-sentinel="true"
              />
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {(isLoading || isLoadingMore) && (
          <div className="flex justify-center py-4">
            <div className={`animate-spin rounded-full h-6 w-6 border-b-2 ${
              theme === 'gold' ? 'border-gold-accent'
              : theme === 'red' ? 'border-red-accent'
              : theme === 'ruby' ? 'border-ruby-accent'
              : 'border-poke-blue'
            }`} />
          </div>
        )}

        {isLoadingMore && uniqueRegularPokemon.length > 0 && (
          <div className="mt-4">
            {renderSkeletonGrid({ useBatchSize: true })}
          </div>
        )}
      </div>
    )
  }

  // Render non-virtualized content
  return (
    <div className={`w-full max-w-full overflow-x-hidden ${className}`}>
      {/* Regular Pokemon */}
      {uniqueRegularPokemon.length > 0 && (
        <motion.div 
          className={`${getLayoutClasses()} w-full max-w-full ${density === 'list' ? 'pl-0 pr-0' : 'pl-0 pr-0'}`} 
          data-pokemon-grid
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.02, // Reduced stagger for better performance
                delayChildren: 0.05
              }
            }
          }}
        >
          <AnimatePresence initial={false}>
            {uniqueRegularPokemon.map((pokemon, index) => (
              <motion.div
                key={pokemon.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, delay: index * 0.01 }}
                layout
              >
                <ModernPokemonCard
                  pokemon={pokemon}
                  isInComparison={comparisonList.includes(pokemon.id)}
                  onToggleComparison={onToggleComparison}
                  onSelect={undefined}
                  isSelected={selectedPokemon?.id === pokemon.id}
                  density={density}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
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
        <motion.div 
          className={`${getLayoutClasses()} w-full max-w-full ${density === 'list' ? 'pl-0 pr-0' : 'pl-0 pr-0'}`} 
          data-pokemon-grid
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.02,
                delayChildren: 0.1
              }
            }
          }}
        >
          <AnimatePresence initial={false}>
            {specialFormsPokemon.map((pokemon, index) => (
              <motion.div
                key={pokemon.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, delay: index * 0.01 }}
                layout
              >
                <ModernPokemonCard
                  pokemon={pokemon}
                  isInComparison={comparisonList.includes(pokemon.id)}
                  onToggleComparison={onToggleComparison}
                  onSelect={undefined}
                  isSelected={selectedPokemon?.id === pokemon.id}
                  density={density}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Infinite scroll sentinel */}
      <div
        ref={sentinelRef}
        style={{
          width: '100%',
          height: '20px',
          backgroundColor: 'transparent',
        }}
        data-infinite-scroll-sentinel="true"
      />

      {/* Loading indicator */}
      {(isLoading || isLoadingMore) && (
        <div className="flex justify-center py-4">
          <div className={`animate-spin rounded-full h-6 w-6 border-b-2 ${
            theme === 'gold' ? 'border-gold-accent'
            : theme === 'red' ? 'border-red-accent'
            : theme === 'ruby' ? 'border-ruby-accent'
            : 'border-poke-blue'
          }`} />
        </div>
      )}

      {isLoadingMore && uniqueRegularPokemon.length > 0 && (
        <div className="mt-4">
          {renderSkeletonGrid({ useBatchSize: true })}
        </div>
      )}
    </div>
  )
}
