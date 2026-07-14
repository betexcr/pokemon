'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Pokemon, FilterState } from '@/types/pokemon'
import { formatPokemonName, typeColors } from '@/lib/utils'
import { useSearch } from '@/hooks/useSearch'
import { useRouter } from 'next/navigation'
import { getPokemonByGeneration, getPokemonByType, getPokemon, getPokemonWithPagination, getPokemonTotalCount, getPokemonList, fetchAllPokemonIds } from '@/lib/api'
import ThemeToggle from './ThemeToggle'
import VirtualizedPokemonGrid from './VirtualizedPokemonGrid'
import AdvancedFilters from './AdvancedFilters'
import { useViewportDataLoading } from '@/hooks/useViewportDataLoading'
import { Search, X, List, Grid3X3, Grid2X2, LayoutGridIcon, ChevronUp, ChevronDown, Heart } from 'lucide-react'
import { Dices } from 'lucide-react'
import UserDropdown from './UserDropdown'
import AuthModal from './auth/AuthModal'
import { useAuth } from '@/contexts/AuthContext'
import Image from 'next/image'
import HeaderIcons, { HamburgerMenu } from '@/components/HeaderIcons'
import AppHeader from '@/components/AppHeader'
import Tooltip from '@/components/Tooltip'
import SearchInput from '@/components/SearchInput'
import PokedexScrollbar from '@/components/PokedexScrollbar'
import RecentlyViewedSection from '@/components/RecentlyViewedSection'
import { LEGENDARY_POKEMON, MYTHICAL_POKEMON, ULTRA_BEAST_POKEMON } from '@/lib/pokemon-categories'
import { loadUiState, saveUiState } from '@/lib/uiState'

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
  loadToEnd?: () => Promise<void>
  jumpToPokemonIndex?: (index: number) => Promise<void>
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
  ultraBeast: boolean
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
  loadToEnd: externalLoadToEnd,
  jumpToPokemonIndex: externalJumpToPokemonIndex,
  sentinelRef: externalSentinelRef
}: ModernPokedexLayoutProps) {
  // console debug removed
  const router = useRouter()
  const { user } = useAuth()
  
  // Scroll position persistence
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const SCROLL_POSITION_KEY = 'pokedex.scrollPosition'
  
  // Advanced filters state
  const filtersLoadedRef = useRef(false)
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
    types: [],
    generation: 'all',
    habitat: '',
    heightRange: [0, 20],
    weightRange: [0, 1000],
    legendary: false,
    mythical: false,
    ultraBeast: false
  })
  
  const [showSidebar, setShowSidebar] = useState(false) // Always start with false to match server
  const [isHydrated, setIsHydrated] = useState(false)
  const [sortBy, setSortBy] = useState<'id' | 'name' | 'stats' | 'hp' | 'attack' | 'defense' | 'special-attack' | 'special-defense' | 'speed'>('id')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [cardDensity, setCardDensity] = useState<'3cols' | '6cols' | '9cols' | '12cols' | 'list'>('6cols')

  // Hydration effect - load client-side state after hydration
  useEffect(() => {
    setIsHydrated(true)
    
    // Load sidebar state from localStorage after hydration
    try {
      if (typeof window !== 'undefined') {
        const savedShowSidebar = localStorage.getItem('pokedex.showSidebar')
        const migratedSidebar = savedShowSidebar !== null ? savedShowSidebar === 'true' : false
        const nextSidebar = loadUiState<boolean>('pokedex.showSidebar', migratedSidebar)
        setShowSidebar(nextSidebar)
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
        const persistedFilters = loadUiState<AdvancedFilters | null>('pokedex.advancedFilters', null)
        if (persistedFilters) {
          setAdvancedFilters(persistedFilters)
        } else if (savedFilters) {
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
              mythical: typeof parsedFilters.mythical === 'boolean' ? parsedFilters.mythical : false,
              ultraBeast: typeof parsedFilters.ultraBeast === 'boolean' ? parsedFilters.ultraBeast : false
            })
          }
        }
        filtersLoadedRef.current = true
      }
    } catch (error) {
      console.error('Error loading advanced filters from localStorage:', error)
    }
  }, [])

  // Save advanced filters to localStorage whenever they change
  useEffect(() => {
    if (!filtersLoadedRef.current) return
    try {
      if (typeof window !== 'undefined') {
        saveUiState('pokedex.advancedFilters', advancedFilters)
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
        const persistedSortBy = loadUiState<typeof sortBy | null>('pokedex.sortBy', null)
        const persistedSortOrder = loadUiState<typeof sortOrder | null>('pokedex.sortOrder', null)
        const persistedDensity = loadUiState<typeof cardDensity | null>('pokedex.cardDensity', null)
        
        if (persistedSortBy && ['id', 'name', 'stats', 'hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'].includes(persistedSortBy)) {
          setSortBy(persistedSortBy as typeof sortBy)
        } else if (savedSortBy && ['id', 'name', 'stats', 'hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'].includes(savedSortBy)) {
          setSortBy(savedSortBy as typeof sortBy)
        }
        
        if (persistedSortOrder && ['asc', 'desc'].includes(persistedSortOrder)) {
          setSortOrder(persistedSortOrder as typeof sortOrder)
        } else if (savedSortOrder && ['asc', 'desc'].includes(savedSortOrder)) {
          setSortOrder(savedSortOrder as typeof sortOrder)
        }
        
        if (persistedDensity && ['3cols', '6cols', '9cols', '12cols', 'list'].includes(persistedDensity)) {
          setCardDensity(persistedDensity as typeof cardDensity)
        } else if (savedCardDensity && ['3cols', '6cols', '9cols', '12cols', 'list'].includes(savedCardDensity)) {
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
        saveUiState('pokedex.sortBy', sortBy)
        saveUiState('pokedex.sortOrder', sortOrder)
        saveUiState('pokedex.cardDensity', cardDensity)
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
        saveUiState('pokedex.showSidebar', showSidebar)
      }
    } catch (error) {
      console.error('Error saving sidebar state to localStorage:', error)
    }
  }, [showSidebar, isHydrated])
  
  // Restore scroll position on mount - polls until the container has enough content
  useEffect(() => {
    if (typeof window === 'undefined') return
    let target: number | null = null
    try {
      const saved = localStorage.getItem(SCROLL_POSITION_KEY)
      const persistedScroll = loadUiState<number | null>('pokedex.scrollPosition', null)
      if (typeof persistedScroll === 'number' && persistedScroll > 0) {
        target = persistedScroll
      } else if (saved) {
        target = parseInt(saved, 10)
      }
    } catch {
      return
    }
    if (!target || target <= 0) return

    const tryRestore = () => {
      const el = scrollContainerRef.current
      if (!el) return false
      // Only apply once the container is scrollable to the target position
      if (el.scrollHeight - el.clientHeight >= target! - 1) {
        el.scrollTop = target!
        return true
      }
      return false
    }

    if (tryRestore()) return

    // Retry every 100ms until content loads, up to 5 seconds
    let attempts = 0
    const intervalId = setInterval(() => {
      attempts++
      if (tryRestore() || attempts >= 50) clearInterval(intervalId)
    }, 100)

    return () => clearInterval(intervalId)
  }, [])

  // Save scroll position to localStorage when scrolling (throttled)
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    let timeoutId: NodeJS.Timeout
    const handleScroll = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        try {
          saveUiState('pokedex.scrollPosition', scrollContainer.scrollTop)
        } catch { /* storage unavailable */ }
      }, 100)
    }

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll)
      clearTimeout(timeoutId)
    }
  }, [])

  // Flush scroll position when navigating away or hiding the tab
  useEffect(() => {
    const saveNow = () => {
      try {
        if (scrollContainerRef.current) {
          saveUiState('pokedex.scrollPosition', scrollContainerRef.current.scrollTop)
        }
      } catch { /* storage unavailable */ }
    }
    const handleVisibilityChange = () => { if (document.visibilityState === 'hidden') saveNow() }

    window.addEventListener('beforeunload', saveNow)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      window.removeEventListener('beforeunload', saveNow)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
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
  const retryTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login')
  
  // Favorites state management
  const [favoritesList, setFavoritesList] = useState<number[]>([])
  const [isFavoritesHydrated, setIsFavoritesHydrated] = useState(false)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  
  // Load favorites from localStorage on mount
  useEffect(() => {
    setIsFavoritesHydrated(true)
    try {
      if (typeof window !== 'undefined') {
        const savedFavorites = localStorage.getItem('pokemon.favorites')
        if (savedFavorites) {
          const parsedFavorites = JSON.parse(savedFavorites)
          if (Array.isArray(parsedFavorites)) {
            setFavoritesList(parsedFavorites)
          }
        }
      }
    } catch (error) {
      console.error('Error loading favorites from localStorage:', error)
    }
  }, [])

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    if (!isFavoritesHydrated) return // Don't save during initial render
    
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('pokemon.favorites', JSON.stringify(favoritesList))
      }
    } catch (error) {
      console.error('Error saving favorites to localStorage:', error)
    }
  }, [favoritesList, isFavoritesHydrated])

  // Toggle favorite handler
  const handleToggleFavorite = useCallback((pokemonId: number) => {
    setFavoritesList(prev => {
      if (prev.includes(pokemonId)) {
        return prev.filter(id => id !== pokemonId)
      } else {
        return [...prev, pokemonId]
      }
    })
  }, [])
  
  // Collapsible sections state with localStorage persistence
  const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(true)
  const [isFiltersHydrated, setIsFiltersHydrated] = useState(false)
  const loadedCountRef = useRef(loadedCount || pokemonList.length)
  
  // Always use lazy loading
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  useEffect(() => {
    loadedCountRef.current = loadedCount || pokemonList.length
  }, [loadedCount, pokemonList.length])

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
    let cancelled = false;
    const loadInitialPokemon = async () => {
      try {
        try {
          const count = await getPokemonTotalCount();
          if (cancelled) return;
          setTotalPokemonCount(count || null);
        } catch (error) {
          if (cancelled) return;
          setTotalPokemonCount(1025);
        }
        
        if (!cancelled) setIsInitialLoading(false);
      } catch (error) {
        if (cancelled) return;
        console.error('Error in initial Pokemon loading:', error);
        setIsInitialLoading(false);
      }
    };

    loadInitialPokemon();
    return () => { cancelled = true; };
  }, []);

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
    error: searchError,
    handleSearchChange,
    clearSearch
  } = useSearch({
    debounceMs: 800,
    cacheTtl: 5 * 60 * 1000,
    throttleMs: 100
  })

  const [jumpToNumberInput, setJumpToNumberInput] = useState('')
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (searchTerm.trim()) count += 1
    count += advancedFilters.types.length
    if (advancedFilters.generation !== 'all') count += 1
    if (advancedFilters.habitat) count += 1
    if (advancedFilters.legendary) count += 1
    if (advancedFilters.mythical) count += 1
    if (advancedFilters.ultraBeast) count += 1
    if (debouncedHeightRange[0] > 0 || debouncedHeightRange[1] < 20) count += 1
    if (debouncedWeightRange[0] > 0 || debouncedWeightRange[1] < 1000) count += 1
    if (showFavoritesOnly) count += 1
    return count
  }, [
    searchTerm,
    advancedFilters.types.length,
    advancedFilters.generation,
    advancedFilters.habitat,
    advancedFilters.legendary,
    advancedFilters.mythical,
    advancedFilters.ultraBeast,
    debouncedHeightRange,
    debouncedWeightRange,
    showFavoritesOnly
  ])

  const handleJumpToPokemonNumber = useCallback(async () => {
    const parsed = Number.parseInt(jumpToNumberInput, 10)
    if (Number.isNaN(parsed)) return

    const maxPokemon = totalCount || totalPokemonCount || 1025
    const targetId = Math.min(maxPokemon, Math.max(1, parsed))
    const targetIndex = targetId - 1
    setJumpToNumberInput(String(targetId))

    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
    const getLoadedCount = () => Math.max(1, loadedCountRef.current)
    const waitForLoadedCount = async (requiredCount: number, timeoutMs = 1500) => {
      const start = Date.now()
      while (Date.now() - start < timeoutMs) {
        if (getLoadedCount() >= requiredCount) return true
        await wait(60)
      }
      return getLoadedCount() >= requiredCount
    }

    const scrollNearTargetRow = (smooth = false) => {
      const densityConfig: Record<string, { cols: number }> = {
        '3cols': { cols: 3 },
        '6cols': { cols: 6 },
        '9cols': { cols: 9 },
        list: { cols: 1 }
      }
      const config = densityConfig[cardDensity] || densityConfig['6cols']
      const effectiveLoaded = Math.max(getLoadedCount(), targetId)
      const totalRows = Math.max(1, Math.ceil(effectiveLoaded / config.cols))
      const targetRow = Math.floor(targetIndex / config.cols)
      const rowRatio = totalRows > 1 ? targetRow / (totalRows - 1) : 0
      const scrollHeight = scrollContainer.scrollHeight - scrollContainer.clientHeight

      scrollContainer.scrollTo({
        top: Math.max(0, Math.min(rowRatio * scrollHeight, scrollHeight)),
        behavior: smooth ? 'smooth' : 'auto'
      })
    }

    const tryCenterTarget = () => {
      const targetElement = scrollContainer.querySelector(`[data-pokemon-id="${targetId}"]`) as HTMLElement | null
      if (!targetElement) return false

      const containerRect = scrollContainer.getBoundingClientRect()
      const targetRect = targetElement.getBoundingClientRect()
      const elementOffsetTop = targetRect.top - containerRect.top + scrollContainer.scrollTop
      const centeredScrollTop = elementOffsetTop - (scrollContainer.clientHeight / 2) + (targetElement.clientHeight / 2)

      scrollContainer.scrollTo({
        top: Math.max(0, centeredScrollTop),
        behavior: 'smooth'
      })

      return true
    }

    const jumpAttempts = externalJumpToPokemonIndex ? 10 : (externalLoadMorePokemon ? 12 : 1)
    for (let attempt = 0; attempt < jumpAttempts; attempt++) {
      if (externalJumpToPokemonIndex && getLoadedCount() < targetId) {
        await externalJumpToPokemonIndex(targetIndex)
        await waitForLoadedCount(targetId)
      } else if (externalLoadMorePokemon && getLoadedCount() < targetId) {
        await externalLoadMorePokemon()
        await waitForLoadedCount(targetId, 800)
      }

      if (getLoadedCount() < targetId) {
        continue
      }

      // Move viewport near target so virtualization mounts the row/card
      scrollNearTargetRow(false)

      await wait(attempt === 0 ? 120 : 180 + attempt * 40)
      if (tryCenterTarget()) {
        return
      }
    }

    if (externalLoadToEnd && getLoadedCount() < targetId) {
      await externalLoadToEnd()
      scrollNearTargetRow(false)
      await wait(180)
      if (tryCenterTarget()) {
        return
      }
    }

    scrollNearTargetRow(true)

    await wait(140)
    tryCenterTarget()
  }, [jumpToNumberInput, totalCount, totalPokemonCount, externalJumpToPokemonIndex, externalLoadMorePokemon, externalLoadToEnd, cardDensity])

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
  const pendingFilterRef = useRef(false)
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

    if (isFilteringRef.current) {
      pendingFilterRef.current = true
      return
    }

    let cancelled = false

    filteringTimeoutRef.current = setTimeout(async () => {
      if (cancelled || isFilteringRef.current) return
      
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
                                 advancedFilters.ultraBeast ||
                                 debouncedHeightRange[0] > 0 || debouncedHeightRange[1] < 20 ||
                                 debouncedWeightRange[0] > 0 || debouncedWeightRange[1] < 1000

        // Skip search results handling - they're handled by the separate effect above
        if (advancedFilters.generation && advancedFilters.generation !== 'all' && advancedFilters.generation !== '') {
          // Fetch by generation only if not "all" and not empty (All Generations)
          setIsAllGenerations(false)
          results = await getPokemonByGeneration(parseInt(advancedFilters.generation))
          if (cancelled) return
          
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
            if (cancelled) return
          } else {
            // Multiple types - fetch all Pokémon of each type and find intersection
            const typePokemonLists = await Promise.all(
              advancedFilters.types.map(type => getPokemonByType(type))
            )
            if (cancelled) return
            
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
          // Check if category filters are active
          if (advancedFilters.legendary || advancedFilters.mythical || advancedFilters.ultraBeast) {
            // "All Generations" with category filters - efficient filtering approach
            setIsAllGenerations(false) // Override infinite scroll for this case
            setHasMorePokemon(false) // Disable infinite scroll for filtered results
            
            try {
              // Get total count first
              const totalCount = await getPokemonTotalCount();
              if (cancelled) return
              
              const basicPokemonList = await getPokemonList(totalCount, 0);
              if (cancelled) return
              
              const legendaryMythicalIds: number[] = [];
              basicPokemonList.results.forEach((pokemonRef) => {
                if (!pokemonRef.url) return;
                const pokemonId = parseInt(pokemonRef.url.split('/').slice(-2)[0]);
                const isLegendary = LEGENDARY_POKEMON.has(pokemonId);
                const isMythical = MYTHICAL_POKEMON.has(pokemonId);
                const isUltraBeast = ULTRA_BEAST_POKEMON.has(pokemonId);
                
                const activeCategories: boolean[] = [];
                if (advancedFilters.legendary) activeCategories.push(isLegendary);
                if (advancedFilters.mythical) activeCategories.push(isMythical);
                if (advancedFilters.ultraBeast) activeCategories.push(isUltraBeast);
                
                if (activeCategories.length > 0 && activeCategories.some(Boolean)) {
                  legendaryMythicalIds.push(pokemonId);
                }
              });
              
              
              const legendaryMythicalPokemon: Pokemon[] = [];
              for (const pokemonId of legendaryMythicalIds) {
                if (cancelled) return
                try {
                  const pokemon = await getPokemon(pokemonId);
                  if (cancelled) return
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
              const totalCount = await getPokemonTotalCount();
              if (cancelled) return
              
              const basicPokemonList = await getPokemonList(totalCount, 0);
              if (cancelled) return
              
              const allPokemon: Pokemon[] = [];
              const batchSize = 50;
              let offset = 0;
              
              while (offset < totalCount) {
                if (cancelled) return
                const batch = await getPokemonWithPagination(batchSize, offset);
                if (cancelled) return
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

        // Category filters - apply only if not already filtered at data level
        if ((advancedFilters.legendary || advancedFilters.mythical || advancedFilters.ultraBeast) && advancedFilters.generation !== 'all') {
          results = results.filter(pokemon => {
            const activeCategories: boolean[] = [];
            if (advancedFilters.legendary) activeCategories.push(LEGENDARY_POKEMON.has(pokemon.id));
            if (advancedFilters.mythical) activeCategories.push(MYTHICAL_POKEMON.has(pokemon.id));
            if (advancedFilters.ultraBeast) activeCategories.push(ULTRA_BEAST_POKEMON.has(pokemon.id));
            return activeCategories.length === 0 || activeCategories.some(Boolean)
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
        if (cancelled) return
        
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
        if (!cancelled) setIsFiltering(false)
        if (pendingFilterRef.current) {
          pendingFilterRef.current = false
          lastFilterHashRef.current = ''
        }
      }
    }, 200)

    return () => {
      cancelled = true
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
    let cancelled = false
    const fetchComparisonPokemon = async () => {
      if (comparisonList.length === 0) {
        if (!cancelled) setComparisonPokemon([])
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
        if (!cancelled) setComparisonPokemon(availableComparison)
        return
      }

      try {
        // Proactively fetch any missing Pokémon so names/types are accurate in the sidebar
        const fetchedPokemon: Pokemon[] = []
        if (missingIds.length > 0) {
          const BATCH = missingIds.slice(0, 20)
          const results = await Promise.allSettled(BATCH.map((id) => getPokemon(id)))
          if (cancelled) return
          for (const res of results) {
            if (res.status === 'fulfilled' && res.value) {
              fetchedPokemon.push(res.value as Pokemon)
            }
          }
          if (fetchedPokemon.length > 0) {
            if (!cancelled) {
              setDetailsCache(prev => {
                const next = new Map(prev)
                for (const p of fetchedPokemon) next.set(p.id, p)
                return next
              })
            }
          }
        }

        // Combine with available comparison Pokémon (already de-duplicated)
        if (!cancelled) {
          setComparisonPokemon([...availableComparison, ...fetchedPokemon])
        }
      } catch (error) {
        
        // Fallback to only available Pokémon (already de-duplicated)
        if (!cancelled) setComparisonPokemon(availableComparison)
      }
    }

    fetchComparisonPokemon()
    return () => {
      cancelled = true
    }
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
  } = useViewportDataLoading({ pokemonList: sortedPokemon, scrollIdleDelay: 200 })

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
        
        if (total && currentOffset < total && emptyBatchCountRef.current < 3) {
          emptyBatchCountRef.current += 1;
          setCurrentOffset(prev => prev + pageSize);
          setIsLoadingMore(false);
          retryTimerRef.current = setTimeout(() => loadMorePokemon(), Math.pow(2, emptyBatchCountRef.current) * 100);
          return;
        }
        
        // If we've tried multiple times and still get empty batches, but we're not at the expected limit,
        // try loading a larger batch to see if there are more Pokémon
        if (emptyBatchCountRef.current >= 3 && currentOffset < 1000) {
          emptyBatchCountRef.current = 0;
          const largerBatch = await getPokemonWithPagination(150, currentOffset);
          if (largerBatch.length > 0) {
            setAllGenerationsPokemon(prev => [...prev, ...largerBatch]);
            setCurrentOffset(prev => prev + 150);
            setIsLoadingMore(false);
            return;
          }
        }
        
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
        const maxPokemonCount = totalPokemonCount || 1025;
        
        if (newOffset >= maxPokemonCount) {
          setHasMorePokemon(false);
        }
      }
    } catch (error) {
      
      
      // Retry on error with exponential backoff
      if (emptyBatchCountRef.current < 3) {
        emptyBatchCountRef.current += 1;
        setIsLoadingMore(false);
        retryTimerRef.current = setTimeout(() => loadMorePokemon(), Math.pow(2, emptyBatchCountRef.current) * 1000);
        return;
      }
      
      // If all retries failed, stop trying
      setHasMorePokemon(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMorePokemon, currentOffset, totalPokemonCount]);

  useEffect(() => {
    return () => { if (retryTimerRef.current) clearTimeout(retryTimerRef.current); };
  }, []);

  // Note: Intersection observer is handled by the main page component to avoid conflicts
  // This component only passes the sentinel ref to child components

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setAdvancedFilters({
      types: [],
      generation: 'all',
      habitat: '',
      heightRange: [0, 20],
      weightRange: [0, 1000],
      legendary: false,
      mythical: false,
      ultraBeast: false
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
    setShowFavoritesOnly(false) // Reset favorites filter
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

      {/* Fallback marker removed; no desktop drawer */}

      {/* Mobile Menu Overlay - Only on small screens */}
      {showMobileMenu && isMobile && (
        <div
          id="mobile-drawer"
          className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onKeyDown={(e) => { if (e.key === 'Escape') setShowMobileMenu(false); }}
        >
          {/* Backdrop - click to close */}
          <div 
            className="absolute inset-0"
            onClick={() => setShowMobileMenu(false)}
            aria-hidden="true"
          />
          <div
            className="mobile-menu fixed right-0 top-0 h-full w-80 max-w-[85vw] bg-bg border-l border-border shadow-2xl animate-in slide-in-from-right duration-300"
            style={{ backgroundColor: 'var(--color-bg)' }}
          >
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text">Quick Actions</h3>
                <button type="button"
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 rounded-lg hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-200 hover:scale-110"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              


              {/* Mobile Type Filters */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-text uppercase tracking-wider">Quick Type Filters</h4>
                <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                  {Object.keys(typeColors).slice(0, 9).map(type => (
                    <button type="button"
                      key={type}
                      onClick={() => {
                        if (!isFiltering) {
                          toggleTypeFilter(type)
                          setShowMobileMenu(false)
                        }
                      }}
                      disabled={isFiltering}
                      className={`px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                        advancedFilters.types.includes(type) 
                          ? 'ring-2 ring-white shadow-lg scale-105' 
                          : 'opacity-80 hover:opacity-100'
                      } ${isFiltering ? 'opacity-50 cursor-not-allowed' : ''}`}
                      style={{
                        backgroundColor: `var(--type-${type})`,
                        color: typeColors[type].text === 'text-white' ? 'white' : 'black',
                      }}
                      title={isFiltering ? 'Filtering in progress...' : formatPokemonName(type)}
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
                  {(advancedFilters.types.length > 0 || searchTerm || (advancedFilters.generation && advancedFilters.generation !== '') || advancedFilters.legendary || advancedFilters.mythical || advancedFilters.ultraBeast) && (
                    <button type="button"
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
                  <button type="button"
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
                    <button type="button"
                      onClick={() => {
                        onClearComparison()
                        setShowMobileMenu(false)
                      }}
                      className="w-full p-2 rounded-lg bg-white dark:bg-gray-800 border border-border text-text hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 text-sm"
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
                  <button type="button"
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
                  <button type="button"
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
                  <button type="button"
                    onClick={() => {
                      openAuthModal('login')
                      setShowMobileMenu(false)
                    }}
                    className="w-full p-3 rounded-xl bg-poke-blue text-white font-medium transition-all duration-200 hover:bg-poke-blue/80 flex items-center justify-center space-x-2"
                  >
                    <span>Test Sign In Dialog</span>
                  </button>
                  <button type="button"
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
                    <button type="button"
                      onClick={() => {
                        openAuthModal('login')
                        setShowMobileMenu(false)
                      }}
                      className="w-full p-3 rounded-xl bg-poke-blue text-white font-medium transition-all duration-200 hover:bg-poke-blue/80 flex items-center justify-center space-x-2"
                    >
                      <span>Sign In</span>
                    </button>
                    <button type="button"
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
                <button type="button"
                  onClick={() => setShowMobileMenu(false)}
                  className="w-full p-3 rounded-xl bg-white dark:bg-gray-800 border border-border text-text hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 font-medium"
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
      <div className="sticky top-0 border-b border-border bg-surface relative z-20">
        {/* Toggle Row — extra end padding keeps Expand clear of overlay scrollbars */}
        <div className="w-full pl-4 pr-6 sm:pr-8 py-2 flex items-center gap-2 relative z-20">
          {/* Advanced Filters button — always visible */}
          <Tooltip content="Open advanced filters" position="bottom">
            <button type="button"
              onClick={() => setShowSidebar(prev => !prev)}
              aria-pressed={showSidebar}
              className={`flex-shrink-0 flex items-center gap-2 min-h-11 px-3 py-2.5 rounded-lg border text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md ${
                showSidebar
                  ? 'bg-poke-blue/10 border-poke-blue text-poke-blue'
                  : 'bg-surface border-border hover:bg-white/50 dark:hover:bg-white/10 hover:border-poke-blue/30 text-text'
              }`}
            >
              <Image src="/header-icons/advanced_filters.png" alt="Filters" width={18} height={18} className="w-4 h-4" />
              <span>Filters</span>
            </button>
          </Tooltip>

          {/* Expand/collapse toggle — full remaining width is the hit target */}
          <button type="button"
            onClick={() => setIsFiltersCollapsed(prev => !prev)}
            aria-expanded={!isFiltersCollapsed}
            aria-controls="search-filters-panel"
            aria-label={isFiltersCollapsed ? 'Expand search and filters' : 'Collapse search and filters'}
            title={isFiltersCollapsed ? 'Show search and filters' : 'Hide search and filters'}
            className={`group flex items-center justify-center flex-1 min-h-11 min-w-0 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 border relative z-30 cursor-pointer select-none touch-manipulation active:scale-[0.99] ${
              isFiltersCollapsed
                ? 'text-text bg-bg hover:bg-border/40 border-border hover:border-poke-blue/40 hover:shadow-sm'
                : 'text-poke-blue bg-poke-blue/10 border-poke-blue/30 shadow-sm hover:bg-poke-blue/15'
            }`}
          >
            <span className="flex items-center justify-center gap-2 flex-wrap">
              <Search className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Search & Filters</span>
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold tracking-wide ${
                isFiltersCollapsed ? 'text-muted group-hover:text-text' : 'text-poke-blue'
              }`}>
                {isFiltersCollapsed ? 'Expand' : 'Collapse'}
                {isFiltersCollapsed ? (
                  <ChevronDown className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <ChevronUp className="w-4 h-4" aria-hidden="true" />
                )}
              </span>
            </span>
          </button>
        </div>

        {/* Collapsible Content */}
        <div
          id="search-filters-panel"
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isFiltersCollapsed
              ? 'max-h-0 opacity-0 pointer-events-none'
              : 'max-h-[50vh] sm:max-h-[600px] opacity-100'
          }`}
        >
          {/* Search Bar */}
          <div className="px-3 sm:px-4 py-2 sm:py-3">
            <div className="flex items-center gap-2 sm:gap-3 relative">
              <SearchInput
                onSearchChange={handleSearchChange}
                placeholder="Search Pokémon..."
              />
              <div className="flex items-center gap-2 flex-shrink-0">
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={totalCount || totalPokemonCount || 1025}
                  value={jumpToNumberInput}
                  onChange={(e) => setJumpToNumberInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      void handleJumpToPokemonNumber()
                    }
                  }}
                  placeholder="#"
                  className="w-20 h-10 rounded-xl border border-poke-blue/30 bg-white dark:bg-gray-800 px-2 text-sm text-center font-semibold text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-poke-blue/50"
                  title="Jump to Pokédex number"
                />
                <button type="button"
                  onClick={() => void handleJumpToPokemonNumber()}
                  className="h-10 px-3 rounded-xl border border-poke-blue/30 bg-white dark:bg-gray-800 text-sm font-semibold text-poke-blue hover:border-poke-blue/60 transition-colors"
                  title="Go to Pokédex number"
                >
                  Go
                </button>
              </div>
              {searchLoading && (
                <div className="absolute right-6 top-1/2 transform -translate-y-1/2">
                  <img src="/loading.gif" alt="Loading" width={20} height={20} className="opacity-80" />
                </div>
              )}
              <button type="button"
                onClick={async () => {
                  try {
                    const allIds = await fetchAllPokemonIds()
                    const randomId = allIds[Math.floor(Math.random() * allIds.length)]
                    router.push(`/pokemon/${randomId}`)
                  } catch {
                    const randomId = Math.floor(Math.random() * (totalCount || 1025)) + 1
                    router.push(`/pokemon/${randomId}`)
                  }
                }}
                className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-r from-poke-yellow to-poke-red text-white hover:shadow-lg transition-all duration-200 hover:scale-105 group"
                title="Random Pokémon"
              >
                <Dices className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              </button>
            </div>
          </div>

          {/* Enhanced Type Filter Ribbon */}
          <div className="border-t border-border bg-gradient-to-r from-surface via-surface to-surface">
        <div className="w-full max-w-full px-3 sm:px-4 py-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            {/* Type Filter Buttons */}
            <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 pb-1 type-filters-scroll">
              {Object.keys(typeColors).map(type => (
                <button type="button"
                  key={type}
                  onClick={() => !isFiltering && toggleTypeFilter(type)}
                  disabled={isFiltering}
                  className={`px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold border-2 transition-all duration-300 whitespace-nowrap shadow-sm hover:shadow-md transform hover:scale-105 ${
                    advancedFilters.types.includes(type) 
                      ? 'border-white shadow-lg scale-105' 
                      : 'border-transparent opacity-60 hover:opacity-80'
                  } ${isFiltering ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{
                    backgroundColor: `var(--type-${type})`,
                    color: typeColors[type].text === 'text-white' ? 'white' : 'black',
                  }}
                  title={isFiltering ? 'Filtering in progress...' : formatPokemonName(type)}
                  onMouseEnter={(e) => {
                    if (!advancedFilters.types.includes(type) && !isFiltering) {
                      e.currentTarget.style.opacity = '0.9'
                      e.currentTarget.style.transform = 'scale(1.05)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!advancedFilters.types.includes(type) && !isFiltering) {
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
            <div className="flex items-center space-x-4 ml-2 sm:ml-6 flex-shrink-0">
              <div className="flex items-center space-x-3">
                {/* Favorites Filter Toggle */}
                {favoritesList.length > 0 && (
                  <button type="button"
                    onClick={() => setShowFavoritesOnly(prev => !prev)}
                    disabled={isFiltering}
                    className={`px-3 py-1.5 text-sm font-semibold rounded-lg border-2 transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-105 flex items-center gap-2 ${
                      showFavoritesOnly 
                        ? 'bg-red-500 text-white border-white shadow-lg scale-105' 
                        : 'bg-white dark:bg-gray-800 text-red-500 border-red-200 dark:border-red-400/30 hover:border-red-300 dark:hover:border-red-400'
                    } ${isFiltering ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={showFavoritesOnly ? 'Show all Pokémon' : `Show only favorites (${favoritesList.length})`}
                  >
                    <Heart className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
                    <span>Favorites</span>
                    {favoritesList.length > 0 && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${showFavoritesOnly ? 'bg-white/20' : 'bg-red-100 dark:bg-red-900/30'}`}>
                        {favoritesList.length}
                      </span>
                    )}
                  </button>
                )}
                
              </div>
            </div>
          </div>
        </div>
          </div>
          <div className="border-t border-border bg-surface/90 px-3 sm:px-4 py-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-muted">
                Showing <span className="font-semibold text-text">{hydratedSortedPokemon.length}</span> Pokemon
                {activeFilterCount > 0 ? (
                  <> with <span className="font-semibold text-text">{activeFilterCount}</span> active filters</>
                ) : null}
              </span>
              {comparisonList.length >= 2 && (
                <button
                  type="button"
                  onClick={() => router.push('/compare')}
                  className="min-h-[44px] rounded-md border border-poke-blue/40 bg-poke-blue/10 px-3 py-1.5 font-semibold text-poke-blue hover:bg-poke-blue/20"
                >
                  Quick compare ({comparisonList.length})
                </button>
              )}
            </div>
            {searchError && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                Search issue: {searchError}
              </p>
            )}
          </div>

          {/* Size, Sort & Advanced Filters Controls */}
          <div className="border-t border-border px-3 sm:px-4 py-2 sm:py-3">
            <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4">
              {/* Left: Size */}
              <div className="flex items-center space-x-3">
                {/* Card Density Controls */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium text-muted uppercase tracking-wider">Size</span>
                  <div className="flex items-center bg-surface rounded-xl p-1 shadow-sm">
                    {[
                      { visual: '3cols', label: '3 Cols', target: '3cols' },
                      { visual: '6cols', label: '6 Cols', target: '6cols' },
                      { visual: '9cols', label: '9 Cols', target: '9cols' },
                      { visual: '12cols', label: '12 Cols', target: '12cols' },
                      { visual: 'list', label: 'List', target: 'list' }
                    ].map(({ visual, label, target }) => (
                      <button type="button"
                        key={visual}
                        onClick={() => setCardDensity(target as '3cols' | '6cols' | '9cols' | '12cols' | 'list')}
                        className={`px-2 py-2 text-xs font-medium rounded-full transition-all duration-200 flex items-center space-x-1 ${
                          cardDensity === target
                            ? 'bg-poke-blue text-white shadow-lg scale-105'
                            : 'text-muted hover:text-text hover:bg-white/50 dark:hover:bg-white/10'
                        }`}
                        style={{ borderRadius: '9999px', padding: '8px 8px' }}
                      >
                        <span className="inline-flex items-center justify-center">
                          {visual === '3cols' && <LayoutGridIcon className="w-3 h-3" />}
                          {visual === '6cols' && <Grid2X2 className="w-3 h-3" />}
                          {visual === '9cols' && <Grid3X3 className="w-3 h-3" />}
                          {visual === '12cols' && <LayoutGridIcon className="w-3 h-3" />}
                          {visual === 'list' && <List className="w-3 h-3" />}
                        </span>
                        <span className="hidden sm:inline">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Sort Controls */}
              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium text-muted uppercase tracking-wider">Sort</span>
                <div className="flex items-center space-x-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    aria-label="Sort by"
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
                  <button type="button"
                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="flex items-center gap-1 px-2 py-2 rounded-full bg-surface border border-border hover:bg-white/50 dark:hover:bg-white/10 hover:border-poke-blue/30 transition-all duration-200 shadow-sm hover:shadow-md group control-keep"
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

          {/* Recently Viewed Section */}
          <RecentlyViewedSection />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex w-full max-w-full flex-1 min-h-0 overflow-x-hidden gap-0">
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
          data-main-scroll
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scroll-stable scrollbar-hide relative"
        >
          <div className="px-2 sm:px-4 lg:px-6 min-h-full w-full max-w-full pt-4 relative">
            {/* Pokémon Grid */}
            
        {isInitialLoading ? (
          <div className="text-center py-12">
            <div className="mx-auto mb-4 h-10 w-10 rounded-full border-2 border-poke-blue/30 border-t-poke-blue animate-spin" />
            <p className="text-muted">Loading Pokemon...</p>
          </div>
        ) : (
          <>
            {isAllGenerations && advancedFilters.generation === 'all' && advancedFilters.types.length === 0 && !searchTerm ? (
              // Always use lazy loading with viewport-based loading
              <div className="relative">
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
                    favoritesList={favoritesList}
                    onToggleFavorite={handleToggleFavorite}
                    enableVirtualization={true}
                  />
                </div>
                {isFiltering && (
                  <div className="absolute inset-0 bg-gradient-to-br from-bg/40 via-bg/30 to-bg/40 backdrop-blur-md flex items-center justify-center pointer-events-none z-10">
                    <div className="filter-modal-pulse relative bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-900/90 border-2 border-poke-blue/30 shadow-2xl rounded-3xl px-10 py-8 flex flex-col items-center gap-4 overflow-hidden">
                      {/* Animated gradient background */}
                      <div className="absolute inset-0 bg-gradient-to-br from-poke-blue/5 via-poke-red/5 to-poke-yellow/5 gradient-animate opacity-60"></div>
                      
                      {/* Shimmer effect overlay */}
                      <div className="absolute inset-0 shimmer-effect pointer-events-none"></div>
                      
                      {/* Content */}
                      <div className="relative z-10 flex flex-col items-center gap-4">
                        {/* Pokéball spinner */}
                        <div className="pokeball-spinner w-12 h-12 rounded-full bg-gradient-to-br from-poke-red to-red-600 border-4 border-white dark:border-gray-700 shadow-lg relative overflow-hidden">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-full h-1 bg-gray-800 dark:bg-white"></div>
                          </div>
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-800 dark:border-white shadow-inner"></div>
                        </div>
                        
                        {/* Text with gradient */}
                        <div className="text-center">
                          <h3 className="text-xl font-bold bg-gradient-to-r from-poke-blue via-poke-red to-poke-blue bg-clip-text text-transparent mb-1">
                            Filtering Pokémon
                          </h3>
                          <p className="text-sm text-muted animate-pulse">Please wait...</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : sortedPokemon.length > 0 ? (
              <>
                <div className="relative">
                  <div className={`pokemon-grid ${isFiltering ? 'pokemon-grid-updating' : ''}`}>
                    <VirtualizedPokemonGrid
                      pokemonList={hydratedSortedPokemon}
                      onToggleComparison={(id) => onToggleComparison(id, setShowSidebar)}
                      onSelectPokemon={undefined}
                      selectedPokemon={null}
                      comparisonList={comparisonList}
                      density={cardDensity}
                      enableVirtualization={true}
                      showSpecialForms={isAllGenerations || (advancedFilters.generation !== 'all' && advancedFilters.generation !== '')}
                      isLoadingMore={effectiveIsLoadingMore}
                      hasMorePokemon={effectiveHasMorePokemon}
                      onLoadMore={externalLoadMorePokemon || loadMorePokemon}
                      sentinelRef={externalSentinelRef}
                      favoritesList={favoritesList}
                      onToggleFavorite={handleToggleFavorite}
                    />
                </div>
                  {isFiltering && (
                    <div className="absolute inset-0 bg-gradient-to-br from-bg/40 via-bg/30 to-bg/40 backdrop-blur-md flex items-center justify-center pointer-events-none z-10">
                      <div className="filter-modal-pulse relative bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-900/90 border-2 border-poke-blue/30 shadow-2xl rounded-3xl px-10 py-8 flex flex-col items-center gap-4 overflow-hidden">
                        {/* Animated gradient background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-poke-blue/5 via-poke-red/5 to-poke-yellow/5 gradient-animate opacity-60"></div>
                        
                        {/* Shimmer effect overlay */}
                        <div className="absolute inset-0 shimmer-effect pointer-events-none"></div>
                        
                        {/* Content */}
                        <div className="relative z-10 flex flex-col items-center gap-4">
                          {/* Pokéball spinner */}
                          <div className="pokeball-spinner w-12 h-12 rounded-full bg-gradient-to-br from-poke-red to-red-600 border-4 border-white dark:border-gray-700 shadow-lg relative overflow-hidden">
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-full h-1 bg-gray-800 dark:bg-white"></div>
                            </div>
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-800 dark:border-white shadow-inner"></div>
                          </div>
                          
                          {/* Text with gradient */}
                          <div className="text-center">
                            <h3 className="text-xl font-bold bg-gradient-to-r from-poke-blue via-poke-red to-poke-blue bg-clip-text text-transparent mb-1">
                              Filtering Pokémon
                            </h3>
                            <p className="text-sm text-muted animate-pulse">Please wait...</p>
                          </div>
                        </div>
                      </div>
                    </div>
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
                    <button type="button"
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
                <h3 className="text-lg font-semibold mb-2">No Pokémon found</h3>
                <p className="text-muted mb-4">
                  Try adjusting your search terms or filters
                </p>
                <button type="button"
                  onClick={clearAllFilters}
                  className="px-4 py-2 bg-poke-blue text-white rounded-lg hover:bg-poke-blue/90 transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            )}

          {/* Pokedex Scrollbar - Inside scroll container */}
          <PokedexScrollbar
            scrollContainer={scrollContainerRef.current}
            totalPokemon={totalCount || totalPokemonCount || 1025}
            loadedPokemon={loadedCount || pokemonList.length}
            hasMorePokemon={effectiveHasMorePokemon}
            onJumpToPosition={externalJumpToPokemonIndex}
            onLoadToEnd={externalLoadToEnd}
          />

          </>
        )}
          </div>

        </div>
      </div>


      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={closeAuthModal}
        initialMode={authModalMode}
      />

    </div>
  )
}
