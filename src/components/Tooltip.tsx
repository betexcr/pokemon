import { ReactNode, useEffect, useRef, useState } from 'react'

interface TooltipProps {
  children: ReactNode
  content: string
  className?: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  maxWidth?: string
  type?: string // For type-based styling
  variant?: 'default' | 'ability' | 'move' | 'stat'
  containViewport?: boolean
  damageClass?: 'physical' | 'special' | 'status'
}

export default function Tooltip({ 
  children, 
  content, 
  className = '', 
  position = 'bottom',
  maxWidth = 'w-96',
  type = 'normal',
  variant = 'default',
  containViewport = true,
  damageClass
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

  // Runtime-resolved position and fixed coordinates for viewport containment
  const [resolvedPosition, setResolvedPosition] = useState<typeof position>(position)
  const [fixedCoords, setFixedCoords] = useState<{ top: number; left: number } | null>(null)
  const [anchorCenter, setAnchorCenter] = useState<number | null>(null)

  const anchorRef = useRef<HTMLDivElement | null>(null)
  const tipRef = useRef<HTMLDivElement | null>(null)

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
      }
    }
    document.addEventListener('mousedown', handleOutside, true)
    document.addEventListener('touchstart', handleOutside, true)
    return () => {
      document.removeEventListener('mousedown', handleOutside, true)
      document.removeEventListener('touchstart', handleOutside, true)
    }
  }, [isOpen, isLatched])

  // Opacity behavior for hover and open state
  // When containing to viewport with fixed positioning, avoid hover-driven opacity to prevent
  // a one-frame flash at the viewport corner before coordinates are computed.
  const hoverOpacityClass = containViewport ? '' : (variant === 'stat' ? 'group-hover:opacity-80' : 'group-hover:opacity-100')
  const openOpacityClass = isOpen ? (variant === 'stat' ? 'opacity-80' : 'opacity-100') : 'opacity-0'
  // Hide the tooltip until fixed coordinates are ready to ensure it's never shown in the corner
  const visibilityClass = containViewport && isOpen && !fixedCoords ? 'invisible' : ''

  // Type-based background styling
  const getTypeBackground = () => {
    if (variant === 'default') return 'bg-gray-900/95 backdrop-blur-sm'
    
    // White base with type color overlay gradient
    return 'bg-white border border-gray-200/50'
  }

  const getTypeAccent = () => {
    if (variant === 'default') return 'border-gray-700'
    return 'border-gray-200/50'
  }

  const getTextColor = () => {
    if (variant === 'default') return 'text-white'
    return 'text-gray-800'
  }

  // Get type color for overlay
  const getTypeOverlay = () => {
    if (variant === 'default' || !type) return {}
    
    // White base background with type color gradient overlay
    return {
      background: `linear-gradient(180deg, color-mix(in oklab, var(--type-${type}) 14%, transparent) 0%, transparent 60%), white`
    }
  }

  // Format content for better readability
  const formatContent = (text: string) => {
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
    return text
  }

  // Compute fixed coordinates to keep tooltip inside viewport
  useEffect(() => {
    if (!containViewport) {
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

  return (
    <div 
      className={`relative group ${className}`}
      ref={anchorRef}
      onMouseEnter={() => { setFixedCoords(null); setIsOpen(true) }}
      onMouseLeave={() => { if (!isLatched) setIsOpen(false) }}
      onClick={() => { 
        setIsOpen(prev => {
          const next = !prev
          if (next) setFixedCoords(null)
          return next
        })
        setIsLatched(prev => !prev ? true : false) 
      }}
      onTouchStart={(e) => {
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
      }}
      onTouchEnd={() => {
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
      }}
    >
      {children}
      <div 
        ref={tipRef}
        className={`pointer-events-auto overflow-auto ${containViewport ? 'fixed' : 'absolute'} z-[9999] ${!containViewport ? positionClasses[position] : ''} ${maxWidth} rounded-2xl p-5 text-sm leading-relaxed shadow-2xl ring-1 ring-gray-200/20 ${openOpacityClass} ${hoverOpacityClass} ${visibilityClass} transition-opacity duration-200 ease-in-out ${getTypeBackground()} ${getTypeAccent()} ${getTextColor()} ${!containViewport && variant==='move' ? 'left-1/2 -translate-x-1/2' : ''}`}
        style={containViewport && fixedCoords ? { 
          ...getTypeOverlay(), 
          top: fixedCoords.top, 
          left: fixedCoords.left, 
          maxHeight: `calc(100vh - ${marginPx * 2}px)`, 
          maxWidth: `calc(100vw - ${marginPx * 2}px)`
        } : { 
          ...getTypeOverlay(), 
          // Park offscreen while waiting for measurement to avoid top-left flashes
          top: containViewport ? -9999 : undefined as unknown as number, 
          left: containViewport ? -9999 : undefined as unknown as number 
        }}
      >
        <div className="space-y-3">
          {variant !== 'default' && (
            <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
              {type && (
                <div 
                  className="w-4 h-4 rounded-lg shadow-sm"
                  style={{ backgroundColor: `var(--type-${type})` }}
                />
              )}
              <span className="text-sm font-semibold text-gray-700 capitalize">
                {variant === 'ability' ? 'Ability' : variant === 'move' ? (type ? type : 'Move') : variant === 'stat' ? 'Stat' : ''}
              </span>
              {variant === 'move' && (
                <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full border bg-gray-50 capitalize">
                  {damageClass || 'status'}
                </span>
              )}
            </div>
          )}
          <div className="text-sm leading-relaxed text-gray-800">
            {formatContent(content)}
          </div>
        </div>
        
        {/* Modern Arrow */}
        <div className={`absolute ${resolvedPosition === 'top' ? 'top-full left-1/2 -translate-x-1/2' : 
                           resolvedPosition === 'bottom' ? 'bottom-full left-1/2 transform -translate-x-1/2' :
                           resolvedPosition === 'left' ? 'left-full top-1/2 transform -translate-y-1/2' :
                           'right-full top-1/2 transform -translate-y-1/2'} 
                    w-3 h-3 rotate-45 ${
                      variant === 'default' ? 'bg-gray-900' : 'bg-white'
                    } shadow-lg`} />
      </div>
    </div>
  )
}
