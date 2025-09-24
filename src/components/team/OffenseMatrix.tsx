"use client";

import React from 'react';
import { TYPES, type TypeName } from '@/lib/type/data';
import { offensiveCoverage } from '@/lib/team/engine';
import type { SimplePokemon } from '@/lib/battle/sampleData';

export default function OffenseMatrix({ team }: { team: SimplePokemon[] }) {
  const cover = offensiveCoverage(team);
  const max = Math.max(1, ...TYPES.map((t) => cover[t] || 0));
  return (
    <div>
      <h3 className="font-semibold mb-2">Offensive Coverage</h3>
      <div className="grid grid-cols-[120px_1fr_40px] gap-1 text-xs">
        {TYPES.map((t) => {
          const v = cover[t] || 0;
          const intensity = v / max;
          return (
            <React.Fragment key={t}>
              <div className="py-1">vs {t}</div>
              <div className="h-4 self-center border rounded bg-gray-100 dark:bg-gray-800">
                <div className="h-full bg-green-500" style={{ width: `${intensity * 100}%` }} />
              </div>
              <div className="text-right self-center">{v}</div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

