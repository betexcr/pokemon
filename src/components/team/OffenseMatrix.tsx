"use client";

import React from 'react';
import { TYPES, type TypeName } from '@/lib/type/data';
import { offensiveCoverage } from '@/lib/team/engine';
import type { SimplePokemon } from '@/lib/battle/sampleData';
import { ChevronDown, ChevronRight } from 'lucide-react';
import TypeBadgeWithTooltip from '@/components/TypeBadgeWithTooltip';

interface OffenseMatrixProps {
  team: SimplePokemon[];
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function OffenseMatrix({ team, isCollapsed = true, onToggleCollapse }: OffenseMatrixProps) {
  const cover = offensiveCoverage(team);
  const max = Math.max(1, ...TYPES.map((t) => cover[t] || 0));
  
  return (
    <div className="border border-border rounded-xl bg-surface p-4">
      <div 
        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded p-1 -m-1 transition-colors"
        onClick={onToggleCollapse}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4 text-muted" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted" />
        )}
        <h3 className="font-semibold text-text">Offensive Coverage</h3>
      </div>
      
      {!isCollapsed && (
        <div className="mt-4 grid grid-cols-[120px_1fr_40px] gap-1 text-xs">
          {TYPES.map((t) => {
            const v = cover[t] || 0;
            const intensity = v / max;
            return (
              <React.Fragment key={t}>
                <div className="py-1 text-text">vs {t}</div>
                <div className="h-4 self-center border rounded bg-gray-100 dark:bg-gray-800">
                  <div className="h-full bg-green-500" style={{ width: `${intensity * 100}%` }} />
                </div>
                <div className="text-right self-center text-text">{v}</div>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}

