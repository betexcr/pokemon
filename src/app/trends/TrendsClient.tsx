"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import { PopularityChart } from '@/components/PopularityChart'
import { REGION_KEYS, TREND_DATA, TREND_YEARS, filterPokemon, findPokemonByName, getDefaultPokemon } from '@/lib/trends/data'
import type { PersistableTrendsState, RegionKey, TrendsState } from '@/lib/trends/types'
import AppHeader from '@/components/AppHeader'
import { useAuth } from '@/contexts/AuthContext'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { getDb } from '@/lib/firebase/client'
import { getPokemonImageUrl, getPokemonFallbackImage } from '@/lib/api'
import { useSmartBackNavigation, useReferrerStorage } from '@/hooks/useSmartBackNavigation'

// Function to get PMDCollab portrait image
function getPmdPortraitImage(pokemonId: number): string {
  const id4 = String(pokemonId).padStart(4, '0')
  return `https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/${id4}/Normal.png`
}
import LazyImage from '@/components/LazyImage'

const STORAGE_KEY = 'trends:preferences:v1'


function sanitizeState(state: Partial<TrendsState>): TrendsState {
  const fallback = getDefaultPokemon()
  return {
    pokemon: state.pokemon || fallback.name,
    region: (state.region && REGION_KEYS.includes(state.region)) ? state.region : 'Global',
    year: TREND_YEARS.includes(state.year || 0) ? state.year! : TREND_YEARS[TREND_YEARS.length - 1],
    generations: Array.isArray(state.generations) ? state.generations : [],
    types: Array.isArray(state.types) ? state.types : [],
  }
}

function readQueryParams(params: URLSearchParams): Partial<TrendsState> {
  const pokemon = params.get('poke') ?? undefined
  const region = params.get('region') as RegionKey | null
  const yearValue = params.get('year')
  const generations = params.get('gen')
  const types = params.get('types')
  return {
    pokemon,
    region: (region && REGION_KEYS.includes(region)) ? region : undefined,
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
  return params
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
        console.warn('Firebase preferences not available (permissions or network issue):', error)
        setCloudLoaded(true)
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


  const filtered = useMemo(() => filterPokemon({
    generations: [],
    types: [],
  }), [])

  const currentPokemon = useMemo(() => {
    const explicit = findPokemonByName(state.pokemon)
    if (explicit) return explicit
    return getDefaultPokemon()
  }, [state.pokemon])


  const activePokemonList = useMemo(() => {
    const list = filtered.length ? filtered : TREND_DATA
    const ensured = findPokemonByName(currentPokemon.name)
    if (ensured && !list.find((item) => item.name === ensured.name)) {
      return [ensured, ...list]
    }
    // Remove duplicates by using a Map with name as key
    const uniquePokemon = new Map()
    list.forEach(pokemon => {
      if (!uniquePokemon.has(pokemon.name)) {
        uniquePokemon.set(pokemon.name, pokemon)
      }
    })
    return Array.from(uniquePokemon.values())
  }, [filtered, currentPokemon])

  const searchFilteredList = useMemo(() => {
    if (!searchQuery.trim()) return activePokemonList
    const query = searchQuery.toLowerCase()
    const filtered = activePokemonList.filter((pokemon) => 
      pokemon.name.toLowerCase().includes(query)
    )
    // Remove duplicates by using a Map with name as key
    const uniquePokemon = new Map()
    filtered.forEach(pokemon => {
      if (!uniquePokemon.has(pokemon.name)) {
        uniquePokemon.set(pokemon.name, pokemon)
      }
    })
    return Array.from(uniquePokemon.values())
  }, [activePokemonList, searchQuery])

  const peakSnapshot = useMemo(() => {
    const trend = currentPokemon.trend
    const peakPoint = trend.reduce<{ year: number; value: number; region: RegionKey }>((acc, snapshot) => {
      const bestRegion = REGION_KEYS.reduce((best, region) => {
        const value = snapshot.values[region]
        return value > best.value ? { region, value } : best
      }, { region: state.region, value: snapshot.values[state.region] })
      if (bestRegion.value > acc.value) {
        return { year: snapshot.year, value: bestRegion.value, region: bestRegion.region }
      }
      return acc
    }, { year: trend[trend.length - 1].year, value: trend[trend.length - 1].values[state.region], region: state.region })
    return peakPoint
  }, [currentPokemon, state.region])


  const perspectiveCard = (delay: number) => ({
    initial: reduceMotion ? undefined : { opacity: 0 },
    animate: reduceMotion ? undefined : { opacity: 1 },
    transition: { duration: 0.6, delay },
  })

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
              <p className="text-xs text-slate-500 dark:text-slate-400">Select a region to view trends</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {REGION_KEYS.map((region) => (
                  <button
                    key={region}
                    type="button"
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${state.region === region ? 'bg-blue-600 text-white shadow dark:bg-blue-500' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}
                    onClick={() => setState((prev) => ({ ...prev, region }))}
                  >
                    {region}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Search Section */}
          <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/60">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Select Pokémon</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">Search and select from filtered results.</p>
            <div className="mt-3 relative">
              <input
                type="text"
                value={searchQuery}
                placeholder="Search Pokémon..."
                className="w-full rounded-md border border-slate-300 bg-white/80 px-3 py-2 text-sm shadow-inner focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-900/60 dark:text-slate-100 dark:focus:ring-slate-600"
                onChange={(event) => setSearchQuery(event.target.value)}
                onFocus={() => setShowSearchDropdown(true)}
                onBlur={() => setTimeout(() => setShowSearchDropdown(false), 150)}
              />
              {showSearchDropdown && searchFilteredList.length > 0 && (
                <div className="absolute z-50 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-800">
                  <div className="max-h-64 overflow-y-auto">
                    {searchFilteredList.slice(0, 50).map((entry, index) => (
                      <button
                        key={`${entry.name}-${entry.rank_global}-${index}`}
                        type="button"
                        onClick={() => {
                          setState((prev) => ({ ...prev, pokemon: entry.name }))
                          setShowSearchDropdown(false)
                        }}
                        className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition ${state.pokemon === entry.name ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm dark:border-blue-400 dark:bg-slate-800 dark:text-blue-300' : 'border-transparent bg-slate-50/70 hover:border-slate-200 hover:bg-white dark:bg-slate-800/40 dark:hover:bg-slate-800/70'}`}
                      >
                        <div className="flex-shrink-0">
                          <LazyImage
                            srcList={[
                              getPmdPortraitImage(entry.national_number),
                              getPokemonImageUrl(entry.national_number),
                              getPokemonFallbackImage(entry.national_number),
                              "/placeholder-pokemon.png"
                            ]}
                            alt={entry.name}
                            width={32}
                            height={32}
                            imgClassName="w-8 h-8 object-contain"
                            rootMargin="50px"
                            threshold={0.01}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">#{entry.rank_global} {entry.name}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">Rank #{entry.rank_global}</div>
                        </div>
                        <div className="flex-shrink-0 text-xs text-slate-500 dark:text-slate-400">
                          {entry.peak_percent}%
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>

        <section className="flex-1 space-y-4 lg:pt-0">
          <header className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Popularity Trends Explorer</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Dive into real-time popularity shifts across regions, generations, and meta relevance. Hover for tooltips and try reduced motion for accessibility.
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
                    <LazyImage
                      srcList={[
                        getPmdPortraitImage(currentPokemon.national_number),
                        getPokemonImageUrl(currentPokemon.national_number),
                        getPokemonFallbackImage(currentPokemon.national_number),
                        "/placeholder-pokemon.png"
                      ]}
                      alt={currentPokemon.name}
                      width={64}
                      height={64}
                      imgClassName="w-16 h-16 object-contain"
                      rootMargin="100px"
                      threshold={0.01}
                    />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Now viewing</div>
                    <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{currentPokemon.name}</div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Rank #{currentPokemon.rank_global}</p>
                  </div>
                </div>
                <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                  <div>Peak snapshot: {peakSnapshot.value}% ({peakSnapshot.year}, {peakSnapshot.region})</div>
                  <div>Sources: {currentPokemon.notable_sources.slice(0, 2).join(', ')}</div>
                </div>
              </div>
              <div className="mt-4 overflow-x-auto">
                {currentPokemon.trend.length === 1 ? (
                  <div className="mb-4 rounded-lg bg-blue-50 border border-blue-200 p-4 dark:bg-blue-900/20 dark:border-blue-800">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        Showing peak popularity data only. Historical trend data is limited to the peak year ({currentPokemon.peak_year}).
                      </p>
                    </div>
                  </div>
                ) : null}
                <PopularityChart pokemon={currentPokemon} activeRegion={state.region} />
              </div>
            </motion.div>
            <motion.div
              className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-blue-50 via-white to-violet-100 p-5 shadow-xl dark:border-slate-700/70 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800"
              {...perspectiveCard(0.28)}
            >
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Insights</h3>
              <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                {currentPokemon.notable_sources.map((source) => (
                  <div key={source} className="rounded-lg border border-slate-200/70 bg-white/70 px-3 py-2 text-slate-700 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-300">
                    {source}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </>
  )
}
