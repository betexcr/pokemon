'use client'

import React from 'react'
import type { ContestFact } from '@/data/contests/funFacts'

const ALL_TAGS: ContestFact['tags'] = ['general','gen3','gen4','bdsp','combo','ribbon','tip','ui']

export function FactFilters({
  q, setQ, activeTags, setActiveTags, onClear,
}: {
  q: string
  setQ: (v: string) => void
  activeTags: string[]
  setActiveTags: (tags: string[]) => void
  onClear: () => void
}) {
  const toggle = (t: string) =>
    activeTags.includes(t) ? setActiveTags(activeTags.filter(x => x !== t)) : setActiveTags([...activeTags, t])

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex-1 w-full">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search fun facts…"
          className="
            w-full rounded-xl border border-border bg-input-bg text-input-text placeholder-input-placeholder
            px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400
          "
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {ALL_TAGS.map(t => (
          <button
            key={t}
            onClick={() => toggle(t)}
            className={`rounded-full text-xs px-2 py-1 border transition
              ${activeTags.includes(t)
                ? 'border-pink-400 bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-200'
                : 'border-border text-text'
              }`}
          >
            {t}
          </button>
        ))}
        <button
          onClick={onClear}
          className="rounded-full text-xs px-3 py-1 border border-border hover:bg-surface/60"
        >
          Clear
        </button>
      </div>
    </div>
  )
}


