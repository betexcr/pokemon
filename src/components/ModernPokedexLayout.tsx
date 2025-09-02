'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Pokemon, FilterState } from '@/types/pokemon'
import { formatPokemonName, typeColors } from '@/lib/utils'
import { useSearch } from '@/hooks/useSearch'
import { useRouter } from 'next/navigation'
import { getPokemonByGeneration, getPokemonByType, getPokemon } from '@/lib/api'
import ThemeToggle from './ThemeToggle'
import VirtualizedPokemonGrid from './VirtualizedPokemonGrid'
import { Search, Filter, X, Scale, ArrowRight, Menu } from 'lucide-react'

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
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMobileMenu && !(event.target as Element).closest('.mobile-menu')) {
        setShowMobileMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMobileMenu])

  // Close mobile menu on large screens and track screen size
  useEffect(() => {
    const handleResize = () => {
      const isMobileScreen = window.innerWidth < 768
      setIsMobile(isMobileScreen)
      
      if (!isMobileScreen && showMobileMenu) {
        setShowMobileMenu(false)
      }
    }

    // Set initial screen size
    handleResize()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [showMobileMenu])

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (showMobileMenu) {
      const original = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = original
      }
    }
  }, [showMobileMenu])

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
      <header className="sticky top-0 z-50 bg-gradient-to-r from-surface via-surface to-surface border-b border-border shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 lg:h-24 py-3 list-none">
            {/* Brand & Title Section */}
            <div className="flex items-center space-x-3 lg:space-x-6">
              {/* POKEDEX Text - Upper Left */}
              <div className="absolute left-4 top-3 lg:top-4 z-10">
                <h1 className="font-['Pocket_Monk'] text-2xl lg:text-3xl font-bold text-poke-blue tracking-wider drop-shadow-lg">
                  POKÉDEX
                </h1>
              </div>
              
              {/* Logo/Brand - Centered */}
              <div className="flex items-center space-x-2 lg:space-x-3 mx-auto">
                <div className="flex flex-col">
                  <h2 className="text-lg lg:text-xl font-bold bg-gradient-to-r from-poke-blue via-poke-red to-poke-blue bg-clip-text text-transparent animate-pulse">
                    PokéDex
                  </h2>
                  <span className="text-xs text-muted font-medium hidden sm:block">
                    {pokemonList.length} Pokémon discovered
                  </span>
                </div>
              </div>
            </div>

            {/* Enhanced Search Bar */}
            <div className="hidden lg:flex flex-1 max-w-lg mx-8">
              <div className="relative group w-full">
                <div className="absolute inset-0 bg-gradient-to-r from-poke-blue/20 to-poke-red/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-0 group-hover:opacity-100"></div>
                <div className="relative bg-surface border border-border rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:border-poke-blue/30">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted group-hover:text-poke-blue transition-colors duration-200" />
                  <input
                    type="text"
                    placeholder="Search Pokémon by name, number, or type..."
                    value={searchTerm}
                    onChange={(e) => {
                      handleSearchChange(e.target.value)
                    }}
                    className="w-full pl-12 md:pl-14 pr-4 py-3 bg-transparent text-text placeholder:text-muted/60 focus:outline-none text-base font-medium"
                  />
                  {searchLoading && (
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-poke-blue border-t-transparent"></div>
                    </div>
                  )}
                  {searchTerm && (
                    <button
                      onClick={() => handleSearchChange('')}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-white/20 transition-colors"
                    >
                      <X className="h-4 w-4 text-muted hover:text-text" />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Desktop Status Indicator */}
              <div className="ml-4 flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isFiltering ? 'bg-poke-yellow animate-pulse' : 'bg-green-500'}`}></div>
                <span className="text-sm text-muted font-medium">
                  {isFiltering ? 'Filtering...' : `${filteredPokemon.length} of ${pokemonList.length}`}
                </span>
                {(advancedFilters.types.length > 0 || searchTerm || advancedFilters.generation) && (
                  <button
                    onClick={clearAllFilters}
                    className="text-xs text-poke-blue hover:text-poke-blue/80 hover:underline font-medium"
                    title="Clear all filters"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>

            {/* Enhanced Desktop Controls Section */}
            <div className="flex items-center space-x-4">
              {/* Card Density Controls */}
              <div className="hidden md:flex items-center space-x-2">
                <span className="text-xs font-medium text-muted uppercase tracking-wider">Size</span>
                <div className="flex items-center bg-surface border border-border rounded-xl p-1 shadow-sm">
                  {[
                    { id: 'cozy', label: 'Cozy', icon: '🟢' },
                    { id: 'compact', label: 'Compact', icon: '🟡' },
                    { id: 'ultra', label: 'Ultra', icon: '🔴' }
                  ].map(({ id, label, icon }) => (
                    <button
                      key={id}
                      onClick={() => setCardDensity(id as 'cozy' | 'compact' | 'ultra')}
                      className={`px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                        cardDensity === id 
                          ? 'bg-poke-blue text-white shadow-lg scale-105' 
                          : 'text-muted hover:text-text hover:bg-white/50'
                      }`}
                    >
                      <span>{icon}</span>
                      <span className="hidden xl:inline">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort Controls */}
              <div className="hidden md:flex items-center space-x-2">
                <span className="text-xs font-medium text-muted uppercase tracking-wider">Sort</span>
                <div className="flex items-center space-x-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'id' | 'name' | 'stats' | 'hp' | 'attack' | 'defense')}
                    className="px-3 py-2 bg-surface border border-border rounded-xl text-text text-sm font-medium focus:ring-2 focus:ring-poke-blue focus:border-poke-blue focus:outline-none transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <option value="id">Number</option>
                    <option value="name">Name</option>
                    <option value="stats">Total Stats</option>
                    <option value="hp">HP</option>
                    <option value="attack">Attack</option>
                    <option value="defense">Defense</option>
                  </select>
                  
                  <button
                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="p-2 rounded-xl bg-surface border border-border hover:bg-white/50 hover:border-poke-blue/30 transition-all duration-200 shadow-sm hover:shadow-md group"
                    title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                  >
                    <div className={`transform transition-transform duration-200 ${sortOrder === 'asc' ? 'rotate-0' : 'rotate-180'}`}>
                      <svg className="w-4 h-4 text-muted group-hover:text-poke-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    </div>
                  </button>
                </div>
              </div>

              {/* Quick Type Filters - Desktop */}
              <div className="hidden lg:flex items-center space-x-2">
                <span className="text-xs font-medium text-muted uppercase tracking-wider">Types</span>
                <div className="flex items-center space-x-1">
                  {Object.keys(typeColors).slice(0, 6).map(type => (
                    <button
                      key={type}
                      onClick={() => toggleTypeFilter(type)}
                      className={`px-2 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                        advancedFilters.types.includes(type) 
                          ? 'ring-2 ring-white shadow-lg scale-105' 
                          : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{
                        backgroundColor: `var(--type-${type})`,
                        color: typeColors[type].text === 'text-white' ? 'white' : 'black',
                      }}
                      title={`Filter by ${formatPokemonName(type)} type`}
                    >
                      {formatPokemonName(type)}
                    </button>
                  ))}
                  {advancedFilters.types.length > 0 && (
                    <button
                      onClick={() => setAdvancedFilters(prev => ({ ...prev, types: [] }))}
                      className="px-2 py-1 text-xs text-poke-blue hover:text-poke-blue/80 hover:underline font-medium"
                      title="Clear type filters"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className={`p-3 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md ${
                  showSidebar 
                    ? 'bg-poke-blue text-white shadow-lg scale-105' 
                    : 'bg-surface border border-border text-muted hover:text-text hover:bg-white/50 hover:border-poke-blue/30'
                }`}
                title={showSidebar ? 'Hide filters' : 'Show filters'}
              >
                <Filter className="h-5 w-5" />
              </button>

              {/* Theme Toggle */}
              <div className="hidden sm:block">
                <ThemeToggle />
              </div>

              {/* Desktop Comparison Button */}
              <button
                onClick={() => router.push('/compare')}
                className="hidden md:flex relative items-center space-x-2 px-4 py-2 rounded-xl bg-surface border border-border text-muted hover:text-text hover:bg-white/50 hover:border-poke-blue/30 transition-all duration-200 shadow-sm hover:shadow-md"
                title="Go to comparison"
              >
                <Scale className="h-4 w-4" />
                <span className="text-sm font-medium">Compare</span>
                {comparisonList.length > 0 && (
                  <span className="px-2 py-0.5 bg-poke-red text-white text-xs rounded-full font-bold">
                    {comparisonList.length}
                  </span>
                )}
              </button>

              {/* Mobile Comparison Button */}
              <button
                onClick={() => router.push('/compare')}
                className="lg:hidden relative p-3 rounded-xl bg-surface border border-border text-muted hover:text-text hover:bg-white/50 hover:border-poke-blue/30 transition-all duration-200 shadow-sm hover:shadow-md"
                title="Go to comparison"
              >
                <Scale className="h-5 w-5" />
              </button>

              {/* Mobile Menu Toggle - Only on small screens */}
              <button
                onClick={() => {
                  // Only allow mobile menu on small screens
                  // if (isMobile) {
                    setShowMobileMenu(!showMobileMenu)
                  // }
                }}
                className="mobile-menu md:hidden p-3 rounded-xl bg-surface border border-border text-muted hover:text-text hover:bg-white/50 hover:border-poke-blue/30 transition-all duration-200 shadow-sm hover:shadow-md"
                title="Toggle mobile menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay - Only on small screens */}
      {showMobileMenu && isMobile && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/95 animate-in fade-in duration-200">
          <div
            className="mobile-menu fixed right-0 top-0 h-full w-full bg-bg bg-opacity-100 border-l border-border shadow-2xl animate-in slide-in-from-right duration-300"
            style={{ backgroundColor: 'var(--color-bg)' }}
          >
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text">Quick Actions</h3>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 rounded-lg hover:bg-white/20 transition-all duration-200 hover:scale-110"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {/* Mobile Search Section */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-text uppercase tracking-wider">Search</h4>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text" />
                  <input
                    type="text"
                    placeholder="Quick search..."
                    value={searchTerm}
                    onChange={(e) => {
                      handleSearchChange(e.target.value)
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-surface text-text placeholder:text-muted focus:ring-2 focus:ring-poke-blue focus:border-poke-blue focus:outline-none transition-all duration-200 text-sm"
                  />
                </div>
              </div>

              {/* Mobile Card Density Controls */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-text uppercase tracking-wider">Card Size</h4>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'cozy', label: 'Cozy', icon: '🟢' },
                    { id: 'compact', label: 'Compact', icon: '🟡' },
                    { id: 'ultra', label: 'Ultra', icon: '🔴' }
                  ].map(({ id, label, icon }) => (
                    <button
                      key={id}
                      onClick={() => {
                        setCardDensity(id as 'cozy' | 'compact' | 'ultra')
                        setShowMobileMenu(false)
                      }}
                      className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 flex flex-col items-center space-y-2 ${
                        cardDensity === id 
                          ? 'bg-poke-blue text-white shadow-lg' 
                          : 'bg-surface border border-border text-text hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-lg">{icon}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Type Filters */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-text uppercase tracking-wider">Quick Type Filters</h4>
                <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                  {Object.keys(typeColors).slice(0, 9).map(type => (
                    <button
                      key={type}
                      onClick={() => {
                        toggleTypeFilter(type)
                        setShowMobileMenu(false)
                      }}
                      className={`px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                        advancedFilters.types.includes(type) 
                          ? 'ring-2 ring-white shadow-lg scale-105' 
                          : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{
                        backgroundColor: `var(--type-${type})`,
                        color: typeColors[type].text === 'text-white' ? 'white' : 'black',
                      }}
                    >
                      {formatPokemonName(type)}
                    </button>
                  ))}
                </div>
                
                {/* Mobile Status Indicator */}
                <div className="flex items-center justify-between text-sm text-text">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${isFiltering ? 'bg-poke-yellow animate-pulse' : 'bg-green-500'}`}></div>
                  </div>
                  {(advancedFilters.types.length > 0 || searchTerm || advancedFilters.generation) && (
                    <button
                      onClick={() => {
                        clearAllFilters()
                        setShowMobileMenu(false)
                      }}
                      className="text-poke-blue hover:text-poke-blue/80 hover:underline font-medium"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </div>

              {/* Mobile Filter Toggle */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-text uppercase tracking-wider">Filters</h4>
                <button
                  onClick={() => {
                    setShowSidebar(!showSidebar)
                    setShowMobileMenu(false)
                  }}
                  className={`w-full p-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                    showSidebar 
                      ? 'bg-poke-blue text-white shadow-lg' 
                      : 'bg-white border border-border text-text hover:bg-gray-50'
                  }`}
                >
                  <Filter className="h-5 w-5" />
                  <span>{showSidebar ? 'Hide Filters' : 'Show Filters'}</span>
                </button>
              </div>

              {/* Mobile Sort Controls */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-text uppercase tracking-wider">Sort By</h4>
                <div className="space-y-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'id' | 'name' | 'stats' | 'hp' | 'attack' | 'defense')}
                    className="w-full px-3 py-2 bg-white border border-border rounded-xl text-text text-sm font-medium focus:ring-2 focus:ring-poke-blue focus:border-poke-blue focus:outline-none transition-all duration-200"
                  >
                    <option value="id">Number</option>
                    <option value="name">Name</option>
                    <option value="stats">Total Stats</option>
                    <option value="hp">HP</option>
                    <option value="attack">Attack</option>
                    <option value="defense">Defense</option>
                  </select>
                  
                  <button
                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="w-full p-2 rounded-xl bg-white border border-border hover:bg-gray-50 hover:border-poke-blue transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    <span className="text-sm font-medium">
                      {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                    </span>
                    <svg className={`w-4 h-4 transform transition-transform duration-200 ${sortOrder === 'asc' ? 'rotate-0' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Mobile Comparison Section */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-text uppercase tracking-wider">Comparison</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      router.push('/compare')
                      setShowMobileMenu(false)
                    }}
                    className="w-full p-3 rounded-xl bg-poke-blue text-white font-medium transition-all duration-200 hover:bg-poke-blue/80 flex items-center justify-center space-x-2"
                  >
                    <Scale className="h-5 w-5" />
                    <span>Go to Comparison</span>
                    {comparisonList.length > 0 && (
                      <span className="ml-2 px-2 py-1 bg-white text-poke-blue text-xs rounded-full font-bold">
                        {comparisonList.length}
                      </span>
                    )}
                  </button>
                  {comparisonList.length > 0 && (
                    <button
                      onClick={() => {
                        onClearComparison()
                        setShowMobileMenu(false)
                      }}
                      className="w-full p-2 rounded-lg bg-white border border-border text-text hover:bg-gray-50 transition-all duration-200 text-sm"
                    >
                      Clear Comparison
                    </button>
                  )}
                </div>
              </div>

              {/* Mobile Theme Toggle */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-text uppercase tracking-wider">Theme</h4>
                <ThemeToggle />
              </div>

              {/* Mobile Close Button */}
              <div className="pt-6 border-t border-border">
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="w-full p-3 rounded-xl bg-white border border-border text-text hover:bg-gray-50 transition-all duration-200 font-medium"
                >
                  Close Menu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Search Bar - Only on small screens */}
      <div className="md:hidden border-b border-border bg-surface">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text" />
            <input
              type="text"
              placeholder="Search Pokémon..."
              value={searchTerm}
              onChange={(e) => {
                handleSearchChange(e.target.value)
              }}
              className="w-full pl-10 pr-4 py-3 border border-border rounded-xl bg-white text-text placeholder:text-muted focus:ring-2 focus:ring-poke-blue focus:border-poke-blue focus:outline-none transition-all duration-200"
            />
            {searchLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-poke-blue border-t-transparent"></div>
              </div>
            )}
            {searchTerm && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="h-4 w-4 text-text hover:text-poke-blue" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Type Filter Ribbon */}
      <div className="border-b border-border bg-gradient-to-r from-surface via-surface to-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Type Filter Buttons */}
            <div className="flex items-center space-x-3 overflow-x-auto scrollbar-hide pb-2">
              {Object.keys(typeColors).map(type => (
                <button
                  key={type}
                  onClick={() => toggleTypeFilter(type)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all duration-300 whitespace-nowrap shadow-sm hover:shadow-md transform hover:scale-105 ${
                    advancedFilters.types.includes(type) 
                      ? 'border-white shadow-lg scale-105' 
                      : 'border-transparent opacity-60 hover:opacity-80'
                  }`}
                  style={{
                    backgroundColor: `var(--type-${type})`,
                    color: typeColors[type].text === 'text-white' ? 'white' : 'black',
                  }}
                  onMouseEnter={(e) => {
                    if (!advancedFilters.types.includes(type)) {
                      e.currentTarget.style.opacity = '0.9'
                      e.currentTarget.style.transform = 'scale(1.05)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!advancedFilters.types.includes(type)) {
                      e.currentTarget.style.opacity = '0.6'
                      e.currentTarget.style.transform = 'scale(1)'
                    }
                  }}
                >
                  {formatPokemonName(type)}
                </button>
              ))}
            </div>
            
            {/* Filter Status & Actions */}
            <div className="flex items-center space-x-4 ml-6">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isFiltering ? 'bg-poke-yellow animate-pulse' : 'bg-green-500'}`}></div>
                  <span className="text-sm font-medium text-muted">
                    {isFiltering ? 'Filtering...' : `${filteredPokemon.length} of ${pokemonList.length}`}
                  </span>
                </div>
                
                {(advancedFilters.types.length > 0 || searchTerm || advancedFilters.generation) && (
                  <button
                    onClick={clearAllFilters}
                    className="px-3 py-1.5 text-sm font-medium text-poke-blue hover:text-poke-blue/80 bg-poke-blue/10 hover:bg-poke-blue/20 rounded-lg transition-all duration-200 hover:shadow-sm"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar - Advanced Filters */}
        <div className={`${
          showSidebar ? 'block' : 'hidden'
        } lg:block lg:w-80 border-r border-border bg-surface`}>
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
