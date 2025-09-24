'use client'

import React, { useMemo } from 'react'
import { Pokemon } from '@/types/pokemon'
import { GenerationLoadingState } from '@/hooks/useProgressiveLoading'
import GenerationHeader from './GenerationHeader'
import VirtualizedPokemonGrid from './VirtualizedPokemonGrid'
import PokedexListView from './PokedexListView'
import { motion, AnimatePresence } from 'framer-motion'

interface ProgressivePokemonGridProps {
  generations: Map<string, GenerationLoadingState>
  generationRanges: Record<string, { name: string; start: number; end: number }>
  onToggleComparison: (id: number) => void
  onSelectPokemon?: (pokemon: Pokemon) => void
  selectedPokemon: Pokemon | null
  comparisonList: number[]
  density: '3cols' | '6cols' | '9cols' | 'list'
  showSpecialForms?: boolean
  isLoadingMore?: boolean
  hasMorePokemon?: boolean
  onLoadMore?: () => void
  sentinelRef?: (node: HTMLDivElement | null) => void
}

export default function ProgressivePokemonGrid({
  generations,
  generationRanges,
  onToggleComparison,
  onSelectPokemon,
  selectedPokemon,
  comparisonList,
  density,
  showSpecialForms = true,
  isLoadingMore = false,
  hasMorePokemon = false,
  onLoadMore,
  sentinelRef
}: ProgressivePokemonGridProps) {

  // Group Pokemon by generation for progressive display
  const generationSections = useMemo(() => {
    const sections: Array<{
      generation: string
      generationInfo: { name: string; start: number; end: number }
      pokemon: Pokemon[]
      state: GenerationLoadingState
    }> = []

    // Process generations in order
    Object.entries(generationRanges).forEach(([gen, info]) => {
      const genState = generations.get(gen)
      if (genState) {
        sections.push({
          generation: gen,
          generationInfo: info,
          pokemon: genState.pokemon,
          state: genState
        })
      }
    })

    return sections
  }, [generations, generationRanges])

  // Calculate if we should show any content
  const hasAnyContent = generationSections.some(section => 
    section.state.isLoaded || section.state.isLoading
  )

  // Get all loaded Pokemon for infinite scroll
  const allLoadedPokemon = useMemo(() => {
    return generationSections
      .filter(section => section.state.isLoaded)
      .flatMap(section => section.pokemon)
  }, [generationSections])

  // Calculate overall progress
  const progress = useMemo(() => {
    const totalGenerations = Object.keys(generationRanges).length
    const loadedGenerations = Array.from(generations.values())
      .filter(gen => gen.isLoaded).length
    const loadingGenerations = Array.from(generations.values())
      .filter(gen => gen.isLoading).length
    
    return {
      loaded: loadedGenerations,
      loading: loadingGenerations,
      total: totalGenerations,
      percentage: (loadedGenerations / totalGenerations) * 100
    }
  }, [generations, generationRanges])

  if (!hasAnyContent) {
    return (
      <div className="w-full max-w-full">
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4">
            <div className="w-full h-full border-4 border-poke-blue border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-muted text-lg">Initializing Pokédex...</p>
          <div className="mt-4 max-w-md mx-auto">
            <div className="text-sm text-muted mb-2">
              Loading generations... ({progress.loaded}/{progress.total})
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-poke-blue h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress.percentage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-full relative">
      {/* Floating progress indicator */}
      {progress.loading > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-20 right-4 z-50 bg-surface border border-border rounded-lg shadow-lg p-3 min-w-[200px]"
        >
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-4 h-4 border-2 border-poke-blue border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium text-text">
              Loading Generations
            </span>
          </div>
          <div className="text-xs text-muted mb-1">
            {progress.loaded} of {progress.total} complete
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <motion.div
              className="bg-poke-blue h-1.5 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress.percentage}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </motion.div>
      )}

      {/* Completion message */}
      {progress.loaded === progress.total && progress.loading === 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-20 right-4 z-50 bg-green-50 border border-green-200 rounded-lg shadow-lg p-3 min-w-[200px]"
        >
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-sm font-medium text-green-800">
              All Generations Loaded!
            </span>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {generationSections.map((section) => {
          const { generation, generationInfo, pokemon, state } = section
          const shouldShowHeader = state.isLoaded || state.isLoading || state.error
          const shouldShowPokemon = state.isLoaded && pokemon.length > 0

          return (
            <motion.div
              key={generation}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              {/* Generation Header */}
              {shouldShowHeader && (
                <GenerationHeader
                  generationState={state}
                  generationInfo={generationInfo}
                  isVisible={true}
                />
              )}

              {/* Pokemon Grid for this generation */}
              {shouldShowPokemon && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="w-full"
                >
                  {density === 'list' ? (
                    <PokedexListView
                      pokemonList={pokemon}
                      onToggleComparison={onToggleComparison}
                      onSelectPokemon={onSelectPokemon}
                      comparisonList={comparisonList}
                      isLoadingMore={false}
                      hasMorePokemon={false}
                    />
                  ) : (
                    <VirtualizedPokemonGrid
                      pokemonList={pokemon}
                      onToggleComparison={onToggleComparison}
                      onSelectPokemon={onSelectPokemon}
                      selectedPokemon={selectedPokemon}
                      comparisonList={comparisonList}
                      density={density}
                      enableVirtualization={false}
                      showSpecialForms={showSpecialForms}
                      isLoadingMore={false}
                      hasMorePokemon={false}
                    />
                  )}
                </motion.div>
              )}

              {/* Loading skeleton for this generation */}
              {state.isLoading && pokemon.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full p-4"
                >
                  <div className={`grid gap-3 ${
                    density === '3cols' ? 'grid-cols-3' :
                    density === '6cols' ? 'grid-cols-6' :
                    density === '9cols' ? 'grid-cols-9' :
                    'grid-cols-1'
                  }`}>
                    {Array.from({ length: 6 }).map((_, index) => (
                      <div
                        key={index}
                        className="bg-gray-200 rounded-lg h-32 animate-pulse"
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>

      {/* Infinite scroll sentinel for all generations */}
      {hasMorePokemon && (
        <div
          ref={sentinelRef}
          style={{
            width: '100%',
            height: '20px',
            backgroundColor: 'transparent',
          }}
          data-infinite-scroll-sentinel="true"
        />

      )}

      {/* Loading more indicator */}
      {isLoadingMore && (
        <div className="text-center py-4">
          <div className="w-8 h-8 mx-auto mb-2">
            <div className="w-full h-full border-4 border-poke-blue border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-muted text-sm">Loading more Pokémon...</p>
        </div>
      )}
    </div>
  )
}
