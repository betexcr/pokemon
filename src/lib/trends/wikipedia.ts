/**
 * Pure helpers for turning Wikipedia article titles + Wikimedia pageview series
 * into the popularity trend shape used by `/trends`.
 *
 * No network access here — see `popularityService.ts` for fetching.
 */

import type { PopularityRegion } from './types'

export type EditionRegion = Exclude<PopularityRegion, 'Global'>

export interface WikiEdition {
  /** Wikipedia language subdomain, e.g. `en` → en.wikipedia.org */
  lang: string
  label: string
  region: EditionRegion
  /** PokeAPI `pokemon-species.names[].language.name` values (lowercase, e.g. `ja-hrkt`) to try, in order. */
  pokeapiLanguages: string[]
  /** Disambiguation suffixes tried before the bare name, e.g. ` (Pokémon)`. */
  qualifierSuffixes: string[]
}

export const WIKI_EDITIONS: WikiEdition[] = [
  { lang: 'en', label: 'English', region: 'English', pokeapiLanguages: ['en'], qualifierSuffixes: [' (Pokémon)'] },
  { lang: 'ja', label: 'Japanese', region: 'Asia', pokeapiLanguages: ['ja-hrkt', 'ja'], qualifierSuffixes: [' (ポケモン)'] },
  { lang: 'ko', label: 'Korean', region: 'Asia', pokeapiLanguages: ['ko'], qualifierSuffixes: [' (포켓몬)'] },
  { lang: 'zh', label: 'Chinese', region: 'Asia', pokeapiLanguages: ['zh-hant', 'zh-hans'], qualifierSuffixes: [' (宝可梦)', ' (寶可夢)'] },
  { lang: 'de', label: 'German', region: 'Europe', pokeapiLanguages: ['de'], qualifierSuffixes: [' (Pokémon)'] },
  { lang: 'fr', label: 'French', region: 'Europe', pokeapiLanguages: ['fr'], qualifierSuffixes: [' (Pokémon)'] },
  { lang: 'es', label: 'Spanish', region: 'Europe', pokeapiLanguages: ['es'], qualifierSuffixes: [' (Pokémon)'] },
  { lang: 'it', label: 'Italian', region: 'Europe', pokeapiLanguages: ['it'], qualifierSuffixes: [' (Pokémon)'] },
]

export const POPULARITY_REGIONS: PopularityRegion[] = ['Global', 'English', 'Asia', 'Europe']

/** First full calendar year of Wikimedia's per-article pageview data (starts 2015-07). */
export const PAGEVIEWS_START_YEAR = 2016

// ---------------------------------------------------------------------------
// Title resolution
// ---------------------------------------------------------------------------

export interface WikiQueryResponse {
  query?: {
    normalized?: Array<{ from: string; to: string }>
    converted?: Array<{ from: string; to: string }>
    redirects?: Array<{ from: string; to: string }>
    pages?: Array<{
      title: string
      missing?: boolean
      invalid?: boolean
      pageprops?: Record<string, string>
    }>
  }
}

export function candidateTitles(name: string, suffixes: string[]): string[] {
  const trimmed = name.trim()
  if (!trimmed) return []
  return Array.from(new Set([...suffixes.map((suffix) => `${trimmed}${suffix}`), trimmed]))
}

interface ResolvedCandidate {
  /** Title as stored by Wikipedia (after normalisation / variant conversion). */
  canonical: string
  /** Final page title after following a redirect (same as canonical when not a redirect). */
  final: string
  isRedirect: boolean
  exists: boolean
  isDisambiguation: boolean
}

function resolveCandidate(title: string, response: WikiQueryResponse): ResolvedCandidate {
  const query = response.query ?? {}
  let canonical = title
  const normalized = query.normalized?.find((entry) => entry.from === canonical)
  if (normalized) canonical = normalized.to
  const converted = query.converted?.find((entry) => entry.from === canonical)
  if (converted) canonical = converted.to
  const redirect = query.redirects?.find((entry) => entry.from === canonical)
  const final = redirect?.to ?? canonical
  const page = query.pages?.find((entry) => entry.title === final)
  const exists = Boolean(page && !page.missing && !page.invalid)
  return {
    canonical,
    final,
    isRedirect: Boolean(redirect),
    exists,
    isDisambiguation: Boolean(page?.pageprops && 'disambiguation' in page.pageprops),
  }
}

/**
 * Pick the article titles whose pageviews represent interest in this Pokémon.
 *
 * Wikimedia attributes views of a redirect to the redirect title, so for a
 * Pokémon without its own article (e.g. "Snom" → "List of generation VIII
 * Pokémon") we count the redirect title rather than the list article.
 * Bare names that collide with other topics ("Golem", "Ditto") are only used
 * when they clearly point at the same page as the qualified "(Pokémon)" title.
 */
export function selectArticleTitles(name: string, suffixes: string[], response: WikiQueryResponse): string[] {
  const trimmed = name.trim()
  if (!trimmed) return []
  const qualified = suffixes.map((suffix) => resolveCandidate(`${trimmed}${suffix}`, response))
  const plain = resolveCandidate(trimmed, response)

  const dedicatedTitles = new Set<string>([plain.canonical, ...qualified.map((entry) => entry.canonical)])
  const picked: string[] = []
  const add = (title: string) => {
    if (!picked.includes(title)) picked.push(title)
  }

  const primaryQualified = qualified.find((entry) => entry.exists && !entry.isDisambiguation)
  if (primaryQualified) {
    add(primaryQualified.canonical)
    if (primaryQualified.isRedirect && dedicatedTitles.has(primaryQualified.final)) {
      add(primaryQualified.final)
    }
  }

  if (plain.exists && !plain.isDisambiguation) {
    if (!primaryQualified) {
      add(plain.canonical)
      if (plain.isRedirect && dedicatedTitles.has(plain.final)) add(plain.final)
    } else if (plain.final === primaryQualified.final) {
      // Both titles lead to the same page: the bare name is unambiguous.
      add(plain.canonical)
    }
  }

  return picked
}

export function wikipediaArticleUrl(lang: string, title: string): string {
  return `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`
}

// ---------------------------------------------------------------------------
// Pageview aggregation
// ---------------------------------------------------------------------------

export interface PageviewItem {
  /** `YYYYMMDDHH`, e.g. `2025010100` for January 2025 monthly granularity. */
  timestamp: string
  views: number
}

export interface EditionPageviews {
  lang: string
  region: EditionRegion
  /** Items from every selected title of this edition (summed per month). */
  items: PageviewItem[]
}

export type RegionValues = Record<PopularityRegion, number>

export interface YearlyPopularityPoint {
  year: number
  /** Average daily pageviews over the covered part of the year. */
  values: RegionValues
  /** True when the year is not yet complete in the data. */
  partial: boolean
}

export interface MonthlyPopularityPoint {
  /** `YYYY-MM` */
  month: string
  /** Average daily pageviews for the month. */
  values: RegionValues
}

export interface AggregatedPopularity {
  coverage: { start: string; end: string } | null
  yearly: YearlyPopularityPoint[]
  monthly: MonthlyPopularityPoint[]
  totalsByLang: Record<string, number>
}

function monthKeyFromTimestamp(timestamp: string): string | null {
  const match = /^(\d{4})(\d{2})/.exec(timestamp)
  return match ? `${match[1]}-${match[2]}` : null
}

function daysInMonth(year: number, month1: number): number {
  return new Date(Date.UTC(year, month1, 0)).getUTCDate()
}

function emptyValues(): RegionValues {
  return { Global: 0, English: 0, Asia: 0, Europe: 0 }
}

function roundValues(values: RegionValues, divisor: number): RegionValues {
  const out = emptyValues()
  for (const region of POPULARITY_REGIONS) {
    out[region] = divisor > 0 ? Math.round((values[region] / divisor) * 10) / 10 : 0
  }
  return out
}

/** Last fully elapsed calendar month (UTC) relative to `now`, as `YYYY-MM`. */
export function lastCompleteMonth(now: Date): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

function previousMonth(month: string): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 2, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

/**
 * Sum monthly pageviews per region, then express them as average daily views
 * per month and per year. Region "Global" is the sum of all tracked editions.
 */
export function aggregatePageviews(
  editions: EditionPageviews[],
  options: { now: Date; startYear?: number }
): AggregatedPopularity {
  const startYear = options.startYear ?? PAGEVIEWS_START_YEAR
  const startMonth = `${startYear}-01`
  const cap = lastCompleteMonth(options.now)

  const byMonth = new Map<string, RegionValues>()
  const totalsByLang: Record<string, number> = {}
  let latestPresent: string | null = null

  for (const edition of editions) {
    totalsByLang[edition.lang] = totalsByLang[edition.lang] ?? 0
    for (const item of edition.items) {
      const month = monthKeyFromTimestamp(item.timestamp)
      if (!month || month < startMonth || month > cap) continue
      const views = Number.isFinite(item.views) ? Math.max(0, item.views) : 0
      const bucket = byMonth.get(month) ?? emptyValues()
      bucket[edition.region] += views
      bucket.Global += views
      byMonth.set(month, bucket)
      totalsByLang[edition.lang] += views
      if (!latestPresent || month > latestPresent) latestPresent = month
    }
  }

  if (!latestPresent) {
    return { coverage: null, yearly: [], monthly: [], totalsByLang }
  }

  // Wikimedia publishes a month's data a day or two after it ends; a Pokémon
  // can also legitimately have zero views in the latest month. Treat the data as
  // covering at least up to the month before the last complete one.
  const floor = previousMonth(cap)
  const coverageEnd = latestPresent > floor ? latestPresent : floor
  const [endYear, endMonth] = coverageEnd.split('-').map(Number)

  const monthly: MonthlyPopularityPoint[] = []
  const yearly: YearlyPopularityPoint[] = []

  for (let year = startYear; year <= endYear; year += 1) {
    const lastMonthOfYear = year === endYear ? endMonth : 12
    const yearSum = emptyValues()
    let yearDays = 0
    for (let month1 = 1; month1 <= lastMonthOfYear; month1 += 1) {
      const key = `${year}-${String(month1).padStart(2, '0')}`
      const sums = byMonth.get(key) ?? emptyValues()
      const days = daysInMonth(year, month1)
      monthly.push({ month: key, values: roundValues(sums, days) })
      for (const region of POPULARITY_REGIONS) yearSum[region] += sums[region]
      yearDays += days
    }
    yearly.push({ year, values: roundValues(yearSum, yearDays), partial: lastMonthOfYear < 12 })
  }

  return {
    coverage: { start: startMonth, end: coverageEnd },
    yearly,
    monthly,
    totalsByLang,
  }
}

// ---------------------------------------------------------------------------
// Name helpers
// ---------------------------------------------------------------------------

/** Convert a display name ("Mr. Mime", "Nidoran♀", "Flabébé") to a PokeAPI species slug. */
export function toSpeciesSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/♀/g, '-f')
    .replace(/♂/g, '-m')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[.'’:]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function pickLocalizedName(
  names: Array<{ name: string; language: { name: string } }>,
  languages: string[]
): string | null {
  for (const language of languages) {
    const match = names.find((entry) => entry.language.name === language && entry.name.trim())
    if (match) return match.name.trim()
  }
  return null
}
