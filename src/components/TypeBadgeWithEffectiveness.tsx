"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import TypeBadge from "./TypeBadge";
import { getEffectiveness } from "@/lib/getEffectiveness";

interface TypeBadgeWithEffectivenessProps {
  type: string;
  className?: string;
}

export default function TypeBadgeWithEffectiveness({ type, className }: TypeBadgeWithEffectivenessProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<'top' | 'bottom'>('top');
  const [tooltipAlignment, setTooltipAlignment] = useState<'left' | 'center' | 'right'>('center');
  const [tooltipCoords, setTooltipCoords] = useState({ x: 0, y: 0 });
  const badgeRef = useRef<HTMLDivElement>(null);
  
  // Get type effectiveness using the new getEffectiveness function
  const effectiveness = getEffectiveness(type.charAt(0).toUpperCase() + type.slice(1));
  
  // Categorize effectiveness
  const weakTo = effectiveness.x2.map(t => ({ type: t.toLowerCase(), multiplier: '2x' }));
  const resists = effectiveness.x0_5.map(t => ({ type: t.toLowerCase(), multiplier: '0.5x' }));
  const quarterResists = effectiveness.x0_25.map(t => ({ type: t.toLowerCase(), multiplier: '0.25x' }));
  const immune = effectiveness.x0.map(t => ({ type: t.toLowerCase(), multiplier: '0x' }));
  
  return (
    <>
      <div 
        ref={badgeRef}
        onMouseEnter={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const tooltipHeight = 200; // Approximate tooltip height
          const tooltipWidth = 256; // w-64 = 16rem = 256px
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
          className="fixed z-[9999] max-w-[min(16rem,calc(100vw-4rem))] pointer-events-none"
          style={{
            left: tooltipAlignment === 'left' ? tooltipCoords.x : 
                  tooltipAlignment === 'right' ? tooltipCoords.x - 256 : 
                  tooltipCoords.x - 128, // Center: half of tooltip width
            top: tooltipPosition === 'top' ? tooltipCoords.y - 210 : tooltipCoords.y + 8
          }}
        >
          <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs rounded-lg p-2 shadow-xl border border-gray-200 dark:border-gray-600 w-64 max-w-[min(16rem,calc(100vw-4rem))]">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <TypeBadge type={type} className="text-sm px-2 py-1" />
              <span className="text-gray-600 dark:text-gray-400 text-xs font-medium">Type Effectiveness</span>
            </div>
            
            {/* Four panels layout */}
            <div className="grid grid-cols-4 gap-1">
              {/* Super Effective (2x+) */}
              <div className="bg-red-50 dark:bg-red-900/20 rounded p-1.5">
                <h4 className="font-semibold text-xs mb-1 text-red-800 dark:text-red-200">Super Effective (2x+)</h4>
                <div className="space-y-0.5">
                  {weakTo.length > 0 ? (
                    weakTo.map((effect) => (
                      <div key={effect.type} className="flex items-center justify-between">
                        <TypeBadge type={effect.type} className="text-xs px-1 py-0.5" />
                        <span className="text-xs font-bold text-red-600 dark:text-red-400">{effect.multiplier}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-gray-500 dark:text-gray-400">None</span>
                  )}
                </div>
              </div>
              
              {/* Not Very Effective (0.5x) */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded p-1.5">
                <h4 className="font-semibold text-xs mb-1 text-green-800 dark:text-green-200">Not Very Effective (0.5x)</h4>
                <div className="space-y-0.5">
                  {resists.length > 0 ? (
                    resists.map((effect) => (
                      <div key={effect.type} className="flex items-center justify-between">
                        <TypeBadge type={effect.type} className="text-xs px-1 py-0.5" />
                        <span className="text-xs font-bold text-green-600 dark:text-green-400">{effect.multiplier}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-gray-500 dark:text-gray-400">None</span>
                  )}
                </div>
              </div>
              
              {/* Quarter Effective (0.25x) */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-1.5">
                <h4 className="font-semibold text-xs mb-1 text-blue-800 dark:text-blue-200">Quarter Effective (0.25x)</h4>
                <div className="space-y-0.5">
                  {quarterResists.length > 0 ? (
                    quarterResists.map((effect) => (
                      <div key={effect.type} className="flex items-center justify-between">
                        <TypeBadge type={effect.type} className="text-xs px-1 py-0.5" />
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{effect.multiplier}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-gray-500 dark:text-gray-400">None</span>
                  )}
                </div>
              </div>
              
              {/* No Effect (0x) */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-1.5">
                <h4 className="font-semibold text-xs mb-1 text-gray-800 dark:text-gray-200">No Effect (0x)</h4>
                <div className="space-y-0.5">
                  {immune.length > 0 ? (
                    immune.map((effect) => (
                      <div key={effect.type} className="flex items-center justify-between">
                        <TypeBadge type={effect.type} className="text-xs px-1 py-0.5" />
                        <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{effect.multiplier}</span>
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
