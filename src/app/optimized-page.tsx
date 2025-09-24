'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { Pokemon, FilterState } from '@/types/pokemon'
import { getPokemonTotalCount } from '@/lib/api'
import { useOptimizedInfiniteScroll } from '@/hooks/useOptimizedInfiniteScroll'
import { fetchOptimizedPokemonForMainDex, fetchInitialPokemon, fetchAdaptivePokemon } from '@/lib/optimizedInfiniteScrollFetchers'
import { useTheme } from '@/components/ThemeProvider'
import RedPokedexLayout from '@/components/RedPokedexLayout'
import GoldPokedexLayout from '@/components/GoldPokedexLayout'
import RubyPokedexLayout from '@/components/RubyPokedexLayout'
import ModernPokedexLayout from '@/components/ModernPokedexLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import RoomPageClient from '@/app/lobby/[roomId]/RoomPageClient'
import LobbyPage from '@/components/LobbyPage'

export default function OptimizedHome() {
  const pathname = usePathname()
  
  // Fallback for static export - get pathname from window.location
  const [actualPathname, setActualPathname] = useState(pathname)
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setActualPathname(window.location.pathname)
      
      // Add/remove pokedex-main-page class based on current path
      if (window.location.pathname === '/') {
        document.body.classList.add('pokedex-main-page')
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
  const [scrollPosition, setScrollPosition] = useState(0)

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    types: [],
    generation: '',
    sortBy: 'id',
    sortOrder: 'asc'
  })

  const { theme } = useTheme()

  // Track scroll position for adaptive loading
  useEffect(() => {
    const handleScroll = () => {
      const scrollElement = document.querySelector('.flex-1.min-h-0.overflow-y-auto')
      if (scrollElement) {
        setScrollPosition(scrollElement.scrollTop)
      }
    }

    const scrollElement = document.querySelector('.flex-1.min-h-0.overflow-y-auto')
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll, { passive: true })
      return () => scrollElement.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Use optimized infinite scroll hook
  const {
    data: pokemonList,
    loading,
    hasMore: hasMorePokemon,
    error,
    loadMore: loadMorePokemon,
    reset: resetPokemonList,
    sentinelRef,
    virtualItems,
    totalSize,
    scrollElement
  } = useOptimizedInfiniteScroll<Pokemon>(
    (offset, limit) => fetchAdaptivePokemon(offset, limit, scrollPosition),
    {
      fetchSize: 20, // Reduced from 100 to 20 for better performance
      initialLoad: true,
      enabled: true,
      retryAttempts: 3,
      retryDelay: 1000,
      scrollThreshold: 300, // Increased threshold for better UX
      rootMargin: '300px', // Increased margin for preloading
      threshold: 0.1,
      getTotalCount: getPokemonTotalCount,
      maxItemsFallback: 1302,
      // Performance optimizations
      enableVirtualization: true,
      virtualItemHeight: 200,
      overscan: 3, // Reduced overscan for better performance
      batchSize: 15, // Smaller batch size
      preloadThreshold: 0.7 // Preload when 70% scrolled
    }
  )

  // Load comparison list from localStorage
  useEffect(() => {
    const savedComparison = localStorage.getItem('pokemon-comparison')
    if (savedComparison) {
      setComparisonList(JSON.parse(savedComparison))
    }
  }, [])

  // Memoize filtered Pokémon to prevent unnecessary re-renders
  const memoizedFilteredPokemon = useMemo(() => {
    return pokemonList
  }, [pokemonList])

  // Optimized sorting with memoization
  const sortedPokemon = useMemo(() => {
    return [...memoizedFilteredPokemon].sort((a, b) => {
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
  }, [memoizedFilteredPokemon, filters.sortBy, filters.sortOrder])

  const toggleComparison = useCallback((id: number) => {
    const newComparison = comparisonList.includes(id)
      ? comparisonList.filter(compId => compId !== id)
      : [...comparisonList, id]
    
    setComparisonList(newComparison)
    localStorage.setItem('pokemon-comparison', JSON.stringify(newComparison))
  }, [comparisonList])

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
  const isModernTheme = theme === 'light' || theme === 'dark'

  // Render modern layout for light/dark themes
  if (isModernTheme) {
    return (
      <ModernPokedexLayout
        pokemonList={sortedPokemon}
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
      />
    )
  }

  // Render retro layouts for game themes
  if (theme === 'red') {
    if (loading && sortedPokemon.length === 0) {
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
        pokemonList={sortedPokemon}
        selectedPokemon={selectedPokemon}
        onSelectPokemon={setSelectedPokemon}
        onToggleComparison={toggleComparison}
        comparisonList={comparisonList}
        filters={filters}
        setFilters={setFilters}
      />
    )
  }

  if (theme === 'gold') {
    if (loading && sortedPokemon.length === 0) {
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
        pokemonList={sortedPokemon}
        selectedPokemon={selectedPokemon}
        onSelectPokemon={setSelectedPokemon}
        onToggleComparison={toggleComparison}
        comparisonList={comparisonList}
        filters={filters}
        setFilters={setFilters}
      />
    )
  }

  if (theme === 'ruby') {
    if (loading && sortedPokemon.length === 0) {
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
        pokemonList={sortedPokemon}
        selectedPokemon={selectedPokemon}
        onSelectPokemon={setSelectedPokemon}
        onToggleComparison={toggleComparison}
        comparisonList={comparisonList}
        filters={filters}
        setFilters={setFilters}
      />
    )
  }

  // Default case: Use ModernPokedexLayout
  return (
    <ModernPokedexLayout
      pokemonList={sortedPokemon}
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
    />
  )
}
