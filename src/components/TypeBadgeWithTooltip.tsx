"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import TypeBadge from "./TypeBadge";
import { getMatchup } from "@/lib/getMatchup";

interface TypeBadgeWithTooltipProps {
  type: string;
  className?: string;
}

export default function TypeBadgeWithTooltip({ type, className }: TypeBadgeWithTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<'top' | 'bottom'>('top');
  const [tooltipAlignment, setTooltipAlignment] = useState<'left' | 'center' | 'right'>('center');
  const [tooltipCoords, setTooltipCoords] = useState({ x: 0, y: 0 });
  const badgeRef = useRef<HTMLDivElement>(null);
  
  // Get type weaknesses using the getMatchup function
  const matchups = getMatchup([type.charAt(0).toUpperCase() + type.slice(1)]);
  
  // Categorize what types are effective against this type
  const weakTo = matchups.x4.concat(matchups.x2).map(t => ({ type: t.toLowerCase(), multiplier: matchups.x4.includes(t) ? '4x' : '2x' }));
  const resists = matchups.x0_5.map(t => ({ type: t.toLowerCase(), multiplier: '0.5x' }));
  const quarterResists = matchups.x0_25.map(t => ({ type: t.toLowerCase(), multiplier: '0.25x' }));
  const immune = matchups.x0.map(t => ({ type: t.toLowerCase(), multiplier: '0x' }));
  
  return (
    <>
      <div 
        ref={badgeRef}
        onMouseEnter={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const tooltipHeight = 240; // Taller to accommodate relaxed spacing
          const tooltipWidth = 448; // w-[28rem] = 28rem = 448px
          const margin = 16; // 1rem margin from edge
          
          // Calculate fixed coordinates relative to viewport
          let x = rect.left + rect.width / 2;
          let y = rect.top;
          
          // Check vertical positioning
          if (rect.top < tooltipHeight + 20) {
            setTooltipPosition('bottom');
            y = rect.bottom;
          } else {
            setTooltipPosition('top');
            y = rect.top;
          }
          
          // Check horizontal positioning
          const viewportWidth = window.innerWidth;
          if (x + tooltipWidth / 2 > viewportWidth - margin) {
            setTooltipAlignment('right');
            x = rect.right;
          } else if (x - tooltipWidth / 2 < margin) {
            setTooltipAlignment('left');
            x = rect.left;
          } else {
            setTooltipAlignment('center');
            // x is already centered
          }
          
          setTooltipCoords({ x, y });
          setShowTooltip(true);
        }}
        onMouseLeave={() => setShowTooltip(false)}
        className="inline-block"
      >
        <TypeBadge type={type} className={className} />
      </div>
      
      {showTooltip && createPortal(
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed z-[9999] max-w-[min(28rem,calc(100vw-2rem))] pointer-events-none"
          style={{
            left: tooltipAlignment === 'left' ? tooltipCoords.x : 
                  tooltipAlignment === 'right' ? tooltipCoords.x - 448 : 
                  tooltipCoords.x - 224, // Center: half of tooltip width
            top: tooltipPosition === 'top' ? tooltipCoords.y - 250 : tooltipCoords.y + 10
          }}
        >
          <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs rounded-lg p-4 shadow-xl border border-gray-200 dark:border-gray-600 w-[28rem] max-w-[min(28rem,calc(100vw-2rem))]">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <TypeBadge type={type} className="text-sm px-2 py-1" />
              <span className="text-gray-600 dark:text-gray-400 text-xs font-medium">Type Weaknesses</span>
            </div>
            
            {/* Five panels layout */}
            <div className="grid grid-cols-2 gap-4">
              {/* Double Weak (4x) */}
              <div className="bg-red-50 dark:bg-red-900/20 rounded p-3">
                <h4 className="font-semibold text-xs tracking-wide mb-2 text-red-800 dark:text-red-200">Double Weak (4x)</h4>
                <div className="space-y-2">
                  {matchups.x4.length > 0 ? (
                    matchups.x4.map((type) => (
                      <div key={type} className="flex items-center h-7">
                        <TypeBadge type={type.toLowerCase()} className="text-xs px-2 py-0.5 flex-shrink-0" />
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-gray-500 dark:text-gray-400">None</span>
                  )}
                </div>
              </div>
              
              {/* Weak to (2x) */}
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded p-3">
                <h4 className="font-semibold text-xs tracking-wide mb-2 text-orange-800 dark:text-orange-200">Weak to (2x)</h4>
                <div className="space-y-2">
                  {matchups.x2.length > 0 ? (
                    matchups.x2.map((type) => (
                      <div key={type} className="flex items-center h-7">
                        <TypeBadge type={type.toLowerCase()} className="text-xs px-2 py-0.5 flex-shrink-0" />
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-gray-500 dark:text-gray-400">None</span>
                  )}
                </div>
              </div>
              
              {/* Resists (0.5x) */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded p-3">
                <h4 className="font-semibold text-xs tracking-wide mb-2 text-green-800 dark:text-green-200">Resists (0.5x)</h4>
                <div className="space-y-2">
                  {matchups.x0_5.length > 0 ? (
                    matchups.x0_5.map((type) => (
                      <div key={type} className="flex items-center h-7">
                        <TypeBadge type={type.toLowerCase()} className="text-xs px-2 py-0.5 flex-shrink-0" />
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-gray-500 dark:text-gray-400">None</span>
                  )}
                </div>
              </div>
              
              {/* Quarter Resists (0.25x) */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-3">
                <h4 className="font-semibold text-xs tracking-wide mb-2 text-blue-800 dark:text-blue-200">Quarter Resists (0.25x)</h4>
                <div className="space-y-2">
                  {matchups.x0_25.length > 0 ? (
                    matchups.x0_25.map((type) => (
                      <div key={type} className="flex items-center h-7">
                        <TypeBadge type={type.toLowerCase()} className="text-xs px-2 py-0.5 flex-shrink-0" />
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-gray-500 dark:text-gray-400">None</span>
                  )}
                </div>
              </div>
              
              {/* Immune (0x) - spans both columns */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-3 col-span-2">
                <h4 className="font-semibold text-xs tracking-wide mb-2 text-gray-800 dark:text-gray-200">Immune (0x)</h4>
                <div className="space-y-2">
                  {matchups.x0.length > 0 ? (
                    matchups.x0.map((type) => (
                      <div key={type} className="flex items-center h-7">
                        <TypeBadge type={type.toLowerCase()} className="text-xs px-2 py-0.5 flex-shrink-0" />
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-gray-500 dark:text-gray-400">None</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>,
        document.body
      )}
    </>
  );
}
