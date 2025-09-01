'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface ViewTransitionProps {
  children: React.ReactNode
  className?: string
  transitionName?: string
}

export default function ViewTransition({ 
  children, 
  className = '',
  transitionName = 'pokemon-transition'
}: ViewTransitionProps) {
  const elementRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    // Add view transition styles
    const style = document.createElement('style')
    style.textContent = `
      .${transitionName} {
        view-transition-name: ${transitionName};
      }
      
      @keyframes fade-in {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes fade-out {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-20px); }
      }
      
      .${transitionName}-enter {
        animation: fade-in 0.3s ease-out;
      }
      
      .${transitionName}-exit {
        animation: fade-out 0.3s ease-in;
      }
    `
    document.head.appendChild(style)

    // Add enter animation class
    element.classList.add(`${transitionName}-enter`)

    // Remove animation class after animation completes
    const handleAnimationEnd = () => {
      element.classList.remove(`${transitionName}-enter`)
    }

    element.addEventListener('animationend', handleAnimationEnd)

    return () => {
      element.removeEventListener('animationend', handleAnimationEnd)
      document.head.removeChild(style)
    }
  }, [transitionName])

  return (
    <div 
      ref={elementRef}
      className={`${transitionName} ${className}`}
    >
      {children}
    </div>
  )
}

// Hook for handling view transitions
export function useViewTransition() {
  const router = useRouter()

  const navigateWithTransition = (href: string, transitionName?: string) => {
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      // Use native view transitions if available
      (document as { startViewTransition: (callback: () => void) => void }).startViewTransition(() => {
        router.push(href)
      })
    } else {
      // Fallback to regular navigation
      router.push(href)
    }
  }

  return { navigateWithTransition }
}
