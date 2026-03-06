import { browserCache, getCacheKey, CACHE_TTL } from '@/lib/memcached'

const PREFETCH_STATE_KEY = 'pokemon-offline-prefetch-state'

export interface PrefetchProgress {
  phase: 'idle' | 'pokemon' | 'species' | 'types' | 'images' | 'done' | 'error'
  current: number
  total: number
  message: string
  startedAt: number | null
  completedAt: number | null
  error?: string
}

export interface PrefetchState {
  lastFullPrefetch: number | null
  cachedPokemonCount: number
  cachedSpeciesCount: number
  cachedTypeCount: number
}

const API_BASE = 'https://pokeapi.co/api/v2'
const TOTAL_POKEMON = 1025
const BATCH_SIZE = 20
const BATCH_DELAY_MS = 300
const ALL_TYPES = [
  'normal','fire','water','electric','grass','ice',
  'fighting','poison','ground','flying','psychic',
  'bug','rock','ghost','dragon','dark','steel','fairy',
]

function loadState(): PrefetchState {
  try {
    const raw = localStorage.getItem(PREFETCH_STATE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { lastFullPrefetch: null, cachedPokemonCount: 0, cachedSpeciesCount: 0, cachedTypeCount: 0 }
}

function saveState(state: PrefetchState) {
  try { localStorage.setItem(PREFETCH_STATE_KEY, JSON.stringify(state)) } catch {}
}

export function getPrefetchState(): PrefetchState {
  return loadState()
}

async function fetchJSON(url: string): Promise<any> {
  const resp = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(15000),
  })
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  return resp.json()
}

async function cacheIfMissing(cacheKey: string, url: string, ttl: number): Promise<boolean> {
  const existing = await browserCache.get(cacheKey)
  if (existing) return false
  const data = await fetchJSON(url)
  await browserCache.set(cacheKey, data, ttl)
  return true
}

export async function prefetchAllData(
  onProgress: (p: PrefetchProgress) => void,
  abortSignal?: AbortSignal,
): Promise<void> {
  const state = loadState()
  let pokemonCached = 0
  let speciesCached = 0

  const progress: PrefetchProgress = {
    phase: 'types',
    current: 0,
    total: ALL_TYPES.length + TOTAL_POKEMON * 2,
    message: 'Caching type data...',
    startedAt: Date.now(),
    completedAt: null,
  }
  onProgress({ ...progress })

  try {
    // Phase 1: Types (small, fast)
    for (const typeName of ALL_TYPES) {
      if (abortSignal?.aborted) throw new Error('Cancelled')
      const key = getCacheKey('type', { id: typeName })
      await cacheIfMissing(key, `${API_BASE}/type/${typeName}`, CACHE_TTL.TYPE)
      progress.current++
      onProgress({ ...progress })
    }
    state.cachedTypeCount = ALL_TYPES.length

    // Phase 2: Pokemon detail data in batches
    progress.phase = 'pokemon'
    progress.message = 'Downloading Pokemon data...'
    onProgress({ ...progress })

    for (let start = 1; start <= TOTAL_POKEMON; start += BATCH_SIZE) {
      if (abortSignal?.aborted) throw new Error('Cancelled')
      const end = Math.min(start + BATCH_SIZE - 1, TOTAL_POKEMON)
      const ids = Array.from({ length: end - start + 1 }, (_, i) => start + i)

      const promises = ids.map(async (id) => {
        const key = getCacheKey('pokemon', { id })
        const fetched = await cacheIfMissing(key, `${API_BASE}/pokemon/${id}`, CACHE_TTL.POKEMON_DETAIL)
        if (fetched) pokemonCached++
      })
      await Promise.allSettled(promises)

      progress.current += ids.length
      progress.message = `Pokemon ${Math.min(end, TOTAL_POKEMON)}/${TOTAL_POKEMON}`
      onProgress({ ...progress })

      if (start + BATCH_SIZE <= TOTAL_POKEMON) {
        await new Promise(r => setTimeout(r, BATCH_DELAY_MS))
      }
    }
    state.cachedPokemonCount = TOTAL_POKEMON

    // Phase 3: Species data (needed for detail pages, evolution chains, flavor text)
    progress.phase = 'species'
    progress.message = 'Downloading species data...'
    onProgress({ ...progress })

    for (let start = 1; start <= TOTAL_POKEMON; start += BATCH_SIZE) {
      if (abortSignal?.aborted) throw new Error('Cancelled')
      const end = Math.min(start + BATCH_SIZE - 1, TOTAL_POKEMON)
      const ids = Array.from({ length: end - start + 1 }, (_, i) => start + i)

      const promises = ids.map(async (id) => {
        const key = getCacheKey('pokemon-species', { id })
        const fetched = await cacheIfMissing(key, `${API_BASE}/pokemon-species/${id}`, CACHE_TTL.POKEMON_SPECIES)
        if (fetched) speciesCached++
      })
      await Promise.allSettled(promises)

      progress.current += ids.length
      progress.message = `Species ${Math.min(end, TOTAL_POKEMON)}/${TOTAL_POKEMON}`
      onProgress({ ...progress })

      if (start + BATCH_SIZE <= TOTAL_POKEMON) {
        await new Promise(r => setTimeout(r, BATCH_DELAY_MS))
      }
    }
    state.cachedSpeciesCount = TOTAL_POKEMON

    // Phase 4: Prefetch images via SW (fire-and-forget to the cache API)
    progress.phase = 'images'
    progress.message = 'Caching Pokemon images and trainer sprites...'
    onProgress({ ...progress })
    await prefetchImagesViaSW(TOTAL_POKEMON)
    await prefetchTrainerImages()

    // Build offline search index as a byproduct
    await buildSearchIndex()

    progress.phase = 'done'
    progress.current = progress.total
    progress.message = 'All data cached for offline use!'
    progress.completedAt = Date.now()
    state.lastFullPrefetch = Date.now()
    saveState(state)
    onProgress({ ...progress })
  } catch (err: any) {
    if (err.message === 'Cancelled') {
      progress.phase = 'idle'
      progress.message = 'Cancelled'
    } else {
      progress.phase = 'error'
      progress.message = err.message || 'Download failed'
      progress.error = err.message
    }
    saveState(state)
    onProgress({ ...progress })
    throw err
  }
}

async function prefetchImagesViaSW(count: number) {
  if (typeof navigator === 'undefined' || !navigator.serviceWorker?.controller) return
  const ids = Array.from({ length: count }, (_, i) => i + 1)
  // Send in smaller chunks to avoid message size issues
  const chunkSize = 100
  for (let i = 0; i < ids.length; i += chunkSize) {
    navigator.serviceWorker.controller.postMessage({
      type: 'PREFETCH_POKEMON',
      pokemonIds: ids.slice(i, i + chunkSize),
    })
    await new Promise(r => setTimeout(r, 200))
  }
}

async function prefetchTrainerImages(): Promise<void> {
  try {
    const { GYM_CHAMPIONS } = await import('@/lib/gym_champions')
    const { getTrainerSpriteUrl } = await import('@/lib/trainerSprites')

    const urls = new Set<string>()
    const pokemonIds = new Set<number>()

    for (const champion of GYM_CHAMPIONS) {
      urls.add(getTrainerSpriteUrl(champion))
      for (const slot of champion.team.slots) {
        pokemonIds.add(slot.id)
        // Battle sprites
        urls.add(`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${slot.id}.png`)
        urls.add(`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${slot.id}.png`)
      }
    }

    // Prefetch trainer sprites (local assets, goes through SW)
    const localUrls = Array.from(urls).filter(u => u.startsWith('/'))
    await Promise.allSettled(localUrls.map(url => fetch(url).catch(() => {})))

    // Prefetch remote battle sprites via SW
    const remoteUrls = Array.from(urls).filter(u => u.startsWith('http'))
    await Promise.allSettled(remoteUrls.map(url => fetch(url).catch(() => {})))

    // Ensure champion team Pokemon data is cached
    for (const id of pokemonIds) {
      const key = getCacheKey('pokemon', { id })
      await cacheIfMissing(key, `${API_BASE}/pokemon/${id}`, CACHE_TTL.POKEMON_DETAIL).catch(() => {})
    }
  } catch (err) {
    console.warn('Trainer image prefetch failed:', err)
  }
}

export async function buildSearchIndex(): Promise<void> {
  const indexKey = 'pokemon:search-index'
  const existing = await browserCache.get(indexKey)
  if (existing) return

  try {
    const allEntries: Array<{ id: number; name: string }> = []
    const batchSize = 200
    for (let offset = 0; offset < TOTAL_POKEMON; offset += batchSize) {
      const limit = Math.min(batchSize, TOTAL_POKEMON - offset)
      const listKey = getCacheKey('pokemon-list', { limit, offset })
      let list = await browserCache.get<{ results: Array<{ name: string; url: string }> }>(listKey)
      if (!list) {
        const resp = await fetch(`${API_BASE}/pokemon/?limit=${limit}&offset=${offset}`)
        if (resp.ok) {
          list = await resp.json()
          await browserCache.set(listKey, list, CACHE_TTL.POKEMON_LIST)
        }
      }
      if (list?.results) {
        for (const entry of list.results) {
          const id = parseInt(entry.url.split('/').filter(Boolean).pop() || '0')
          if (id > 0) allEntries.push({ id, name: entry.name })
        }
      }
    }
    await browserCache.set(indexKey, allEntries, CACHE_TTL.POKEMON_LIST)
  } catch (err) {
    console.warn('Failed to build search index:', err)
  }
}

export async function getSearchIndex(): Promise<Array<{ id: number; name: string }> | null> {
  return browserCache.get<Array<{ id: number; name: string }>>('pokemon:search-index')
}

/**
 * Eagerly preload all 18 type records on app startup.
 * Skips any that are already cached. Safe to call multiple times.
 */
export async function preloadTypeData(): Promise<void> {
  if (typeof window === 'undefined') return
  if (!navigator.onLine) return

  const uncached: string[] = []
  for (const name of ALL_TYPES) {
    const key = getCacheKey('type', { id: name })
    const exists = await browserCache.get(key)
    if (!exists) uncached.push(name)
  }
  if (uncached.length === 0) return

  for (const name of uncached) {
    try {
      const key = getCacheKey('type', { id: name })
      await cacheIfMissing(key, `${API_BASE}/type/${name}`, CACHE_TTL.TYPE)
    } catch {
      // non-critical, will retry next load
    }
  }
}
