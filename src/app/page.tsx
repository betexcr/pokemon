'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Pokemon, FilterState } from '@/types/pokemon'
import { getPokemonWithPagination } from '@/lib/api'
import { } from '@/lib/utils'
import ThemeToggle from '@/components/ThemeToggle'
import { useTheme } from '@/components/ThemeProvider'
import RedPokedexLayout from '@/components/RedPokedexLayout'
import GoldPokedexLayout from '@/components/GoldPokedexLayout'
import RubyPokedexLayout from '@/components/RubyPokedexLayout'
import ModernPokedexLayout from '@/components/ModernPokedexLayout'
import ComparisonOverlay from '@/components/ComparisonOverlay'
import { Zap, Users } from 'lucide-react'
import MobileHeader from '@/components/MobileHeader'

export default function Home() {
  const router = useRouter()
  const [pokemonList, setPokemonList] = useState<Pokemon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [density, setDensity] = useState<'cozy' | 'compact' | 'ultra' | 'list'>('compact')
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

  let theme = 'light'
  try {
    const themeContext = useTheme()
    theme = themeContext.theme
  } catch {
    // Theme provider not available, use default
  }

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

  // Infinite scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 1000) {
        loadMorePokemon()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loadMorePokemon])

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

  // Determine layout mode based on theme
  const isModernTheme = theme === 'light' || theme === 'dark';

  // Render modern layout for light/dark themes
  if (isModernTheme) {
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

  return (
    <div className="min-h-screen bg-bg">
      {/* Mobile Header - Only visible on mobile */}
      <div className="md:hidden">
        <MobileHeader 
          theme={theme}
          pokemonCount={pokemonList?.length || 0}
          density={density}
          onDensityChange={setDensity}
        />
      </div>

      {/* Desktop Header - Only visible on desktop */}
      <div className="hidden md:block">
        <header className={`sticky top-0 z-50 border-b border-border ${
          theme === 'gold' ? 'bg-gold-gradient'
          : theme === 'green' ? 'bg-green-gradient'
          : theme === 'red' ? 'bg-red-gradient'
          : theme === 'ruby' ? 'bg-ruby-gradient'
          : 'bg-surface'
        }`}>
          <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              {/* Logo and Title */}
              <div className="flex items-center space-x-3">
                <Zap className={`h-8 w-8 ${
                  theme === 'gold' ? 'text-gold-accent' 
                  : theme === 'green' ? 'text-green-accent'
                  : theme === 'red' ? 'text-red-accent'
                  : theme === 'ruby' ? 'text-ruby-accent'
                  : 'text-poke-yellow'
                }`} />
                <h1 className={`text-2xl font-bold ${
                  theme === 'gold' ? 'font-retro text-gold-accent'
                  : theme === 'green' ? 'font-gameboy text-green-accent'
                  : theme === 'red' ? 'font-retro text-red-accent'
                  : theme === 'ruby' ? 'font-retro text-ruby-accent'
                  : 'text-text'
                }`}>
                  PokéDex
                </h1>
              </div>

              {/* Desktop Controls */}
              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted">
                  {pokemonList?.length || 0} Pokémon discovered
                </span>
                
                {/* Density Controls */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted">Density:</span>
                  <div className="flex bg-surface border border-border rounded-lg p-1">
                    {(['cozy', 'compact', 'ultra'] as const).map((d) => (
                      <button
                        key={d}
                        onClick={() => setDensity(d)}
                        className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                          density === d
                            ? 'bg-poke-blue text-white'
                            : 'text-muted hover:text-text hover:bg-white/50'
                        }`}
                      >
                        {d.charAt(0).toUpperCase() + d.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Team Builder Link */}
                <button
                  onClick={() => router.push('/team')}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-surface border border-border text-muted hover:text-text hover:bg-white/50 transition-all duration-200"
                  title="Go to Team Builder"
                >
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-medium">Team</span>
                </button>

                {/* Theme Toggle */}
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>
      </div>

      {/* Comparison Overlay */}
      <ComparisonOverlay
        comparisonList={comparisonList}
        pokemonList={pokemonList}
        onRemoveFromComparison={toggleComparison}
        onClearComparison={() => {
          setComparisonList([])
          localStorage.removeItem('pokemon-comparison')
        }}
      />
    </div>
  )
}
