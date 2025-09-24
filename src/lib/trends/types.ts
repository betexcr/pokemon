export type RegionKey = 'Global' | 'Asia' | 'US' | 'EU'

export interface PokemonPopularityRecord {
  name: string
  rank_global: number
  peak_percent: number
  peak_year: number
  notable_sources: string[]
  national_number: number
  generation: number
  home_region: string
  types: string[]
  competitive_tier: 'meta' | 'fan-favorite' | 'niche'
  variant_tag?: string
  dex_base?: number
}

export interface TrendYearSnapshot {
  year: number
  values: Record<RegionKey, number>
}

export interface RegionalRank {
  name: string
  percent: number
  rank: number
  national_number: number
  sources: string[]
}

export interface PokemonTrendView extends PokemonPopularityRecord {
  trend: TrendYearSnapshot[]
}

export interface TrendsState {
  pokemon: string
  region: RegionKey
  year: number
  generations: number[]
  types: string[]
}

export interface PersistableTrendsState {
  pokemon: string
  region: RegionKey
  year: number
  generations: number[]
  types: string[]
  updatedAt: number
}

