'use client'

import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef, useMemo } from 'react'
import { Pokemon } from '@/types/pokemon'
import ModernPokemonCard from './ModernPokemonCard'

interface ModernVirtualizedGridProps {
  pokemonList: Pokemon[]
  onToggleComparison: (id: number) => void
  onSelectPokemon: (pokemon: Pokemon) => void
  selectedPokemon: Pokemon | null
  comparisonList: number[]
  className?: string
  containerHeight?: number
}

export default function ModernVirtualizedGrid({
  pokemonList,
  onToggleComparison,
  onSelectPokemon,
  selectedPokemon,
  comparisonList,
  className = '',
  containerHeight = 600
}: ModernVirtualizedGridProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  // Calculate responsive grid columns
  // const getGridColumns = useMemo(() => {
  //   // This will be handled by CSS grid with auto-fit
  //   return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
  // }, [])

  // Calculate items per row based on container width
  const getItemsPerRow = useMemo(() => {
    if (typeof window === 'undefined') return 4
    
    const containerWidth = parentRef.current?.clientWidth || 1200
    if (containerWidth < 640) return 2      // sm
    if (containerWidth < 768) return 3      // md
    if (containerWidth < 1024) return 4     // lg
    if (containerWidth < 1280) return 5     // xl
    return 6                                // 2xl+
  }, [])

  // Create rows of Pokémon
  const rows = useMemo(() => {
    const result = []
    for (let i = 0; i < pokemonList.length; i += getItemsPerRow) {
      result.push(pokemonList.slice(i, i + getItemsPerRow))
    }
    return result
  }, [pokemonList, getItemsPerRow])

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 320, // Approximate card height
    overscan: 5,
  })

  const virtualItems = virtualizer.getVirtualItems()

  return (
    <div className={`${className}`}>
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ height: containerHeight }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualItem) => {
            const row = rows[virtualItem.index]
            return (
              <div
                key={virtualItem.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                className="p-4"
              >
                <div className={`
                  grid gap-4 auto-rows-fr
                  grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6
                `}>
                  {row.map((pokemon) => (
                    <ModernPokemonCard
                      key={pokemon.id}
                      pokemon={pokemon}
                      isInComparison={comparisonList.includes(pokemon.id)}
                      onToggleComparison={onToggleComparison}
                      onSelect={onSelectPokemon}
                      isSelected={selectedPokemon?.id === pokemon.id}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
