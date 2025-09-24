"use client";

import { useState } from 'react';
import { TYPES, type TypeName } from '@/lib/type/data';
import { calcEffectiveness } from '@/lib/type/utils';
import TypeBadge from '@/components/type/TypeBadge';
import Tooltip from '@/components/Tooltip';

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
            const isSelected = t === attacker;
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

export default function TypeMatrix({ attacker, defenders }: { attacker: TypeName; defenders: TypeName[] }) {
  const [hoverRow, setHoverRow] = useState<null | TypeName>(null);
  const [hoverCol, setHoverCol] = useState<null | TypeName>(null);

  const cellBg = (mult: number) =>
    mult === 0
      ? 'bg-gray-300 dark:bg-gray-700'
      : mult >= 4
      ? 'bg-rose-300 dark:bg-rose-900/50'
      : mult > 1
      ? 'bg-orange-200 dark:bg-orange-900/50'
      : mult <= 0.25
      ? 'bg-blue-300 dark:bg-blue-900/60'
      : mult < 1
      ? 'bg-blue-200 dark:bg-blue-900/50'
      : 'bg-gray-100 dark:bg-gray-800';

  return (
    <div className="overflow-auto">
      {/* Legend */}
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="px-2 py-0.5 rounded border bg-rose-300/70 dark:bg-rose-900/50">4×</span>
        <span className="px-2 py-0.5 rounded border bg-orange-200/70 dark:bg-orange-900/50">2×</span>
        <span className="px-2 py-0.5 rounded border bg-gray-100 dark:bg-gray-800">1×</span>
        <span className="px-2 py-0.5 rounded border bg-blue-200/70 dark:bg-blue-900/50">0.5×</span>
        <span className="px-2 py-0.5 rounded border bg-blue-300/70 dark:bg-blue-900/60">0.25×</span>
        <span className="px-2 py-0.5 rounded border bg-gray-300 dark:bg-gray-700">0×</span>
      </div>

      <table className="w-full text-xs border-separate border-spacing-0" role="grid" aria-label="Type effectiveness matrix">
        <thead>
          <tr>
            <th className="sticky left-0 top-0 bg-white dark:bg-gray-900 z-20 text-left p-2 border">Attacker \\ Defender</th>
            {TYPES.map((d) => (
              <th
                key={d}
                className={`p-2 border sticky top-0 bg-white dark:bg-gray-900 z-10`}
                onMouseEnter={() => setHoverCol(d)}
                onMouseLeave={() => setHoverCol(null)}
              >
                <div className="flex justify-center">
                  <Tooltip
                    content={<TypeTooltipContent type={d} attacker={attacker} defenders={defenders} />}
                    type={d.toLowerCase()}
                    variant="default"
                    position="bottom"
                    maxWidth="max-w-md"
                    containViewport={true}
                  >
                    <TypeBadge type={d} />
                  </Tooltip>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TYPES.map((a) => (
            <tr
              key={a}
              className={`${a === attacker ? 'bg-blue-50 dark:bg-blue-950/30' : ''} ${hoverRow === a ? 'bg-blue-50/70 dark:bg-blue-950/30' : ''}`}
            >
              <th
                scope="row"
                className="sticky left-0 bg-white dark:bg-gray-900 z-10 p-2 border text-left"
                onMouseEnter={() => setHoverRow(a)}
                onMouseLeave={() => setHoverRow(null)}
              >
                <Tooltip
                  content={<TypeTooltipContent type={a} attacker={attacker} defenders={defenders} />}
                  type={a.toLowerCase()}
                  variant="default"
                  position="right"
                  maxWidth="max-w-md"
                  containViewport={true}
                >
                  <TypeBadge type={a} />
                </Tooltip>
              </th>
              {TYPES.map((d) => {
                const mult = calcEffectiveness(a, [d]);
                const hoverBg = hoverCol === d || hoverRow === a ? 'outline outline-1 outline-blue-300 dark:outline-blue-700' : '';
                return (
                  <td
                    key={a + d}
                    className={`p-2 border text-center ${cellBg(mult)} ${hoverBg}`}
                    aria-label={`${a} to ${d} equals x${mult}`}
                    onMouseEnter={() => {
                      setHoverRow(a);
                      setHoverCol(d);
                    }}
                    onMouseLeave={() => {
                      setHoverRow(null);
                      setHoverCol(null);
                    }}
                    title={`${a} ➜ ${d}: x${mult}`}
                  >
                    x{mult}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

