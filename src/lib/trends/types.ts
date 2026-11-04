/**
 * Popularity regions are groups of Wikipedia language editions:
 * - English: en.wikipedia
 * - Asia: ja / ko / zh
 * - Europe: de / fr / es / it
 * - Global: all of the above combined
 */
export type PopularityRegion = 'Global' | 'English' | 'Asia' | 'Europe'

/** @deprecated kept for older saved preferences; use PopularityRegion. */
export type RegionKey = PopularityRegion

export interface PopularityEdition {
  lang: string
  label: string
  region: Exclude<PopularityRegion, 'Global'>
  /** Localised Pokémon name used to look up the article. */
  localName: string | null
  /** Wikipedia titles whose pageviews are counted. Empty when none matched. */
  titles: string[]
  urls: string[]
  /** Total user pageviews counted in the covered window. */
  totalViews: number
  error?: string
}

export interface PokemonPopularity {
  pokemon: {
    id: number
    slug: string
    name: string
    generation: number | null
  }
  metric: 'avg_daily_pageviews'
  coverage: { start: string; end: string } | null
  yearly: Array<{ year: number; values: Record<PopularityRegion, number>; partial: boolean }>
  monthly: Array<{ month: string; values: Record<PopularityRegion, number> }>
  editions: PopularityEdition[]
  source: {
    label: string
    url: string
    fetchedAt: string
  }
}

export interface TrendsState {
  pokemon: string
  compare: string[]
  region: PopularityRegion
  year: number
  generations: number[]
  types: string[]
}

export interface PersistableTrendsState extends TrendsState {
  updatedAt: number
}
