"use client";

import React, { useState } from 'react';
import { TYPES, type TypeName } from '@/lib/type/data';
import type { TeamAnalysis } from '@/lib/team/engine';
import { ChevronDown, ChevronRight } from 'lucide-react';
import TypeBadgeWithTooltip from '@/components/TypeBadgeWithTooltip';

interface WeaknessMatrixProps {
  analysis: TeamAnalysis;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function WeaknessMatrix({ analysis, isCollapsed = true, onToggleCollapse }: WeaknessMatrixProps) {
  console.log('WeaknessMatrix received analysis:', analysis);
  const max = Math.max(1, ...TYPES.map((t) => analysis.weaknesses[t] || 0));
  console.log('WeaknessMatrix max value:', max);
  
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
        <h3 className="font-semibold text-text">Weakness Matrix</h3>
      </div>
      
      {!isCollapsed && (
        <div className="mt-4 grid grid-cols-[120px_1fr_40px] gap-1 text-xs">
          {TYPES.map((t) => {
            const w = analysis.weaknesses[t] || 0;
            const intensity = w / max;
            return (
              <React.Fragment key={t}>
                <div className="py-1 text-text">{t}</div>
                <div className="h-4 self-center border rounded bg-gray-100 dark:bg-gray-800">
                  <div className="h-full bg-red-400" style={{ width: `${intensity * 100}%` }} />
                </div>
                <div className="text-right self-center text-text">{w}</div>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}

