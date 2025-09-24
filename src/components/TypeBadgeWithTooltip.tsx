"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import TypeBadge from "./TypeBadge";
import { calculateTypeEffectiveness } from "@/lib/api";

interface TypeBadgeWithTooltipProps {
  type: string;
  className?: string;
}

export default function TypeBadgeWithTooltip({ type, className }: TypeBadgeWithTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<'top' | 'bottom'>('top');
  const [tooltipAlignment, setTooltipAlignment] = useState<'left' | 'center' | 'right'>('center');
  
  // Get type effectiveness for the specific hovered type
  const getTypeEffectivenessForType = (attackingType: string) => {
    const allTypes = [
      'normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison',
      'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
    ];
    
    return allTypes.map(defendingType => {
      const effectiveness = calculateTypeEffectiveness([attackingType], [defendingType]);
      return {
        type: defendingType,
        effectiveness,
        multiplier: effectiveness === 0 ? '0x' : effectiveness === 0.5 ? '0.5x' : effectiveness === 1 ? '1x' : '2x'
      };
    });
  };
  
  const typeEffectiveness = getTypeEffectivenessForType(type);
  
  // Categorize effectiveness
  const weakTo = typeEffectiveness.filter(e => e.effectiveness >= 2);
  const resists = typeEffectiveness.filter(e => e.effectiveness === 0.5);
  const immune = typeEffectiveness.filter(e => e.effectiveness === 0);
  
  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const tooltipHeight = 200; // Approximate tooltip height
          const tooltipWidth = 256; // w-64 = 16rem = 256px
          const margin = 16; // 1rem margin from edge
          
          // Check vertical positioning
          if (rect.top < tooltipHeight + 20) {
            setTooltipPosition('bottom');
          } else {
            setTooltipPosition('top');
          }
          
          // Find the actual content container bounds - try multiple selectors
          let contentContainer = e.currentTarget.closest('.max-w-7xl, .container, main, [class*="max-w"]');
          
          // If no container found, try to find the main content area
          if (!contentContainer) {
            contentContainer = document.body;
          }
          
          const containerRect = contentContainer.getBoundingClientRect();
          const tooltipLeft = rect.left - containerRect.left;
          const tooltipRight = tooltipLeft + tooltipWidth;
          const containerWidth = containerRect.width;
          
          // Check horizontal positioning
          if (tooltipRight > containerWidth - margin) {
            setTooltipAlignment('right');
          } else if (tooltipLeft < margin) {
            setTooltipAlignment('left');
          } else {
            // Center is fine
            setTooltipAlignment('center');
          }
          
          setShowTooltip(true);
        }}
        onMouseLeave={() => setShowTooltip(false)}
        className="inline-block"
      >
        <TypeBadge type={type} className={className} />
      </div>
      
      {showTooltip && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`absolute z-50 max-w-[min(16rem,calc(100vw-4rem))] ${
            tooltipPosition === 'top' 
              ? 'bottom-full mb-2' 
              : 'top-full mt-2'
          } ${
            tooltipAlignment === 'left'
              ? 'left-0'
              : tooltipAlignment === 'right'
              ? 'right-0'
              : 'left-1/2 transform -translate-x-1/2'
          }`}
        >
          <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs rounded-lg p-2 shadow-xl border border-gray-200 dark:border-gray-600 w-64 max-w-[min(16rem,calc(100vw-4rem))]">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <TypeBadge type={type} className="text-sm px-2 py-1" />
              <span className="text-gray-600 dark:text-gray-400 text-xs font-medium">Type Effectiveness</span>
            </div>
            
            {/* Three panels layout */}
            <div className="grid grid-cols-3 gap-1">
              {/* Weak to (2x+) */}
              <div className="bg-red-50 dark:bg-red-900/20 rounded p-1.5">
                <h4 className="font-semibold text-xs mb-1 text-red-800 dark:text-red-200">Weak to (2x+)</h4>
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
              
              {/* Resists (0.5x) */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded p-1.5">
                <h4 className="font-semibold text-xs mb-1 text-green-800 dark:text-green-200">Resists (0.5x)</h4>
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
              
              {/* Immune (0x) */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-1.5">
                <h4 className="font-semibold text-xs mb-1 text-gray-800 dark:text-gray-200">Immune (0x)</h4>
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
        </motion.div>
      )}
    </div>
  );
}
