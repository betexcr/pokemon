"use client";

import { motion, useReducedMotion } from 'framer-motion';
import type { PokemonTrendView, TrendYearSnapshot } from '@/lib/trends/types';

// Helper function to convert to percentage
function toPercent(value: number): number {
  return +(Math.round(value * 10) / 10).toFixed(1); // 1 decimal
}

export default function TrendChart({ data, pokemon, region }: { data: PokemonTrendView[]; pokemon: string; region: string }) {
  const reduce = useReducedMotion();
  
  // Find the pokemon data
  const pokemonData = data.find((p) => p.name.toLowerCase() === pokemon.toLowerCase());
  
  if (!pokemonData) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        No trend data available for {pokemon}
      </div>
    );
  }
  
  const points = pokemonData.trend.map((snapshot) => ({
    x: snapshot.year,
    y: toPercent(snapshot.values[region as keyof typeof snapshot.values] || 0),
    source: pokemonData.notable_sources[0] || 'Unknown'
  }));
  
  const months = pokemonData.trend.map((snapshot) => String(snapshot.year));

  const width = 520;
  const height = 220;
  const padding = 28;
  const maxY = Math.max(10, Math.max(...points.map((p) => p.y)));
  const stepX = (width - padding * 2) / Math.max(1, points.length - 1);
  const scaleY = (v: number) => height - padding - (v / maxY) * (height - padding * 2);
  const d = points
    .map((p, i) => {
      const x = padding + i * stepX;
      const y = scaleY(p.y);
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    })
    .join(' ');

  return (
    <div>
      <h3 className="font-semibold mb-2">{pokemon || '—'} Popularity</h3>
      <svg width={width} height={height} role="img" aria-label="Popularity over time">
        <g>
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e5e7eb" />
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#e5e7eb" />
          {months.map((m, i) => (
            <text key={m} x={padding + i * stepX} y={height - 8} fontSize={10} textAnchor="middle" fill="#6b7280">{m}</text>
          ))}
          {/* y-axis labels */}
          {[0, maxY / 2, maxY].map((v) => (
            <text key={v} x={4} y={scaleY(v) + 4} fontSize={10} fill="#6b7280">{v}%</text>
          ))}
        </g>
        <motion.path
          d={d}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={2}
          initial={reduce ? undefined : { pathLength: 0 }}
          animate={reduce ? undefined : { pathLength: 1 }}
          transition={reduce ? undefined : { duration: 0.7 }}
        />
        {points.map((p, i) => {
          const id = 0 // TODO: Fix entries reference
          const id4 = String(id).padStart(4, '0')
          const portrait = id ? `https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/${id4}/Normal.png` : ''
          const fallback = id ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png` : ''
          const cx = padding + i * stepX
          const cy = scaleY(p.y)
          const imgSize = 22
          return (
            <g key={i}>
              <title>{`${p.y}% — ${p.source} ${months[i]}`}</title>
              <circle cx={cx} cy={cy} r={3} fill="#3b82f6" tabIndex={0} aria-label={`${months[i]} ${p.source}: ${p.y}%`} />
              {id > 0 && (
                <image
                  href={portrait}
                  x={cx - imgSize / 2}
                  y={cy - imgSize - 8}
                  width={imgSize}
                  height={imgSize}
                  preserveAspectRatio="xMidYMid slice"
                  style={{ imageRendering: 'pixelated' as any }}
                  onError={(e: any) => {
                    const el = e.currentTarget as SVGImageElement
                    if (el && el.getAttribute('href') !== fallback) el.setAttribute('href', fallback)
                  }}
                />
              )}
            </g>
          )
        })}
      </svg>
      {/* Peak callout */}
      {(() => {
        const max = points.reduce((acc, p, i) => (p.y > (acc?.y ?? -1) ? { ...p, i } : acc), null as any);
        if (!max || max.y <= 0) return null;
        return (
          <div className="mt-2 text-xs text-gray-600">
            Peak: {max.y}% in {months[max.i]} ({max.source}).
          </div>
        );
      })()}
    </div>
  );
}
