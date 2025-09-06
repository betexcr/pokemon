"use client";

import { X, Scale, ArrowRight } from 'lucide-react';

import { Pokemon } from '@/types/pokemon'
import { formatPokemonName } from '@/lib/utils'

interface AdvancedFilters {
  types: string[]
  generation: string
  habitat: string
  heightRange: [number, number]
  weightRange: [number, number]
  legendary: boolean
  mythical: boolean
}

interface AdvancedFiltersProps {
  advancedFilters: AdvancedFilters
  setAdvancedFilters: (filters: AdvancedFilters | ((prev: AdvancedFilters) => AdvancedFilters)) => void
  showSidebar: boolean
  setShowSidebar: (show: boolean) => void
  comparisonList: number[]
  comparisonPokemon: Pokemon[]
  onToggleComparison: (id: number) => void
  onClearComparison: () => void
  onGoToComparison: () => void
}

export default function AdvancedFilters({
  advancedFilters,
  setAdvancedFilters,
  showSidebar,
  setShowSidebar,
  comparisonList,
  comparisonPokemon,
  onToggleComparison,
  onClearComparison,
  onGoToComparison
}: AdvancedFiltersProps) {
  return (
    <>
      {/* Desktop Sidebar - Advanced Filters */}
      <div className={`${
        showSidebar ? 'block' : 'hidden'
      } lg:block lg:w-80 border-r border-border bg-surface`} style={{height: 'calc(100vh - 16rem)'}}>
        <div className="h-full flex flex-col">
          {/* Header - Fixed */}
          <div className="flex-shrink-0 p-6 border-b border-border bg-surface">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Advanced Filters</h2>
              <button
                onClick={() => setShowSidebar(false)}
                className="lg:hidden p-1 rounded hover:bg-white/50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6 min-h-0" style={{maxHeight: 'calc(100vh - 20rem)'}}>
            {/* Generation Filter */}
            <div className="min-w-0">
              <label className="block text-sm font-medium mb-2">Generation</label>
              <select
                value={advancedFilters.generation}
                onChange={(e) => {
                  setAdvancedFilters(prev => ({
                    ...prev, 
                    generation: e.target.value 
                  }))
                }}
                className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text"
              >
                <option value="all">All Generations</option>
                <option value="1">Generation 1</option>
                <option value="2">Generation 2</option>
                <option value="3">Generation 3</option>
                <option value="4">Generation 4</option>
                <option value="5">Generation 5</option>
                <option value="6">Generation 6</option>
                <option value="7">Generation 7</option>
                <option value="8">Generation 8</option>
                <option value="9">Generation 9</option>
              </select>
            </div>

            {/* Height Range */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Height: {advancedFilters.heightRange[0]}m - {advancedFilters.heightRange[1]}m
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="0.1"
                  value={advancedFilters.heightRange[0]}
                  onChange={(e) => {
                    setAdvancedFilters(prev => ({
                      ...prev, 
                      heightRange: [parseFloat(e.target.value), prev.heightRange[1]] as [number, number]
                    }))
                  }}
                  className="w-full"
                />
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="0.1"
                  value={advancedFilters.heightRange[1]}
                  onChange={(e) => {
                    setAdvancedFilters(prev => ({
                      ...prev, 
                      heightRange: [prev.heightRange[0], parseFloat(e.target.value)] as [number, number]
                    }))
                  }}
                  className="w-full"
                />
              </div>
            </div>

            {/* Weight Range */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Weight: {advancedFilters.weightRange[0]}kg - {advancedFilters.weightRange[1]}kg
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="1"
                  value={advancedFilters.weightRange[0]}
                  onChange={(e) => {
                    setAdvancedFilters(prev => ({
                      ...prev, 
                      weightRange: [parseInt(e.target.value), prev.weightRange[1]] as [number, number]
                    }))
                  }}
                  className="w-full"
                />
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="1"
                  value={advancedFilters.weightRange[1]}
                  onChange={(e) => {
                    setAdvancedFilters(prev => ({
                      ...prev, 
                      weightRange: [prev.weightRange[0], parseInt(e.target.value)] as [number, number]
                    }))
                  }}
                  className="w-full"
                />
              </div>
            </div>

            {/* Legendary and Mythical Filters */}
            <div className="space-y-3">
              <label className="block text-sm font-medium">Special Categories</label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={advancedFilters.legendary}
                    onChange={(e) => {
                      setAdvancedFilters(prev => ({
                        ...prev,
                        legendary: e.target.checked
                      }))
                    }}
                    className="w-4 h-4 text-poke-blue bg-surface border-border rounded focus:ring-poke-blue focus:ring-2"
                  />
                  <span className="text-sm text-text">Legendary Pokémon</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={advancedFilters.mythical}
                    onChange={(e) => {
                      setAdvancedFilters(prev => ({
                        ...prev,
                        mythical: e.target.checked
                      }))
                    }}
                    className="w-4 h-4 text-poke-blue bg-surface border-border rounded focus:ring-poke-blue focus:ring-2"
                  />
                  <span className="text-sm text-text">Mythical Pokémon</span>
                </label>
              </div>
            </div>
          </div>
          
          {/* Comparison Section - Scrollable at bottom */}
          <div className="flex-shrink-0 border-t border-border bg-surface overflow-y-auto" style={{maxHeight: 'calc(100vh - 24rem)', minHeight: '200px'}}>
            <div className="p-3">
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <Scale className="h-5 w-5 mr-2 text-blue-500" />
                Comparison ({comparisonList.length})
              </h3>
              
              {comparisonList.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted mb-3">
                    Select Pokémon to compare their stats
                  </p>
                  <div className="text-4xl mb-2">⚖️</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Selected Pokémon List */}
                  <div className="max-h-40 overflow-y-auto bg-gray-800 rounded-lg border border-gray-700">
                    {comparisonPokemon.map((pokemon, index) => (
                      <div
                        key={pokemon.id}
                        className={`flex items-center px-3 py-2 ${
                          index < comparisonPokemon.length - 1 
                            ? 'border-b border-gray-700' 
                            : ''
                        }`}
                      >
                        <picture className="mr-3">
                          <img
                            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`}
                            alt={formatPokemonName(pokemon.name)}
                            className="w-8 h-8 object-contain"
                            loading="lazy"
                            decoding="async"
                          />
                        </picture>
                        <span className="text-white text-sm">
                          {formatPokemonName(pokemon.name)}#{pokemon.id}
                        </span>
                        <button
                          onClick={() => onToggleComparison(pokemon.id)}
                          className="ml-auto p-1 rounded hover:bg-red-600 transition-colors"
                          aria-label={`Remove ${formatPokemonName(pokemon.name)} from comparison`}
                        >
                          <X className="h-3 w-3 text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {/* Actions - Always visible at bottom */}
                  <div className="space-y-2 pt-1 border-t border-border sticky bottom-0 bg-surface">
                    <button
                      onClick={onClearComparison}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Clear All
                    </button>
                    <button
                      onClick={onGoToComparison}
                      className="w-full px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center"
                    >
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Go to Comparison
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filter Overlay */}
      {showSidebar && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-50" onClick={() => setShowSidebar(false)}>
          <div className="absolute right-0 top-0 h-full w-80 bg-surface" onClick={e => e.stopPropagation()}>
            <div className="h-full flex flex-col">
              {/* Mobile Header - Fixed */}
              <div className="flex-shrink-0 p-6 border-b border-border bg-surface">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Advanced Filters</h2>
                  <button
                    onClick={() => setShowSidebar(false)}
                    className="p-1 rounded hover:bg-white/50"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              {/* Mobile Scrollable Content */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6 min-h-0" style={{maxHeight: 'calc(100vh - 20rem)'}}>
                {/* Generation Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2">Generation</label>
                  <select
                    value={advancedFilters.generation}
                    onChange={(e) => {
                      setAdvancedFilters(prev => ({
                        ...prev, 
                        generation: e.target.value 
                      }))
                    }}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text"
                  >
                    <option value="all">All Generations</option>
                    <option value="1">Generation 1</option>
                    <option value="2">Generation 2</option>
                    <option value="3">Generation 3</option>
                    <option value="4">Generation 4</option>
                    <option value="5">Generation 5</option>
                    <option value="6">Generation 6</option>
                    <option value="7">Generation 7</option>
                    <option value="8">Generation 8</option>
                    <option value="9">Generation 9</option>
                  </select>
                </div>

                {/* Height Range */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Height: {advancedFilters.heightRange[0]}m - {advancedFilters.heightRange[1]}m
                  </label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="0.1"
                      value={advancedFilters.heightRange[0]}
                      onChange={(e) => {
                        setAdvancedFilters(prev => ({
                          ...prev, 
                          heightRange: [parseFloat(e.target.value), prev.heightRange[1]] as [number, number]
                        }))
                      }}
                      className="w-full"
                    />
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="0.1"
                      value={advancedFilters.heightRange[1]}
                      onChange={(e) => {
                        setAdvancedFilters(prev => ({
                          ...prev, 
                          heightRange: [prev.heightRange[0], parseFloat(e.target.value)] as [number, number]
                        }))
                      }}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Weight Range */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Weight: {advancedFilters.weightRange[0]}kg - {advancedFilters.weightRange[1]}kg
                  </label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="1000"
                      step="1"
                      value={advancedFilters.weightRange[0]}
                      onChange={(e) => {
                        setAdvancedFilters(prev => ({
                          ...prev, 
                          weightRange: [parseInt(e.target.value), prev.weightRange[1]] as [number, number]
                        }))
                      }}
                      className="w-full"
                    />
                    <input
                      type="range"
                      min="0"
                      max="1000"
                      step="1"
                      value={advancedFilters.weightRange[1]}
                      onChange={(e) => {
                        setAdvancedFilters(prev => ({
                          ...prev, 
                          weightRange: [prev.weightRange[0], parseInt(e.target.value)] as [number, number]
                        }))
                      }}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Legendary and Mythical Filters */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium">Special Categories</label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={advancedFilters.legendary}
                        onChange={(e) => {
                          setAdvancedFilters(prev => ({
                            ...prev,
                            legendary: e.target.checked
                          }))
                        }}
                        className="w-4 h-4 text-poke-blue bg-surface border-border rounded focus:ring-poke-blue focus:ring-2"
                      />
                      <span className="text-sm text-text">Legendary Pokémon</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={advancedFilters.mythical}
                        onChange={(e) => {
                          setAdvancedFilters(prev => ({
                            ...prev,
                            mythical: e.target.checked
                          }))
                        }}
                        className="w-4 h-4 text-poke-blue bg-surface border-border rounded focus:ring-poke-blue focus:ring-2"
                      />
                      <span className="text-sm text-text">Mythical Pokémon</span>
                    </label>
                  </div>
                </div>
              </div>
              
              {/* Mobile Comparison Section - Scrollable at bottom */}
              <div className="flex-shrink-0 border-t border-border bg-surface overflow-y-auto" style={{maxHeight: 'calc(100vh - 24rem)', minHeight: '200px'}}>
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Scale className="h-5 w-5 mr-2 text-blue-500" />
                    Comparison ({comparisonList.length})
                  </h3>
                  
                  {comparisonList.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted mb-3">
                        Select Pokémon to compare their stats
                      </p>
                      <div className="text-4xl mb-2">⚖️</div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Selected Pokémon List */}
                      <div className="max-h-40 overflow-y-auto bg-gray-800 rounded-lg border border-gray-700">
                        {comparisonPokemon.map((pokemon, index) => (
                          <div
                            key={pokemon.id}
                            className={`flex items-center px-3 py-2 ${
                              index < comparisonPokemon.length - 1 
                                ? 'border-b border-gray-700' 
                                : ''
                            }`}
                          >
                            <picture className="mr-3">
                              <img
                                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`}
                                alt={formatPokemonName(pokemon.name)}
                                className="w-8 h-8 object-contain"
                                loading="lazy"
                                decoding="async"
                              />
                            </picture>
                            <span className="text-white text-sm">
                              {formatPokemonName(pokemon.name)}#{pokemon.id}
                            </span>
                            <button
                              onClick={() => onToggleComparison(pokemon.id)}
                              className="ml-auto p-1 rounded hover:bg-red-600 transition-colors"
                              aria-label={`Remove ${formatPokemonName(pokemon.name)} from comparison`}
                            >
                              <X className="h-3 w-3 text-red-400" />
                            </button>
                          </div>
                        ))}
                      </div>
                      
                      {/* Actions - Always visible at bottom */}
                      <div className="space-y-2 pt-2 border-t border-border sticky bottom-0 bg-surface">
                        <button
                          onClick={onClearComparison}
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          Clear All
                        </button>
                        <button
                          onClick={onGoToComparison}
                          className="w-full px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center"
                        >
                          <ArrowRight className="h-4 w-4 mr-2" />
                          Go to Comparison
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
