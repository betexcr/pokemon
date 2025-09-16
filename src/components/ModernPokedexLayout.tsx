'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Pokemon, FilterState } from '@/types/pokemon'
import { formatPokemonName, typeColors } from '@/lib/utils'
import { useSearch } from '@/hooks/useSearch'
import { useRouter } from 'next/navigation'
import { getPokemonByGeneration, getPokemonByType, getPokemon, getPokemonWithPagination, getPokemonTotalCount, getPokemonList } from '@/lib/api'
import ThemeToggle from './ThemeToggle'
import VirtualizedPokemonGrid from './VirtualizedPokemonGrid'
import PokedexListView from './PokedexListView'
import AdvancedFilters from './AdvancedFilters'
import { Search, X, List, Grid3X3, Grid2X2, LayoutGridIcon } from 'lucide-react'
import UserDropdown from './UserDropdown'
import AuthModal from './auth/AuthModal'
import { useAuth } from '@/contexts/AuthContext'
import { createHeuristics } from '@/lib/heuristics/core'
import { LocalStorageAdapter, MemoryStorage } from '@/lib/heuristics/storage'
import Image from 'next/image'
import HeaderIcons, { HamburgerMenu } from '@/components/HeaderIcons'
import AppHeader from '@/components/AppHeader'

// Legendary and Mythical Pokémon lists
const LEGENDARY_POKEMON = new Set([
  // Gen 1
  144, 145, 146, 150, 151,
  // Gen 2
  243, 244, 245, 249, 250, 251,
  // Gen 3
  377, 378, 379, 380, 381, 382, 383, 384, 385, 386,
  // Gen 4
  480, 481, 482, 483, 484, 485, 486, 487, 488, 489, 490, 491, 492, 493,
  // Gen 5
  638, 639, 640, 641, 642, 643, 644, 645, 646, 647, 648, 649,
  // Gen 6
  716, 717, 718, 719, 720, 721,
  // Gen 7
  772, 773, 774, 775, 776, 777, 778, 779, 780, 781, 782, 783, 784, 785, 786, 787, 788, 789, 790, 791, 792, 793, 794, 795, 796, 797, 798, 799, 800, 801, 802, 807, 808,
  // Gen 8
  888, 889, 890, 891, 892, 893, 894, 895, 896, 897, 898,
  // Gen 9
  999, 1000, 1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009, 1010, 1011, 1012, 1013, 1014, 1015, 1016, 1017, 1018, 1019, 1020, 1021, 1022, 1023, 1024, 1025
])

const MYTHICAL_POKEMON = new Set([
  // Gen 1
  151, // Mew
  // Gen 2
  251, // Celebi
  // Gen 3
  385, // Jirachi
  // Gen 4
  489, 490, 491, 492, 493, // Phione, Manaphy, Darkrai, Shaymin, Arceus
  // Gen 5
  647, 648, 649, // Keldeo, Meloetta, Genesect
  // Gen 6
  719, 720, 721, // Diancie, Hoopa, Volcanion
  // Gen 7
  801, 802, 807, 808, // Magearna, Marshadow, Zeraora, Meltan, Melmetal
  // Gen 8
  890, 891, 892, 893, 894, 895, 896, 897, 898, // Kubfu, Urshifu, Zarude, Regieleki, Regidrago, Glastrier, Spectrier, Calyrex
  // Gen 9
  1007, 1008, 1009, 1010, 1011, 1012, 1013, 1014, 1015, 1016, 1017, 1018, 1019, 1020, 1021, 1022, 1023, 1024, 1025 // Various Gen 9 Mythicals
])

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
  legendary: boolean
  mythical: boolean
}

export default function ModernPokedexLayout({
  pokemonList,
  // selectedPokemon: _selectedPokemon,
  // onSelectPokemon: _onSelectPokemon,
  onToggleComparison,
  onClearComparison,
  comparisonList,
  // filters: _filters,
  // setFilters: _setFilters
}: ModernPokedexLayoutProps) {
  // console debug removed
  const router = useRouter()
  const { user } = useAuth()
  
  // Advanced filters state
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
    types: [],
    generation: 'all', // Default to "All Generations" to enable infinite scroll
    habitat: '',
    heightRange: [0, 20],
    weightRange: [0, 1000],
    legendary: false,
    mythical: false
  })
  
  const [showSidebar, setShowSidebar] = useState(true) // Advanced filters open by default
  const [sortBy, setSortBy] = useState<'id' | 'name' | 'stats' | 'hp' | 'attack' | 'defense' | 'special-attack' | 'special-defense' | 'speed'>('id')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  
  // Debounced filter values for weight and height
  const [debouncedHeightRange, setDebouncedHeightRange] = useState<[number, number]>([0, 20])
  const [debouncedWeightRange, setDebouncedWeightRange] = useState<[number, number]>([0, 1000])
  const [filteredPokemon, setFilteredPokemon] = useState<Pokemon[]>([])
  
  // Debouncing for height and weight filters
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedHeightRange(advancedFilters.heightRange)
    }, 300) // 300ms debounce
    
    return () => clearTimeout(timer)
  }, [advancedFilters.heightRange])
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedWeightRange(advancedFilters.weightRange)
    }, 300) // 300ms debounce
    
    return () => clearTimeout(timer)
  }, [advancedFilters.weightRange])
  const [isFiltering, setIsFiltering] = useState(false)
  const [cardDensity, setCardDensity] = useState<'3cols' | '6cols' | '9cols' | 'list'>('6cols')
  const [comparisonPokemon, setComparisonPokemon] = useState<Pokemon[]>([])
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [detailsCache, setDetailsCache] = useState<Map<number, Pokemon>>(new Map())
  const fetchingRef = useRef<Set<number>>(new Set())
  
  // Infinite scrolling state
  const [allGenerationsPokemon, setAllGenerationsPokemon] = useState<Pokemon[]>([])
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMorePokemon, setHasMorePokemon] = useState(true)
  const [currentOffset, setCurrentOffset] = useState(0)
  const [isAllGenerations, setIsAllGenerations] = useState(true) // Start in "All Generations" mode by default
  const [totalPokemonCount, setTotalPokemonCount] = useState<number | null>(null)
  const emptyBatchCountRef = useRef<number>(0)
  const lastLoadTimeRef = useRef<number>(0)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login')

  // Heuristics-driven render-only cap and moving window
  const storage = typeof window !== 'undefined' ? new LocalStorageAdapter() : new MemoryStorage()
  const heur = createHeuristics({ storage })
  // const [maxRenderCount, setMaxRenderCount] = useState<number>(300)
  // const [renderWindowStart, setRenderWindowStart] = useState<number>(0)

  const computeMaxRenderCount = useCallback(async () => {
    let cap = 300
    try {
      const state = await heur.load()
      const dm = state.signals.deviceMemoryGB
      if (typeof dm === 'number') {
        if (dm <= 1) cap = 150
        else if (dm <= 2) cap = 220
        else if (dm <= 4) cap = 300
        else cap = 420
      }
    } catch {}

    const perfMem: { jsHeapSizeLimit: number } | null = (typeof performance !== 'undefined' && (performance as unknown as { memory?: { jsHeapSizeLimit: number } }).memory) ? (performance as unknown as { memory: { jsHeapSizeLimit: number } }).memory : null
    if (perfMem && typeof perfMem.jsHeapSizeLimit === 'number') {
      const estimatedPerCard = 35 * 1024
      const budget = Math.floor(perfMem.jsHeapSizeLimit * 0.015)
      const capByHeap = Math.max(120, Math.floor(budget / estimatedPerCard))
      cap = Math.min(cap, capByHeap)
    }

    const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1
    if (dpr >= 3) cap = Math.floor(cap * 0.7)
    else if (dpr >= 2) cap = Math.floor(cap * 0.85)

    // cap = Math.max(120, Math.min(cap, 1500))
    // console.log('Setting maxRenderCount to:', cap);
    // setMaxRenderCount(cap)
    
    // Suppress unused variable warning - this function is called for side effects
    void cap
  }, [heur])

  useEffect(() => {
    computeMaxRenderCount()
    const onResize = () => { computeMaxRenderCount() }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [computeMaxRenderCount])

  // Removed updateRenderWindow - not needed for inner scroll only

  // Removed window scroll listener - not needed for inner scroll only

  // Initialize filteredPokemon with pokemonList on first load
  useEffect(() => {
    if (pokemonList.length > 0 && filteredPokemon.length === 0) {
      setFilteredPokemon(pokemonList)
    }
  }, [pokemonList, filteredPokemon.length])

  // Load initial Pokemon data when component mounts
  useEffect(() => {
    const loadInitialPokemon = async () => {
      // debug removed
      if (isAllGenerations && allGenerationsPokemon.length === 0) {
        
        try {
          const initialPokemon = await getPokemonWithPagination(100, 0);
          
          setAllGenerationsPokemon(initialPokemon);
          setCurrentOffset(100);
          
          // Fetch total count
          try {
            const count = await getPokemonTotalCount();
            
            setTotalPokemonCount(count || null);
          } catch (error) {
            
            setTotalPokemonCount(1302);
          }
        } catch (error) {
          
        }
      }
    };

    loadInitialPokemon();
  }, []); // Run only once on mount

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

      // Only close mobile menu on large screens, don't change density
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

  // Desktop: no separate menu; keep page scroll default
  useEffect(() => {
    // noop
  }, [])

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
        
        // Check if we need efficient filtering for weight/height/sorting
        const needsEfficientFiltering = advancedFilters.generation === 'all' && 
          (debouncedHeightRange[0] > 0 || debouncedHeightRange[1] < 20 || 
           debouncedWeightRange[0] > 0 || debouncedWeightRange[1] < 1000 ||
           sortBy !== 'id' || sortOrder !== 'asc')

        // If we have search results, use those as base
        if (searchResults.length > 0) {
          results = searchResults
        } else if (advancedFilters.generation && advancedFilters.generation !== 'all' && advancedFilters.generation !== '') {
          // Fetch by generation only if not "all" and not empty (All Generations)
          setIsAllGenerations(false)
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
          setIsAllGenerations(false)
          setHasMorePokemon(false) // Disable infinite scroll for type filters since we load all at once
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
        } else if (advancedFilters.generation === 'all') {
          // Check if legendary/mythical filters are active
          if (advancedFilters.legendary || advancedFilters.mythical) {
            // "All Generations" with legendary/mythical filters - efficient filtering approach
            setIsAllGenerations(false) // Override infinite scroll for this case
            setHasMorePokemon(false) // Disable infinite scroll for filtered results
            
            try {
              // Get total count first
              const totalCount = await getPokemonTotalCount();
              
              // Step 1: Fetch basic Pokémon list (without full data/images) to identify legendary/mythical
              const basicPokemonList = await getPokemonList(totalCount, 0);
              
              // Step 2: Filter for legendary/mythical Pokémon IDs
              const legendaryMythicalIds: number[] = [];
              basicPokemonList.results.forEach((pokemonRef: { name: string; url: string }) => {
                const pokemonId = parseInt(pokemonRef.url.split('/').slice(-2)[0]);
                const isLegendary = LEGENDARY_POKEMON.has(pokemonId);
                const isMythical = MYTHICAL_POKEMON.has(pokemonId);
                
                if (advancedFilters.legendary && advancedFilters.mythical) {
                  // When both filters are selected, show only Pokémon that are BOTH legendary AND mythical
                  if (isLegendary && isMythical) legendaryMythicalIds.push(pokemonId);
                } else if (advancedFilters.legendary && isLegendary) {
                  legendaryMythicalIds.push(pokemonId);
                } else if (advancedFilters.mythical && isMythical) {
                  legendaryMythicalIds.push(pokemonId);
                }
              });
              
              
              // Step 3: Fetch full data only for the filtered legendary/mythical Pokémon
              const legendaryMythicalPokemon = await Promise.all(
                legendaryMythicalIds.map(async (id) => {
                  try {
                    return await getPokemon(id);
                  } catch (error) {
                    
                    return null;
                  }
                })
              );
              
              // Filter out any failed fetches
              results = legendaryMythicalPokemon.filter(pokemon => pokemon !== null) as Pokemon[];
              
            } catch (error) {
              
              // Fallback to infinite scroll
              setIsAllGenerations(true)
              if (allGenerationsPokemon.length === 0) {
                const initialPokemon = await getPokemonWithPagination(100, 0)
                setAllGenerationsPokemon(initialPokemon)
                setCurrentOffset(100)
                results = initialPokemon
              } else {
                results = allGenerationsPokemon
              }
            }
          } else if (needsEfficientFiltering) {
            // "All Generations" with weight/height/sorting filters - efficient filtering approach
            setIsAllGenerations(false) // Override infinite scroll for this case
            setHasMorePokemon(false) // Disable infinite scroll for filtered results
            
            try {
              // Get total count first
              const totalCount = await getPokemonTotalCount();
              
              // Step 1: Fetch basic Pokémon list (without full data/images) to identify candidates
              const basicPokemonList = await getPokemonList(totalCount, 0);
              
              // Step 2: For weight/height filtering, we need full data, so fetch all Pokémon
              // For sorting, we also need full data
              const allPokemon: Pokemon[] = [];
              const batchSize = 50;
              let offset = 0;
              
              while (offset < totalCount) {
                const batch = await getPokemonWithPagination(batchSize, offset);
                if (batch.length === 0) break;
                allPokemon.push(...batch);
                offset += batchSize;
              }
              
              results = allPokemon;
              
            } catch (error) {
              
              // Fallback to infinite scroll
              setIsAllGenerations(true)
              setHasMorePokemon(true)
              if (allGenerationsPokemon.length === 0) {
                const initialPokemon = await getPokemonWithPagination(100, 0)
                setAllGenerationsPokemon(initialPokemon)
                setCurrentOffset(100)
                results = initialPokemon
              } else {
                results = allGenerationsPokemon
              }
            }
          } else {
            // "All Generations" without any special filters - use infinite scrolling
            setIsAllGenerations(true)
            setHasMorePokemon(true) // Ensure infinite scroll is enabled
            
            // Use existing allGenerationsPokemon or wait for it to be loaded by the separate effect
            if (allGenerationsPokemon.length > 0) {
              results = allGenerationsPokemon
            } else {
              // If no Pokemon loaded yet, return empty array and let the separate effect handle loading
              results = []
            }
          }
        } else {
          // No filters or default state - use base pokemon list
          results = pokemonList
          setIsAllGenerations(false)
        }

        // Enrich search results with full details so types are available
        try {
          const needEnrichment = results.filter(p => (p.types?.length || 0) === 0)
          if (needEnrichment.length > 0) {
            const toFetch = needEnrichment.slice(0, 50).map(p => p.id)
            const fetched = await Promise.allSettled(toFetch.map(id => getPokemon(id)))
            const byId = new Map<number, Pokemon>()
            fetched.forEach(res => {
              if (res.status === 'fulfilled' && res.value) byId.set(res.value.id, res.value)
            })
            if (byId.size > 0) {
              results = results.map(p => byId.get(p.id) || p)
            }
          }
        } catch {}

        // Apply height/weight filters only if we have detailed data
        const hasDetailedData = results.length > 0 && results[0].height > 0 && results[0].weight > 0;
        if (hasDetailedData) {
          // Height and weight filters using debounced values
          results = results.filter(pokemon => {
            const height = pokemon.height / 10
            const weight = pokemon.weight / 10
            return height >= debouncedHeightRange[0] && 
                   height <= debouncedHeightRange[1] &&
                   weight >= debouncedWeightRange[0] && 
                   weight <= debouncedWeightRange[1]
          })
        }

        // Legendary and Mythical filters - apply only if not already filtered at data level
        if ((advancedFilters.legendary || advancedFilters.mythical) && advancedFilters.generation !== 'all') {
          
          
          results = results.filter(pokemon => {
            const isLegendary = LEGENDARY_POKEMON.has(pokemon.id)
            const isMythical = MYTHICAL_POKEMON.has(pokemon.id)
            
            if (advancedFilters.legendary && advancedFilters.mythical) {
              // When both filters are selected, show only Pokémon that are BOTH legendary AND mythical
              return isLegendary && isMythical
            } else if (advancedFilters.legendary) {
              return isLegendary
            } else if (advancedFilters.mythical) {
              return isMythical
            }
            return true
          })
          
          
        }



        setFilteredPokemon(results)
      } catch (error) {
        
        setFilteredPokemon([])
        // Show a more user-friendly error message
        
      } finally {
        setIsFiltering(false)
      }
    }

    applyFilters()
  }, [searchResults, pokemonList, advancedFilters, allGenerationsPokemon, isAllGenerations, debouncedHeightRange, debouncedWeightRange, sortBy, sortOrder])

  // Handle allGenerationsPokemon updates separately to avoid infinite loops
  useEffect(() => {
    if (allGenerationsPokemon.length > 0) {
      
      setFilteredPokemon(allGenerationsPokemon)
    }
  }, [allGenerationsPokemon])

  // Ensure full stats are available when sorting by stats in Modern
  useEffect(() => {
    const statKeys = new Set(['hp','attack','defense','special-attack','special-defense','speed','stats'])
    if (!statKeys.has(sortBy)) return
    const source = filteredPokemon.length ? filteredPokemon : pokemonList
    const missing = source
      .filter(p => (p.stats?.length || 0) === 0 && !detailsCache.has(p.id))
      .map(p => p.id)
      .filter(id => !(fetchingRef.current as Set<number>).has(id))
    if (missing.length === 0) return
    missing.forEach(id => (fetchingRef.current as Set<number>).add(id))
    Promise.all(missing.map(id => getPokemon(id).catch(() => null)))
      .then(results => {
        setDetailsCache(prev => {
          const next = new Map(prev)
          results.forEach(p => { if (p) next.set(p.id, p) })
          return next
        })
      })
      .finally(() => {
        missing.forEach(id => (fetchingRef.current as Set<number>).delete(id))
      })
  }, [sortBy, filteredPokemon, pokemonList, detailsCache])

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
        
        // Fallback to only available Pokémon
        const availableComparison = filteredPokemon.filter(p => comparisonList.includes(p.id))
        setComparisonPokemon(availableComparison)
      }
    }

    fetchComparisonPokemon()
  }, [comparisonList, filteredPokemon, pokemonList])

  // Sort filtered results (uses cached details when needed)
  const sortedPokemon = useMemo(() => {
    const withSource = (p: Pokemon) => (p.stats?.length ? p : (detailsCache.get(p.id) || p))
    return [...filteredPokemon].sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'stats':
          const aStats = (withSource(a).stats || []).reduce((sum, stat) => sum + stat.base_stat, 0)
          const bStats = (withSource(b).stats || []).reduce((sum, stat) => sum + stat.base_stat, 0)
          comparison = aStats - bStats
          break
        case 'hp':
          comparison = ((withSource(a).stats || []).find(s => s.stat.name === 'hp')?.base_stat || 0) - ((withSource(b).stats || []).find(s => s.stat.name === 'hp')?.base_stat || 0)
          break
        case 'attack':
          comparison = ((withSource(a).stats || []).find(s => s.stat.name === 'attack')?.base_stat || 0) - ((withSource(b).stats || []).find(s => s.stat.name === 'attack')?.base_stat || 0)
          break
        case 'defense':
          comparison = ((withSource(a).stats || []).find(s => s.stat.name === 'defense')?.base_stat || 0) - ((withSource(b).stats || []).find(s => s.stat.name === 'defense')?.base_stat || 0)
          break
        case 'special-attack':
          comparison = ((withSource(a).stats || []).find(s => s.stat.name === 'special-attack')?.base_stat || 0) - ((withSource(b).stats || []).find(s => s.stat.name === 'special-attack')?.base_stat || 0)
          break
        case 'special-defense':
          comparison = ((withSource(a).stats || []).find(s => s.stat.name === 'special-defense')?.base_stat || 0) - ((withSource(b).stats || []).find(s => s.stat.name === 'special-defense')?.base_stat || 0)
          break
        case 'speed':
          comparison = ((withSource(a).stats || []).find(s => s.stat.name === 'speed')?.base_stat || 0) - ((withSource(b).stats || []).find(s => s.stat.name === 'speed')?.base_stat || 0)
          break
        default:
          comparison = a.id - b.id
      }
      
      return sortOrder === 'desc' ? -comparison : comparison
    })
  }, [filteredPokemon, sortBy, sortOrder, detailsCache])

  // Load more Pokémon for infinite scrolling with improved error handling
  const loadMorePokemon = useCallback(async () => {
    if (isLoadingMore || !hasMorePokemon) {
      
      return;
    }
    
    
    
    // Protection against rapid calls
    const now = Date.now();
    if (now - lastLoadTimeRef.current < 500) {
      return;
    }
    lastLoadTimeRef.current = now;
    
    
    setIsLoadingMore(true);
    
    try {
      const pageSize = 100;
      let newPokemon: Pokemon[] = [];
      
      // Handle different loading strategies based on current filter state
      if (isAllGenerations && advancedFilters.types.length === 0) {
        // Standard pagination for "All Generations" mode without type filters
        newPokemon = await getPokemonWithPagination(pageSize, currentOffset);
      } else if (advancedFilters.types.length > 0) {
        // For type filters, we need to load more Pokemon of that type
        // Since type filtering loads all Pokemon of that type at once, we don't need pagination
        // Just return empty to indicate no more Pokemon
        newPokemon = [];
      } else {
        // For other filters (generation, legendary, etc.), use standard pagination
        newPokemon = await getPokemonWithPagination(pageSize, currentOffset);
      }
      
      if (newPokemon.length === 0) {
        // Handle empty batch with retry logic
        const total = totalPokemonCount ?? 0;
        console.log(`⚠️ Empty batch received: currentOffset=${currentOffset}, total=${total}, retryCount=${emptyBatchCountRef.current}`);
        
        if (total && currentOffset < total && emptyBatchCountRef.current < 3) {
          emptyBatchCountRef.current += 1;
          setCurrentOffset(prev => prev + pageSize);
          setIsLoadingMore(false);
          // Retry with exponential backoff
          setTimeout(() => loadMorePokemon(), Math.pow(2, emptyBatchCountRef.current) * 100);
          return;
        }
        
        // If we've tried multiple times and still get empty batches, but we're not at the expected limit,
        // try loading a larger batch to see if there are more Pokémon
        if (emptyBatchCountRef.current >= 3 && currentOffset < 1000) {
          console.log('🔄 Trying larger batch size to find more Pokémon...');
          emptyBatchCountRef.current = 0; // Reset retry count
          const largerBatch = await getPokemonWithPagination(150, currentOffset); // Try larger batch
          if (largerBatch.length > 0) {
            console.log(`✅ Found ${largerBatch.length} Pokémon with larger batch`);
            setAllGenerationsPokemon(prev => [...prev, ...largerBatch]);
            setCurrentOffset(prev => prev + 150);
            setIsLoadingMore(false);
            return;
          }
        }
        
        console.log('🛑 No more Pokémon available, stopping infinite scroll');
        setHasMorePokemon(false);
      } else {
        emptyBatchCountRef.current = 0;
        
        // Deduplicate and add new Pokémon
        setAllGenerationsPokemon(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNewPokemon = newPokemon.filter(p => !existingIds.has(p.id));
          
          if (uniqueNewPokemon.length === 0) {
            return prev;
          }
          
          return [...prev, ...uniqueNewPokemon];
        });
        
        const newOffset = currentOffset + pageSize;
        setCurrentOffset(newOffset);
        
        // Check if we've reached the limit
        // Use a more reasonable limit based on actual Pokemon count
        const maxPokemonCount = totalPokemonCount || 1302; // Fallback to known total
        console.log(`📊 Checking limit: newOffset=${newOffset}, maxPokemonCount=${maxPokemonCount}, hasMorePokemon=${hasMorePokemon}`);
        
        if (newOffset >= maxPokemonCount) {
          console.log('🛑 Reached Pokémon limit, stopping infinite scroll');
          setHasMorePokemon(false);
        } else {
          console.log('✅ More Pokémon available, continuing infinite scroll');
        }
      }
    } catch (error) {
      
      
      // Retry on error with exponential backoff
      if (emptyBatchCountRef.current < 3) {
        emptyBatchCountRef.current += 1;
        setIsLoadingMore(false);
        setTimeout(() => loadMorePokemon(), Math.pow(2, emptyBatchCountRef.current) * 1000);
        return;
      }
      
      // If all retries failed, stop trying
      setHasMorePokemon(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMorePokemon, currentOffset, totalPokemonCount]);

  // Improved infinite scroll effect using Intersection Observer
  useEffect(() => {
    if (isLoadingMore || !hasMorePokemon) {
      return;
    }

    // Define setupObserver function first
    const setupObserver = (sentinelElement: Element) => {

      // Create intersection observer with better configuration
      const observer = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          
          console.log('🔍 Intersection observer triggered:', {
            isIntersecting: entry.isIntersecting,
            isLoadingMore,
            hasMorePokemon,
            currentOffset,
            totalPokemonCount
          });
          
          if (entry.isIntersecting && !isLoadingMore && hasMorePokemon) {
            console.log('🚀 Loading more Pokémon...');
            loadMorePokemon();
          }
        },
        {
          root: null, // Use viewport as root for better reliability
          rootMargin: '200px', // Increased margin for better detection
          threshold: 0.01 // Lower threshold for more sensitive detection
        }
      );

      observer.observe(sentinelElement);

      return () => {
        observer.disconnect();
      };
    };

    // Find the sentinel element with retry mechanism
    const findSentinel = () => {
      const sentinel = document.querySelector('[data-infinite-scroll-sentinel="true"]');
      
      return sentinel;
    };


    let sentinel = findSentinel();
    if (!sentinel) {
      
      // Retry finding sentinel after a short delay
      const retryTimeout = setTimeout(() => {
        sentinel = findSentinel();
        if (sentinel) {
          
          setupObserver(sentinel);
        } else {
          
        }
      }, 100);
      
      return () => clearTimeout(retryTimeout);
    } else {
      
    }

    // Set up scroll-based backup detection (less aggressive)
    const mainContentArea = document.querySelector('.flex-1.min-h-0.overflow-y-auto');
    let scrollTimeout: NodeJS.Timeout;
    
    const handleScrollBackup = () => {
      if (!mainContentArea || isLoadingMore || !hasMorePokemon) return;
      
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const { scrollTop, scrollHeight, clientHeight } = mainContentArea;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
        
        // Trigger loading when within 200px of bottom (reduced from 500px)
        if (distanceFromBottom < 200) {
          
          loadMorePokemon();
        }
      }, 150); // Increased debounce time
    };

    if (mainContentArea) {
      mainContentArea.addEventListener('scroll', handleScrollBackup, { passive: true });
    }

    const cleanup = setupObserver(sentinel);

    return () => {
      cleanup?.();
      if (mainContentArea) {
      mainContentArea.removeEventListener('scroll', handleScrollBackup);
      }
      clearTimeout(scrollTimeout);
    };
  }, [isLoadingMore, hasMorePokemon, loadMorePokemon, currentOffset])

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setAdvancedFilters({
      types: [],
      generation: 'all', // Reset to "All Generations" to maintain infinite scroll
      habitat: '',
      heightRange: [0, 20],
      weightRange: [0, 1000],
      legendary: false,
      mythical: false
    })
    // Reset debounced values
    setDebouncedHeightRange([0, 20])
    setDebouncedWeightRange([0, 1000])
    // Reset sorting
    setSortBy('id')
    setSortOrder('asc')
    setFilteredPokemon(pokemonList)
    clearSearch()
    // Reset infinite scrolling state
    setAllGenerationsPokemon([])
    setCurrentOffset(0)
    setHasMorePokemon(true)
    setIsAllGenerations(false)
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


  // Auth modal handlers
  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode)
    setShowAuthModal(true)
  }

  const closeAuthModal = () => {
    setShowAuthModal(false)
  }


  return (
    <div className="h-screen root-full w-full max-w-full bg-bg text-text flex flex-col mx-auto">
      {/* Unified App Header (desktop style across breakpoints) */}
      <AppHeader
        title="PokéDex"
        subtitle={`${pokemonList.length} Pokémon discovered`}
        comparisonList={comparisonList}
        showSidebar={showSidebar}
        onToggleSidebar={() => setShowSidebar(!showSidebar)}
        showToolbar={true}
        iconKey="pokedex"
        showIcon={true}
      />

      {/* Old header temporarily disabled */}
      {false && (
      <header className="sticky top-0 z-50 bg-gradient-to-r from-surface via-surface to-surface border-b border-border shadow-lg">
        <div className="w-full max-w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 lg:h-24 py-3 list-none min-w-0">
            <div className="flex items-center space-x-3 lg:space-x-6">
              <div className="absolute left-4 top-3 lg:top-4 z-10">
                <h1 className="font-['Pocket_Monk'] text-2xl lg:text-3xl font-bold text-poke-blue tracking-wider drop-shadow-lg">
                  POKÉDEX
                </h1>
              </div>
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
            <div className="hidden lg:flex flex-1 max-w-md mx-4">
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
                    className="w-full pl-10 pr-4 py-2 bg-transparent text-text placeholder:text-muted/60 focus:outline-none text-sm font-medium"
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
              <div className="ml-2 flex items-center space-x-1">
                <div className={`w-1.5 h-1.5 rounded-full ${isFiltering ? 'bg-poke-yellow animate-pulse' : 'bg-green-500'}`}></div>
                <span className="text-xs text-muted font-medium whitespace-nowrap">
                  {isFiltering ? 'Filtering...' : ''}
                </span>
                {(advancedFilters.types.length > 0 || searchTerm || (advancedFilters.generation && advancedFilters.generation !== '') || advancedFilters.legendary || advancedFilters.mythical) && (
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

            {/* Enhanced Desktop Controls Section - Hidden on mobile */}
            {!isMobile && (
              <div className="flex items-center space-x-6 min-w-0 flex-shrink-0">
              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Quick Type Filters - Desktop */}
              <div className="hidden xl:flex items-center space-x-2">
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


              {/* Theme Toggle */}
              <div className="hidden md:flex items-center">
                <ThemeToggle />
              </div>

              {/* Profile Picture Button (desktop) */}
              <div className="hidden md:flex items-center space-x-2">
                <UserDropdown />
              </div>

              {/* Action Buttons - PokéDex Toolbar Style */}
              <div className="pk-toolbar">
                <HeaderIcons 
                  comparisonList={comparisonList}
                  showSidebar={showSidebar}
                  onFiltersClick={() => setShowSidebar(!showSidebar)}
                />
              </div>

            </div>
            )}

            {/* Mobile Toolbar - All buttons distributed across available space */}
            {isMobile && (
              <div className="pk-toolbar flex-1 justify-between">
                <HeaderIcons 
                  comparisonList={comparisonList}
                  showSidebar={showSidebar}
                  onFiltersClick={() => setShowSidebar(!showSidebar)}
                />
                <HamburgerMenu onClick={() => setShowMobileMenu(!showMobileMenu)} />
                <UserDropdown isMobile={true} />
              </div>
            )}

            {/* Mobile Menu Button removed - now part of desktop controls */}
          </div>
        </div>
      </header>
      )}

      {/* Fallback marker removed; no desktop drawer */}

      {/* Mobile Menu Overlay - Only on small screens */}
      {showMobileMenu && isMobile && (
        <div id="mobile-drawer" className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          {/* Backdrop - click to close */}
          <div 
            className="absolute inset-0"
            onClick={() => setShowMobileMenu(false)}
          />
          <div
            className="mobile-menu fixed right-0 top-0 h-full w-80 max-w-[85vw] bg-bg border-l border-border shadow-2xl animate-in slide-in-from-right duration-300"
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
                  {(advancedFilters.types.length > 0 || searchTerm || (advancedFilters.generation && advancedFilters.generation !== '') || advancedFilters.legendary || advancedFilters.mythical) && (
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

              {/* Mobile Filter Toggle removed to avoid overlap/bleed on desktop */}


              {/* Mobile Comparison Section */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <button
                    onClick={() => { if (comparisonList.length > 0) { router.push('/compare'); setShowMobileMenu(false) } }}
                    disabled={comparisonList.length === 0}
                    className={`w-full p-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${comparisonList.length === 0 ? 'bg-poke-blue/40 text-white/80 cursor-not-allowed' : 'bg-poke-blue text-white hover:bg-poke-blue/80'}`}
                    aria-disabled={comparisonList.length === 0}
                  >
                    <Image 
                      src="/header-icons/compare.png" 
                      alt="Compare" 
                      width={20} 
                      height={20} 
                      className="h-5 w-5"
                    />
                    <span>Go to Comparison</span>
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

              {/* Mobile Team Builder Section */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-text uppercase tracking-wider">Team Builder</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      router.push('/team')
                      setShowMobileMenu(false)
                    }}
                    className="w-full p-3 rounded-xl bg-poke-red text-white font-medium transition-all duration-200 hover:bg-poke-red/80 flex items-center justify-center space-x-2"
                  >
                    <Image 
                      src="/header-icons/team_builder.png" 
                      alt="Team Builder" 
                      width={20} 
                      height={20} 
                      className="h-5 w-5"
                    />
                    <span>Go to Team Builder</span>
                  </button>
                </div>
              </div>

              {/* Mobile Battle Section */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-text uppercase tracking-wider">AI Battle</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      router.push('/battle')
                      setShowMobileMenu(false)
                    }}
                    className="w-full p-3 rounded-xl bg-poke-blue text-white font-medium transition-all duration-200 hover:bg-poke-blue/80 flex items-center justify-center space-x-2"
                  >
                    <Image 
                      src="/header-icons/battle.png" 
                      alt="Battle" 
                      width={20} 
                      height={20} 
                      className="h-5 w-5"
                    />
                    <span>Go to AI Battle</span>
                  </button>
                </div>
              </div>

              {/* Mobile Theme Toggle */}
              <div className="space-y-3">
                <ThemeToggle />
              </div>

              {/* Mobile User Profile */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-text uppercase tracking-wider">Account</h4>
                <UserDropdown />
              </div>

              {/* Test Auth Buttons - Always visible for testing */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-text uppercase tracking-wider">Test Auth Dialog</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      openAuthModal('login')
                      setShowMobileMenu(false)
                    }}
                    className="w-full p-3 rounded-xl bg-poke-blue text-white font-medium transition-all duration-200 hover:bg-poke-blue/80 flex items-center justify-center space-x-2"
                  >
                    <span>Test Sign In Dialog</span>
                  </button>
                  <button
                    onClick={() => {
                      openAuthModal('register')
                      setShowMobileMenu(false)
                    }}
                    className="w-full p-3 rounded-xl bg-poke-red text-white font-medium transition-all duration-200 hover:bg-poke-red/80 flex items-center justify-center space-x-2"
                  >
                    <span>Test Sign Up Dialog</span>
                  </button>
                </div>
              </div>

              {/* Mobile Auth Buttons - Only show if not logged in */}
              {!user && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-text uppercase tracking-wider">Authentication</h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        openAuthModal('login')
                        setShowMobileMenu(false)
                      }}
                      className="w-full p-3 rounded-xl bg-poke-blue text-white font-medium transition-all duration-200 hover:bg-poke-blue/80 flex items-center justify-center space-x-2"
                    >
                      <span>Sign In</span>
                    </button>
                    <button
                      onClick={() => {
                        openAuthModal('register')
                        setShowMobileMenu(false)
                      }}
                      className="w-full p-3 rounded-xl bg-poke-red text-white font-medium transition-all duration-200 hover:bg-poke-red/80 flex items-center justify-center space-x-2"
                    >
                      <span>Sign Up</span>
                    </button>
                  </div>
                </div>
              )}

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

      {/* Desktop Menu Drawer disabled: header has inline controls */}

      {/* Search Bar - Visible on all viewports */}
      <div className="border-b border-border bg-surface">
        <div className="w-full px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text pointer-events-none z-10" />
            <input
              type="text"
              placeholder="Search Pokémon..."
              value={searchTerm}
              onChange={(e) => {
                handleSearchChange(e.target.value)
              }}
              className="w-full pl-11 pr-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-poke-blue focus:border-poke-blue focus:outline-none transition-all duration-200"
              style={{ 
                backgroundColor: 'var(--color-input-bg)', 
                color: 'var(--color-input-text)',
                paddingLeft: '2.75rem !important'
              }}
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
      </div>

      {/* Enhanced Type Filter Ribbon */}
      <div className="border-b border-border bg-gradient-to-r from-surface via-surface to-surface">
        <div className="w-full max-w-full pl-0 pr-4 sm:pl-0 sm:pr-6 lg:pl-0 lg:pr-8 py-4">
          <div className="flex items-center justify-between">
            {/* Type Filter Buttons */}
            <div className="flex items-center space-x-3 overflow-x-auto scrollbar-hide pb-2">
              {Object.keys(typeColors).map(type => (
                <button
                  key={type}
                  onClick={() => toggleTypeFilter(type)}
                  className={`px-1.5 py-1.5 rounded-xl text-sm font-semibold border-2 transition-all duration-300 whitespace-nowrap shadow-sm hover:shadow-md transform hover:scale-105 ${
                    advancedFilters.types.includes(type) 
                      ? 'border-white shadow-lg scale-105' 
                      : 'border-transparent opacity-60 hover:opacity-80'
                  }`}
                  style={{
                    backgroundColor: `var(--type-${type})`,
                    color: typeColors[type].text === 'text-white' ? 'white' : 'black',
                    padding: '6px 6px'
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
                    {isFiltering ? 'Filtering...' : ''}
                  </span>
                </div>
                
                {(advancedFilters.types.length > 0 || searchTerm || (advancedFilters.generation && advancedFilters.generation !== '') || advancedFilters.legendary || advancedFilters.mythical) && (
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

      {/* Size & Sort Controls - Visible on all viewports */}
      <div className="border-b border-border bg-surface/60">
        <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-row items-center justify-between gap-4">
            {/* Card Density Controls */}
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-muted uppercase tracking-wider">Size</span>
              <div className="flex items-center bg-surface rounded-xl p-1 shadow-sm">
                {[
                  { visual: '3cols', label: '3 Cols', target: '3cols' },
                  { visual: '6cols', label: '6 Cols', target: '6cols' },
                  { visual: '9cols', label: '9 Cols', target: '9cols' },
                  { visual: 'list', label: 'List', target: 'list' }
                ].map(({ visual, label, target }) => (
                  <button
                    key={visual}
                    onClick={() => setCardDensity(target as '3cols' | '6cols' | '9cols' | 'list')}
                    className={`px-2 py-2 text-xs font-medium rounded-full transition-all duration-200 flex items-center space-x-1 ${
                      cardDensity === target 
                        ? 'bg-poke-blue text-white shadow-lg scale-105' 
                        : 'text-muted hover:text-text hover:bg-white/50'
                    }`}
                    style={{ borderRadius: '9999px', padding: '8px 8px' }}
                  >
                    <span className="inline-flex items-center justify-center">
                      {visual === '3cols' && (
                        <LayoutGridIcon className="w-3 h-3" />
                      )}
                      {visual === '6cols' && (
                        <Grid2X2 className="w-3 h-3" />
                      )}
                      {visual === '9cols' && (
                        <Grid3X3 className="w-3 h-3" />
                      )}
                      {visual === 'list' && (
                        <List className="w-3 h-3" />
                      )}
                    </span>
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Controls */}
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-muted uppercase tracking-wider">Sort</span>
              <div className="flex items-center space-x-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="px-3 py-2 border border-border rounded-xl text-sm font-medium focus:ring-2 focus:ring-poke-blue focus:border-poke-blue focus:outline-none transition-all duration-200 shadow-sm hover:shadow-md control-keep"
                  style={{ backgroundColor: 'var(--color-input-bg)', color: 'var(--color-input-text)' }}
                >
                  <option value="id">Number</option>
                  <option value="name">Name</option>
                  <option value="stats">Total Stats</option>
                  <option value="hp">HP</option>
                  <option value="attack">Attack</option>
                  <option value="defense">Defense</option>
                  <option value="special-attack">Sp. Attack</option>
                  <option value="special-defense">Sp. Defense</option>
                  <option value="speed">Speed</option>
                </select>
                <button
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="flex items-center gap-1 px-2 py-2 rounded-full bg-surface border border-border hover:bg-white/50 hover:border-poke-blue/30 transition-all duration-200 shadow-sm hover:shadow-md group control-keep"
                  style={{ borderRadius: '9999px', padding: '8px 8px' }}
                  title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                >
                  <div className={`transform transition-transform duration-200 ${sortOrder === 'asc' ? 'rotate-0' : 'rotate-180'}`}>
                    <svg className="w-3 h-3 text-muted group-hover:text-poke-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-muted group-hover:text-poke-blue">{sortOrder === 'asc' ? 'ASC' : 'DESC'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex w-full max-w-full flex-1 min-h-0 overflow-x-hidden pl-0 pr-0 sm:pl-0 sm:pr-0 lg:pl-0 lg:pr-0 gap-0">
        {/* Advanced Filters Component */}
        <AdvancedFilters
          advancedFilters={advancedFilters}
          setAdvancedFilters={setAdvancedFilters}
          showSidebar={showSidebar}
          setShowSidebar={setShowSidebar}
          comparisonList={comparisonList}
          comparisonPokemon={comparisonPokemon}
          onToggleComparison={onToggleComparison}
          onClearComparison={onClearComparison}
          onGoToComparison={() => window.location.href = '/compare'}
        />

        {/* Main Content Area */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scroll-stable scrollbar-hide">
          <div className={`${showSidebar ? 'pl-0 pr-0' : 'pl-0 pr-4 sm:pl-0 sm:pr-6 lg:pl-0 lg:pr-8'} min-h-full w-full max-w-full`}>
            {/* Pokémon Grid */}
            
            {isFiltering ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-poke-blue mx-auto mb-4"></div>
                <p className="text-muted">Loading Pokémon...</p>
              </div>
            ) : sortedPokemon.length > 0 ? (
              <>
                {cardDensity === 'list' ? (
                  <PokedexListView
                    pokemonList={sortedPokemon}
                    onToggleComparison={onToggleComparison}
                    onSelectPokemon={undefined}
                    comparisonList={comparisonList}
                    isLoadingMore={isLoadingMore}
                    hasMorePokemon={hasMorePokemon}
                    onLoadMore={loadMorePokemon}
                  />
                ) : (
                  <VirtualizedPokemonGrid
                    pokemonList={sortedPokemon}
                    onToggleComparison={onToggleComparison}
                    onSelectPokemon={undefined}
                    selectedPokemon={null}
                    comparisonList={comparisonList}
                    density={cardDensity}
                    enableVirtualization={false}
                    showSpecialForms={isAllGenerations || (advancedFilters.generation !== 'all' && advancedFilters.generation !== '')}
                  />
                )}
                
                {/* Infinite scroll loading indicator - only for grid view */}
                {cardDensity !== 'list' && isAllGenerations && isLoadingMore && (
                  <div className="text-center py-4">
                    <Image src="/loading.gif" alt="Loading more Pokémon" width={50} height={50} className="mx-auto mb-2" />
                    <p className="text-muted text-sm">Loading more Pokémon...</p>
                  </div>
                )}
                
                {/* Manual load more button - only show on API error */}
                {isAllGenerations && hasMorePokemon && !isLoadingMore && emptyBatchCountRef.current > 0 && (
                  <div className="text-center py-8">
                    <button
                      onClick={loadMorePokemon}
                      className="px-6 py-3 bg-poke-red text-white rounded-lg hover:bg-poke-red/90 transition-colors font-medium"
                    >
                      Retry Loading Pokémon
                    </button>
                    <p className="text-muted text-sm mt-2">There was an error loading more Pokémon. Click to retry.</p>
                  </div>
                )}
                
                {/* End of list indicator - only for grid view */}
                {cardDensity !== 'list' && isAllGenerations && !hasMorePokemon && !isLoadingMore && (
                  <div className="text-center py-4">
                    <p className="text-muted text-sm">You&apos;ve reached the end! All Pokémon loaded.</p>
                  </div>
                )}
              </>
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

      {/* Mobile Filter Overlay - Now handled by AdvancedFilters component */}
      {false && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-50" onClick={() => setShowSidebar(false)}>
          <div className="absolute right-0 top-0 h-full w-80 bg-surface" onClick={e => e.stopPropagation()}>
            <div className="h-full flex flex-col">
              {/* Mobile Header - Fixed */}
              <div className="flex-shrink-0 p-6 border-b border-border bg-surface">
             
                
              </div>
              
              {/* Mobile Scrollable Content */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6 min-h-0" style={{maxHeight: 'calc(100vh - 20rem)'}}>
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
                    <option value="all">All Generations</option>
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

                {/* Legendary and Mythical Filters - Mobile */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium">Special Categories</label>
                  <div className="space-y-2">
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
                        className="w-4 h-4 text-poke-blue bg-surface border-border rounded focus:ring-poke-blue focus:ring-2"
                      />
                      <span className="text-sm text-text">Legendary Pokémon</span>
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
                        className="w-4 h-4 text-poke-blue bg-surface border-border rounded focus:ring-poke-blue focus:ring-2"
                      />
                      <span className="text-sm text-text">Mythical Pokémon</span>
                    </label>
                  </div>
                </div>

              </div>
              
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={closeAuthModal}
        initialMode={authModalMode}
      />

    </div>
  )
}
