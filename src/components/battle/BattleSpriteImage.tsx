'use client'

import Image from 'next/image'
import { useMemo } from 'react'
import { formatPokemonName, getBattleSpriteSources } from '@/lib/utils'

interface BattleSpriteImageProps {
  species: string | null | undefined
  dexId?: number | null
  shiny?: boolean
  size?: number
  className?: string
}

/** Small battle-screen sprite (switch lists): the team builder's animated sprite, with static fallbacks. */
export function BattleSpriteImage({ species, dexId = null, shiny = false, size = 48, className = 'object-contain' }: BattleSpriteImageProps) {
  const sources = useMemo(() => getBattleSpriteSources(species, dexId, shiny), [species, dexId, shiny])
  if (!species) return null
  return (
    <Image
      key={sources[0]}
      src={sources[0]}
      alt={formatPokemonName(species)}
      width={size}
      height={size}
      className={className}
      unoptimized
      onError={(event) => {
        const target = event.currentTarget
        const fallbackIndex = Number(target.dataset.fallbackIndex || '0') + 1
        if (fallbackIndex < sources.length) {
          target.dataset.fallbackIndex = String(fallbackIndex)
          target.src = sources[fallbackIndex]
        }
      }}
    />
  )
}
