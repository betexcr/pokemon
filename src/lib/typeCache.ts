import { getType } from '@/lib/api'

const TYPE_NAMES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison',
  'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
]

const typeCache = new Map<number, string[]>()
const inFlightTypes = new Map<number, Promise<string[]>>()
let preloadPromise: Promise<void> | null = null

const TYPE_ENDPOINT_PREFIX = 'https://pokeapi.co/api/v2/type/'

function extractIdFromUrl(url: string): number | null {
  if (!url) return null
  const parts = url.split('/').filter(Boolean)
  const idStr = parts[parts.length - 1]
  const id = parseInt(idStr, 10)
  return Number.isFinite(id) ? id : null
}

async function fetchTypeData(typeName: string): Promise<void> {
  try {
    const data = await getType(typeName)
    const entries = data.pokemon || []
    entries.forEach((entry: any) => {
      const id = extractIdFromUrl(entry.pokemon?.url || '')
      if (!id) return
      const existing = typeCache.get(id) || []
      if (!existing.includes(typeName)) {
        typeCache.set(id, [...existing, typeName])
      }
    })
  } catch (error) {
    console.warn(`Failed to preload type data for ${typeName}:`, error)
  }
}

async function preloadTypeCache(): Promise<void> {
  if (preloadPromise) {
    await preloadPromise
    return
  }

  preloadPromise = (async () => {
    const concurrency = 3
    for (let i = 0; i < TYPE_NAMES.length; i += concurrency) {
      const batch = TYPE_NAMES.slice(i, i + concurrency)
      await Promise.all(batch.map(name => fetchTypeData(name)))
    }
  })()

  await preloadPromise
}

export async function ensureTypeCache(): Promise<Map<number, string[]>> {
  if (typeCache.size > 0) return typeCache
  await preloadTypeCache()
  return typeCache
}

export function applyCachedTypes<T extends { id: number; types?: any[] }>(pokemon: T): T {
  const cached = typeCache.get(pokemon.id)
  if (!cached || cached.length === 0) {
    return pokemon
  }

  const typedPokemon = { ...pokemon }
  typedPokemon.types = cached.map((typeName, index) => ({
    slot: index + 1,
    type: {
      name: typeName,
      url: `${TYPE_ENDPOINT_PREFIX}${typeName}`
    }
  }))
  return typedPokemon
}

export function cachePokemonTypes(id: number, types: string[]): void {
  if (!types || types.length === 0) return
  typeCache.set(id, Array.from(new Set(types)))
}

