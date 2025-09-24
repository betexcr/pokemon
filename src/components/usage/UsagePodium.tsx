'use client';

import React from 'react';
import { UsageRow } from '@/types/usage';
import { Trophy, Medal, Award } from 'lucide-react';
import LazyImage from '@/components/LazyImage';
import { getPokemonImageUrl, getPokemonFallbackImage } from '@/lib/api';

interface UsagePodiumProps {
  top3: UsageRow[];
}

const PODIUM_HEIGHTS = {
  1: 'h-24', // Gold - tallest
  2: 'h-16', // Silver - medium
  3: 'h-12'  // Bronze - shortest
};

const PODIUM_COLORS = {
  1: 'bg-gradient-to-t from-yellow-400 to-yellow-300 dark:from-yellow-500 dark:to-yellow-400',
  2: 'bg-gradient-to-t from-gray-400 to-gray-300 dark:from-gray-500 dark:to-gray-400',
  3: 'bg-gradient-to-t from-orange-400 to-orange-300 dark:from-orange-500 dark:to-orange-400'
};

const PODIUM_ICONS = {
  1: Trophy,
  2: Medal,
  3: Award
};

export default function UsagePodium({ top3 }: UsagePodiumProps) {
  if (top3.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No data available for podium
      </div>
    );
  }

  const formatUsage = (usage: number) => {
    return `${usage.toFixed(1)}%`;
  };

  const getPokemonAvatar = (pokemon: UsageRow) => {
    return (
      <div className="w-16 h-16 relative">
        <LazyImage
          srcList={[
            getPokemonImageUrl(pokemon.pokemonId, 'default', 'large'),
            getPokemonFallbackImage(pokemon.pokemonId),
            "/placeholder-pokemon.png"
          ]}
          alt={pokemon.pokemonName}
          width={64}
          height={64}
          imgClassName="w-16 h-16 object-contain"
          rootMargin="50px"
          threshold={0.01}
        />
      </div>
    );
  };

  return (
    <div className="flex items-end justify-center gap-4 px-8">
      {/* 2nd Place (Left) */}
      {top3[1] && (
        <div className="flex flex-col items-center">
          <div className="mb-2">
            {getPokemonAvatar(top3[1])}
          </div>
          <div className="text-center mb-2">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {top3[1].pokemonName}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              #{top3[1].rank}
            </div>
          </div>
          <div className={`w-20 ${PODIUM_HEIGHTS[2]} ${PODIUM_COLORS[2]} rounded-t-lg flex flex-col items-center justify-between p-2 shadow-lg`}>
            {React.createElement(PODIUM_ICONS[2], { className: "w-6 h-6 text-white" })}
            <div className="text-white font-bold text-sm">
              {formatUsage(top3[1].usagePercent)}
            </div>
          </div>
        </div>
      )}

      {/* 1st Place (Center) */}
      {top3[0] && (
        <div className="flex flex-col items-center">
          <div className="mb-2">
            {getPokemonAvatar(top3[0])}
          </div>
          <div className="text-center mb-2">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {top3[0].pokemonName}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              #{top3[0].rank}
            </div>
          </div>
          <div className={`w-20 ${PODIUM_HEIGHTS[1]} ${PODIUM_COLORS[1]} rounded-t-lg flex flex-col items-center justify-between p-2 shadow-lg`}>
            {React.createElement(PODIUM_ICONS[1], { className: "w-6 h-6 text-white" })}
            <div className="text-white font-bold text-sm">
              {formatUsage(top3[0].usagePercent)}
            </div>
          </div>
        </div>
      )}

      {/* 3rd Place (Right) */}
      {top3[2] && (
        <div className="flex flex-col items-center">
          <div className="mb-2">
            {getPokemonAvatar(top3[2])}
          </div>
          <div className="text-center mb-2">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {top3[2].pokemonName}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              #{top3[2].rank}
            </div>
          </div>
          <div className={`w-20 ${PODIUM_HEIGHTS[3]} ${PODIUM_COLORS[3]} rounded-t-lg flex flex-col items-center justify-between p-2 shadow-lg`}>
            {React.createElement(PODIUM_ICONS[3], { className: "w-6 h-6 text-white" })}
            <div className="text-white font-bold text-sm">
              {formatUsage(top3[2].usagePercent)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
