'use client'

import React from 'react'
import { GenerationLoadingState } from '@/hooks/useProgressiveLoading'
import { motion } from 'framer-motion'

interface GenerationHeaderProps {
  generationState: GenerationLoadingState
  generationInfo: {
    name: string
    start: number
    end: number
  }
  isVisible?: boolean
}

export default function GenerationHeader({ 
  generationState, 
  generationInfo,
  isVisible = true 
}: GenerationHeaderProps) {
  const { generation, isLoading, isLoaded, pokemon, error } = generationState
  const { name, start, end } = generationInfo
  
  const pokemonCount = pokemon.length
  const expectedCount = end - start + 1
  const isComplete = isLoaded && pokemonCount === expectedCount
  const hasError = error !== null

  if (!isVisible) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full py-4"
    >
      <div className="w-full bg-gradient-to-r from-surface via-surface to-surface border-y border-border shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Generation Info */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {/* Loading/Status Icon */}
              {isLoading && (
                <div className="w-4 h-4 border-2 border-poke-blue border-t-transparent rounded-full animate-spin" />
              )}
              {isLoaded && !hasError && (
                <div className={`w-4 h-4 rounded-full ${isComplete ? 'bg-green-500' : 'bg-yellow-500'}`} />
              )}
              {hasError && (
                <div className="w-4 h-4 rounded-full bg-red-500" />
              )}
              {!isLoading && !isLoaded && !hasError && (
                <div className="w-4 h-4 rounded-full bg-gray-300" />
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-text">
                {name}
              </h3>
              <div className="flex items-center space-x-2 text-sm text-muted">
                <span>Pokémon #{start} - #{end}</span>
                {isLoaded && (
                  <span className="text-poke-blue">
                    ({pokemonCount}/{expectedCount})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Status Text */}
          <div className="text-right">
            {isLoading && (
              <div className="text-sm text-poke-blue font-medium">
                Loading...
              </div>
            )}
            {isLoaded && !hasError && (
              <div className={`text-sm font-medium ${isComplete ? 'text-green-600' : 'text-yellow-600'}`}>
                {isComplete ? 'Complete' : 'Partial'}
              </div>
            )}
            {hasError && (
              <div className="text-sm text-red-600 font-medium">
                Error
              </div>
            )}
            {!isLoading && !isLoaded && !hasError && (
              <div className="text-sm text-muted">
                Pending
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {isLoading && (
          <div className="px-4 pb-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-poke-blue h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 2, ease: 'easeInOut' }}
              />
            </div>
          </div>
        )}

        {/* Error Message */}
        {hasError && (
          <div className="px-4 pb-3">
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
              {error}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
