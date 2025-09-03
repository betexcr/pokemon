import { ReactNode, useState } from 'react'

interface TooltipProps {
  children: ReactNode
  content: string
  className?: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  maxWidth?: string
  type?: string // For type-based styling
  variant?: 'default' | 'ability' | 'move' | 'stat'
}

export default function Tooltip({ 
  children, 
  content, 
  className = '', 
  position = 'bottom',
  maxWidth = 'w-96',
  type = 'normal',
  variant = 'default'
}: TooltipProps) {
  const positionClasses = {
    top: 'bottom-full mb-2 left-1/2 transform -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 transform -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 transform -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 transform -translate-y-1/2'
  }

  // Local open state to support tap/click on mobile in addition to hover
  const [isOpen, setIsOpen] = useState(false)

  // Opacity behavior for hover and open state
  const hoverOpacityClass = variant === 'stat' ? 'group-hover:opacity-80' : 'group-hover:opacity-100'
  const openOpacityClass = isOpen ? (variant === 'stat' ? 'opacity-80' : 'opacity-100') : 'opacity-0'

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

  return (
    <div 
      className={`relative group ${className}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onClick={() => setIsOpen(prev => !prev)}
      onTouchStart={() => setIsOpen(prev => !prev)}
    >
      {children}
      <div 
        className={`pointer-events-none absolute z-50 ${positionClasses[position]} ${maxWidth} max-w-[95vw] rounded-2xl p-5 text-sm leading-relaxed shadow-2xl ring-1 ring-gray-200/20 ${openOpacityClass} ${hoverOpacityClass} transition-all duration-300 ease-out ${getTypeBackground()} ${getTypeAccent()} ${getTextColor()}`}
        style={getTypeOverlay()}
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
              <span className="text-sm font-semibold text-gray-700">
                {variant === 'ability' ? 'Ability' : variant === 'move' ? 'Move' : variant === 'stat' ? 'Stat' : ''}
              </span>
            </div>
          )}
          <div className="text-sm leading-relaxed text-gray-800">
            {formatContent(content)}
          </div>
        </div>
        
        {/* Modern Arrow */}
        <div className={`absolute ${position === 'top' ? 'top-full left-1/2 transform -translate-x-1/2' : 
                           position === 'bottom' ? 'bottom-full left-1/2 transform -translate-x-1/2' :
                           position === 'left' ? 'left-full top-1/2 transform -translate-y-1/2' :
                           'right-full top-1/2 transform -translate-y-1/2'} 
                    w-3 h-3 rotate-45 ${
                      variant === 'default' ? 'bg-gray-900' : 'bg-white'
                    } shadow-lg`} />
      </div>
    </div>
  )
}
