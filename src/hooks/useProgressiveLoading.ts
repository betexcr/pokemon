'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Pokemon } from '@/types/pokemon'
import { getPokemonSkeletonsWithPagination, hydratePokemonSkeletons } from '@/lib/api'

export interface GenerationLoadingState {
  generation: string
  isLoading: boolean
  isLoaded: boolean
  pokemon: Pokemon[]
  error: string | null
}

export interface ProgressiveLoadingState {
  generations: Map<string, GenerationLoadingState>
  isInitialLoading: boolean
  totalLoaded: number
  totalExpected: number
}

const GENERATION_RANGES = {
  '1': { start: 1, end: 151, name: 'Generation I (Kanto)' },
  '2': { start: 152, end: 251, name: 'Generation II (Johto)' },
  '3': { start: 252, end: 386, name: 'Generation III (Hoenn)' },
  '4': { start: 387, end: 493, name: 'Generation IV (Sinnoh)' },
  '5': { start: 494, end: 649, name: 'Generation V (Unova)' },
  '6': { start: 650, end: 721, name: 'Generation VI (Kalos)' },
  '7': { start: 722, end: 809, name: 'Generation VII (Alola)' },
  '8': { start: 810, end: 905, name: 'Generation VIII (Galar)' },
  '9': { start: 906, end: 1025, name: 'Generation IX (Paldea)' }
}

export function useProgressiveLoading() {
  const [state, setState] = useState<ProgressiveLoadingState>({
    generations: new Map(),
    isInitialLoading: true,
    totalLoaded: 0,
    totalExpected: 0
  })

  const loadingRef = useRef<Set<string>>(new Set())
  const abortControllerRef = useRef<AbortController | null>(null)

  // Initialize generation states
  const initializeGenerations = useCallback(() => {
    const generations = new Map<string, GenerationLoadingState>()
    let totalExpected = 0

    Object.entries(GENERATION_RANGES).forEach(([gen, range]) => {
      const count = range.end - range.start + 1
      totalExpected += count
      
      generations.set(gen, {
        generation: gen,
        isLoading: false,
        isLoaded: false,
        pokemon: [],
        error: null
      })
    })

    setState(prev => ({
      ...prev,
      generations,
      totalExpected,
      isInitialLoading: true
    }))
  }, [])

  // Load a specific generation
  const loadGeneration = useCallback(async (generation: string) => {
    if (loadingRef.current.has(generation)) {
      return // Already loading
    }

    const genState = state.generations.get(generation)
    if (!genState || genState.isLoaded || genState.isLoading) {
      return // Already loaded or loading
    }

    loadingRef.current.add(generation)
    
    setState(prev => {
      const newGenerations = new Map(prev.generations)
      const genState = newGenerations.get(generation)
      if (genState) {
        newGenerations.set(generation, {
          ...genState,
          isLoading: true,
          error: null
        })
      }
      return {
        ...prev,
        generations: newGenerations
      }
    })

    try {
      // Use skeleton approach to load generation Pokemon efficiently
      const range = GENERATION_RANGES[generation as keyof typeof GENERATION_RANGES]
      if (!range) {
        throw new Error(`Unknown generation: ${generation}`)
      }
      
      const generationSize = range.end - range.start + 1
      console.log(`🔄 Loading generation ${generation} (${generationSize} Pokemon)...`);
      
      // First load skeletons for immediate display
      const skeletonPokemon = await getPokemonSkeletonsWithPagination(generationSize, range.start - 1)
      console.log(`✅ Loaded ${skeletonPokemon.length} skeleton Pokemon for generation ${generation}`);
      
      // Update state with skeletons first
      setState(prev => {
        const newGenerations = new Map(prev.generations)
        const genState = newGenerations.get(generation)
        if (genState) {
          newGenerations.set(generation, {
            ...genState,
            isLoading: false,
            isLoaded: true,
            pokemon: skeletonPokemon,
            error: null
          })
        }
        
        const totalLoaded = Array.from(newGenerations.values())
          .reduce((sum, gen) => sum + gen.pokemon.length, 0)
        
        return {
          ...prev,
          generations: newGenerations,
          totalLoaded,
          isInitialLoading: totalLoaded === 0
        }
      })
      
      // Then hydrate in background
      console.log(`🔄 Hydrating generation ${generation}...`);
      const pokemon = await hydratePokemonSkeletons(skeletonPokemon)
      console.log(`✅ Hydrated ${pokemon.length} Pokemon for generation ${generation}`);
      
      setState(prev => {
        const newGenerations = new Map(prev.generations)
        const genState = newGenerations.get(generation)
        if (genState) {
          newGenerations.set(generation, {
            ...genState,
            isLoading: false,
            isLoaded: true,
            pokemon,
            error: null
          })
        }
        
        const totalLoaded = Array.from(newGenerations.values())
          .reduce((sum, gen) => sum + gen.pokemon.length, 0)
        
        return {
          ...prev,
          generations: newGenerations,
          totalLoaded,
          isInitialLoading: totalLoaded === 0
        }
      })
    } catch (error) {
      console.error(`Error loading generation ${generation}:`, error)
      
      setState(prev => {
        const newGenerations = new Map(prev.generations)
        const genState = newGenerations.get(generation)
        if (genState) {
          newGenerations.set(generation, {
            ...genState,
            isLoading: false,
            isLoaded: false,
            error: error instanceof Error ? error.message : 'Failed to load generation'
          })
        }
        return {
          ...prev,
          generations: newGenerations
        }
      })
    } finally {
      loadingRef.current.delete(generation)
    }
  }, [state.generations])

  // Load all generations progressively
  const loadAllGenerations = useCallback(async () => {
    // Cancel any existing loading
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    abortControllerRef.current = new AbortController()
    
    initializeGenerations()
    
    // Load generations in sequence with small delays for better UX
    const generationKeys = Object.keys(GENERATION_RANGES)
    
    try {
      for (let i = 0; i < generationKeys.length; i++) {
        if (abortControllerRef.current.signal.aborted) {
          break
        }
        
        const generation = generationKeys[i]
        await loadGeneration(generation)
        
        // Small delay between generations for better visual feedback
        if (i < generationKeys.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }
    } catch (error) {
      console.error('Error in progressive loading:', error)
    }
  }, [initializeGenerations, loadGeneration])

  // Load specific generations
  const loadGenerations = useCallback(async (generations: string[]) => {
    initializeGenerations()
    
    // Load generations in parallel but with staggered starts
    generations.forEach((generation, index) => {
      setTimeout(() => {
        loadGeneration(generation)
      }, index * 100) // Stagger by 100ms
    })
  }, [initializeGenerations, loadGeneration])

  // Get all loaded Pokemon in order
  const getAllPokemon = useCallback(() => {
    const allPokemon: Pokemon[] = []
    const generationKeys = Object.keys(GENERATION_RANGES)
    
    generationKeys.forEach(gen => {
      const genState = state.generations.get(gen)
      if (genState && genState.isLoaded) {
        allPokemon.push(...genState.pokemon)
      }
    })
    
    return allPokemon
  }, [state.generations])

  // Get loading progress
  const getLoadingProgress = useCallback(() => {
    const totalGenerations = Object.keys(GENERATION_RANGES).length
    const loadedGenerations = Array.from(state.generations.values())
      .filter(gen => gen.isLoaded).length
    
    return {
      loadedGenerations,
      totalGenerations,
      percentage: (loadedGenerations / totalGenerations) * 100,
      totalPokemon: state.totalLoaded,
      expectedPokemon: state.totalExpected
    }
  }, [state.generations, state.totalLoaded, state.totalExpected])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    state,
    loadGeneration,
    loadAllGenerations,
    loadGenerations,
    getAllPokemon,
    getLoadingProgress,
    generationRanges: GENERATION_RANGES
  }
}
