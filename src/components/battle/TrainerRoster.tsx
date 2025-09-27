'use client'

import { useMemo } from 'react'
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

          return (
            <button
              key={champion.id}
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
              {showTooltip === champion.id && !isMobile && (
                <span className="absolute bottom-full mb-2 w-40 rounded-lg bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg">
                  Tap again to challenge {champion.name}
                </span>
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
