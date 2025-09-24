"use client";

import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { Pokemon } from '@/types/pokemon';
import ComparisonSection from './ComparisonSection';
import { useEffect, useState } from 'react';

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
  // State for collapsible sections
  // Important: use deterministic defaults for SSR; hydrate from localStorage after mount
  const [isFiltersExpanded, setIsFiltersExpanded] = useState<boolean>(true);
  const [isComparisonExpanded, setIsComparisonExpanded] = useState<boolean>(true);

  // Hydrate collapsed/expanded state after mount to avoid hydration mismatch
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const savedFilters = localStorage.getItem('pokedex.filtersExpanded');
        const savedComparison = localStorage.getItem('pokedex.comparisonExpanded');
        if (savedFilters !== null) setIsFiltersExpanded(savedFilters === 'true');
        if (savedComparison !== null) setIsComparisonExpanded(savedComparison === 'true');
      }
    } catch {}
  }, [])

  // Effect to handle sidebar opening via comparison toggle
  useEffect(() => {
    if (showSidebar) {
      // When sidebar is opened by adding a team for comparison,
      // minimize filters and expand comparisons to show the added team
      try {
        if (typeof window !== 'undefined') {
          // Check if this was triggered by adding a comparison (comparison list has items)
          const hasComparisons = comparisonList.length > 0;
          
          if (hasComparisons) {
            // Open with filters minimized and comparisons expanded
            setIsFiltersExpanded(false);
            setIsComparisonExpanded(true);
            
            // Save these states to localStorage
            localStorage.setItem('pokedex.filtersExpanded', 'false');
            localStorage.setItem('pokedex.comparisonExpanded', 'true');
          } else {
            // Normal behavior - restore from localStorage
            const shouldExpandComparison = localStorage.getItem('pokedex.comparisonExpanded');
            const shouldCollapseFilters = localStorage.getItem('pokedex.filtersExpanded');
            
            if (shouldExpandComparison === 'true') {
              setIsComparisonExpanded(true);
            }
            if (shouldCollapseFilters === 'false') {
              setIsFiltersExpanded(false);
            }
          }
        }
      } catch {}
    }
  }, [showSidebar, comparisonList.length]);

  // Persist collapsed states when they change
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('pokedex.filtersExpanded', String(isFiltersExpanded))
      }
    } catch {}
  }, [isFiltersExpanded])

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('pokedex.comparisonExpanded', String(isComparisonExpanded))
      }
    } catch {}
  }, [isComparisonExpanded])

  return (
    <>
      {/* Desktop Sidebar - Advanced Filters */}
      <div className={`${
        showSidebar ? 'block' : 'hidden'
      } flex-none shrink-0 w-80 min-w-[20rem] border-r border-border bg-surface`}>
        <div className="h-screen flex flex-col relative sidebar-stable">
          {/* Header - Fixed */}
          <div className="flex-shrink-0 p-6 border-b border-border bg-surface sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Advanced Filters</h2>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Close button clicked');
                  setShowSidebar(false);
                }}
                aria-label="Close advanced filters"
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* Sidebar Body - collapsible sections */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {/* Advanced Filters Section */}
            <div className="border-b border-border">
              {/* Filters Header */}
              <button
                onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <h3 className="text-lg font-semibold">Advanced Filters</h3>
                {isFiltersExpanded ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
              
              {/* Filters Content */}
              {isFiltersExpanded && (
                <div className="px-6 pb-6 overflow-y-auto max-h-96 scrollbar-hide">
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
                        className="w-full px-3 py-2 border border-border rounded-lg dark:bg-gray-700 dark:border-gray-500 dark:text-white"
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
                          className="w-full dark:accent-poke-blue"
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
                          className="w-full dark:accent-poke-blue"
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
                          className="w-full dark:accent-poke-blue"
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
                          className="w-full dark:accent-poke-blue"
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
                            className="w-4 h-4 text-poke-blue border-border rounded focus:ring-poke-blue focus:ring-2 dark:bg-gray-700 dark:border-gray-500 dark:checked:bg-poke-blue dark:checked:border-poke-blue"
                            style={{ backgroundColor: 'var(--color-input-bg)' }}
                          />
                          <span className="text-sm text-text dark:text-gray-200">Legendary Pokémon</span>
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
                            className="w-4 h-4 text-poke-blue border-border rounded focus:ring-poke-blue focus:ring-2 dark:bg-gray-700 dark:border-gray-500 dark:checked:bg-poke-blue dark:checked:border-poke-blue"
                            style={{ backgroundColor: 'var(--color-input-bg)' }}
                          />
                          <span className="text-sm text-text dark:text-gray-200">Mythical Pokémon</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Comparison Section */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {/* Comparison Header */}
              <button
                onClick={() => setIsComparisonExpanded(!isComparisonExpanded)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-border"
              >
                <h3 className="text-lg font-semibold flex items-center">
                  <span className="text-blue-500 mr-2">⚖️</span>
                  Comparison ({comparisonList.length})
                </h3>
                {isComparisonExpanded ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
              
              {/* Comparison Content */}
              {isComparisonExpanded && (
                <div className="flex-1 min-h-0 overflow-hidden">
                  <ComparisonSection
                    comparisonList={comparisonList}
                    comparisonPokemon={comparisonPokemon}
                    onToggleComparison={onToggleComparison}
                    onClearComparison={onClearComparison}
                    onGoToComparison={onGoToComparison}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}