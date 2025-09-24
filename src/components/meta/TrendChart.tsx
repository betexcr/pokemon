"use client";

import type { PokemonMeta } from '@/lib/meta/types';
import { motion, useReducedMotion } from 'framer-motion';

export default function TrendChart({ series }: { series: PokemonMeta[] }) {
  const reduce = useReducedMotion();
  const width = 520;
  const height = 200;

  // Gather all months
  const months = Array.from(new Set(series.flatMap((p) => p.trend?.map((t) => t.month) || []))).sort();
  const padding = 28;
  const draw = (p: PokemonMeta) => {
    const points = (p.trend || []).filter((t) => months.includes(t.month));
    if (!points.length) return '';
    const max = Math.max(...series.flatMap((pp) => (pp.trend || []).map((t) => t.usage)), 1);
    const stepX = (width - padding * 2) / Math.max(1, months.length - 1);
    const scaleY = (v: number) => height - padding - (v / max) * (height - padding * 2);
    return points
      .map((pt, i) => {
        const x = padding + i * stepX;
        const y = scaleY(pt.usage);
        return `${i === 0 ? 'M' : 'L'}${x},${y}`;
      })
      .join(' ');
  };

  return (
    <div>
      <h3 className="font-semibold mb-2">Usage Trend</h3>
      <svg width={width} height={height} role="img" aria-label="Usage trend over months">
        <g>
          {/* Axes */}
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e5e7eb" />
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#e5e7eb" />
          {months.map((m, i) => (
            <text key={m} x={padding + i * ((width - padding * 2) / Math.max(1, months.length - 1))} y={height - 8} fontSize={10} textAnchor="middle" fill="#6b7280">{m.slice(5)}</text>
          ))}
        </g>
        {series.slice(0, 3).map((p, idx) => (
          <g key={p.id}>
            <motion.path
              d={draw(p)}
              fill="none"
              stroke={['#f59e0b', '#10b981', '#3b82f6'][idx % 3]}
              strokeWidth={2}
              initial={reduce ? undefined : { pathLength: 0 }}
              animate={reduce ? undefined : { pathLength: 1 }}
              transition={reduce ? undefined : { duration: 0.8, delay: idx * 0.1 }}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}

