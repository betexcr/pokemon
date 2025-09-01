'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Pokemon, FilterState } from '@/types/pokemon'
import { formatPokemonName, typeColors } from '@/lib/utils'
import { useSearch } from '@/hooks/useSearch'
import { useRouter } from 'next/navigation'
import { getPokemonByGeneration, getPokemonByType, getPokemon } from '@/lib/api'
import ThemeToggle from './ThemeToggle'
import VirtualizedPokemonGrid from './VirtualizedPokemonGrid'
import { Search, Filter, X, Scale, ArrowRight } from 'lucide-react'

interface ModernPokedexLayoutProps {
  pokemonList: Pokemon[]
  selectedPokemon: Pokemon | null
  onSelectPokemon: (pokemon: Pokemon) => void
  onToggleComparison: (id: number) => void
  onClearComparison: () => void
  comparisonList: number[]
  filters: FilterState
  setFilters: (filters: FilterState) => void
}

interface AdvancedFilters {
  types: string[]
  generation: string
  habitat: string
  heightRange: [number, number]
  weightRange: [number, number]
}

export default function ModernPokedexLayout({
  pokemonList,
  selectedPokemon,
  onSelectPokemon,
  onToggleComparison,
  onClearComparison,
  comparisonList,
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
    weightRange: [0, 1000]
  })
  
  const [showSidebar, setShowSidebar] = useState(true) // Advanced filters open by default
  const [sortBy, setSortBy] = useState<'id' | 'name' | 'stats' | 'hp' | 'attack' | 'defense'>('id')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [filteredPokemon, setFilteredPokemon] = useState<Pokemon[]>([])
  const [isFiltering, setIsFiltering] = useState(false)
  const [cardDensity, setCardDensity] = useState<'cozy' | 'compact' | 'ultra'>('compact')
  const [comparisonPokemon, setComparisonPokemon] = useState<Pokemon[]>([])

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
        } else if (advancedFilters.generation && advancedFilters.generation !== 'all') {
          // Fetch by generation only if not "all"
          results = await getPokemonByGeneration(advancedFilters.generation)
          
          // Apply type filters to generation results
          if (advancedFilters.types.length > 0 && results.length > 0) {
            results = results.filter(pokemon => {
              const pokemonTypes = new Set(pokemon.types.map(type => type.type.name))
              return advancedFilters.types.every(selectedType => pokemonTypes.has(selectedType))
            })
          }
        } else if (advancedFilters.types.length > 0) {
          // "All generations" with type filter - fetch ALL Pokémon of the selected types
          if (advancedFilters.types.length === 1) {
            // Single type - fetch all Pokémon of that type
            results = await getPokemonByType(advancedFilters.types[0])
          } else {
            // Multiple types - fetch all Pokémon of each type and find intersection
            const typePokemonLists = await Promise.all(
              advancedFilters.types.map(type => getPokemonByType(type))
            )
            
            // Find Pokémon that appear in ALL selected types (AND logic)
            const pokemonCounts = new Map<number, number>()
            typePokemonLists.forEach(pokemonList => {
              pokemonList.forEach(pokemon => {
                pokemonCounts.set(pokemon.id, (pokemonCounts.get(pokemon.id) || 0) + 1)
              })
            })
            
            // Only include Pokémon that appear in all selected types
            const allTypePokemon = typePokemonLists.flat()
            results = allTypePokemon.filter((pokemon, index, self) => {
              const isFirstOccurrence = index === self.findIndex(p => p.id === pokemon.id)
              if (!isFirstOccurrence) return false
              return pokemonCounts.get(pokemon.id) === advancedFilters.types.length
            })
          }
        } else {
          // No filters - use base pokemon list
          results = pokemonList
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



        setFilteredPokemon(results)
      } catch (error) {
        console.error('Error applying filters:', error)
        setFilteredPokemon([])
        // Show a more user-friendly error message
        console.warn('Filtering failed, showing empty results. Try refreshing the page.')
      } finally {
        setIsFiltering(false)
      }
    }

    applyFilters()
  }, [searchResults, pokemonList, advancedFilters])

  // Fetch comparison Pokémon that aren't in current filtered results
  useEffect(() => {
    const fetchComparisonPokemon = async () => {
      if (comparisonList.length === 0) {
        setComparisonPokemon([])
        return
      }

      // Get all available Pokémon IDs (from filtered results and pokemon list)
      const availableIds = new Set([
        ...filteredPokemon.map(p => p.id),
        ...pokemonList.map(p => p.id)
      ])

      // Find comparison Pokémon that aren't available
      const missingIds = comparisonList.filter(id => !availableIds.has(id))

      if (missingIds.length === 0) {
        // All comparison Pokémon are available in current results
        const availableComparison = filteredPokemon.filter(p => comparisonList.includes(p.id))
        setComparisonPokemon(availableComparison)
        return
      }

      try {
        // Fetch missing Pokémon
        const fetchedPokemon = await Promise.all(
          missingIds.map(id => getPokemon(id))
        )

        // Combine with available comparison Pokémon
        const availableComparison = filteredPokemon.filter(p => comparisonList.includes(p.id))
        setComparisonPokemon([...availableComparison, ...fetchedPokemon])
      } catch (error) {
        console.error('Error fetching comparison Pokémon:', error)
        // Fallback to only available Pokémon
        const availableComparison = filteredPokemon.filter(p => comparisonList.includes(p.id))
        setComparisonPokemon(availableComparison)
      }
    }

    fetchComparisonPokemon()
  }, [comparisonList, filteredPokemon, pokemonList])

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
      weightRange: [0, 1000]
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
          <div className="flex items-center justify-between h-20 py-2">
            {/* Title */}
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-text">PokéDex</h1>
              <span className="text-sm text-muted hidden sm:inline ml-6">
                {pokemonList.length} Pokémon discovered
              </span>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-md mx-12">
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

            {/* Card Density Controls */}
            <div className="flex items-center space-x-6">
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

            {/* Comparison Section */}
            <div className="border-t border-border pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Scale className="h-5 w-5 mr-2 text-blue-500" />
                Compare Pokémon
              </h3>
              
              {comparisonList.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-muted mb-3">
                    Select Pokémon to compare their stats
                  </p>
                  <div className="text-4xl mb-2">⚖️</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Selected Pokémon List */}
                  <div className="max-h-48 overflow-y-auto bg-gray-800 rounded-lg border border-gray-700">
                    {comparisonPokemon.map((pokemon, index) => (
                        <div
                          key={pokemon.id}
                          className={`flex items-center px-3 py-2 ${
                            index < comparisonPokemon.length - 1 
                              ? 'border-b border-gray-700' 
                              : ''
                          }`}
                        >
                          <img
                            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`}
                            alt={formatPokemonName(pokemon.name)}
                            className="w-8 h-8 object-contain mr-3"
                          />
                          <span className="text-white text-sm">
                            {formatPokemonName(pokemon.name)}#{pokemon.id}
                          </span>
                          <button
                            onClick={() => onToggleComparison(pokemon.id)}
                            className="ml-auto p-1 rounded hover:bg-red-600 transition-colors"
                            aria-label={`Remove ${formatPokemonName(pokemon.name)} from comparison`}
                          >
                            <X className="h-3 w-3 text-red-400" />
                          </button>
                        </div>
                      ))}
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-2 border-t border-border">
                    <button
                      onClick={onClearComparison}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Clear All
                    </button>
                    <button
                      onClick={() => window.location.href = '/compare'}
                      className="w-full px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center"
                    >
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Go to Comparison
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          <div className="p-8">
            {/* Pokémon Grid */}
            {isFiltering ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-poke-blue mx-auto mb-4"></div>
                <p className="text-muted">Loading Pokémon...</p>
              </div>
            ) : sortedPokemon.length > 0 ? (
              <VirtualizedPokemonGrid
                pokemonList={sortedPokemon}
                onToggleComparison={onToggleComparison}
                onSelectPokemon={undefined}
                selectedPokemon={null}
                comparisonList={comparisonList}
                density={cardDensity}
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
