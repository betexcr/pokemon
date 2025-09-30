'use client'

import { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react'
import { Pokemon } from '@/types/pokemon'
import { getPokemon, searchPokemonByName, getPokemonTotalCount } from '@/lib/api'
import { formatPokemonName } from '@/lib/utils'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { fetchPokemonForSelector } from '@/lib/infiniteScrollFetchers'
import TypeBadge from '@/components/TypeBadge'
import Image from 'next/image'

// Memoized Pokemon item component for better performance
const PokemonItem = memo(({ 
  pokemon, 
  isSelected, 
  canSelect, 
  onPokemonClick, 
  searchTerm,
  onHover,
  onLeave
}: {
  pokemon: Pokemon
  isSelected: boolean
  canSelect: boolean
  onPokemonClick: (pokemon: Pokemon) => void
  searchTerm: string
  onHover: (pokemon: Pokemon) => void
  onLeave: () => void
}) => {
  const getShowdownAnimatedSprite = (name: string, id: number) => {
    const n = name.toLowerCase()
    // Handle known Showdown filename quirks
    const mapped = n
      .replace(/\s+/g, '')
      .replace("mr-mime", "mr.mime")
      .replace("mime-jr", "mimejr")
      .replace("type-null", "typenull")
      .replace("jangmo-o", "jangmoo")
      .replace("hakamo-o", "hakamo-o")
      .replace("kommo-o", "kommoo")
      .replace("ho-oh", "hooh")
      .replace("porygon-z", "porygonz")
      .replace("nidoran-f", "nidoranf")
      .replace("nidoran-m", "nidoranm")
    return `https://play.pokemonshowdown.com/sprites/ani/${mapped}.gif`
  }

  return (
    <button
      type="button"
      tabIndex={-1}
      onMouseDown={(e) => { e.preventDefault(); onPokemonClick(pokemon); }}
      onMouseEnter={() => onHover(pokemon)}
      onMouseLeave={onLeave}
      disabled={!canSelect && !isSelected}
      className={`w-full text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors h-12 py-2 px-3 ${
        isSelected 
          ? 'bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500' 
          : !canSelect 
            ? 'opacity-50 cursor-not-allowed' 
            : 'cursor-pointer'
      }`}
    >
      <div className="relative w-8 h-8 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
        <img
          src={searchTerm.trim() ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png` : getShowdownAnimatedSprite(pokemon.name, pokemon.id)}
          alt={pokemon.name}
          width={32}
          height={32}
          loading="lazy"
          className="w-full h-full object-contain"
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement
            target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`
          }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium capitalize text-sm text-gray-900 dark:text-gray-100">
          {formatPokemonName(pokemon.name)}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {pokemon.id !== 0 && `#${String(pokemon.id).padStart(4, '0')}`}
        </div>
      </div>
      <div className="flex gap-1 items-center">
        {pokemon.types.length > 0 ? (
          pokemon.types.map((typeObj) => {
            const typeName = typeof typeObj === 'string' ? typeObj : typeObj.type?.name
            return typeName ? (
              <TypeBadge key={`${pokemon.id}-${typeName}`} type={typeName} variant="span" />
            ) : null
          })
        ) : (
          <span className="text-xs text-gray-400">…</span>
        )}
      </div>
      {isSelected && (
        <div className="text-blue-500 text-sm">✓</div>
      )}
    </button>
  )
})

PokemonItem.displayName = 'PokemonItem'

interface PokemonSelectorProps {
  selectedPokemon: Pokemon[]
  onPokemonSelect: (pokemon: Pokemon) => void
  onPokemonRemove: (pokemonId: number) => void
  maxSelections?: number
  placeholder?: string
  className?: string
}

export default function PokemonSelector({
  selectedPokemon,
  onPokemonSelect,
  onPokemonRemove,
  maxSelections = 6,
  placeholder = "Search Pokémon by name or # (e.g., 'Lugia', '249', 'char')",
  className = ''
}: PokemonSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchResults, setSearchResults] = useState<Pokemon[] | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const scrollPositionRef = useRef<number>(0)
  
  // Simple infinite scroll state
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [offset, setOffset] = useState(0)
  const [totalCount, setTotalCount] = useState<number | null>(null)
  const hoverTimeoutRef = useRef<number | null>(null)
  const hydratedIdsRef = useRef<Set<number>>(new Set())

  // Resolve total count once when dropdown opens
  useEffect(() => {
    if (!showDropdown) return
    let cancelled = false
    const resolve = async () => {
      try {
        const total = await getPokemonTotalCount()
        if (!cancelled) setTotalCount(total)
      } catch {
        if (!cancelled) setTotalCount(1000)
      }
    }
    if (totalCount == null) resolve()
    return () => { cancelled = true }
  }, [showDropdown, totalCount])

  // Simple load more function
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    
    setLoading(true)
    setError(null)
    
    // Preserve scroll position
    const dropdown = dropdownRef.current
    if (dropdown) {
      scrollPositionRef.current = dropdown.scrollTop
    }
    
    try {
      console.log('Loading more Pokemon, offset:', offset)
      const pageSize = 100
      const newPokemon = await fetchPokemonForSelector(offset, pageSize)
      console.log('Fetched Pokemon count:', newPokemon.length)
      
      if (newPokemon.length === 0) {
        setHasMore(false)
      } else {
        setAllPokemon(prev => [...prev, ...newPokemon])
        setOffset(prev => prev + newPokemon.length)
        // End-of-list detection using totalCount if known
        if (typeof totalCount === 'number' && offset + newPokemon.length >= totalCount) {
          setHasMore(false)
        }
      }
    } catch (err) {
      console.error('Error loading Pokemon:', err)
      setError(err instanceof Error ? err.message : 'Failed to load Pokemon')
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore, offset, totalCount])

  // Background fill: continue loading batches until we reach totalCount
  useEffect(() => {
    if (!showDropdown) return
    if (totalCount == null) return
    if (allPokemon.length === 0 && !loading) {
      // kick off first load handled elsewhere
      return
    }
    if (allPokemon.length < totalCount && hasMore && !loading) {
      const id = window.setTimeout(() => {
        loadMore()
      }, 100)
      return () => window.clearTimeout(id)
    }
  }, [showDropdown, totalCount, allPokemon.length, hasMore, loading, loadMore])

  // Restore scroll position after Pokemon list updates
  useEffect(() => {
    if (dropdownRef.current && scrollPositionRef.current > 0) {
      const dropdown = dropdownRef.current
      dropdown.scrollTop = scrollPositionRef.current
    }
  }, [allPokemon.length])

  // Reset function
  const resetPokemonList = useCallback(() => {
    setAllPokemon([])
    setOffset(0)
    setHasMore(true)
    setError(null)
  }, [])

  // Load initial data when dropdown opens
  useEffect(() => {
    if (showDropdown && allPokemon.length === 0) {
      loadMore()
    }
  }, [showDropdown, allPokemon.length, loadMore])

  // Debug logging
  useEffect(() => {
    console.log('PokemonSelector state:', {
      allPokemonCount: allPokemon.length,
      loading,
      hasMore,
      error,
      showDropdown,
      offset
    })
  }, [allPokemon.length, loading, hasMore, error, showDropdown, offset])

  // Debounced remote search for names/ids beyond the locally loaded window
  useEffect(() => {
    const term = searchTerm.trim()
    if (!term) {
      setSearchResults(null)
      setSearchLoading(false)
      return
    }

    let cancelled = false
    setSearchLoading(true)
    const handle = setTimeout(async () => {
      try {
        const results = await searchPokemonByName(term)
        if (!cancelled) setSearchResults(Array.isArray(results) ? results : [])
      } catch (e) {
        if (!cancelled) setSearchResults([])
      } finally {
        if (!cancelled) setSearchLoading(false)
      }
    }, 250)

    return () => { cancelled = true; clearTimeout(handle) }
  }, [searchTerm])

  // Filter Pokemon based on search term
  const filteredPokemon = useMemo(() => {
    const term = searchTerm.trim()
    if (term) return Array.isArray(searchResults) ? searchResults : []
    return Array.isArray(allPokemon) ? allPokemon : []
  }, [allPokemon, searchResults, searchTerm])

  // Fetch Pokemon types when needed
  const fetchPokemonTypes = useCallback(async (pokemonId: number) => {
    try {
      const pokemonData = await getPokemon(pokemonId)
      // Hydrate in-place
      setAllPokemon(prev => prev.map(p => (p.id === pokemonId ? { ...pokemonData } as Pokemon : p)))
      hydratedIdsRef.current.add(pokemonId)
    } catch (error) {
      console.error(`Failed to fetch types for Pokémon ${pokemonId}:`, error)
    }
  }, [])

  // Custom scroll handler for dropdown container
  useEffect(() => {
    if (!showDropdown || !dropdownRef.current) return
    
    const dropdown = dropdownRef.current
    const handleScroll = (e: Event) => {
      // Prevent scroll from bubbling to parent elements
      e.stopPropagation()
      
      // Track scroll position
      scrollPositionRef.current = dropdown.scrollTop
      
      if (searchTerm.trim() || loading || !hasMore) return
      
      const { scrollTop, scrollHeight, clientHeight } = dropdown
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight
      
      // Load more when within 100px of bottom
      if (distanceFromBottom < 100) {
        console.log('Loading more Pokemon, current count:', allPokemon.length)
        loadMore()
      }
    }
    
    dropdown.addEventListener('scroll', handleScroll, { passive: false })
    return () => dropdown.removeEventListener('scroll', handleScroll)
  }, [showDropdown, searchTerm, loading, hasMore, loadMore, allPokemon.length])

  // Prefetch types for visible Pokemon
  useEffect(() => {
    // Skip prefetching while actively searching to avoid UI jank
    if (!showDropdown) return
    if (searchTerm.trim() || searchLoading) return
    const visible = allPokemon
    const list = Array.isArray(visible) ? visible.slice(0, 50) : []
    list.forEach(p => { 
      if ((p.types?.length || 0) === 0) fetchPokemonTypes(p.id) 
    })
  }, [showDropdown, searchLoading, searchTerm, allPokemon, fetchPokemonTypes])

  // Hover-intent hydration: fetch details when mouse stops over a row
  const handleRowHover = useCallback((p: Pokemon) => {
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
    if (hydratedIdsRef.current.has(p.id)) return
    hoverTimeoutRef.current = window.setTimeout(async () => {
      // only hydrate if still not hydrated
      if (!hydratedIdsRef.current.has(p.id)) {
        try {
          const full = await getPokemon(p.id)
          setAllPokemon(prev => prev.map(x => (x.id === p.id ? { ...full } as Pokemon : x)))
          hydratedIdsRef.current.add(p.id)
        } catch (e) {
          // ignore
        }
      }
    }, 250)
  }, [])

  const handleRowLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target || typeof target.closest !== 'function' || !target.closest('.pokemon-selector-container')) {
        setShowDropdown(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [showDropdown])

  const handlePokemonClick = async (pokemon: Pokemon) => {
    if (selectedPokemon.some(p => p.id === pokemon.id)) {
      onPokemonRemove(pokemon.id)
    } else if (selectedPokemon.length < maxSelections) {
      // Fetch full Pokemon data if we don't have complete details
      if (pokemon.types.length === 0 || (pokemon.stats?.length || 0) === 0) {
        try {
          const fullPokemon = await getPokemon(pokemon.id)
          onPokemonSelect(fullPokemon)
        } catch (error) {
          console.error('Failed to fetch Pokemon details:', error)
          onPokemonSelect(pokemon)
        }
      } else {
        onPokemonSelect(pokemon)
      }
    }
    setShowDropdown(false)
    setSearchTerm('')
  }

  const isSelected = (pokemon: Pokemon) => selectedPokemon.some(p => p.id === pokemon.id)
  const canSelect = selectedPokemon.length < maxSelections

  if (loading) {
    return (
      <div className={`pokemon-selector-container ${className}`}>
        <div className="animate-pulse bg-gray-200 rounded-lg h-12 w-full"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`pokemon-selector-container ${className}`}>
        <div className="text-red-600 text-sm p-4 border border-red-300 rounded-lg">
          Error loading Pokémon: {error}
          <button 
            onClick={resetPokemonList}
            className="ml-2 px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`pokemon-selector-container relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          style={{ 
            backgroundColor: 'var(--color-input-bg)', 
            color: 'var(--color-input-text)'
          } as React.CSSProperties}
        />
        
        {/* Selected Pokemon Count */}
        {selectedPokemon.length > 0 && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
              {selectedPokemon.length}/{maxSelections}
            </span>
          </div>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div 
          ref={dropdownRef}
          className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-2xl z-50 max-h-96 overflow-y-auto pokemon-dropdown-list" 
          style={{ 
            WebkitOverflowScrolling: 'touch',
            scrollBehavior: 'smooth'
          }}
          onWheel={(e) => {
            // Prevent wheel events from bubbling to parent
            e.stopPropagation()
          }}
          onTouchMove={(e) => {
            // Prevent touch events from bubbling to parent
            e.stopPropagation()
          }}>
          {searchLoading ? (
            <div className="p-4 text-sm text-gray-600 dark:text-gray-400">Searching…</div>
          ) : filteredPokemon.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {(searchTerm.trim() ? filteredPokemon.slice(0, 20) : filteredPokemon).map((pokemon, idx) => (
                <PokemonItem
                  key={pokemon.id} // Use stable ID instead of index
                  pokemon={pokemon}
                  isSelected={isSelected(pokemon)}
                  canSelect={canSelect}
                  onPokemonClick={handlePokemonClick}
                  searchTerm={searchTerm}
                  onHover={handleRowHover}
                  onLeave={handleRowLeave}
                />
              ))}
              
              {/* Loading indicator */}
              {!searchTerm.trim() && loading && (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p className="text-sm">Loading more Pokemon...</p>
                </div>
              )}
              
              {/* Manual load more button as fallback */}
              {!searchTerm.trim() && hasMore && !loading && allPokemon.length > 0 && (
                <div className="p-4 text-center">
                  <button
                    onClick={loadMore}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                  >
                    Load More Pokemon ({allPokemon.length} loaded)
                  </button>
                </div>
              )}
              
              {/* Scroll trigger for mobile */}
              {!searchTerm.trim() && hasMore && !loading && (
                <div className="h-4 w-full" style={{ minHeight: '16px' }} />
              )}
              
              {/* End of list indicator */}
              {!searchTerm.trim() && !hasMore && allPokemon.length > 0 && (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                  All Pokemon loaded ({allPokemon.length} total)
                </div>
              )}
              
              {/* Error state with retry */}
              {!searchTerm.trim() && error && (
                <div className="p-4 text-center">
                  <p className="text-red-600 dark:text-red-400 text-sm mb-2">{error}</p>
                  <button 
                    onClick={loadMore}
                    className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-xs hover:bg-red-200 dark:hover:bg-red-900/50"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          ) : searchTerm.trim() ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              No Pokemon found matching &quot;{searchTerm}&quot;
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">No Pokemon available</div>
          )}
        </div>
      )}

      {/* Selected Pokemon Display */}
      {selectedPokemon.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedPokemon.map((pokemon) => (
            <div
              key={pokemon.id}
              className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm"
            >
              <img
                src={`https://play.pokemonshowdown.com/sprites/ani/${pokemon.name.toLowerCase().replace(/\s+/g, '').replace("mr-mime", "mr.mime").replace("mime-jr", "mimejr").replace("type-null", "typenull").replace("jangmo-o", "jangmoo").replace("hakamo-o", "hakamo-o").replace("kommo-o", "kommoo").replace("ho-oh", "hooh").replace("porygon-z", "porygonz").replace("nidoran-f", "nidoranf").replace("nidoran-m", "nidoranm")}.gif`}
                alt={pokemon.name}
                width={20}
                height={20}
                className="w-5 h-5 object-contain"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement
                  target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`
                }}
              />
              <span className="capitalize">{formatPokemonName(pokemon.name)}</span>
              <button
                onClick={() => onPokemonRemove(pokemon.id)}
                className="text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100 ml-1"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

