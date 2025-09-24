"use client";

import { motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion';
import { TYPES, TYPE_COLORS, type TypeName } from '@/lib/type/data';
import { calcEffectiveness } from '@/lib/type/utils';
import { useCallback, useMemo, useState } from 'react';
import Tooltip from '@/components/Tooltip';

type Props = {
  attacker: TypeName;
  defenders: TypeName[];
  onTypeClick?: (type: TypeName) => void;
};

function TypeTooltipContent({ type, attacker, defenders }: { type: TypeName; attacker: TypeName; defenders: TypeName[] }) {
  const effectiveness = calcEffectiveness(attacker, [type]);
  const effectivenessText = effectiveness === 0 ? "Doesn't affect" : 
                           effectiveness >= 4 ? 'Devastatingly effective!' : 
                           effectiveness === 2 ? 'Super effective!' : 
                           effectiveness < 1 ? 'Not very effective…' : 'Neutral';
  
  // Get effectiveness category for better styling
  const getEffectivenessCategory = (eff: number) => {
    if (eff === 0) return 'immune';
    if (eff >= 4) return 'devastating';
    if (eff >= 2) return 'super';
    if (eff < 1) return 'not-very';
    return 'neutral';
  };
  
  const category = getEffectivenessCategory(effectiveness);
  
  return (
    <div className="w-80 space-y-4">
      {/* Header with type matchup */}
      <div className="relative overflow-hidden rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 dark:from-blue-400/10 dark:via-purple-400/10 dark:to-pink-400/10"></div>
        <div className="relative p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600" style={{ backgroundColor: `var(--type-${attacker.toLowerCase()})` }}></div>
              <span className="font-semibold text-gray-900 dark:text-gray-100 capitalize">{attacker}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 dark:text-gray-100 capitalize">{type}</span>
              <div className="w-6 h-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600" style={{ backgroundColor: `var(--type-${type.toLowerCase()})` }}></div>
            </div>
          </div>
          
          <div className="text-center">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${
              category === 'devastating' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
              category === 'super' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
              category === 'not-very' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
              category === 'immune' ? 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300' :
              'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300'
            }`}>
              <span className="text-lg">x{effectiveness}</span>
              <span className="text-xs opacity-90">{effectivenessText}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Type effectiveness grid */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Type Effectiveness</h3>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {TYPES.map((t) => {
            const eff = calcEffectiveness(attacker, [t]);
            const isSelected = t === attacker || defenders.includes(t);
            const isSuperEffective = eff >= 2;
            const isNotVeryEffective = eff < 1 && eff > 0;
            const isImmune = eff === 0;
            const isCurrentType = t === type;
            
            let bgColor = 'bg-gray-100 dark:bg-gray-800';
            let textColor = 'text-gray-700 dark:text-gray-300';
            let borderColor = 'border-gray-200 dark:border-gray-700';
            let ringColor = '';
            
            if (isCurrentType) {
              bgColor = 'bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40';
              textColor = 'text-purple-900 dark:text-purple-100';
              borderColor = 'border-purple-300 dark:border-purple-600';
              ringColor = 'ring-2 ring-purple-200 dark:ring-purple-800';
            } else if (isSelected) {
              bgColor = 'bg-indigo-100 dark:bg-indigo-900/40';
              textColor = 'text-indigo-900 dark:text-indigo-100';
              borderColor = 'border-indigo-300 dark:border-indigo-600';
            } else if (isSuperEffective) {
              bgColor = 'bg-red-100 dark:bg-red-900/40';
              textColor = 'text-red-900 dark:text-red-100';
              borderColor = 'border-red-300 dark:border-red-600';
            } else if (isNotVeryEffective) {
              bgColor = 'bg-blue-100 dark:bg-blue-900/40';
              textColor = 'text-blue-900 dark:text-blue-100';
              borderColor = 'border-blue-300 dark:border-blue-600';
            } else if (isImmune) {
              bgColor = 'bg-gray-200 dark:bg-gray-700';
              textColor = 'text-gray-600 dark:text-gray-400';
              borderColor = 'border-gray-300 dark:border-gray-600';
            }
            
            return (
              <div
                key={t}
                className={`px-2 py-2 rounded-lg text-center border text-xs font-medium transition-all duration-200 hover:scale-105 ${bgColor} ${textColor} ${borderColor} ${ringColor}`}
                title={`${attacker} vs ${t}: x${eff}`}
              >
                <div className="font-semibold text-xs">{t}</div>
                <div className="text-xs opacity-75 mt-0.5">x{eff}</div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Legend */}
      <div className="pt-3 border-t border-gray-200/60 dark:border-gray-700/60">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-200 dark:bg-red-800 rounded-full border border-red-300 dark:border-red-600"></div>
            <span className="text-gray-600 dark:text-gray-400">Super Effective</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-200 dark:bg-blue-800 rounded-full border border-blue-300 dark:border-blue-600"></div>
            <span className="text-gray-600 dark:text-gray-400">Not Very Effective</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full border border-gray-400 dark:border-gray-500"></div>
            <span className="text-gray-600 dark:text-gray-400">No Effect</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gradient-to-br from-purple-200 to-pink-200 dark:from-purple-800 dark:to-pink-800 rounded-full border border-purple-300 dark:border-purple-600"></div>
            <span className="text-gray-600 dark:text-gray-400">Current Type</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TypeWheel({ attacker, defenders, onTypeClick }: Props) {
  const reduce = useReducedMotion();
  const radius = 160;
  const rotate = useMotionValue(0);
  const [hovered, setHovered] = useState<TypeName | null>(null);

  const items = TYPES.map((t, i) => {
    const angle = (i / TYPES.length) * Math.PI * 2;
    return { t, x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  });

  const highlightMap = useMemo(() => {
    const map: Record<TypeName, number> = {} as any;
    for (const d of TYPES) {
      map[d] = calcEffectiveness(attacker, [d]);
    }
    return map;
  }, [attacker]);

  const dragHandler = useCallback((_: any, info: any) => {
    rotate.set(rotate.get() + info.delta.x * 0.2);
  }, [rotate]);

  const scale = useTransform(rotate, (r) => (reduce ? 1 : 1));

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'ArrowLeft') rotate.set(rotate.get() - 10);
    if (e.key === 'ArrowRight') rotate.set(rotate.get() + 10);
  }

  // Connection edges to selected/hovered defenders
  const edges = items.filter(({ t }) => defenders.includes(t) || hovered === t);

  return (
    <div className="flex items-center justify-center" tabIndex={0} onKeyDown={onKeyDown} aria-label="Type wheel, use arrow keys to rotate" role="application">
      <motion.svg width={400} height={400} style={{ rotate, scale }} onWheel={(e) => !reduce && rotate.set(rotate.get() + e.deltaY * 0.1)}>
        <g transform={`translate(${200},${200})`}>
          <circle r={radius + 32} fill="url(#grad)" stroke="#e5e7eb" />
          {edges.map(({ x, y, t }, i) => (
            <motion.line
              key={`edge-${t}`}
              x1={0}
              y1={0}
              x2={x}
              y2={y}
              stroke={defenders.includes(t) ? '#f59e0b' : '#60a5fa'}
              strokeWidth={2}
              initial={reduce ? undefined : { pathLength: 0 }}
              animate={reduce ? undefined : { pathLength: 1 }}
              transition={{ duration: 0.3, delay: i * 0.03 }}
            />
          ))}
          {items.map(({ t, x, y }, idx) => {
            const mult = highlightMap[t];
            const color = mult === 0 ? '#9CA3AF' : mult > 1 ? '#F59E0B' : mult < 1 ? '#60A5FA' : '#D1D5DB';
            const selected = defenders.includes(t);
            return (
              <g key={t} transform={`translate(${x},${y})`}>
                <Tooltip
                  content={<TypeTooltipContent type={t} attacker={attacker} defenders={defenders} />}
                  type={t.toLowerCase()}
                  variant="default"
                  position="top"
                  maxWidth="max-w-md"
                  containViewport={true}
                >
                  <g>
                    <motion.circle
                      r={24}
                      fill={TYPE_COLORS[t] + '66'}
                      stroke={selected ? '#10B981' : color}
                      strokeWidth={selected ? 5 : 3}
                      onHoverStart={() => setHovered(t)}
                      onHoverEnd={() => setHovered(null)}
                      drag={!reduce}
                      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                      dragMomentum={false}
                      onDrag={dragHandler}
                      onClick={() => onTypeClick?.(t)}
                      style={{ cursor: 'pointer' }}
                    />
                    <title>{`${t} • x${mult}`}</title>
                    <text textAnchor="middle" y={5} fontSize={11} fill="#111827">{t}</text>
                    {/* focusable for a11y */}
                    <circle 
                      r={28} 
                      fill="transparent" 
                      tabIndex={0} 
                      aria-label={`${t} effectiveness x${mult}`}
                      onClick={() => onTypeClick?.(t)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onTypeClick?.(t);
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                  </g>
                </Tooltip>
              </g>
            );
          })}
          {/* Center summary */}
          <circle r={84} fill="#ffffffCC" stroke="#e5e7eb" />
          <text textAnchor="middle" y={-8} fontSize={14} fill="#111827">{attacker} ➜ {defenders.join('/') || '—'}</text>
          <text textAnchor="middle" y={12} fontSize={14} fill="#111827">
            x{calcEffectiveness(attacker, defenders.length ? defenders : [])}
          </text>
        </g>
        <defs>
          <radialGradient id="grad">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f3f4f6" />
          </radialGradient>
        </defs>
      </motion.svg>
    </div>
  );
}
