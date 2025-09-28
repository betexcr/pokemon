'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { Pokemon, FilterState } from '@/types/pokemon'
import { getPokemonTotalCount, generateAllPokemonSkeletons, getPokemonList, getPokemonSkeletonsWithPagination } from '@/lib/api'
// import { } from '@/lib/utils' // Empty import removed
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

  // Use optimized infinite scroll hook for main dex
  // State for all Pokemon data
  const [pokemonList, setPokemonList] = useState<Pokemon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load Pokemon skeletons including all variants and forms (10### IDs)
  useEffect(() => {
    const loadPokemonSkeletons = async () => {
      try {
        setLoading(true)
        console.log('Loading Pokemon skeletons with all variants and forms...')
        
        // Get the total count from the API
        const totalCount = await getPokemonTotalCount()
        console.log('Total Pokemon count:', totalCount)
        
        // Load Pokemon skeletons in batches to include all variants
        const allSkeletons: Pokemon[] = []
        const batchSize = 100
        let offset = 0
        
        while (offset < totalCount) {
          console.log(`Loading skeleton batch: offset=${offset}, batchSize=${batchSize}`)
          const batch = await getPokemonSkeletonsWithPagination(batchSize, offset)
          if (batch.length === 0) break
          allSkeletons.push(...batch)
          offset += batchSize
          
          // Update the Pokemon list progressively for better UX
          if (allSkeletons.length % 200 === 0 || offset >= totalCount) {
            console.log(`Loaded ${allSkeletons.length} Pokemon skeletons so far...`)
            setPokemonList([...allSkeletons])
          }
        }
        
        console.log('Completed loading', allSkeletons.length, 'Pokemon skeletons including variants')
        setPokemonList(allSkeletons)
        setError(null)
      } catch (err) {
        console.error('Error loading Pokemon skeletons:', err)
        setError('Failed to load Pokemon list')
        // Fallback to a smaller count if loading fails
        const fallbackCount = 300
        const skeletons = generateAllPokemonSkeletons(fallbackCount)
        setPokemonList(skeletons)
      } finally {
        setLoading(false)
      }
    }

    loadPokemonSkeletons()
  }, [])

  // Pokemon data is now handled by the layout components internally
  const pokemonWithData = pokemonList

  // No more infinite scroll - all Pokemon are rendered upfront
  const hasMorePokemon = false
  const loadMorePokemon = () => {}
  const resetPokemonList = () => {}
  const sentinelRef = () => {}

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
