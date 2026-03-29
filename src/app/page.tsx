'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Pokemon, FilterState } from '@/types/pokemon'
import { getPokemonTotalCount, generateAllPokemonSkeletons, generateSpecialFormsPokemon, getPokemonFallbackImage, getPokemonMainPageImage, getPokemonShinyImage } from '@/lib/api'
import { useTheme } from '@/components/ThemeProvider'
import { useRequestCancellation } from '@/hooks/useRequestCancellation'
import { useViewportCancellation } from '@/hooks/useViewportCancellation'
import RedPokedexLayout from '@/components/RedPokedexLayout'
import GoldPokedexLayout from '@/components/GoldPokedexLayout'
import RubyPokedexLayout from '@/components/RubyPokedexLayout'
import ModernPokedexLayout from '@/components/ModernPokedexLayout'

export default function Home() {
  // Setup automatic request cancellation on navigation
  useRequestCancellation({
    contexts: ['pokedex-main']
  })

  // Setup viewport-aware cancellation to cancel off-screen Pokemon requests
  useViewportCancellation({
    enabled: true,
    bufferMargin: 1500, // Keep requests active 1500px beyond viewport
    contextPrefix: 'viewport'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-page', 'pokedex-main')
    return () => {
      document.documentElement.removeAttribute('data-page')
    }
  }, [])
  const [comparisonList, setComparisonList] = useState<number[]>([])
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null)

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    types: [],
    generation: '',
    sortBy: 'id',
    sortOrder: 'asc'
  })

  const { theme } = useTheme()

  // State for Pokemon data with infinite scroll
  const [pokemonList, setPokemonList] = useState<Pokemon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMorePokemon, setHasMorePokemon] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [currentOffset, setCurrentOffset] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  
  // Refs to avoid dependency issues in callbacks
  const isLoadingMoreRef = useRef(false)
  const hasMorePokemonRef = useRef(true)
  const currentOffsetRef = useRef(0)
  const totalCountRef = useRef(0)
  const isTriggeredRef = useRef(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  // Update refs when state changes
  useEffect(() => {
    isLoadingMoreRef.current = isLoadingMore
    hasMorePokemonRef.current = hasMorePokemon
    currentOffsetRef.current = currentOffset
    totalCountRef.current = totalCount
  }, [isLoadingMore, hasMorePokemon, currentOffset, totalCount])

  const getViewportBatchSize = useCallback(() => {
    if (typeof window === 'undefined') {
      return 100
    }

    const density = localStorage.getItem('pokedex.cardDensity') || '6cols'
    const viewportHeight = Math.max(window.innerHeight - 160, 480)

    const densityConfig: Record<string, { cols: number; rowHeight: number }> = {
      '3cols': { cols: 3, rowHeight: 486 },
      '6cols': { cols: 6, rowHeight: 372 },
      '9cols': { cols: 9, rowHeight: 328 },
      '12cols': { cols: 12, rowHeight: 300 },
      list: { cols: 1, rowHeight: 64 }
    }

    const config = densityConfig[density] || densityConfig['6cols']
    const visibleRows = Math.ceil(viewportHeight / config.rowHeight)
    const rowsPerChunk = Math.max(visibleRows + 10, 14)
    const itemsPerChunk = rowsPerChunk * config.cols

    return Math.min(Math.max(itemsPerChunk, 40), 220)
  }, [])
  
  // Load initial Pokemon data

  useEffect(() => {
    const loadInitialPokemon = async () => {
      try {
        setLoading(true)
        
        const total = await getPokemonTotalCount()
        setTotalCount(total)
        
        // Load a smaller initial batch of skeletons for faster initial render (50 instead of 200)
        // This dramatically improves Time to First Paint and First Contentful Paint
        const initialBatchSize = getViewportBatchSize()
        const initialBatch = generateAllPokemonSkeletons(initialBatchSize)
        setPokemonList(initialBatch)
        setCurrentOffset(initialBatchSize)
        setLoading(false)
        setError(null)
      } catch (err) {
        console.error('❌ Error loading initial Pokemon:', err)
        setError('Failed to load Pokemon list')
        // Fallback to larger skeleton batch
        const fallbackBatchSize = Math.max(getViewportBatchSize(), 120)
        const skeletons = generateAllPokemonSkeletons(fallbackBatchSize)
        setPokemonList(skeletons)
        setTotalCount(1025) // Fallback count
        setCurrentOffset(fallbackBatchSize)
        setLoading(false)
      }
    }

    loadInitialPokemon()
  }, [getViewportBatchSize])

  // Load to end - load all remaining Pokemon at once
  const loadToEnd = useCallback(async () => {
    if (isLoadingMoreRef.current || !hasMorePokemonRef.current || loading) {
      return
    }

    setIsLoadingMore(true)

    try {
      const currentOffsetValue = currentOffsetRef.current
      const remaining = totalCountRef.current - currentOffsetValue
      
      if (remaining <= 0) {
        setHasMorePokemon(false)
        setIsLoadingMore(false)
        return
      }

      // Generate all remaining skeletons at once
      const newBatch = generateAllPokemonSkeletons(remaining).map((pokemon, index) => ({
        ...pokemon,
        id: currentOffsetValue + index + 1,
        name: `pokemon-${currentOffsetValue + index + 1}`,
        sprites: {
          ...pokemon.sprites,
          front_default: getPokemonFallbackImage(currentOffsetValue + index + 1),
          other: {
            ...pokemon.sprites.other,
            'official-artwork': {
              front_default: getPokemonMainPageImage(currentOffsetValue + index + 1),
              front_shiny: getPokemonShinyImage(currentOffsetValue + index + 1),
            }
          }
        }
      }))

      setPokemonList(prev => [...prev, ...newBatch])
      setCurrentOffset(totalCountRef.current)
      setHasMorePokemon(false)

      try {
        const specialForms = await generateSpecialFormsPokemon()
        if (specialForms.length > 0) {
          setPokemonList(prev => [...prev, ...specialForms])
          // Update total count to include special forms
          setTotalCount(prev => prev + specialForms.length)
        }
      } catch (err) {
        console.error('❌ Error loading special forms:', err)
      }

    } catch (err) {
      console.error('❌ Error loading to end:', err)
    } finally {
      setIsLoadingMore(false)
    }
  }, [loading])

  // Jump to specific Pokemon index - load up to that point if needed
  const jumpToPokemonIndex = useCallback(async (targetIndex: number) => {
    if (loading) return

    const safeTargetIndex = Math.max(0, targetIndex)
    
    const currentLoadedCount = currentOffsetRef.current
    const jumpBuffer = Math.max(getViewportBatchSize(), 80)
    const effectiveTotalCount = Math.max(
      totalCountRef.current > 0 ? totalCountRef.current : 1025,
      safeTargetIndex + jumpBuffer + 1
    )
    
    // If already loaded, no need to load more
    if (safeTargetIndex < currentLoadedCount) {
      return
    }
    
    setIsLoadingMore(true)
    
    try {
      const pokemonToLoad = safeTargetIndex - currentLoadedCount + jumpBuffer // Load surrounding rows for smooth jump landing
      const cappedLoad = Math.min(pokemonToLoad, effectiveTotalCount - currentLoadedCount)
      
      if (cappedLoad <= 0) {
        return
      }
      
      const newBatch = generateAllPokemonSkeletons(cappedLoad).map((pokemon, index) => ({
        ...pokemon,
        id: currentLoadedCount + index + 1,
        name: `pokemon-${currentLoadedCount + index + 1}`,
        sprites: {
          ...pokemon.sprites,
          front_default: getPokemonFallbackImage(currentLoadedCount + index + 1),
          other: {
            ...pokemon.sprites.other,
            'official-artwork': {
              front_default: getPokemonMainPageImage(currentLoadedCount + index + 1),
              front_shiny: getPokemonShinyImage(currentLoadedCount + index + 1),
            }
          }
        }
      }))
      
      setPokemonList(prev => [...prev, ...newBatch])
      const newOffset = currentLoadedCount + newBatch.length
      setCurrentOffset(newOffset)
      currentOffsetRef.current = newOffset
      
      if (newOffset >= effectiveTotalCount) {
        setHasMorePokemon(false)
        hasMorePokemonRef.current = false
      }

    } catch (err) {
      console.error('❌ Error jumping to Pokemon index:', err)
    } finally {
      setIsLoadingMore(false)
    }
  }, [loading, getViewportBatchSize])

  // Load more Pokemon function for infinite scroll
  const loadMorePokemon = useCallback(async () => {
    if (isLoadingMoreRef.current || !hasMorePokemonRef.current || loading) {
      return
    }
    
    isLoadingMoreRef.current = true
    setIsLoadingMore(true)
    
    try {
      const currentOffsetValue = currentOffsetRef.current
      const batchSize = getViewportBatchSize()
      
      // Generate skeletons instantly without API calls for faster loading
      const newBatch = generateAllPokemonSkeletons(batchSize).map((pokemon, index) => ({
        ...pokemon,
        id: currentOffsetValue + index + 1,
        name: `pokemon-${currentOffsetValue + index + 1}`,
        sprites: {
          ...pokemon.sprites,
          front_default: getPokemonFallbackImage(currentOffsetValue + index + 1),
          other: {
            ...pokemon.sprites.other,
            'official-artwork': {
              front_default: getPokemonMainPageImage(currentOffsetValue + index + 1),
              front_shiny: getPokemonShinyImage(currentOffsetValue + index + 1),
            }
          }
        }
      }))
      
      // Add a minimal delay to make the loading feel more natural
      await new Promise(resolve => setTimeout(resolve, 10))
      
      if (newBatch.length === 0) {
        setHasMorePokemon(false)
      } else {
        setPokemonList(prev => [...prev, ...newBatch])
        const newOffset = currentOffsetValue + newBatch.length
        setCurrentOffset(newOffset)
        
        // Check if we've reached the end
        if (newOffset >= totalCountRef.current) {
          setHasMorePokemon(false)
          
          try {
            const specialForms = await generateSpecialFormsPokemon()
            if (specialForms.length > 0) {
              setPokemonList(prev => [...prev, ...specialForms])
              // Update total count to include special forms
              setTotalCount(prev => prev + specialForms.length)
            }
          } catch (err) {
            console.error('❌ Error loading special forms:', err)
          }
        }
        
      }
    } catch (err) {
      console.error('❌ Error loading more Pokemon:', err)
      setError('Failed to load more Pokemon')
    } finally {
      isLoadingMoreRef.current = false
      setIsLoadingMore(false)
    }
  }, [loading, getViewportBatchSize])

  // Reset function for error recovery
  const resetPokemonList = useCallback(() => {
    setPokemonList([])
    setCurrentOffset(0)
    setHasMorePokemon(true)
    setError(null)
    setLoading(true)
    // Reload initial batch with optimized size (50 for fast render)
    const initialBatchSize = getViewportBatchSize()
    const initialBatch = generateAllPokemonSkeletons(initialBatchSize)
    setPokemonList(initialBatch)
    setCurrentOffset(initialBatchSize)
    setLoading(false)
  }, [getViewportBatchSize])

  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    if (sentinelTimerRef.current) {
      clearTimeout(sentinelTimerRef.current)
      sentinelTimerRef.current = null
    }
    if (observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current = null
    }

    if (!node) return

    const scrollContainer = document.querySelector('[data-main-scroll]')

    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0]

        if (entry.isIntersecting && !isLoadingMoreRef.current && hasMorePokemonRef.current && !isTriggeredRef.current) {
          isTriggeredRef.current = true
          observer.disconnect()

          loadMorePokemon().finally(() => {
            sentinelTimerRef.current = setTimeout(() => {
              sentinelTimerRef.current = null
              isTriggeredRef.current = false
              if (observerRef.current === observer) {
                observer.observe(node)
              }
            }, 100)
          })
        }
      },
      {
        root: scrollContainer,
        rootMargin: '500px',
        threshold: 0.1
      }
    )

    observerRef.current = observer
    observer.observe(node)
  }, [loadMorePokemon])

  // Load comparison list from localStorage
  useEffect(() => {
    try {
      const savedComparison = localStorage.getItem('pokemon-comparison')
      if (savedComparison) {
        const parsed = JSON.parse(savedComparison)
        if (Array.isArray(parsed)) {
          setComparisonList(parsed)
        }
      }
    } catch {
      localStorage.removeItem('pokemon-comparison')
    }
  }, [])

  const toggleComparison = (id: number, setShowSidebar?: (show: boolean) => void) => {
    const isAdding = !comparisonList.includes(id)
    const newComparison = isAdding
      ? [...comparisonList, id]
      : comparisonList.filter(compId => compId !== id)
    
    setComparisonList(newComparison)
    localStorage.setItem('pokemon-comparison', JSON.stringify(newComparison))
    
    // If adding a team for comparison and advanced filters is closed, open it
    if (isAdding && setShowSidebar) {
      setShowSidebar(true)
    }
  }


  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={resetPokemonList}
            className="px-4 py-2 bg-poke-blue text-white rounded-lg hover:bg-poke-blue/90"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Determine layout mode based on theme
  const isModernTheme = theme === 'light' || theme === 'dark';
  
  if (isModernTheme) {
    return (
      <ModernPokedexLayout
        pokemonList={pokemonList}
        selectedPokemon={selectedPokemon}
        onSelectPokemon={setSelectedPokemon}
        onToggleComparison={toggleComparison}
        onClearComparison={() => {
          setComparisonList([])
          localStorage.removeItem('pokemon-comparison')
        }}
        comparisonList={comparisonList}
        filters={filters}
        setFilters={setFilters}
        loadedCount={pokemonList.length}
        totalCount={totalCount}
        hasMorePokemon={hasMorePokemon}
        isLoadingMore={isLoadingMore}
        loadMorePokemon={loadMorePokemon}
        loadToEnd={loadToEnd}
        jumpToPokemonIndex={jumpToPokemonIndex}
        sentinelRef={(node) => {
          if (sentinelRef) {
            sentinelRef(node)
          }
        }}
      />
    );
  }

  if (theme === 'red') {
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-bg">
          <div className="text-center">
            <img src="/loading.gif" width={100} height={100} alt="Loading" className="mx-auto mb-4" />
            <p className="text-muted">Loading Pokémon...</p>
          </div>
        </div>
      )
    }
    return (
      <RedPokedexLayout
        pokemonList={pokemonList}
        selectedPokemon={selectedPokemon}
        onSelectPokemon={setSelectedPokemon}
        onToggleComparison={toggleComparison}
        comparisonList={comparisonList}
        filters={filters}
        setFilters={setFilters}
      />
    );
  }

  if (theme === 'gold') {
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-bg">
          <div className="text-center">
            <img src="/loading.gif" width={100} height={100} alt="Loading" className="mx-auto mb-4" />
            <p className="text-muted">Loading Pokémon...</p>
          </div>
        </div>
      )
    }
    return (
      <GoldPokedexLayout
        pokemonList={pokemonList}
        selectedPokemon={selectedPokemon}
        onSelectPokemon={setSelectedPokemon}
        onToggleComparison={toggleComparison}
        comparisonList={comparisonList}
        filters={filters}
        setFilters={setFilters}
      />
    );
  }

  if (theme === 'ruby') {
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-bg">
          <div className="text-center">
            <img src="/loading.gif" width={100} height={100} alt="Loading" className="mx-auto mb-4" />
            <p className="text-muted">Loading Pokémon...</p>
          </div>
        </div>
      )
    }
    return (
      <RubyPokedexLayout
        pokemonList={pokemonList}
        selectedPokemon={selectedPokemon}
        onSelectPokemon={setSelectedPokemon}
        onToggleComparison={toggleComparison}
        comparisonList={comparisonList}
        filters={filters}
        setFilters={setFilters}
      />
    );
  }

  // This should never be reached since all themes are explicitly handled above
  return null
}
