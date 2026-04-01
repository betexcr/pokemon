'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Pokemon, FilterState } from '@/types/pokemon'
import { fetchAllPokemonIds, generatePokemonSkeletonsForIds, generateAllPokemonSkeletons } from '@/lib/api'
import { useTheme } from '@/components/ThemeProvider'
import { useRequestCancellation } from '@/hooks/useRequestCancellation'
import { useViewportCancellation } from '@/hooks/useViewportCancellation'
import dynamic from 'next/dynamic'
import ModernPokedexLayout from '@/components/ModernPokedexLayout'

const RedPokedexLayout = dynamic(() => import('@/components/RedPokedexLayout'))
const GoldPokedexLayout = dynamic(() => import('@/components/GoldPokedexLayout'))
const RubyPokedexLayout = dynamic(() => import('@/components/RubyPokedexLayout'))

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
  const allIdsRef = useRef<number[]>([])
  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scrollSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingScrollRestoreRef = useRef<number | null>(null)
  const mountedRef = useRef(true)
  const rafIdRef = useRef<number | null>(null)
  
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

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
  
  // Load initial Pokemon data, restoring session state if returning from a detail page

  useEffect(() => {
    let cancelled = false
    const loadInitialPokemon = async () => {
      try {
        setLoading(true)
        
        const allIds = await fetchAllPokemonIds()
        if (cancelled) return
        allIdsRef.current = allIds
        const total = allIds.length
        setTotalCount(total)

        let initialBatchSize = getViewportBatchSize()

        try {
          const saved = sessionStorage.getItem('pokedex-scroll-state')
          if (saved) {
            const parsed = JSON.parse(saved)
            if (typeof parsed.offset === 'number' && parsed.offset > initialBatchSize) {
              initialBatchSize = Math.min(parsed.offset, total)
            }
            if (typeof parsed.scrollTop === 'number') {
              pendingScrollRestoreRef.current = parsed.scrollTop
            }
          }
        } catch { /* ignore corrupt storage */ }

        const initialIds = allIds.slice(0, initialBatchSize)
        const initialBatch = generatePokemonSkeletonsForIds(initialIds)
        setPokemonList(initialBatch)
        setCurrentOffset(initialBatchSize)
        if (initialBatchSize >= total) {
          setHasMorePokemon(false)
        }
        setLoading(false)
        setError(null)
      } catch (err) {
        if (cancelled) return
        console.error('❌ Error loading initial Pokemon:', err)
        setError('Failed to load Pokemon list')
        const fallbackBatchSize = Math.max(getViewportBatchSize(), 120)
        const skeletons = generateAllPokemonSkeletons(fallbackBatchSize)
        setPokemonList(skeletons)
        setTotalCount(1025)
        setCurrentOffset(fallbackBatchSize)
        setLoading(false)
      }
    }

    loadInitialPokemon()
    return () => {
      cancelled = true
    }
  }, [getViewportBatchSize])

  const loadToEnd = useCallback(async () => {
    if (isLoadingMoreRef.current || !hasMorePokemonRef.current || loading) {
      return
    }

    setIsLoadingMore(true)

    try {
      const currentOffsetValue = currentOffsetRef.current
      const allIds = allIdsRef.current
      const remainingIds = allIds.slice(currentOffsetValue)
      
      if (remainingIds.length <= 0) {
        setHasMorePokemon(false)
        setIsLoadingMore(false)
        return
      }

      const newBatch = generatePokemonSkeletonsForIds(remainingIds)

      setPokemonList(prev => [...prev, ...newBatch])
      setCurrentOffset(allIds.length)
      setHasMorePokemon(false)

    } catch (err) {
      console.error('❌ Error loading to end:', err)
    } finally {
      setIsLoadingMore(false)
    }
  }, [loading])

  const jumpToPokemonIndex = useCallback(async (targetIndex: number) => {
    if (loading) return

    const safeTargetIndex = Math.max(0, targetIndex)
    const allIds = allIdsRef.current
    const currentLoadedCount = currentOffsetRef.current
    const jumpBuffer = Math.max(getViewportBatchSize(), 80)
    const effectiveTotalCount = allIds.length > 0 ? allIds.length : (totalCountRef.current > 0 ? totalCountRef.current : 1025)
    
    if (safeTargetIndex < currentLoadedCount) {
      return
    }
    
    setIsLoadingMore(true)
    
    try {
      const pokemonToLoad = safeTargetIndex - currentLoadedCount + jumpBuffer
      const cappedLoad = Math.min(pokemonToLoad, effectiveTotalCount - currentLoadedCount)
      
      if (cappedLoad <= 0) {
        return
      }
      
      const nextIds = allIds.slice(currentLoadedCount, currentLoadedCount + cappedLoad)
      const newBatch = nextIds.length > 0
        ? generatePokemonSkeletonsForIds(nextIds)
        : generateAllPokemonSkeletons(cappedLoad)
      
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

  const loadMorePokemon = useCallback(async () => {
    if (isLoadingMoreRef.current || !hasMorePokemonRef.current || loading) {
      return
    }
    
    isLoadingMoreRef.current = true
    setIsLoadingMore(true)
    
    try {
      const currentOffsetValue = currentOffsetRef.current
      const batchSize = getViewportBatchSize()
      const allIds = allIdsRef.current
      
      const nextIds = allIds.slice(currentOffsetValue, currentOffsetValue + batchSize)
      const newBatch = nextIds.length > 0
        ? generatePokemonSkeletonsForIds(nextIds)
        : generateAllPokemonSkeletons(batchSize)
      
      await new Promise(resolve => setTimeout(resolve, 10))
      
      if (!mountedRef.current) return

      if (newBatch.length === 0) {
        setHasMorePokemon(false)
      } else {
        setPokemonList(prev => [...prev, ...newBatch])
        const newOffset = currentOffsetValue + newBatch.length
        setCurrentOffset(newOffset)
        
        if (newOffset >= totalCountRef.current) {
          setHasMorePokemon(false)
        }
      }
    } catch (err) {
      console.error('❌ Error loading more Pokemon:', err)
      if (mountedRef.current) setError('Failed to load more Pokemon')
    } finally {
      isLoadingMoreRef.current = false
      if (mountedRef.current) setIsLoadingMore(false)
    }
  }, [loading, getViewportBatchSize])

  const resetPokemonList = useCallback(() => {
    setPokemonList([])
    setCurrentOffset(0)
    setHasMorePokemon(true)
    setError(null)
    setLoading(true)
    const initialBatchSize = getViewportBatchSize()
    const allIds = allIdsRef.current
    const initialBatch = allIds.length > 0
      ? generatePokemonSkeletonsForIds(allIds.slice(0, initialBatchSize))
      : generateAllPokemonSkeletons(initialBatchSize)
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
        if (entry.isIntersecting && !isLoadingMoreRef.current && hasMorePokemonRef.current) {
          loadMorePokemon()
        }
      },
      {
        root: scrollContainer,
        rootMargin: '600px',
        threshold: 0
      }
    )

    observerRef.current = observer
    observer.observe(node)
  }, [loadMorePokemon])

  // Scroll-based fallback: IntersectionObserver can miss events during iOS
  // momentum scrolling, so also check distance from bottom on scroll.
  useEffect(() => {
    const scrollEl = document.querySelector('[data-main-scroll]')
    if (!scrollEl) return

    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null
        ticking = false
        if (isLoadingMoreRef.current || !hasMorePokemonRef.current) return
        const { scrollTop, scrollHeight, clientHeight } = scrollEl
        if (scrollHeight - scrollTop - clientHeight < 800) {
          loadMorePokemon()
        }
      })
    }

    scrollEl.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      scrollEl.removeEventListener('scroll', onScroll)
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
    }
  }, [loadMorePokemon])

  // Restore scroll position after the initial render with restored items
  useEffect(() => {
    if (loading || pendingScrollRestoreRef.current === null) return

    const target = pendingScrollRestoreRef.current
    pendingScrollRestoreRef.current = null

    // Wait for the virtualizer / DOM to settle, then restore
    const raf = requestAnimationFrame(() => {
      const scrollEl = document.querySelector('[data-main-scroll]')
      if (scrollEl) scrollEl.scrollTop = target
    })
    return () => cancelAnimationFrame(raf)
  }, [loading])

  // Persist scroll position + loaded count to sessionStorage on scroll
  useEffect(() => {
    const scrollEl = document.querySelector('[data-main-scroll]')
    if (!scrollEl) return

    const saveState = () => {
      try {
        sessionStorage.setItem('pokedex-scroll-state', JSON.stringify({
          offset: currentOffsetRef.current,
          scrollTop: scrollEl.scrollTop
        }))
      } catch { /* quota exceeded, ignore */ }
    }

    const onScroll = () => {
      if (scrollSaveTimerRef.current) clearTimeout(scrollSaveTimerRef.current)
      scrollSaveTimerRef.current = setTimeout(saveState, 300)
    }

    scrollEl.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      scrollEl.removeEventListener('scroll', onScroll)
      if (scrollSaveTimerRef.current) clearTimeout(scrollSaveTimerRef.current)
    }
  }, [])

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
            type="button"
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
