'use client'

import { useState } from 'react'
import { GYM_CHAMPIONS } from '@/lib/gym_champions'

export default function BattleLiteApp() {
  const [selectedChampionId, setSelectedChampionId] = useState<string>('')

  return (
    <div className="mx-auto max-w-3xl space-y-6 rounded-2xl border border-border bg-card p-6 shadow-lg">
      <header className="space-y-1 text-center">
        <h1 className="text-2xl font-bold text-text">Battle Lite Practice</h1>
        <p className="text-sm text-muted-foreground">
          Quick offline simulation for testing teams. Select a champion to preview a matchup.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Select opponent</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {GYM_CHAMPIONS.map((champion) => (
            <button
              key={champion.id}
              onClick={() => setSelectedChampionId(champion.id)}
              className={`rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                selectedChampionId === champion.id
                  ? 'border-poke-blue bg-poke-blue/10 text-poke-blue'
                  : 'border-border bg-surface hover:bg-muted'
              }`}
            >
              <span className="block text-base font-semibold text-text">{champion.name}</span>
              <span className="block text-xs text-muted-foreground">{champion.generation ?? 'Champion'}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-dashed border-border bg-muted/50 p-4 text-sm text-muted-foreground">
        {selectedChampionId ? (
          <p>
            Battle simulation has been simplified while we rebuild the real-time system. Use multiplayer lobbies for the full experience.
          </p>
        ) : (
          <p>
            Pick a champion to view a quick summary of their team strengths.
          </p>
        )}
      </section>
    </div>
  )
}
