// Pokémon API functions
// This module provides all the API functions needed by the application

import { Pokemon } from '@/types/pokemon'
import { reportApiError, reportNetworkError, reportDataLoadingError } from '@/lib/errorReporting'
import { isSpecialForm, getSpecialFormInfo, getBasePokemonId } from '@/lib/specialForms'
import { browserCache, getCacheKey, CACHE_TTL } from '@/lib/memcached'

// Fallback in-memory cache for when browser cache is unavailable
const fallbackCache = new Map<string, { data: any; timestamp: number; ttl: number }>()

// Request deduplication to prevent race conditions
const inFlightRequests = new Map<string, Promise<any>>()

async function getCache(key: string): Promise<any> {
  try {
    // Try browser cache first
    const cached = await browserCache.get(key)
    if (cached) return cached
  } catch (error) {
    console.warn('Browser cache unavailable, falling back to memory cache:', error)
  }
  
  // Fallback to in-memory cache
  const cached = fallbackCache.get(key)
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data
  }
  fallbackCache.delete(key)
  return null
}

async function setCache(key: string, data: any, ttlSeconds: number): Promise<void> {
  try {
    // Try browser cache first
    await browserCache.set(key, data, ttlSeconds)
  } catch (error) {
    console.warn('Browser cache unavailable, using memory cache:', error)
    // Fallback to in-memory cache
    fallbackCache.set(key, { data, timestamp: Date.now(), ttl: ttlSeconds * 1000 })
  }
}

// Base API URL - now using our internal API routes with Redis caching
const API_BASE_URL = '/api'

// Circuit breaker for handling 503 errors
class CircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private readonly failureThreshold = 5
  private readonly recoveryTimeout = 30000 // 30 seconds

  isOpen(): boolean {
    if (this.failures >= this.failureThreshold) {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime
      if (timeSinceLastFailure < this.recoveryTimeout) {
        return true // Circuit is open
      } else {
        // Reset circuit after recovery timeout
        this.failures = 0
        console.log('Circuit breaker reset - attempting to recover')
      }
    }
    return false
  }

  recordSuccess(): void {
    this.failures = 0
  }

  recordFailure(): void {
    this.failures++
    this.lastFailureTime = Date.now()
    if (this.failures >= this.failureThreshold) {
      console.warn(`Circuit breaker opened after ${this.failures} failures`)
    }
  }
}

const circuitBreaker = new CircuitBreaker()

// Generic fetch with retries and exponential backoff to handle transient CDN/errors
async function fetchFromAPI<T>(url: string): Promise<T> {
  const maxAttempts = 5 // Increased from 3 to 5 for better resilience
  const baseDelayMs = 500 // Increased base delay for 503 errors
  // Retry on common transient statuses; include 404 because PokeAPI/CDN can occasionally 404 briefly
  const retryStatuses = new Set([404, 408, 425, 429, 500, 502, 503, 504])
  
  // Special handling for 503 errors (Service Unavailable)
  const is503Error = (status: number) => status === 503

  // Convert relative URLs to absolute URLs
  const absoluteUrl = url.startsWith('http') ? url : `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}${url}`

  // Check circuit breaker before making request
  if (circuitBreaker.isOpen()) {
    throw new Error('Service temporarily unavailable - too many recent failures. Please try again in a moment.')
  }

  // Check for duplicate in-flight requests to prevent race conditions
  const requestKey = absoluteUrl
  if (inFlightRequests.has(requestKey)) {
    console.log('🔄 Deduplicating request:', requestKey)
    return inFlightRequests.get(requestKey) as Promise<T>
  }

  // Create the request promise and store it for deduplication
  const requestPromise = performFetchWithRetry<T>(absoluteUrl, maxAttempts, baseDelayMs, retryStatuses, is503Error)
  inFlightRequests.set(requestKey, requestPromise)

  try {
    const result = await requestPromise
    return result
  } finally {
    // Clean up the in-flight request
    inFlightRequests.delete(requestKey)
  }
}

async function performFetchWithRetry<T>(
  absoluteUrl: string,
  maxAttempts: number,
  baseDelayMs: number,
  retryStatuses: Set<number>,
  is503Error: (status: number) => boolean
): Promise<T> {

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController()
    const timeout = setTimeout(() => {
      controller.abort()
    }, 15000)
    
    try {
      // Use native fetch for better reliability
      const response = await fetch(absoluteUrl, { 
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
      clearTimeout(timeout)

      if (!response.ok) {
        const shouldRetry = retryStatuses.has(response.status) && attempt < maxAttempts
        if (shouldRetry) {
          // Special handling for 503 errors with longer delays
          let backoff = baseDelayMs * Math.pow(2, attempt - 1)
          if (is503Error(response.status)) {
            // 503 errors get extra delay (2x multiplier)
            backoff *= 2
            console.warn(`503 Service Unavailable (attempt ${attempt}/${maxAttempts}), retrying in ${backoff}ms...`)
          }
          
          const jitter = Math.floor(Math.random() * 200) // Increased jitter for better distribution
          await new Promise(res => setTimeout(res, backoff + jitter))
          continue
        }
        
        // Enhanced error reporting for 503 errors
        if (is503Error(response.status)) {
          circuitBreaker.recordFailure() // Record 503 failure
          reportApiError(`API request failed: ${response.status} - Service Unavailable`)
          throw new Error(`API request failed: ${response.status} - The Pokémon database is temporarily unavailable. Please try again in a moment.`)
        }
        
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      circuitBreaker.recordSuccess() // Record successful request
      return result
    } catch (error: any) {
      clearTimeout(timeout)
      
          // Better error handling for different types of failures
          if (error?.name === 'AbortError') {
            // Don't report abort errors as they're usually intentional timeouts
            console.warn('Request aborted (likely timeout):', error.message)
            // Don't record this as a circuit breaker failure or retry
            throw error // Re-throw to prevent retry and circuit breaker failure
          } else if (error instanceof TypeError && error.message.includes('fetch')) {
            // Only report actual network errors, not other TypeErrors
            reportNetworkError(`Network request failed: ${error.message}`)
          } else {
            reportApiError(`API request failed: ${error.message}`)
          }
      
      // Record failure for circuit breaker (only for non-abort errors)
      circuitBreaker.recordFailure()
      
      // Retry on network errors if attempts remain (but not on aborts)
      const isAbort = error?.name === 'AbortError'
      if (!isAbort && error instanceof TypeError && attempt < maxAttempts) {
        const backoff = baseDelayMs * Math.pow(2, attempt - 1)
        const jitter = Math.floor(Math.random() * 200) // Increased jitter
        console.warn(`Network error (attempt ${attempt}/${maxAttempts}), retrying in ${backoff}ms...`)
        await new Promise(res => setTimeout(res, backoff + jitter))
        continue
      }
          // Only log non-404 errors as they might be unexpected
          if (!error?.message?.includes('404')) {
            console.error('API fetch error:', error)
            // Don't report API errors for network issues that are already handled
            if (!(error instanceof TypeError && error.message.includes('fetch'))) {
              reportApiError(`API request failed: ${error?.message || 'Unknown error'}`, {
                url: absoluteUrl,
                attempt,
                maxAttempts
              })
            }
          }
      throw error
    }
  }

  // Should never reach here
  throw new Error('Failed to fetch after retries')
}

// Enhanced Pokémon image URL generators with multiple sources and fallbacks
export function getPokemonImageUrl(id: number, variant: 'default' | 'shiny' = 'default', size: 'small' | 'medium' | 'large' = 'large'): string {
  // Use official artwork for best quality
  if (variant === 'shiny') {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${id}.png`
  }
  
  // Different sizes for different use cases
  const sizeMap = {
    small: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
    medium: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${id}.png`,
    large: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
  }
  
  return sizeMap[size]
}

export function getPokemonFallbackImage(id: number): string {
  // Primary fallback - basic sprite
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
}

export function getPokemonMainPageImage(id: number): string {
  // High-quality official artwork for main pages
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
}

export function getPokemonCardImage(id: number): string {
  // Optimized for card displays
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${id}.png`
}

export function getPokemonThumbnailImage(id: number): string {
  // Small thumbnail for lists
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
}

export function getPokemonShinyImage(id: number): string {
  // Shiny variant
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${id}.png`
}

export function getPokemon3DImage(id: number): string {
  // 3D model image if available
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/3d/${id}.png`
}

export function getPokemonDreamWorldImage(id: number): string {
  // Dream World artwork (if available)
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/${id}.svg`
}

// Utility function to get the best available image with fallbacks
export function getPokemonBestImage(id: number, variant: 'default' | 'shiny' = 'default', preferType: 'artwork' | 'home' | 'sprite' = 'artwork'): string {
  const images = {
    artwork: variant === 'shiny' ? getPokemonShinyImage(id) : getPokemonMainPageImage(id),
    home: getPokemonCardImage(id),
    sprite: getPokemonFallbackImage(id)
  }
  
  return images[preferType] || images.artwork
}

// Generation-specific image sources
export function getPokemonGenerationImage(id: number, generation: number): string {
  // Some generations have specific artwork styles
  if (generation >= 8) {
    // Gen 8+ use Home artwork
    return getPokemonCardImage(id)
  } else if (generation >= 6) {
    // Gen 6-7 use official artwork
    return getPokemonMainPageImage(id)
  } else {
    // Earlier gens use sprites
    return getPokemonFallbackImage(id)
  }
}

// Pokémon list functions
export async function getPokemonList(limit = 100, offset = 0): Promise<{ results: Array<{ name: string; url: string }>; count: number }> {
  const cacheKey = getCacheKey('pokemon-list', { limit, offset })
  const cached = await getCache(cacheKey)
  if (cached) return cached

  const url = `${API_BASE_URL}/pokemon-list?limit=${limit}&offset=${offset}`
  const data = await fetchFromAPI<{ results: Array<{ name: string; url: string }>; count: number }>(url)
  await setCache(cacheKey, data, CACHE_TTL.POKEMON_LIST)
  return data
}

export async function getPokemonTotalCount(): Promise<number> {
  const cacheKey = getCacheKey('pokemon-total-count', {})
  const cached = await getCache(cacheKey)
  if (cached) return cached

  const data = await fetchFromAPI<{ count: number }>(`${API_BASE_URL}/pokemon-total-count`)
  await setCache(cacheKey, data.count, CACHE_TTL.POKEMON_TOTAL_COUNT)
  return data.count
}

// Get all valid Pokemon IDs for static generation
export async function getAllValidPokemonIds(): Promise<number[]> {
  const cacheKey = getCacheKey('all-valid-pokemon-ids', {})
  const cached = await getCache(cacheKey)
  if (cached) return cached

  try {
    // Get the total count first
    const totalCount = await getPokemonTotalCount()
    
    // Fetch all Pokemon in batches to get their IDs
    const allPokemonIds: number[] = []
    const batchSize = 100
    const totalBatches = Math.ceil(totalCount / batchSize)
    
    for (let i = 0; i < totalBatches; i++) {
      const offset = i * batchSize
      const limit = Math.min(batchSize, totalCount - offset)
      
      const pokemonList = await getPokemonList(limit, offset)
      const ids = pokemonList.results.map(pokemon => {
        const id = pokemon.url.split('/').slice(-2)[0]
        return parseInt(id)
      })
      
      allPokemonIds.push(...ids)
    }
    
    // Add special form IDs (10033-10082)
    const specialFormIds = Array.from({ length: 50 }, (_, i) => 10033 + i)
    allPokemonIds.push(...specialFormIds)
    
    await setCache(cacheKey, allPokemonIds, CACHE_TTL.POKEMON_LIST)
    return allPokemonIds
  } catch (error) {
    console.error('Failed to get all valid Pokemon IDs:', error)
    // Fallback to a reasonable range if the API fails
    return Array.from({ length: 1000 }, (_, i) => i + 1)
  }
}

// Individual Pokémon functions
export async function getPokemon(id: number | string): Promise<Pokemon> {
  const numericId = typeof id === 'string' ? parseInt(id, 10) : id
  
  // Handle special forms (Mega Evolutions, Primal Reversions)
  if (isSpecialForm(numericId)) {
    const specialFormInfo = getSpecialFormInfo(numericId)
    if (!specialFormInfo) {
      throw new Error(`Special form with ID ${id} does not exist`)
    }
    
    // Get the base Pokemon data
    const basePokemon = await getPokemon(specialFormInfo.basePokemonId)
    
    // Create a modified Pokemon object for the special form
    const specialFormPokemon: Pokemon = {
      ...basePokemon,
      id: numericId,
      name: specialFormInfo.name,
      // Add special form metadata
      special_form: {
        type: specialFormInfo.formType,
        variant: specialFormInfo.variant,
        base_pokemon_id: specialFormInfo.basePokemonId,
        base_pokemon_name: specialFormInfo.basePokemonName,
        japanese_name: specialFormInfo.japaneseName,
        description: specialFormInfo.description
      }
    }
    
    return specialFormPokemon
  }

  const cacheKey = getCacheKey('pokemon', { id })
  const cached = await getCache(cacheKey)
  if (cached) return cached

  const url = `${API_BASE_URL}/pokemon/${id}`
  try {
    const data = await fetchFromAPI<Pokemon>(url)
    await setCache(cacheKey, data, CACHE_TTL.POKEMON_DETAIL)
    return data
  } catch (error: any) {
    // Handle 404 errors specifically for non-existent Pokemon
    if (error?.message?.includes('404')) {
      throw new Error(`Pokemon with ID ${id} does not exist`)
    }
    throw error
  }
}

export async function getPokemonById(id: number | string): Promise<Pokemon> {
  return getPokemon(id)
}

export async function getPokemonSpecies(id: number | string): Promise<any> {
  const cacheKey = getCacheKey('pokemon-species', { id })
  const cached = await getCache(cacheKey)
  if (cached) return cached

  const url = `${API_BASE_URL}/pokemon-species/${id}`
  try {
    const data = await fetchFromAPI(url)
    await setCache(cacheKey, data, CACHE_TTL.POKEMON_SPECIES)
    return data
  } catch (error: any) {
    // Handle 404 errors specifically for non-existent Pokemon species
    if (error?.message?.includes('404')) {
      // For regional variants and special forms, try to get the base species
      try {
        const pokemon = await getPokemon(id)
        if (pokemon.species?.url) {
          const speciesId = pokemon.species.url.split('/').slice(-2, -1)[0]
          console.log(`Pokemon ${id} has no direct species, using base species ${speciesId}`)
          return await getPokemonSpecies(speciesId)
        }
      } catch (pokemonError) {
        console.warn(`Failed to get base species for Pokemon ${id}:`, pokemonError)
      }
      throw new Error(`Pokemon species with ID ${id} does not exist`)
    }
    throw error
  }
}

// Evolution chain functions
export async function getEvolutionChain(id: number | string): Promise<any> {
  const cacheKey = getCacheKey('evolution-chain', { id })
  const cached = await getCache(cacheKey)
  if (cached) return cached

  const url = `${API_BASE_URL}/evolution-chain/${id}`
  const data = await fetchFromAPI(url)
  await setCache(cacheKey, data, CACHE_TTL.EVOLUTION_CHAIN)
  return data
}

// Transform evolution chain data into the format expected by EvolutionSection
export async function getEvolutionChainNodes(pokemonId: number | string): Promise<Array<{ id: number; name: string; types: string[]; condition?: string }>> {
  try {
    // Get the species data first to find the evolution chain ID
    const species = await getPokemonSpecies(pokemonId)
    if (!species.evolution_chain?.url) {
      console.warn(`No evolution chain found for Pokemon ${pokemonId}`)
      return []
    }

    // Extract evolution chain ID from URL
    const evolutionChainId = species.evolution_chain.url.split('/').slice(-2, -1)[0]
    
    // Get the evolution chain data
    const evolutionChain = await getEvolutionChain(evolutionChainId)
    
    // Transform the chain data into nodes
    const nodes: Array<{ id: number; name: string; types: string[]; condition?: string }> = []
    
    const processChain = async (chain: any, condition?: string) => {
      if (!chain?.species) return
      
      try {
        // Get Pokemon ID from species URL
        const speciesPokemonId = parseInt(chain.species.url.split('/').slice(-2, -1)[0])
        
        // Get Pokemon data to get types
        const pokemon = await getPokemon(speciesPokemonId)
        const types = pokemon.types.map((t: any) => t.type.name)
        
        nodes.push({
          id: speciesPokemonId,
          name: chain.species.name,
          types,
          condition
        })
      } catch (pokemonError) {
        console.warn(`Failed to get Pokemon data for species ${chain.species.name}:`, pokemonError)
        // Add a fallback entry with basic info
        nodes.push({
          id: 0,
          name: chain.species.name,
          types: ['unknown'],
          condition
        })
      }
      
      // Process evolution details for conditions
      if (chain.evolves_to && chain.evolves_to.length > 0) {
        for (const evolution of chain.evolves_to) {
          let evolutionCondition = undefined
          
          // Extract evolution conditions
          if (evolution.evolution_details && evolution.evolution_details.length > 0) {
            const details = evolution.evolution_details[0]
            const conditions = []
            
            if (details.min_level) conditions.push(`Lv. ${details.min_level}`)
            if (details.item) conditions.push(`Item: ${details.item.name.replace('-', ' ')}`)
            if (details.time_of_day) conditions.push(details.time_of_day)
            if (details.known_move) conditions.push(`Knows ${details.known_move.name.replace('-', ' ')}`)
            if (details.known_move_type) conditions.push(`Knows ${details.known_move_type.name}-type move`)
            if (details.min_happiness) conditions.push(`Friendship: ${details.min_happiness}`)
            if (details.min_beauty) conditions.push(`Beauty: ${details.min_beauty}`)
            if (details.trigger?.name === 'trade') {
              if (details.held_item) conditions.push(`Trade with ${details.held_item.name.replace('-', ' ')}`)
              else conditions.push('Trade')
            }
            if (details.trigger?.name === 'level-up' && !details.min_level) conditions.push('Level up')
            
            evolutionCondition = conditions.join(', ') || 'Level up'
          }
          
          await processChain(evolution, evolutionCondition)
        }
      }
    }
    
    await processChain(evolutionChain.chain)
    return nodes
    
  } catch (error) {
    console.error('Failed to get evolution chain nodes:', error)
    // Return empty array instead of throwing to prevent breaking the UI
    return []
  }
}

// Type functions
export async function getType(id: number | string): Promise<any> {
  const cacheKey = getCacheKey('type', { id })
  const cached = await getCache(cacheKey)
  if (cached) return cached

  const url = `${API_BASE_URL}/type/${id}`
  const data = await fetchFromAPI(url)
  await setCache(cacheKey, data, CACHE_TTL.TYPE)
  return data
}

// Ability functions
export async function getAbility(id: number | string): Promise<any> {
  const cacheKey = getCacheKey('ability', { id })
  const cached = await getCache(cacheKey)
  if (cached) return cached

  const url = `${API_BASE_URL}/ability/${id}`
  const data = await fetchFromAPI(url)
  await setCache(cacheKey, data, CACHE_TTL.ABILITY)
  return data
}

export async function getPokemonAbilities(id: number | string): Promise<Array<{ name: string; is_hidden?: boolean; description?: string | null }>> {
  try {
    const pokemon = await getPokemon(id)
    const abilities = pokemon.abilities || []

    const abilityDetails = await Promise.all(
      abilities.map(async (entry) => {
        try {
          const abilityData = await getAbility(entry.ability.name)
          const effectEntry = abilityData?.effect_entries?.find((entry: any) => entry.language?.name === 'en')
          return {
            name: entry.ability.name,
            is_hidden: entry.is_hidden,
            description: effectEntry?.short_effect || effectEntry?.effect || null,
          }
        } catch (error) {
          console.debug('Failed to load ability details', error)
          return {
            name: entry.ability.name,
            is_hidden: entry.is_hidden,
            description: null,
          }
        }
      })
    )

    return abilityDetails
  } catch (error) {
    console.error('getPokemonAbilities error:', error)
    reportDataLoadingError('Failed to load Pokemon abilities', {
      pokemonId: id,
      error: error instanceof Error ? error.message : String(error),
    })
    return []
  }
}

export async function getPokemonMoves(id: number | string): Promise<Array<{ name: string; type: string; damage_class: 'physical' | 'special' | 'status'; power: number | null; accuracy: number | null; pp: number | null; level_learned_at: number | null; learn_method: string; short_effect: string | null }>> {
  try {
    const pokemon = await getPokemon(id)
    const moves = pokemon.moves || []

    const moveDetails = await Promise.all(
      moves.slice(0, 50).map(async (entry) => { // Limit to first 50 moves for performance
        try {
          const moveData = await getMove(entry.move.name)
          const effectEntry = moveData?.effect_entries?.find((entry: any) => entry.language?.name === 'en')
          
          // Get the most recent learn method and level
          const versionDetails = entry.version_group_details || []
          const latestVersion = versionDetails[versionDetails.length - 1]
          
          return {
            name: entry.move.name,
            type: moveData.type?.name || 'unknown',
            damage_class: moveData.damage_class?.name || 'status',
            power: moveData.power,
            accuracy: moveData.accuracy,
            pp: moveData.pp,
            level_learned_at: latestVersion?.level_learned_at || null,
            learn_method: latestVersion?.move_learn_method?.name || 'unknown',
            short_effect: effectEntry?.short_effect || effectEntry?.effect || null,
          }
        } catch (error) {
          console.debug('Failed to load move details', error)
          return {
            name: entry.move.name,
            type: 'unknown',
            damage_class: 'status',
            power: null,
            accuracy: null,
            pp: null,
            level_learned_at: null,
            learn_method: 'unknown',
            short_effect: null,
          }
        }
      })
    )

    return moveDetails
  } catch (error) {
    console.error('getPokemonMoves error:', error)
    reportDataLoadingError('Failed to load Pokemon moves', {
      pokemonId: id,
      error: error instanceof Error ? error.message : String(error),
    })
    return []
  }
}

// Move functions
export async function getMove(id: number | string): Promise<any> {
  const cacheKey = getCacheKey('move', { id })
  const cached = await getCache(cacheKey)
  if (cached) return cached

  const url = `${API_BASE_URL}/move/${id}`
  const data = await fetchFromAPI(url)
  await setCache(cacheKey, data, CACHE_TTL.MOVE)
  return data
}

// Search functions
export async function searchPokemonByName(query: string): Promise<Pokemon[]> {
  const cacheKey = getCacheKey('search-pokemon', { query })
  const cached = await getCache(cacheKey)
  if (cached) return cached

  try {
    const trimmedQuery = query.toLowerCase().trim()
    
    // Check for exact ID match (1-1302+ range) - prioritize exact matches
    if (/^\d+$/.test(trimmedQuery)) {
      const id = parseInt(trimmedQuery)
      if (id >= 1 && id <= 1302) { // Extended range to cover all generations including special forms
        try {
          const exactMatch = await getPokemon(id)
          await setCache(cacheKey, [exactMatch], CACHE_TTL.POKEMON_LIST)
          return [exactMatch]
        } catch (error) {
          // If exact ID doesn't exist, fall through to partial matching
        }
      }
    }

    // Aggregate results here to allow enriching with varieties/forms
    const results: Pokemon[] = []

    // 1) Try direct name match (covers forms like "calyrex-shadow")
    // Note: We skip direct name matching for regular Pokemon names since PokeAPI
    // doesn't reliably support name-based lookups in the /pokemon endpoint
    // Instead, we rely on the pokemon list filtering below
    if (trimmedQuery.includes('-')) {
      // Only try direct lookup for forms with hyphens (like "calyrex-shadow")
      try {
        const direct = await getPokemon(trimmedQuery)
        if (direct) results.push(direct)
      } catch (error) {
        // ignore if not a direct pokemon id/name - this is expected for many searches
        console.debug(`Direct name match failed for "${trimmedQuery}":`, error instanceof Error ? error.message : 'Unknown error')
      }
    }

    // 2) Fetch list of default Pokémon for partial matches by name/id
    const allPokemon = await getPokemonList(1000, 0)
    const listMatches = allPokemon.results.filter(pokemon => {
      const pokemonName = pokemon.name.toLowerCase()
      const pokemonId = pokemon.url.split('/').slice(-2)[0]
      if (pokemonName.includes(trimmedQuery)) return true
      if (pokemonId.includes(trimmedQuery)) return true
      return false
    })

    const limitedMatches = listMatches.slice(0, 20)
    const listDetails = await Promise.allSettled(
      limitedMatches.map(async (pokemon) => {
        const id = pokemon.url.split('/').slice(-2)[0]
        return await getPokemon(parseInt(id))
      })
    )
    // Filter out failed requests and only add successful results
    const successfulResults = listDetails
      .filter((result): result is PromiseFulfilledResult<Pokemon> => result.status === 'fulfilled')
      .map(result => result.value)
    results.push(...successfulResults)

    // 3) If the query looks like a base species name, include its varieties (forms)
    // This ensures queries like "calyrex" also return "calyrex-shadow" and "calyrex-ice"
    try {
      const species = await getPokemonSpecies(trimmedQuery)
      if (species && Array.isArray(species.varieties)) {
        const varietyDetails = await Promise.allSettled(
          species.varieties.slice(0, 20).map(async (v: any) => {
            const url = v.pokemon?.url as string | undefined
            if (!url) return null
            const idStr = url.split('/').slice(-2)[0]
            const id = parseInt(idStr)
            if (!Number.isFinite(id)) return null
            try {
              return await getPokemon(id)
            } catch (_) {
              return null
            }
          })
        )
        // Filter out failed requests and null values
        const successfulVarieties = varietyDetails
          .filter((result): result is PromiseFulfilledResult<Pokemon> => 
            result.status === 'fulfilled' && result.value !== null
          )
          .map(result => result.value)
        results.push(...successfulVarieties)
      }
    } catch (error) {
      // not a species or network hiccup; safe to ignore
      console.debug(`Species varieties lookup failed for "${trimmedQuery}":`, error instanceof Error ? error.message : 'Unknown error')
    }

    // 4) For partial matches, also check if any of the found Pokemon have varieties
    // This ensures queries like "pika" also return all Pikachu variants
    if (listMatches.length > 0) {
      const varietyPromises = listMatches.slice(0, 5).map(async (pokemon) => {
        try {
          const species = await getPokemonSpecies(pokemon.name)
          if (species && Array.isArray(species.varieties) && species.varieties.length > 1) {
            const varietyDetails = await Promise.allSettled(
              species.varieties.slice(0, 20).map(async (v: any) => {
                const url = v.pokemon?.url as string | undefined
                if (!url) return null
                const idStr = url.split('/').slice(-2)[0]
                const id = parseInt(idStr)
                if (!Number.isFinite(id)) return null
                try {
                  return await getPokemon(id)
                } catch (_) {
                  return null
                }
              })
            )
            return varietyDetails
              .filter((result): result is PromiseFulfilledResult<Pokemon | null> => 
                result.status === 'fulfilled' && result.value !== null
              )
              .map(result => result.value)
          }
          return []
        } catch (error) {
          // ignore errors for variety lookup
          console.debug(`Variety lookup failed for "${pokemon.name}":`, error instanceof Error ? error.message : 'Unknown error')
          return []
        }
      })
      
      const varietyResults = await Promise.all(varietyPromises)
      for (const varietyList of varietyResults) {
        for (const p of varietyList) {
          if (p) results.push(p)
        }
      }
    }

    // Deduplicate by id and cap to 20 for performance
    const uniqueById = new Map<number, Pokemon>()
    for (const p of results) {
      if (p && !uniqueById.has(p.id)) uniqueById.set(p.id, p)
    }
    const finalResults = Array.from(uniqueById.values()).slice(0, 20)

    await setCache(cacheKey, finalResults, CACHE_TTL.POKEMON_LIST)
    return finalResults
  } catch (error) {
    console.error('Search error for query "' + query + '":', error)
    // Don't report search errors as data loading errors since they're expected
    // when the API is temporarily unavailable
    console.debug('Search failed, returning empty results for graceful degradation')
    return []
  }
}

// Generation functions
export async function getPokemonByGeneration(generation: number): Promise<Pokemon[]> {
  const cacheKey = getCacheKey('pokemon-generation', { generation })
  const cached = await getCache(cacheKey)
  if (cached) return cached

  try {
    // Generation ranges (approximate)
    const generationRanges: Record<number, { start: number; end: number }> = {
      1: { start: 1, end: 151 },
      2: { start: 152, end: 251 },
      3: { start: 252, end: 386 },
      4: { start: 387, end: 493 },
      5: { start: 494, end: 649 },
      6: { start: 650, end: 721 },
      7: { start: 722, end: 809 },
      8: { start: 810, end: 905 },
      9: { start: 906, end: 1025 }
    }

    const range = generationRanges[generation]
    if (!range) throw new Error(`Invalid generation: ${generation}`)

    const pokemonList: Pokemon[] = []
    const batchSize = 50
    
    for (let i = range.start; i <= range.end; i += batchSize) {
      const batchEnd = Math.min(i + batchSize - 1, range.end)
      const batch = await Promise.all(
        Array.from({ length: batchEnd - i + 1 }, (_, index) => 
          getPokemon(i + index).catch(() => null)
        )
      )
      pokemonList.push(...batch.filter(p => p !== null))
    }

    await setCache(cacheKey, pokemonList, CACHE_TTL.POKEMON_LIST)
    return pokemonList
  } catch (error) {
    console.error('Generation fetch error:', error)
    reportDataLoadingError(`Failed to load generation ${generation}`, {
      generation,
      error: error instanceof Error ? error.message : String(error)
    })
    return []
  }
}

// Type filtering functions
export async function getPokemonByType(type: string): Promise<Pokemon[]> {
  const cacheKey = getCacheKey('pokemon-type', { type })
  const cached = await getCache(cacheKey)
  if (cached) return cached

  try {
    const typeData = await getType(type)
    const pokemonList = await Promise.all(
      typeData.pokemon.map(async (pokemonSlot: any) => {
        const id = pokemonSlot.pokemon.url.split('/').slice(-2)[0]
        return await getPokemon(parseInt(id)).catch(() => null)
      })
    )
    
    const validPokemon = pokemonList.filter(p => p !== null)
    await setCache(cacheKey, validPokemon, CACHE_TTL.POKEMON_LIST)
    return validPokemon
  } catch (error) {
    console.error('Type fetch error:', error)
    reportDataLoadingError(`Failed to load Pokémon of type: ${type}`, {
      type,
      error: error instanceof Error ? error.message : String(error)
    })
    return []
  }
}

// Pagination functions
export async function getPokemonWithPagination(limit = 100, offset = 0): Promise<Pokemon[]> {
  const cacheKey = getCacheKey('pokemon-pagination', { limit, offset })
  const cached = await getCache(cacheKey)
  if (cached) return cached

  try {
    const pokemonList = await getPokemonList(limit, offset)
    const pokemonDetails = await Promise.all(
      pokemonList.results.map(async (pokemon) => {
        const id = pokemon.url.split('/').slice(-2)[0]
        return await getPokemon(parseInt(id)).catch(() => null)
      })
    )
    
    const validPokemon = pokemonDetails.filter(p => p !== null)
    await setCache(cacheKey, validPokemon, CACHE_TTL.POKEMON_LIST)
    return validPokemon
  } catch (error) {
    console.error('Pagination fetch error:', error)
    reportDataLoadingError(`Failed to load Pokémon pagination (limit: ${limit}, offset: ${offset})`, {
      limit,
      offset,
      error: error instanceof Error ? error.message : String(error)
    })
    return []
  }
}

// Skeleton functions
export function generateAllPokemonSkeletons(count: number): Pokemon[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `pokemon-${i + 1}`,
    base_experience: 0,
    height: 0,
    weight: 0,
    is_default: true,
    order: i + 1,
    abilities: [],
    forms: [],
    game_indices: [],
    held_items: [],
    location_area_encounters: '',
    moves: [],
        sprites: {
          front_default: getPokemonFallbackImage(i + 1),
          front_shiny: getPokemonShinyImage(i + 1),
          front_female: null,
          front_shiny_female: null,
          back_default: null,
          back_shiny: null,
          back_female: null,
          back_shiny_female: null,
          other: {
            dream_world: { front_default: getPokemonDreamWorldImage(i + 1), front_female: null },
            home: { 
              front_default: getPokemonCardImage(i + 1), 
              front_female: null,
              front_shiny: getPokemonShinyImage(i + 1), 
              front_shiny_female: null
            },
            'official-artwork': {
              front_default: getPokemonMainPageImage(i + 1),
              front_shiny: getPokemonShinyImage(i + 1),
            },
          },
        },
    stats: [],
    types: [],
    species: { name: '', url: '' },
    evolution_chain: { name: '', url: '' } as any,
  }))
}

export async function getPokemonSkeletonsWithPagination(limit = 100, offset = 0): Promise<Pokemon[]> {
  const cacheKey = getCacheKey('pokemon-skeletons', { limit, offset })
  const cached = await getCache(cacheKey)
  if (cached) return cached

  try {
    const pokemonList = await getPokemonList(limit, offset)
    const refs = (pokemonList.results as { name: string; url: string }[]) || []
    
    if (refs.length === 0) return []

    const skeletonPokemon: Pokemon[] = refs.map((pokemonRef) => {
      const url = pokemonRef.url || ''
      const pokemonId = url.split('/').slice(-2)[0]
      const id = parseInt(pokemonId)
      
      return {
        id,
        name: pokemonRef.name,
        base_experience: 0,
        height: 0,
        weight: 0,
        is_default: true,
        order: id,
        abilities: [],
        forms: [],
        game_indices: [],
        held_items: [],
        location_area_encounters: '',
        moves: [],
        sprites: {
          front_default: getPokemonFallbackImage(id),
          front_shiny: getPokemonShinyImage(id),
          front_female: null,
          front_shiny_female: null,
          back_default: null,
          back_shiny: null,
          back_female: null,
          back_shiny_female: null,
          other: {
            dream_world: { front_default: getPokemonDreamWorldImage(id), front_female: null },
            home: { 
              front_default: getPokemonCardImage(id), 
              front_female: null,
              front_shiny: getPokemonShinyImage(id), 
              front_shiny_female: null
            },
            'official-artwork': {
              front_default: getPokemonMainPageImage(id),
              front_shiny: getPokemonShinyImage(id),
            },
          },
        },
        stats: [],
        types: [],
        species: { name: '', url: '' },
        evolution_chain: { name: '', url: '' } as any,
      }
    })

    await setCache(cacheKey, skeletonPokemon, CACHE_TTL.POKEMON_SKELETONS)
    return skeletonPokemon
  } catch (error) {
    console.error('Error fetching skeleton Pokemon:', error)
    reportDataLoadingError(`Failed to load skeleton Pokémon data`, {
      error: error instanceof Error ? error.message : String(error)
    })
    return []
  }
}

export async function hydratePokemonSkeletons(
  skeletonPokemon: Pokemon[],
  onProgress?: (loaded: number, total: number) => void
): Promise<Pokemon[]> {
  const hydratedPokemon: Pokemon[] = []
  const batchSize = 5
  let loaded = 0

  for (let i = 0; i < skeletonPokemon.length; i += batchSize) {
    const batch = skeletonPokemon.slice(i, i + batchSize)
    
    const batchPromises = batch.map(async (skeleton) => {
      try {
        const fullPokemon = await getPokemon(skeleton.id)
        return fullPokemon
      } catch (error) {
        console.warn(`Failed to hydrate Pokemon ${skeleton.id}:`, error)
        return skeleton
      }
    })

    const batchResults = await Promise.all(batchPromises)
    hydratedPokemon.push(...batchResults)
    
    loaded += batch.length
    onProgress?.(loaded, skeletonPokemon.length)
    
    if (i + batchSize < skeletonPokemon.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  return hydratedPokemon
}

// Page skeleton functions
export function getPokemonPageSkeleton(count: number): Pokemon[] {
  return generateAllPokemonSkeletons(count)
}

// Type effectiveness calculation
export function calculateTypeEffectiveness(attackingTypes: string[], defendingTypes: string[]): number {
  // Simplified type effectiveness calculation
  // This would need to be implemented with the full type chart
  const typeChart: Record<string, Record<string, number>> = {
    normal: { rock: 0.5, ghost: 0, steel: 0.5 },
    fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
    water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
    electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
    grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
    ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
    fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 1, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
    poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
    ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 1, rock: 2, steel: 2 },
    flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
    psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
    bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
    rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
    ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
    dragon: { dragon: 2, steel: 0.5, fairy: 0 },
    dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
    steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, fairy: 2, steel: 0.5 },
    fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 }
  }

  let effectiveness = 1
  
  for (const attackingType of attackingTypes) {
    for (const defendingType of defendingTypes) {
      const multiplier = typeChart[attackingType]?.[defendingType] || 1
      effectiveness *= multiplier
    }
  }
  
  return effectiveness
}
