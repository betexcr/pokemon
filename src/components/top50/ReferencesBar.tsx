'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Sparkles } from 'lucide-react'
import TypeBadge from '@/components/TypeBadge'
import type { PopularPokemon } from '@/data/top50Pokemon'

interface ReferencesBarProps {
  pokemon: PopularPokemon[]
  selectedRank: number
  onSelectRank: (rank: number) => void
}

export default function ReferencesBar({ pokemon, selectedRank, onSelectRank }: ReferencesBarProps) {
  const [query, setQuery] = useState('')
  const [generationFilter, setGenerationFilter] = useState<number | null>(null)

  const filteredPokemon = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return pokemon.filter(poke => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        poke.name.toLowerCase().includes(normalizedQuery) ||
        poke.rank.toString().includes(normalizedQuery)
      const matchesGeneration = generationFilter === null || poke.generation === generationFilter
      return matchesQuery && matchesGeneration
    })
  }, [pokemon, query, generationFilter])

  const generations = useMemo(() => {
    return Array.from(new Set(pokemon.map(poke => poke.generation))).sort((a, b) => a - b)
  }, [pokemon])

  return (
    <section className="rounded-3xl border border-border bg-white/80 p-4 shadow-lg shadow-black/5 backdrop-blur dark:bg-slate-900/80">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted">Reference bar</p>
          <h2 className="text-lg font-bold text-text flex items-center gap-2">
            Quick jump
            <Sparkles className="h-4 w-4 text-poke-yellow" />
          </h2>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search rank or name"
              className="h-10 w-full rounded-full border border-border bg-white/70 pl-10 pr-4 text-sm outline-none transition focus:border-poke-blue focus:ring-2 focus:ring-poke-blue/40 dark:bg-slate-900/70"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setGenerationFilter(null)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                generationFilter === null
                  ? 'border-poke-blue bg-poke-blue/10 text-poke-blue'
                  : 'border-border bg-white/70 text-muted hover:text-text dark:bg-slate-900/70'
              }`}
            >
              All gens
            </button>
            {generations.map(gen => (
              <button
                key={gen}
                onClick={() => setGenerationFilter(curr => (curr === gen ? null : gen))}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  generationFilter === gen
                    ? 'border-poke-blue bg-poke-blue/10 text-poke-blue'
                    : 'border-border bg-white/70 text-muted hover:text-text dark:bg-slate-900/70'
                }`}
              >
                Gen {gen}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" aria-hidden />

      <div className="mt-4 flex items-center justify-between text-xs text-muted">
        <p>Showing {filteredPokemon.length} of {pokemon.length} entries</p>
        <p>Tap to focus a spread</p>
      </div>

      <div className="mt-3 overflow-x-auto pb-2">
        <div className="flex gap-2">
          {filteredPokemon.map(poke => {
            const isSelected = poke.rank === selectedRank
            return (
              <motion.button
                key={poke.rank}
                onClick={() => onSelectRank(poke.rank)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                className={`group relative min-w-[16rem] min-h-[5.75rem] overflow-hidden rounded-2xl border px-3 py-3 text-left transition ${
                  isSelected
                    ? 'border-poke-blue bg-poke-blue/10 shadow-md shadow-poke-blue/20'
                    : 'border-border bg-white/70 hover:border-poke-blue/60 hover:bg-white dark:bg-slate-900/70'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="top50-active"
                    className="absolute inset-1 rounded-xl bg-gradient-to-br from-poke-blue/20 to-poke-blue/5"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <div className="relative z-10 flex items-center gap-3">
                  <div className="shrink-0 w-12 h-12 rounded-md border border-border bg-white/60 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                    {(() => {
                      const id4 = String(poke.nationalNumber).padStart(4, '0')
                      const localSrc = `/assets/pmd/${id4}/portrait/Normal.png`
                      const remoteSrc = `https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/${id4}/Normal.png`
                      const fallback = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${poke.nationalNumber}.png`
                      const candidates = [localSrc, remoteSrc]
                      return (
                        <img
                          src={candidates[0]}
                          alt={poke.name}
                          width={44}
                          height={44}
                          loading="lazy"
                          decoding="async"
                          className="w-11 h-11 object-contain"
                          data-index={0}
                          style={{ imageRendering: 'pixelated' as any }}
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
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.7rem] uppercase tracking-wide text-muted">Rank {poke.rank}</p>
                    <p className="text-[13px] leading-snug font-semibold text-text break-normal whitespace-normal" title={poke.name}>{poke.name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold text-poke-blue">{poke.popularityScore}</p>
                    <div className="mt-0.5 flex gap-1 justify-end items-center flex-wrap">
                      {poke.types.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 text-[10px] rounded font-medium border transition-all duration-200 whitespace-nowrap inline-flex items-center shrink-0 normal-case"
                          style={{
                            backgroundColor: `var(--type-${t.toLowerCase()})`,
                            color: 'white',
                            borderColor: `var(--type-${t.toLowerCase()})`
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
