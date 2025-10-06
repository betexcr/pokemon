'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { Pokemon, FilterState } from '@/types/pokemon'
import { getPokemonTotalCount, generateAllPokemonSkeletons, getPokemonList, getPokemonSkeletonsWithPagination, generateSpecialFormsPokemon, getPokemonFallbackImage, getPokemonMainPageImage, getPokemonShinyImage } from '@/lib/api'
import { ViewportPriorityLoader } from '@/lib/viewportPriorityLoader'
import { useTheme } from '@/components/ThemeProvider'
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
  console.log('🚀 Home component loaded - NEW VERSION')
  const pathname = usePathname()
  
  // Fallback for static export - get pathname from window.location
  const [actualPathname, setActualPathname] = useState(pathname)
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setActualPathname(window.location.pathname)
      
      // Add/remove pokedex-main-page class based on current path
      // Only the main PokéDex page should have scroll disabled
      if (window.location.pathname === '/') {
        document.body.classList.add('pokedex-main-page')
        // Also disable root scrollbars to ensure only component scrollbar is visible
        document.documentElement.classList.add('pokedex-root')
      } else {
        document.body.classList.remove('pokedex-main-page')
        document.documentElement.classList.remove('pokedex-root')
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (typeof window !== 'undefined') {
        document.body.classList.remove('pokedex-main-page')
        document.documentElement.classList.remove('pokedex-root')
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
    console.log('🔗 Sentinel ref callback called with node:', !!node)
    if (!node) return
    
    console.log('👁️ Setting up intersection observer for sentinel')
    // Find the correct scroll container
    const scrollContainer = document.querySelector('.flex-1.min-h-0.overflow-y-auto')
    console.log('📦 Scroll container found:', !!scrollContainer)
    
    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0]
        console.log('🔍 Intersection observer triggered:', {
          isIntersecting: entry.isIntersecting,
          isLoadingMore: isLoadingMoreRef.current,
          hasMorePokemon: hasMorePokemonRef.current,
          currentOffset: currentOffsetRef.current,
          totalCount: totalCountRef.current,
          isTriggered: isTriggeredRef.current
        })
        
        if (entry.isIntersecting && !isLoadingMoreRef.current && hasMorePokemonRef.current && !isTriggeredRef.current) {
          isTriggeredRef.current = true
          console.log('🚀 Sentinel triggered - loading more Pokemon')
          
          // Temporarily disconnect observer to prevent multiple triggers
          observer.disconnect()
          
          loadMorePokemon().finally(() => {
            // Reconnect observer after loading completes
            setTimeout(() => {
              isTriggeredRef.current = false
              observer.observe(node)
              console.log('🔄 Observer reconnected after loading')
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
    console.log('✅ Intersection observer attached to sentinel')
    
    return () => {
      console.log('🧹 Cleaning up intersection observer')
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
  
  // No console logging in production to avoid noise

  // Render modern layout for light/dark themes
  if (isModernTheme) {
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
        sentinelRef={(node) => {
          console.log('🔗 Page component sentinelRef called with:', !!node, 'sentinelRef type:', typeof sentinelRef)
          if (sentinelRef) {
            sentinelRef(node)
          }
        }}
      />
    );
  }

  // Render retro layouts for game themes
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
