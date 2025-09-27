'use client'

import { useMemo } from 'react'
import { GYM_CHAMPIONS } from '@/lib/gym_champions'
import { getTrainerSpriteUrl } from '@/lib/trainerSprites'

interface AIBattleSceneProps {
  playerTeam: Array<{ id: number; level: number; moves?: string[]; nature?: string }>
  opponentChampionId: string
  viewMode?: 'animated' | 'classic'
}

export function AIBattleScene({ playerTeam, opponentChampionId }: AIBattleSceneProps) {
  const opponent = useMemo(() => GYM_CHAMPIONS.find((champion) => champion.id === opponentChampionId), [opponentChampionId])

  return (
    <div className="relative rounded-2xl border border-border bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 text-white shadow-xl">
      <header className="mb-6 flex flex-col items-center gap-2 text-center">
        <h2 className="text-2xl font-semibold">AI Exhibition Battle</h2>
        <p className="text-sm text-white/70">Practice your moves against iconic champions with instant feedback.</p>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/70">Your Squad</h3>
          <ol className="space-y-2 text-sm">
            {playerTeam.length === 0 && <li className="text-white/60">Team not loaded</li>}
            {playerTeam.map((member, index) => (
              <li key={`${member.id}-${index}`} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                <span>#{member.id}</span>
                <span className="text-white/70">Lv. {member.level}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/70">Opponent</h3>
          {opponent ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-white/20 bg-white/10">
                <img
                  src={getTrainerSpriteUrl(opponent)}
                  alt={opponent.name}
                  className="h-full w-full object-contain"
                  onError={(event) => {
                    const target = event.currentTarget
                    target.src = '/placeholder-pokemon.png'
                    target.className = 'h-full w-full object-contain'
                  }}
                />
              </div>
              <div>
                <p className="text-lg font-semibold">{opponent.name}</p>
                <p className="text-xs uppercase tracking-wide text-white/60">{opponent.generation ?? 'Champion'}</p>
              </div>
              <div className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-left text-white/70">
                <p className="font-medium text-white">Opponent Highlights</p>
                <ul className="mt-2 list-disc space-y-1 pl-4">
                  <li>Specialized roster curated for teaching type matchups.</li>
                  <li>Simulated turns resolve instantly to keep the pace brisk.</li>
                  <li>Great for experimenting with new move sets before multiplayer.</li>
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-white/60">Select a champion on the previous screen to preview their team.</p>
          )}
        </div>
      </section>

      <footer className="mt-6 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
        Tip: Finish selecting your move, then watch the AI respond. Turn order follows move priority, then Speed—just like a standard match.
      </footer>
    </div>
  )
}
