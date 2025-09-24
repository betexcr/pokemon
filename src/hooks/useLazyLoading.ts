'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Pokemon } from '@/types/pokemon'
import { getPokemon } from '@/lib/api'

interface LazyLoadingState {
  pokemon: Map<number, Pokemon | 'loading' | 'error'>
  totalCount: number
  isLoading: boolean
  error: string | null
}

export function useLazyLoading() {
  const [state, setState] = useState<LazyLoadingState>({
    pokemon: new Map(),
    totalCount: 0,
    isLoading: false,
    error: null
  })

  const loadingRef = useRef(new Set<number>())
  const observerRef = useRef<IntersectionObserver | null>(null)
  const initializedRef = useRef(false)

  // Initialize with total count
  const initialize = useCallback(async () => {
    // Prevent multiple initializations
    if (initializedRef.current || state.totalCount > 0 || state.isLoading) {
      return
    }

    initializedRef.current = true

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      // Get total count from the API
      const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1')
      const data = await response.json()
      const totalCount = data.count || 1302 // fallback to known count
      
      setState(prev => ({ 
        ...prev, 
        totalCount, 
        isLoading: false 
      }))
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to initialize', 
        isLoading: false 
      }))
      initializedRef.current = false // Reset on error so we can retry
    }
  }, [])

  // Load individual Pokemon when it becomes visible
  const loadPokemon = useCallback(async (id: number) => {
    if (loadingRef.current.has(id) || state.pokemon.has(id)) {
      return // Already loading or loaded
    }

    console.log(`🔄 Loading Pokemon ${id}...`)
    loadingRef.current.add(id)
    
    // Mark as loading
    setState(prev => ({
      ...prev,
      pokemon: new Map(prev.pokemon).set(id, 'loading')
    }))

    try {
      const pokemon = await getPokemon(id)
      console.log(`✅ Loaded Pokemon ${id}: ${pokemon.name}`)
      setState(prev => ({
        ...prev,
        pokemon: new Map(prev.pokemon).set(id, pokemon)
      }))
    } catch (error) {
      console.error(`❌ Failed to load Pokemon ${id}:`, error)
      setState(prev => ({
        ...prev,
        pokemon: new Map(prev.pokemon).set(id, 'error')
      }))
    } finally {
      loadingRef.current.delete(id)
    }
  }, [state.pokemon])

  // Create intersection observer for lazy loading
  const createObserver = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pokemonId = parseInt(entry.target.getAttribute('data-pokemon-id') || '0')
            if (pokemonId > 0) {
              loadPokemon(pokemonId)
            }
          }
        })
      },
      {
        rootMargin: '200px' // Start loading 200px before the element becomes visible
      }
    )
  }, [loadPokemon])

  // Load initial batch of Pokemon immediately for better UX
  const loadInitialBatch = useCallback(async () => {
    if (state.totalCount === 0) return
    
    // Load first 20 Pokemon immediately
    const initialIds = Array.from({ length: 20 }, (_, i) => i + 1)
    console.log('🔄 Loading initial batch of Pokemon...', initialIds)
    
    for (const id of initialIds) {
      if (!state.pokemon.has(id) && !loadingRef.current.has(id)) {
        console.log(`🔄 Starting to load Pokemon ${id} in initial batch...`)
        await loadPokemon(id)
        // Small delay to prevent overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 50))
      }
    }
    console.log('✅ Initial batch loading completed')
  }, [state.totalCount, state.pokemon, loadPokemon])

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  // Get Pokemon data (returns loading state, error, or actual Pokemon)
  const getPokemonData = useCallback((id: number): Pokemon | 'loading' | 'error' | null => {
    return state.pokemon.get(id) || null
  }, [state.pokemon])

  // Get all loaded Pokemon as array
  const getLoadedPokemon = useCallback((): Pokemon[] => {
    return Array.from(state.pokemon.values()).filter(
      (pokemon): pokemon is Pokemon => pokemon !== 'loading' && pokemon !== 'error'
    )
  }, [state.pokemon])

  return {
    state,
    initialize,
    loadPokemon,
    loadInitialBatch,
    getPokemonData,
    getLoadedPokemon,
    createObserver,
    observer: observerRef.current
  }
}
