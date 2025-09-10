"use client";

import { X } from 'lucide-react';
import { Pokemon } from '@/types/pokemon';
import ComparisonSection from './ComparisonSection';

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
      } lg:block flex-none shrink-0 w-80 min-w-[20rem] border-r border-border bg-surface`}>
        <div className="h-screen flex flex-col relative sidebar-stable">
          {/* Header - Fixed */}
          <div className="flex-shrink-0 p-6 border-b border-border bg-surface sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Advanced Filters</h2>
              <button
                onClick={() => setShowSidebar(false)}
                aria-label="Close advanced filters"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* Sidebar Body - scrollable filters; comparison fills remaining space */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {/* Scrollable Filters Section */}
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scroll-stable scrollbar-hide p-6 pb-4">
              <div className="space-y-6 min-w-0">
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
                  className="w-full px-3 py-2 border border-border rounded-lg"
                  style={{ backgroundColor: 'var(--color-input-bg)', color: 'var(--color-input-text)' }}
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
                    style={{ backgroundColor: 'var(--color-input-bg)', color: 'var(--color-input-text)' }}
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
                    style={{ backgroundColor: 'var(--color-input-bg)', color: 'var(--color-input-text)' }}
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
                    style={{ backgroundColor: 'var(--color-input-bg)', color: 'var(--color-input-text)' }}
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
                    style={{ backgroundColor: 'var(--color-input-bg)', color: 'var(--color-input-text)' }}
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
                      className="w-4 h-4 text-poke-blue border-border rounded focus:ring-poke-blue focus:ring-2"
                      style={{ backgroundColor: 'var(--color-input-bg)' }}
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
                      className="w-4 h-4 text-poke-blue border-border rounded focus:ring-poke-blue focus:ring-2"
                      style={{ backgroundColor: 'var(--color-input-bg)' }}
                    />
                    <span className="text-sm text-text">Mythical Pokémon</span>
                  </label>
                </div>
              </div>
              </div>
            </div>

            {/* Comparison Section - fills remaining space and scrolls internally */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <ComparisonSection
                comparisonList={comparisonList}
                comparisonPokemon={comparisonPokemon}
                onToggleComparison={onToggleComparison}
                onClearComparison={onClearComparison}
                onGoToComparison={onGoToComparison}
              />
            </div>
          </div>

          {/* Desktop Footer Actions removed; actions live inside ComparisonSection header */}
        </div>
      </div>

       
    </>
  );
}