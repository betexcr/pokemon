import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Pokemon } from '@/types/pokemon'
import { getPokemonList, getPokemon } from '@/lib/api'
import { formatPokemonName } from '@/lib/utils'
import Image from 'next/image'
import TypeBadge from './TypeBadge'
import { Search, X } from 'lucide-react'

interface PokemonSearchProps {
  onSelectPokemon: (pokemon: Pokemon) => void
  placeholder?: string
  className?: string
  maxHeight?: string
  showImages?: boolean
  showTypes?: boolean
  showStats?: boolean
  disabled?: boolean
}

const INITIAL_LOAD_COUNT = 50
const LOAD_MORE_COUNT = 20

export default function PokemonSearch({
  onSelectPokemon,
  placeholder = "Search Pokémon by name or #...",
  className = "",
  maxHeight = "max-h-96",
  showImages = true,
  showTypes = true,
  showStats = false,
  disabled = false
}: PokemonSearchProps) {
  const [search, setSearch] = useState('')
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [currentOffset, setCurrentOffset] = useState(INITIAL_LOAD_COUNT)
  // const [searchLoading, setSearchLoading] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const lastPokemonRef = useRef<HTMLDivElement | null>(null)

  // Load initial 50 Pokémon
  useEffect(() => {
    const loadInitialPokemon = async () => {
      try {
        setLoading(true)
        const pokemonList = await getPokemonList(INITIAL_LOAD_COUNT, 0)
        
        // Fetch full Pokémon data for the first 50
        const pokemonPromises = pokemonList.results.map(async (pokemonRef) => {
          const url = (pokemonRef as { url?: string }).url || ''
          if (!url) return null
          const pokemonId = url.split('/').slice(-2)[0]
          const id = parseInt(pokemonId)
          
          try {
            const pokemonData = await getPokemon(id)
            return {
              id,
              name: pokemonRef.name,
              base_experience: pokemonData.base_experience || 0,
              height: pokemonData.height || 0,
              weight: pokemonData.weight || 0,
              is_default: pokemonData.is_default || true,
              order: pokemonData.order || id,
              abilities: pokemonData.abilities || [],
              forms: pokemonData.forms || [],
              game_indices: pokemonData.game_indices || [],
              held_items: pokemonData.held_items || [],
              location_area_encounters: pokemonData.location_area_encounters || '',
              moves: pokemonData.moves || [],
              sprites: pokemonData.sprites || {
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
              stats: pokemonData.stats || [],
              types: pokemonData.types || [],
              species: pokemonData.species || { name: '', url: '' }
            } as Pokemon
          } catch (error) {
            console.error(`Failed to fetch basic data for Pokémon ${id}:`, error)
            // Fallback to basic object
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
              species: { name: '', url: '' }
            } as Pokemon
          }
        })

        const loadedPokemon = (await Promise.all(pokemonPromises)).filter(Boolean) as Pokemon[]
        setAllPokemon(loadedPokemon)
      } catch (err) {
        console.error('Failed to load initial Pokémon:', err)
      } finally {
        setLoading(false)
      }
    }

    loadInitialPokemon()
  }, [])

  // Load more Pokémon when scrolling
  const loadMorePokemon = useCallback(async () => {
    if (loadingMore || !hasMore) return

    try {
      setLoadingMore(true)
      const pokemonList = await getPokemonList(LOAD_MORE_COUNT, currentOffset)
      
      if (pokemonList.results.length === 0) {
        setHasMore(false)
        return
      }

      // Fetch full Pokémon data for the next batch
      const pokemonPromises = pokemonList.results.map(async (pokemonRef) => {
        const url = (pokemonRef as { url?: string }).url || ''
        if (!url) return null
        const pokemonId = url.split('/').slice(-2)[0]
        const id = parseInt(pokemonId)
        
        try {
          const pokemonData = await getPokemon(id)
          return {
            id,
            name: pokemonRef.name,
            base_experience: pokemonData.base_experience || 0,
            height: pokemonData.height || 0,
            weight: pokemonData.weight || 0,
            is_default: pokemonData.is_default || true,
            order: pokemonData.order || id,
            abilities: pokemonData.abilities || [],
            forms: pokemonData.forms || [],
            game_indices: pokemonData.game_indices || [],
            held_items: pokemonData.held_items || [],
            location_area_encounters: pokemonData.location_area_encounters || '',
            moves: pokemonData.moves || [],
            sprites: pokemonData.sprites || {
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
            stats: pokemonData.stats || [],
            types: pokemonData.types || [],
            species: pokemonData.species || { name: '', url: '' }
          } as Pokemon
        } catch (error) {
          console.error(`Failed to fetch data for Pokémon ${id}:`, error)
          // Fallback to basic object
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
            species: { name: '', url: '' }
          } as Pokemon
        }
      })

      const newPokemon = (await Promise.all(pokemonPromises)).filter(Boolean) as Pokemon[]
      setAllPokemon(prev => [...prev, ...newPokemon])
      setCurrentOffset(prev => prev + LOAD_MORE_COUNT)
    } catch (err) {
      console.error('Failed to load more Pokémon:', err)
    } finally {
      setLoadingMore(false)
    }
  }, [currentOffset, loadingMore, hasMore])

  // Intersection Observer for infinite scrolling
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMorePokemon()
        }
      },
      { threshold: 0.1 }
    )

    if (lastPokemonRef.current) {
      observerRef.current.observe(lastPokemonRef.current)
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect()
    }
  }, [loadMorePokemon, hasMore, loadingMore])

  // Filter Pokémon based on search
  const filteredPokemon = useMemo(() => {
    if (!search.trim()) return allPokemon

    const query = search.toLowerCase().trim()
    
    // Check for exact ID match (1-500 range)
    if (/^\d+$/.test(query)) {
      const id = parseInt(query)
      if (id >= 1 && id <= 500) {
        const exactMatch = allPokemon.find(p => p.id === id)
        if (exactMatch) return [exactMatch]
      }
    }

    // Filter by name or ID (partial match)
    return allPokemon.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.id.toString().includes(query)
    ).slice(0, 50) // Limit search results to 50
  }, [allPokemon, search])

  // Clear search
  const clearSearch = () => setSearch('')

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <img src="/loading.gif" alt="Loading Pokémon" width={100} height={100} className="mx-auto mb-4" />
          <p className="text-muted">Loading Pokémon...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-10 pr-10 py-2 border border-border rounded-lg focus:ring-2 focus:ring-poke-blue focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: 'var(--color-input-bg)', color: 'var(--color-input-text)' }}
        />
        {search && (
          <button
            onClick={clearSearch}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 transition-colors"
            title="Clear search"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>

      {/* Results */}
      <div className={`overflow-y-auto ${maxHeight} divide-y divide-border`}>
        {filteredPokemon.length === 0 && search.trim() ? (
          <div className="py-4 text-center text-muted">
            No Pokémon found. Try a different search term.
          </div>
        ) : filteredPokemon.length === 0 ? (
          <div className="py-4 text-center text-muted">
            Start typing to search for Pokémon...
          </div>
        ) : (
          filteredPokemon.map((pokemon) => (
            <div
              key={pokemon.id}
              ref={pokemon.id === filteredPokemon[filteredPokemon.length - 1]?.id ? lastPokemonRef : null}
              className="py-3 px-3 hover:bg-white/60 transition-colors cursor-pointer"
              onClick={() => onSelectPokemon(pokemon)}
            >
              <div className="flex items-center gap-3">
                {showImages && (
                  <div className="flex-shrink-0">
                    <Image
                      src={pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default || ''}
                      alt={pokemon.name}
                      width={48}
                      height={48}
                      className="w-12 h-12 object-contain"
                    />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium capitalize text-text">
                      {formatPokemonName(pokemon.name)}
                    </span>
                    {pokemon.id !== 0 && <span className="text-sm text-muted">#{pokemon.id}</span>}
                  </div>
                  
                  {showTypes && pokemon.types.length > 0 && (
                    <div className="flex gap-1">
                      {pokemon.types.map((type) => (
                        <TypeBadge key={type.type.name} type={type.type.name} variant="span" />
                      ))}
                    </div>
                  )}
                  
                  {showStats && pokemon.stats.length > 0 && (
                    <div className="text-xs text-muted mt-1">
                      HP: {pokemon.stats.find(s => s.stat.name === 'hp')?.base_stat || '—'} | 
                      ATK: {pokemon.stats.find(s => s.stat.name === 'attack')?.base_stat || '—'} | 
                      DEF: {pokemon.stats.find(s => s.stat.name === 'defense')?.base_stat || '—'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        
        {/* Loading more indicator */}
        {loadingMore && (
          <div className="py-3 px-3 text-center">
            <div className="inline-flex items-center gap-2 text-muted">
              <img src="/loading.gif" alt="Loading more" width={16} height={16} className="opacity-80" />
              <span className="text-sm">Loading more...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

