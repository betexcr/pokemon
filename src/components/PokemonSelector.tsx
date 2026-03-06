'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Pokemon } from '@/types/pokemon'
import { getPokemon, getPokemonList, getPokemonFallbackImage } from '@/lib/api'
import { formatPokemonName } from '@/lib/utils'
import TypeBadge from '@/components/TypeBadge'

interface PokemonSelectorProps {
  selectedPokemon: Pokemon[]
  onPokemonSelect: (pokemon: Pokemon) => void
  onPokemonRemove: (pokemonId: number) => void
  maxSelections?: number
  placeholder?: string
  className?: string
  showSelectedPreview?: boolean
  inputRef?: React.Ref<HTMLInputElement>
}

function buildSkeletonPokemon(id: number, name: string): Pokemon {
  return {
    id,
    name,
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
      front_default: getPokemonFallbackImage(id),
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
          front_default: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
          front_shiny: null
        }
      }
    },
    stats: [],
    types: [],
    species: { name, url: '' }
  } as Pokemon
}

function getShowdownSprite(name: string) {
  const mapped = name.toLowerCase()
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

export default function PokemonSelector({
  selectedPokemon,
  onPokemonSelect,
  onPokemonRemove,
  maxSelections = 6,
  placeholder = "Search Pokémon by name or # (e.g., 'Lugia', '249', 'char')",
  className = '',
  showSelectedPreview = true,
  inputRef
}: PokemonSelectorProps) {
  const DROPDOWN_ROW_HEIGHT = 48
  const DROPDOWN_OVERSCAN = 25
  const DROPDOWN_VIEWPORT_HEIGHT = 384

  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [dropdownScrollTop, setDropdownScrollTop] = useState(0)
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const scrollTopRef = useRef(0)
  const rafIdRef = useRef(0)
  const indicatorRef = useRef<HTMLDivElement | null>(null)
  const indicatorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Clean up rAF and indicator timer on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafIdRef.current)
      if (indicatorTimerRef.current) clearTimeout(indicatorTimerRef.current)
    }
  }, [])

  // Load all Pokemon names in a single API call on mount
  useEffect(() => {
    let cancelled = false

    const loadAll = async () => {
      try {
        setLoading(true)
        const list = await getPokemonList(1500, 0)
        if (cancelled) return

        const pokemon = list.results
          .map((ref) => {
            const idStr = ref.url?.split('/').slice(-2)[0]
            if (!idStr) return null
            const id = parseInt(idStr)
            if (isNaN(id) || id <= 0) return null
            return buildSkeletonPokemon(id, ref.name)
          })
          .filter(Boolean) as Pokemon[]

        setAllPokemon(pokemon)
        setError(null)
      } catch (e) {
        if (!cancelled) {
          console.error('Failed to load Pokemon list:', e)
          setError(e instanceof Error ? e.message : 'Failed to load Pokemon')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadAll()
    return () => { cancelled = true }
  }, [])

  // Local search against the full list
  const filteredPokemon = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return allPokemon

    const normalizedTerm = term.replace(/[- ]/g, '')

    return allPokemon.filter(p => {
      const name = p.name.toLowerCase()
      const id = p.id.toString()
      const normalizedName = name.replace(/[- ]/g, '')
      return name.includes(term) || id.startsWith(term) || normalizedName.includes(normalizedTerm)
    })
  }, [allPokemon, searchTerm])

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

  const handlePokemonClick = (pokemon: Pokemon) => {
    if (selectedPokemon.length < maxSelections) {
      onPokemonSelect(pokemon)
      setShowDropdown(false)
      setSearchTerm('')
      setDropdownScrollTop(0)
      scrollTopRef.current = 0
    }
  }

  const canSelect = selectedPokemon.length < maxSelections

  // Ensure type badges for selected Pokemon by fetching missing types
  const [selectedTypes, setSelectedTypes] = useState<Record<number, string[]>>({})
  useEffect(() => {
    let cancelled = false
    const ensureTypes = async () => {
      const updates: Record<number, string[]> = {}
      for (const p of selectedPokemon) {
        const existing = (p.types || []) as any
        if (Array.isArray(existing) && existing.length > 0) {
          const names = existing.map((t: any) => (typeof t === 'string' ? t : t.type?.name)).filter(Boolean)
          updates[p.id] = names
          continue
        }
        try {
          const full = await getPokemon(p.id)
          const names = (full.types || []).map((t: any) => (typeof t === 'string' ? t : t.type?.name)).filter(Boolean)
          updates[p.id] = names
        } catch {}
      }
      if (!cancelled) setSelectedTypes(prev => ({ ...prev, ...updates }))
    }
    if (selectedPokemon.length > 0) ensureTypes()
    return () => { cancelled = true }
  }, [selectedPokemon])

  // Virtualization: compute which rows to render based on scroll position
  const displayList = searchTerm.trim() ? filteredPokemon : allPokemon

  const virtualization = useMemo(() => {
    const totalItems = displayList.length
    const visibleCount = Math.ceil(DROPDOWN_VIEWPORT_HEIGHT / DROPDOWN_ROW_HEIGHT) + DROPDOWN_OVERSCAN * 2
    const startIndex = Math.max(0, Math.floor(dropdownScrollTop / DROPDOWN_ROW_HEIGHT) - DROPDOWN_OVERSCAN)
    const endIndex = Math.min(totalItems, startIndex + visibleCount)

    return {
      startIndex,
      endIndex,
      totalHeight: totalItems * DROPDOWN_ROW_HEIGHT,
      offsetY: startIndex * DROPDOWN_ROW_HEIGHT,
    }
  }, [displayList.length, dropdownScrollTop])

  const visiblePokemon = useMemo(() => {
    return displayList.slice(virtualization.startIndex, virtualization.endIndex)
  }, [displayList, virtualization.startIndex, virtualization.endIndex])

  // Show the floating indicator with the current Pokemon # range
  const showIndicator = useCallback((scrollTop: number) => {
    const wrapper = indicatorRef.current
    if (!wrapper || displayList.length === 0) return

    const midIndex = Math.min(
      displayList.length - 1,
      Math.floor((scrollTop + DROPDOWN_VIEWPORT_HEIGHT / 2) / DROPDOWN_ROW_HEIGHT)
    )
    const pokemon = displayList[midIndex]
    const label = wrapper.querySelector('span')
    if (pokemon && label) {
      label.textContent = `#${pokemon.id}`
      wrapper.style.opacity = '1'
    }

    if (indicatorTimerRef.current) clearTimeout(indicatorTimerRef.current)
    indicatorTimerRef.current = setTimeout(() => {
      if (indicatorRef.current) indicatorRef.current.style.opacity = '0'
    }, 600)
  }, [displayList])

  // rAF-batched scroll handler: updates state at most once per frame
  const handleDropdownScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = event.currentTarget.scrollTop
    scrollTopRef.current = newScrollTop

    // Update indicator immediately via DOM ref (no React re-render)
    showIndicator(newScrollTop)

    cancelAnimationFrame(rafIdRef.current)
    rafIdRef.current = requestAnimationFrame(() => {
      setDropdownScrollTop(scrollTopRef.current)
    })
  }, [showIndicator])

  const isInitialLoading = loading && allPokemon.length === 0

  if (isInitialLoading) {
    return (
      <div className={`pokemon-selector-container ${className}`}>
        <div className="animate-pulse bg-gray-200 rounded-lg h-12 w-full"></div>
      </div>
    )
  }

  if (error && allPokemon.length === 0) {
    return (
      <div className={`pokemon-selector-container ${className}`}>
        <div className="text-red-600 text-sm p-4 border border-red-300 rounded-lg">
          <div className="mb-2">
            <strong>Error loading Pokémon:</strong> {error}
          </div>
          <div className="mb-3 text-xs text-gray-600">
            This might be due to network connectivity or API issues. Please try again.
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const renderRow = (pokemon: Pokemon, idx: number) => (
    <button
      key={`${pokemon.id}-${virtualization.startIndex + idx}`}
      type="button"
      tabIndex={-1}
      onMouseDown={(e) => { e.preventDefault(); handlePokemonClick(pokemon); }}
      disabled={!canSelect}
      className={`w-full text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors py-2 px-3 ${
        !canSelect ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
      style={{ height: `${DROPDOWN_ROW_HEIGHT}px` }}
    >
      <div className="relative w-8 h-8 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
        <img
          src={getShowdownSprite(pokemon.name)}
          alt={pokemon.name}
          width={32}
          height={32}
          loading="lazy"
          className="w-full h-full object-contain"
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement
            target.src = getPokemonFallbackImage(pokemon.id)
          }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium capitalize text-sm text-gray-900 dark:text-gray-100">
          {formatPokemonName(pokemon.name)}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          #{String(pokemon.id).padStart(4, '0')}
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
    </button>
  )

  return (
    <div className={`pokemon-selector-container relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setDropdownScrollTop(0)
            if (dropdownRef.current) dropdownRef.current.scrollTop = 0
          }}
          onFocus={() => { setShowDropdown(true); setDropdownScrollTop(0); scrollTopRef.current = 0 }}
          onClick={() => { setShowDropdown(true); setDropdownScrollTop(0); scrollTopRef.current = 0 }}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          style={{
            backgroundColor: 'var(--color-input-bg)',
            color: 'var(--color-input-text)'
          } as React.CSSProperties}
        />

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
        <div className="absolute top-full left-0 w-full mt-1 z-50">
          {/* Floating scroll position indicator — outside scroll container to avoid clipping */}
          <div
            ref={indicatorRef}
            className="absolute top-1/2 right-4 -translate-y-1/2 z-[60] pointer-events-none"
            style={{ opacity: 0, transition: 'opacity 0.2s ease-out' }}
          >
            <span className="bg-gray-900/80 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm whitespace-nowrap">
              …
            </span>
          </div>

          <div
            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-2xl max-h-96 overflow-y-auto pokemon-dropdown-list overscroll-contain"
            style={{ WebkitOverflowScrolling: 'touch' }}
            onScroll={handleDropdownScroll}
            onWheel={(e) => {
              const el = e.currentTarget
              const atTop = el.scrollTop === 0 && e.deltaY < 0
              const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight && e.deltaY > 0
              if (atTop || atBottom) {
                e.preventDefault()
              }
            }}
            ref={dropdownRef}
          >
          {displayList.length > 0 ? (
            <div style={{ height: `${virtualization.totalHeight}px`, position: 'relative' }}>
              <div style={{ transform: `translateY(${virtualization.offsetY}px)`, willChange: 'transform' }}>
                {visiblePokemon.map((pokemon, idx) => renderRow(pokemon, idx))}
              </div>
            </div>
          ) : searchTerm.trim() ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              No Pokémon found matching &quot;{searchTerm}&quot;
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <p className="text-sm">Loading Pokémon…</p>
            </div>
          )}
          </div>
        </div>
      )}

      {/* Selected Pokemon Display */}
      {showSelectedPreview && selectedPokemon.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedPokemon.map((pokemon, idx) => (
            <div
              key={`${pokemon.id}-${idx}`}
              className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-3 py-2 rounded-xl text-sm"
            >
              <img
                src={getShowdownSprite(pokemon.name)}
                alt={pokemon.name}
                width={24}
                height={24}
                className="w-6 h-6 object-contain"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement
                  target.src = getPokemonFallbackImage(pokemon.id)
                }}
              />
              <div className="flex flex-col">
                <span className="capitalize leading-4">{formatPokemonName(pokemon.name)}</span>
                <div className="flex gap-1 mt-1">
                  {(selectedTypes[pokemon.id] || (pokemon.types || []).map((t: any) => (typeof t === 'string' ? t : t.type?.name)).filter(Boolean)).map((typeName: string) => (
                    <TypeBadge key={`${pokemon.id}-sel-${typeName}`} type={typeName} variant="span" className="px-1 py-0.5 text-[10px]" />
                  ))}
                </div>
              </div>
              <button
                onClick={() => onPokemonRemove(pokemon.id)}
                className="text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100 ml-1"
                aria-label={`Remove ${formatPokemonName(pokemon.name)}`}
                title={`Remove ${formatPokemonName(pokemon.name)}`}
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
