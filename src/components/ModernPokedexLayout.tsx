'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Pokemon, FilterState } from '@/types/pokemon'
import { formatPokemonName, typeColors } from '@/lib/utils'
import { useSearch } from '@/hooks/useSearch'
import { useRouter } from 'next/navigation'
import { getPokemonByGeneration, getPokemonByType, getPokemon, getPokemonWithPagination, getPokemonTotalCount } from '@/lib/api'
import ThemeToggle from './ThemeToggle'
import VirtualizedPokemonGrid from './VirtualizedPokemonGrid'
import { Search, Filter, X, Scale, ArrowRight, Menu, LayoutGrid, Grid3X3, Rows, Users, Swords, List } from 'lucide-react'
import UserProfile from './auth/UserProfile'
import { createHeuristics } from '@/lib/heuristics/core'
import { LocalStorageAdapter, MemoryStorage } from '@/lib/heuristics/storage'

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
  const router = useRouter()
  
  // Advanced filters state
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
    types: [],
    generation: '', // Default to "All Generations" since we load 50 Pokémon initially
    habitat: '',
    heightRange: [0, 20],
    weightRange: [0, 1000],
    legendary: false,
    mythical: false
  })
  
  const [showSidebar, setShowSidebar] = useState(true) // Advanced filters open by default
  const [sortBy, setSortBy] = useState<'id' | 'name' | 'stats' | 'hp' | 'attack' | 'defense' | 'special-attack' | 'special-defense' | 'speed'>('id')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [filteredPokemon, setFilteredPokemon] = useState<Pokemon[]>([])
  const [isFiltering, setIsFiltering] = useState(false)
  const [cardDensity, setCardDensity] = useState<'cozy' | 'compact' | 'ultra' | 'list'>('compact')
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
  const [isAllGenerations, setIsAllGenerations] = useState(false)
  const [totalPokemonCount, setTotalPokemonCount] = useState<number | null>(null)
  const emptyBatchCountRef = useRef<number>(0)
  const [themeSelection, setThemeSelection] = useState<'light'|'dark'|'red'|'gold'|'ruby'>('light')
  const lastLoadTimeRef = useRef<number>(0)

  // Heuristics-driven render-only cap and moving window
  const storage = typeof window !== 'undefined' ? new LocalStorageAdapter() : new MemoryStorage()
  const heur = createHeuristics({ storage })
  const [maxRenderCount, setMaxRenderCount] = useState<number>(300)
  const [renderWindowStart, setRenderWindowStart] = useState<number>(0)

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

    cap = Math.max(120, Math.min(cap, 500))
    setMaxRenderCount(cap)
  }, [heur])

  useEffect(() => {
    computeMaxRenderCount()
    const onResize = () => { computeMaxRenderCount(); updateRenderWindow() }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [computeMaxRenderCount])

  const updateRenderWindow = useCallback(() => {
    if (!isAllGenerations) { setRenderWindowStart(0); return }
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const estimatedItemHeight = cardDensity === 'cozy' ? 360 : cardDensity === 'compact' ? 300 : 180
    const estimatedCardWidth = cardDensity === 'cozy' ? 320 : cardDensity === 'compact' ? 200 : 120
    const columns = Math.max(1, Math.floor(window.innerWidth / estimatedCardWidth))
    const firstVisibleRow = Math.max(0, Math.floor(scrollTop / estimatedItemHeight))
    const bufferRows = 3
    const startRow = Math.max(0, firstVisibleRow - bufferRows)
    const startIndex = startRow * columns
    const totalItems = filteredPokemon.length || 0
    const clampedStart = Math.min(startIndex, Math.max(0, totalItems - maxRenderCount))
    setRenderWindowStart(clampedStart)
  }, [cardDensity, maxRenderCount, filteredPokemon.length, isAllGenerations])

  useEffect(() => {
    updateRenderWindow()
    const onScroll = () => updateRenderWindow()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [updateRenderWindow])

  // Initialize filteredPokemon with pokemonList on first load
  useEffect(() => {
    if (pokemonList.length > 0 && filteredPokemon.length === 0) {
      setFilteredPokemon(pokemonList)
    }
  }, [pokemonList, filteredPokemon.length])

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

      // If switching to mobile and current density is not available on mobile, switch to cozy
      if (isMobileScreen && (cardDensity === 'compact' || cardDensity === 'ultra')) {
        setCardDensity('cozy')
      }

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
        } else if (advancedFilters.generation === '') {
          // "All Generations" selected - use infinite scrolling
          setIsAllGenerations(true)
          if (allGenerationsPokemon.length === 0) {
            // Load initial batch
            const initialPokemon = await getPokemonWithPagination(30, 0)
            setAllGenerationsPokemon(initialPokemon)
            setCurrentOffset(30)
            // fetch total count once
            try { 
              const count = await getPokemonTotalCount(); 
              console.log('Fetched total Pokémon count:', count);
              setTotalPokemonCount(count || null) 
            } catch (error) {
              console.error('Error fetching total count:', error);
            }
            results = initialPokemon
          } else {
            results = allGenerationsPokemon
          }
        } else {
          // No filters - use base pokemon list
          results = pokemonList
          setIsAllGenerations(false)
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

        // Legendary and Mythical filters
        if (advancedFilters.legendary || advancedFilters.mythical) {
          results = results.filter(pokemon => {
            const isLegendary = LEGENDARY_POKEMON.has(pokemon.id)
            const isMythical = MYTHICAL_POKEMON.has(pokemon.id)
            
            if (advancedFilters.legendary && advancedFilters.mythical) {
              return isLegendary || isMythical
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
        console.error('Error fetching comparison Pokémon:', error)
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

  // Load more Pokémon for infinite scrolling with deduplication
  const loadMorePokemon = useCallback(async () => {
    if (isLoadingMore || !hasMorePokemon || !isAllGenerations) {
      console.log('Skipping load - isLoadingMore:', isLoadingMore, 'hasMorePokemon:', hasMorePokemon, 'isAllGenerations:', isAllGenerations);
      return;
    }
    
    // Additional protection against rapid calls
    const now = Date.now();
    if (now - lastLoadTimeRef.current < 500) { // 500ms minimum between loads
      console.log('Skipping load - too soon since last load');
      return;
    }
    lastLoadTimeRef.current = now;
    
    console.log('Loading more Pokémon, offset:', currentOffset);
    setIsLoadingMore(true);
    try {
      const pageSize = 30
      const newPokemon = await getPokemonWithPagination(pageSize, currentOffset);
      console.log('Loaded new Pokémon:', newPokemon.length, 'at offset:', currentOffset);
      
      if (newPokemon.length === 0) {
        // If we know total count and haven't reached it, skip ahead and retry a few times
        const total = totalPokemonCount ?? 0
        if (total && currentOffset < total && emptyBatchCountRef.current < 5) { // Increased retry limit
          emptyBatchCountRef.current += 1
          setCurrentOffset(prev => prev + pageSize)
          console.log('Empty batch, advancing offset and retrying. Empty batches:', emptyBatchCountRef.current, 'Current offset:', currentOffset, 'Total:', total)
          // small async retry
          setTimeout(() => { loadMorePokemon() }, 10)
          return;
        }
        console.log('No more Pokémon to load. Current offset:', currentOffset, 'Total count:', total)
        setHasMorePokemon(false);
      } else {
        emptyBatchCountRef.current = 0
        setAllGenerationsPokemon(prev => {
          // Enhanced deduplication by Pokémon ID and name
          const existingIds = new Set(prev.map(p => p.id));
          const existingNames = new Set(prev.map(p => p.name.toLowerCase()));
          
          const uniqueNewPokemon = newPokemon.filter(p => 
            !existingIds.has(p.id) && !existingNames.has(p.name.toLowerCase())
          );
          
          if (uniqueNewPokemon.length === 0) {
            console.log('All new Pokémon were duplicates, skipping');
            return prev;
          }
          
          // Additional check: ensure no duplicates within the new batch itself
          const seenIds = new Set();
          const seenNames = new Set();
          const finalUniquePokemon = uniqueNewPokemon.filter(p => {
            if (seenIds.has(p.id) || seenNames.has(p.name.toLowerCase())) {
              console.log('Removing duplicate within batch:', p.name, p.id);
              return false;
            }
            seenIds.add(p.id);
            seenNames.add(p.name.toLowerCase());
            return true;
          });
          
          const updated = [...prev, ...finalUniquePokemon];
          console.log('Added', finalUniquePokemon.length, 'unique Pokémon. Total now:', updated.length);
          return updated;
        });
        setCurrentOffset(prev => prev + pageSize);
        // Stop when we reach total count if known (be less conservative)
        if (totalPokemonCount && currentOffset + pageSize >= totalPokemonCount - 10) { // Allow some buffer
          console.log('Reaching total count limit. Current offset:', currentOffset + pageSize, 'Total:', totalPokemonCount)
          setHasMorePokemon(false)
        }
      }
    } catch (error) {
      console.error('Error loading more Pokémon:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMorePokemon, currentOffset, isAllGenerations, totalPokemonCount]);

  // Infinite scroll effect using Intersection Observer (best practice)
  useEffect(() => {
    if (!isAllGenerations || isLoadingMore || !hasMorePokemon) {
      return;
    }

    // Create a sentinel element at the bottom of the list
    const sentinel = document.createElement('div');
    sentinel.style.height = '1px';
    sentinel.style.width = '100%';
    sentinel.setAttribute('data-infinite-scroll-sentinel', 'true');
    
    // Find the Pokemon grid container and append sentinel
    const pokemonGrid = document.querySelector('[data-pokemon-grid]');
    if (pokemonGrid) {
      pokemonGrid.appendChild(sentinel);
    }

    // Intersection Observer to detect when sentinel comes into view
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !isLoadingMore && hasMorePokemon) {
          console.log('Bottom of list reached, loading more Pokémon...');
          loadMorePokemon();
        }
      },
      {
        root: null, // Use viewport as root
        rootMargin: '100px', // Trigger 100px before the sentinel comes into view
        threshold: 0.1
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
      if (sentinel.parentNode) {
        sentinel.parentNode.removeChild(sentinel);
      }
    };
  }, [isAllGenerations, isLoadingMore, hasMorePokemon, loadMorePokemon, pokemonList])

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setAdvancedFilters({
      types: [],
      generation: '', // Reset to "All Generations" default
      habitat: '',
      heightRange: [0, 20],
      weightRange: [0, 1000],
      legendary: false,
      mythical: false
    })
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

  // Theme/layout selector (persists and reloads)
  const applyThemeSelection = useCallback((value: 'light'|'dark'|'red'|'gold'|'ruby') => {
    try {
      // Persist under multiple keys to interop with existing providers
      localStorage.setItem('theme', value)
      localStorage.setItem('app_theme', value)
      localStorage.setItem('layout', value)
    } catch {}
    setThemeSelection(value)
    // Soft reload to let top-level layout react to theme
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }, [])

  // Initialize theme selector reliably when landing on Modern
  useEffect(() => {
    try {
      const stored = localStorage.getItem('app_theme') || localStorage.getItem('theme') || 'light'
      const allowed = new Set(['light','dark','red','gold','ruby'])
      let normalized = allowed.has(stored || '') ? (stored as 'light'|'dark'|'red'|'gold'|'ruby') : 'light'
      // If returning from retro themes into Modern layout, default to light unless explicit dark
      if (normalized === 'red' || normalized === 'gold' || normalized === 'ruby') {
        normalized = 'light'
      }
      setThemeSelection(normalized)
    } catch {
      setThemeSelection('light')
    }
  }, [])

  return (
    <div className="h-screen bg-bg text-text flex flex-col overflow-hidden">
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
            <div className="hidden md:flex items-center space-x-4">
              {/* Card Density Controls */}
              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium text-muted uppercase tracking-wider">Size</span>
                <div className="flex items-center bg-surface border border-border rounded-xl p-1 shadow-sm">
                  {[
                    // Keep icons/labels in current visual order, rotate functionality: 2nd->1st, 3rd->2nd, 4th->3rd, 1st->4th
                    { visual: 'ultra', label: 'Ultra', target: 'ultra', showOnMobile: false },
                    { visual: 'cozy', label: 'Cozy', target: 'cozy', showOnMobile: true },
                    { visual: 'compact', label: 'Compact', target: 'compact', showOnMobile: false },
                    { visual: 'list', label: 'List', target: 'list', showOnMobile: true }
                  ].filter(({ showOnMobile }) => !isMobile || showOnMobile).map(({ visual, label, target }) => (
                    <button
                      key={visual}
                      onClick={() => setCardDensity(target as 'cozy' | 'compact' | 'ultra' | 'list')}
                      className={`px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                        cardDensity === target 
                          ? 'bg-poke-blue text-white shadow-lg scale-105' 
                          : 'text-muted hover:text-text hover:bg-white/50'
                      }`}
                    >
                      <span className="inline-flex items-center justify-center">
                        {visual === 'cozy' && (
                          <LayoutGrid className="w-4 h-4" />
                        )}
                        {visual === 'compact' && (
                          <Grid3X3 className="w-4 h-4" />
                        )}
                        {visual === 'ultra' && (
                          <Rows className="w-4 h-4" />
                        )}
                        {visual === 'list' && (
                          <List className="w-4 h-4" />
                        )}
                      </span>
                      <span className="hidden xl:inline">{label}</span>
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
                    className="px-3 py-2 bg-surface border border-border rounded-xl text-text text-sm font-medium focus:ring-2 focus:ring-poke-blue focus:border-poke-blue focus:outline-none transition-all duration-200 shadow-sm hover:shadow-md"
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
                    className="flex items-center gap-2 px-2 py-1 rounded-xl bg-surface border border-border hover:bg-white/50 hover:border-poke-blue/30 transition-all duration-200 shadow-sm hover:shadow-md group"
                    title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                  >
                    <div className={`transform transition-transform duration-200 ${sortOrder === 'asc' ? 'rotate-0' : 'rotate-180'}`}>
                      <svg className="w-4 h-4 text-muted group-hover:text-poke-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-muted group-hover:text-poke-blue">{sortOrder === 'asc' ? 'ASC' : 'DESC'}</span>
                  </button>
                </div>
              </div>

              {/* Theme/Layout Selector */}
              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium text-muted uppercase tracking-wider">Theme</span>
                <select
                  onChange={(e) => applyThemeSelection(e.target.value as 'light'|'dark'|'red'|'gold'|'ruby')}
                  value={themeSelection}
                  className="px-3 py-2 bg-surface border border-border rounded-xl text-text text-sm font-medium focus:ring-2 focus:ring-poke-blue focus:border-poke-blue focus:outline-none transition-all duration-200 shadow-sm hover:shadow-md"
                  title="Change theme"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="red">Red</option>
                  <option value="gold">Gold</option>
                  <option value="ruby">Ruby</option>
                </select>
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
              <div className="hidden md:flex items-center">
                <span className="text-xs font-medium text-muted uppercase tracking-wider mr-2">Theme</span>
                <div className="p-1 rounded-xl bg-surface border border-border shadow-sm">
                  <ThemeToggle />
                </div>
              </div>

              {/* User Profile */}
              <div className="hidden md:flex items-center">
                <UserProfile />
              </div>

              {/* Desktop Team Builder Button */}
              <button
                onClick={() => router.push('/team')}
                className="hidden md:flex items-center space-x-2 px-4 py-2 rounded-xl bg-surface border border-border text-muted hover:text-text hover:bg-white/50 hover:border-poke-blue/30 transition-all duration-200 shadow-sm hover:shadow-md"
                title="Go to Team Builder"
              >
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium">Team</span>
              </button>

              {/* Desktop Battle Button */}
              <button
                onClick={() => router.push('/battle')}
                className="hidden md:flex items-center space-x-2 px-4 py-2 rounded-xl bg-surface border border-border text-muted hover:text-text hover:bg-white/50 hover:border-poke-blue/30 transition-all duration-200 shadow-sm hover:shadow-md"
                title="Go to AI Battle"
              >
                <Swords className="h-4 w-4" />
                <span className="text-sm font-medium">Battle</span>
              </button>

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

              {/* Mobile Team Builder Button */}
              <button
                onClick={() => router.push('/team')}
                className="lg:hidden p-3 rounded-xl bg-surface border border-border text-muted hover:text-text hover:bg-white/50 hover:border-poke-blue/30 transition-all duration-200 shadow-sm hover:shadow-md"
                title="Go to Team Builder"
              >
                <Users className="h-5 w-5" />
              </button>

              {/* Mobile Battle Button */}
              <button
                onClick={() => router.push('/battle')}
                className="lg:hidden p-3 rounded-xl bg-surface border border-border text-muted hover:text-text hover:bg-white/50 hover:border-poke-blue/30 transition-all duration-200 shadow-sm hover:shadow-md"
                title="Go to AI Battle"
              >
                <Swords className="h-5 w-5" />
              </button>

              {/* Mobile Comparison Button */}
              <button
                onClick={() => router.push('/compare')}
                className="lg:hidden relative p-3 rounded-xl bg-surface border border-border text-muted hover:text-text hover:bg-white/50 hover:border-poke-blue/30 transition-all duration-200 shadow-sm hover:shadow-md"
                title="Go to comparison"
              >
                <Scale className="h-5 w-5" />
              </button>

            </div>

            {/* Mobile Menu Button - Only visible on mobile */}
            <div className="md:hidden flex items-center">
              <button
                type="button"
                onClick={() => { setShowMobileMenu(prev => !prev) }}
                className="p-3 rounded-xl bg-surface border border-border text-muted hover:text-text hover:bg-white/50 hover:border-poke-blue/30 transition-all duration-200 shadow-sm hover:shadow-md"
                title="Toggle menu"
                aria-expanded={showMobileMenu}
                aria-controls={'mobile-drawer'}
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Fallback marker removed; no desktop drawer */}

      {/* Mobile Menu Overlay - Only on small screens */}
      {showMobileMenu && isMobile && (
        <div id="mobile-drawer" className="md:hidden fixed inset-0 z-50 bg-black/95 animate-in fade-in duration-200">
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
                <label htmlFor="mobile-search" className="text-sm font-medium text-muted">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <input
                    id="mobile-search"
                    type="text"
                    placeholder="Search by name, number, or type"
                    value={searchTerm}
                    onChange={(e) => { handleSearchChange(e.target.value) }}
                    className="w-full pl-10 pr-4 py-3 border border-border rounded-xl bg-white text-text placeholder:text-muted focus:ring-2 focus:ring-poke-blue focus:border-poke-blue focus:outline-none transition-all duration-200 text-sm"
                    inputMode="search"
                    aria-label="Search Pokémon"
                  />
                </div>
              </div>

              {/* Mobile Card Density Controls */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-text uppercase tracking-wider">Card Size</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'cozy', label: 'Cozy', icon: '🟢' },
                    { id: 'list', label: 'List', icon: '📋' }
                  ].map(({ id, label, icon }) => (
                    <button
                      key={id}
                      onClick={() => {
                        setCardDensity(id as 'cozy' | 'compact' | 'ultra' | 'list')
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

              {/* Mobile Sort Controls - Segmented control */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-text uppercase tracking-wider">Sort</h4>
                <div role="group" aria-label="Sort by" className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'id', label: 'Number' },
                    { id: 'name', label: 'Name' },
                    { id: 'stats', label: 'Total' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setSortBy(opt.id as 'id' | 'name' | 'stats')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium border transition ${sortBy===opt.id? 'bg-poke-blue text-white border-poke-blue' : 'bg-white text-text border-border'}`}
                      aria-pressed={sortBy===opt.id}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Direction</span>
                  <button
                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-2 rounded-lg text-sm font-medium border border-border bg-white flex items-center space-x-2"
                    aria-label={`Sort ${sortOrder==='asc'?'descending':'ascending'}`}
                  >
                    <span>{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
                    <svg className={`w-4 h-4 transform ${sortOrder === 'asc' ? 'rotate-0' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <Users className="h-5 w-5" />
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
                    <Swords className="h-5 w-5" />
                    <span>Go to AI Battle</span>
                  </button>
                </div>
              </div>

              {/* Mobile Theme Toggle */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-text uppercase tracking-wider">Theme</h4>
                <ThemeToggle />
              </div>

              {/* Mobile User Profile */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-text uppercase tracking-wider">Account</h4>
                <UserProfile />
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

      {/* Desktop Menu Drawer disabled: header has inline controls */}

      {/* Mobile Search Bar - Only on small screens */}
      <div className="md:hidden border-b border-border bg-surface">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
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
            <UserProfile />
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

      {/* Main Content */}
      <div className="flex max-w-7xl mx-auto flex-1 min-h-0">
        {/* Sidebar - Advanced Filters */}
        <div className={`${
          showSidebar ? 'block' : 'hidden'
        } lg:block lg:w-80 border-r border-border bg-surface sticky top-0 h-full overflow-hidden`}>
          <div className="h-full flex flex-col">
            {/* Header - Fixed */}
            <div className="flex-shrink-0 p-6 border-b border-border bg-surface">
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
              <div className="text-sm text-muted mt-2">
                {filteredPokemon.length} Pokémon found
              </div>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6">
              {/* Generation Filter */}
              <div className="min-w-0">
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

              {/* Legendary and Mythical Filters */}
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
                        <picture className="mr-3">
                          <img
                            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`}
                            alt={formatPokemonName(pokemon.name)}
                            className="w-8 h-8 object-contain"
                            loading="lazy"
                            decoding="async"
                          />
                        </picture>
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
      </div>

        {/* Main Content Area */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-8">
            {/* Pokémon Grid */}
            {isFiltering ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-poke-blue mx-auto mb-4"></div>
                <p className="text-muted">Loading Pokémon...</p>
              </div>
            ) : sortedPokemon.length > 0 ? (
              <>
                <VirtualizedPokemonGrid
                  pokemonList={
                    isAllGenerations
                      ? sortedPokemon.slice(
                          Math.min(renderWindowStart, Math.max(0, sortedPokemon.length - maxRenderCount)),
                          Math.min(sortedPokemon.length, Math.max(renderWindowStart, 0) + maxRenderCount)
                        )
                      : sortedPokemon
                  }
                  onToggleComparison={onToggleComparison}
                  onSelectPokemon={undefined}
                  selectedPokemon={null}
                  comparisonList={comparisonList}
                  density={cardDensity}
                />
                {/* Infinite scroll loading indicator */}
                {isAllGenerations && isLoadingMore && (
                  <div className="text-center py-8">
                    <img src="/loading.gif" alt="Loading more Pokémon" width="50" height="50" className="mx-auto mb-2" />
                    <p className="text-muted text-sm">Loading more Pokémon...</p>
                  </div>
                )}
                {/* Manual load more removed: auto-infinite-scroll handles fetching */}
                {/* End of list indicator */}
                {isAllGenerations && !hasMorePokemon && !isLoadingMore && (
                  <div className="text-center py-8">
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

      {/* Mobile Filter Overlay */}
      {showSidebar && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-50" onClick={() => setShowSidebar(false)}>
          <div className="absolute right-0 top-0 h-full w-80 bg-surface overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="h-full flex flex-col">
              {/* Mobile Header - Fixed */}
              <div className="flex-shrink-0 p-6 border-b border-border bg-surface">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Advanced Filters</h2>
                  <button
                    onClick={() => setShowSidebar(false)}
                    className="p-1 rounded hover:bg-white/50"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                {/* Results Count */}
                <div className="text-sm text-muted mt-2">
                  {filteredPokemon.length} Pokémon found
                </div>
              </div>
              
              {/* Mobile Scrollable Content */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6">
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
                            <picture className="mr-3">
                              <img
                                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`}
                                alt={formatPokemonName(pokemon.name)}
                                className="w-8 h-8 object-contain"
                                loading="lazy"
                                decoding="async"
                              />
                            </picture>
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
          </div>
        </div>
      )}

    </div>
  )
}
