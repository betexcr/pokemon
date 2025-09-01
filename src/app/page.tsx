'use client'

import { useState, useEffect, useCallback } from 'react'
import { Pokemon, FilterState } from '@/types/pokemon'
import { getPokemonByType, getAllPokemon } from '@/lib/api'
import { formatPokemonName, typeColors, cn } from '@/lib/utils'
import ThemeToggle from '@/components/ThemeToggle'
import { useTheme } from '@/components/ThemeProvider'
import RedPokedexLayout from '@/components/RedPokedexLayout'
import GoldPokedexLayout from '@/components/GoldPokedexLayout'
import RubyPokedexLayout from '@/components/RubyPokedexLayout'
import ModernPokedexLayout from '@/components/ModernPokedexLayout'
import PokemonComparison from '@/components/PokemonComparison'
import VirtualizedPokemonList from '@/components/VirtualizedPokemonList'
import VirtualizedPokemonGrid from '@/components/VirtualizedPokemonGrid'
import ViewTransition from '@/components/ViewTransition'
import { useSearch } from '@/hooks/useSearch'
import { Search, Grid3X3, List, Zap, X } from 'lucide-react'

export default function Home() {
  const [pokemonList, setPokemonList] = useState<Pokemon[]>([])
  const [filteredPokemon, setFilteredPokemon] = useState<Pokemon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [density, setDensity] = useState<'cozy' | 'compact' | 'ultra'>('compact')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const [favorites, setFavorites] = useState<number[]>([])
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null)
  const [typeLoading, setTypeLoading] = useState(false)

  // Enhanced search hook with caching, debouncing, and throttling
  const {
    results: searchResults,
    isLoading: searchLoading,
    handleSearchChange,
    clearSearch
  } = useSearch({
    debounceMs: 300,
    cacheTtl: 5 * 60 * 1000, // 5 minutes
    throttleMs: 100
  })

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

  // Load initial data
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const allPokemon = await getAllPokemon()
      setPokemonList(allPokemon)
      setFilteredPokemon(allPokemon)
    } catch (err) {
      setError('Failed to load Pokémon data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('pokemon-favorites')
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites))
    }
  }, [])

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  // Handle search changes
  useEffect(() => {
    handleSearchChange(filters.search)
  }, [filters.search, handleSearchChange])

  // Update filtered Pokémon based on search results
  useEffect(() => {
    if (searchResults.length > 0 || filters.search.trim()) {
      setFilteredPokemon(searchResults)
    } else {
      setFilteredPokemon(pokemonList)
    }
  }, [searchResults, filters.search, pokemonList])

  // Handle type filter changes
  const handleTypeFilter = useCallback(async (type: string) => {
    if (filters.types.includes(type)) {
      // Remove type filter
      const newTypes = filters.types.filter(t => t !== type)
      setFilters(prev => ({ ...prev, types: newTypes }))
      
      if (newTypes.length === 0) {
        // No type filters, show all Pokémon
        setFilteredPokemon(pokemonList)
      } else {
        // Still have other type filters, fetch those types with AND logic
        setTypeLoading(true)
        try {
          const typePokemon = await Promise.all(
            newTypes.map(t => getPokemonByType(t))
          )
          // Find Pokémon that appear in ALL selected types (AND logic)
          const pokemonCounts = new Map<number, number>()
          typePokemon.forEach(pokemonList => {
            pokemonList.forEach(pokemon => {
              pokemonCounts.set(pokemon.id, (pokemonCounts.get(pokemon.id) || 0) + 1)
            })
          })
          
          // Only include Pokémon that appear in all selected types
          const allTypePokemon = typePokemon.flat()
          const uniquePokemon = allTypePokemon.filter((pokemon, index, self) => {
            const isFirstOccurrence = index === self.findIndex(p => p.id === pokemon.id)
            if (!isFirstOccurrence) return false
            return pokemonCounts.get(pokemon.id) === newTypes.length
          })
          setFilteredPokemon(uniquePokemon)
        } catch (err) {
          console.error('Type filter error:', err)
        } finally {
          setTypeLoading(false)
        }
      }
    } else {
      // Add type filter
      const newTypes = [...filters.types, type]
      setFilters(prev => ({ ...prev, types: newTypes }))
      
      setTypeLoading(true)
      try {
        const typePokemon = await Promise.all(
          newTypes.map(t => getPokemonByType(t))
        )
        // Find Pokémon that appear in ALL selected types (AND logic)
        const pokemonCounts = new Map<number, number>()
        typePokemon.forEach(pokemonList => {
          pokemonList.forEach(pokemon => {
            pokemonCounts.set(pokemon.id, (pokemonCounts.get(pokemon.id) || 0) + 1)
          })
        })
        
        // Only include Pokémon that appear in all selected types
        const allTypePokemon = typePokemon.flat()
        const uniquePokemon = allTypePokemon.filter((pokemon, index, self) => {
          const isFirstOccurrence = index === self.findIndex(p => p.id === pokemon.id)
          if (!isFirstOccurrence) return false
          return pokemonCounts.get(pokemon.id) === newTypes.length
        })
        setFilteredPokemon(uniquePokemon)
      } catch (err) {
        console.error('Type filter error:', err)
      } finally {
        setTypeLoading(false)
      }
    }
  }, [filters.types, pokemonList])

  // Sort Pokémon
  const sortedPokemon = [...filteredPokemon].sort((a, b) => {
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



  const toggleFavorite = (id: number) => {
    const newFavorites = favorites.includes(id)
      ? favorites.filter(favId => favId !== id)
      : [...favorites, id]
    
    setFavorites(newFavorites)
    localStorage.setItem('pokemon-favorites', JSON.stringify(newFavorites))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-poke-blue mx-auto mb-4"></div>
          <p className="text-muted">Loading Pokémon...</p>
        </div>
      </div>
    )
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
    return (
      <ModernPokedexLayout
        pokemonList={sortedPokemon}
        selectedPokemon={selectedPokemon}
        onSelectPokemon={setSelectedPokemon}
        onToggleFavorite={toggleFavorite}
        favorites={favorites}
        filters={filters}
        setFilters={setFilters}
      />
    );
  }

  // Render retro layouts for game themes
  if (theme === 'red') {
    return (
      <RedPokedexLayout
        pokemonList={sortedPokemon}
        selectedPokemon={selectedPokemon}
        onSelectPokemon={setSelectedPokemon}
        onToggleFavorite={toggleFavorite}
        favorites={favorites}
        filters={filters}
        setFilters={setFilters}
      />
    );
  }

  if (theme === 'gold') {
    return (
      <GoldPokedexLayout
        pokemonList={sortedPokemon}
        selectedPokemon={selectedPokemon}
        onSelectPokemon={setSelectedPokemon}
        onToggleFavorite={toggleFavorite}
        favorites={favorites}
        filters={filters}
        setFilters={setFilters}
      />
    );
  }

  if (theme === 'ruby') {
    return (
      <RubyPokedexLayout
        pokemonList={sortedPokemon}
        selectedPokemon={selectedPokemon}
        onSelectPokemon={setSelectedPokemon}
        onToggleFavorite={toggleFavorite}
        favorites={favorites}
        filters={filters}
        setFilters={setFilters}
      />
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className={`sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
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
              <span className="text-sm text-muted">
                {pokemonList?.length} Pokémon discovered
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Density Controls */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted hidden sm:inline">Density:</span>
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





              {/* View Mode Toggle */}
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'gold' 
                    ? 'hover:bg-gold-accent/20 text-gold-accent'
                    : theme === 'green'
                    ? 'hover:bg-green-accent/20 text-green-accent'
                    : theme === 'red'
                    ? 'hover:bg-red-accent/20 text-red-accent'
                    : theme === 'ruby'
                    ? 'hover:bg-ruby-accent/20 text-ruby-accent'
                    : 'hover:bg-white/50 text-muted hover:text-text'
                }`}
              >
                {viewMode === 'grid' ? <List className="h-5 w-5" /> : <Grid3X3 className="h-5 w-5" />}
              </button>

              {/* Theme Toggle */}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Search and Filters */}
      <div className={`border-b border-border ${
        theme === 'gold' ? 'bg-gold-gradient'
        : theme === 'green' ? 'bg-green-gradient'
        : theme === 'red' ? 'bg-red-gradient'
        : theme === 'ruby' ? 'bg-ruby-gradient'
        : 'bg-surface'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted" />
              <input
                type="text"
                placeholder="Search Pokémon by name or ID..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className={`w-full pl-10 pr-10 py-2 border border-border rounded-lg focus:ring-2 focus:ring-poke-blue focus:border-transparent bg-surface text-text transition-all duration-200 ${
                  theme === 'gold' ? 'font-retro'
                  : theme === 'green' ? 'font-gameboy'
                  : theme === 'red' ? 'font-retro'
                  : theme === 'ruby' ? 'font-retro'
                  : ''
                }`}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                {searchLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-poke-blue"></div>
                )}
                {filters.search && (
                  <button
                    onClick={() => {
                      setFilters(prev => ({ ...prev, search: '' }))
                      clearSearch()
                    }}
                    className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X className="h-4 w-4 text-muted" />
                  </button>
                )}
              </div>
            </div>

            {/* Type Filters */}
            <div className="flex flex-wrap gap-2">
              {Object.keys(typeColors).slice(0, 8).map(type => (
                <button
                  key={type}
                  onClick={() => handleTypeFilter(type)}
                  disabled={typeLoading}
                  className={cn(
                    'px-3 py-1 rounded-full text-sm font-medium border transition-colors',
                    filters.types.includes(type)
                      ? `${typeColors[type].bg} ${typeColors[type].text} ${typeColors[type].border}`
                      : 'bg-surface text-muted border-border hover:bg-white/50 dark:hover:bg-white/10',
                    typeLoading && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {formatPokemonName(type)}
                  {typeLoading && filters.types.includes(type) && (
                    <div className="inline-block ml-2 animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <h2 className={`text-xl font-semibold ${
              theme === 'gold' ? 'font-retro text-gold-accent'
              : theme === 'green' ? 'font-gameboy text-green-accent'
              : theme === 'red' ? 'font-retro text-red-accent'
              : theme === 'ruby' ? 'font-retro text-ruby-accent'
              : 'text-text'
            }`}>
              {sortedPokemon.length} Pokémon found
            </h2>
            {filters.search && (
              <span className="text-sm text-muted">
                for &quot;{filters.search}&quot;
              </span>
            )}
            {(searchLoading || typeLoading) && (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-poke-blue"></div>
                <span className="text-sm text-muted">Loading...</span>
              </div>
            )}
          </div>

          {/* Sort Controls */}
          <div className="flex items-center space-x-2">
            <PokemonComparison pokemonList={sortedPokemon} />
            
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as 'id' | 'name' | 'height' | 'weight' }))}
              className={`px-3 py-1 border border-border rounded-lg bg-surface text-text ${
                theme === 'gold' ? 'font-retro'
                : theme === 'green' ? 'font-gameboy'
                : theme === 'red' ? 'font-retro'
                : theme === 'ruby' ? 'font-retro'
                : ''
              }`}
            >
              <option value="id">ID</option>
              <option value="name">Name</option>
              <option value="height">Height</option>
              <option value="weight">Weight</option>
            </select>
            <button
              onClick={() => setFilters(prev => ({ 
                ...prev, 
                sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' 
              }))}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'gold' 
                  ? 'hover:bg-gold-accent/20 text-gold-accent'
                  : theme === 'green'
                  ? 'hover:bg-gold-accent/20 text-gold-accent'
                  : theme === 'red'
                  ? 'hover:bg-red-accent/20 text-red-accent'
                  : theme === 'ruby'
                  ? 'hover:bg-ruby-accent/20 text-ruby-accent'
                  : 'hover:bg-white/50 text-muted hover:text-text'
              }`}
            >
              {filters.sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {/* Pokémon Grid/List */}
        <ViewTransition transitionName="pokemon-grid">
          {viewMode === 'grid' ? (
            <VirtualizedPokemonGrid
              pokemonList={sortedPokemon}
              onToggleFavorite={toggleFavorite}
              onSelectPokemon={setSelectedPokemon}
              selectedPokemon={selectedPokemon}
              favorites={favorites}
              density={density}
              viewMode="grid"
            />
          ) : (
            <VirtualizedPokemonList
              pokemonList={sortedPokemon}
              onSelectPokemon={setSelectedPokemon}
              selectedPokemon={selectedPokemon}
              containerHeight={600}
              itemHeight={80}
            />
          )}
        </ViewTransition>

        {/* No Results */}
        {sortedPokemon.length === 0 && !searchLoading && !typeLoading && (
          <div className="text-center py-12">
            <p className="text-muted text-lg">No Pokémon found matching your criteria.</p>
            <button
              onClick={() => {
                setFilters({ search: '', types: [], generation: '', sortBy: 'id', sortOrder: 'asc' })
                setFilteredPokemon(pokemonList)
              }}
              className="mt-4 px-4 py-2 bg-poke-blue text-white rounded-lg hover:bg-poke-blue/90"
            >
              Clear Filters
            </button>
        </div>
        )}
      </main>
    </div>
  )
}
