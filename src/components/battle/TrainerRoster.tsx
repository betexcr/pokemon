'use client'

import { useMemo, useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { getTrainerSpriteUrl } from '@/lib/trainerSprites'
import type { Champion } from '@/lib/gym_champions'

interface TrainerRosterProps {
  champions: Champion[]
  selectedChampionId?: string
  onChampionSelect?: (championId: string) => void
  generationFilter?: string
  onGenerationFilterChange?: (value: string) => void
  showTooltip?: string | null
  onTrainerHover?: (championId: string | null) => void
  isMobile?: boolean
}

function TrainerTooltip({ champion, anchorEl }: { champion: Champion; anchorEl: HTMLElement }) {
  const tipRef = useRef<HTMLDivElement | null>(null)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)

  useEffect(() => {
    const compute = () => {
      const anchor = anchorEl.getBoundingClientRect()
      const tip = tipRef.current
      if (!tip) return

      const tipRect = tip.getBoundingClientRect()
      const margin = 10
      const vw = window.innerWidth
      const vh = window.innerHeight

      let top = anchor.top - tipRect.height - margin
      let left = anchor.left + anchor.width / 2 - tipRect.width / 2

      if (top < margin) {
        top = anchor.bottom + margin
      }
      left = Math.max(margin, Math.min(left, vw - tipRect.width - margin))
      top = Math.max(margin, Math.min(top, vh - tipRect.height - margin))

      setCoords({ top, left })
    }

    compute()
    window.addEventListener('scroll', compute, true)
    window.addEventListener('resize', compute)
    return () => {
      window.removeEventListener('scroll', compute, true)
      window.removeEventListener('resize', compute)
    }
  }, [anchorEl])

  return createPortal(
    <div
      ref={tipRef}
      className={`fixed z-[2147483647] w-72 rounded-xl border border-border bg-surface p-4 text-sm text-text shadow-xl backdrop-blur-sm transition-opacity duration-150 ${coords ? 'opacity-100' : 'opacity-0'}`}
      style={coords ? { top: coords.top, left: coords.left } : { top: -9999, left: -9999 }}
    >
      {champion.description && (
        <p className="mb-3 text-xs leading-relaxed text-muted">
          {champion.description}
        </p>
      )}
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">
          {champion.team.name}
        </span>
      </div>
      <ul className="space-y-0.5">
        {champion.team.slots.map((slot, i) => (
          <li key={i} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-text">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${slot.id}.png`}
                alt={slot.name || `#${slot.id}`}
                width={24}
                height={24}
                className="pixelated -my-1"
                style={{ imageRendering: 'pixelated' }}
              />
              {slot.name || `#${slot.id}`}
            </span>
            <span className="text-muted">Lv.&nbsp;{slot.level}</span>
          </li>
        ))}
      </ul>
    </div>,
    document.body,
  )
}

export default function TrainerRoster({
  champions,
  selectedChampionId,
  onChampionSelect,
  generationFilter = '',
  onGenerationFilterChange,
  showTooltip,
  onTrainerHover,
  isMobile,
}: TrainerRosterProps) {
  const filteredChampions = useMemo(() => {
    if (!generationFilter) return champions
    return champions.filter((champion) => {
      return champion.generation.toLowerCase().includes(generationFilter.toLowerCase())
    })
  }, [champions, generationFilter])

  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const anchorRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const setAnchorRef = useCallback((id: string, el: HTMLButtonElement | null) => {
    if (el) anchorRefs.current.set(id, el)
    else anchorRefs.current.delete(id)
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-muted-foreground" htmlFor="champion-generation-filter">
          Filter by generation
        </label>
        <select
          id="champion-generation-filter"
          value={generationFilter}
          onChange={(event) => onGenerationFilterChange?.(event.target.value)}
          className="h-9 rounded-lg border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-poke-blue"
        >
          <option value="">All generations</option>
          <option value="kanto">Kanto</option>
          <option value="johto">Johto</option>
          <option value="hoenn">Hoenn</option>
          <option value="sinnoh">Sinnoh</option>
          <option value="unova">Unova</option>
          <option value="kalos">Kalos</option>
          <option value="alola">Alola</option>
          <option value="galar">Galar</option>
          <option value="paldea">Paldea</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {filteredChampions.map((champion) => {
          const isSelected = champion.id === selectedChampionId
          const spriteUrl = getTrainerSpriteUrl?.(champion)
          const isTooltipVisible = showTooltip === champion.id && !isMobile

          return (
            <button
              key={champion.id}
              ref={(el) => setAnchorRef(champion.id, el)}
              type="button"
              onClick={() => onChampionSelect?.(champion.id)}
              onMouseEnter={() => onTrainerHover?.(champion.id)}
              onMouseLeave={() => onTrainerHover?.(null)}
              className={`group relative flex flex-col items-center justify-center rounded-xl border border-border bg-card p-3 transition-all duration-150 hover:-translate-y-1 hover:shadow-lg ${
                isSelected ? 'ring-2 ring-poke-blue' : ''
              }`}
            >
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-muted">
                {spriteUrl ? (
                  <img src={spriteUrl} alt={champion.name} className="h-full w-full object-contain" />
                ) : (
                  <span className="text-2xl">⚔️</span>
                )}
              </div>
              <span className="mt-2 text-center text-sm font-medium text-text leading-tight">
                {champion.name}
              </span>
              {mounted && isTooltipVisible && anchorRefs.current.get(champion.id) && (
                <TrainerTooltip
                  champion={champion}
                  anchorEl={anchorRefs.current.get(champion.id)!}
                />
              )}
            </button>
          )
        })}

        {filteredChampions.length === 0 && (
          <div className="col-span-full rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No champions found for this filter.
          </div>
        )}
      </div>
    </div>
  )
}
