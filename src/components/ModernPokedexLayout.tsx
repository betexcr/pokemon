'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Pokemon, FilterState } from '@/types/pokemon'
import { formatPokemonName, typeColors } from '@/lib/utils'
import { useSearch } from '@/hooks/useSearch'
import { useRouter } from 'next/navigation'
import { getPokemonByGeneration, getPokemonByType, getPokemon, getPokemonWithPagination, getPokemonTotalCount, getPokemonList } from '@/lib/api'
import ThemeToggle from './ThemeToggle'
import VirtualizedPokemonGrid from './VirtualizedPokemonGrid'
import PokedexListView from './PokedexListView'
import AdvancedFilters from './AdvancedFilters'
import { useViewportDataLoading } from '@/hooks/useViewportDataLoading'
import { Search, X, List, Grid3X3, Grid2X2, LayoutGridIcon, ChevronUp, ChevronDown } from 'lucide-react'
import UserDropdown from './UserDropdown'
import AuthModal from './auth/AuthModal'
import { useAuth } from '@/contexts/AuthContext'
import { createHeuristics } from '@/lib/heuristics/core'
import { LocalStorageAdapter, MemoryStorage } from '@/lib/heuristics/storage'
import Image from 'next/image'
import HeaderIcons, { HamburgerMenu } from '@/components/HeaderIcons'
import AppHeader from '@/components/AppHeader'
import Tooltip from '@/components/Tooltip'
import SearchInput from '@/components/SearchInput'

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
  onToggleComparison: (id: number, setShowSidebar?: (show: boolean) => void) => void
  onClearComparison: () => void
  comparisonList: number[]
  filters: FilterState
  setFilters: (filters: FilterState) => void
  // Viewport loading functions
  getPokemonWithData?: (pokemon: Pokemon) => Pokemon
  isPokemonLoaded?: (pokemonId: number) => boolean
  isPokemonLoading?: (pokemonId: number) => boolean
  loadedCount?: number
  totalCount?: number
  // Infinite scroll props
  hasMorePokemon?: boolean
  isLoadingMore?: boolean
  loadMorePokemon?: () => void
  sentinelRef?: (node: HTMLDivElement | null) => void
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
  // setFilters: _setFilters,
  // Viewport loading functions
  getPokemonWithData,
  isPokemonLoaded,
  isPokemonLoading,
  loadedCount,
  totalCount,
  // Infinite scroll props
  hasMorePokemon: externalHasMorePokemon,
  isLoadingMore: externalIsLoadingMore,
  loadMorePokemon: externalLoadMorePokemon,
  sentinelRef: externalSentinelRef
}: ModernPokedexLayoutProps) {
  // console debug removed
  const router = useRouter()
  const { user } = useAuth()
  
  // Scroll position persistence
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const SCROLL_POSITION_KEY = 'pokedex.scrollPosition'
  
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
  
  const [showSidebar, setShowSidebar] = useState(false) // Always start with false to match server
  const [isHydrated, setIsHydrated] = useState(false)
  const [sortBy, setSortBy] = useState<'id' | 'name' | 'stats' | 'hp' | 'attack' | 'defense' | 'special-attack' | 'special-defense' | 'speed'>('id')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [cardDensity, setCardDensity] = useState<'3cols' | '6cols' | '9cols' | 'list'>('6cols')

  // Hydration effect - load client-side state after hydration
  useEffect(() => {
    setIsHydrated(true)
    
    // Load sidebar state from localStorage after hydration
    try {
      if (typeof window !== 'undefined') {
        const savedShowSidebar = localStorage.getItem('pokedex.showSidebar')
        if (savedShowSidebar !== null) {
          setShowSidebar(savedShowSidebar === 'true')
        }
      }
    } catch (error) {
      console.error('Error loading sidebar state from localStorage:', error)
    }
  }, [])

  // Load advanced filters from localStorage on mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const savedFilters = localStorage.getItem('pokedex.advancedFilters')
        if (savedFilters) {
          const parsedFilters = JSON.parse(savedFilters) as AdvancedFilters
          // Validate the parsed filters to ensure they have the expected structure
          if (parsedFilters && typeof parsedFilters === 'object') {
            setAdvancedFilters({
              types: Array.isArray(parsedFilters.types) ? parsedFilters.types : [],
              generation: typeof parsedFilters.generation === 'string' ? parsedFilters.generation : 'all',
              habitat: typeof parsedFilters.habitat === 'string' ? parsedFilters.habitat : '',
              heightRange: Array.isArray(parsedFilters.heightRange) && parsedFilters.heightRange.length === 2 
                ? parsedFilters.heightRange as [number, number] 
                : [0, 20],
              weightRange: Array.isArray(parsedFilters.weightRange) && parsedFilters.weightRange.length === 2 
                ? parsedFilters.weightRange as [number, number] 
                : [0, 1000],
              legendary: typeof parsedFilters.legendary === 'boolean' ? parsedFilters.legendary : false,
              mythical: typeof parsedFilters.mythical === 'boolean' ? parsedFilters.mythical : false
            })
          }
        }
      }
    } catch (error) {
      console.error('Error loading advanced filters from localStorage:', error)
    }
  }, [])

  // Save advanced filters to localStorage whenever they change
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('pokedex.advancedFilters', JSON.stringify(advancedFilters))
      }
    } catch (error) {
      console.error('Error saving advanced filters to localStorage:', error)
    }
  }, [advancedFilters])

  // Load sort options and card density from localStorage on mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const savedSortBy = localStorage.getItem('pokedex.sortBy')
        const savedSortOrder = localStorage.getItem('pokedex.sortOrder')
        const savedCardDensity = localStorage.getItem('pokedex.cardDensity')
        
        if (savedSortBy && ['id', 'name', 'stats', 'hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'].includes(savedSortBy)) {
          setSortBy(savedSortBy as typeof sortBy)
        }
        
        if (savedSortOrder && ['asc', 'desc'].includes(savedSortOrder)) {
          setSortOrder(savedSortOrder as typeof sortOrder)
        }
        
        if (savedCardDensity && ['3cols', '6cols', '9cols', 'list'].includes(savedCardDensity)) {
          setCardDensity(savedCardDensity as typeof cardDensity)
        }
      }
    } catch (error) {
      console.error('Error loading sort options from localStorage:', error)
    }
  }, [])

  // Save sort options and card density to localStorage whenever they change
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('pokedex.sortBy', sortBy)
        localStorage.setItem('pokedex.sortOrder', sortOrder)
        localStorage.setItem('pokedex.cardDensity', cardDensity)
      }
    } catch (error) {
      console.error('Error saving sort options to localStorage:', error)
    }
  }, [sortBy, sortOrder, cardDensity])


  // Save sidebar state to localStorage whenever it changes (only after hydration)
  useEffect(() => {
    if (!isHydrated) return // Don't save during initial render
    
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('pokedex.showSidebar', String(showSidebar))
      }
    } catch (error) {
      console.error('Error saving sidebar state to localStorage:', error)
    }
  }, [showSidebar, isHydrated])
  
  // Load scroll position from sessionStorage on mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const savedScrollPosition = sessionStorage.getItem(SCROLL_POSITION_KEY)
        if (savedScrollPosition && scrollContainerRef.current) {
          const scrollTop = parseInt(savedScrollPosition, 10)
          // Use requestAnimationFrame to ensure DOM is ready
          requestAnimationFrame(() => {
            if (scrollContainerRef.current) {
              scrollContainerRef.current.scrollTop = scrollTop
            }
          })
        }
      }
    } catch (error) {
      console.error('Error loading scroll position from sessionStorage:', error)
    }
  }, [])
  
  // Save scroll position to sessionStorage when scrolling
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return
    
    const handleScroll = () => {
      try {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(SCROLL_POSITION_KEY, scrollContainer.scrollTop.toString())
        }
      } catch (error) {
        console.error('Error saving scroll position to sessionStorage:', error)
      }
    }
    
    // Throttle scroll events for better performance
    let timeoutId: NodeJS.Timeout
    const throttledHandleScroll = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(handleScroll, 100)
    }
    
    scrollContainer.addEventListener('scroll', throttledHandleScroll)
    
    return () => {
      scrollContainer.removeEventListener('scroll', throttledHandleScroll)
      clearTimeout(timeoutId)
    }
  }, [])
  
  // Save scroll position when navigating away from the page
  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        if (scrollContainerRef.current && typeof window !== 'undefined') {
          sessionStorage.setItem(SCROLL_POSITION_KEY, scrollContainerRef.current.scrollTop.toString())
        }
      } catch (error) {
        console.error('Error saving scroll position on beforeunload:', error)
      }
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])
  
  // Debounced filter values for weight and height
  const [debouncedHeightRange, setDebouncedHeightRange] = useState<[number, number]>([0, 20])
  const [debouncedWeightRange, setDebouncedWeightRange] = useState<[number, number]>([0, 1000])
  const [filteredPokemon, setFilteredPokemon] = useState<Pokemon[]>([])
  const [displayPokemon, setDisplayPokemon] = useState<Pokemon[]>([])
  const [isInFilteredState, setIsInFilteredState] = useState(false)
  
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
  const [comparisonPokemon, setComparisonPokemon] = useState<Pokemon[]>([])
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [detailsCache, setDetailsCache] = useState<Map<number, Pokemon>>(new Map())
  const fetchingRef = useRef<Set<number>>(new Set())
  
  // Infinite scrolling state
  const [allGenerationsPokemon, setAllGenerationsPokemon] = useState<Pokemon[]>([])
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMorePokemon, setHasMorePokemon] = useState(true)
  
  // Use external infinite scroll state if provided
  const effectiveIsLoadingMore = externalIsLoadingMore !== undefined ? externalIsLoadingMore : isLoadingMore
  const effectiveHasMorePokemon = externalHasMorePokemon !== undefined ? externalHasMorePokemon : hasMorePokemon
  const [currentOffset, setCurrentOffset] = useState(0)
  const [isAllGenerations, setIsAllGenerations] = useState(true) // Start in "All Generations" mode by default
  const [totalPokemonCount, setTotalPokemonCount] = useState<number | null>(null)
  const emptyBatchCountRef = useRef<number>(0)
  const lastLoadTimeRef = useRef<number>(0)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login')
  
  // Collapsible sections state with localStorage persistence
  const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(true)
  const [isFiltersHydrated, setIsFiltersHydrated] = useState(false)
  
  // Always use lazy loading
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  // Handle hydration and load from localStorage
  useEffect(() => {
    setIsFiltersHydrated(true)
    const saved = localStorage.getItem('pokemon-filters-collapsed')
    if (saved) {
      setIsFiltersCollapsed(JSON.parse(saved))
    }
  }, [])

  // Persist collapsible state to localStorage
  useEffect(() => {
    if (isFiltersHydrated) {
      localStorage.setItem('pokemon-filters-collapsed', JSON.stringify(isFiltersCollapsed))
    }
  }, [isFiltersCollapsed, isFiltersHydrated])

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
    if (pokemonList.length > 0 && !isInFilteredState) {
      setFilteredPokemon(prev => {
        if (prev.length === pokemonList.length && prev.every((p, i) => p.id === pokemonList[i]?.id)) {
          return prev // No change, prevent re-render
        }
        return pokemonList
      })
      setDisplayPokemon(prev => {
        if (prev.length === pokemonList.length && prev.every((p, i) => p.id === pokemonList[i]?.id)) {
          return prev // No change, prevent re-render
        }
        return pokemonList
      })
    }
  }, [pokemonList, isInFilteredState])


  // Load initial Pokemon data when component mounts (always use lazy loading)
  useEffect(() => {
    const loadInitialPokemon = async () => {
      try {
        // Fetch total count
        try {
          const count = await getPokemonTotalCount();
          setTotalPokemonCount(count || null);
        } catch (error) {
          setTotalPokemonCount(1302);
        }
        
        // Always use lazy loading - no initial batch needed
        console.log('🔄 Starting lazy loading...');
        setIsInitialLoading(false);
      } catch (error) {
        console.error('Error in initial Pokemon loading:', error);
        setIsInitialLoading(false); // Still set to false even on error
      }
    };

    loadInitialPokemon();
  }, []); // Run once on mount

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
    debounceMs: 800,
    cacheTtl: 5 * 60 * 1000,
    throttleMs: 100
  })

  // Create a hash of current filter state to detect actual changes (excluding search results)
  const getFilterHash = useCallback(() => {
    return JSON.stringify({
      // Removed searchResults.length to prevent filtering on every search change
      advancedFilters,
      debouncedHeightRange,
      debouncedWeightRange,
      sortBy,
      sortOrder
    })
  }, [advancedFilters, debouncedHeightRange, debouncedWeightRange, sortBy, sortOrder])

  // Memoize the current filter hash to prevent unnecessary recalculations
  const currentFilterHash = useMemo(() => getFilterHash(), [getFilterHash])

  // Handle search results separately to avoid triggering heavy filtering
  useEffect(() => {
    if (searchResults.length > 0) {
      // Directly set search results without triggering the main filtering effect
      setFilteredPokemon(prev => {
        if (prev.length === searchResults.length && prev.every((p, i) => p.id === searchResults[i]?.id)) {
          return prev // No change, prevent re-render
        }
        return searchResults
      })
      setDisplayPokemon(prev => {
        if (prev.length === searchResults.length && prev.every((p, i) => p.id === searchResults[i]?.id)) {
          return prev // No change, prevent re-render
        }
        return searchResults
      })
      setIsInFilteredState(true)
    } else if (searchTerm === '') {
      // Only clear results if search term is completely empty
      setFilteredPokemon(pokemonList)
      setDisplayPokemon(pokemonList)
      setIsInFilteredState(false)
    }
  }, [searchResults, searchTerm, pokemonList])


  // URL state management
  // URL parsing removed to prevent state conflicts
  // Filters start with default values



  // URL state management removed to prevent infinite re-renders
  // Filters are now managed locally only

  // Filtering timeout ref to prevent multiple simultaneous calls
  const filteringTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isFilteringRef = useRef(false)
  const lastFilterHashRef = useRef<string>('')


  // Optimized filtering effect with proper debouncing and change detection
  useEffect(() => {
    // Skip if filters haven't actually changed
    if (currentFilterHash === lastFilterHashRef.current) {
      return
    }
    
    lastFilterHashRef.current = currentFilterHash

    // Clear any existing timeout
    if (filteringTimeoutRef.current) {
      clearTimeout(filteringTimeoutRef.current)
    }

    // Skip if already filtering to prevent multiple calls
    if (isFilteringRef.current) {
      return
    }

    filteringTimeoutRef.current = setTimeout(async () => {
      if (isFilteringRef.current) return // Double check
      
      isFilteringRef.current = true
      setIsFiltering(true)
      
      try {
        let results: Pokemon[] = []
        
        // Check if we need efficient filtering for weight/height/sorting
        const needsEfficientFiltering = advancedFilters.generation === 'all' && 
          (debouncedHeightRange[0] > 0 || debouncedHeightRange[1] < 20 || 
           debouncedWeightRange[0] > 0 || debouncedWeightRange[1] < 1000 ||
           sortBy !== 'id' || sortOrder !== 'asc')

        // Check if we have any active filters (excluding search results - handled separately)
        const hasActiveFilters = advancedFilters.types.length > 0 || 
                                 (advancedFilters.generation && advancedFilters.generation !== 'all') ||
                                 advancedFilters.legendary || 
                                 advancedFilters.mythical ||
                                 debouncedHeightRange[0] > 0 || debouncedHeightRange[1] < 20 ||
                                 debouncedWeightRange[0] > 0 || debouncedWeightRange[1] < 1000

        // Skip search results handling - they're handled by the separate effect above
        if (advancedFilters.generation && advancedFilters.generation !== 'all' && advancedFilters.generation !== '') {
          // Fetch by generation only if not "all" and not empty (All Generations)
          setIsAllGenerations(false)
          results = await getPokemonByGeneration(parseInt(advancedFilters.generation))
          
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
              basicPokemonList.results.forEach((pokemonRef) => {
                if (!pokemonRef.url) return;
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
              
              
              // Fetch the actual legendary/mythical Pokémon data
              const legendaryMythicalPokemon: Pokemon[] = [];
              for (const pokemonId of legendaryMythicalIds) {
                try {
                  const pokemon = await getPokemon(pokemonId);
                  if (pokemon) {
                    legendaryMythicalPokemon.push(pokemon);
                  }
                } catch (error) {
                  console.warn(`Failed to fetch Pokémon ${pokemonId}:`, error);
                }
              }
              
              // Filter out any failed fetches
              results = legendaryMythicalPokemon.filter(pokemon => pokemon !== null) as Pokemon[];
              
              // If no legendary/mythical Pokemon found, fallback to pokemonList
              if (results.length === 0) {
                results = pokemonList
              }
              
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
            // "All Generations" without any special filters - use the pokemonList prop
            setIsAllGenerations(true)
            setHasMorePokemon(true) // Ensure infinite scroll is enabled
            
            // Use the pokemonList prop (which contains pokemonWithData from the parent)
            results = pokemonList
          }
        } else {
          // No filters or default state - use base pokemon list
          results = pokemonList
          setIsAllGenerations(false)
        }

        // If no active filters, reset the filtered state
        if (!hasActiveFilters) {
          setIsInFilteredState(false)
        }

        // Enrich search results with full details so types are available
        try {
          // Skip enrichment - let viewport-based loading handle it
          // This prevents duplicate API calls
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



        // Update both states together to prevent conflicts and reduce flashing
        // Only update if the results actually changed to prevent unnecessary re-renders
        setFilteredPokemon(prev => {
          if (prev.length === results.length && prev.every((p, i) => p.id === results[i]?.id)) {
            return prev // No change, prevent re-render
          }
          return results
        })
        setDisplayPokemon(prev => {
          if (prev.length === results.length && prev.every((p, i) => p.id === results[i]?.id)) {
            return prev // No change, prevent re-render
          }
          return results
        })
        setIsInFilteredState(true)
      } catch (error) {
        
        // On error, fallback to pokemonList instead of empty array
        // Only update if different to prevent unnecessary re-renders
        setFilteredPokemon(prev => {
          if (prev.length === pokemonList.length && prev.every((p, i) => p.id === pokemonList[i]?.id)) {
            return prev // No change, prevent re-render
          }
          return pokemonList
        })
        setDisplayPokemon(prev => {
          if (prev.length === pokemonList.length && prev.every((p, i) => p.id === pokemonList[i]?.id)) {
            return prev // No change, prevent re-render
          }
          return pokemonList
        })
        setIsInFilteredState(false)
        
      } finally {
        isFilteringRef.current = false
        setIsFiltering(false)
      }
    }, 200) // Increased debounce to 200ms for better stability

    return () => {
      if (filteringTimeoutRef.current) {
        clearTimeout(filteringTimeoutRef.current)
      }
    }
  }, [currentFilterHash, pokemonList])


  // Ensure full stats are available when sorting by stats in Modern
  useEffect(() => {
    const statKeys = new Set(['hp','attack','defense','special-attack','special-defense','speed','stats'])
    if (!statKeys.has(sortBy)) return
    const source = displayPokemon.length ? displayPokemon : pokemonList
    let missing = source
      .filter(p => (p.stats?.length || 0) === 0 && !detailsCache.has(p.id))
      .map(p => p.id)
      .filter(id => !(fetchingRef.current as Set<number>).has(id))
    if (missing.length === 0) return

    // Fetch in small batches to avoid overwhelming the network/main thread
    const BATCH_SIZE = 40
    missing = missing.slice(0, BATCH_SIZE)

    // Skip independent API calls - let viewport-based loading handle it
    // This prevents duplicate API calls
  }, [sortBy, displayPokemon, pokemonList, detailsCache])

  // Fetch comparison Pokémon that aren't in current filtered results
  useEffect(() => {
    const fetchComparisonPokemon = async () => {
      if (comparisonList.length === 0) {
        setComparisonPokemon([])
        return
      }

      // Get all available Pokémon IDs (from display results and pokemon list)
      const availableIds = new Set([
        ...displayPokemon.map(p => p.id),
        ...pokemonList.map(p => p.id)
      ])

      // Find comparison Pokémon that aren't available
      const missingIds = comparisonList.filter(id => !availableIds.has(id))

      // Build list from the comparison ids in order, resolving the best available
      const isPlaceholder = (p: Pokemon) => /^pokemon-\d+$/i.test(p.name) || (p.types?.length || 0) === 0
      const findById = (arr: Pokemon[], id: number) => arr.find(p => p.id === id)
      const resolvePokemon = (id: number): Pokemon | undefined => {
        // Prefer cached full details first
        const fromCache = detailsCache.get(id)
        if (fromCache && !isPlaceholder(fromCache)) return fromCache

        // Then check hydrated (viewport-enriched) list for up-to-date names/types
        const fromHydrated = findById(hydratedSortedPokemon, id)
        if (fromHydrated && !isPlaceholder(fromHydrated)) return fromHydrated

        // Then check rendered/display collections
        const fromDisplay = findById(displayPokemon, id)
        if (fromDisplay && !isPlaceholder(fromDisplay)) return fromDisplay

        // Fallback to initial list
        const fromAll = findById(pokemonList, id)
        if (fromAll && !isPlaceholder(fromAll)) return fromAll

        // As last resort, upgrade any found placeholder using getPokemonWithData if available
        const candidate = fromDisplay || fromAll
        if (candidate) {
          const enhanced = getPokemonWithData ? getPokemonWithData(candidate) : candidate
          if (!isPlaceholder(enhanced)) return enhanced
          return enhanced
        }
        return undefined
      }
      const orderedResolved = comparisonList
        .map(id => resolvePokemon(id))
        .filter((p): p is Pokemon => Boolean(p))
      // De-duplicate while preserving first non-placeholder occurrence per id
      const byId = new Map<number, Pokemon>()
      for (const p of orderedResolved) {
        const existing = byId.get(p.id)
        if (!existing) {
          byId.set(p.id, p)
        } else if (isPlaceholder(existing) && !isPlaceholder(p)) {
          byId.set(p.id, p)
        }
      }
      const availableComparison = Array.from(byId.values())

      if (missingIds.length === 0) {
        // All comparison Pokémon are available in current results
        setComparisonPokemon(availableComparison)
        return
      }

      try {
        // Proactively fetch any missing Pokémon so names/types are accurate in the sidebar
        const fetchedPokemon: Pokemon[] = []
        if (missingIds.length > 0) {
          const BATCH = missingIds.slice(0, 20)
          const results = await Promise.allSettled(BATCH.map((id) => getPokemon(id)))
          for (const res of results) {
            if (res.status === 'fulfilled' && res.value) {
              fetchedPokemon.push(res.value as Pokemon)
              // Seed details cache so cards also hydrate correctly
              detailsCache.set((res.value as Pokemon).id, res.value as Pokemon)
            }
          }
        }

        // Combine with available comparison Pokémon (already de-duplicated)
        setComparisonPokemon([...availableComparison, ...fetchedPokemon])
      } catch (error) {
        
        // Fallback to only available Pokémon (already de-duplicated)
        setComparisonPokemon(availableComparison)
      }
    }

    fetchComparisonPokemon()
  }, [comparisonList, displayPokemon, pokemonList])

  // Sort filtered results efficiently (compute sort key once per item)
  const sortedPokemon = useMemo(() => {
    if (!displayPokemon || displayPokemon.length === 0) return [] as Pokemon[]

    // Use getPokemonWithData if available to get loaded data
    const withSource = (p: Pokemon) => {
      const pokemonWithData = getPokemonWithData ? getPokemonWithData(p) : p;
      return pokemonWithData.stats?.length ? pokemonWithData : (detailsCache.get(p.id) || pokemonWithData);
    }

    // Build array with precomputed keys to avoid expensive work inside comparator
    const itemsWithKey = displayPokemon.map(p => {
      let keyNumber = 0
      let keyString = ''
      if (sortBy === 'name') {
        keyString = p.name
      } else if (sortBy === 'id') {
        keyNumber = p.id
      } else if (sortBy === 'stats') {
        const src = withSource(p)
        keyNumber = (src.stats || []).reduce((sum, s) => sum + s.base_stat, 0)
      } else if (
        sortBy === 'hp' ||
        sortBy === 'attack' ||
        sortBy === 'defense' ||
        sortBy === 'special-attack' ||
        sortBy === 'special-defense' ||
        sortBy === 'speed'
      ) {
        const src = withSource(p)
        keyNumber = (src.stats || []).find(s => s.stat.name === sortBy)?.base_stat || 0
      } else {
        keyNumber = p.id
      }
      return { p, keyNumber, keyString }
    })

    itemsWithKey.sort((a, b) => {
      let comparison = 0
      if (sortBy === 'name') {
        comparison = a.keyString.localeCompare(b.keyString)
      } else {
        comparison = a.keyNumber - b.keyNumber
      }
      if (comparison === 0) {
        // Stable tie-breaker by id to keep deterministic order
        comparison = a.p.id - b.p.id
      }
      return sortOrder === 'desc' ? -comparison : comparison
    })

    return itemsWithKey.map(item => item.p)
  }, [displayPokemon, sortBy, sortOrder, detailsCache, getPokemonWithData])

  // Viewport-based hydration: load data for visible cards and hydrate items before rendering
  const {
    getPokemonWithData: getPokemonWithDataViewport,
    isPokemonLoaded: isPokemonLoadedViewport,
    isPokemonLoading: isPokemonLoadingViewport,
  } = useViewportDataLoading({ pokemonList: sortedPokemon, rootMargin: '250px', threshold: 0.05, scrollIdleDelay: 200 })

  // When sidebar closes, nudge viewport loader to evaluate current visibility
  useEffect(() => {
    if (!showSidebar) {
      try {
        // Trigger the hook's resize/visibility pass
        window.dispatchEvent(new Event('resize'))
      } catch {}
    }
  }, [showSidebar])

  // Ensure visible cards render with hydrated data (types/images) when available
  const hydratedSortedPokemon = useMemo(() => {
    return sortedPokemon.map((p) => getPokemonWithDataViewport(p))
  }, [sortedPokemon, getPokemonWithDataViewport])

  // Load more Pokémon for infinite scrolling with improved error handling
  const loadMorePokemon = useCallback(async () => {
    // Use external loadMorePokemon function if provided
    if (externalLoadMorePokemon) {
      externalLoadMorePokemon()
      return
    }
    
    if (effectiveIsLoadingMore || !effectiveHasMorePokemon) {
      
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
            console.log('🚫 Intersection observer disabled - using useViewportDataLoading instead');
            // loadMorePokemon(); // DISABLED: Now using useViewportDataLoading
          }
        },
        {
          root: null, // Use viewport as root for better reliability
          rootMargin: '400px', // Reduced from 800px to prevent too many requests
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
    let observerCleanup: (() => void) | undefined;
    
    if (!sentinel) {
      
      // Retry finding sentinel after a short delay
      const retryTimeout = setTimeout(() => {
        sentinel = findSentinel();
        if (sentinel) {
          
          observerCleanup = setupObserver(sentinel);
        } else {
          
        }
      }, 100);
      
      return () => clearTimeout(retryTimeout);
    } else {
      
      // Set up observer for the found sentinel
      observerCleanup = setupObserver(sentinel);
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
          console.log('🚫 Scroll-based loading disabled - using useViewportDataLoading instead');
          // loadMorePokemon(); // DISABLED: Now using useViewportDataLoading
        }
      }, 150); // Increased debounce time
    };

    if (mainContentArea) {
      mainContentArea.addEventListener('scroll', handleScrollBackup, { passive: true });
    }

    return () => {
      observerCleanup?.();
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
    setDisplayPokemon(pokemonList)
    setIsInFilteredState(false) // Reset filtered state
    clearSearch()
    // Reset infinite scrolling state
    setAllGenerationsPokemon([])
    setCurrentOffset(0)
    setHasMorePokemon(true)
    setIsAllGenerations(false)
    
    // Clear localStorage values
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pokedex.advancedFilters')
        localStorage.removeItem('pokedex.sortBy')
        localStorage.removeItem('pokedex.sortOrder')
        localStorage.removeItem('pokedex.cardDensity')
        localStorage.removeItem('pokedex.showSidebar')
      }
    } catch (error) {
      console.error('Error clearing localStorage filters:', error)
    }
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
        subtitle={
          <a 
            href="https://github.com/betexcr" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-poke-blue dark:hover:text-poke-red transition-colors cursor-pointer"
          >
            Created by Alberto Muñoz
          </a>
        }
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
                      <img src="/loading.gif" alt="Loading" width={20} height={20} className="opacity-80" />
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
              <div className="hidden xl:flex items-center space-x-2 min-w-0">
                <span className="text-xs font-medium text-muted uppercase tracking-wider flex-shrink-0">Types</span>
                <div 
                  className="flex items-center space-x-1 overflow-x-auto max-w-32 lg:max-w-48 xl:max-w-64 type-filters-scroll"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(156, 163, 175, 0.5) transparent'
                  }}
                >
                  <div className="flex items-center space-x-1 min-w-max">
                    {Object.keys(typeColors).map(type => (
                      <button
                        key={type}
                        onClick={() => toggleTypeFilter(type)}
                        className={`px-2 py-1 rounded-lg text-xs font-medium transition-all duration-200 flex-shrink-0 ${
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
                        className="px-2 py-1 text-xs text-poke-blue hover:text-poke-blue/80 hover:underline font-medium flex-shrink-0"
                        title="Clear type filters"
                      >
                        Clear
                      </button>
                    )}
                  </div>
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

      {/* Collapsible Search and Filters Section */}
      <div className="border-b border-border bg-surface">
        {/* Toggle Button */}
        <div className="w-full px-4 py-2">
          <button
            onClick={() => setIsFiltersCollapsed(!isFiltersCollapsed)}
            className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-text hover:bg-surface/50 rounded-lg transition-all duration-200 hover:shadow-sm"
          >
            <span className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Search & Filters
            </span>
            {isFiltersCollapsed ? (
              <ChevronDown className="w-4 h-4 text-muted" />
            ) : (
              <ChevronUp className="w-4 h-4 text-muted" />
            )}
          </button>
        </div>

        {/* Collapsible Content */}
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isFiltersCollapsed ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'
        }`}>
          {/* Search Bar */}
          <div className="px-4 py-3">
            <div className="flex items-center gap-3 relative">
              <SearchInput
                onSearchChange={handleSearchChange}
                placeholder="Search Pokémon..."
              />
              {searchLoading && (
                <div className="absolute right-6 top-1/2 transform -translate-y-1/2">
                  <img src="/loading.gif" alt="Loading" width={20} height={20} className="opacity-80" />
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Type Filter Ribbon */}
          <div className="border-t border-border bg-gradient-to-r from-surface via-surface to-surface">
        <div className="w-full max-w-full pl-0 pr-4 sm:pl-0 sm:pr-6 lg:pl-0 lg:pr-8 py-4">
          <div className="flex items-center justify-between">
            {/* Type Filter Buttons */}
            <div className="flex items-center space-x-3 overflow-x-auto pb-2 type-filters-scroll">
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

          {/* Size & Sort Controls */}
          <div className="border-t border-border bg-surface/60">
        <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-row items-center justify-between gap-4">
            {/* Filters trigger placed left of Size selectors */}
            <div className="flex items-center space-x-3">
              <Tooltip content="Open advanced filters" position="bottom">
                <button
                  onClick={() => setShowSidebar(prev => !prev)}
                  aria-pressed={showSidebar}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200 shadow-sm hover:shadow-md ${
                    showSidebar
                      ? 'bg-poke-blue/10 border-poke-blue text-poke-blue'
                      : 'bg-surface border-border hover:bg-white/50 hover:border-poke-blue/30'
                  }`}
                >
                  <Image src="/header-icons/advanced_filters.png" alt="Filters" width={18} height={18} className="w-4 h-4" />
                  <span className="text-sm font-medium">Filters</span>
                </button>
              </Tooltip>
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
          onToggleComparison={(id) => onToggleComparison(id, setShowSidebar)}
          onClearComparison={onClearComparison}
          onGoToComparison={() => window.location.href = '/compare'}
        />

        {/* Main Content Area */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scroll-stable scrollbar-hide"
        >
          <div className={`${showSidebar ? 'pl-0 pr-0' : 'pl-0 pr-4 sm:pl-0 sm:pr-6 lg:pl-0 lg:pr-8'} min-h-full w-full max-w-full pt-4 relative`}>
            {/* Pokémon Grid */}
            
        {isInitialLoading ? (
          <div className="text-center py-12">
            <img src="/loading.gif" alt="Loading Pokémon" width={100} height={100} className="mx-auto mb-4" />
            <p className="text-muted">Loading Pokémon...</p>
          </div>
        ) : (
          <>
            {isAllGenerations && advancedFilters.generation === 'all' && advancedFilters.types.length === 0 && !searchTerm ? (
              // Always use lazy loading with viewport-based loading
              <div className={`pokemon-grid ${isFiltering ? 'pokemon-grid-updating' : ''}`}>
                <VirtualizedPokemonGrid
                  pokemonList={hydratedSortedPokemon}
                  onToggleComparison={(id) => onToggleComparison(id, setShowSidebar)}
                  onSelectPokemon={undefined}
                  selectedPokemon={null}
                  comparisonList={comparisonList}
                  density={cardDensity}
                  showSpecialForms={true}
                  isLoadingMore={effectiveIsLoadingMore}
                  hasMorePokemon={effectiveHasMorePokemon}
                  onLoadMore={externalLoadMorePokemon || loadMorePokemon}
                  sentinelRef={externalSentinelRef}
                />
              </div>
            ) : sortedPokemon.length > 0 ? (
              <>
                <div className={`pokemon-grid ${isFiltering ? 'pokemon-grid-updating' : ''}`}>
                  {cardDensity === 'list' ? (
                    <PokedexListView
                      pokemonList={hydratedSortedPokemon}
                      onToggleComparison={(id) => onToggleComparison(id, setShowSidebar)}
                      onSelectPokemon={undefined}
                      comparisonList={comparisonList}
                      isLoadingMore={isLoadingMore}
                      hasMorePokemon={hasMorePokemon}
                      onLoadMore={loadMorePokemon}
                    />
                  ) : (
                    <VirtualizedPokemonGrid
                      pokemonList={hydratedSortedPokemon}
                      onToggleComparison={(id) => onToggleComparison(id, setShowSidebar)}
                      onSelectPokemon={undefined}
                      selectedPokemon={null}
                      comparisonList={comparisonList}
                      density={cardDensity}
                      enableVirtualization={false}
                      showSpecialForms={isAllGenerations || (advancedFilters.generation !== 'all' && advancedFilters.generation !== '')}
                      isLoadingMore={effectiveIsLoadingMore}
                      hasMorePokemon={effectiveHasMorePokemon}
                      onLoadMore={externalLoadMorePokemon || loadMorePokemon}
                      sentinelRef={externalSentinelRef}
                    />
                  )}
                </div>

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
                      onClick={() => console.log('🚫 Manual load more disabled - using useViewportDataLoading instead')}
                      className="px-6 py-3 bg-poke-red text-white rounded-lg hover:bg-poke-red/90 transition-colors font-medium"
                    >
                      Retry Loading Pokémon (Disabled)
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

          </>
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
