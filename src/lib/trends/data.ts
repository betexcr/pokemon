import top50Raw from '@/data/top50.json'
import enhancedTrendsRaw from '@/data/enhanced-trends.json'
import type { PokemonPopularityRecord, PokemonTrendView, RegionKey, TrendYearSnapshot, RegionalRank } from './types'

export const REGION_KEYS: RegionKey[] = ['Global', 'Asia', 'US', 'EU']
export const TREND_YEARS = [2020, 2021, 2022, 2023, 2024, 2025]

const base: PokemonPopularityRecord[] = top50Raw as PokemonPopularityRecord[]
const enhancedBase: PokemonTrendView[] = enhancedTrendsRaw as PokemonTrendView[]

// Real data only - no regional bias calculations needed

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function round1(value: number) {
  return Math.round(value * 10) / 10
}

// Real historical data only - show only the actual peak year data point
function generateTrend(entry: PokemonPopularityRecord): TrendYearSnapshot[] {
  // Only return the actual peak year data point
  const peakYearData: TrendYearSnapshot = {
    year: entry.peak_year,
    values: REGION_KEYS.reduce<Record<RegionKey, number>>((acc, region) => {
      acc[region] = round1(entry.peak_percent)
      return acc
    }, {} as Record<RegionKey, number>)
  }
  
  // Return array with only the peak year data point
  return [peakYearData]
}

// Use enhanced data if available, fallback to generated trends
export const TREND_DATA: PokemonTrendView[] = enhancedBase.length > 0 ? enhancedBase : base
  .map((entry) => ({
    ...entry,
    trend: generateTrend(entry),
  }))
  .sort((a, b) => a.rank_global - b.rank_global)

export function getPokemonNames(): string[] {
  return TREND_DATA.map((item) => item.name)
}

export function findPokemonByName(name: string): PokemonTrendView | undefined {
  return TREND_DATA.find((p) => p.name.toLowerCase() === name.toLowerCase())
}

export function computeRegionalRanking(year: number, region: RegionKey, limit = 20, selectedPokemon?: string): RegionalRank[] {
  const allRankings = TREND_DATA
    .map((entry) => {
      const snapshot = entry.trend.find((t) => t.year === year) ?? entry.trend[entry.trend.length - 1]
      return {
        name: entry.name,
        percent: snapshot.values[region],
        national_number: entry.national_number,
        sources: entry.notable_sources,
      }
    })
    .sort((a, b) => b.percent - a.percent)
    .map((item, index) => ({ ...item, rank: index + 1 }))

  // If no selected Pokemon, return top limit
  if (!selectedPokemon) {
    return allRankings.slice(0, limit)
  }

  // Find the selected Pokemon's rank
  const selectedIndex = allRankings.findIndex(p => p.name.toLowerCase() === selectedPokemon.toLowerCase())
  
  // If selected Pokemon not found, return top limit
  if (selectedIndex === -1) {
    return allRankings.slice(0, limit)
  }

  // Get Pokemon around the selected one (2 before, selected, 2 after = 5 total)
  const startIndex = Math.max(0, selectedIndex - 2)
  const endIndex = Math.min(allRankings.length, startIndex + 5)
  
  return allRankings.slice(startIndex, endIndex)
}

export function filterPokemon(options: {
  generations: number[]
  types: string[]
}): PokemonTrendView[] {
  const { generations, types } = options
  return TREND_DATA.filter((entry) => {
    if (generations.length > 0 && !generations.includes(entry.generation)) return false
    if (types.length > 0 && !types.every((t) => entry.types.includes(t))) return false
    return true
  })
}

export function getGenerations(): number[] {
  return Array.from(new Set(TREND_DATA.map((e) => e.generation))).sort((a, b) => a - b)
}

export function getTypes(): string[] {
  return Array.from(new Set(TREND_DATA.flatMap((e) => e.types))).sort((a, b) => a.localeCompare(b))
}

export function getDefaultPokemon(): PokemonTrendView {
  return TREND_DATA[0]
}

