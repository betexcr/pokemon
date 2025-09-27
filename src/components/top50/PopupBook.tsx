'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Flame, LineChart, HelpCircle } from 'lucide-react'
import { getPokemonImageWithFallbacks, getShowdownAnimatedSprite } from '@/lib/utils'
import type { PopularPokemon } from '@/data/top50Pokemon'
import Tooltip from '@/components/Tooltip'
import TypeBadge from '@/components/TypeBadge'
import { useRef } from 'react'
import { loadMoveFromPokeAPI } from '@/lib/adapters/pokeapiMoveAdapter'

interface PhaseDefinition {
  id: string
  title: string
  description: string
  accent: string
}

interface PopupBookProps {
  phases: PhaseDefinition[]
  pokemon: PopularPokemon[]
  selectedPokemon: PopularPokemon | null
  currentPhase: number
  onPhaseChange: (index: number) => void
  onSelectPokemon: (rank: number) => void
}

const phaseVariants = {
  enter: { opacity: 0, y: 32, rotateX: 6 },
  center: { opacity: 1, y: 0, rotateX: 0 },
  exit: { opacity: 0, y: -32, rotateX: -6 }
}

interface CoverMetrics {
  total: number
  avgScore: number
  topType?: [string, number]
  topRegion?: [string, number]
  generationSpread: Array<{ generation: number; count: number; percentage: number }>
  typeCounts: Record<string, number>
}

export default function PopupBook({
  phases,
  pokemon,
  selectedPokemon,
  currentPhase,
  onPhaseChange,
  onSelectPokemon
}: PopupBookProps) {
  const coverMetrics = useMemo<CoverMetrics | null>(() => {
    if (pokemon.length === 0) {
      return null
    }

    const total = pokemon.length
    const avgScore = Math.round(
      pokemon.reduce((acc, poke) => acc + poke.popularityScore, 0) / total
    )

    const typeCounts = pokemon.reduce<Record<string, number>>((acc, poke) => {
      poke.types.forEach(type => {
        acc[type] = (acc[type] ?? 0) + 1
      })
      return acc
    }, {})

    const generationCounts = pokemon.reduce<Record<number, number>>((acc, poke) => {
      acc[poke.generation] = (acc[poke.generation] ?? 0) + 1
      return acc
    }, {})

    const regionCounts = pokemon.reduce<Record<string, number>>((acc, poke) => {
      acc[poke.region] = (acc[poke.region] ?? 0) + 1
      return acc
    }, {})

    const topType = Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])[0]

    const topRegion = Object.entries(regionCounts)
      .sort((a, b) => b[1] - a[1])[0]

    const generationSpread = Object.entries(generationCounts)
      .map(([generation, count]) => ({
        generation: Number(generation),
        count,
        percentage: Math.round((count / total) * 100)
      }))
      .sort((a, b) => a.generation - b.generation)

    return {
      total,
      avgScore,
      topType,
      topRegion,
      generationSpread,
      typeCounts
    }
  }, [pokemon])

  const typeDistribution = useMemo(() => {
    if (pokemon.length === 0) return []
    const counts = pokemon.reduce<Record<string, number>>((acc, poke) => {
      poke.types.forEach(type => {
        acc[type] = (acc[type] ?? 0) + 1
      })
      return acc
    }, {})

    return Object.entries(counts)
      .map(([type, count]) => ({
        type,
        count,
        percentage: Math.round((count / (pokemon.length * 2)) * 100)
      }))
      .sort((a, b) => b.count - a.count)
  }, [pokemon])

  const trendLeaders = useMemo(() => {
    if (pokemon.length === 0) return []
    return [...pokemon]
      .map(poke => {
        const start = poke.trend[0] ?? poke.popularityScore
        const end = poke.trend[poke.trend.length - 1] ?? poke.popularityScore
        return {
          ...poke,
          delta: end - start,
          latest: end
        }
      })
      .sort((a, b) => b.delta - a.delta)
  }, [pokemon])

  const regencySpotlight = useMemo(() => {
    if (!selectedPokemon) return null
    const peers = pokemon.filter(p => p.region === selectedPokemon.region)
    const regionalAverage = peers.reduce((acc, poke) => acc + poke.popularityScore, 0) / peers.length
    return {
      totalPeers: peers.length,
      regionalAverage: Math.round(regionalAverage),
      region: selectedPokemon.region
    }
  }, [pokemon, selectedPokemon])

  const handleNext = () => {
    const next = (currentPhase + 1) % phases.length
    onPhaseChange(next)
  }

  const handlePrev = () => {
    const prev = (currentPhase - 1 + phases.length) % phases.length
    onPhaseChange(prev)
  }

  const activePhase = phases[currentPhase]
  
  // Fetch signature move description to display in tooltip
  const [signatureMoveInfo, setSignatureMoveInfo] = useState<{ shortEffect: string | null; type?: string; damageClass?: 'physical' | 'special' | 'status' } | null>(null)
  useEffect(() => {
    let isMounted = true
    const fetchMove = async () => {
      try {
        const name = selectedPokemon?.signatureMove
        if (!name) {
          if (isMounted) setSignatureMoveInfo(null)
          return
        }
        // Normalize to PokeAPI id/name and use adapter which resolves short effect and metadata
        const normalized = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
        const mv = await loadMoveFromPokeAPI(normalized)
        if (!isMounted) return
        const type = (mv as any).type
        const damageClass = ((mv as any).category || (mv as any).damage_class)?.toString().toLowerCase() as 'physical' | 'special' | 'status' | undefined
        setSignatureMoveInfo({ shortEffect: (mv as any).shortEffect ?? null, type, damageClass })
      } catch (e) {
        if (isMounted) setSignatureMoveInfo(null)
      }
    }
    fetchMove()
    return () => { isMounted = false }
  }, [selectedPokemon?.signatureMove])

  return (
    <section id="top50-popup-book" className="relative overflow-visible rounded-3xl border border-border bg-surface shadow-2xl shadow-black/10">
      <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/30 to-white/10 dark:from-slate-900/80 dark:via-slate-900/40 dark:to-slate-900/20" aria-hidden />
      <div className="relative z-10 p-6 sm:p-8 lg:p-10 space-y-6">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="uppercase tracking-[0.3em] text-[0.60rem] text-muted">Pokémon Popularity Popup Book</p>
            <h1 className="text-2xl sm:text-3xl font-black text-text mt-1" style={{ fontFamily: 'Pocket Monk, sans-serif' }}>
              {activePhase.title}
            </h1>
            <p className="text-sm sm:text-base text-muted max-w-2xl mt-2">
              {activePhase.description}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="flex items-center gap-2 rounded-full border border-border bg-white/60 px-4 py-2 text-sm font-medium shadow-sm transition hover:-translate-x-0.5 hover:bg-white focus:outline-none focus:ring-2 focus:ring-poke-blue dark:bg-slate-800/70 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Prev
            </button>
            <button
              onClick={handleNext}
              className="flex items-center gap-2 rounded-full border border-border bg-white/60 px-4 py-2 text-sm font-medium shadow-sm transition hover:translate-x-0.5 hover:bg-white focus:outline-none focus:ring-2 focus:ring-poke-blue dark:bg-slate-800/70 dark:hover:bg-slate-800"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </header>

        <nav id="top50-phases-nav" className="grid grid-cols-2 gap-3 md:flex md:flex-wrap md:gap-3 rounded-2xl border border-border bg-white/70 p-2 backdrop-blur dark:bg-slate-900/70">
          {phases.map((phase, index) => (
            <button
              key={phase.id}
              onClick={() => onPhaseChange(index)}
              className={`relative overflow-hidden rounded-2xl border px-4 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-poke-blue ${
                index === currentPhase
                  ? 'border-poke-blue bg-white shadow-lg shadow-poke-blue/10 dark:bg-slate-900'
                  : 'border-border bg-white/50 hover:bg-white/80 dark:bg-slate-900/60 dark:hover:bg-slate-900'
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${phase.accent} opacity-${index === currentPhase ? '25' : '10'} pointer-events-none`} aria-hidden />
              <div className="relative z-10">
                <p className="text-xs uppercase tracking-wide text-muted">Phase {index + 1}</p>
                <p className="text-sm font-semibold text-text mt-1">{phase.title}</p>
              </div>
            </button>
          ))}
        </nav>

        <div className="relative">
          <AnimatePresence mode="wait">
              <motion.div
              key={activePhase.id}
              initial="enter"
              animate="center"
              exit="exit"
              variants={phaseVariants}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              className="relative overflow-visible rounded-3xl border border-border bg-surface p-6 sm:p-8"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-white/80 to-transparent dark:via-slate-700" aria-hidden />
              <PhaseContent
                phaseId={activePhase.id}
                pokemon={pokemon}
                selectedPokemon={selectedPokemon}
                coverMetrics={coverMetrics}
                typeDistribution={typeDistribution}
                trendLeaders={trendLeaders}
                onSelectPokemon={onSelectPokemon}
                regencySpotlight={regencySpotlight}
                signatureMoveInfo={signatureMoveInfo}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}

interface PhaseContentProps {
  phaseId: string
  pokemon: PopularPokemon[]
  selectedPokemon: PopularPokemon | null
  coverMetrics: CoverMetrics | null
  typeDistribution: Array<{ type: string; count: number; percentage: number }>
  trendLeaders: Array<PopularPokemon & { delta: number; latest: number }>
  onSelectPokemon: (rank: number) => void
  regencySpotlight: { totalPeers: number; regionalAverage: number; region: string } | null
  signatureMoveInfo: { shortEffect: string | null; type?: string; damageClass?: 'physical' | 'special' | 'status' } | null
}

interface PortraitIconProps {
  id: number
  name: string
  size?: number
}

function PortraitIcon({ id, name, size = 32 }: PortraitIconProps) {
  const id4 = String(id).padStart(4, '0')
  const localSrc = `/assets/pmd/${id4}/portrait/Normal.png`
  const remoteSrc = `https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/${id4}/Normal.png`
  const fallback = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
  const candidates = [localSrc, remoteSrc]
  return (
    <img
      src={candidates[0]}
      alt={`${name} portrait`}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className="h-8 w-8 rounded-lg border border-border bg-surface object-contain"
      data-index={0}
      onError={(e) => {
        const el = e.currentTarget as HTMLImageElement
        const idx = parseInt(el.dataset.index || '0', 10)
        const next = candidates[idx + 1]
        if (next) {
          el.src = next
          el.dataset.index = String(idx + 1)
        } else {
          el.src = fallback
        }
      }}
    />
  )
}

function PhaseContent({
  phaseId,
  pokemon,
  selectedPokemon,
  coverMetrics,
  typeDistribution,
  trendLeaders,
  onSelectPokemon,
  regencySpotlight,
  signatureMoveInfo
}: PhaseContentProps) {
  const [openTypes, setOpenTypes] = useState<Record<string, boolean>>({})
  const [openGens, setOpenGens] = useState<Record<number, boolean>>({})
  const [shinyView, setShinyView] = useState(false)
  if (phaseId === 'cover') {
    if (!coverMetrics) {
      return <p className="text-muted">No popularity data available yet.</p>
    }

    const { total, avgScore, topType, topRegion, generationSpread, typeCounts } = coverMetrics

    const diversityScore = Math.min(100, Math.round(Object.keys(typeCounts).length / 18 * 100))

    return (
      <div className="grid gap-6 lg:grid-cols-[1.3fr,1fr]">
        <div className="space-y-6">
          <div className="rounded-2xl bg-gradient-to-br from-amber-200/70 via-pink-200/60 to-purple-200/60 p-6 shadow-inner dark:from-amber-500/20 dark:via-pink-500/20 dark:to-purple-500/20">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-800/60 dark:text-amber-100/80">Season Recap</p>
            <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-100 mt-2">Top 50 roll call</h2>
            <p className="text-sm text-amber-900/80 dark:text-amber-50/80 max-w-xl mt-2">
              Fans voted across games, anime arcs, and competitive leagues. This fold brings the hottest characters into a single bound volume.
            </p>
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <MetricCard label="Pokémon featured" value={total.toString()} />
              <MetricCard 
                label="Average hype" 
                value={`${avgScore}/100`} 
                tooltip="Community index: a 0–100 aggregate built from recent polls, social mentions, event highlights, and game visibility. Higher is more popular right now." 
              />
              <MetricCard label="Type diversity" value={`${diversityScore}%`} />
              {topType && <MetricCard label="Most represented type" value={`${topType[0]} × ${topType[1]}`} />}
              {topRegion && <MetricCard label="Region spotlight" value={`${topRegion[0]} (${topRegion[1]})`} />}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-text">Generation spread</h3>
            <p className="text-xs text-muted mt-1">Tap a generation to expand and see all Top 50 entries from that era.</p>
            <div className="mt-4 space-y-3">
              {generationSpread.map(gen => {
                const isOpen = !!openGens[gen.generation]
                const members = pokemon.filter(p => p.generation === gen.generation)
                return (
                  <div key={gen.generation} className="rounded-2xl border border-border bg-surface p-0 shadow-sm overflow-hidden">
                    <button
                      onClick={() => setOpenGens(prev => ({ ...prev, [gen.generation]: !prev[gen.generation] }))}
                      className="w-full px-4 py-3 text-left flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="h-3 w-3 rounded-full border bg-gradient-to-r from-poke-blue/70 to-poke-red/70 border-transparent" />
                        <p className="font-semibold text-text">Gen {gen.generation}</p>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <p className="text-xs text-muted">{gen.count} entries</p>
                        <span className={`transition-transform ${isOpen ? 'rotate-90' : ''}`}>›</span>
                      </div>
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4">
                        <div className="mt-2 h-2 rounded-full bg-muted/20">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-poke-blue/60 to-poke-red/60"
                            style={{ width: `${Math.min(gen.percentage, 100)}%` }}
                          />
                        </div>
                        <div className="mt-4 space-y-2">
                          {members.map(poke => (
                            <button
                              key={poke.rank}
                              onClick={() => onSelectPokemon(poke.rank)}
                              className="group flex w-full items-center justify-between rounded-xl border border-border bg-white/70 px-3 py-2 text-left shadow-sm transition hover:border-poke-blue hover:bg-white dark:bg-slate-900/60"
                            >
                              <div className="flex items-center gap-3">
                                <PortraitIcon id={poke.nationalNumber} name={poke.name} size={28} />
                                <div>
                                  <p className="text-sm font-semibold text-text">#{poke.rank} {poke.name}</p>
                                  <p className="text-xs text-muted">Score {poke.popularityScore}</p>
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {poke.types.map(t => (
                                      <TypeBadge key={`${poke.rank}-${t}`} type={t.toLowerCase()} variant="span" className="!px-2 !py-1 !text-[10px] !rounded" />
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <ArrowRight className="h-4 w-4 text-muted" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <aside className="space-y-4 self-start">
          <div className="rounded-2xl border border-dashed border-poke-blue/40 bg-poke-blue/5 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-poke-blue">How to use this spread</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>• Tap any bookmark below to jump straight to its spotlight layer.</li>
              <li>• Flip through the Type Atlas to see how dual typings stack.</li>
              <li>• Momentum Tracker calls out rank risers by delta.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-5 text-amber-900 shadow-sm dark:border-transparent dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 dark:text-slate-100 dark:shadow-xl">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-amber-900 dark:text-slate-100"><Flame className="h-4 w-4 text-amber-500" /> Top hype streaks</h3>
            <p className="text-xs text-amber-700/80 mt-2 dark:text-slate-300">Tap a rising star to see why the crowd is roaring.</p>
            <div className="mt-4 space-y-3">
              {trendLeaders.slice(0, 3).map(poke => (
                <button
                  key={poke.rank}
                  onClick={() => onSelectPokemon(poke.rank)}
                  className="group flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition border-amber-200/70 bg-white/90 hover:bg-amber-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                >
                  <div className="flex items-center gap-3">
                    <PortraitIcon id={poke.nationalNumber} name={poke.name} size={32} />
                    <div>
                      <p className="text-sm font-semibold text-amber-900 dark:text-white">#{poke.rank} {poke.name}</p>
                      <p className="text-[0.7rem] text-amber-700/80 dark:text-slate-300">Δ {poke.delta >= 0 ? '+' : ''}{poke.delta} • latest {poke.latest}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-amber-600 transition group-hover:translate-x-1 dark:text-slate-300" />
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    )
  }

  if (phaseId === 'spotlight') {
    if (!selectedPokemon) {
      return (
        <div className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
          {/* Main content skeleton */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="h-24 w-24 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <div className="space-y-3 flex-1">
                <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="flex gap-2 mt-3">
                  <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                  <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                  <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
            
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
          </div>
          
          {/* Sidebar skeleton */}
          <aside className="space-y-4 self-start">
            <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-text">Quick comparisons</h3>
              <p className="text-xs text-muted mt-2">All Top 50 entries. Tap to jump.</p>
              <div className="mt-4 space-y-1.5 md:space-y-2 text-sm max-h-64 md:max-h-[420px] lg:max-h-[520px] xl:max-h-[640px] overflow-y-auto pr-1 md:pr-2 scrollbar-hide overscroll-contain">
                {Array.from({ length: 10 }).map((_, index) => (
                  <div
                    key={`skeleton-${index}`}
                    className="flex w-full items-center justify-between rounded-2xl border border-border bg-white/60 px-3 py-2 md:py-2.5 animate-pulse"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-full bg-gray-200 dark:bg-gray-700" />
                      <div className="space-y-1">
                        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                        <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                        <div className="flex gap-1 mt-1">
                          <div className="h-4 w-8 bg-gray-200 dark:bg-gray-700 rounded" />
                          <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
                        </div>
                      </div>
                    </div>
                    <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="rounded-3xl border border-pink-200 bg-gradient-to-br from-rose-50 via-pink-50 to-fuchsia-50 p-5 text-rose-950 shadow-sm dark:border-transparent dark:from-slate-900 dark:to-slate-800 dark:text-slate-100 dark:shadow-xl">
              <h3 className="text-sm font-semibold text-rose-900 dark:text-slate-100">Why it resonates</h3>
              <div className="mt-3 space-y-2">
                <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-3 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-3 w-5/6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
          </aside>
        </div>
      )
    }

    const trend = selectedPokemon.trend
    const minTrend = Math.min(...trend)
    const maxTrend = Math.max(...trend)
    const [gender, setGender] = useState<'male' | 'female'>('male')
    const [orientation, setOrientation] = useState<'front' | 'back'>('front')
    const [femaleAvailable, setFemaleAvailable] = useState<boolean>(true)
    const [unavailableMap, setUnavailableMap] = useState<Record<string, boolean>>({})

    // Lazy-load Quick comparisons only when visible in viewport
    const quickListRef = useRef<HTMLDivElement | null>(null)
    const [quickVisible, setQuickVisible] = useState(false)
    useEffect(() => {
      const el = quickListRef.current
      if (!el) return
      const io = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          setQuickVisible(true)
          io.disconnect()
        }
      }, { root: null, threshold: 0.1 })
      io.observe(el)
      return () => io.disconnect()
    }, [])

    const quickComparisons = useMemo(() => {
      if (!quickVisible) return [] as typeof pokemon
      // Show the entire Top 50 list in rank order
      return [...pokemon].sort((a, b) => a.rank - b.rank)
    }, [quickVisible, pokemon])

    // When the list becomes visible or selection changes, center the selected entry
    useEffect(() => {
      if (!quickVisible) return
      const root = quickListRef.current
      if (!root) return
      const current = root.querySelector<HTMLButtonElement>(`button[data-rank="${selectedPokemon.rank}"]`)
      if (current) {
        current.scrollIntoView({ block: 'center' })
      }
    }, [quickVisible, selectedPokemon.rank])

    // Probe whether female variants exist (HOME or sprite front); if not, disable Female toggle
    useEffect(() => {
      const id = selectedPokemon.nationalNumber
      const urls = [
        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/female/${id}.png`,
        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/female/${id}.png`
      ]
      let cancelled = false
      const check = (url: string) => new Promise<boolean>((resolve) => {
        if (typeof window === 'undefined') {
          resolve(false)
          return
        }
        const img = new window.Image()
        img.onload = () => resolve(true)
        img.onerror = () => resolve(false)
        img.src = url
      })
      ;(async () => {
        const results = await Promise.all(urls.map(check))
        if (!cancelled) {
          const ok = results.some(Boolean)
          setFemaleAvailable(ok)
          if (!ok && gender === 'female') setGender('male')
        }
      })()
      return () => { cancelled = true }
    }, [selectedPokemon.nationalNumber])

    return (
      <div className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
        <div id="top50-spotlight-card" tabIndex={-1} className="relative overflow-visible rounded-3xl border border-border bg-surface shadow-xl focus:outline-none focus:ring-2 focus:ring-poke-blue">
          <div className="absolute right-6 top-6 flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs font-semibold text-muted shadow-sm dark:bg-slate-900/80">
            <LineChart className="h-4 w-4" /> Popularity trace
          </div>
          <div className="grid gap-5 p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link 
                href={`/pokemon/${selectedPokemon.nationalNumber}`}
                className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl border border-border bg-surface shadow-sm flex items-center justify-center hover:shadow-lg hover:border-poke-blue transition-all duration-200 group"
                title={`View ${selectedPokemon.name} details`}
              >
                {/* Prefer PMD Collab portrait (Normal) when available; fall back to PokeAPI sprite */}
                {(() => {
                  const id = selectedPokemon.nationalNumber
                  const id4 = String(id).padStart(4, '0')
                  const candidates = [
                    `https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/${id4}/Normal.png`
                  ]
                  const fallback = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
                  return (
                    <img
                      src={candidates[0]}
                      alt={`${selectedPokemon.name} portrait`}
                      width={96}
                      height={96}
                      loading="lazy"
                      decoding="async"
                      className="w-24 h-24 object-contain group-hover:scale-105 transition-transform duration-200"
                      data-index={0}
                      onError={(e) => {
                        const el = e.currentTarget as HTMLImageElement
                        const idx = parseInt(el.dataset.index || '0', 10)
                        const next = candidates[idx + 1]
                        if (next) {
                          el.src = next
                          el.dataset.index = String(idx + 1)
                        } else {
                          el.src = fallback
                        }
                      }}
                    />
                  )
                })()}
              </Link>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted">Rank {selectedPokemon.rank}</p>
                <h2 id="top50-spotlight-name" className="text-3xl font-black text-text" style={{ fontFamily: 'Pokemon X and Y, sans-serif' }}>{selectedPokemon.name}</h2>
                <p className="text-sm text-muted max-w-lg mt-2">{selectedPokemon.description}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text/80">
                  <span className="rounded-full bg-poke-blue/10 px-3 py-1 text-poke-blue">{selectedPokemon.region}</span>
                  <span className="rounded-full bg-poke-red/10 px-3 py-1 text-poke-red">Gen {selectedPokemon.generation}</span>
                  {selectedPokemon.types.map(type => (
                    <TypeBadge key={type} type={type.toLowerCase()} variant="span" className="!px-2.5 !py-0.5 !text-[11px] !rounded normal-case" />
                  ))}
                </div>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-2xl bg-gradient-to-br from-poke-blue/10 to-poke-blue/5 p-4">
                <dt className="text-xs uppercase tracking-wide text-poke-blue/80">
                  <Tooltip
                    content="Community index: a 0–100 aggregate built from recent polls, social mentions, event highlights, and game visibility. Higher is more popular right now."
                    variant="stat"
                    maxWidth="w-[22rem]"
                    title="Popularity score"
                  >
                    <span className="inline-flex items-center gap-1 cursor-help">
                      <span className="border-b border-dotted border-poke-blue/50">Popularity score</span>
                      <HelpCircle className="h-3.5 w-3.5" />
                    </span>
                  </Tooltip>
                </dt>
                <dd className="text-2xl font-bold text-poke-blue">{selectedPokemon.popularityScore}</dd>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-poke-red/10 to-poke-red/5 p-4">
                <dt className="text-xs uppercase tracking-wide text-poke-red/80">Signature move</dt>
                <dd className="text-sm font-semibold text-poke-red">
                  <Tooltip
                    content={signatureMoveInfo?.shortEffect || 'Move details unavailable.'}
                    maxWidth="w-[22rem]"
                    variant="move"
                    type={(signatureMoveInfo?.type as string) || undefined}
                    damageClass={signatureMoveInfo?.damageClass}
                  >
                    <span className="inline-flex items-center gap-1 cursor-help">
                      <span className="border-b border-dotted border-poke-red/50">{selectedPokemon.signatureMove}</span>
                      <HelpCircle className="h-3.5 w-3.5" />
                    </span>
                  </Tooltip>
                </dd>
              </div>
              {regencySpotlight && (
                <div className="rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-4 col-span-2">
                  <dt className="text-xs uppercase tracking-wide text-emerald-700/80">Regional standing</dt>
                  <dd className="text-sm text-emerald-900 dark:text-emerald-100">{selectedPokemon.name} sits above the {regencySpotlight.region} average ({regencySpotlight.regionalAverage}) across {regencySpotlight.totalPeers} peers.</dd>
                </div>
              )}
            </dl>

            <div>
              <h3 className="text-sm font-semibold text-text flex items-center gap-2">
                <Tooltip
                  content="Five-year community index. Each point is this Pokémon’s popularity score for that year; the line is scaled to this Pokémon’s min and max across the window."
                  variant="stat"
                  maxWidth="w-[22rem]"
                  title="Trendline"
                >
                  <span className="inline-flex items-center gap-1 cursor-help">
                    <span className="border-b border-dotted border-current/40">Trendline</span>
                    <HelpCircle className="h-3.5 w-3.5" />
                  </span>
                </Tooltip>
              </h3>
              <p className="text-xs text-muted">Five-year community index — years run oldest to newest. Vertical scale uses this Pokémon&apos;s min/max.</p>
              <div className="mt-3 rounded-2xl border border-border bg-surface p-4 shadow-inner">
                {(() => {
                  const n = trend.length
                  const xStep = n > 1 ? 100 / (n - 1) : 0
                  const yMin = 10
                  const yMax = 90
                  const yAt = (t: number) => yMax - (yMax - yMin) * t
                  const midValue = Math.round((minTrend + maxTrend) / 2)
                  const nowYear = new Date().getFullYear()
                  const startYear = nowYear - n
                  const years = Array.from({ length: n }, (_, i) => startYear + i)
                  const points = trend.map((value, index) => {
                    const rel = maxTrend === minTrend ? 1 : (value - minTrend) / (maxTrend - minTrend)
                    const x = index * xStep
                    const y = yAt(rel)
                    const tooltip = `Y${index + 1}: community index ${value}. Height normalized to this roster's min (${minTrend}) and max (${maxTrend}).`
                    return { x, y, value, index, tooltip }
                  })
                  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
                  // Build overlay series for nearest-by-rank neighbors and ±5 ranks within Top 50
                  const neighborSeries = (() => {
                    const byRank = new Map<number, { rank: number; name: string; series: number[]; kind: 'nearest' | 'offset' }>()
                    // Two nearest by absolute rank distance
                    const nearestTwo = [...pokemon]
                      .filter(p => p.rank !== selectedPokemon.rank)
                      .sort((a, b) => Math.abs(a.rank - selectedPokemon.rank) - Math.abs(b.rank - selectedPokemon.rank))
                      .slice(0, 2)
                      .map(p => ({ rank: p.rank, name: p.name, series: p.trend, kind: 'nearest' as const }))
                    nearestTwo.forEach(s => { byRank.set(s.rank, s) })
                    // ±5 ranks if available
                    const offsets = [-5, 5]
                      .map(off => pokemon.find(p => p.rank === selectedPokemon.rank + off))
                      .filter(Boolean)
                      .map(p => ({ rank: (p as any).rank as number, name: (p as any).name as string, series: (p as any).trend as number[], kind: 'offset' as const }))
                    offsets.forEach(s => { byRank.set(s.rank, s) })
                    return Array.from(byRank.values()).sort((a, b) => a.rank - b.rank)
                  })()
                  const overlayPaths = neighborSeries.map(ns => {
                    // Normalize to selected's min/max window
                    const dPath = (ns.series || []).slice(0, n).map((v, i) => {
                      const rel = maxTrend === minTrend ? 1 : (v - minTrend) / (maxTrend - minTrend)
                      const y = yAt(Math.max(0, Math.min(1, rel)))
                      const x = i * xStep
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
                    }).join(' ')
                    return { key: `${ns.rank}-${ns.kind}`, d: dPath, kind: ns.kind }
                  })
                  const containerRef = useRef<HTMLDivElement | null>(null)
                  const [hover, setHover] = useState<{ x: number; y: number; index: number } | null>(null)
                  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
                    const el = containerRef.current
                    if (!el) return
                    const rect = el.getBoundingClientRect()
                    const xPx = e.clientX - rect.left
                    const yPx = e.clientY - rect.top
                    const width = rect.width
                    const xPct = (xPx / width) * 100
                    // find closest point by x
                    let idx = 0
                    let best = Number.MAX_VALUE
                    points.forEach((p, i) => {
                      const dist = Math.abs(p.x - xPct)
                      if (dist < best) { best = dist; idx = i }
                    })
                    // clamp tooltip within container width (approx 260px tooltip)
                    const maxLeft = Math.max(0, rect.width - 260)
                    const left = Math.min(maxLeft, Math.max(8, xPx + 8))
                    const top = Math.max(8, Math.min(rect.height - 8, yPx - 12))
                    setHover({ x: left, y: top, index: idx })
                  }
                  const handleLeave = () => setHover(null)
                  return (
                    <div ref={containerRef} onMouseMove={handleMove} onMouseLeave={handleLeave} className="relative h-24 overflow-visible">
                      <svg className="absolute inset-0 h-full w-full text-poke-blue" viewBox="0 0 100 100" preserveAspectRatio="none">
                        {/* Gridlines */}
                        <g className="text-gray-300 dark:text-gray-600" stroke="currentColor" strokeWidth="0.5" opacity="0.6">
                          <line x1="0" y1={yAt(1)} x2="100" y2={yAt(1)} />
                          <line x1="0" y1={yAt(0.5)} x2="100" y2={yAt(0.5)} />
                          <line x1="0" y1={yAt(0)} x2="100" y2={yAt(0)} />
                        </g>
                        {/* Overlays: nearest two (solid slate-500) and ±5 (dashed slate-300) */}
                        {overlayPaths.map(op => (
                          <path
                            key={op.key}
                            d={op.d}
                            stroke={op.kind === 'nearest' ? '#64748b' : '#cbd5e1'}
                            strokeWidth="1.5"
                            fill="none"
                            strokeDasharray={op.kind === 'nearest' ? undefined : '3 3'}
                            opacity={op.kind === 'nearest' ? 0.9 : 0.9}
                          />
                        ))}
                        <path d={d} stroke="currentColor" strokeWidth="2.5" fill="none" />
                        {points.map(p => (
                          <circle key={`pt-${p.index}`} cx={p.x} cy={p.y} r="2.5" fill="currentColor" />
                        ))}
                      </svg>
                      {/* Y-axis guides */}
                      <div className="pointer-events-none absolute inset-0">
                        <div className="absolute left-1 -translate-y-1/2 text-[0.65rem] text-muted bg-surface/80 px-1 rounded" style={{ top: `${yAt(1)}%` }}>max {maxTrend}</div>
                        <div className="absolute left-1 -translate-y-1/2 text-[0.65rem] text-muted bg-surface/80 px-1 rounded" style={{ top: `${yAt(0.5)}%` }}>mid {midValue}</div>
                        <div className="absolute left-1 -translate-y-1/2 text-[0.65rem] text-muted bg-surface/80 px-1 rounded" style={{ top: `${yAt(0)}%` }}>min {minTrend}</div>
                      </div>
                      {hover && (
                        <div className="pointer-events-none absolute z-50 -translate-y-2 rounded-md bg-slate-900 text-white text-xs px-2 py-1 shadow" style={{ left: hover.x, top: hover.y }}>
                          {points[hover.index].tooltip}
                        </div>
                      )}
                      <div className="absolute -bottom-5 left-0 right-0 flex justify-between text-[0.65rem] text-muted">
                        {years.map((y, i) => (
                          <span key={`lbl-${i}`}>{y}</span>
                        ))}
                      </div>
                      <div className="absolute -bottom-8 left-0 right-0 text-center text-[0.65rem] text-muted">{years[0]} oldest → {years[years.length - 1]} newest</div>
                    </div>
                  )
                })()}
              </div>
              {/* Sprite showroom with synchronized selectors */}
              <div className="mt-4 rounded-2xl border border-border bg-surface p-4 shadow-inner">
                {(() => {
                  const id = selectedPokemon.nationalNumber
                  const id4 = String(id).padStart(4, '0')
                  const name = selectedPokemon.name
                  const female = gender === 'female'
                  const shiny = shinyView

                  const officialUrl = shiny
                    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${id}.png`
                    : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`

                  const spriteUrl = (() => {
                    const parts: string[] = []
                    if (orientation === 'back') parts.push('back')
                    if (shiny) parts.push('shiny')
                    if (female) parts.push('female')
                    const suffix = parts.length ? `/${parts.join('/')}` : ''
                    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon${suffix}/${id}.png`
                  })()

                  const pixelUrl = spriteUrl // same as sprite; styled pixelated

                  const gifUrl = getShowdownAnimatedSprite(name, orientation, shiny)

                  const homeUrl = (() => {
                    // Best-effort HOME path; may not exist for all
                    if (shiny && female) return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/shiny-female/${id}.png`
                    if (!shiny && female) return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/female/${id}.png`
                    if (shiny && !female) return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/shiny/${id}.png`
                    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${id}.png`
                  })()

                  const portraitUrl = `https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/${id4}/Normal.png`

                  const items: Array<{ key: string; label: string; url: string; pixelated?: boolean }>
                    = [
                      { key: 'official', label: 'Official', url: officialUrl },
                      { key: 'gif', label: 'GIF', url: gifUrl },
                      { key: '3d', label: 'Gen 6-9', url: homeUrl },
                      { key: 'sprite', label: 'Sprite', url: spriteUrl },
                      { key: 'pixel', label: 'Gen 1-5', url: pixelUrl, pixelated: true }
                    ]

                  return (
                    <div>
                      {/* Controls */}
                      <div className="mb-4 flex flex-wrap items-center gap-3">
                        <div className="inline-flex rounded-lg border border-border overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setShinyView(false)}
                            className={`px-3 py-1 text-xs ${!shiny ? 'bg-surface text-text' : 'bg-transparent text-muted'}`}
                          >
                            Normal
                          </button>
                          <button
                            type="button"
                            onClick={() => setShinyView(true)}
                            className={`px-3 py-1 text-xs ${shiny ? 'bg-surface text-text' : 'bg-transparent text-muted'}`}
                          >
                            Shiny
                          </button>
                        </div>
                        <div className="inline-flex rounded-lg border border-border overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setGender('male')}
                            className={`px-3 py-1 text-xs ${gender === 'male' ? 'bg-surface text-text' : 'bg-transparent text-muted'}`}
                          >
                            ♂ Male
                          </button>
                          <button
                            type="button"
                            onClick={() => setGender('female')}
                            disabled={!femaleAvailable}
                            className={`px-3 py-1 text-xs ${gender === 'female' ? 'bg-surface text-text' : 'bg-transparent text-muted'} ${!femaleAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            ♀ Female
                          </button>
                        </div>
                        <div className="inline-flex rounded-lg border border-border overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setOrientation('front')}
                            className={`px-3 py-1 text-xs ${orientation === 'front' ? 'bg-surface text-text' : 'bg-transparent text-muted'}`}
                          >
                            Front
                          </button>
                          <button
                            type="button"
                            onClick={() => setOrientation('back')}
                            className={`px-3 py-1 text-xs ${orientation === 'back' ? 'bg-surface text-text' : 'bg-transparent text-muted'}`}
                          >
                            Back
                          </button>
                        </div>
                      </div>

                      {/* Grid of styles */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {items.map(item => (
                          <div key={item.key} className="flex flex-col items-center gap-2 rounded-xl border border-border bg-white/60 p-3 dark:bg-white/5">
                            <div className="relative h-24 w-24 flex items-center justify-center overflow-hidden rounded-lg border border-border">
                              <img
                                src={item.url}
                                alt={`${name} ${item.label}`}
                                width={96}
                                height={96}
                                loading="lazy"
                                decoding="async"
                                className={`h-24 w-24 object-contain ${item.pixelated ? '[image-rendering:pixelated]' : ''}`}
                                onLoad={() => {
                                  setUnavailableMap(prev => ({ ...prev, [item.key]: false }))
                                }}
                                onError={(e) => {
                                  const el = e.currentTarget as HTMLImageElement
                                  setUnavailableMap(prev => ({ ...prev, [item.key]: true }))
                                  // Simple fallback chain per style
                                  if (item.key === 'gif') {
                                    el.src = spriteUrl
                                  } else if (item.key === '3d') {
                                    el.src = officialUrl
                                  } else {
                                    el.src = officialUrl
                                  }
                                }}
                              />
                              {unavailableMap[item.key] && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-black/60">
                                  <span className="text-[10px] font-semibold text-muted">Unavailable</span>
                                </div>
                              )}
                            </div>
                            <div className="text-xs font-semibold text-muted">{item.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-4 self-start">
          <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-text">Quick comparisons</h3>
            <p className="text-xs text-muted mt-2">All Top 50 entries. Tap to jump.</p>
            <div ref={quickListRef} className="mt-4 space-y-1.5 md:space-y-2 text-sm max-h-64 md:max-h-[420px] lg:max-h-[520px] xl:max-h-[640px] overflow-y-auto pr-1 md:pr-2 scrollbar-hide overscroll-contain">
              {!quickVisible ? (
                // Skeleton loading state
                Array.from({ length: 10 }).map((_, index) => (
                  <div
                    key={`skeleton-${index}`}
                    className="flex w-full items-center justify-between rounded-2xl border border-border bg-white/60 px-3 py-2 md:py-2.5 animate-pulse"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-full bg-gray-200 dark:bg-gray-700" />
                      <div className="space-y-1">
                        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                        <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                        <div className="flex gap-1 mt-1">
                          <div className="h-4 w-8 bg-gray-200 dark:bg-gray-700 rounded" />
                          <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
                        </div>
                      </div>
                    </div>
                    <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>
                ))
              ) : (
                quickComparisons.map(poke => {
                  const isCurrent = poke.rank === selectedPokemon.rank
                  return (
                    <button
                      key={poke.rank}
                      data-rank={poke.rank}
                      onClick={() => !isCurrent && onSelectPokemon(poke.rank)}
                      disabled={isCurrent}
                      className={`group flex w-full items-center justify-between rounded-2xl border px-3 py-2 md:py-2.5 text-left transition dark:bg-slate-900/60 ${
                        isCurrent
                          ? 'border-poke-blue bg-white/90 ring-1 ring-poke-blue/40 cursor-default'
                          : 'border-border bg-white/60 hover:border-poke-blue hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <PortraitIcon id={poke.nationalNumber} name={poke.name} size={28} />
                        <div>
                          <p className="text-sm font-semibold text-text">#{poke.rank} {poke.name}</p>
                          <p className="text-xs text-muted">Score {poke.popularityScore}</p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {poke.types.map(t => (
                              <TypeBadge key={`${poke.rank}-${t}`} type={t.toLowerCase()} variant="span" className="!px-2 !py-1 !text-[10px] !rounded" />
                            ))}
                          </div>
                        </div>
                      </div>
                      {!isCurrent && <ArrowRight className="h-4 w-4 text-muted transition group-hover:translate-x-1" />}
                    </button>
                  )
                })
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-pink-200 bg-gradient-to-br from-rose-50 via-pink-50 to-fuchsia-50 p-5 text-rose-950 shadow-sm dark:border-transparent dark:from-slate-900 dark:to-slate-800 dark:text-slate-100 dark:shadow-xl">
            <h3 className="text-sm font-semibold text-rose-900 dark:text-slate-100">Why it resonates</h3>
            <ul className="mt-3 space-y-2 text-xs text-rose-700/80 dark:text-slate-200">
              <li>
                • {selectedPokemon.name} maintains a{' '}
                <Tooltip
                  content="Hype index is the same community index used above: a 0–100 blend of polls, social buzz, events, and visibility."
                  variant="stat"
                  maxWidth="w-[22rem]"
                  title="hype index"
                >
                  <span className="inline-flex items-baseline gap-1 cursor-help whitespace-nowrap align-baseline">
                    <span className="border-b border-dotted border-current/40 align-baseline">hype index</span>
                    <HelpCircle className="h-3.5 w-3.5 align-baseline" />
                  </span>
                </Tooltip>
                {' '}{selectedPokemon.popularityScore}.
              </li>
              <li>• Signature move {selectedPokemon.signatureMove} anchors highlight reels.</li>
              <li>• {selectedPokemon.types.join(' & ')} teams rely on it for synergy.</li>
            </ul>
          </div>
        </aside>
      </div>
    )
  }

  if (phaseId === 'types') {
    return (
      <div className="grid gap-6 lg:grid-cols-[1.1fr,1fr]">
        <div className="rounded-3xl border border-border bg-surface p-5 shadow-inner">
          <h3 className="text-lg font-semibold text-text">Type Atlas stack</h3>
          <p className="text-sm text-muted mt-2">Each bookmark layer represents how often a type appears across the Top 50 list. Dual typings count twice to show actual deck-building impact.</p>
          <div className="mt-6 space-y-3">
            {typeDistribution.map(entry => {
              const t = entry.type
              const tl = t.toLowerCase()
              const isOpen = !!openTypes[t]
              const members = pokemon.filter(p => p.types.includes(t))
              return (
                <div key={t} className="rounded-2xl border border-border bg-surface p-0 shadow-sm overflow-hidden">
                  <button
                    onClick={() => setOpenTypes(prev => ({ ...prev, [t]: !prev[t] }))}
                    className="w-full px-4 py-3 text-left flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="h-3 w-3 rounded-full border"
                        style={{ backgroundColor: `var(--type-${tl})`, borderColor: `var(--type-${tl})` }}
                      />
                      <p className="font-semibold text-text">{t}</p>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <p className="text-xs text-muted">{entry.count} appearances</p>
                      <span className={`transition-transform ${isOpen ? 'rotate-90' : ''}`}>›</span>
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4">
                      <div className="mt-2 h-2 rounded-full bg-muted/20">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${Math.min(entry.percentage, 100)}%`, backgroundColor: `var(--type-${tl})` }}
                        />
                      </div>
                      <div className="mt-4 space-y-2">
                        {members.map(poke => (
                          <button
                            key={poke.rank}
                            onClick={() => onSelectPokemon(poke.rank)}
                            className="group flex w-full items-center justify-between rounded-xl border border-border bg-white/70 px-3 py-2 text-left shadow-sm transition hover:border-poke-blue hover:bg-white dark:bg-slate-900/60"
                          >
                            <div className="flex items-center gap-3">
                              <PortraitIcon id={poke.nationalNumber} name={poke.name} size={28} />
                              <div>
                                <p className="text-sm font-semibold text-text">#{poke.rank} {poke.name}</p>
                                <p className="text-xs text-muted">Score {poke.popularityScore}</p>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {poke.types.map(t => (
                                    <TypeBadge key={`${poke.rank}-${t}`} type={t.toLowerCase()} variant="span" className="!px-2 !py-1 !text-[10px] !rounded" />
                                  ))}
                                </div>
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <aside className="space-y-4 self-start">
          <div className="rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 p-5 shadow-sm dark:from-emerald-500/10 dark:to-teal-500/10">
            <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">Builders&apos; notes</h3>
            <p className="text-xs text-emerald-900/80 dark:text-emerald-100/80 mt-2">Electric, Dragon, and Fairy appearances continue to climb due to strong coverage and signature mechanics in Scarlet & Violet.</p>
            <p className="text-xs text-emerald-900/80 dark:text-emerald-100/80 mt-3">Use this atlas to draft themed tournaments or highlight type challenges in your community events.</p>
          </div>

          <div className="rounded-3xl border border-border bg-white/70 p-4 shadow-sm dark:bg-slate-900/70">
            <h3 className="text-sm font-semibold text-text">Quick filter</h3>
            <p className="text-xs text-muted mt-2">Jump straight to any Pokémon of a chosen type.</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              {typeDistribution.slice(0, 9).map(entry => {
                const t = entry.type.toLowerCase()
                const needsWhite = ['fire','fighting','poison','ghost','dragon','dark','rock','steel'].includes(t)
                return (
                  <button
                    key={entry.type}
                    onClick={() => {
                      const match = pokemon.find(p => p.types.includes(entry.type))
                      if (match) onSelectPokemon(match.rank)
                    }}
                    className={`rounded-full px-3 py-1.5 text-sm font-semibold shadow-sm transition hover:brightness-110 border ${needsWhite ? 'text-white' : 'text-black'}`}
                    style={{ backgroundColor: `var(--type-${t})`, borderColor: `var(--type-${t})` }}
                  >
                    {entry.type}
                  </button>
                )
              })}
            </div>
          </div>
        </aside>
      </div>
    )
  }

  if (phaseId === 'trends') {
    return (
      <TrendsPhase
        trendLeaders={trendLeaders}
        onSelectPokemon={onSelectPokemon}
        regencySpotlight={regencySpotlight}
      />
    )
  }

  return <p className="text-muted">Select a phase to view its popup spread.</p>
}

interface MetricCardProps {
  label: string
  value: string
  tooltip?: string
}

function MetricCard({ label, value, tooltip }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-white/60 bg-white/50 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/10">
      {tooltip ? (
        <Tooltip content={tooltip} variant="stat">
          <p className="text-[0.65rem] uppercase tracking-wide text-muted inline-flex items-center gap-1 cursor-help">
            <span className="border-b border-dotted border-current/40">{label}</span>
            <HelpCircle className="h-3.5 w-3.5" />
          </p>
        </Tooltip>
      ) : (
        <p className="text-[0.65rem] uppercase tracking-wide text-muted">{label}</p>
      )}
      <p className="text-base font-semibold text-text mt-1">{value}</p>
    </div>
  )
}

function TrendSparkline({ series, className = '' }: { series: number[]; className?: string }) {
  if (!series || series.length === 0) return null;
  const w = 120, h = 32, pad = 4;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = Math.max(1, max - min);
  const points = series.map((v, i) => {
    const x = pad + (i * (w - pad * 2)) / Math.max(1, series.length - 1);
    const y = h - pad - ((v - min) * (h - pad * 2)) / range;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={w} height={h} className={className} aria-label="Momentum sparkline">
      <defs>
        <linearGradient id="spark" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke="url(#spark)"
        strokeWidth="2"
        points={points}
      />
    </svg>
  );
}

interface OverlaySeries {
  key: string
  name: string
  series: number[]
  color: string
}

function OverlayMultiTrendChart({ series, highlightKeys = [], className = '' }: { series: OverlaySeries[]; highlightKeys?: string[]; className?: string }) {
  const w = 100
  const h = 100
  const pad = 8
  const hasData = series && series.length > 0 && series.every(s => s.series && s.series.length > 0)
  if (!hasData) {
    return (
      <div className={`flex h-32 items-center justify-center text-xs text-muted ${className}`}>
        No overlays yet
      </div>
    )
  }

  const allValues = series.flatMap(s => s.series)
  const min = Math.min(...allValues)
  const max = Math.max(...allValues)
  const range = Math.max(1, max - min)
  const maxLen = Math.max(...series.map(s => s.series.length))

  const yAt = (v: number) => pad + (h - pad * 2) - ((v - min) * (h - pad * 2)) / range
  const xAt = (idx: number) => pad + (idx * (w - pad * 2)) / Math.max(1, maxLen - 1)

  // Build cached points for hover detection
  const highlightSet = new Set(highlightKeys)
  const pointIndex: Array<{ x: number; y: number; value: number; label: string; color: string; i: number }> = []
  series.forEach(s => {
    if (!highlightSet.size || highlightSet.has(s.key)) {
      s.series.forEach((v, i) => {
        pointIndex.push({ x: xAt(i), y: yAt(v), value: v, label: s.name, color: s.color, i })
      })
    }
  })

  // Compute x labels (years) based on maxLen
  const nowYear = new Date().getFullYear()
  const startYear = nowYear - maxLen
  const years = Array.from({ length: maxLen }, (_, i) => (startYear + i))

  // Hover state
  const [hover, setHover] = useState<{
    x: number
    y: number
    value: number
    label: string
    color: string
    year: number
  } | null>(null)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const cx = ((e.clientX - rect.left) / rect.width) * w
    const cy = ((e.clientY - rect.top) / rect.height) * h
    // find nearest point by euclidean distance in chart space
    let best: any = null
    let bestD = Number.MAX_VALUE
    for (const p of pointIndex) {
      const dx = p.x - cx
      const dy = p.y - cy
      const d = dx * dx + dy * dy
      if (d < bestD) { bestD = d; best = p }
    }
    if (!best) return
    const left = Math.max(8, Math.min(rect.width - 220, (best.x / w) * rect.width + 8))
    const top = Math.max(8, Math.min(rect.height - 8, (best.y / h) * rect.height - 12))
    setHover({ x: left, y: top, value: best.value, label: best.label, color: best.color, year: years[best.i] })
  }
  const handleLeave = () => setHover(null)

  return (
    <div ref={containerRef} onMouseMove={handleMove} onMouseLeave={handleLeave} className={`relative ${className}`}>
      <svg viewBox={`0 0 ${w} ${h}`} className="absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-label="Momentum overlay chart">
        {/* gridlines */}
        <g stroke="#d1d5db" strokeWidth="0.8">
          {/* Y axis lines: min, mid, max */}
          <line x1={pad} y1={yAt(min)} x2={w - pad} y2={yAt(min)} />
          <line x1={pad} y1={yAt(min + range / 2)} x2={w - pad} y2={yAt(min + range / 2)} />
          <line x1={pad} y1={yAt(max)} x2={w - pad} y2={yAt(max)} />
          {/* X axis ticks */}
          {years.map((_, i) => (
            <line key={`vx-${i}`} x1={xAt(i)} y1={h - pad} x2={xAt(i)} y2={h - pad - 2} />
          ))}
        </g>
        {/* Background series (non-highlight) */}
        {series.filter(s => !highlightSet.size || !highlightSet.has(s.key)).map(s => {
          const d = s.series.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i)} ${yAt(v)}`).join(' ')
          return <path key={`bg-${s.key}`} d={d} fill="none" stroke="#cbd5e1" strokeWidth={0.8} opacity={0.5} />
        })}
        {/* Highlighted series */}
        {series.filter(s => !highlightSet.size || highlightSet.has(s.key)).map(s => {
          const d = s.series.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i)} ${yAt(v)}`).join(' ')
          return (
            <g key={`fg-${s.key}`}>
              <path d={d} fill="none" stroke={s.color} strokeWidth={1.6} opacity={0.95} />
              {s.series.map((v, i) => (
                <circle key={`${s.key}-${i}`} cx={xAt(i)} cy={yAt(v)} r={1.2} fill={s.color} />
              ))}
            </g>
          )
        })}
        {/* Axes labels */}
        <g fontSize="3.2" fontWeight="500">
          {/* Background rectangles for better readability - responsive to dark mode */}
          <rect x={pad - 2} y={yAt(max) - 4} width="28" height="5" fill="var(--chart-bg)" fillOpacity="0.9" rx="1" />
          <rect x={pad - 2} y={yAt(min + range / 2) - 4} width="28" height="5" fill="var(--chart-bg)" fillOpacity="0.9" rx="1" />
          <rect x={pad - 2} y={yAt(min) - 4} width="28" height="5" fill="var(--chart-bg)" fillOpacity="0.9" rx="1" />
          
          <text x={pad + 2} y={yAt(max) - 0.5} textAnchor="start" fill="var(--chart-text)">max {max}</text>
          <text x={pad + 2} y={yAt(min + range / 2) - 0.5} textAnchor="start" fill="var(--chart-text)">mid {Math.round(min + range / 2)}</text>
          <text x={pad + 2} y={yAt(min) - 0.5} textAnchor="start" fill="var(--chart-text)">min {min}</text>
        </g>
        {/* X labels */}
        <g fontSize="3.2" fill="var(--chart-text)" fontWeight="500">
          {years.map((yr, i) => (
            <text key={`xl-${i}`} x={xAt(i)} y={h - 1.5} textAnchor="middle">{yr}</text>
          ))}
        </g>
      </svg>
      {hover && (
        <div className="pointer-events-none absolute z-50 rounded-md bg-slate-900 text-white text-xs px-2 py-1 shadow" style={{ left: hover.x, top: hover.y }}>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: hover.color }} />
            <span className="font-semibold">{hover.label}</span>
          </div>
          <div className="mt-0.5">Year {hover.year} • hype {hover.value}</div>
        </div>
      )}
    </div>
  )
}

function TrendsPhase({
  trendLeaders,
  onSelectPokemon,
  regencySpotlight
}: {
  trendLeaders: Array<PopularPokemon & { delta: number; latest: number }>
  onSelectPokemon: (rank: number) => void
  regencySpotlight: { totalPeers: number; regionalAverage: number; region: string } | null
}) {
  // Left scroll view with dynamic loading and in-view tracking for overlay chart
  const [loadedCount, setLoadedCount] = useState(21)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const listItemRefs = useRef<Map<number, Element>>(new Map())
  const visibleSetRef = useRef<Set<number>>(new Set())
  const [visibleRanks, setVisibleRanks] = useState<number[]>([])
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const refCallbacks = useRef<Map<number, (el: Element | null) => void>>(new Map())

  // Observe list items in the scroll container
  useEffect(() => {
    const root = scrollContainerRef.current
    if (!root) return
    const io = new IntersectionObserver((entries) => {
      let changed = false
      entries.forEach((entry) => {
        const rankAttr = (entry.target as HTMLElement).getAttribute('data-rank')
        const rank = rankAttr ? parseInt(rankAttr, 10) : NaN
        if (!rank || Number.isNaN(rank)) return
        if (entry.isIntersecting) {
          if (!visibleSetRef.current.has(rank)) {
            visibleSetRef.current.add(rank)
            changed = true
          }
        } else {
          if (visibleSetRef.current.delete(rank)) {
            changed = true
          }
        }
      })
      if (changed) {
        setVisibleRanks(Array.from(visibleSetRef.current).sort((a, b) => a - b))
      }
    }, { root, threshold: 0.6 })

    // Observe all current list items
    listItemRefs.current.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [loadedCount])

  // Infinite-like loading as user scrolls to bottom of the list
  useEffect(() => {
    const root = scrollContainerRef.current
    const sentinel = sentinelRef.current
    if (!root || !sentinel) return
    const io = new IntersectionObserver((entries) => {
      const entry = entries[0]
      if (entry && entry.isIntersecting) {
        setLoadedCount((c) => Math.min(c + 21, trendLeaders.length))
      }
    }, { root, threshold: 1.0 })
    io.observe(sentinel)
    return () => io.disconnect()
  }, [trendLeaders.length])

  const getRowRefCallback = (rank: number) => {
    const existing = refCallbacks.current.get(rank)
    if (existing) return existing
    const cb = (el: Element | null) => {
      if (!el) {
        listItemRefs.current.delete(rank)
        visibleSetRef.current.delete(rank)
        // Do not set state here; IntersectionObserver will update visibility state
      } else {
        listItemRefs.current.set(rank, el)
      }
    }
    refCallbacks.current.set(rank, cb)
    return cb
  }

  const palette = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6']
  const colorForRank = (rank: number) => palette[(rank - 1) % palette.length]

  const visibleSeries = trendLeaders
    .filter(p => visibleRanks.includes(p.rank))
    .sort((a, b) => a.rank - b.rank)
    .map(p => ({ key: String(p.rank), name: `#${p.rank} ${p.name}`, series: p.trend, color: colorForRank(p.rank) }))

  // Include ±5 rank neighbors for each visible Pokémon when available
  const byRank = useRef<Map<number, PopularPokemon & { delta: number; latest: number }>>(new Map())
  if (byRank.current.size === 0) {
    trendLeaders.forEach(p => byRank.current.set(p.rank, p))
  }
  const neighborSeriesMap = new Map<string, { key: string; name: string; series: number[]; color: string }>()
  visibleSeries.forEach(v => {
    const rank = parseInt(v.key, 10)
    ;[-5, 5].forEach(off => {
      const neighbor = byRank.current.get(rank + off)
      if (neighbor) {
        const key = `${neighbor.rank}:offset`
        if (!neighborSeriesMap.has(key)) {
          neighborSeriesMap.set(key, {
            key,
            name: `#${neighbor.rank} ${neighbor.name} (±5)`,
            series: neighbor.trend,
            color: '#94a3b8' // slate-400 for neighbor lines
          })
        }
      }
    })
  })
  const extendedSeries = [...visibleSeries, ...Array.from(neighborSeriesMap.values())]

  const rows = trendLeaders.slice(0, loadedCount)

  // Build ALL 50 series for the right chart (used as background), and compute visible keys for coloring
  const allSeries: OverlaySeries[] = trendLeaders
    .sort((a, b) => a.rank - b.rank)
    .map(p => ({ key: String(p.rank), name: `#${p.rank} ${p.name}`, series: p.trend, color: colorForRank(p.rank) }))

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr,1fr]">
      <div className="rounded-3xl border border-border bg-white/70 p-6 shadow-inner dark:bg-slate-900/70">
        <h3 className="text-lg font-semibold text-text">Momentum tracker</h3>
        <p className="text-sm text-muted mt-2">These Pokémon posted the largest score gains over the time window captured in this volume.</p>

        {/* Scroll list height locked for aligned chart */}
        <div ref={scrollContainerRef} className="mt-6 h-[448px] overflow-y-auto rounded-2xl border border-border bg-white/60 p-2 dark:bg-slate-900/50">
          <div className="space-y-2">
            {rows.map(poke => (
              <button
                key={poke.rank}
                data-rank={poke.rank}
                ref={getRowRefCallback(poke.rank)}
                onClick={() => onSelectPokemon(poke.rank)}
                className="group flex h-16 w-full items-center justify-between rounded-xl border border-border bg-white/80 px-4 text-left shadow-sm transition hover:border-poke-blue hover:bg-white dark:bg-slate-900/60"
              >
                <div className="flex items-center gap-3">
                  <PortraitIcon id={poke.nationalNumber} name={poke.name} size={32} />
                  <div>
                    <p className="text-sm font-semibold text-text">#{poke.rank} {poke.name}</p>
                    <p className="text-xs text-muted">Δ {poke.delta >= 0 ? '+' : ''}{poke.delta} • score {poke.latest}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-poke-blue opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100">
                    Inspect <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </button>
            ))}
            {loadedCount < trendLeaders.length && (
              <div ref={sentinelRef} className="h-8 w-full" />
            )}
          </div>
        </div>
      </div>

      <aside className="space-y-4 self-start">
        {/* Overlay chart: same height as list, highlights only visible rows; others are light background */}
        <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-text">Momentum overlays</h3>
          <OverlayMultiTrendChart series={allSeries} highlightKeys={visibleSeries.map(v => v.key)} className="h-[448px] w-full mt-2" />
        </div>
        
        {/* Removed: Host a watchlist panel */}
      </aside>
      {/* Regional buzz footer centered under both columns */}
      <div className="lg:col-span-2 text-center text-xs text-indigo-900/80 dark:text-indigo-100/80">
        {regencySpotlight ? (
          <p className="mt-1">
            {regencySpotlight.region} currently fields {regencySpotlight.totalPeers} entries with an average score of {regencySpotlight.regionalAverage}. Keep an eye on cross-regional exhibitions to see if momentum holds.
          </p>
        ) : (
          <p className="mt-1">Select a Pokémon to overlay its regional context here.</p>
        )}
      </div>
    </div>
  )
}
