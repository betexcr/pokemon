'use client'

import { useEffect, useRef, useMemo } from 'react'
import { Pokemon } from '@/types/pokemon'
import { useLazyLoading } from '@/hooks/useLazyLoading'
import ModernPokemonCard from './ModernPokemonCard'

interface LazyPokemonGridProps {
  onToggleComparison?: (id: number) => void
  onSelectPokemon?: (pokemon: Pokemon) => void
  selectedPokemon?: Pokemon | null
  comparisonList?: Pokemon[]
  density?: '3cols' | '6cols' | '9cols' | 'list'
  showSpecialForms?: boolean
}

export default function LazyPokemonGrid({
  onToggleComparison,
  onSelectPokemon,
  selectedPokemon,
  comparisonList = [],
  density = '6cols',
  showSpecialForms = true
}: LazyPokemonGridProps) {
  const lazyLoading = useLazyLoading()
  const gridRef = useRef<HTMLDivElement>(null)

  // Initialize lazy loading only once
  useEffect(() => {
    lazyLoading.initialize()
  }, [])

  // Load initial batch after initialization
  useEffect(() => {
    if (lazyLoading.state.totalCount > 0 && !lazyLoading.state.isLoading) {
      lazyLoading.loadInitialBatch()
    }
  }, [lazyLoading.state.totalCount, lazyLoading.state.isLoading])

  // Create intersection observer only once
  useEffect(() => {
    lazyLoading.createObserver()
  }, [])

  // Generate Pokemon IDs to display (all 1302 Pokemon)
  const pokemonIds = useMemo(() => {
    return Array.from({ length: 1302 }, (_, i) => i + 1)
  }, [])

  // Get grid classes based on density
  const getGridClasses = () => {
    switch (density) {
      case '3cols':
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
      case '6cols':
        return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3'
      case '9cols':
        return 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-9 gap-2'
      case 'list':
        return 'flex flex-col space-y-2'
      default:
        return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3'
    }
  }

  // Render Pokemon card or placeholder
  const renderPokemonCard = (id: number) => {
    const pokemonData = lazyLoading.getPokemonData(id)
    
    if (pokemonData === 'loading') {
      return (
        <div
          key={id}
          data-pokemon-id={id}
          className="bg-surface border border-border rounded-lg p-4 animate-pulse"
        >
          <div className="w-full h-32 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      )
    }
    
    if (pokemonData === 'error') {
      return (
        <div
          key={id}
          data-pokemon-id={id}
          className="bg-surface border border-border rounded-lg p-4 text-center"
        >
          <div className="w-full h-32 bg-gray-100 rounded mb-2 flex items-center justify-center">
            <span className="text-gray-400">Error loading #{id}</span>
          </div>
          <div className="text-sm text-gray-500">#{id}</div>
        </div>
      )
    }
    
    if (pokemonData) {
      return (
        <ModernPokemonCard
          key={id}
          pokemon={pokemonData}
          onToggleComparison={onToggleComparison || (() => {})}
          onSelect={onSelectPokemon}
          isSelected={selectedPokemon?.id === pokemonData.id}
          isInComparison={comparisonList.some(p => p.id === pokemonData.id)}
          density={density}
        />
      )
    }
    
    // Not loaded yet - create placeholder that will trigger loading when visible
    return (
      <div
        key={id}
        data-pokemon-id={id}
        className="bg-surface border border-border rounded-lg p-4"
      >
        <div className="w-full h-32 bg-gray-100 rounded mb-2 flex items-center justify-center">
          <span className="text-gray-400">#{id}</span>
        </div>
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    )
  }

  // Set up intersection observer for the grid
  useEffect(() => {
    if (lazyLoading.observer && gridRef.current) {
      const cards = gridRef.current.querySelectorAll('[data-pokemon-id]')
      cards.forEach(card => {
        lazyLoading.observer?.observe(card)
      })
    }
  }, [lazyLoading.observer])

  // Fallback: Load Pokemon if they haven't loaded after 3 seconds
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      const visibleCards = gridRef.current?.querySelectorAll('[data-pokemon-id]')
      if (visibleCards && visibleCards.length > 0) {
        // Load first 12 visible Pokemon as fallback
        for (let i = 0; i < Math.min(12, visibleCards.length); i++) {
          const card = visibleCards[i] as HTMLElement
          const pokemonId = parseInt(card.getAttribute('data-pokemon-id') || '0')
          if (pokemonId > 0 && !lazyLoading.state.pokemon.has(pokemonId)) {
            lazyLoading.loadPokemon(pokemonId)
          }
        }
      }
    }, 3000)

    return () => clearTimeout(fallbackTimer)
  }, [lazyLoading])

  if (lazyLoading.state.isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-poke-blue mx-auto mb-4"></div>
        <p className="text-muted">Initializing lazy loading...</p>
      </div>
    )
  }

  if (lazyLoading.state.error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{lazyLoading.state.error}</p>
        <button
          onClick={() => lazyLoading.initialize()}
          className="px-4 py-2 bg-poke-blue text-white rounded hover:bg-poke-blue/80"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="mb-4 text-sm text-muted">
        Showing {lazyLoading.getLoadedPokemon().length} of {lazyLoading.state.totalCount} Pokemon
      </div>
      
      <div ref={gridRef} className={getGridClasses()}>
        {pokemonIds.map(renderPokemonCard)}
      </div>
    </div>
  )
}
