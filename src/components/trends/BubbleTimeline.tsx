"use client";

import { motion, useReducedMotion } from 'framer-motion';
import type { PokemonTrendView, TrendYearSnapshot } from '@/lib/trends/types';

// Helper function to convert to percentage
function toPercent(value: number): number {
  return +(Math.round(value * 10) / 10).toFixed(1); // 1 decimal
}
import { useMemo } from 'react';

export default function BubbleTimeline({ data, region, year }: { data: PokemonTrendView[]; region: string; year: number }) {
  const reduce = useReducedMotion();
  
  // Find pokemon with data for the specified year and region
  const pokemonWithData = data.filter((pokemon) => {
    const yearData = pokemon.trend.find((snapshot) => snapshot.year === year);
    return yearData && yearData.values[region as keyof typeof yearData.values] > 0;
  });

  // Always call hooks in the same order. Compute memoized bubbles even if empty.
  const total = pokemonWithData.reduce((sum, pokemon) => {
    const yearData = pokemon.trend.find((snapshot) => snapshot.year === year);
    return sum + (yearData?.values[region as keyof typeof yearData.values] || 0);
  }, 0);

  const bubbles = useMemo(() => {
    if (pokemonWithData.length === 0) return [] as Array<ReturnType<typeof Object>>;
    const centerX = 280;
    const centerY = 150;
    const angleStep = (Math.PI * 2) / Math.max(1, pokemonWithData.length);
    return pokemonWithData.map((pokemon, i) => {
      const yearData = pokemon.trend.find((snapshot) => snapshot.year === year);
      const value = yearData?.values[region as keyof typeof yearData.values] || 0;
      const pct = toPercent(value);
      const radius = 16 + Math.sqrt(pct) * 4; // gentle scale
      const angle = i * angleStep;
      const baseR = 80 + i * 3;
      const x = centerX + Math.cos(angle) * baseR;
      const y = centerY + Math.sin(angle) * baseR;
      return { 
        id: pokemon.national_number,
        name: pokemon.name,
        pct, 
        x, 
        y, 
        radius 
      };
    });
  }, [pokemonWithData, total, year, region]);

  if (pokemonWithData.length === 0) return <div className="text-sm text-gray-500">No data for selection.</div>;

  return (
    <div>
      <div className="flex items-baseline gap-2 mb-2">
        <h3 className="font-semibold">Bubble Timeline</h3>
        <span className="text-xs text-gray-600">{year} — Real Data ({region})</span>
      </div>
      <svg width={560} height={320} role="img" aria-label="Bubble popularity view">
        {!reduce && <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>}
        {bubbles.map((b, i) => {
          const id4 = String(b.id).padStart(4, '0')
          const portrait = `https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/${id4}/Normal.png`
          const fallback = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${b.id}.png`
          // Portrait image should match bubble diameter
          const imgSize = Math.max(12, Math.floor(b.radius * 2))
          return (
            <g key={b.id}>
              <title>{`${b.name}: ${b.pct}% (${region} ${year})`}</title>
              <motion.circle
                cx={b.x}
                cy={b.y}
                r={b.radius}
                fill={['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6'][i % 5]}
                initial={reduce ? undefined : { scale: 0.8, opacity: 0.6 }}
                animate={reduce ? undefined : { scale: [1, 1.06, 1], opacity: 1 }}
                transition={reduce ? undefined : { repeat: Infinity, repeatType: 'mirror', duration: 3, delay: i * 0.1 }}
                style={!reduce ? { filter: 'url(#glow)' } : undefined}
              />
              {/* Portrait clipped to a circle matching the bubble */}
              <clipPath id={`clip-${b.id}`}>
                <circle cx={b.x} cy={b.y} r={b.radius} />
              </clipPath>
              <image
                href={portrait}
                x={b.x - imgSize / 2}
                y={b.y - imgSize / 2}
                width={imgSize}
                height={imgSize}
                preserveAspectRatio="xMidYMid slice"
                clipPath={`url(#clip-${b.id})`}
                style={{ imageRendering: 'pixelated' as any, borderRadius: '9999px' as any }}
                onError={(e: any) => {
                  const el = e.currentTarget as SVGImageElement
                  if (el && el.getAttribute('href') !== fallback) el.setAttribute('href', fallback)
                }}
              />
              <text x={b.x} y={b.y + b.radius + 10} textAnchor="middle" fontSize={10} fill="#111827">{b.name}</text>
            </g>
          )
        })}
      </svg>
    </div>
  );
}

