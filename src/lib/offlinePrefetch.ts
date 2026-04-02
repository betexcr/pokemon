import { browserCache, getCacheKey, CACHE_TTL } from '@/lib/memcached'

const API_BASE = 'https://pokeapi.co/api/v2'
const TOTAL_POKEMON = 1025
const ALL_TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic',
  'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
]

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
