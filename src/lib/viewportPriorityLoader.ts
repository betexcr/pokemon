import { Pokemon } from '@/types/pokemon'
import { getPokemon } from './api'

interface ViewportInfo {
  visibleIds: number[]
  nearViewportIds: number[]
  offScreenIds: number[]
}

/**
 * Viewport-based priority loader for Pokemon data
 * Prioritizes loading Pokemon that are currently visible or near the viewport
 */
export class ViewportPriorityLoader {
  private loadingQueue = new Set<number>()
  private loadedPokemon = new Map<number, Pokemon>()
  private onUpdateCallback?: (pokemon: Pokemon) => void
  private lastViewportState = new Set<number>() // Track last visible Pokemon
  private isProcessing = false // Prevent concurrent processing

  constructor(onUpdate?: (pokemon: Pokemon) => void) {
    this.onUpdateCallback = onUpdate
  }

  /**
   * Get Pokemon IDs that are currently visible in the viewport
   */
  getVisiblePokemonIds(): number[] {
    if (typeof window === 'undefined') return []
    
    const pokemonElements = document.querySelectorAll('[data-pokemon-id]')
    const visibleIds: number[] = []
    
    pokemonElements.forEach(element => {
      const rect = element.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth
      
      // Check if element is in viewport (with some margin)
      if (
        rect.top < viewportHeight + 200 && // 200px below viewport
        rect.bottom > -200 && // 200px above viewport
        rect.left < viewportWidth + 200 && // 200px right of viewport
        rect.right > -200 // 200px left of viewport
      ) {
        const id = parseInt(element.getAttribute('data-pokemon-id') || '0')
        if (id > 0) {
          visibleIds.push(id)
        }
      }
    })
    
    return visibleIds
  }

  /**
   * Get Pokemon IDs that are near the viewport (for preloading)
   */
  getNearViewportIds(): number[] {
    if (typeof window === 'undefined') return []
    
    const pokemonElements = document.querySelectorAll('[data-pokemon-id]')
    const nearIds: number[] = []
    
    pokemonElements.forEach(element => {
      const rect = element.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth
      
      // Check if element is near viewport (within 200px - much more conservative)
      if (
        rect.top < viewportHeight + 200 && // 200px below viewport
        rect.bottom > -200 && // 200px above viewport
        rect.left < viewportWidth + 200 && // 200px right of viewport
        rect.right > -200 // 200px left of viewport
      ) {
        const id = parseInt(element.getAttribute('data-pokemon-id') || '0')
        if (id > 0) {
          nearIds.push(id)
        }
      }
    })
    
    return nearIds
  }

  /**
   * Categorize Pokemon IDs by viewport priority
   */
  categorizeByViewport(allIds: number[]): ViewportInfo {
    const visibleIds = this.getVisiblePokemonIds()
    const nearIds = this.getNearViewportIds()
    
    const visibleSet = new Set(visibleIds)
    const nearSet = new Set(nearIds)
    
    const offScreenIds = allIds.filter(id => !visibleSet.has(id) && !nearSet.has(id))
    
    return {
      visibleIds: visibleIds.filter(id => allIds.includes(id)),
      nearViewportIds: nearIds.filter(id => allIds.includes(id) && !visibleSet.has(id)),
      offScreenIds
    }
  }

  /**
   * Load Pokemon with viewport-based priority
   */
  async loadWithPriority(pokemonIds: number[]): Promise<void> {
    // Use a more lenient approach for fast scrolling
    if (this.isProcessing) {
      // Instead of completely skipping, just reduce the frequency
      console.log('⏳ Throttling loadWithPriority - already processing (fast scroll)')
      return
    }
    
    this.isProcessing = true
    
    try {
      const viewportInfo = this.categorizeByViewport(pokemonIds)
      
      // Check if viewport has changed significantly
      const currentVisibleSet = new Set(viewportInfo.visibleIds)
      const hasViewportChanged = this.hasViewportChanged(currentVisibleSet)
      
      if (hasViewportChanged) {
        console.log('🔄 Viewport changed - updating priorities')
        this.lastViewportState = currentVisibleSet
        
        // Priority 1: Load newly visible Pokemon first (highest priority) - non-blocking
        const newlyVisible = viewportInfo.visibleIds.filter(id => !this.loadedPokemon.has(id))
        if (newlyVisible.length > 0) {
          console.log(`🎯 Loading ${newlyVisible.length} newly visible Pokemon`)
          // Don't await - let it load in background
          this.loadBatch(newlyVisible, 'visible').catch(err =>
            console.warn('Error loading visible Pokemon:', err)
          )
        }
        
        // Priority 2: Load near viewport Pokemon (medium priority) - non-blocking
        if (viewportInfo.nearViewportIds.length > 0) {
          this.loadBatch(viewportInfo.nearViewportIds, 'near').catch(err =>
            console.warn('Error loading near Pokemon:', err)
          )
        }
        
        // Priority 3: Skip off-screen Pokemon loading to reduce unnecessary API calls
        // if (viewportInfo.offScreenIds.length > 0) {
        //   this.loadBatch(viewportInfo.offScreenIds, 'off-screen').catch(err =>
        //     console.warn('Error loading off-screen Pokemon:', err)
        //   )
        // }
      } else {
        console.log('⏭️  Viewport unchanged - skipping priority update')
      }
    } finally {
      // Reset processing flag much faster for better responsiveness
      setTimeout(() => {
        this.isProcessing = false
      }, 5) // Even shorter delay for rapid scrolling
    }
  }
  
  /**
   * Check if the viewport has changed significantly
   */
  private hasViewportChanged(currentVisible: Set<number>): boolean {
    if (this.lastViewportState.size === 0) {
      return true // First time
    }
    
    // Check if more than 50% of visible Pokemon have changed (less sensitive)
    const intersection = new Set([...currentVisible].filter(id => this.lastViewportState.has(id)))
    const union = new Set([...currentVisible, ...this.lastViewportState])
    const changeRatio = (union.size - intersection.size) / union.size
    
    // Only trigger if significant change or many new Pokemon
    const newVisible = [...currentVisible].filter(id => !this.lastViewportState.has(id))
    
    return changeRatio > 0.5 || newVisible.length > 5 // 50% change threshold or 5+ new visible
  }

  /**
   * Load a batch of Pokemon IDs
   */
  private async loadBatch(ids: number[], priority: string): Promise<void> {
    if (ids.length === 0) return
    
    console.log(`🎯 Loading ${ids.length} Pokemon (${priority} priority)`)
    
    // Filter out already loaded and currently loading Pokemon
    const idsToLoad = ids.filter(id => 
      !this.loadedPokemon.has(id) && 
      !this.loadingQueue.has(id)
    )
    
    if (idsToLoad.length === 0) {
      console.log(`⏭️  Skipping ${priority} batch - all Pokemon already loaded/loading`)
      return
    }
    
    console.log(`📦 Loading ${idsToLoad.length} new Pokemon (${priority} priority)`)
    
    // Add to loading queue
    idsToLoad.forEach(id => this.loadingQueue.add(id))
    
    // Load in smaller batches to avoid overwhelming the API
    const batchSize = priority === 'visible' ? 2 : priority === 'near' ? 3 : 5
    const delay = priority === 'visible' ? 0 : priority === 'near' ? 50 : 100
    
    for (let i = 0; i < idsToLoad.length; i += batchSize) {
      const batch = idsToLoad.slice(i, i + batchSize)
      console.log(`🔄 Loading batch ${Math.floor(i/batchSize) + 1}: ${batch.join(', ')}`)
      
      const batchPromises = batch.map(async (id) => {
        try {
          console.log(`📥 Loading Pokemon ${id}...`)
          const pokemon = await getPokemon(id)
          this.loadedPokemon.set(id, pokemon)
          this.onUpdateCallback?.(pokemon)
          console.log(`✅ Loaded Pokemon ${id}: ${pokemon.name}`)
          return pokemon
        } catch (error) {
          console.warn(`❌ Failed to load Pokemon ${id}:`, error)
          
          // For 503 errors, create a fallback Pokemon to keep the UI responsive
          if (error instanceof Error && error.message.includes('503')) {
            console.log(`🔄 Creating fallback Pokemon for ${id} due to 503 error`)
            const fallbackPokemon: Pokemon = {
              id,
              name: `pokemon-${id}`,
              height: 0,
              weight: 0,
              base_experience: 0,
              order: id,
              is_default: true,
              sprites: {
                front_default: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
                front_shiny: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${id}.png`,
                front_female: null,
                front_shiny_female: null,
                back_default: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${id}.png`,
                back_shiny: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/shiny/${id}.png`,
                back_female: null,
                back_shiny_female: null,
                other: {
                  'dream_world': {
                    front_default: null,
                    front_female: null
                  },
                  'home': {
                    front_default: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${id}.png`,
                    front_female: null,
                    front_shiny: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/shiny/${id}.png`,
                    front_shiny_female: null
                  },
                  'official-artwork': {
                    front_default: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
                    front_shiny: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${id}.png`
                  }
                }
              },
              types: [],
              stats: [],
              abilities: [],
              moves: [],
              species: { name: `pokemon-${id}`, url: '' },
              forms: [],
              game_indices: [],
              held_items: [],
              location_area_encounters: ''
            }
            
            this.loadedPokemon.set(id, fallbackPokemon)
            this.onUpdateCallback?.(fallbackPokemon)
            console.log(`🔄 Created fallback Pokemon ${id} due to API error`)
            return fallbackPokemon
          }
          
          return null
        } finally {
          this.loadingQueue.delete(id)
        }
      })
      
      await Promise.all(batchPromises)
      
      // Add delay between batches based on priority
      if (i + batchSize < idsToLoad.length && delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  /**
   * Get loaded Pokemon by ID
   */
  getLoadedPokemon(id: number): Pokemon | undefined {
    return this.loadedPokemon.get(id)
  }

  /**
   * Check if Pokemon is loaded
   */
  isLoaded(id: number): boolean {
    return this.loadedPokemon.has(id)
  }

  /**
   * Check if Pokemon is currently loading
   */
  isLoading(id: number): boolean {
    return this.loadingQueue.has(id)
  }

  /**
   * Get loading statistics
   */
  getStats() {
    return {
      loaded: this.loadedPokemon.size,
      loading: this.loadingQueue.size,
      total: this.loadedPokemon.size + this.loadingQueue.size
    }
  }

  /**
   * Force a viewport update (useful for scroll direction changes)
   */
  forceViewportUpdate() {
    console.log('🔄 Forcing viewport update')
    this.lastViewportState.clear()
  }

  /**
   * Retry failed Pokemon (useful when API recovers)
   */
  async retryFailedPokemon() {
    const failedPokemon = Array.from(this.loadedPokemon.values())
      .filter(p => p.name.startsWith('pokemon-') && p.types.length === 0)
    
    if (failedPokemon.length === 0) {
      console.log('🔄 No failed Pokemon to retry')
      return
    }
    
    console.log(`🔄 Retrying ${failedPokemon.length} failed Pokemon...`)
    
    for (const pokemon of failedPokemon) {
      try {
        const { getPokemon } = await import('@/lib/api')
        const realPokemon = await getPokemon(pokemon.id)
        this.loadedPokemon.set(pokemon.id, realPokemon)
        this.onUpdateCallback?.(realPokemon)
        console.log(`✅ Retry successful for Pokemon ${pokemon.id}: ${realPokemon.name}`)
      } catch (error) {
        console.warn(`❌ Retry failed for Pokemon ${pokemon.id}:`, error)
      }
    }
  }

  /**
   * Clear the loader state
   */
  clear() {
    this.loadingQueue.clear()
    this.loadedPokemon.clear()
    this.lastViewportState.clear()
  }
}

/**
 * Hook for viewport-based Pokemon loading
 */
export function useViewportPriorityLoader() {
  // This would need to be imported from React in a component
  // For now, we'll use the class directly
  return new ViewportPriorityLoader()
}
