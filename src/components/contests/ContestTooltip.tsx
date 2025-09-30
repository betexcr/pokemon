'use client'

import { useState, useRef, useEffect } from 'react'
import { Info, Star, Heart, Zap, Sparkles } from 'lucide-react'

interface ContestTooltipProps {
  content: string
  title?: string
  icon?: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  children: React.ReactNode
  className?: string
}

export default function ContestTooltip({ 
  content, 
  title, 
  icon, 
  position = 'top', 
  delay = 500,
  children,
  className = ''
}: ContestTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  const showTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay)
  }

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsVisible(false)
  }

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect()
      const tooltipRect = tooltipRef.current.getBoundingClientRect()
      
      let x = 0
      let y = 0

      switch (position) {
        case 'top':
          x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2
          y = triggerRect.top - tooltipRect.height - 8
          break
        case 'bottom':
          x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2
          y = triggerRect.bottom + 8
          break
        case 'left':
          x = triggerRect.left - tooltipRect.width - 8
          y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2
          break
        case 'right':
          x = triggerRect.right + 8
          y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2
          break
      }

      // Keep tooltip within viewport
      x = Math.max(8, Math.min(x, window.innerWidth - tooltipRect.width - 8))
      y = Math.max(8, Math.min(y, window.innerHeight - tooltipRect.height - 8))

      setTooltipPosition({ x, y })
    }
  }, [isVisible, position])

  const getArrowClass = () => {
    switch (position) {
      case 'top': return 'border-t-white dark:border-t-gray-800'
      case 'bottom': return 'border-b-white dark:border-b-gray-800'
      case 'left': return 'border-l-white dark:border-l-gray-800'
      case 'right': return 'border-r-white dark:border-r-gray-800'
    }
  }

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className={className}
      >
        {children}
      </div>

      {isVisible && (
        <div
          ref={tooltipRef}
          className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3 max-w-xs"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
          }}
        >
          {/* Arrow */}
          <div className={`absolute w-0 h-0 border-4 border-transparent ${getArrowClass()}`}
            style={{
              [position === 'top' ? 'bottom' : position === 'bottom' ? 'top' : position === 'left' ? 'right' : 'left']: '-8px',
              [position === 'top' || position === 'bottom' ? 'left' : 'top']: '50%',
              transform: position === 'top' || position === 'bottom' ? 'translateX(-50%)' : 'translateY(-50%)'
            }}
          />

          {/* Content */}
          <div className="flex items-start gap-2">
            {icon && (
              <div className="text-blue-500 mt-0.5">
                {icon}
              </div>
            )}
            <div className="flex-1">
              {title && (
                <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm mb-1">
                  {title}
                </h4>
              )}
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                {content}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Specialized tooltip components for different contest elements
export function PokeblockTooltip({ children }: { children: React.ReactNode }) {
  return (
    <ContestTooltip
      content="Feed this Pokéblock to boost your Pokémon's contest stats! Each color corresponds to a different stat. Rainbow blocks boost all stats at once."
      title="Pokéblock"
      icon={<Sparkles className="w-4 h-4" />}
      position="top"
    >
      {children}
    </ContestTooltip>
  )
}

export function MoveTooltip({ children }: { children: React.ReactNode }) {
  return (
    <ContestTooltip
      content="Click to use this move in the Talent Round. Moves matching your contest category give bonus hearts and fill the Excite Meter!"
      title="Appeal Move"
      icon={<Zap className="w-4 h-4" />}
      position="top"
    >
      {children}
    </ContestTooltip>
  )
}

export function ExciteMeterTooltip({ children }: { children: React.ReactNode }) {
  return (
    <ContestTooltip
      content="The Excite Meter fills when you use moves matching your contest category. When full, your next move becomes a Spectacular Talent with massive bonus points!"
      title="Excite Meter"
      icon={<Star className="w-4 h-4" />}
      position="left"
    >
      {children}
    </ContestTooltip>
  )
}

export function CategoryTooltip({ children }: { children: React.ReactNode }) {
  return (
    <ContestTooltip
      content="Choose a contest category to compete in. Each category has unique moves and strategies. Pick the one that matches your Pokémon's strengths!"
      title="Contest Category"
      icon={<Heart className="w-4 h-4" />}
      position="top"
    >
      {children}
    </ContestTooltip>
  )
}
