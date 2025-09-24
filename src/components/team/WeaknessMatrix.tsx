"use client";

import React from 'react';
import { TYPES, type TypeName } from '@/lib/type/data';
import type { TeamAnalysis } from '@/lib/team/engine';

export default function WeaknessMatrix({ analysis }: { analysis: TeamAnalysis }) {
  console.log('WeaknessMatrix received analysis:', analysis);
  const max = Math.max(1, ...TYPES.map((t) => analysis.weaknesses[t] || 0));
  console.log('WeaknessMatrix max value:', max);
  return (
    <div>
      <h3 className="font-semibold mb-2">Weakness Matrix</h3>
      <div className="grid grid-cols-[120px_1fr_40px] gap-1 text-xs">
        {TYPES.map((t) => {
          const w = analysis.weaknesses[t] || 0;
          const intensity = w / max;
          return (
            <React.Fragment key={t}>
              <div className="py-1">{t}</div>
              <div className="h-4 self-center border rounded bg-gray-100 dark:bg-gray-800">
                <div className="h-full bg-red-400" style={{ width: `${intensity * 100}%` }} />
              </div>
              <div className="text-right self-center">{w}</div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

