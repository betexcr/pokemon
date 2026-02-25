'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { Pokemon, FilterState } from '@/types/pokemon'
import ViewportPriorityLoader from '@/lib/viewportPriorityLoader'
import { getPokemonTotalCount, generateAllPokemonSkeletons, getPokemonList, getPokemonSkeletonsWithPagination, generateSpecialFormsPokemon, getPokemonFallbackImage, getPokemonMainPageImage, getPokemonShinyImage } from '@/lib/api'
import { useTheme } from '@/components/ThemeProvider'
import { useRequestCancellation } from '@/hooks/useRequestCancellation'
import { useViewportCancellation } from '@/hooks/useViewportCancellation'
import { useRequestAnalytics } from '@/hooks/useRequestAnalytics'
import { requestManager } from '@/lib/requestManager'
// Removed PokemonPreloader import to avoid HMR issues
// Removed sharedPokemonCache import to avoid HMR issues - implementing cache logic inline
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
  
  // Setup automatic request cancellation on navigation
  useRequestCancellation({
    contexts: ['pokedex-main']
  })

  // Setup viewport-aware cancellation to cancel off-screen Pokemon requests
  useViewportCancellation({
    enabled: true,
    bufferMargin: 1500, // Keep requests active 1500px beyond viewport
    contextPrefix: 'viewport'
  })

  // Setup request analytics for monitoring
  const analytics = useRequestAnalytics({
    autoPrune: true,
    updateInterval: 2000
  })
  
  // Analytics are being tracked but not logged to reduce console noise
  // To view analytics, check the requestManager.getAnalytics() in dev tools
  
  // Fallback for static export - get pathname from window.location
  const [actualPathname, setActualPathname] = useState(pathname)
  const [isMainPokedex, setIsMainPokedex] = useState(false)
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pathIsMain = window.location.pathname === '/'
      setActualPathname(window.location.pathname)
      setIsMainPokedex(pathIsMain)
      
      // Apply CSS classes at the document level for main pokedex
      // This is handled via CSS, but we set a data attribute for better performance
      if (pathIsMain) {
        document.documentElement.setAttribute('data-page', 'pokedex-main')
      } else {
        document.documentElement.removeAttribute('data-page')
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (typeof window !== 'undefined') {
        document.documentElement.removeAttribute('data-page')
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

  // State for Pokemon data with infinite scroll
  const [pokemonList, setPokemonList] = useState<Pokemon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMorePokemon, setHasMorePokemon] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [currentOffset, setCurrentOffset] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  
  // Refs to avoid dependency issues in callbacks
  const isLoadingMoreRef = useRef(false)
  const hasMorePokemonRef = useRef(true)
  const currentOffsetRef = useRef(0)
  const totalCountRef = useRef(0)
  const isTriggeredRef = useRef(false) // Prevent multiple intersection observer triggers
  const activeFetchRequestRef = useRef<string | null>(null) // Track active request ID for cancellation
  
  // Create wrapped fetch function with request management
  const createManagedFetch = useCallback(
    (priority: 'normal' | 'high' = 'normal') => 
      async (offset: number, limit: number): Promise<Pokemon[]> => {
        // Cancel previous low-priority request if starting a new one
        if (activeFetchRequestRef.current && priority === 'high') {
          console.log('🛑 Cancelling previous request for higher priority fetch')
          requestManager.cancelRequest(activeFetchRequestRef.current)
        }

        const { signal, requestId, startImmediately } = requestManager.createRequest('pokedex-main', priority)
        activeFetchRequestRef.current = requestId
        
        // Start request immediately if pool allows
        startImmediately()

        try {
          const data = await getPokemonList(limit, offset, signal)
          requestManager.completeRequest(requestId)
          activeFetchRequestRef.current = null
          return data.results.map((r, i) => ({
            id: i + offset + 1,
            name: r.name,
            base_experience: 0,
            height: 0,
            weight: 0,
            is_default: true,
            order: i + offset + 1,
            abilities: [],
            forms: [],
            game_indices: [],
            held_items: [],
            location_area_encounters: '',
            moves: [],
            sprites: {
              front_default: '',
              front_shiny: null,
              front_female: null,
              front_shiny_female: null,
              back_default: null,
              back_shiny: null,
              back_female: null,
              back_shiny_female: null,
              other: {
                dream_world: { front_default: null, front_female: null },
                home: { front_default: null, front_female: null, front_shiny: null, front_shiny_female: null },
                'official-artwork': { front_default: null, front_shiny: null }
              }
            },
            stats: [],
            types: [],
            species: { name: r.name, url: '' }
          })) as Pokemon[]
        } catch (error) {
          if (error instanceof Error && error.message.includes('Abort')) {
            console.log('📍 Request was cancelled')
          } else {
            console.error('Error fetching Pokemon:', error)
          }
          requestManager.completeRequest(requestId)
          throw error
        }
      },
    []
  )
  
  // Viewport priority loader for smart Pokemon loading
  const viewportLoaderRef = useRef<ViewportPriorityLoader | null>(null)
  
  // Update refs when state changes
  useEffect(() => {
    isLoadingMoreRef.current = isLoadingMore
    hasMorePokemonRef.current = hasMorePokemon
    currentOffsetRef.current = currentOffset
    totalCountRef.current = totalCount
  }, [isLoadingMore, hasMorePokemon, currentOffset, totalCount])
  
  // Initialize viewport priority loader
  useEffect(() => {
    if (!viewportLoaderRef.current) {
      viewportLoaderRef.current = new ViewportPriorityLoader((pokemon) => {
        // Update Pokemon in the list when it's loaded
        setPokemonList(prev => prev.map(p => p.id === pokemon.id ? pokemon : p))
      })
    }
  }, [])

  // Auto-retry failed Pokemon when API recovers
  useEffect(() => {
    const retryInterval = setInterval(() => {
      if (viewportLoaderRef.current) {
        viewportLoaderRef.current.retryFailedPokemon().catch(err => 
          console.warn('Error retrying failed Pokemon:', err)
        )
      }
    }, 30000) // Retry every 30 seconds

    return () => clearInterval(retryInterval)
  }, [])
  
  // Viewport-based loading on scroll - DISABLED to prevent conflicts with useViewportDataLoading
  // useEffect(() => {
  //   if (!viewportLoaderRef.current) return
    
  //   let lastScrollTop = 0
  //   let scrollDirection = 'down'
  //   let lastScrollDirection = 'down'
  //   let scrollVelocity = 0
  //   let lastScrollTime = Date.now()
    
  //   const handleScroll = () => {
  //     const scrollContainer = document.querySelector('.flex-1.min-h-0.overflow-y-auto')
  //     if (!scrollContainer) return
      
  //     const currentScrollTop = scrollContainer.scrollTop
  //     const currentTime = Date.now()
  //     const timeDelta = currentTime - lastScrollTime
      
  //     // Calculate scroll velocity for better direction detection
  //     if (timeDelta > 0) {
  //       scrollVelocity = Math.abs(currentScrollTop - lastScrollTop) / timeDelta
  //     }
      
  //     // Determine scroll direction with velocity consideration
  //     if (currentScrollTop > lastScrollTop + 5) { // Add threshold to avoid micro-movements
  //       scrollDirection = 'down'
  //     } else if (currentScrollTop < lastScrollTop - 5) {
  //       scrollDirection = 'up'
  //     }
  //     // If within threshold, keep the same direction
      
  //     // Check if scroll direction changed with velocity consideration
  //     if (scrollDirection !== lastScrollDirection && scrollVelocity > 0.5) {
  //       console.log(`🔄 Scroll direction changed: ${lastScrollDirection} → ${scrollDirection} (velocity: ${scrollVelocity.toFixed(2)})`)
  //       // Force viewport update when direction changes
  //       if (viewportLoaderRef.current && typeof viewportLoaderRef.current.forceViewportUpdate === 'function') {
  //         viewportLoaderRef.current.forceViewportUpdate()
  //       } else {
  //         console.warn('⚠️ forceViewportUpdate method not available on viewport loader')
  //       }
  //       lastScrollDirection = scrollDirection
  //     }
      
  //     // Update tracking variables
  //     lastScrollTop = currentScrollTop
  //     lastScrollTime = currentTime
      
  //     // Get all Pokemon IDs that need loading
  //     const allPokemonIds = pokemonList
  //       .filter(p => (p.types?.length || 0) === 0) // Only skeletons
  //       .map(p => p.id)
      
  //     if (allPokemonIds.length > 0) {
  //       // Load with viewport priority - always call, let the loader handle throttling
  //       viewportLoaderRef.current?.loadWithPriority(allPokemonIds)
  //     }
  //   }
    
  //   // Less aggressive throttling for better responsiveness
  //   let scrollTimeout: NodeJS.Timeout
  //   const throttledScroll = () => {
  //     clearTimeout(scrollTimeout)
  //     // Use requestAnimationFrame for smoother scrolling
  //     scrollTimeout = setTimeout(handleScroll, 8) // ~120fps for better responsiveness
  //   }
    
  //   const scrollContainer = document.querySelector('.flex-1.min-h-0.overflow-y-auto')
  //   if (scrollContainer) {
  //     scrollContainer.addEventListener('scroll', throttledScroll, { passive: true })
      
  //     // Initial load
  //     handleScroll()
      
  //     return () => {
  //       scrollContainer.removeEventListener('scroll', throttledScroll)
  //       clearTimeout(scrollTimeout)
  //     }
  //   }
  // }, [pokemonList])

  // Load initial Pokemon data - FAST SCROLL VERSION
  useEffect(() => {
    const loadInitialPokemon = async () => {
      try {
        setLoading(true)
        console.log('🚀 Loading initial Pokemon batch - FAST SCROLL...')
        
        // Load total count first
        const total = await getPokemonTotalCount()
        setTotalCount(total)
        
        // Load a much larger initial batch of skeletons for smooth scrolling
        const initialBatch = generateAllPokemonSkeletons(200)
        setPokemonList(initialBatch)
        setCurrentOffset(200)
        setLoading(false)
        
        console.log(`✅ Initial batch loaded: ${initialBatch.length} Pokemon (total: ${total})`)
        
        setError(null)
      } catch (err) {
        console.error('❌ Error loading initial Pokemon:', err)
        setError('Failed to load Pokemon list')
        // Fallback to larger skeleton batch
        const skeletons = generateAllPokemonSkeletons(200)
        setPokemonList(skeletons)
        setTotalCount(1302) // Fallback count
        setCurrentOffset(200)
        setLoading(false)
      }
    }

    loadInitialPokemon()
  }, [])

  // Load to end - load all remaining Pokemon at once
  const loadToEnd = useCallback(async () => {
    if (isLoadingMoreRef.current || !hasMorePokemonRef.current || loading) {
      console.log(`🚫 Skipping loadToEnd - already loading or no more Pokemon`)
      return
    }

    console.log(`🚀 Loading ALL remaining Pokemon to end...`)
    setIsLoadingMore(true)

    try {
      const currentOffsetValue = currentOffsetRef.current
      const remaining = totalCountRef.current - currentOffsetValue
      
      if (remaining <= 0) {
        setHasMorePokemon(false)
        setIsLoadingMore(false)
        return
      }

      console.log(`📦 Loading ${remaining} remaining Pokemon`)
      
      // Generate all remaining skeletons at once
      const newBatch = generateAllPokemonSkeletons(remaining).map((pokemon, index) => ({
        ...pokemon,
        id: currentOffsetValue + index + 1,
        name: `pokemon-${currentOffsetValue + index + 1}`,
        sprites: {
          ...pokemon.sprites,
          front_default: getPokemonFallbackImage(currentOffsetValue + index + 1),
          other: {
            ...pokemon.sprites.other,
            'official-artwork': {
              front_default: getPokemonMainPageImage(currentOffsetValue + index + 1),
              front_shiny: getPokemonShinyImage(currentOffsetValue + index + 1),
            }
          }
        }
      }))

      setPokemonList(prev => [...prev, ...newBatch])
      setCurrentOffset(totalCountRef.current)
      setHasMorePokemon(false)

      // Load special forms
      console.log('🎯 Loading special forms...')
      try {
        const specialForms = await generateSpecialFormsPokemon()
        if (specialForms.length > 0) {
          setPokemonList(prev => [...prev, ...specialForms])
          // Update total count to include special forms
          setTotalCount(prev => prev + specialForms.length)
        }
      } catch (err) {
        console.error('❌ Error loading special forms:', err)
      }

      console.log('✅ Loaded all Pokemon to end!')
    } catch (err) {
      console.error('❌ Error loading to end:', err)
    } finally {
      setIsLoadingMore(false)
    }
  }, [loading])

  // Jump to specific Pokemon index - load up to that point if needed
  const jumpToPokemonIndex = useCallback(async (targetIndex: number) => {
    if (loading) return
    
    const currentLoadedCount = currentOffsetRef.current
    
    // If already loaded, no need to load more
    if (targetIndex < currentLoadedCount) {
      return
    }
    
    setIsLoadingMore(true)
    
    try {
      const pokemonToLoad = targetIndex - currentLoadedCount + 50 // Load a bit extra for smooth scrolling
      const cappedLoad = Math.min(pokemonToLoad, totalCountRef.current - currentLoadedCount)
      
      if (cappedLoad <= 0) {
        setIsLoadingMore(false)
        return
      }
      
      console.log(`📦 Loading ${cappedLoad} Pokemon to reach index ${targetIndex}`)
      
      const newBatch = generateAllPokemonSkeletons(cappedLoad).map((pokemon, index) => ({
        ...pokemon,
        id: currentLoadedCount + index + 1,
        name: `pokemon-${currentLoadedCount + index + 1}`,
        sprites: {
          ...pokemon.sprites,
          front_default: getPokemonFallbackImage(currentLoadedCount + index + 1),
          other: {
            ...pokemon.sprites.other,
            'official-artwork': {
              front_default: getPokemonMainPageImage(currentLoadedCount + index + 1),
              front_shiny: getPokemonShinyImage(currentLoadedCount + index + 1),
            }
          }
        }
      }))
      
      setPokemonList(prev => [...prev, ...newBatch])
      const newOffset = currentLoadedCount + newBatch.length
      setCurrentOffset(newOffset)
      
      if (newOffset >= totalCountRef.current) {
        setHasMorePokemon(false)
      }
    } catch (err) {
      console.error('❌ Error jumping to Pokemon index:', err)
    } finally {
      setIsLoadingMore(false)
    }
  }, [loading])

  // Load more Pokemon function for infinite scroll
  const loadMorePokemon = useCallback(async () => {
    // Use refs to avoid dependency issues
    if (isLoadingMoreRef.current || !hasMorePokemonRef.current || loading) {
      console.log(`🚫 Skipping loadMorePokemon - isLoadingMore: ${isLoadingMoreRef.current}, hasMore: ${hasMorePokemonRef.current}, loading: ${loading}`)
      return
    }
    
    console.log(`🚀 Starting loadMorePokemon - offset: ${currentOffsetRef.current}`)
    setIsLoadingMore(true)
    
    try {
      const currentOffsetValue = currentOffsetRef.current
      console.log(`📦 Loading more Pokemon: offset=${currentOffsetValue}`)
      const batchSize = 100 // 100 skeletons per batch
      
      // Generate skeletons instantly without API calls for faster loading
      const newBatch = generateAllPokemonSkeletons(batchSize).map((pokemon, index) => ({
        ...pokemon,
        id: currentOffsetValue + index + 1,
        name: `pokemon-${currentOffsetValue + index + 1}`,
        sprites: {
          ...pokemon.sprites,
          front_default: getPokemonFallbackImage(currentOffsetValue + index + 1),
          other: {
            ...pokemon.sprites.other,
            'official-artwork': {
              front_default: getPokemonMainPageImage(currentOffsetValue + index + 1),
              front_shiny: getPokemonShinyImage(currentOffsetValue + index + 1),
            }
          }
        }
      }))
      
      // Add a minimal delay to make the loading feel more natural
      await new Promise(resolve => setTimeout(resolve, 10))
      
      if (newBatch.length === 0) {
        setHasMorePokemon(false)
        console.log('🛑 No more Pokemon to load')
      } else {
        console.log(`📥 Adding ${newBatch.length} new Pokemon to list`)
        setPokemonList(prev => {
          const newList = [...prev, ...newBatch]
          console.log(`📊 Pokemon list updated: ${prev.length} -> ${newList.length}`)
          return newList
        })
        const newOffset = currentOffsetValue + newBatch.length
        setCurrentOffset(newOffset)
        
        // Check if we've reached the end
        if (newOffset >= totalCountRef.current) {
          setHasMorePokemon(false)
          console.log('🛑 Reached total Pokemon count')
          
          // Load special forms after regular Pokemon are loaded
          console.log('🎯 Loading special forms...')
          try {
            const specialForms = await generateSpecialFormsPokemon()
            if (specialForms.length > 0) {
              setPokemonList(prev => {
                const newList = [...prev, ...specialForms]
                console.log(`🎯 Added ${specialForms.length} special forms (total: ${newList.length})`)
                return newList
              })
              // Update total count to include special forms
              setTotalCount(prev => prev + specialForms.length)
            }
          } catch (err) {
            console.error('❌ Error loading special forms:', err)
          }
        }
        
        console.log(`✅ Loaded ${newBatch.length} more Pokemon (total: ${newOffset}/${totalCountRef.current})`)
      }
    } catch (err) {
      console.error('❌ Error loading more Pokemon:', err)
      setError('Failed to load more Pokemon')
    } finally {
      setIsLoadingMore(false)
    }
  }, [loading]) // Only depend on loading state

  // Reset function for error recovery
  const resetPokemonList = useCallback(() => {
    setPokemonList([])
    setCurrentOffset(0)
    setHasMorePokemon(true)
    setError(null)
    setLoading(true)
    // Reload initial batch with larger size
    const initialBatch = generateAllPokemonSkeletons(200)
    setPokemonList(initialBatch)
    setCurrentOffset(200)
    setLoading(false)
  }, [])

  // Ref for infinite scroll sentinel with balanced preloading
  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    
    // Find the correct scroll container
    const scrollContainer = document.querySelector('.flex-1.min-h-0.overflow-y-auto')
    
    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0]
        
        if (entry.isIntersecting && !isLoadingMoreRef.current && hasMorePokemonRef.current && !isTriggeredRef.current) {
          isTriggeredRef.current = true
          
          // Temporarily disconnect observer to prevent multiple triggers
          observer.disconnect()
          
          loadMorePokemon().finally(() => {
            // Reconnect observer after loading completes
            setTimeout(() => {
              isTriggeredRef.current = false
              observer.observe(node)
            }, 100) // Reduced delay for faster reconnection
          })
        }
      },
      {
        root: scrollContainer, // Use the correct scroll container
        rootMargin: '500px', // Increased margin for earlier triggering
        threshold: 0.1
      }
    )
    
    observer.observe(node)
    
    return () => {
      observer.disconnect()
    }
  }, [loadMorePokemon]) // Only depend on loadMorePokemon

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

  // Preload visible Pokemon for better performance (implemented inline to avoid HMR issues)
  const visiblePokemonIds = useMemo(() => {
    return memoizedFilteredPokemon.slice(0, 100).map(p => p.id) // Increased for super smooth scrolling
  }, [memoizedFilteredPokemon])

  // Preloading is handled by the PokemonPreloader component in layout
  // Removed inline preloading to avoid HMR issues


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
  
  console.log('🎨 Theme check:', { theme, isModernTheme });

  // No console logging in production to avoid noise

  // Render modern layout for light/dark themes
  if (isModernTheme) {
    console.log('✅ Rendering ModernPokedexLayout');
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
        loadedCount={pokemonList.length}
        totalCount={totalCount}
        hasMorePokemon={hasMorePokemon}
        isLoadingMore={isLoadingMore}
        loadMorePokemon={loadMorePokemon}
        loadToEnd={loadToEnd}
        jumpToPokemonIndex={jumpToPokemonIndex}
        sentinelRef={(node) => {
          if (sentinelRef) {
            sentinelRef(node)
          }
        }}
      />
    );
  }

  // Render retro layouts for game themes
  console.log('🔴 Rendering RedPokedexLayout');
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

  console.log('🟡 Rendering GoldPokedexLayout');
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

  console.log('🔴 Rendering RubyPokedexLayout');
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
