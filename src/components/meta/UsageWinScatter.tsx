"use client";

import type { PokemonMeta } from '@/lib/meta/types';
import { motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';

type Props = {
  rows: PokemonMeta[];
  title?: string;
};

export default function UsageWinScatter({ rows, title = 'Usage vs Winrate' }: Props) {
  const reduce = useReducedMotion();
  const width = 560;
  const height = 300;
  const padding = 36;

  const maxUsage = Math.max(30, Math.ceil(Math.max(...rows.map((r) => r.usage))));
  const minWin = Math.min(40, Math.floor(Math.min(...rows.map((r) => r.winrate))));
  const maxWin = Math.max(70, Math.ceil(Math.max(...rows.map((r) => r.winrate))));

  const x = (u: number) => padding + ((u / maxUsage) * (width - padding * 2));
  const y = (w: number) => height - padding - (((w - minWin) / (maxWin - minWin)) * (height - padding * 2));

  const ticksX = [0, maxUsage * 0.25, maxUsage * 0.5, maxUsage * 0.75, maxUsage].map((v) => Math.round(v));
  const ticksY = [minWin, minWin + (maxWin - minWin) * 0.25, minWin + (maxWin - minWin) * 0.5, minWin + (maxWin - minWin) * 0.75, maxWin].map((v) => Math.round(v));

  const top3 = [...rows].sort((a, b) => b.usage - a.usage).slice(0, 3).map((p) => p.id);

  return (
    <div className="glass p-4">
      <h3 className="font-semibold mb-2">{title}</h3>
      <svg width={width} height={height} role="img" aria-label="Scatter plot of usage vs winrate">
        {/* Axes */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e5e7eb" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#e5e7eb" />

        {ticksX.map((t) => (
          <g key={`x-${t}`}>
            <line x1={x(t)} y1={height - padding} x2={x(t)} y2={height - padding + 4} stroke="#9ca3af" />
            <text x={x(t)} y={height - padding + 16} fontSize={10} textAnchor="middle" fill="#6b7280">{t}%</text>
          </g>
        ))}
        {ticksY.map((t) => (
          <g key={`y-${t}`}>
            <line x1={padding - 4} y1={y(t)} x2={padding} y2={y(t)} stroke="#9ca3af" />
            <text x={padding - 8} y={y(t) + 3} fontSize={10} textAnchor="end" fill="#6b7280">{t}%</text>
          </g>
        ))}

        {/* Points */}
        {rows.map((p, idx) => {
          const cx = x(p.usage);
          const cy = y(p.winrate);
          const color = top3.includes(p.id) ? ['#f59e0b', '#10b981', '#3b82f6'][top3.indexOf(p.id)] : '#64748b';
          const r = top3.includes(p.id) ? 7 : 4;
          return (
            <g key={p.id}>
              <motion.circle
                cx={cx}
                cy={cy}
                r={r}
                fill={color}
                initial={reduce ? undefined : { opacity: 0, scale: 0.8 }}
                animate={reduce ? undefined : { opacity: 1, scale: 1 }}
                transition={reduce ? undefined : { duration: 0.4, delay: idx * 0.01 }}
              >
                <title>{`${p.name}\nUsage: ${p.usage}%\nWinrate: ${p.winrate}%`}</title>
              </motion.circle>
            </g>
          );
        })}
      </svg>

      {/* Highlight badges for top 3 */}
      <div className="mt-3 flex items-center gap-3 text-xs text-gray-600">
        {rows.filter((r) => top3.includes(r.id)).sort((a, b) => b.usage - a.usage).map((p, i) => (
          <div key={p.id} className="flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full text-white" style={{ backgroundColor: ['#f59e0b', '#10b981', '#3b82f6'][i] }}>{i + 1}</span>
            <Image src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`} alt={p.name} width={20} height={20} className="w-5 h-5 rounded-full bg-white/80 ring-1 ring-gray-200 object-contain" />
            <span className="font-medium">{p.name}</span>
            <span className="text-gray-500">{p.usage}% • {p.winrate}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}


