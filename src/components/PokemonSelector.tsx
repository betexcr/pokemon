'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Pokemon } from '@/types/pokemon'
import { getPokemonList, getPokemon, searchPokemonByName } from '@/lib/api'
import { formatPokemonName, getShowdownAnimatedSprite } from '@/lib/utils'
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
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const [searchResults, setSearchResults] = useState<Pokemon[] | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [sentinelRef, setSentinelRef] = useState<HTMLDivElement | null>(null)

  // Load initial Pokemon data
  useEffect(() => {
    const loadInitialPokemon = async () => {
      try {
        setLoading(true)
        const pokemonList = await getPokemonList(50, 0)
        
        // Create basic Pokemon objects with minimal data
        const basicPokemon = pokemonList.results.map((pokemonRef) => {
          const pokemonId = pokemonRef.url.split('/').slice(-2)[0]
          const id = parseInt(pokemonId)
          
          return {
            id,
            name: pokemonRef.name,
            base_experience: 0,
            height: 0,
            weight: 0,
            is_default: true,
            order: id,
            abilities: [],
            forms: [],
            game_indices: [],
            held_items: [],
            location_area_encounters: '',
            moves: [],
            sprites: {
              front_default: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`,
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
                'official-artwork': {
                  front_default: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`,
                  front_shiny: null
                }
              }
            },
            stats: [],
            types: [], // Will be populated when needed
            species: { name: pokemonRef.name, url: '' }
          } as Pokemon
        })

        setAllPokemon(basicPokemon)
        setOffset(50)
        setHasMore(pokemonList.results.length === 50)
      } catch (error) {
        console.error('Error loading Pokemon:', error)
      } finally {
        setLoading(false)
      }
    }

    loadInitialPokemon()
  }, [])

  // Load more Pokemon for infinite scroll
  const loadMorePokemon = useCallback(async () => {
    if (loadingMore || !hasMore || searchTerm.trim()) return
    
    setLoadingMore(true)
    try {
      // Use the current offset as the next starting point; then advance it after successful fetch
      const newOffset = offset
      const pokemonList = await getPokemonList(30, newOffset)
      
      if (pokemonList.results.length === 0) {
        setHasMore(false)
        return
      }
      
      const newPokemon = pokemonList.results.map((pokemonRef) => {
        const pokemonId = pokemonRef.url.split('/').slice(-2)[0]
        const id = parseInt(pokemonId)
        
        return {
          id,
          name: pokemonRef.name,
          base_experience: 0,
          height: 0,
          weight: 0,
          is_default: true,
          order: id,
          abilities: [],
          forms: [],
          game_indices: [],
          held_items: [],
          location_area_encounters: '',
          moves: [],
          sprites: {
            front_default: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`,
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
              'official-artwork': {
                front_default: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`,
                front_shiny: null
              }
            }
          },
          stats: [],
          types: [],
          species: { name: pokemonRef.name, url: '' }
        } as Pokemon
      })

      setAllPokemon(prev => [...prev, ...newPokemon])
      // Asynchronously fetch types for the newly added range so badges show
      ;(async () => {
        try {
          const fulls = await Promise.allSettled(newPokemon.map(p => getPokemon(p.id)))
          const updates: Record<number, any> = {}
          fulls.forEach(res => {
            if (res.status === 'fulfilled') {
              const fp = res.value as Pokemon
              updates[fp.id] = fp.types
            }
          })
          if (Object.keys(updates).length > 0) {
            setAllPokemon(prev => prev.map(p => updates[p.id] ? { ...p, types: updates[p.id] } : p))
          }
        } catch {}
      })()
      setOffset(offset + 30)
      
      if (pokemonList.results.length < 30) {
        setHasMore(false)
      }
    } catch (error) {
      console.error('Error loading more Pokemon:', error)
    } finally {
      setLoadingMore(false)
    }
  }, [offset, hasMore, loadingMore, searchTerm])

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
      setAllPokemon(prev => prev.map(p => 
        p.id === pokemonId 
          ? { ...p, types: pokemonData.types }
          : p
      ))
    } catch (error) {
      console.error(`Failed to fetch types for Pokemon ${pokemonId}:`, error)
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

  // Handle scroll for infinite loading
  useEffect(() => {
    const handleScroll = (event: Event) => {
      const target = event.target as Element
      if (!target || typeof target.closest !== 'function') return
      const container = target.closest('.pokemon-dropdown-list') as HTMLElement | null
      if (!container) return
      
      const element = container
      const { scrollTop, scrollHeight, clientHeight } = element
      
      // Trigger load more when user scrolls to within 150px of the bottom
      // Increased threshold for better mobile experience
      if (scrollHeight - scrollTop <= clientHeight + 150) {
        loadMorePokemon()
      }
    }

    // Also handle touch events for mobile
    const handleTouchEnd = (event: TouchEvent) => {
      const target = event.target as Element
      if (!target || typeof target.closest !== 'function') return
      const container = target.closest('.pokemon-dropdown-list') as HTMLElement | null
      if (!container) return
      
      const element = container
      const { scrollTop, scrollHeight, clientHeight } = element
      
      // Check if user has scrolled near the bottom
      if (scrollHeight - scrollTop <= clientHeight + 200) {
        loadMorePokemon()
      }
    }

    if (showDropdown && !searchTerm.trim()) {
      // Add both scroll and touch event listeners for better mobile support
      document.addEventListener('scroll', handleScroll, true)
      document.addEventListener('touchend', handleTouchEnd, { passive: true })
      
      return () => {
        document.removeEventListener('scroll', handleScroll, true)
        document.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [showDropdown, searchTerm, loadMorePokemon])

  // Intersection Observer for better mobile scroll detection
  useEffect(() => {
    if (!sentinelRef || !showDropdown || searchTerm.trim()) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && hasMore && !loadingMore) {
          loadMorePokemon()
        }
      },
      {
        root: null,
        rootMargin: '100px',
        threshold: 0.1
      }
    )

    observer.observe(sentinelRef)

    return () => {
      observer.disconnect()
    }
  }, [sentinelRef, showDropdown, searchTerm, hasMore, loadingMore, loadMorePokemon])

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
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          style={{ backgroundColor: 'var(--color-input-bg)', color: 'var(--color-input-text)' }}
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
        <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-2xl z-50 max-h-96 overflow-y-auto pokemon-dropdown-list" style={{ WebkitOverflowScrolling: 'touch' }}>
          {searchLoading ? (
            <div className="p-4 text-sm text-gray-600">Searching…</div>
          ) : filteredPokemon.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {(searchTerm.trim() ? filteredPokemon.slice(0, 20) : filteredPokemon).map((pokemon, idx) => (
                <button
                  key={`${pokemon.id}-${idx}`}
                  type="button"
                  tabIndex={-1}
                  onMouseDown={(e) => { e.preventDefault(); handlePokemonClick(pokemon); }}
                  disabled={!canSelect && !isSelected(pokemon)}
                  className={`w-full text-left hover:bg-gray-50 flex items-center gap-3 transition-colors h-12 py-2 px-3 ${
                    isSelected(pokemon) 
                      ? 'bg-blue-50 border-l-4 border-blue-500' 
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
                    <div className="font-medium capitalize text-sm">
                      {formatPokemonName(pokemon.name)}
                    </div>
                    <div className="text-xs text-gray-500">
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
              {!searchTerm.trim() && loadingMore && (
                <div className="p-4 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p className="text-sm">Loading more Pokemon...</p>
                </div>
              )}
              
              {/* Intersection Observer sentinel for mobile scroll detection */}
              {!searchTerm.trim() && hasMore && !loadingMore && (
                <div ref={setSentinelRef} className="h-4 w-full" />
              )}
              
              {/* End of list indicator */}
              {!searchTerm.trim() && !hasMore && allPokemon.length > 0 && (
                <div className="p-4 text-center text-gray-500 text-sm">
                  All Pokemon loaded
                </div>
              )}
            </div>
          ) : searchTerm.trim() ? (
            <div className="p-4 text-center text-gray-500">
              No Pokemon found matching &quot;{searchTerm}&quot;
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">No Pokemon available</div>
          )}
        </div>
      )}

      {/* Selected Pokemon Display */}
      {selectedPokemon.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedPokemon.map((pokemon) => (
            <div
              key={pokemon.id}
              className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
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
                className="text-blue-600 hover:text-blue-800 ml-1"
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
