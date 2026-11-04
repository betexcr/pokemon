/**
 * Server-only: fetch real popularity data for a Pokémon from the Wikimedia
 * Pageviews API, using PokeAPI for localised species names.
 *
 * Wikimedia rate limits (2026): ≤3 concurrent requests, ~200 req/min for
 * clients with a compliant User-Agent, and 429 + Retry-After when exceeded.
 * See https://www.mediawiki.org/wiki/Wikimedia_APIs/Rate_limits
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
import { getRedis, withTimeout } from '../server/upstashRedis'

const POKEAPI_BASE = 'https://pokeapi.co/api/v2'
const PAGEVIEWS_BASE = 'https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pokemon-indol-tau.vercel.app'
const CONTACT = process.env.WIKIMEDIA_CONTACT?.trim()
/** Wikimedia requires a descriptive User-Agent with contact info (a URL and/or email). */
const USER_AGENT = `PokeDexTrends/1.0 (${SITE_URL}/trends${CONTACT ? `; ${CONTACT}` : ''})`
/**
 * Optional OAuth 2 access token (api.wikimedia.org → "Create key" → personal API token).
 * Authenticated requests are rate limited per account instead of per (often shared) IP.
 */
const WIKIMEDIA_TOKEN = process.env.WIKIMEDIA_API_TOKEN?.trim()

const SPECIES_REVALIDATE_S = 60 * 60 * 24 * 7
const TITLES_REVALIDATE_S = 60 * 60 * 24 * 7
const PAGEVIEWS_REVALIDATE_S = 60 * 60 * 12
const RESULT_TTL_MS = 1000 * 60 * 60 * 6
const REDIS_TTL_S = 60 * 60 * 24
const REDIS_KEY_PREFIX = 'trends:popularity:v1:'
const FETCH_TIMEOUT_MS = 8000

const WIKIMEDIA_MAX_CONCURRENCY = 3
const WIKIMEDIA_MAX_RETRIES = 2
/** Don't sleep longer than this for a single Retry-After inside a request handler. */
const WIKIMEDIA_MAX_RETRY_WAIT_MS = 5000

export class PopularityNotFoundError extends Error {}

class RateLimitedError extends Error {}

interface SpeciesResponse {
  id: number
  name: string
  generation?: { name: string } | null
  names: Array<{ name: string; language: { name: string } }>
}

const resultCache = new Map<string, { expires: number; data: PokemonPopularity }>()
const inflight = new Map<string, Promise<PokemonPopularity>>()

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Process-wide semaphore so we never exceed Wikimedia's concurrency guidance. */
let wikimediaActive = 0
const wikimediaQueue: Array<() => void> = []

async function withWikimediaSlot<T>(fn: () => Promise<T>): Promise<T> {
  if (wikimediaActive >= WIKIMEDIA_MAX_CONCURRENCY) {
    await new Promise<void>((resolve) => wikimediaQueue.push(resolve))
  }
  wikimediaActive += 1
  try {
    return await fn()
  } finally {
    wikimediaActive -= 1
    wikimediaQueue.shift()?.()
  }
}

function retryAfterMs(header: string | null): number {
  if (!header) return 1000
  const seconds = Number(header)
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000)
  const date = Date.parse(header)
  return Number.isFinite(date) ? Math.max(0, date - Date.now()) : 1000
}

async function rawFetch(url: string, revalidate: number, wikimedia: boolean): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  const headers: Record<string, string> = { 'User-Agent': USER_AGENT, 'Api-User-Agent': USER_AGENT, Accept: 'application/json' }
  if (wikimedia && WIKIMEDIA_TOKEN) headers.Authorization = `Bearer ${WIKIMEDIA_TOKEN}`
  try {
    return await fetch(url, {
      headers,
      signal: controller.signal,
      next: { revalidate },
    })
  } finally {
    clearTimeout(timer)
  }
}

async function fetchJson<T>(
  url: string,
  revalidate: number,
  options: { wikimedia?: boolean } = {}
): Promise<{ status: number; data: T | null }> {
  const run = async () => {
    for (let attempt = 0; ; attempt += 1) {
      const res = await rawFetch(url, revalidate, Boolean(options.wikimedia))
      if (res.status === 429 && options.wikimedia) {
        const wait = retryAfterMs(res.headers.get('retry-after'))
        if (attempt >= WIKIMEDIA_MAX_RETRIES || wait > WIKIMEDIA_MAX_RETRY_WAIT_MS) {
          throw new RateLimitedError(`Wikimedia rate limited (retry after ${Math.ceil(wait / 1000)}s)`)
        }
        await sleep(wait)
        continue
      }
      if (!res.ok) return { status: res.status, data: null }
      return { status: res.status, data: (await res.json()) as T }
    }
  }
  return options.wikimedia ? withWikimediaSlot(run) : run()
}

// ---------------------------------------------------------------------------
// Upstream lookups
// ---------------------------------------------------------------------------

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
    TITLES_REVALIDATE_S,
    { wikimedia: true }
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
  const { status, data } = await fetchJson<{ items?: PageviewItem[] }>(url, PAGEVIEWS_REVALIDATE_S, { wikimedia: true })
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
  const attempted = loaded.filter((entry) => entry.meta.localName)
  const failed = attempted.filter((entry) => entry.meta.error)
  if (attempted.length > 0 && failed.length === attempted.length) {
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
    complete: failed.length === 0,
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

// ---------------------------------------------------------------------------
// Shared cache (Upstash Redis when configured) so all serverless instances
// reuse results instead of each re-querying Wikimedia.
// ---------------------------------------------------------------------------

async function readSharedCache(key: string): Promise<PokemonPopularity | null> {
  const redis = getRedis()
  if (!redis) return null
  try {
    const value = await withTimeout(redis.get<PokemonPopularity | string>(REDIS_KEY_PREFIX + key))
    if (!value) return null
    return typeof value === 'string' ? (JSON.parse(value) as PokemonPopularity) : value
  } catch {
    return null
  }
}

async function writeSharedCache(key: string, data: PokemonPopularity): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  try {
    await withTimeout(redis.set(REDIS_KEY_PREFIX + key, JSON.stringify(data), { ex: REDIS_TTL_S }))
  } catch {
    // Cache write failures are non-fatal.
  }
}

/**
 * Real Wikipedia pageview popularity for one Pokémon species.
 * Only complete results are cached (in-process and in Redis), so a rate-limited
 * partial response is retried on the next request instead of sticking around.
 */
export async function getPokemonPopularity(slugOrId: string, now: Date = new Date()): Promise<PokemonPopularity> {
  const key = slugOrId.toLowerCase()
  const cached = resultCache.get(key)
  if (cached && cached.expires > Date.now()) return cached.data

  const pending = inflight.get(key)
  if (pending) return pending

  const promise = (async () => {
    const shared = await readSharedCache(key)
    if (shared) {
      resultCache.set(key, { expires: Date.now() + RESULT_TTL_MS, data: shared })
      return shared
    }
    const data = await buildPopularity(key, now)
    if (data.complete) {
      resultCache.set(key, { expires: Date.now() + RESULT_TTL_MS, data })
      await writeSharedCache(key, data)
    }
    return data
  })().finally(() => inflight.delete(key))
  inflight.set(key, promise)
  return promise
}

/** Test helper. */
export function resetPopularityCacheForTests(): void {
  resultCache.clear()
  inflight.clear()
}
