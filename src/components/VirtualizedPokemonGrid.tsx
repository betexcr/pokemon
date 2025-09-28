'use client'

import React, { useMemo, useCallback, useRef, useEffect } from 'react'
import { Pokemon } from '@/types/pokemon'
import ModernPokemonCard from './ModernPokemonCard'
import PokemonCard from './PokemonCard'
import { PokemonCardSkeleton } from './PokemonCard'
import { useTheme } from './ThemeProvider'
import { useVirtualizer } from '@tanstack/react-virtual'
import { motion, AnimatePresence } from 'framer-motion'

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
  sortBy?: string // Add sort information for optimization
  isSorting?: boolean // Add sorting state
  // Infinite scroll props
  hasMorePokemon?: boolean
  isLoadingMore?: boolean
  onLoadMore?: () => void
  sentinelRef?: (node: HTMLDivElement | null) => void
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
  showSpecialForms = true, // Default to true for backward compatibility
  sortBy = 'id',
  isSorting = false,
  // Infinite scroll props
  hasMorePokemon = true,
  isLoadingMore = false,
  onLoadMore,
  sentinelRef
}: VirtualizedPokemonGridProps) {

  let theme = 'light'
  try {
    const themeContext = useTheme()
    theme = themeContext.theme
  } catch {
    // Theme provider not available, use default
  }

  // Calculate layout based on density - fixed column counts with proper aspect ratios
  const getLayoutClasses = () => {
    switch (density) {
      case '3cols': return 'grid grid-cols-3 gap-4 items-start' // Always 3 columns, items start aligned
      case '6cols': return 'grid grid-cols-6 gap-3 items-start' // Always 6 columns, items start aligned
      case '9cols': return 'grid grid-cols-9 gap-2 items-start' // Always 9 columns, items start aligned
      case 'list': return 'flex flex-col gap-1' // List view with tighter spacing
      default: return 'grid grid-cols-6 gap-3 items-start' // Default to 6 columns, items start aligned
    }
  }

  // Staggered animation delay calculation
  const getStaggerDelay = (index: number) => {
    const baseDelay = 50 // Base delay in ms
    const maxDelay = 300 // Maximum delay in ms
    const delay = Math.min(index * baseDelay, maxDelay)
    return delay
  }

  // Animation variants for staggered cards
  const cardVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      y: 20
    },
    visible: (index: number) => ({
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.4,
        delay: getStaggerDelay(index) / 1000
      }
    }),
    exit: {
      opacity: 0,
      scale: 0.8,
      y: -20,
      transition: {
        duration: 0.3
      }
    }
  }

  // Calculate grid dimensions for virtualization - Natural dimensions
  const getGridDimensions = useMemo(() => {
    switch (density) {
      case '3cols': return { cols: 3, itemHeight: 'auto', gap: 16 } // Natural height
      case '6cols': return { cols: 6, itemHeight: 'auto', gap: 12 } // Natural height
      case '9cols': return { cols: 9, itemHeight: 'auto', gap: 8 }  // Natural height
      case 'list': return { cols: 1, itemHeight: 60, gap: 4 }
      default: return { cols: 6, itemHeight: 140, gap: 12 }
    }
  }, [density])

  const gridCols = getGridDimensions.cols

  const getSkeletonCount = (rows = 2) => {
    if (density === 'list') {
      return Math.max(4, rows * gridCols)
    }
    return rows * gridCols
  }

  const renderSkeletonGrid = (rows = 2) => {
    const skeletonCount = getSkeletonCount(rows)
    const skeletonDensity: 'comfy' | 'compact' = density === 'list' ? 'compact' : 'comfy'

    return (
      <div className={`${getLayoutClasses()} w-full max-w-full`} data-testid="pokemon-skeleton-grid">
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <PokemonCardSkeleton key={`pokedex-skeleton-${index}`} density={skeletonDensity} />
        ))}
      </div>
    )
  }

  if ((isLoading || isSorting) && pokemonList.length === 0) {
    return (
      <div className={`w-full max-w-full ${className}`}>
        {renderSkeletonGrid(3)}
      </div>
    )
  }

  const shouldShowInitialSkeletons = (isLoading || isSorting) && pokemonList.length === 0

  if (shouldShowInitialSkeletons) {
    return (
      <div className={`w-full max-w-full ${className}`}>
        {renderSkeletonGrid(3)}
      </div>
    )
  }

  // Helper: derive a lightweight version key that changes when types data fills in
  const computeTypesVersion = useCallback(() => {
    try {
      let totalTypesCount = 0
      for (const p of pokemonList) {
        totalTypesCount += (p.types?.length || 0)
      }
      return String(totalTypesCount)
    } catch {
      return '0'
    }
  }, [pokemonList])

  // Memoize Pokemon list processing to avoid recalculation on every render
  const processedPokemonData = useMemo(() => {
    // Find the transition point from regular Pokemon to special forms (only if showSpecialForms is true)
    const specialFormsStartIndex = showSpecialForms ? pokemonList.findIndex(pokemon => pokemon.id >= 10001) : -1
    
    // Split the Pokemon list into regular and special forms
    // Always use the full pokemonList to ensure all Pokemon are rendered
    const regularPokemon = pokemonList
    const specialFormsPokemon = showSpecialForms && specialFormsStartIndex >= 0 ? pokemonList.slice(specialFormsStartIndex) : []

    // Calculate total rows for virtualization (including special forms section)
    const regularRows = Math.ceil(regularPokemon.length / getGridDimensions.cols)
    const specialFormsRows = specialFormsPokemon.length > 0 ? Math.ceil(specialFormsPokemon.length / getGridDimensions.cols) + 1 : 0 // +1 for header
    const totalRows = regularRows + specialFormsRows

    return {
      regularPokemon,
      specialFormsPokemon,
      regularRows,
      specialFormsRows,
      totalRows
    }
  // Include a derived version so that when nested objects (e.g., types) are populated in-place,
  // this memo still refreshes and rows re-render with badges.
  }, [pokemonList, showSpecialForms, getGridDimensions.cols, computeTypesVersion()])

  // Cache for rendered rows to avoid re-rendering when data hasn't changed
  const renderedRowsCache = useRef<Map<string, React.ReactNode>>(new Map())
  const lastRenderData = useRef<string>('')

  // Create cache key for current render state
  const getCacheKey = useCallback(() => {
    // Add a content-derived key so cache invalidates when type data loads asynchronously
    const typesVersion = computeTypesVersion()
    return `${pokemonList.length}-${density}-${sortBy}-${comparisonList.length}-${selectedPokemon?.id || 'none'}-${typesVersion}`
  }, [pokemonList.length, density, sortBy, comparisonList.length, selectedPokemon?.id, computeTypesVersion])

  // Clear cache when data changes significantly
  useEffect(() => {
    const currentCacheKey = getCacheKey()
    if (lastRenderData.current !== currentCacheKey) {
      renderedRowsCache.current.clear()
      lastRenderData.current = currentCacheKey
    }
  }, [getCacheKey])

  // Use processed data
  const { regularPokemon, specialFormsPokemon, regularRows, specialFormsRows, totalRows } = processedPokemonData

  // Create virtualizer for virtualization
  const parentRef = React.useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: totalRows,
    getScrollElement: () => {
      // Use the main scroll container instead of creating our own
      return document.querySelector('.flex-1.min-h-0.overflow-y-auto') || parentRef.current
    },
    estimateSize: () => (typeof getGridDimensions.itemHeight === 'number' ? getGridDimensions.itemHeight : 140) + getGridDimensions.gap,
    overscan: 5, // Render 5 extra rows for smooth scrolling
  })

  // Optimized render function with caching
  const renderRow = useCallback((rowIndex: number) => {
    const cacheKey = `${getCacheKey()}-${rowIndex}`
    
    // Check cache first
    if (renderedRowsCache.current.has(cacheKey)) {
      return renderedRowsCache.current.get(cacheKey)
    }
    let rowContent: React.ReactNode = null
    let shouldCache = true

    // Check if this is the special forms header row
    if (specialFormsPokemon.length > 0 && rowIndex === regularRows) {
      rowContent = (
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

        const hasLoadedData = (pokemon.types?.length || 0) > 0
        if (!hasLoadedData) {
          shouldCache = false
        }

        rowContent = (
          <div
            key={pokemon.id}
            className="w-full"
          >
            {hasLoadedData ? (
              <ModernPokemonCard
                key={pokemon.id}
                pokemon={pokemon}
                isInComparison={comparisonList.includes(pokemon.id)}
                onToggleComparison={onToggleComparison}
                onSelect={undefined}
                isSelected={selectedPokemon?.id === pokemon.id}
                density={density}
              />
            ) : (
              <div
                data-pokemon-id={pokemon.id}
                className="relative overflow-hidden rounded-2xl border border-border bg-slate-100/80 shadow-sm dark:bg-slate-900/40"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/10 to-transparent dark:from-white/10 dark:via-white/5 pointer-events-none" />
                <div className="relative">
                  <div className="h-1.5 w-full rounded-t-2xl bg-slate-300/80 dark:bg-slate-700/70" />
                  <div className="aspect-square bg-slate-200/70 dark:bg-slate-800/60 flex items-center justify-center">
                    <div className="w-16 h-16 bg-slate-300/60 dark:bg-slate-700/60 rounded-full animate-pulse" />
                  </div>
                  <div className={`space-y-3 ${density === 'list' ? 'p-3' : 'p-4'}`}>
                    <div className="flex items-baseline justify-between">
                      <h3 className={`font-semibold text-gray-800 dark:text-gray-200 ${
                        density === 'list' ? 'text-sm' : 'text-base'
                      }`}>
                        {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1).replace('-', ' ')}
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        #{String(pokemon.id).padStart(3, "0")}
                      </span>
                    </div>
                    <div className="flex gap-1.5 justify-center">
                      <div className="h-6 w-16 rounded-full bg-slate-200/80 dark:bg-slate-800/60 animate-pulse" />
                      <div className="h-6 w-12 rounded-full bg-slate-200/80 dark:bg-slate-800/60 animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      }

      // For grid views, use the original logic
      if (!rowContent) {
        const startIndex = rowIndex * getGridDimensions.cols
        const endIndex = Math.min(startIndex + getGridDimensions.cols, regularPokemon.length)
        const rowPokemon = regularPokemon.slice(startIndex, endIndex)

        if (rowPokemon.some(p => (p.types?.length || 0) === 0)) {
          shouldCache = false
        }

        rowContent = (
          <div
            key={rowIndex}
            className={`${getLayoutClasses()} w-full max-w-full`}
            style={{
              gap: getGridDimensions.gap,
            }}
          >
            {rowPokemon.map((pokemon) => {
              const key = pokemon.id
              const hasLoadedData = (pokemon.types?.length || 0) > 0

              if (!hasLoadedData) {
                shouldCache = false
              }

              if (hasLoadedData) {
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
              } else {
                // Render skeleton card
                return (
                  <div
                    key={key}
                    data-pokemon-id={pokemon.id}
                    className="relative overflow-hidden rounded-2xl border border-border bg-slate-100/80 shadow-sm dark:bg-slate-900/40"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/10 to-transparent dark:from-white/10 dark:via-white/5 pointer-events-none" />
                    <div className="relative">
                      <div className="h-1.5 w-full rounded-t-2xl bg-slate-300/80 dark:bg-slate-700/70" />
                      <div className="aspect-square bg-slate-200/70 dark:bg-slate-800/60 flex items-center justify-center">
                        <div className="w-16 h-16 bg-slate-300/60 dark:bg-slate-700/60 rounded-full animate-pulse" />
                      </div>
                      <div className={`space-y-3 ${density === 'list' ? 'p-3' : 'p-4'}`}>
                        <div className="flex items-baseline justify-between">
                          <h3 className={`font-semibold text-gray-800 dark:text-gray-200 ${
                            density === 'list' ? 'text-sm' : 'text-base'
                          }`}>
                            {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1).replace('-', ' ')}
                          </h3>
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                            #{String(pokemon.id).padStart(3, "0")}
                          </span>
                        </div>
                        <div className="flex gap-1.5 justify-center">
                          <div className="h-6 w-16 rounded-full bg-slate-200/80 dark:bg-slate-800/60 animate-pulse" />
                          <div className="h-6 w-12 rounded-full bg-slate-200/80 dark:bg-slate-800/60 animate-pulse" />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }
            })}
          </div>
        )
      }
    }

    // Handle special forms Pokemon rows
    if (rowIndex > regularRows) {
      const specialFormsRowIndex = rowIndex - regularRows - 1 // -1 for header
      
      // For list view, each row contains only one Pokemon
      if (density === 'list') {
        const pokemon = specialFormsPokemon[specialFormsRowIndex]
        if (!pokemon) return null

        const hasLoadedData = (pokemon.types?.length || 0) > 0
        if (!hasLoadedData) {
          shouldCache = false
        }

        rowContent = (
          <div
            key={pokemon.id}
            className="w-full"
          >
            {hasLoadedData ? (
              <ModernPokemonCard
                key={pokemon.id}
                pokemon={pokemon}
                isInComparison={comparisonList.includes(pokemon.id)}
                onToggleComparison={onToggleComparison}
                onSelect={undefined}
                isSelected={selectedPokemon?.id === pokemon.id}
                density={density}
              />
            ) : (
              <div
                data-pokemon-id={pokemon.id}
                className="relative overflow-hidden rounded-2xl border border-border bg-slate-100/80 shadow-sm dark:bg-slate-900/40"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/10 to-transparent dark:from-white/10 dark:via-white/5 pointer-events-none" />
                <div className="relative">
                  <div className="h-1.5 w-full rounded-t-2xl bg-slate-300/80 dark:bg-slate-700/70" />
                  <div className="aspect-square bg-slate-200/70 dark:bg-slate-800/60 flex items-center justify-center">
                    <div className="w-16 h-16 bg-slate-300/60 dark:bg-slate-700/60 rounded-full animate-pulse" />
                  </div>
                  <div className={`space-y-3 ${density === 'list' ? 'p-3' : 'p-4'}`}>
                    <div className="flex items-baseline justify-between">
                      <h3 className={`font-semibold text-gray-800 dark:text-gray-200 ${
                        density === 'list' ? 'text-sm' : 'text-base'
                      }`}>
                        {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1).replace('-', ' ')}
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        #{String(pokemon.id).padStart(3, "0")}
                      </span>
                    </div>
                    <div className="flex gap-1.5 justify-center">
                      <div className="h-6 w-16 rounded-full bg-slate-200/80 dark:bg-slate-800/60 animate-pulse" />
                      <div className="h-6 w-12 rounded-full bg-slate-200/80 dark:bg-slate-800/60 animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      }

      // For grid views, use the original logic
      if (!rowContent) {
        const startIndex = specialFormsRowIndex * getGridDimensions.cols
        const endIndex = Math.min(startIndex + getGridDimensions.cols, specialFormsPokemon.length)
        const rowPokemon = specialFormsPokemon.slice(startIndex, endIndex)

        if (rowPokemon.some(p => (p.types?.length || 0) === 0)) {
          shouldCache = false
        }

        rowContent = (
          <div
            key={`special-forms-${rowIndex}`}
            className={`${getLayoutClasses()} w-full max-w-full`}
            style={{
              gap: getGridDimensions.gap,
            }}
          >
            {rowPokemon.map((pokemon) => {
              const key = pokemon.id
              const hasLoadedData = (pokemon.types?.length || 0) > 0

              if (!hasLoadedData) {
                shouldCache = false
              }

              if (hasLoadedData) {
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
              } else {
                // Render skeleton card
                return (
                  <div
                    key={key}
                    data-pokemon-id={pokemon.id}
                    className="relative overflow-hidden rounded-2xl border border-border bg-slate-100/80 shadow-sm dark:bg-slate-900/40"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/10 to-transparent dark:from-white/10 dark:via-white/5 pointer-events-none" />
                    <div className="relative">
                      <div className="h-1.5 w-full rounded-t-2xl bg-slate-300/80 dark:bg-slate-700/70" />
                      <div className="aspect-square bg-slate-200/70 dark:bg-slate-800/60 flex items-center justify-center">
                        <div className="w-16 h-16 bg-slate-300/60 dark:bg-slate-700/60 rounded-full animate-pulse" />
                      </div>
                      <div className={`space-y-3 ${density === 'list' ? 'p-3' : 'p-4'}`}>
                        <div className="flex items-baseline justify-between">
                          <h3 className={`font-semibold text-gray-800 dark:text-gray-200 ${
                            density === 'list' ? 'text-sm' : 'text-base'
                          }`}>
                            {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1).replace('-', ' ')}
                          </h3>
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                            #{String(pokemon.id).padStart(3, "0")}
                          </span>
                        </div>
                        <div className="flex gap-1.5 justify-center">
                          <div className="h-6 w-16 rounded-full bg-slate-200/80 dark:bg-slate-800/60 animate-pulse" />
                          <div className="h-6 w-12 rounded-full bg-slate-200/80 dark:bg-slate-800/60 animate-pulse" />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }
            })}
          </div>
        )
      }
    }

    // Cache the result and return
    if (rowContent) {
      if (shouldCache) {
        renderedRowsCache.current.set(cacheKey, rowContent)
      }
    }

    return rowContent
  }, [getCacheKey, regularPokemon, specialFormsPokemon, regularRows, density, getGridDimensions, comparisonList, selectedPokemon, onToggleComparison, getLayoutClasses])

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
                ref={sentinelRef}
                style={{
                  position: 'absolute',
                  top: virtualizer.getTotalSize(),
                  left: 0,
                  width: '100%',
                  height: '20px', // Increased height for better detection
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
            {renderSkeletonGrid(1)}
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
                staggerChildren: 0.05,
                delayChildren: 0.1
              }
            }
          }}
        >
          <AnimatePresence initial={false}>
            {uniqueRegularPokemon.map((pokemon, index) => {
              // Check if Pokemon has loaded data (types available)
              const hasLoadedData = (pokemon.types?.length || 0) > 0
              
              return (
                <motion.div
                  key={pokemon.id}
                  variants={cardVariants}
                  custom={index}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout
                >
                  {hasLoadedData ? (
                    <ModernPokemonCard
                      pokemon={pokemon}
                      isInComparison={comparisonList.includes(pokemon.id)}
                      onToggleComparison={onToggleComparison}
                      onSelect={undefined}
                      isSelected={selectedPokemon?.id === pokemon.id}
                      density={density}
                    />
                  ) : (
                    // Render skeleton card with Pokemon ID and name
                    <div
                      data-pokemon-id={pokemon.id}
                      className="relative overflow-hidden rounded-2xl border border-border bg-slate-100/80 shadow-sm dark:bg-slate-900/40"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/10 to-transparent dark:from-white/10 dark:via-white/5 pointer-events-none" />
                      <div className="relative">
                        <div className="h-1.5 w-full rounded-t-2xl bg-slate-300/80 dark:bg-slate-700/70" />
                        <div className="aspect-square bg-slate-200/70 dark:bg-slate-800/60 flex items-center justify-center">
                          <div className="w-16 h-16 bg-slate-300/60 dark:bg-slate-700/60 rounded-full animate-pulse" />
                        </div>
                        <div className={`space-y-3 ${density === 'list' ? 'p-3' : 'p-4'}`}>
                          <div className="flex items-baseline justify-between">
                            <h3 className={`font-semibold text-gray-800 dark:text-gray-200 ${
                              density === 'list' ? 'text-sm' : 'text-base'
                            }`}>
                              {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1).replace('-', ' ')}
                            </h3>
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                              #{String(pokemon.id).padStart(3, "0")}
                            </span>
                          </div>
                          <div className="flex gap-1.5 justify-center">
                            <div className="h-6 w-16 rounded-full bg-slate-200/80 dark:bg-slate-800/60 animate-pulse" />
                            <div className="h-6 w-12 rounded-full bg-slate-200/80 dark:bg-slate-800/60 animate-pulse" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )
            })}
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
                staggerChildren: 0.05,
                delayChildren: 0.2
              }
            }
          }}
        >
          <AnimatePresence initial={false}>
            {specialFormsPokemon.map((pokemon, index) => {
              // Check if Pokemon has loaded data (types available)
              const hasLoadedData = (pokemon.types?.length || 0) > 0
              
              return (
                <motion.div
                  key={pokemon.id}
                  variants={cardVariants}
                  custom={index}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout
                >
                  {hasLoadedData ? (
                    <ModernPokemonCard
                      pokemon={pokemon}
                      isInComparison={comparisonList.includes(pokemon.id)}
                      onToggleComparison={onToggleComparison}
                      onSelect={undefined}
                      isSelected={selectedPokemon?.id === pokemon.id}
                      density={density}
                    />
                  ) : (
                    // Render skeleton card with Pokemon ID and name
                    <div
                      data-pokemon-id={pokemon.id}
                      className="relative overflow-hidden rounded-2xl border border-border bg-slate-100/80 shadow-sm dark:bg-slate-900/40"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/10 to-transparent dark:from-white/10 dark:via-white/5 pointer-events-none" />
                      <div className="relative">
                        <div className="h-1.5 w-full rounded-t-2xl bg-slate-300/80 dark:bg-slate-700/70" />
                        <div className="aspect-square bg-slate-200/70 dark:bg-slate-800/60 flex items-center justify-center">
                          <div className="w-16 h-16 bg-slate-300/60 dark:bg-slate-700/60 rounded-full animate-pulse" />
                        </div>
                        <div className={`space-y-3 ${density === 'list' ? 'p-3' : 'p-4'}`}>
                          <div className="flex items-baseline justify-between">
                            <h3 className={`font-semibold text-gray-800 dark:text-gray-200 ${
                              density === 'list' ? 'text-sm' : 'text-base'
                            }`}>
                              {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1).replace('-', ' ')}
                            </h3>
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                              #{String(pokemon.id).padStart(3, "0")}
                            </span>
                          </div>
                          <div className="flex gap-1.5 justify-center">
                            <div className="h-6 w-16 rounded-full bg-slate-200/80 dark:bg-slate-800/60 animate-pulse" />
                            <div className="h-6 w-12 rounded-full bg-slate-200/80 dark:bg-slate-800/60 animate-pulse" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Infinite scroll sentinel for non-virtualized content */}
      <div
        ref={sentinelRef}
        style={{
          width: '100%',
          height: '20px', // Increased height for better detection
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
          {renderSkeletonGrid(1)}
        </div>
      )}
    </div>
  )
}
