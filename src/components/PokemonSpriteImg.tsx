'use client'

import { useMemo, type CSSProperties } from 'react'

const SPRITES = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon'

/**
 * Image sources for a Pokémon's small picture, in the order to try them. Newer forms (e.g. the
 * Legends Z-A Megas such as Zygarde Mega, #10301) have no small sprite yet but do have HOME and
 * official artwork, so the chain falls through to those before the placeholder.
 */
export function pokemonSpriteSources(id: number, first?: string | null): string[] {
  const list = [
    first,
    `${SPRITES}/${id}.png`,
    `${SPRITES}/other/home/${id}.png`,
    `${SPRITES}/other/official-artwork/${id}.png`,
    '/placeholder-pokemon.png',
  ]
  return list.filter((s, i): s is string => !!s && list.indexOf(s) === i)
}

/** Small Pokémon picture that falls back through other artwork instead of showing a broken image. */
export default function PokemonSpriteImg({
  id,
  alt,
  className,
  width,
  height,
  first,
  style,
}: {
  id: number
  alt: string
  className?: string
  width?: number
  height?: number
  /** Preferred source tried before the small sprite (e.g. an animated Showdown sprite). */
  first?: string | null
  style?: CSSProperties
}) {
  const sources = useMemo(() => pokemonSpriteSources(id, first), [id, first])
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={sources[0]}
      src={sources[0]}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={style}
      loading="lazy"
      decoding="async"
      onError={(e) => {
        const img = e.currentTarget
        const next = Number(img.dataset.fallbackIndex || '0') + 1
        if (next < sources.length) {
          img.dataset.fallbackIndex = String(next)
          img.src = sources[next]
        }
      }}
    />
  )
}
