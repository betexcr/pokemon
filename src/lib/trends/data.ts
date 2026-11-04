import type { PokemonPopularity, PopularityRegion } from './types'
import { POPULARITY_REGIONS, toSpeciesSlug } from './wikipedia'

export const REGION_KEYS: PopularityRegion[] = POPULARITY_REGIONS

export const REGION_DESCRIPTIONS: Record<PopularityRegion, string> = {
  Global: 'All tracked Wikipedia editions (en, ja, ko, zh, de, fr, es, it)',
  English: 'English Wikipedia',
  Asia: 'Japanese, Korean and Chinese Wikipedia',
  Europe: 'German, French, Spanish and Italian Wikipedia',
}

/** Shown on first visit (no URL params or saved preferences). The first one is the focused Pokémon. */
export const DEFAULT_SELECTION = ['Mew', 'Meowth', 'Gengar', 'Pikachu']

const LEGACY_REGIONS: Record<string, PopularityRegion> = { US: 'English', EU: 'Europe' }

/** Accept current region keys plus the retired `US` / `EU` values from old URLs and saved prefs. */
export function normalizeRegion(value: unknown): PopularityRegion | undefined {
  if (typeof value !== 'string') return undefined
  if ((REGION_KEYS as string[]).includes(value)) return value as PopularityRegion
  return LEGACY_REGIONS[value]
}

const DISPLAY_NAME_OVERRIDES: Record<string, string> = {
  'mr-mime': 'Mr. Mime',
  'mime-jr': 'Mime Jr.',
  'mr-rime': 'Mr. Rime',
  farfetchd: "Farfetch'd",
  sirfetchd: "Sirfetch'd",
  'nidoran-f': 'Nidoran♀',
  'nidoran-m': 'Nidoran♂',
  'type-null': 'Type: Null',
  flabebe: 'Flabébé',
  'ho-oh': 'Ho-Oh',
  'porygon-z': 'Porygon-Z',
  'jangmo-o': 'Jangmo-o',
  'hakamo-o': 'Hakamo-o',
  'kommo-o': 'Kommo-o',
  'wo-chien': 'Wo-Chien',
  'chien-pao': 'Chien-Pao',
  'ting-lu': 'Ting-Lu',
  'chi-yu': 'Chi-Yu',
}

/** Human-readable English name for a PokeAPI species slug. Round-trips through `toSpeciesSlug`. */
export function speciesDisplayName(slug: string): string {
  const override = DISPLAY_NAME_OVERRIDES[slug]
  if (override) return override
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export { toSpeciesSlug }

export function formatViews(value: number): string {
  if (!Number.isFinite(value)) return '0'
  if (value >= 1000) {
    return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
  }
  if (value >= 100) return String(Math.round(value))
  return String(Math.round(value * 10) / 10)
}

export function percentChange(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous <= 0) return null
  return Math.round(((current - previous) / previous) * 1000) / 10
}

export function peakYear(data: PokemonPopularity, region: PopularityRegion) {
  return data.yearly.reduce<{ year: number; value: number } | null>((best, point) => {
    const value = point.values[region]
    return !best || value > best.value ? { year: point.year, value } : best
  }, null)
}

export async function fetchPokemonPopularity(pokemon: string, signal?: AbortSignal): Promise<PokemonPopularity> {
  const res = await fetch(`/api/trends/popularity?pokemon=${encodeURIComponent(toSpeciesSlug(pokemon))}`, { signal })
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error || `Request failed (${res.status})`)
  }
  return (await res.json()) as PokemonPopularity
}

export interface SpeciesOption {
  id: number
  slug: string
  name: string
}

export async function fetchSpeciesOptions(signal?: AbortSignal): Promise<SpeciesOption[]> {
  const res = await fetch('/api/trends/species', { signal })
  if (!res.ok) throw new Error(`Species list failed (${res.status})`)
  const body = (await res.json()) as { species: Array<{ id: number; slug: string }> }
  return body.species.map((entry) => ({ ...entry, name: speciesDisplayName(entry.slug) }))
}
