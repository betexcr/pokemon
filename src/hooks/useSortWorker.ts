import { useCallback, useRef, useEffect } from 'react'
import { Pokemon } from '@/types/pokemon'

interface SortWorkerMessage {
  type: 'SORT_POKEMON'
  data: {
    pokemon: Pokemon[]
    sortBy: string
    sortOrder: 'asc' | 'desc'
    statsData: Map<number, any>
  }
}

interface SortWorkerResponse {
  type: 'SORT_COMPLETE'
  data: {
    sortedIndices: number[]
    requestId: string
  }
}

export function useSortWorker() {
  const workerRef = useRef<Worker | null>(null)
  const blobUrlRef = useRef<string | null>(null)
  const pendingSorts = useRef<Map<string, (result: number[]) => void>>(new Map())

  useEffect(() => {
    // Create worker only if Web Workers are supported
    if (typeof Worker !== 'undefined') {
      try {
        // Create worker from the inline script
        const workerCode = `
          // Web Worker for sorting Pokemon data without blocking the UI
          self.onmessage = function(e) {
            const { type, data, requestId } = e.data

            if (type === 'SORT_POKEMON') {
              const { pokemon, sortBy, sortOrder, statsData } = data
              
              // Create a map for quick stats lookup
              const statsMap = new Map(statsData)
              
              // Build array with precomputed keys
              const itemsWithKey = pokemon.map((p, index) => {
                let keyNumber = 0
                let keyString = ''
                
                if (sortBy === 'name') {
                  keyString = p.name
                } else if (sortBy === 'id') {
                  keyNumber = p.id
                } else if (sortBy === 'stats') {
                  const stats = statsMap.get(p.id) || p.stats || []
                  keyNumber = stats.reduce((sum, s) => sum + s.base_stat, 0)
                } else if (
                  sortBy === 'hp' ||
                  sortBy === 'attack' ||
                  sortBy === 'defense' ||
                  sortBy === 'special-attack' ||
                  sortBy === 'special-defense' ||
                  sortBy === 'speed'
                ) {
                  const stats = statsMap.get(p.id) || p.stats || []
                  keyNumber = stats.find(s => s.stat.name === sortBy)?.base_stat || 0
                } else {
                  keyNumber = p.id
                }
                
                return { keyNumber, keyString, originalIndex: index }
              })

              // Sort with stable algorithm
              itemsWithKey.sort((a, b) => {
                let comparison = 0
                if (sortBy === 'name') {
                  comparison = a.keyString.localeCompare(b.keyString)
                } else {
                  comparison = a.keyNumber - b.keyNumber
                }
                if (comparison === 0) {
                  // Stable tie-breaker by original index
                  comparison = a.originalIndex - b.originalIndex
                }
                return sortOrder === 'desc' ? -comparison : comparison
              })

              // Return sorted indices
              const sortedIndices = itemsWithKey.map(item => item.originalIndex)
              
              self.postMessage({
                type: 'SORT_COMPLETE',
                data: {
                  sortedIndices,
                  requestId
                }
              })
            }
          }
        `

        const blob = new Blob([workerCode], { type: 'application/javascript' })
        blobUrlRef.current = URL.createObjectURL(blob)
        workerRef.current = new Worker(blobUrlRef.current)

        workerRef.current.onmessage = (e: MessageEvent<SortWorkerResponse>) => {
          const { type, data } = e.data
          if (type === 'SORT_COMPLETE') {
            const { sortedIndices, requestId } = data
            const callback = pendingSorts.current.get(requestId)
            if (callback) {
              callback(sortedIndices)
              pendingSorts.current.delete(requestId)
            }
          }
        }

        workerRef.current.onerror = (error) => {
          console.error('Sort worker error:', error)
        }
      } catch (error) {
        console.warn('Web Workers not supported, falling back to main thread sorting:', error)
      }
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
      }
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
        blobUrlRef.current = null
      }
    }
  }, [])

  const sortPokemon = useCallback((
    pokemon: Pokemon[],
    sortBy: string,
    sortOrder: 'asc' | 'desc',
    statsData: Map<number, any>,
    onComplete: (sortedIndices: number[]) => void
  ) => {
    if (!workerRef.current) {
      // Fallback to main thread sorting if worker is not available
      const itemsWithKey = pokemon.map((p, index) => {
        let keyNumber = 0
        let keyString = ''
        
        if (sortBy === 'name') {
          keyString = p.name
        } else if (sortBy === 'id') {
          keyNumber = p.id
        } else if (sortBy === 'stats') {
          const stats = statsData.get(p.id) || p.stats || []
          keyNumber = stats.reduce((sum: number, s: any) => sum + s.base_stat, 0)
        } else if (
          sortBy === 'hp' ||
          sortBy === 'attack' ||
          sortBy === 'defense' ||
          sortBy === 'special-attack' ||
          sortBy === 'special-defense' ||
          sortBy === 'speed'
        ) {
          const stats = statsData.get(p.id) || p.stats || []
          keyNumber = stats.find((s: any) => s.stat.name === sortBy)?.base_stat || 0
        } else {
          keyNumber = p.id
        }
        
        return { keyNumber, keyString, originalIndex: index }
      })

      itemsWithKey.sort((a, b) => {
        let comparison = 0
        if (sortBy === 'name') {
          comparison = a.keyString.localeCompare(b.keyString)
        } else {
          comparison = a.keyNumber - b.keyNumber
        }
        if (comparison === 0) {
          comparison = a.originalIndex - b.originalIndex
        }
        return sortOrder === 'desc' ? -comparison : comparison
      })

      const sortedIndices = itemsWithKey.map(item => item.originalIndex)
      onComplete(sortedIndices)
      return
    }

    const requestId = `${Date.now()}-${Math.random()}`
    pendingSorts.current.set(requestId, onComplete)

    workerRef.current.postMessage({
      type: 'SORT_POKEMON',
      requestId,
      data: {
        pokemon,
        sortBy,
        sortOrder,
        statsData
      }
    })
  }, [])

  return { sortPokemon, isWorkerAvailable: !!workerRef.current }
}

