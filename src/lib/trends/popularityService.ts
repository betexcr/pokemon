/**
 * Server-only: fetch real popularity data for a Pokémon from the Wikimedia
 * Pageviews API, using PokeAPI for localised species names.
 *
 * Docs: https://doc.wikimedia.org/generated-data-platform/aqs/analytics-api/
 */

import type { PokemonPopularity, PopularityEdition } from './types'
import {
  PAGEVIEWS_START_YEAR,
  WIKI_EDITIONS,
  aggregatePageviews,
  candidateTitles,
  lastCompleteMonth,
  pickLocalizedName,
  selectArticleTitles,
  wikipediaArticleUrl,
  type EditionPageviews,
  type PageviewItem,
  type WikiEdition,
  type WikiQueryResponse,
} from './wikipedia'

const POKEAPI_BASE = 'https://pokeapi.co/api/v2'
const PAGEVIEWS_BASE = 'https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pokemon-indol-tau.vercel.app'
/** Wikimedia asks API clients to identify themselves with a descriptive User-Agent. */
const USER_AGENT = `PokeDexTrends/1.0 (${SITE_URL}/trends)`

const SPECIES_REVALIDATE_S = 60 * 60 * 24 * 7
const TITLES_REVALIDATE_S = 60 * 60 * 24 * 7
const PAGEVIEWS_REVALIDATE_S = 60 * 60 * 12
const RESULT_TTL_MS = 1000 * 60 * 60 * 6
const FETCH_TIMEOUT_MS = 8000

export class PopularityNotFoundError extends Error {}

interface SpeciesResponse {
  id: number
  name: string
  generation?: { name: string } | null
  names: Array<{ name: string; language: { name: string } }>
}

const resultCache = new Map<string, { expires: number; data: PokemonPopularity }>()
const inflight = new Map<string, Promise<PokemonPopularity>>()

async function fetchJson<T>(url: string, revalidate: number): Promise<{ status: number; data: T | null }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, 'Api-User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: controller.signal,
      next: { revalidate },
    })
    if (!res.ok) return { status: res.status, data: null }
    return { status: res.status, data: (await res.json()) as T }
  } finally {
    clearTimeout(timer)
  }
}

function generationNumber(name: string | undefined): number | null {
  if (!name) return null
  const roman = name.replace(/^generation-/, '').toLowerCase()
  const map: Record<string, number> = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10 }
  return map[roman] ?? null
}

async function fetchSpecies(slugOrId: string): Promise<SpeciesResponse> {
  const { status, data } = await fetchJson<SpeciesResponse>(
    `${POKEAPI_BASE}/pokemon-species/${encodeURIComponent(slugOrId)}`,
    SPECIES_REVALIDATE_S
  )
  if (status === 404) throw new PopularityNotFoundError(`Unknown Pokémon: ${slugOrId}`)
  if (!data) throw new Error(`PokeAPI species lookup failed (${status})`)
  return data
}

async function resolveEditionTitles(edition: WikiEdition, localName: string): Promise<string[]> {
  const candidates = candidateTitles(localName, edition.qualifierSuffixes)
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    redirects: '1',
    converttitles: '1',
    prop: 'pageprops',
    ppprop: 'disambiguation',
    titles: candidates.join('|'),
  })
  const { status, data } = await fetchJson<WikiQueryResponse>(
    `https://${edition.lang}.wikipedia.org/w/api.php?${params.toString()}`,
    TITLES_REVALIDATE_S
  )
  if (!data) throw new Error(`${edition.lang}.wikipedia title lookup failed (${status})`)
  return selectArticleTitles(localName, edition.qualifierSuffixes, data)
}

function pageviewsEnd(now: Date): string {
  const [year, month] = lastCompleteMonth(now).split('-').map(Number)
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return `${year}${String(month).padStart(2, '0')}${String(lastDay).padStart(2, '0')}00`
}

async function fetchTitlePageviews(lang: string, title: string, now: Date): Promise<PageviewItem[]> {
  const article = encodeURIComponent(title.replace(/ /g, '_'))
  const url = `${PAGEVIEWS_BASE}/${lang}.wikipedia/all-access/user/${article}/monthly/${PAGEVIEWS_START_YEAR}010100/${pageviewsEnd(now)}`
  const { status, data } = await fetchJson<{ items?: PageviewItem[] }>(url, PAGEVIEWS_REVALIDATE_S)
  // 404 means "no views recorded for this title in the window".
  if (status === 404) return []
  if (!data) throw new Error(`Pageviews request failed for ${lang}:${title} (${status})`)
  return (data.items ?? []).map((item) => ({ timestamp: item.timestamp, views: item.views }))
}

async function loadEdition(
  edition: WikiEdition,
  species: SpeciesResponse,
  now: Date
): Promise<{ meta: PopularityEdition; series: EditionPageviews }> {
  const localName = pickLocalizedName(species.names, edition.pokeapiLanguages)
  const meta: PopularityEdition = {
    lang: edition.lang,
    label: edition.label,
    region: edition.region,
    localName,
    titles: [],
    urls: [],
    totalViews: 0,
  }
  const series: EditionPageviews = { lang: edition.lang, region: edition.region, items: [] }
  if (!localName) return { meta, series }

  try {
    const titles = await resolveEditionTitles(edition, localName)
    const perTitle = await Promise.all(titles.map((title) => fetchTitlePageviews(edition.lang, title, now)))
    meta.titles = titles
    meta.urls = titles.map((title) => wikipediaArticleUrl(edition.lang, title))
    series.items = perTitle.flat()
  } catch (error) {
    meta.error = error instanceof Error ? error.message : 'Unknown error'
  }
  return { meta, series }
}

async function buildPopularity(slugOrId: string, now: Date): Promise<PokemonPopularity> {
  const species = await fetchSpecies(slugOrId)
  const englishName = pickLocalizedName(species.names, ['en']) ?? species.name

  const loaded = await Promise.all(WIKI_EDITIONS.map((edition) => loadEdition(edition, species, now)))
  const failed = loaded.filter((entry) => entry.meta.error)
  if (failed.length === loaded.length) {
    throw new Error(`All Wikipedia lookups failed: ${failed[0]?.meta.error ?? 'unknown error'}`)
  }

  const aggregated = aggregatePageviews(loaded.map((entry) => entry.series), { now })
  const editions = loaded.map((entry) => ({
    ...entry.meta,
    totalViews: aggregated.totalsByLang[entry.meta.lang] ?? 0,
  }))

  return {
    pokemon: {
      id: species.id,
      slug: species.name,
      name: englishName,
      generation: generationNumber(species.generation?.name),
    },
    metric: 'avg_daily_pageviews',
    coverage: aggregated.coverage,
    yearly: aggregated.yearly,
    monthly: aggregated.monthly,
    editions,
    source: {
      label: 'Wikimedia Pageviews API (Wikipedia, user traffic)',
      url: 'https://doc.wikimedia.org/generated-data-platform/aqs/analytics-api/reference/page-views.html',
      fetchedAt: now.toISOString(),
    },
  }
}

/**
 * Real Wikipedia pageview popularity for one Pokémon species.
 * Results are cached in-process for a few hours; upstream fetches also use the
 * Next.js data cache.
 */
export async function getPokemonPopularity(slugOrId: string, now: Date = new Date()): Promise<PokemonPopularity> {
  const key = slugOrId.toLowerCase()
  const cached = resultCache.get(key)
  if (cached && cached.expires > Date.now()) return cached.data

  const pending = inflight.get(key)
  if (pending) return pending

  const promise = buildPopularity(key, now)
    .then((data) => {
      resultCache.set(key, { expires: Date.now() + RESULT_TTL_MS, data })
      return data
    })
    .finally(() => inflight.delete(key))
  inflight.set(key, promise)
  return promise
}
