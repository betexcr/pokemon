'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { Pokemon, FilterState } from '@/types/pokemon'
import { getPokemonWithPagination } from '@/lib/api'
import { } from '@/lib/utils'
import { useTheme } from '@/components/ThemeProvider'
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
  const pathname = usePathname()
  
  // Fallback for static export - get pathname from window.location
  const [actualPathname, setActualPathname] = useState(pathname)
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setActualPathname(window.location.pathname)
    }
  }, [])
  const [pokemonList, setPokemonList] = useState<Pokemon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // const [density, setDensity] = useState<'cozy' | 'compact' | 'ultra' | 'list'>('compact')
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [currentOffset, setCurrentOffset] = useState(0)
  
  // Use refs to avoid dependency issues
  const loadingMoreRef = useRef(false)
  const hasMoreRef = useRef(true)
  const currentOffsetRef = useRef(0)


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

  // Load initial data with caching
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const initialPokemon = await getPokemonWithPagination(30, 0)
      setPokemonList(initialPokemon)
      setCurrentOffset(30)
      setHasMore(initialPokemon.length === 30)
      // Update refs
      currentOffsetRef.current = 30
      hasMoreRef.current = initialPokemon.length === 30
    } catch (err) {
      setError('Failed to load Pokémon data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Load comparison list from localStorage
  useEffect(() => {
    const savedComparison = localStorage.getItem('pokemon-comparison')
    if (savedComparison) {
      setComparisonList(JSON.parse(savedComparison))
    }
  }, [])

  // Update refs when state changes
  useEffect(() => {
    loadingMoreRef.current = loadingMore
  }, [loadingMore])
  
  useEffect(() => {
    hasMoreRef.current = hasMore
  }, [hasMore])
  
  useEffect(() => {
    currentOffsetRef.current = currentOffset
  }, [currentOffset])

  // Load more Pokemon function
  const loadMorePokemon = useCallback(async () => {
    if (loadingMoreRef.current || !hasMoreRef.current) return

    try {
      setLoadingMore(true)
      const morePokemon = await getPokemonWithPagination(30, currentOffsetRef.current)
      if (morePokemon.length === 0) {
        setHasMore(false)
      } else {
        setPokemonList(prev => [...prev, ...morePokemon])
        setCurrentOffset(prev => prev + 30)
        setHasMore(morePokemon.length === 30)
      }
    } catch (err) {
      console.error('Failed to load more Pokémon:', err)
    } finally {
      setLoadingMore(false)
    }
  }, []) // No dependencies to prevent recreation

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  // Infinite scroll effect - only for main PokéDex page
  useEffect(() => {
    // Don't add scroll listener if we're on lobby pages
    if (actualPathname === '/lobby' || actualPathname.startsWith('/lobby/')) {
      return
    }

    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 1000) {
        loadMorePokemon()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loadMorePokemon, actualPathname])

  // Memoize filtered Pokémon to prevent unnecessary re-renders and improve performance
  const memoizedFilteredPokemon = useMemo(() => {
    return pokemonList
  }, [pokemonList])


  // Sort Pokémon using memoized filtered Pokémon for better performance
  const sortedPokemon = [...memoizedFilteredPokemon].sort((a, b) => {
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



  const toggleComparison = (id: number) => {
    const newComparison = comparisonList.includes(id)
      ? comparisonList.filter(compId => compId !== id)
      : [...comparisonList, id]
    
    setComparisonList(newComparison)
    localStorage.setItem('pokemon-comparison', JSON.stringify(newComparison))
  }


  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={loadInitialData}
            className="px-4 py-2 bg-poke-blue text-white rounded-lg hover:bg-poke-blue/90"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Handle client-side routing for lobby pages
  console.log('Current pathname:', pathname, 'Actual pathname:', actualPathname);
  
  if (actualPathname === '/lobby') {
    console.log('Rendering LobbyPage');
    return (
      <ProtectedRoute>
        <LobbyPage />
      </ProtectedRoute>
    )
  }
  
  if (actualPathname.startsWith('/lobby/')) {
    const roomId = actualPathname.split('/lobby/')[1]
    console.log('Lobby room detected, roomId:', roomId);
    if (roomId) {
      console.log('Rendering RoomPageClient for room:', roomId);
      return (
        <ProtectedRoute>
          <RoomPageClient roomId={roomId} />
        </ProtectedRoute>
      )
    }
  }

  // Determine layout mode based on theme
  const isModernTheme = theme === 'light' || theme === 'dark';
  
  // Debug: Log the current theme and loading state
  console.log('Current theme:', theme, 'isModernTheme:', isModernTheme, 'loading:', loading);

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
    );
  }

  // Render retro layouts for game themes
  if (theme === 'red') {
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-bg">
          <div className="text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
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
    );
  }

  if (theme === 'gold') {
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-bg">
          <div className="text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
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
    );
  }

  if (theme === 'ruby') {
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-bg">
          <div className="text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
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
    );
  }

  // Default case: Use ModernPokedexLayout for any theme that's not explicitly handled
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
