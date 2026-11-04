"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import { PopularityChart, seriesColor, type PopularityChartSeries } from '@/components/PopularityChart'
import {
  DEFAULT_POKEMON,
  REGION_DESCRIPTIONS,
  REGION_KEYS,
  fetchPokemonPopularity,
  fetchSpeciesOptions,
  formatViews,
  normalizeRegion,
  peakYear,
  percentChange,
  speciesDisplayName,
  toSpeciesSlug,
  type SpeciesOption,
} from '@/lib/trends/data'
import type { PersistableTrendsState, PokemonPopularity, TrendsState } from '@/lib/trends/types'
import AppHeader from '@/components/AppHeader'
import { useAuth } from '@/contexts/AuthContext'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { getDb } from '@/lib/firebase/client'
import { getPokemonImageUrl, getPokemonFallbackImage } from '@/lib/api'
import { useSmartBackNavigation, useReferrerStorage } from '@/hooks/useSmartBackNavigation'
import LazyImage from '@/components/LazyImage'

// Function to get PMDCollab portrait image
function getPmdPortraitImage(pokemonId: number): string {
  const id4 = String(pokemonId).padStart(4, '0')
  return `https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/${id4}/Normal.png`
}

function spriteSources(id: number): string[] {
  return [getPmdPortraitImage(id), getPokemonImageUrl(id), getPokemonFallbackImage(id), '/placeholder-pokemon.png']
}

const STORAGE_KEY = 'trends:preferences:v1'
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MIN_YEAR = 2016
const MAX_COMPARE = 6

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; data: PokemonPopularity }
  | { status: 'error'; error: string }

function sanitizeState(state: Partial<TrendsState>): TrendsState {
  const compare = Array.isArray(state.compare)
    ? state.compare.filter((name) => typeof name === 'string' && name.trim().length > 0)
    : []
  const uniqueCompare = Array.from(new Map(compare.map((name) => [toSpeciesSlug(name), name])).values()).slice(0, MAX_COMPARE)
  const currentYear = new Date().getUTCFullYear()
  const year = Number(state.year)
  return {
    pokemon: typeof state.pokemon === 'string' && state.pokemon.trim() ? state.pokemon.trim() : DEFAULT_POKEMON,
    compare: uniqueCompare,
    region: normalizeRegion(state.region) ?? 'Global',
    year: Number.isInteger(year) && year >= MIN_YEAR && year <= currentYear ? year : currentYear,
    generations: Array.isArray(state.generations) ? state.generations : [],
    types: Array.isArray(state.types) ? state.types : [],
  }
}

function readQueryParams(params: URLSearchParams): Partial<TrendsState> {
  const pokemon = params.get('poke') ?? undefined
  const compare = params.get('compare')
  const region = normalizeRegion(params.get('region'))
  const yearValue = params.get('year')
  const generations = params.get('gen')
  const types = params.get('types')
  return {
    pokemon,
    compare: compare ? compare.split(',').filter(Boolean) : undefined,
    region,
    year: yearValue ? Number(yearValue) : undefined,
    generations: generations ? generations.split(',').map((value) => Number(value)).filter((value) => !Number.isNaN(value)) : undefined,
    types: types ? types.split(',').filter(Boolean) : undefined,
  }
}

function serializeStateToParams(state: TrendsState) {
  const params = new URLSearchParams()
  params.set('poke', state.pokemon)
  params.set('region', state.region)
  params.set('year', String(state.year))
  if (state.generations.length) params.set('gen', state.generations.join(','))
  if (state.types.length) params.set('types', state.types.join(','))
  if (state.compare.length) params.set('compare', state.compare.join(','))
  return params
}

function formatChange(change: number | null): string {
  if (change == null) return 'n/a'
  return `${change > 0 ? '+' : ''}${change}%`
}

export default function TrendsClient() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const reduceMotion = useReducedMotion()
  const { user } = useAuth()

  // Store current page as referrer for smart back navigation
  useReferrerStorage()
  
  // Use smart back navigation
  const { backLink, backLabel } = useSmartBackNavigation({
    defaultBackLink: '/insights',
    defaultBackLabel: 'Back to Insights'
  })

  const [hydrated, setHydrated] = useState(false)
  const [state, setState] = useState<TrendsState>(() => sanitizeState(readQueryParams(new URLSearchParams())))
  const [cloudState, setCloudState] = useState<PersistableTrendsState | null>(null)
  const [cloudLoaded, setCloudLoaded] = useState(false)
  const cloudStateRef = useRef<PersistableTrendsState | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current)
    }
  }, [])

  // Hydrate from URL on first render when available.
  useEffect(() => {
    if (hydrated) return
    const params = searchParams ? readQueryParams(searchParams) : {}
    setState((prev) => sanitizeState({ ...prev, ...params }))
    setHydrated(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // LocalStorage hydration after hydration flag to avoid mismatch.
  // Only use localStorage if URL parameters are not present
  useEffect(() => {
    if (!hydrated) return
    const urlParams = searchParams ? readQueryParams(searchParams) : {}
    const hasUrlParams = Object.keys(urlParams).some(key => urlParams[key as keyof typeof urlParams] !== undefined)
    
    // Only apply localStorage if no URL parameters are present
    if (!hasUrlParams) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw) as PersistableTrendsState
          if (parsed && parsed.updatedAt) {
            setState((prev) => sanitizeState({ ...prev, ...parsed }))
            setCloudState(parsed)
            cloudStateRef.current = parsed
          }
        }
      } catch {}
    }
  }, [hydrated, searchParams])

  // Load from Firebase if authenticated.
  useEffect(() => {
    if (!user) {
      setCloudLoaded(true)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const db = getDb()
        if (!db) {
          if (!cancelled) setCloudLoaded(true)
          return
        }
        const ref = doc(db, 'users', user.uid, 'trends', 'preferences')
        const snapshot = await getDoc(ref)
        if (!snapshot.exists()) {
          if (!cancelled) setCloudLoaded(true)
          return
        }
        const data = snapshot.data() as PersistableTrendsState
        if (cancelled) return
        const existing = cloudStateRef.current
        const urlParams = searchParams ? readQueryParams(searchParams) : {}
        const hasUrlParams = Object.keys(urlParams).some(key => urlParams[key as keyof typeof urlParams] !== undefined)
        
        // Only apply Firebase data if no URL parameters are present and data is newer
        if (!hasUrlParams && (!existing || (data.updatedAt ?? 0) >= (existing.updatedAt ?? 0))) {
          setState((prev) => sanitizeState({ ...prev, ...data }))
          cloudStateRef.current = data
          setCloudState(data)
        }
        setCloudLoaded(true)
      } catch (error) {
        // Silently handle Firebase permissions errors - they don't break functionality
        if (!cancelled) {
          console.warn('Firebase preferences not available (permissions or network issue):', error)
          setCloudLoaded(true)
        }
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Sync to URL + localStorage + Firebase
  useEffect(() => {
    if (!hydrated || !cloudLoaded) return
    const params = serializeStateToParams(state)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })

    const payload: PersistableTrendsState = { ...state, updatedAt: Date.now() }
    cloudStateRef.current = payload
    setCloudState(payload)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch {}

    if (!user) return
    const timer = window.setTimeout(() => {
      const push = async () => {
        try {
          const db = getDb()
          if (!db) return
          const ref = doc(db, 'users', user.uid, 'trends', 'preferences')
          await setDoc(ref, { ...payload, ts: serverTimestamp() }, { merge: true })
        } catch (error) {
          // Silently handle Firebase permissions errors - they don't break functionality
          console.warn('Failed to sync trends preferences to Firebase (permissions or network issue):', error)
        }
      }
      void push()
    }, 600)
    return () => window.clearTimeout(timer)
  }, [state, hydrated, router, pathname, user, cloudLoaded])


  // ---------------------------------------------------------------------------
  // Real data loading (Wikipedia pageviews via /api/trends/popularity)
  // ---------------------------------------------------------------------------

  const [species, setSpecies] = useState<SpeciesOption[]>([])
  const [speciesError, setSpeciesError] = useState(false)
  const [loads, setLoads] = useState<Record<string, LoadState>>({})
  const requestedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const controller = new AbortController()
    fetchSpeciesOptions(controller.signal)
      .then(setSpecies)
      .catch((error: unknown) => {
        if ((error as { name?: string })?.name !== 'AbortError') setSpeciesError(true)
      })
    return () => controller.abort()
  }, [])

  const primarySlug = toSpeciesSlug(state.pokemon)
  const compareSlugs = useMemo(
    () => state.compare.map(toSpeciesSlug).filter((slug) => slug && slug !== primarySlug),
    [state.compare, primarySlug]
  )

  const load = (slug: string, force = false) => {
    if (!slug) return
    if (!force && requestedRef.current.has(slug)) return
    requestedRef.current.add(slug)
    setLoads((prev) => ({ ...prev, [slug]: { status: 'loading' } }))
    fetchPokemonPopularity(slug)
      .then((data) => setLoads((prev) => ({ ...prev, [slug]: { status: 'ready', data } })))
      .catch((error: unknown) => {
        setLoads((prev) => ({
          ...prev,
          [slug]: { status: 'error', error: error instanceof Error ? error.message : 'Failed to load data' },
        }))
      })
  }

  useEffect(() => {
    if (!hydrated) return
    ;[primarySlug, ...compareSlugs].forEach((slug) => load(slug))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, primarySlug, compareSlugs])

  const speciesBySlug = useMemo(() => new Map(species.map((entry) => [entry.slug, entry])), [species])

  const primaryLoad: LoadState = loads[primarySlug] ?? { status: 'loading' }
  const primaryData = primaryLoad.status === 'ready' ? primaryLoad.data : null
  const primaryId = primaryData?.pokemon.id ?? speciesBySlug.get(primarySlug)?.id
  const primaryName = primaryData?.pokemon.name ?? speciesDisplayName(primarySlug)

  const comparisonData = useMemo(
    () =>
      compareSlugs
        .map((slug) => {
          const entry = loads[slug]
          return entry?.status === 'ready' ? entry.data : null
        })
        .filter((entry): entry is PokemonPopularity => entry !== null),
    [compareSlugs, loads]
  )

  const chartData = useMemo(() => (primaryData ? [primaryData, ...comparisonData] : []), [primaryData, comparisonData])

  const years = useMemo(() => primaryData?.yearly.map((point) => point.year) ?? [], [primaryData])
  const selectedYear = years.includes(state.year) ? state.year : years[years.length - 1] ?? state.year

  const yearlySeries: PopularityChartSeries[] = useMemo(
    () =>
      chartData.map((data) => {
        const byYear = new Map(data.yearly.map((point) => [point.year, point.values[state.region]]))
        return {
          key: data.pokemon.slug,
          label: data.pokemon.name,
          spriteId: data.pokemon.id,
          values: years.map((year) => byYear.get(year) ?? null),
        }
      }),
    [chartData, years, state.region]
  )

  const monthKeys = useMemo(() => {
    if (!primaryData) return []
    return primaryData.monthly.filter((point) => point.month.startsWith(`${selectedYear}-`)).map((point) => point.month)
  }, [primaryData, selectedYear])

  const monthlySeries: PopularityChartSeries[] = useMemo(
    () =>
      chartData.map((data) => {
        const byMonth = new Map(data.monthly.map((point) => [point.month, point.values[state.region]]))
        return {
          key: data.pokemon.slug,
          label: data.pokemon.name,
          spriteId: data.pokemon.id,
          values: monthKeys.map((month) => byMonth.get(month) ?? null),
        }
      }),
    [chartData, monthKeys, state.region]
  )

  const yearPoint = primaryData?.yearly.find((point) => point.year === selectedYear)
  const previousYearPoint = primaryData?.yearly.find((point) => point.year === selectedYear - 1)
  const yoyChange = yearPoint && previousYearPoint ? percentChange(yearPoint.values[state.region], previousYearPoint.values[state.region]) : null
  const peak = primaryData ? peakYear(primaryData, state.region) : null
  const busiestMonth = useMemo(() => {
    if (!primaryData) return null
    return primaryData.monthly
      .filter((point) => point.month.startsWith(`${selectedYear}-`))
      .reduce<{ month: string; value: number } | null>((best, point) => {
        const value = point.values[state.region]
        return !best || value > best.value ? { month: point.month, value } : best
      }, null)
  }, [primaryData, selectedYear, state.region])

  const regionShare = useMemo(() => {
    if (!yearPoint || yearPoint.values.Global <= 0) return null
    return (['English', 'Asia', 'Europe'] as const).map((region) => ({
      region,
      share: Math.round((yearPoint.values[region] / yearPoint.values.Global) * 1000) / 10,
    }))
  }, [yearPoint])

  // ---------------------------------------------------------------------------
  // Selection helpers
  // ---------------------------------------------------------------------------

  const addToCompare = (name: string) => {
    setState((prev) => {
      const slug = toSpeciesSlug(name)
      if (slug === toSpeciesSlug(prev.pokemon)) return prev
      if (prev.compare.some((entry) => toSpeciesSlug(entry) === slug)) return prev
      if (prev.compare.length >= MAX_COMPARE) return prev
      return { ...prev, compare: [...prev.compare, name] }
    })
  }

  const removeFromCompare = (name: string) => {
    const slug = toSpeciesSlug(name)
    setState((prev) => ({ ...prev, compare: prev.compare.filter((entry) => toSpeciesSlug(entry) !== slug) }))
  }

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return species.slice(0, 50)
    const numeric = /^#?\d+$/.test(query) ? Number(query.replace('#', '')) : null
    return species
      .filter((entry) => (numeric != null ? entry.id === numeric : entry.name.toLowerCase().includes(query) || entry.slug.includes(query)))
      .slice(0, 50)
  }, [species, searchQuery])

  const perspectiveCard = (delay: number) => ({
    initial: reduceMotion ? undefined : { opacity: 0 },
    animate: reduceMotion ? undefined : { opacity: 1 },
    transition: { duration: 0.6, delay },
  })

  const regionLabel = state.region === 'Global' ? 'all tracked Wikipedias' : REGION_DESCRIPTIONS[state.region]
  const coverageEnd = primaryData?.coverage?.end
  const yearIsPartial = Boolean(yearPoint?.partial)

  return (
    <>
      <AppHeader
        title="Popularity Trends"
        subtitle={<span className="text-xs text-slate-500 dark:text-slate-300">Data synced locally and to your Trainer profile.</span>}
        backLink={backLink}
        backLabel={backLabel}
        showToolbar
      />
      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row lg:items-start">
        <aside className="lg:w-72 xl:w-80 lg:sticky lg:top-8">
          {/* Regions Section */}
          <div className="rounded-2xl border border-slate-200/80 bg-white/70 shadow-sm backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/60">
            <div className="p-4">
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Regions</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Grouped by Wikipedia language edition</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {REGION_KEYS.map((region) => (
                  <button
                    key={region}
                    type="button"
                    title={REGION_DESCRIPTIONS[region]}
                    aria-pressed={state.region === region}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${state.region === region ? 'bg-blue-600 text-white shadow dark:bg-blue-500' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}
                    onClick={() => setState((prev) => ({ ...prev, region }))}
                  >
                    {region}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">{REGION_DESCRIPTIONS[state.region]}</p>
            </div>
          </div>

          {/* Year Section */}
          {years.length > 0 && (
            <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/60">
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Year</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Pick a year for the monthly breakdown</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {years.map((year) => (
                  <button
                    key={year}
                    type="button"
                    aria-pressed={selectedYear === year}
                    className={`rounded-full px-3 py-1 text-xs font-medium tabular-nums transition ${selectedYear === year ? 'bg-blue-600 text-white shadow dark:bg-blue-500' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}
                    onClick={() => setState((prev) => ({ ...prev, year }))}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Section */}
          <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/60">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Select Pokémon</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">Pick a primary Pokémon and add up to {MAX_COMPARE} others to compare.</p>
            <div className="mt-3 relative">
              <input
                type="text"
                value={searchQuery}
                placeholder={speciesError ? 'Species list unavailable' : 'Search by name or Dex #...'}
                aria-label="Search Pokémon"
                className="w-full rounded-md border border-slate-300 bg-white/80 px-3 py-2 text-sm shadow-inner focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-900/60 dark:text-slate-100 dark:focus:ring-slate-600"
                onChange={(event) => setSearchQuery(event.target.value)}
                onFocus={() => setShowSearchDropdown(true)}
                onBlur={() => {
                  if (blurTimerRef.current) clearTimeout(blurTimerRef.current)
                  blurTimerRef.current = setTimeout(() => setShowSearchDropdown(false), 150)
                }}
              />
              {showSearchDropdown && searchResults.length > 0 && (
                <div className="absolute z-50 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-800">
                  <div className="max-h-64 overflow-y-auto">
                    {searchResults.map((entry) => {
                      const isPrimary = primarySlug === entry.slug
                      const isCompared = compareSlugs.includes(entry.slug)
                      const addDisabled = isPrimary || isCompared || state.compare.length >= MAX_COMPARE
                      return (
                        <div
                          key={entry.slug}
                          className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition ${isPrimary ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm dark:border-blue-400 dark:bg-slate-800 dark:text-blue-300' : 'border-transparent bg-slate-50/70 hover:border-slate-200 hover:bg-white dark:bg-slate-800/40 dark:hover:bg-slate-800/70'}`}
                        >
                          <button
                            type="button"
                            className="flex flex-1 items-center gap-3 text-left"
                            onClick={() => {
                              setState((prev) => ({
                                ...prev,
                                pokemon: entry.name,
                                compare: prev.compare.filter((name) => toSpeciesSlug(name) !== entry.slug),
                              }))
                              setSearchQuery('')
                              setShowSearchDropdown(false)
                            }}
                          >
                            <div className="flex-shrink-0">
                              <LazyImage
                                srcList={spriteSources(entry.id)}
                                alt={entry.name}
                                width={32}
                                height={32}
                                imgClassName="w-8 h-8 object-contain"
                                rootMargin="50px"
                                threshold={0.01}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{entry.name}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">#{String(entry.id).padStart(4, '0')}</div>
                            </div>
                          </button>
                          <button
                            type="button"
                            className={`ml-2 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition ${addDisabled ? 'border-slate-200 text-slate-400 dark:border-slate-700 dark:text-slate-500' : 'border-slate-300 text-slate-600 hover:border-blue-400 hover:text-blue-700 dark:border-slate-600 dark:text-slate-300 dark:hover:border-blue-400 dark:hover:text-blue-300'}`}
                            onClick={() => addToCompare(entry.name)}
                            disabled={addDisabled}
                          >
                            {isPrimary || isCompared ? 'Added' : 'Add'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Comparison list</span>
                {state.compare.length > 0 && (
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    onClick={() => setState((prev) => ({ ...prev, compare: [] }))}
                  >
                    Clear
                  </button>
                )}
              </div>
              {compareSlugs.length === 0 ? (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Add Pokémon to compare their trends.</p>
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  {compareSlugs.map((slug, index) => {
                    const entry = loads[slug]
                    const label = entry?.status === 'ready' ? entry.data.pokemon.name : speciesDisplayName(slug)
                    return (
                      <button
                        key={slug}
                        type="button"
                        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs text-slate-700 shadow-sm transition hover:border-blue-400 hover:text-blue-700 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-blue-400 dark:hover:text-blue-300"
                        onClick={() => removeFromCompare(slug)}
                        title={entry?.status === 'error' ? entry.error : undefined}
                      >
                        <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: seriesColor(index + 1) }} />
                        {label}
                        {entry?.status === 'loading' ? <span className="text-[10px] text-slate-400">loading…</span> : null}
                        {entry?.status === 'error' ? <span className="text-[10px] text-red-500">failed</span> : null}
                        <span className="text-[10px] uppercase tracking-wide">Remove</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </aside>

        <section className="flex-1 space-y-4 lg:pt-0">
          <header className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Popularity Trends Explorer</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Real interest over time, measured as average daily Wikipedia pageviews for each Pokémon across English, Asian and European language editions.
            </p>
          </header>
          <div className="grid gap-4 lg:grid-cols-1">
            <motion.div
              className="rounded-3xl border border-slate-200/80 bg-white/80 p-5 shadow-xl backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/70"
              {...perspectiveCard(0.05)}
            >
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-700">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {primaryId ? (
                      <LazyImage
                        key={primaryId}
                        srcList={spriteSources(primaryId)}
                        alt={primaryName}
                        width={64}
                        height={64}
                        imgClassName="w-16 h-16 object-contain"
                        rootMargin="100px"
                        threshold={0.01}
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Now viewing</div>
                    <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{primaryName}</div>
                    {primaryId ? <p className="text-xs text-slate-500 dark:text-slate-400">#{String(primaryId).padStart(4, '0')}</p> : null}
                  </div>
                </div>
                {primaryData && peak ? (
                  <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                    <div>
                      Peak year ({state.region}): <span className="font-semibold text-slate-700 dark:text-slate-200">{peak.year}</span> · {formatViews(peak.value)} views/day
                    </div>
                    <div>
                      {selectedYear}{yearIsPartial ? ' (to date)' : ''}: {formatViews(yearPoint?.values[state.region] ?? 0)} views/day · {formatChange(yoyChange)} vs {selectedYear - 1}
                    </div>
                  </div>
                ) : null}
              </div>

              {primaryData && !primaryData.complete ? (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200" role="status">
                  <span>
                    Some Wikipedia editions couldn&apos;t be loaded ({primaryData.editions.filter((edition) => edition.error).map((edition) => edition.lang).join(', ')}), so totals are understated.
                  </span>
                  <button type="button" className="font-semibold underline" onClick={() => load(primarySlug, true)}>
                    Retry
                  </button>
                </div>
              ) : null}
              <div className="mt-4 overflow-x-auto">
                {primaryLoad.status === 'loading' ? (
                  <div className="flex h-[300px] items-center justify-center" role="status">
                    <p className="animate-pulse text-sm text-slate-500 dark:text-slate-400">Loading Wikipedia pageviews for {primaryName}…</p>
                  </div>
                ) : primaryLoad.status === 'error' ? (
                  <div className="flex h-[300px] flex-col items-center justify-center gap-3 text-center" role="alert">
                    <p className="text-sm text-red-600 dark:text-red-400">Couldn&apos;t load popularity data for {primaryName}: {primaryLoad.error}</p>
                    <button
                      type="button"
                      className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                      onClick={() => load(primarySlug, true)}
                    >
                      Retry
                    </button>
                  </div>
                ) : years.length === 0 ? (
                  <div className="flex h-[300px] items-center justify-center text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">No Wikipedia pageview data found for {primaryName}.</p>
                  </div>
                ) : (
                  <PopularityChart
                    title={`Yearly popularity · ${state.region}`}
                    subtitle={`Average daily pageviews on ${regionLabel}. Click a year to see its monthly breakdown.`}
                    xLabels={years.map(String)}
                    labelNotes={primaryData?.yearly.map((point) => (point.partial ? 'to date' : undefined))}
                    series={yearlySeries}
                    formatValue={formatViews}
                    highlightIndex={years.indexOf(selectedYear)}
                    onSelectIndex={(index) => {
                      const year = years[index]
                      if (year) setState((prev) => ({ ...prev, year }))
                    }}
                    ariaLabel={`Average daily Wikipedia pageviews per year in ${state.region} for ${yearlySeries.map((entry) => entry.label).join(', ')}`}
                  />
                )}
              </div>
            </motion.div>

            {primaryData && monthKeys.length > 0 ? (
              <motion.div
                className="rounded-3xl border border-slate-200/80 bg-white/80 p-5 shadow-xl backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/70"
                {...perspectiveCard(0.15)}
              >
                <div className="overflow-x-auto">
                  <PopularityChart
                    title={`${selectedYear} by month · ${state.region}`}
                    subtitle={yearIsPartial && coverageEnd ? `Data through ${coverageEnd}.` : 'Average daily pageviews per month.'}
                    xLabels={monthKeys.map((month) => MONTH_LABELS[Number(month.slice(5, 7)) - 1])}
                    series={monthlySeries}
                    formatValue={formatViews}
                    ariaLabel={`Average daily Wikipedia pageviews per month in ${selectedYear}, ${state.region}`}
                  />
                </div>
              </motion.div>
            ) : null}

            {primaryData ? (
              <motion.div
                className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-blue-50 via-white to-violet-100 p-5 shadow-xl dark:border-slate-700/70 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800"
                {...perspectiveCard(0.28)}
              >
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Insights · {selectedYear}</h3>
                <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
                  <div className="rounded-lg border border-slate-200/70 bg-white/70 px-3 py-2 text-slate-700 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-300">
                    <div className="text-xs text-slate-500 dark:text-slate-400">Year over year ({state.region})</div>
                    <div className="text-lg font-semibold tabular-nums">{formatChange(yoyChange)}</div>
                  </div>
                  <div className="rounded-lg border border-slate-200/70 bg-white/70 px-3 py-2 text-slate-700 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-300">
                    <div className="text-xs text-slate-500 dark:text-slate-400">Busiest month ({state.region})</div>
                    <div className="text-lg font-semibold tabular-nums">
                      {busiestMonth && busiestMonth.value > 0
                        ? `${MONTH_LABELS[Number(busiestMonth.month.slice(5, 7)) - 1]} · ${formatViews(busiestMonth.value)}/day`
                        : 'n/a'}
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-200/70 bg-white/70 px-3 py-2 text-slate-700 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-300">
                    <div className="text-xs text-slate-500 dark:text-slate-400">Share of global views</div>
                    <div className="text-sm font-medium tabular-nums">
                      {regionShare ? regionShare.map((entry) => `${entry.region} ${entry.share}%`).join(' · ') : 'n/a'}
                    </div>
                  </div>
                </div>

                <h4 className="mt-5 text-sm font-semibold text-slate-800 dark:text-slate-100">Articles tracked</h4>
                <ul className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
                  {primaryData.editions.map((edition) => (
                    <li
                      key={edition.lang}
                      className="rounded-lg border border-slate-200/70 bg-white/70 px-3 py-2 text-slate-700 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-300"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold">{edition.label} <span className="font-normal text-slate-500">({edition.lang}, {edition.region})</span></span>
                        <span className="tabular-nums text-slate-500 dark:text-slate-400">{formatViews(edition.totalViews)} views</span>
                      </div>
                      {edition.titles.length > 0 ? (
                        <div className="mt-1 flex flex-wrap gap-x-2">
                          {edition.titles.map((title, index) => (
                            <a
                              key={title}
                              href={edition.urls[index]}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline dark:text-blue-400"
                            >
                              {title}
                            </a>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-1 text-slate-500 dark:text-slate-400">
                          {edition.error ? 'Lookup failed — excluded from totals' : 'No matching article'}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>

                <p className="mt-4 text-[11px] text-slate-500 dark:text-slate-400">
                  Source:{' '}
                  <a href={primaryData.source.url} target="_blank" rel="noopener noreferrer" className="underline">
                    {primaryData.source.label}
                  </a>
                  {primaryData.coverage ? `, ${primaryData.coverage.start} to ${primaryData.coverage.end}` : ''}. Counts human (non-bot) views of each
                  Pokémon&apos;s article or redirect title; it reflects public interest, not competitive usage.
                </p>
              </motion.div>
            ) : null}
          </div>
        </section>
      </main>
    </>
  )
}
