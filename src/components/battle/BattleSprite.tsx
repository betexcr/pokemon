'use client'

import { forwardRef, useMemo } from 'react'
import Image from 'next/image'
import { formatPokemonName, getBattleSpriteSources } from '@/lib/utils'
import { statusInfo } from '@/lib/battle-display'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface BattleSpriteRef {}

interface BattleSpriteProps {
  species: string
  level: number
  hp: { cur: number; max: number }
  status?: string | null
  types?: string[]
  side?: 'player' | 'opponent'
  className?: string
  shiny?: boolean
  /** National dex / form ID when known — improves PokeAPI sprite fallbacks. */
  dexId?: number | null
  /** Confused (a volatile condition shown next to the main status). */
  confused?: boolean
}

export const BattleSprite = forwardRef<BattleSpriteRef, BattleSpriteProps>(function BattleSprite(
  { species, level, hp, status, types = [], side = 'player', className = '', shiny = false, dexId = null, confused = false },
  _ref
) {
  // Animated sprites like the team builder: your Pokémon from the back, the opponent from the front
  const variant: 'front' | 'back' = side === 'player' ? 'back' : 'front'
  const sources = useMemo(() => getBattleSpriteSources(species, dexId, shiny, variant), [species, dexId, shiny, variant])

  const hpPercentage = Math.max(0, Math.min(100, Math.round((hp.cur / Math.max(1, hp.max)) * 100)))
  // Same icons and wording as the battle guide
  const mainStatus = statusInfo(status)
  const confusion = confused ? statusInfo('confused') : null

  return (
    <div className={`flex w-full max-w-xs flex-col items-center gap-3 rounded-2xl border border-border bg-surface/80 p-4 shadow-lg ${className}`}>
      <div className="relative h-28 w-28 overflow-hidden rounded-xl bg-gradient-to-b from-white/10 to-black/20">
        <Image
          // Remount on a new Pokémon so a previous image's fallback position doesn't carry over
          key={sources[0]}
          src={sources[0]}
          alt={formatPokemonName(species)}
          width={160}
          height={160}
          unoptimized
          className="h-full w-full object-contain"
          onError={(event) => {
            const target = event.currentTarget
            const currentIndex = Number(target.dataset.fallbackIndex || '0')
            const nextIndex = currentIndex + 1
            if (nextIndex < sources.length) {
              target.dataset.fallbackIndex = String(nextIndex)
              target.src = sources[nextIndex]
            }
          }}
        />
      </div>

      <div className="w-full text-center">
        <div className="flex items-center justify-between text-sm font-semibold text-text">
          <span className="capitalize" data-testid={`pokemon-name-${side}`}>{formatPokemonName(species)}</span>
          <span className="text-muted">Lv. {level}</span>
        </div>
        <div
          className="mt-2 h-2 w-full rounded-full bg-muted/20"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={Math.max(1, hp.max)}
          aria-valuenow={Math.max(0, Math.min(hp.max, hp.cur))}
          aria-label={`${formatPokemonName(species)} HP`}
        >
          <div
            className={`h-full rounded-full transition-all duration-300 ${hpPercentage > 50 ? 'bg-emerald-500' : hpPercentage > 25 ? 'bg-amber-500' : 'bg-red-500'}`}
            style={{ width: `${hpPercentage}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-muted" data-testid={`hp-bar-${side}`}>
          {hp.cur} / {hp.max} HP · {types.join(' / ') || 'Unknown type'}
        </p>
        {(status || confusion) && (
          <div className="mt-2 flex flex-wrap justify-center gap-1">
            {status && (
              <span
                className="inline-flex items-center gap-1 rounded-full border border-amber-500/50 bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-200"
                data-testid={`status-icon-${status}`}
                title={mainStatus?.effect}
              >
                <span aria-hidden>{mainStatus?.icon ?? '⚠️'}</span>
                {mainStatus?.name ?? status}
              </span>
            )}
            {confusion && (
              <span
                className="inline-flex items-center gap-1 rounded-full border border-purple-500/50 bg-purple-500/10 px-2 py-0.5 text-xs font-semibold text-purple-800 dark:text-purple-200"
                data-testid="status-icon-confused"
                title={confusion.effect}
              >
                <span aria-hidden>{confusion.icon}</span>
                {confusion.name}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
})

BattleSprite.displayName = 'BattleSprite'
