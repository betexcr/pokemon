"use client";

import { TYPES, type TypeName } from '@/lib/type/data';
import { typeColors } from '@/lib/utils';
import type { TeamAnalysis } from '@/lib/team/engine';
import { motion, useReducedMotion } from 'framer-motion';

export default function TypeRadar({ analysis, id = 'team-radar' }: { analysis: TeamAnalysis; id?: string }) {
  console.log('TypeRadar received analysis:', analysis);
  const reduce = useReducedMotion();
  const width = 420;
  const height = 420;
  const r = 130;
  const cx = width / 2;
  const cy = height / 2;

  function val(t: TypeName) {
    const net = (analysis.net[t] || 0); // can be negative
    // Normalize from [-3..+3] to [0.2..1]
    const norm = Math.max(0, Math.min(1, (net + 3) / 6));
    const result = 0.2 + norm * 0.8;
    console.log(`TypeRadar val for ${t}: net=${net}, norm=${norm}, result=${result}`);
    return result;
  }

  const points = TYPES.map((t, i) => {
    const angle = (i / TYPES.length) * Math.PI * 2 - Math.PI / 2;
    const rr = r * val(t as TypeName);
    const x = cx + Math.cos(angle) * rr;
    const y = cy + Math.sin(angle) * rr;
    return { x, y };
  });

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + ' Z';

  return (
    <div>
      <h3 className="font-semibold mb-2">Type Coverage Radar</h3>
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
        Each axis is a Pokémon type. The blue shape grows toward types your team resists and shrinks toward types it is weak to. Bigger area near a label = better defense versus that type.
      </p>
      <svg id={id} width={width} height={height + 40} role="img" aria-label="Team type coverage radar with full labels and legend">
        <g>
          {[0.4, 0.6, 0.8, 1].map((k, i) => (
            <circle key={i} cx={cx} cy={cy} r={r * k} fill="none" stroke="#e5e7eb" />
          ))}
          {/* Axis labels with full type names */}
          {TYPES.map((t, i) => {
            const angle = (i / TYPES.length) * Math.PI * 2 - Math.PI / 2;
            const x = cx + Math.cos(angle) * (r + 26);
            const y = cy + Math.sin(angle) * (r + 26);
            const colorKey = t.toLowerCase();
            const fill = `var(--type-${colorKey})`;
            const textFill = (typeColors[colorKey]?.text === 'text-white') ? '#ffffff' : '#111827';
            const padding = 3;
            // Background pill behind label
            const label = `${t}`;
            const approxWidth = label.length * 6 + padding * 2;
            const approxHeight = 14;
            const rx = 7;
            return (
              <g key={t}>
                <rect x={x - approxWidth / 2} y={y - approxHeight / 2} width={approxWidth} height={approxHeight} rx={rx} ry={rx} fill={fill} opacity={0.9} />
                <text x={x} y={y + 0.5} fontSize={10} textAnchor="middle" dominantBaseline="middle" fill={textFill}>{t}</text>
              </g>
            );
          })}
          <motion.path
            d={path}
            fill="#3b82f633"
            stroke="#3b82f6"
            strokeWidth={2}
            initial={reduce ? undefined : { pathLength: 0 }}
            animate={reduce ? undefined : { pathLength: 1 }}
            transition={reduce ? undefined : { duration: 0.6 }}
          />
          {/* Legend - placed below chart to avoid overlap */}
          <g transform={`translate(${cx - 160}, ${height})`}>
            <rect x={0} y={-14} width={320} height={28} rx={6} ry={6} fill="#f9fafb" stroke="#e5e7eb" />
            <circle cx={12} cy={0} r={6} fill="#3b82f6" opacity={0.2} />
            <line x1={6} y1={0} x2={18} y2={0} stroke="#3b82f6" strokeWidth={2} />
            <text x={28} y={0} fontSize={10} dominantBaseline="middle" fill="#374151">Blue shape = net type safety (resists minus weaknesses)</text>
            <text x={28} y={12} fontSize={9} fill="#6b7280">Closer to edge near a type = safer vs that type</text>
          </g>
        </g>
      </svg>
    </div>
  );
}
