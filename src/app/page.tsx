'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { Pokemon, FilterState } from '@/types/pokemon'
import { getPokemonTotalCount, generateAllPokemonSkeletons, getPokemonList, getPokemonSkeletonsWithPagination } from '@/lib/api'
import { useTheme } from '@/components/ThemeProvider'
// Removed PokemonPreloader import to avoid HMR issues
// Removed sharedPokemonCache import to avoid HMR issues - implementing cache logic inline
import RedPokedexLayout from '@/components/RedPokedexLayout'
import GoldPokedexLayout from '@/components/GoldPokedexLayout'
import RubyPokedexLayout from '@/components/RubyPokedexLayout'
import ModernPokedexLayout from '@/components/ModernPokedexLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import RoomPageClient from '@/app/lobby/[roomId]/RoomPageClient'
import LobbyPage from '@/components/LobbyPage'
// import ComparisonOverlay from '@/components/ComparisonOverlay'
// import MobileHeader from '@/components/MobileHeader'

export default function Home() {
  console.log('🚀 Home component loaded - NEW VERSION')
  const pathname = usePathname()
  
  // Fallback for static export - get pathname from window.location
  const [actualPathname, setActualPathname] = useState(pathname)
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setActualPathname(window.location.pathname)
      
      // Add/remove pokedex-main-page class based on current path
      // Only the main PokéDex page should have scroll disabled
      if (window.location.pathname === '/') {
        document.body.classList.add('pokedex-main-page')
        // Also disable root scrollbars to ensure only component scrollbar is visible
        document.documentElement.classList.add('pokedex-root')
      } else {
        document.body.classList.remove('pokedex-main-page')
        document.documentElement.classList.remove('pokedex-root')
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (typeof window !== 'undefined') {
        document.body.classList.remove('pokedex-main-page')
        document.documentElement.classList.remove('pokedex-root')
      }
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

  // Load initial Pokemon data - FAST SCROLL VERSION
  useEffect(() => {
    const loadInitialPokemon = async () => {
      try {
        setLoading(true)
        console.log('🚀 Loading initial Pokemon batch - FAST SCROLL...')
        
        // Load total count first
        const total = await getPokemonTotalCount()
        setTotalCount(total)
        
        // Load a much larger initial batch of skeletons for smooth scrolling
        const initialBatch = generateAllPokemonSkeletons(200)
        setPokemonList(initialBatch)
        setCurrentOffset(200)
        setLoading(false)
        
        console.log(`✅ Initial batch loaded: ${initialBatch.length} Pokemon (total: ${total})`)
        
        setError(null)
      } catch (err) {
        console.error('❌ Error loading initial Pokemon:', err)
        setError('Failed to load Pokemon list')
        // Fallback to larger skeleton batch
        const skeletons = generateAllPokemonSkeletons(200)
        setPokemonList(skeletons)
        setTotalCount(1302) // Fallback count
        setCurrentOffset(200)
        setLoading(false)
      }
    }

    loadInitialPokemon()
  }, [])

  // Load more Pokemon function for infinite scroll
  const loadMorePokemon = useCallback(async () => {
    if (isLoadingMore || !hasMorePokemon || loading) return
    
    setIsLoadingMore(true)
    
    try {
      console.log(`📦 Loading more Pokemon: offset=${currentOffset}`)
      const batchSize = 100 // Much larger batch size for super smooth scrolling
      const newBatch = await getPokemonSkeletonsWithPagination(batchSize, currentOffset)
      
      if (newBatch.length === 0) {
        setHasMorePokemon(false)
        console.log('🛑 No more Pokemon to load')
      } else {
        setPokemonList(prev => [...prev, ...newBatch])
        setCurrentOffset(prev => prev + newBatch.length)
        
        // Check if we've reached the end
        if (currentOffset + newBatch.length >= totalCount) {
          setHasMorePokemon(false)
          console.log('🛑 Reached total Pokemon count')
        }
        
        console.log(`✅ Loaded ${newBatch.length} more Pokemon (total: ${currentOffset + newBatch.length}/${totalCount})`)
      }
    } catch (err) {
      console.error('❌ Error loading more Pokemon:', err)
      setError('Failed to load more Pokemon')
    } finally {
      setIsLoadingMore(false)
    }
  }, [isLoadingMore, hasMorePokemon, loading, currentOffset, totalCount])

  // Reset function for error recovery
  const resetPokemonList = useCallback(() => {
    setPokemonList([])
    setCurrentOffset(0)
    setHasMorePokemon(true)
    setError(null)
    setLoading(true)
    // Reload initial batch with larger size
    const initialBatch = generateAllPokemonSkeletons(200)
    setPokemonList(initialBatch)
    setCurrentOffset(200)
    setLoading(false)
  }, [])

  // Ref for infinite scroll sentinel with aggressive preloading
  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoadingMore) return
    
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMorePokemon) {
          console.log('🚀 Sentinel triggered - loading more Pokemon aggressively')
          loadMorePokemon()
        }
      },
      {
        root: null,
        rootMargin: '1000px', // Very aggressive - trigger 1000px before reaching sentinel
        threshold: 0.01
      }
    )
    
    if (node) observer.observe(node)
    
    return () => observer.disconnect()
  }, [isLoadingMore, hasMorePokemon, loadMorePokemon])

  // Load comparison list from localStorage
  useEffect(() => {
    const savedComparison = localStorage.getItem('pokemon-comparison')
    if (savedComparison) {
      setComparisonList(JSON.parse(savedComparison))
    }
  }, [])

  // Memoize filtered Pokémon to prevent unnecessary re-renders and improve performance
  const memoizedFilteredPokemon = useMemo(() => {
    return pokemonList
  }, [pokemonList])

  // Preload visible Pokemon for better performance (implemented inline to avoid HMR issues)
  const visiblePokemonIds = useMemo(() => {
    return memoizedFilteredPokemon.slice(0, 100).map(p => p.id) // Increased for super smooth scrolling
  }, [memoizedFilteredPokemon])

  // Preloading is handled by the PokemonPreloader component in layout
  // Removed inline preloading to avoid HMR issues


  // Sort Pokémon using pokemonList for better performance
  const sortedPokemon = [...pokemonList].sort((a, b) => {
    let comparison = 0
    switch (filters.sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break
      case 'height':
        comparison = a.height - b.height
        break
      case 'weight':
        comparison = a.weight - b.weight
        break
      default:
        comparison = a.id - b.id
    }
    return filters.sortOrder === 'desc' ? -comparison : comparison
  })



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

  // Handle client-side routing for lobby pages
  
  if (actualPathname === '/lobby') {
    return (
      <ProtectedRoute>
        <LobbyPage />
      </ProtectedRoute>
    )
  }
  
  if (actualPathname.startsWith('/lobby/')) {
    const roomId = actualPathname.split('/lobby/')[1]
    if (roomId) {
      return (
        <ProtectedRoute>
          <RoomPageClient roomId={roomId} />
        </ProtectedRoute>
      )
    }
  }

  // Determine layout mode based on theme
  const isModernTheme = theme === 'light' || theme === 'dark';
  
  // No console logging in production to avoid noise

  // Render modern layout for light/dark themes
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
        sentinelRef={sentinelRef}
      />
    );
  }

  // Render retro layouts for game themes
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
