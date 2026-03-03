/**
 * Deferred Sort Hook
 * 
 * Optimizes sorting of large lists by using useDeferredValue to keep the UI responsive
 * while sorting happens in the background
 */

'use client'

import { useDeferredValue, useMemo } from 'react'
import { Pokemon } from '@/types/pokemon'

type SortOption = 'id' | 'name' | 'height' | 'weight' | 'hp' | 'attack' | 'defense' | 'special-attack' | 'special-defense' | 'speed'

/**
 * Hook for deferred sorting of Pokemon list
 * Keeps UI responsive by deferring the sort operation
 */
export function useDeferredSort(
  pokemonList: Pokemon[],
  sortBy: SortOption,
  sortOrder: 'asc' | 'desc'
): Pokemon[] {
  // Defer both the sort parameters and list to prevent intermediate renders
  const deferredSortBy = useDeferredValue(sortBy)
  const deferredSortOrder = useDeferredValue(sortOrder)
  const deferredPokemonList = useDeferredValue(pokemonList)

  // Memoize the sorted result
  return useMemo(() => {
    const startTime = performance.now()

    const sorted = [...(deferredPokemonList || pokemonList)].sort((a, b) => {
      let comparison = 0

      switch (deferredSortBy) {
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '')
          break
        case 'height':
          comparison = (a.height || 0) - (b.height || 0)
          break
        case 'weight':
          comparison = (a.weight || 0) - (b.weight || 0)
          break
        case 'hp':
          comparison = (a.stats?.[0]?.base_stat || 0) - (b.stats?.[0]?.base_stat || 0)
          break
        case 'attack':
          comparison = (a.stats?.[1]?.base_stat || 0) - (b.stats?.[1]?.base_stat || 0)
          break
        case 'defense':
          comparison = (a.stats?.[2]?.base_stat || 0) - (b.stats?.[2]?.base_stat || 0)
          break
        case 'special-attack':
          comparison = (a.stats?.[4]?.base_stat || 0) - (b.stats?.[4]?.base_stat || 0)
          break
        case 'special-defense':
          comparison = (a.stats?.[5]?.base_stat || 0) - (b.stats?.[5]?.base_stat || 0)
          break
        case 'speed':
          comparison = (a.stats?.[6]?.base_stat || 0) - (b.stats?.[6]?.base_stat || 0)
          break
        default:
          comparison = (a.id || 0) - (b.id || 0)
      }

      return deferredSortOrder === 'asc' ? comparison : -comparison
    })

    const sortTime = performance.now() - startTime
    if (sortTime > 100) {
      console.warn(`⚠️ Sort operation took ${sortTime.toFixed(2)}ms for ${sorted.length} Pokemon`)
    }

    return sorted
  }, [deferredSortBy, deferredSortOrder, deferredPokemonList, pokemonList])
}

/**
 * Hook for deferred filtering of Pokemon list
 * Keeps UI responsive by deferring the filter operation
 */
export function useDeferredFilter(
  pokemonList: Pokemon[],
  filterFn: (pokemon: Pokemon) => boolean
): Pokemon[] {
  const deferredPokemonList = useDeferredValue(pokemonList)

  return useMemo(() => {
    const startTime = performance.now()

    const filtered = (deferredPokemonList || pokemonList).filter(filterFn)

    const filterTime = performance.now() - startTime
    if (filterTime > 100) {
      console.warn(`⚠️ Filter operation took ${filterTime.toFixed(2)}ms for ${pokemonList.length} Pokemon`)
    }

    return filtered
  }, [deferredPokemonList, filterFn, pokemonList])
}

/**
 * Hook for deferred search of Pokemon list
 * Keeps UI responsive while searching
 */
export function useDeferredSearch(
  pokemonList: Pokemon[],
  searchTerm: string
): Pokemon[] {
  const deferredSearchTerm = useDeferredValue(searchTerm)
  const deferredPokemonList = useDeferredValue(pokemonList)

  return useMemo(() => {
    if (!deferredSearchTerm.trim()) {
      return deferredPokemonList || pokemonList
    }

    const term = deferredSearchTerm.toLowerCase().trim()
    const startTime = performance.now()

    const results = (deferredPokemonList || pokemonList).filter(pokemon => {
      const name = (pokemon.name || '').toLowerCase()
      const id = String(pokemon.id)
      return name.includes(term) || id.includes(term)
    })

    const searchTime = performance.now() - startTime
    if (searchTime > 100) {
      console.warn(`⚠️ Search operation took ${searchTime.toFixed(2)}ms for "${deferredSearchTerm}"`)
    }

    return results
  }, [deferredSearchTerm, deferredPokemonList, pokemonList])
}

/**
 * Combined hook for sort + filter + search with deferred values
 */
export function useDeferredPokemonList(
  pokemonList: Pokemon[],
  searchTerm: string,
  sortBy: SortOption,
  sortOrder: 'asc' | 'desc',
  filterFn?: (pokemon: Pokemon) => boolean
): Pokemon[] {
  // First search
  const searchResults = useDeferredSearch(pokemonList, searchTerm)

  // Then filter
  const filteredResults = useDeferredFilter(
    searchResults,
    filterFn || ((p: Pokemon) => true)
  )

  // Then sort
  const sortedResults = useDeferredSort(filteredResults, sortBy, sortOrder)

  return sortedResults
}
