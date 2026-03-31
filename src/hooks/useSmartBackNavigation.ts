'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

interface SmartBackNavigationOptions {
  defaultBackLink: string
  defaultBackLabel: string
}

export function useSmartBackNavigation(_options?: SmartBackNavigationOptions) {
  return { backLink: '/', backLabel: 'Back to PokéDex' }
}

// Hook to track navigation for smart back navigation
function useNavigationTracker() {
  const pathname = usePathname()

  useEffect(() => {
    // Store the current path as referrer when navigating away
    const handleBeforeUnload = () => {
      sessionStorage.setItem('navigation_referrer', pathname)
    }

    // Listen for clicks on links to store referrer before navigation
    const handleLinkClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const link = target.closest('a')
      if (link && link.href && !link.href.startsWith('javascript:')) {
        sessionStorage.setItem('navigation_referrer', pathname)
      }
    }

    document.addEventListener('click', handleLinkClick)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      document.removeEventListener('click', handleLinkClick)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      sessionStorage.setItem('navigation_referrer', pathname)
    }
  }, [pathname])
}

// Hook to store referrer when page loads
export function useReferrerStorage() {
  const pathname = usePathname()

  useEffect(() => {
    // Store the current path as the referrer for future navigation
    sessionStorage.setItem('navigation_referrer', pathname)
  }, [pathname])
}
