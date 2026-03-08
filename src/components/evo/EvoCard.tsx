"use client";

import React from 'react';
import type { Species } from '@/lib/evo/types';
import Image from 'next/image';
import { formatPokemonName } from '@/lib/utils';

type Props = {
  species: Species;
  onClick?: () => void;
  tabIndex?: number;
};

const BLUR_PLACEHOLDER =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==";

function EvoCard({ species, onClick, tabIndex }: Props) {
  const sprite = species.sprite || '/placeholder-pokemon.png';

  return (
    <button
      type="button"
      onClick={onClick}
      data-evo-id={species.id}
      tabIndex={tabIndex ?? 0}
      className="group relative w-48 rounded-md border p-3 bg-white/60 dark:bg-gray-900/40 backdrop-blur-md shadow-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-500 transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98] hover:-translate-y-0.5 hover:shadow-md"
      aria-label={`${species.name}, Gen ${species.gen}, Types ${species.types.join(' and ')}`}
    >
      <div className="flex items-center gap-2">
        <Image
          src={sprite}
          alt={formatPokemonName(species.name)}
          width={80}
          height={80}
          loading="lazy"
          decoding="async"
          priority={false}
          placeholder="blur"
          blurDataURL={BLUR_PLACEHOLDER}
          className="w-20 h-20 rounded bg-white/50 dark:bg-black/40"
        />
        <div>
          <div className="font-medium leading-tight">{formatPokemonName(species.name)}</div>
          <div className="mt-1 flex flex-wrap gap-1">
            {species.types.map((t) => (
              <span key={t} className="text-[10px] rounded-full border px-2 py-0.5 bg-gray-50 dark:bg-gray-800" aria-label={`Type ${t}`}>
                {typeIcon(t)} <span className="ml-1 align-middle">{t}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
      <span className="absolute right-1 top-1 text-[10px] rounded bg-blue-600 text-white px-1.5 py-0.5">Gen {species.gen}</span>
    </button>
  );
}

export default React.memo(EvoCard);

function typeIcon(t: string) {
  const m: Record<string, string> = {
    Electric: '⚡', Fire: '🔥', Water: '💧', Grass: '🌿', Ice: '❄️',
    Bug: '🐛', Rock: '🪨', Ground: '⛰️', Flying: '🕊️', Psychic: '🔮',
    Ghost: '👻', Dragon: '🐉', Dark: '🌑', Steel: '⚙️', Fairy: '✨', Normal: '🔘',
  };
  return m[t] || '⬡';
}
