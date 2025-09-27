"use client";

import { ReactNode, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface TooltipProps {
  children: ReactNode
  content: ReactNode | string
  className?: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  maxWidth?: string
  type?: string // For type-based styling
  variant?: 'default' | 'ability' | 'move' | 'stat' | 'japanese'
  containViewport?: boolean
  damageClass?: 'physical' | 'special' | 'status'
  followCursor?: boolean
  cursorOffset?: { x?: number; y?: number }
  title?: string
  romaji?: string
  meaning?: string
  explanation?: string
}

export default function Tooltip({ 
  children, 
  content, 
  className = '', 
  position = 'bottom',
  maxWidth = 'max-w-96',
  type = 'normal',
  variant = 'default',
  containViewport = true,
  damageClass,
  followCursor = false,
  cursorOffset,
  title,
  romaji,
  meaning,
  explanation
}: TooltipProps) {
  const positionClasses = {
    top: 'bottom-full mb-2 left-1/2 transform -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 transform -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 transform -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 transform -translate-y-1/2'
  }

  // Local open state to support tap/click/long-press on mobile in addition to hover
  const [isOpen, setIsOpen] = useState(false)
  const [isLatched, setIsLatched] = useState(false)
  const isTouchingRef = useRef(false)
  const longPressTimerRef = useRef<number | null>(null)
  const longPressActiveRef = useRef(false)
  const hoverTimerRef = useRef<number | null>(null)
  const wasDismissedByClickRef = useRef(false)
  const lastMousePositionRef = useRef<{ x: number; y: number } | null>(null)

  // Runtime-resolved position and fixed coordinates for viewport containment
  const [resolvedPosition, setResolvedPosition] = useState<typeof position>(position)
  const [fixedCoords, setFixedCoords] = useState<{ top: number; left: number } | null>(null)
  const [anchorCenter, setAnchorCenter] = useState<number | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)

  const anchorRef = useRef<HTMLElement | null>(null)
  const tipRef = useRef<HTMLDivElement | null>(null)
  // Mount flag to avoid SSR/CSR markup mismatches. We only render the portal after mount.
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  // Track dark mode from documentElement class list
  useEffect(() => {
    const el = document.documentElement
    const update = () => setIsDarkMode(el.classList.contains('dark'))
    update()
    const observer = new MutationObserver(update)
    observer.observe(el, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])


  // Close on outside click when latched
  useEffect(() => {
    if (!(isOpen && isLatched)) return
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      const a = anchorRef.current
      const t = tipRef.current
      const target = e.target as Node
      if (!a || !t) return
      if (!a.contains(target) && !t.contains(target)) {
        setIsOpen(false)
        setIsLatched(false)
        // Tooltip was dismissed by clicking outside
        wasDismissedByClickRef.current = true
      }
    }
    document.addEventListener('mousedown', handleOutside, true)
    document.addEventListener('touchstart', handleOutside, true)
    return () => {
      document.removeEventListener('mousedown', handleOutside, true)
      document.removeEventListener('touchstart', handleOutside, true)
    }
  }, [isOpen, isLatched])

  // Cleanup hover timer on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current)
      }
    }
  }, [])

  // Opacity behavior for hover and open state
  // When containing to viewport with fixed positioning, avoid hover-driven opacity to prevent
  // a one-frame flash at the viewport corner before coordinates are computed.
  const hoverOpacityClass = containViewport ? '' : (variant === 'stat' ? 'group-hover:opacity-80' : 'group-hover:opacity-100')
  const openOpacityClass = isOpen ? (variant === 'stat' ? 'opacity-80' : 'opacity-100') : 'opacity-0'
  // Hide the tooltip until fixed coordinates are ready to ensure it's never shown in the corner
  const visibilityClass = containViewport && isOpen && !fixedCoords ? 'invisible' : ''

  // Type-based background styling
  const getTypeBackground = () => {
    if (variant === 'default') {
      return isDarkMode ? 'bg-gray-900/95 backdrop-blur-sm' : 'bg-white/95 backdrop-blur-sm'
    }
    if (variant === 'japanese') {
      return isDarkMode ? 'bg-blue-900/95 border border-blue-700 backdrop-blur-sm' : 'bg-blue-50/95 border border-blue-200 backdrop-blur-sm'
    }
    if (isDarkMode) return 'bg-gray-900/95 border border-gray-700 backdrop-blur-sm'
    return 'bg-white border border-gray-200/50'
  }

  const getTypeAccent = () => {
    if (variant === 'default') {
      return isDarkMode ? 'border-gray-700' : 'border-gray-200/50'
    }
    if (variant === 'japanese') {
      return isDarkMode ? 'border-blue-700' : 'border-blue-200/50'
    }
    return isDarkMode ? 'border-gray-700' : 'border-gray-200/50'
  }

  const getTextColor = () => {
    if (variant === 'default') {
      return isDarkMode ? 'text-white' : 'text-gray-900'
    }
    if (variant === 'japanese') {
      return isDarkMode ? 'text-blue-100' : 'text-blue-900'
    }
    return isDarkMode ? 'text-gray-100' : 'text-gray-800'
  }

  const getRingColor = () => {
    if (variant === 'default') {
      return isDarkMode ? 'ring-white/10' : 'ring-gray-200/50'
    }
    if (variant === 'japanese') {
      return isDarkMode ? 'ring-blue-500/20' : 'ring-blue-300/50'
    }
    return isDarkMode ? 'ring-white/10' : 'ring-gray-200/50'
  }

  // Get type color for overlay
  const getTypeOverlay = () => {
    if (variant === 'default' || !type) return {}
    const t = String(type).toLowerCase()
    const base = isDarkMode ? 'rgba(17,24,39,0.95)' : 'white'
    return {
      background: `linear-gradient(180deg, color-mix(in oklab, var(--type-${t}) 14%, transparent) 0%, transparent 60%), ${base}`
    }
  }

  // Format content for better readability
  const formatContent = (text: ReactNode | string) => {
    if (typeof text !== 'string') return text
    if (variant === 'move' || variant === 'ability') {
      // Split by periods and add line breaks for better readability
      return text.split('. ').map((sentence, index) => (
        <span key={index}>
          {sentence.trim()}
          {index < text.split('. ').length - 1 && (
            <>
              .<br />
            </>
          )}
        </span>
      ))
    }
    if (variant === 'japanese') {
      return (
        <div className="space-y-3">
          <div className="text-lg font-semibold text-center">{text}</div>
          {romaji && (
            <div className="text-center">
              <div className="text-sm font-medium opacity-80">Romaji</div>
              <div className="text-base font-mono">{romaji}</div>
            </div>
          )}
          {meaning && (
            <div className="text-center">
              <div className="text-sm font-medium opacity-80">Meaning</div>
              <div className="text-base font-medium">{meaning}</div>
            </div>
          )}
          {explanation && (
            <div className="text-center">
              <div className="text-sm font-medium opacity-80">Explanation</div>
              <div className="text-sm leading-relaxed">{explanation}</div>
            </div>
          )}
        </div>
      )
    }
    return text
  }

  // Compute fixed coordinates to keep tooltip inside viewport
  useEffect(() => {
    if (!containViewport || followCursor) {
      setFixedCoords(null)
      setResolvedPosition(position)
      return
    }

    if (!isOpen) return

    const compute = () => {
      const anchor = anchorRef.current
      const tip = tipRef.current
      if (!anchor || !tip) return

      const anchorRect = anchor.getBoundingClientRect()

      // Ensure tooltip is visible to measure size; temporarily set visibility
      tip.style.visibility = 'hidden'
      tip.style.position = 'fixed'
      tip.style.top = '0px'
      tip.style.left = '0px'
      const tipRect = tip.getBoundingClientRect()
      const vw = window.innerWidth
      const vh = window.innerHeight
      const margin = 12

      let nextPos: typeof position = position
      let top = 0
      let left = 0

      const computeFor = (pos: typeof position) => {
        let t = 0, l = 0
        
        // For move tooltips, try to center over the text content rather than the entire anchor
        let centerX = anchorRect.left + anchorRect.width / 2
        if (variant === 'move') {
          // Find the text content within the anchor to get better centering
          const textElement = anchor.querySelector('span')
          if (textElement) {
            const textRect = textElement.getBoundingClientRect()
            centerX = textRect.left + textRect.width / 2
          }
        }
        setAnchorCenter(centerX)
        
        if (pos === 'bottom') {
          t = anchorRect.bottom + margin
          l = centerX - tipRect.width / 2
        } else if (pos === 'top') {
          t = anchorRect.top - tipRect.height - margin
          l = centerX - tipRect.width / 2
        } else if (pos === 'left') {
          t = anchorRect.top + anchorRect.height / 2 - tipRect.height / 2
          l = anchorRect.left - tipRect.width - margin
        } else { // right
          t = anchorRect.top + anchorRect.height / 2 - tipRect.height / 2
          l = anchorRect.right + margin
        }
        // Clamp horizontally and vertically
        l = Math.max(margin, Math.min(l, vw - tipRect.width - margin))
        t = Math.max(margin, Math.min(t, vh - tipRect.height - margin))
        return { t, l }
      }

      // Try desired position and its opposite
      const tryOrder: typeof position[] = [position, position === 'top' ? 'bottom' : position === 'bottom' ? 'top' : position === 'left' ? 'right' : 'left']

      for (const pos of tryOrder) {
        const { t, l } = computeFor(pos)
        nextPos = pos
        top = t
        left = l
        break
      }

      tip.style.visibility = ''

      setResolvedPosition(nextPos)
      setFixedCoords({ top, left })
    }

    compute()
    const onResize = () => compute()
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onResize, true)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onResize, true)
    }
  }, [isOpen, position, content, containViewport])

  const marginPx = 12

  const tipElement = (
      <div 
        ref={tipRef}
        className={`pointer-events-auto ${containViewport ? 'fixed' : 'absolute'} z-[2147483647] ${!containViewport ? positionClasses[resolvedPosition] : ''} ${maxWidth} rounded-2xl p-5 text-sm leading-relaxed shadow-2xl ring-1 ${getRingColor()} ${openOpacityClass} ${hoverOpacityClass} ${visibilityClass} transition-opacity duration-200 ease-in-out ${getTypeBackground()} ${getTypeAccent()} ${getTextColor()} ${!containViewport && variant==='move' ? 'left-1/2 -translate-x-1/2' : ''}`}
        style={containViewport && fixedCoords ? { 
          ...getTypeOverlay(), 
          top: fixedCoords.top, 
          left: fixedCoords.left, 
          maxHeight: `calc(100vh - ${marginPx * 2}px)`, 
          maxWidth: `calc(100vw - ${marginPx * 2}px)`
        } : { 
          ...getTypeOverlay(), 
          top: containViewport ? -9999 : undefined as unknown as number, 
          left: containViewport ? -9999 : undefined as unknown as number 
        }}
      >
        <div className="space-y-3">
          {variant !== 'default' && variant !== 'japanese' && (
            <div className={`flex items-center gap-3 pb-2 border-b border-gray-100`}
            >
              {type && (
                <div 
                  className="w-4 h-4 rounded-lg shadow-sm"
                  style={{ backgroundColor: `var(--type-${String(type).toLowerCase()})` }}
                />
              )}
              <span className={`text-sm font-semibold capitalize text-gray-700`}>
                {title || (variant === 'ability' ? 'Ability' : variant === 'move' ? (type ? type : 'Move') : variant === 'stat' ? 'Stat' : '')}
              </span>
              {variant === 'move' && (
                <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${
                  isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-gray-100 border-gray-200 text-gray-700'
                }`}>
                  {damageClass || 'status'}
                </span>
              )}
            </div>
          )}
          {variant === 'japanese' && (
            <div className="text-center pb-2 border-b border-blue-200/50 dark:border-blue-700/50">
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                {title || 'Japanese Name'}
              </span>
            </div>
          )}
          <div className={`text-sm leading-relaxed ${variant === 'default' ? (isDarkMode ? 'text-gray-100' : 'text-gray-900') : variant === 'japanese' ? (isDarkMode ? 'text-blue-100' : 'text-blue-900') : 'text-gray-800'}`}>
            {formatContent(content)}
          </div>
        </div>
        <div className={`absolute ${resolvedPosition === 'top' ? 'top-full left-1/2 -translate-x-1/2' : 
                           resolvedPosition === 'bottom' ? 'bottom-full left-1/2 transform -translate-x-1/2' :
                           resolvedPosition === 'left' ? 'left-full top-1/2 transform -translate-y-1/2' :
                           'right-full top-1/2 transform -translate-y-1/2'} 
                    w-3 h-3 rotate-45 ${
                      variant === 'default' ? (isDarkMode ? 'bg-gray-900' : 'bg-white') : 
                      variant === 'japanese' ? (isDarkMode ? 'bg-blue-900' : 'bg-blue-50') : 
                      (isDarkMode ? 'bg-gray-900' : 'bg-white')
                    } shadow-lg`} />
      </div>
  )

  // Check if children contain SVG elements
  const isSVGElement = (element: ReactNode): boolean => {
    if (typeof element === 'object' && element !== null && 'type' in element) {
      const elementType = (element as any).type
      return typeof elementType === 'string' && (
        elementType === 'g' || 
        elementType === 'circle' || 
        elementType === 'rect' || 
        elementType === 'path' || 
        elementType === 'svg' ||
        elementType === 'text' ||
        elementType === 'line' ||
        elementType === 'polygon' ||
        elementType === 'ellipse'
      )
    }
    return false
  }

  const isSVG = isSVGElement(children)

  // Helper functions for hover with delay
  const handleMouseEnter = (e: React.MouseEvent) => {
    // Check if mouse has moved since last dismissal
    const currentX = e.clientX
    const currentY = e.clientY
    const hasMouseMoved = !lastMousePositionRef.current || 
      Math.abs(currentX - lastMousePositionRef.current.x) > 5 || 
      Math.abs(currentY - lastMousePositionRef.current.y) > 5

    // Don't show tooltip if it was dismissed by click and mouse hasn't moved
    if (wasDismissedByClickRef.current && !hasMouseMoved) {
      return
    }

    // Reset dismissal state if mouse has moved
    if (hasMouseMoved) {
      wasDismissedByClickRef.current = false
    }

    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
    }
    hoverTimerRef.current = window.setTimeout(() => {
      setFixedCoords(null)
      setIsOpen(true)
    }, 500) // 500ms delay
  }

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
    if (!isLatched) setIsOpen(false)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    // Update mouse position
    lastMousePositionRef.current = { x: e.clientX, y: e.clientY }
  }

  const WrapperComponent = isSVG ? 'g' : 'span'
  const wrapperProps: any = isSVG ? {
    className: `group ${className}`,
    ref: anchorRef as unknown as React.RefObject<SVGGElement>,
    onMouseMove: (e: React.MouseEvent<SVGGElement>) => {
      if (!followCursor || !containViewport) return
      const margin = 12
      const tip = tipRef.current
      let width = 220, height = 60
      if (tip) {
        const prevVis = tip.style.visibility
        const prevPos = tip.style.position
        tip.style.visibility = 'hidden'
        tip.style.position = 'fixed'
        tip.style.top = '0px'
        tip.style.left = '0px'
        const r = tip.getBoundingClientRect()
        width = r.width
        height = r.height
        tip.style.visibility = prevVis
        tip.style.position = prevPos
      }
      const vw = window.innerWidth
      const vh = window.innerHeight
      const offX = cursorOffset?.x ?? 12
      const offY = cursorOffset?.y ?? 12
      let left = e.clientX + offX
      let top = e.clientY + offY
      left = Math.max(margin, Math.min(left, vw - width - margin))
      top = Math.max(margin, Math.min(top, vh - height - margin))
      setFixedCoords({ top, left })
      if (!isOpen) setIsOpen(true)
    },
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onClick: () => { 
      setIsOpen(prev => {
        const next = !prev
        if (next) {
          setFixedCoords(null)
        } else {
          // Tooltip was dismissed by clicking
          wasDismissedByClickRef.current = true
        }
        return next
      })
      setIsLatched(prev => !prev ? true : false) 
    }
  } : {
    className: `relative inline-block align-baseline group ${className}`,
    ref: anchorRef as unknown as React.RefObject<HTMLSpanElement>,
    onMouseMove: (e: React.MouseEvent<HTMLSpanElement>) => {
      if (!followCursor || !containViewport) return
      const margin = 12
      const tip = tipRef.current
      let width = 220, height = 60
      if (tip) {
        const prevVis = tip.style.visibility
        const prevPos = tip.style.position
        tip.style.visibility = 'hidden'
        tip.style.position = 'fixed'
        tip.style.top = '0px'
        tip.style.left = '0px'
        const r = tip.getBoundingClientRect()
        width = r.width
        height = r.height
        tip.style.visibility = prevVis
        tip.style.position = prevPos
      }
      const vw = window.innerWidth
      const vh = window.innerHeight
      const offX = cursorOffset?.x ?? 12
      const offY = cursorOffset?.y ?? 12
      let left = e.clientX + offX
      let top = e.clientY + offY
      left = Math.max(margin, Math.min(left, vw - width - margin))
      top = Math.max(margin, Math.min(top, vh - height - margin))
      setFixedCoords({ top, left })
      if (!isOpen) setIsOpen(true)
    },
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onClick: () => { 
      setIsOpen(prev => {
        const next = !prev
        if (next) {
          setFixedCoords(null)
        } else {
          // Tooltip was dismissed by clicking
          wasDismissedByClickRef.current = true
        }
        return next
      })
      setIsLatched(prev => !prev ? true : false) 
    },
    onTouchStart: (e: React.TouchEvent<HTMLSpanElement>) => {
      isTouchingRef.current = true
      longPressActiveRef.current = false
      if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = window.setTimeout(() => {
        if (isTouchingRef.current) {
          longPressActiveRef.current = true
          setFixedCoords(null)
          setIsOpen(true)
          setIsLatched(false) // temporary while holding
        }
      }, 350)
    },
    onTouchEnd: () => {
      isTouchingRef.current = false
      if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current)
      if (longPressActiveRef.current) {
        longPressActiveRef.current = false
        setIsOpen(false)
        setIsLatched(false)
      } else {
        // Single tap on mobile - show tooltip and latch it
        setFixedCoords(null)
        setIsOpen(true)
        setIsLatched(true)
      }
    }
  }

  return (
    <WrapperComponent {...wrapperProps}>
      {children}
      {/* Avoid SSR hydration mismatches: render tooltip only after mount, and only when needed */}
      {mounted && (isOpen || followCursor) && (
        containViewport ? createPortal(tipElement, document.body) : tipElement
      )}
    </WrapperComponent>
  )
}
