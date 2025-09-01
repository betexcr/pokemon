'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Pokemon, FilterState } from '@/types/pokemon'
import { formatPokemonName, typeColors } from '@/lib/utils'
import { useSearch } from '@/hooks/useSearch'
import { useRouter } from 'next/navigation'
import { getPokemonByGeneration, getPokemonByType } from '@/lib/api'
import ThemeToggle from './ThemeToggle'
import VirtualizedPokemonGrid from './VirtualizedPokemonGrid'
import { Search, Filter, X, Grid, List } from 'lucide-react'

interface ModernPokedexLayoutProps {
  pokemonList: Pokemon[]
  selectedPokemon: Pokemon | null
  onSelectPokemon: (pokemon: Pokemon) => void
  onToggleFavorite: (id: number) => void
  favorites: number[]
  filters: FilterState
  setFilters: (filters: FilterState) => void
}

interface AdvancedFilters {
  types: string[]
  generation: string
  habitat: string
  heightRange: [number, number]
  weightRange: [number, number]
  legendary: boolean
  mythical: boolean
}

export default function ModernPokedexLayout({
  pokemonList,
  selectedPokemon,
  onSelectPokemon,
  onToggleFavorite,
  favorites,
  filters,
  setFilters
}: ModernPokedexLayoutProps) {
  const router = useRouter()
  
  // Advanced filters state
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
    types: [],
    generation: '',
    habitat: '',
    heightRange: [0, 20],
    weightRange: [0, 1000],
    legendary: false,
    mythical: false
  })
  
  const [showSidebar, setShowSidebar] = useState(true) // Advanced filters open by default
  const [sortBy, setSortBy] = useState<'id' | 'name' | 'stats' | 'hp' | 'attack' | 'defense'>('id')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [filteredPokemon, setFilteredPokemon] = useState<Pokemon[]>([])
  const [isFiltering, setIsFiltering] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [cardDensity, setCardDensity] = useState<'cozy' | 'compact' | 'ultra'>('compact')

  // Enhanced search hook
  const {
    searchTerm,
    results: searchResults,
    isLoading: searchLoading,
    handleSearchChange,
    clearSearch
  } = useSearch({
    debounceMs: 300,
    cacheTtl: 5 * 60 * 1000,
    throttleMs: 100
  })

  // URL state management
  // URL parsing removed to prevent state conflicts
  // Filters start with default values



  // URL state management removed to prevent infinite re-renders
  // Filters are now managed locally only

  // API-driven filtering effect
  useEffect(() => {
    const applyFilters = async () => {
      setIsFiltering(true)
      
      try {
        let results: Pokemon[] = []

        // If we have search results, use those as base
        if (searchResults.length > 0) {
          results = searchResults
        } else if (advancedFilters.generation) {
          // Fetch by generation
          results = await getPokemonByGeneration(advancedFilters.generation)
        } else if (advancedFilters.types.length > 0) {
          // Fetch by type (use first type for now, could be enhanced for multiple types)
          results = await getPokemonByType(advancedFilters.types[0])
        } else {
          // Use base pokemon list
          results = pokemonList
        }

        // Apply additional filters
        if (advancedFilters.types.length > 0 && results.length > 0) {
          results = results.filter(pokemon =>
            pokemon.types.some(type => advancedFilters.types.includes(type.type.name))
          )
        }

        // Height and weight filters
        results = results.filter(pokemon => {
          const height = pokemon.height / 10
          const weight = pokemon.weight / 10
          return height >= advancedFilters.heightRange[0] && 
                 height <= advancedFilters.heightRange[1] &&
                 weight >= advancedFilters.weightRange[0] && 
                 weight <= advancedFilters.weightRange[1]
        })

        // Legendary/Mythical filters (simplified - would need species data)
        if (advancedFilters.legendary) {
          // This would need species data to be accurate
          // For now, we'll skip this filter
        }

        if (advancedFilters.mythical) {
          // This would need species data to be accurate
          // For now, we'll skip this filter
        }

        setFilteredPokemon(results)
      } catch (error) {
        console.error('Error applying filters:', error)
        setFilteredPokemon([])
      } finally {
        setIsFiltering(false)
      }
    }

    applyFilters()
  }, [searchResults, pokemonList, advancedFilters])

  // Sort filtered results
  const sortedPokemon = useMemo(() => {
    return [...filteredPokemon].sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'stats':
          const aStats = a.stats.reduce((sum, stat) => sum + stat.base_stat, 0)
          const bStats = b.stats.reduce((sum, stat) => sum + stat.base_stat, 0)
          comparison = aStats - bStats
          break
        case 'hp':
          const aHp = a.stats.find(s => s.stat.name === 'hp')?.base_stat || 0
          const bHp = b.stats.find(s => s.stat.name === 'hp')?.base_stat || 0
          comparison = aHp - bHp
          break
        case 'attack':
          const aAtk = a.stats.find(s => s.stat.name === 'attack')?.base_stat || 0
          const bAtk = b.stats.find(s => s.stat.name === 'attack')?.base_stat || 0
          comparison = aAtk - bAtk
          break
        case 'defense':
          const aDef = a.stats.find(s => s.stat.name === 'defense')?.base_stat || 0
          const bDef = b.stats.find(s => s.stat.name === 'defense')?.base_stat || 0
          comparison = aDef - bDef
          break
        default:
          comparison = a.id - b.id
      }
      
      return sortOrder === 'desc' ? -comparison : comparison
    })
  }, [filteredPokemon, sortBy, sortOrder])

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setAdvancedFilters({
      types: [],
      generation: '',
      habitat: '',
      heightRange: [0, 20],
      weightRange: [0, 1000],
      legendary: false,
      mythical: false
    })
    setFilteredPokemon(pokemonList)
    clearSearch()
  }, [clearSearch, pokemonList])

  // Handle type filter toggle
  const toggleTypeFilter = useCallback((type: string) => {
    setAdvancedFilters(prev => {
      const newTypes = prev.types.includes(type)
        ? prev.types.filter(t => t !== type)
        : [...prev.types, type]
      
      return { ...prev, types: newTypes }
    })
  }, [])

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-surface/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Title */}
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-text">PokéDex</h1>
              <span className="text-sm text-muted hidden sm:inline">
                {pokemonList.length} Pokémon discovered
              </span>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-md mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted" />
                <input
                  type="text"
                  placeholder="Search by name, #, or type"
                  value={searchTerm}
                  onChange={(e) => {
                    handleSearchChange(e.target.value)
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-surface text-text focus:ring-2 focus:ring-poke-blue focus:border-transparent transition-all duration-200"
                />
                {searchLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-poke-blue"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Sort and Filter Controls */}
            <div className="flex items-center space-x-2">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-surface border border-border rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'grid' ? 'bg-poke-blue text-white' : 'hover:bg-white/50'
                  }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'list' ? 'bg-poke-blue text-white' : 'hover:bg-white/50'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              {/* Card Density Slider */}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-muted">Size:</span>
                <div className="flex items-center bg-surface border border-border rounded-lg p-1">
                  <button
                    onClick={() => setCardDensity('cozy')}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      cardDensity === 'cozy' ? 'bg-poke-blue text-white' : 'hover:bg-white/50'
                    }`}
                  >
                    Cozy
                  </button>
                  <button
                    onClick={() => setCardDensity('compact')}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      cardDensity === 'compact' ? 'bg-poke-blue text-white' : 'hover:bg-white/50'
                    }`}
                  >
                    Compact
                  </button>
                  <button
                    onClick={() => setCardDensity('ultra')}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      cardDensity === 'ultra' ? 'bg-poke-blue text-white' : 'hover:bg-white/50'
                    }`}
                  >
                    Ultra
                  </button>
                </div>
              </div>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'id' | 'name' | 'stats' | 'hp' | 'attack' | 'defense')}
                className="px-3 py-2 border border-border rounded-lg bg-surface text-text text-sm focus:ring-2 focus:ring-poke-blue focus:border-transparent"
              >
                <option value="id">Sort by Number</option>
                <option value="name">Sort by Name</option>
                <option value="stats">Sort by Total Stats</option>
                <option value="hp">Sort by HP</option>
                <option value="attack">Sort by Attack</option>
                <option value="defense">Sort by Defense</option>
              </select>
              
              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="p-2 rounded-lg hover:bg-white/50 transition-colors"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className={`p-2 rounded-lg transition-colors ${
                  showSidebar ? 'bg-poke-blue text-white' : 'hover:bg-white/50'
                }`}
              >
                <Filter className="h-5 w-5" />
              </button>

              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Type Filter Ribbon */}
      <div className="border-b border-border bg-surface/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide">
              {Object.keys(typeColors).map(type => (
                <button
                  key={type}
                  onClick={() => toggleTypeFilter(type)}
                  className={`px-3 py-1 rounded-full text-sm font-medium border transition-all duration-200 whitespace-nowrap`}
                  style={{
                    backgroundColor: `var(--type-${type})`,
                    color: typeColors[type].text === 'text-white' ? 'white' : 'black',
                    borderColor: `var(--type-${type})`,
                    opacity: advancedFilters.types.includes(type) ? 1 : 0.4
                  }}
                  onMouseEnter={(e) => {
                    if (!advancedFilters.types.includes(type)) {
                      e.currentTarget.style.opacity = '0.8'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!advancedFilters.types.includes(type)) {
                      e.currentTarget.style.opacity = '0.4'
                    }
                  }}
                >
                  {formatPokemonName(type)}
                </button>
              ))}
            </div>
            
            <div className="flex items-center space-x-2 ml-4">
              <span className="text-sm text-muted">
                {isFiltering ? 'Loading...' : `Showing ${filteredPokemon.length} of ${pokemonList.length}`}
              </span>
              {(advancedFilters.types.length > 0 || searchTerm || advancedFilters.generation) && (
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-poke-blue hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar - Advanced Filters */}
        <div className={`${
          showSidebar ? 'block' : 'hidden'
        } lg:block lg:w-80 border-r border-border bg-surface/30`}>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Advanced Filters</h2>
              <button
                onClick={() => setShowSidebar(false)}
                className="lg:hidden p-1 rounded hover:bg-white/50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Results Count */}
            <div className="text-sm text-muted">
              {filteredPokemon.length} Pokémon found
            </div>

            {/* Generation Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Generation</label>
                              <select
                  value={advancedFilters.generation}
                  onChange={(e) => {
                    setAdvancedFilters(prev => ({
                      ...prev, 
                      generation: e.target.value 
                    }))
                  }}
                className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text"
              >
                <option value="">All Generations</option>
                <option value="1">Generation 1</option>
                <option value="2">Generation 2</option>
                <option value="3">Generation 3</option>
                <option value="4">Generation 4</option>
                <option value="5">Generation 5</option>
                <option value="6">Generation 6</option>
                <option value="7">Generation 7</option>
                <option value="8">Generation 8</option>
                <option value="9">Generation 9</option>
              </select>
            </div>

            {/* Height Range */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Height: {advancedFilters.heightRange[0]}m - {advancedFilters.heightRange[1]}m
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="0.1"
                  value={advancedFilters.heightRange[0]}
                                    onChange={(e) => {
                    setAdvancedFilters(prev => ({
                      ...prev, 
                      heightRange: [parseFloat(e.target.value), prev.heightRange[1]] as [number, number]
                    }))
                  }}
                  className="w-full"
                />
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="0.1"
                  value={advancedFilters.heightRange[1]}
                                    onChange={(e) => {
                    setAdvancedFilters(prev => ({
                      ...prev, 
                      heightRange: [prev.heightRange[0], parseFloat(e.target.value)] as [number, number]
                    }))
                  }}
                  className="w-full"
                />
              </div>
            </div>

            {/* Weight Range */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Weight: {advancedFilters.weightRange[0]}kg - {advancedFilters.weightRange[1]}kg
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="1"
                  value={advancedFilters.weightRange[0]}
                                    onChange={(e) => {
                    setAdvancedFilters(prev => ({
                      ...prev, 
                      weightRange: [parseInt(e.target.value), prev.weightRange[1]] as [number, number]
                    }))
                  }}
                  className="w-full"
                />
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="1"
                  value={advancedFilters.weightRange[1]}
                                    onChange={(e) => {
                    setAdvancedFilters(prev => ({
                      ...prev, 
                      weightRange: [prev.weightRange[0], parseInt(e.target.value)] as [number, number]
                    }))
                  }}
                  className="w-full"
                />
              </div>
            </div>

            {/* Legendary/Mythical Toggles */}
            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={advancedFilters.legendary}
                  onChange={(e) => {
                    setAdvancedFilters(prev => ({
                      ...prev, 
                      legendary: e.target.checked 
                    }))
                  }}
                  className="rounded"
                />
                <span className="text-sm">Legendary</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={advancedFilters.mythical}
                  onChange={(e) => {
                    setAdvancedFilters(prev => ({
                      ...prev, 
                      mythical: e.target.checked 
                    }))
                  }}
                  className="rounded"
                />
                <span className="text-sm">Mythical</span>
              </label>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          <div className="p-6">
            {/* Pokémon Grid */}
            {isFiltering ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-poke-blue mx-auto mb-4"></div>
                <p className="text-muted">Loading Pokémon...</p>
              </div>
            ) : sortedPokemon.length > 0 ? (
              <VirtualizedPokemonGrid
                pokemonList={sortedPokemon}
                onToggleFavorite={onToggleFavorite}
                onSelectPokemon={undefined}
                selectedPokemon={null}
                favorites={favorites}
                density={cardDensity}
                viewMode={viewMode}
              />
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold mb-2">No Pokémon found</h3>
                <p className="text-muted mb-4">
                  Try adjusting your search terms or filters
                </p>
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 bg-poke-blue text-white rounded-lg hover:bg-poke-blue/90 transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Overlay */}
      {showSidebar && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-50" onClick={() => setShowSidebar(false)}>
          <div className="absolute right-0 top-0 h-full w-80 bg-surface p-6" onClick={e => e.stopPropagation()}>
            {/* Mobile sidebar content - same as desktop */}
          </div>
        </div>
      )}
    </div>
  )
}
