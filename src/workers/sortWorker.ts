// Web Worker for sorting Pokemon data without blocking the UI
export interface SortWorkerMessage {
  type: 'SORT_POKEMON'
  data: {
    pokemon: any[]
    sortBy: string
    sortOrder: 'asc' | 'desc'
    statsData: Map<number, any>
  }
}

export interface SortWorkerResponse {
  type: 'SORT_COMPLETE'
  data: {
    sortedIndices: number[]
    timestamp: number
  }
}

// Handle messages from the main thread
self.onmessage = function(e: MessageEvent<SortWorkerMessage>) {
  const { type, data } = e.data

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
        keyNumber = stats.reduce((sum: number, s: any) => sum + s.base_stat, 0)
      } else if (
        sortBy === 'hp' ||
        sortBy === 'attack' ||
        sortBy === 'defense' ||
        sortBy === 'special-attack' ||
        sortBy === 'special-defense' ||
        sortBy === 'speed'
      ) {
        const stats = statsMap.get(p.id) || p.stats || []
        keyNumber = stats.find((s: any) => s.stat.name === sortBy)?.base_stat || 0
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
    
    const response: SortWorkerResponse = {
      type: 'SORT_COMPLETE',
      data: {
        sortedIndices,
        timestamp: Date.now()
      }
    }
    
    self.postMessage(response)
  }
}

// Export for TypeScript
export {}

