'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pokemon } from '@/types/pokemon'
import { formatPokemonName } from '@/lib/utils'
import { getPokemonMainPageImage } from '@/lib/api'
import { Scale, X, ChevronUp, ChevronDown } from 'lucide-react'
import Button from './ui/Button'

interface ComparisonOverlayProps {
  comparisonList: number[]
  pokemonList: Pokemon[]
  onRemoveFromComparison: (id: number) => void
  onClearComparison: () => void
}

export default function ComparisonOverlay({
  comparisonList,
  pokemonList,
  onRemoveFromComparison,
  onClearComparison
}: ComparisonOverlayProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [sortBy, setSortBy] = useState<'total' | 'hp' | 'attack' | 'defense' | 'special-attack' | 'special-defense' | 'speed'>('total')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const router = useRouter()

  if (comparisonList.length === 0) {
    return null
  }

  const selectedPokemon = pokemonList.filter(pokemon => 
    comparisonList.includes(pokemon.id)
  )

  const handleGoToComparison = () => {
    const params = new URLSearchParams({ sort: sortBy, order: sortOrder })
    router.push(`/compare?${params.toString()}`)
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Collapsible Container */}
      <div className={`
        bg-surface border border-border rounded-lg shadow-lg transition-all duration-300
        ${isExpanded ? 'w-80' : 'w-16'}
      `}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border">
          <div className="flex items-center space-x-2">
            <Scale className="h-5 w-5 text-blue-500" />
            {isExpanded && (
              <span className="text-sm font-medium">
                {comparisonList.length} Pokémon selected
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            {isExpanded && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGoToComparison}
                className="text-xs"
              >
                Compare
              </Button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        {isExpanded && (
          <div className="p-3 space-y-3">
            {/* Sorting Controls */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted">Sort by</label>
              <select
                className="flex-1 h-8 rounded-md border border-border bg-surface px-2 text-xs"
                value={sortBy}
                onChange={(e)=> setSortBy(e.target.value as typeof sortBy)}
              >
                <option value="total">Total</option>
                <option value="hp">HP</option>
                <option value="attack">Attack</option>
                <option value="defense">Defense</option>
                <option value="special-attack">Sp. Atk</option>
                <option value="special-defense">Sp. Def</option>
                <option value="speed">Speed</option>
              </select>
              <button
                className="h-8 px-2 rounded-md border border-border text-xs"
                onClick={()=> setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                aria-label="Toggle sort order"
              >
                {sortOrder === 'asc' ? 'ASC' : 'DESC'}
              </button>
            </div>
            {/* Pokémon List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {selectedPokemon.map((pokemon) => (
                <div
                  key={pokemon.id}
                  className="flex items-center space-x-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getPokemonMainPageImage(pokemon.id)}
                    alt={formatPokemonName(pokemon.name)}
                    className="w-8 h-8 object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {formatPokemonName(pokemon.name)}
                    </p>
                    <p className="text-xs text-muted">
                      #{String(pokemon.id).padStart(3, '0')}
                    </p>
                  </div>
                  <button
                    onClick={() => onRemoveFromComparison(pokemon.id)}
                    className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
                    aria-label={`Remove ${formatPokemonName(pokemon.name)} from comparison`}
                  >
                    <X className="h-3 w-3 text-red-500" />
                  </button>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex space-x-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={onClearComparison}
                className="flex-1 text-xs"
              >
                Clear All
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleGoToComparison}
                className="flex-1 text-xs"
              >
                Go to Comparison
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
