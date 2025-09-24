'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Pokemon } from '@/types/pokemon'
import { getPokemon, searchPokemonByName } from '@/lib/api'
import { formatPokemonName, getShowdownAnimatedSprite } from '@/lib/utils'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { fetchPokemonForSelector } from '@/lib/infiniteScrollFetchers'
import TypeBadge from '@/components/TypeBadge'
import Image from 'next/image'

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
  
  // Use secure infinite scroll hook for PokemonSelector
  const {
    data: allPokemon,
    loading,
    hasMore,
    error,
    loadMore,
    reset: resetPokemonList,
    sentinelRef
  } = useInfiniteScroll<Pokemon>(
    fetchPokemonForSelector,
    {
      fetchSize: 30, // 30 items per fetch for selector
      initialLoad: true,
      enabled: true,
      retryAttempts: 3,
      retryDelay: 1000,
      scrollThreshold: 200,
      rootMargin: '200px',
      threshold: 0.1
    }
  )

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
      // Note: This will be handled by the infinite scroll hook
      // We can't directly update allPokemon here since it's managed by the hook
      console.log(`Fetched types for Pokémon ${pokemonId}:`, pokemonData.types)
    } catch (error) {
      console.error(`Failed to fetch types for Pokémon ${pokemonId}:`, error)
    }
  }, [])

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
        <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-2xl z-50 max-h-96 overflow-y-auto pokemon-dropdown-list" style={{ WebkitOverflowScrolling: 'touch' }}>
          {searchLoading ? (
            <div className="p-4 text-sm text-gray-600 dark:text-gray-400">Searching…</div>
          ) : filteredPokemon.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {(searchTerm.trim() ? filteredPokemon.slice(0, 20) : filteredPokemon).map((pokemon, idx) => (
                <button
                  key={`${pokemon.id}-${idx}`}
                  type="button"
                  tabIndex={-1}
                  onMouseDown={(e) => { e.preventDefault(); handlePokemonClick(pokemon); }}
                  disabled={!canSelect && !isSelected(pokemon)}
                  className={`w-full text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors h-12 py-2 px-3 ${
                    isSelected(pokemon) 
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
                  {isSelected(pokemon) && (
                    <div className="text-blue-500 text-sm">✓</div>
                  )}
                </button>
              ))}
              
              {/* Loading indicator */}
              {!searchTerm.trim() && loading && (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p className="text-sm">Loading more Pokemon...</p>
                </div>
              )}
              
              {/* Intersection Observer sentinel for mobile scroll detection */}
              {!searchTerm.trim() && hasMore && !loading && (
                <div ref={sentinelRef} className="h-4 w-full" />
              )}
              
              {/* End of list indicator */}
              {!searchTerm.trim() && !hasMore && allPokemon.length > 0 && (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                  All Pokemon loaded
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
                src={getShowdownAnimatedSprite(pokemon.name, pokemon.id)}
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

