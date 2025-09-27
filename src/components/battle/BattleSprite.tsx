'use client'

import { forwardRef, useImperativeHandle } from 'react'
import Image from 'next/image'
import { getPokemonBattleImageWithFallback, formatPokemonName, getPokemonIdFromSpecies } from '@/lib/utils'

export interface BattleSpriteRef {
  shake?: () => void
}

interface BattleSpriteProps {
  species: string
  level: number
  hp: { cur: number; max: number }
  status?: string | null
  volatiles?: string[] | null
  types?: string[]
  side?: 'player' | 'opponent'
  field?: Record<string, unknown>
  className?: string
  spriteMode?: 'animated' | 'static'
}

export const BattleSprite = forwardRef<BattleSpriteRef, BattleSpriteProps>(function BattleSprite(
  { species, level, hp, status, types = [], side = 'player', className = '', spriteMode = 'static' },
  ref
) {
  useImperativeHandle(ref, () => ({ shake: () => {} }), [])

  const speciesId = getPokemonIdFromSpecies(species) ?? 1
  const sprite = getPokemonBattleImageWithFallback(speciesId, side === 'player' ? 'back' : 'front', spriteMode === 'animated')

  const hpPercentage = Math.max(0, Math.min(100, Math.round((hp.cur / Math.max(1, hp.max)) * 100)))

  return (
    <div className={`flex w-full max-w-xs flex-col items-center gap-3 rounded-2xl border border-border bg-card/80 p-4 shadow-lg ${className}`}>
      <div className="relative h-28 w-28 overflow-hidden rounded-xl bg-gradient-to-b from-white/10 to-black/20">
        <Image
          src={sprite.primary}
          alt={formatPokemonName(species)}
          width={160}
          height={160}
          className="h-full w-full object-contain"
          onError={(event) => {
            const target = event.currentTarget
            if (target.src !== sprite.fallback) {
              target.src = sprite.fallback
            }
          }}
        />
      </div>

      <div className="w-full text-center">
        <div className="flex items-center justify-between text-sm font-semibold text-text">
          <span className="capitalize">{formatPokemonName(species)}</span>
          <span className="text-muted-foreground">Lv. {level}</span>
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all duration-300 ${hpPercentage > 50 ? 'bg-emerald-500' : hpPercentage > 25 ? 'bg-amber-500' : 'bg-red-500'}`}
            style={{ width: `${hpPercentage}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {hp.cur} / {hp.max} HP · {types.join(' / ') || 'Unknown type'}
        </p>
        {status && (
          <span className="mt-2 inline-flex items-center rounded-full border border-yellow-500/60 bg-yellow-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-yellow-500">
            {status}
          </span>
        )}
      </div>
    </div>
  )
})

BattleSprite.displayName = 'BattleSprite'
