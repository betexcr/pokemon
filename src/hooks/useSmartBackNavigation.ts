'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

interface SmartBackNavigationOptions {
  defaultBackLink: string
  defaultBackLabel: string
}

export function useSmartBackNavigation({ defaultBackLink, defaultBackLabel }: SmartBackNavigationOptions) {
  const router = useRouter()
  const pathname = usePathname()
  const [backLink, setBackLink] = useState(defaultBackLink)
  const [backLabel, setBackLabel] = useState(defaultBackLabel)

  useEffect(() => {
    // Check if we have a referrer in sessionStorage
    const referrer = sessionStorage.getItem('navigation_referrer')
    
    if (referrer) {
      // If we came from the main page, go back to main page
      if (referrer === '/') {
        setBackLink('/')
        setBackLabel('Back to PokéDex')
      }
      // If we came from insights, go back to insights
      else if (referrer === '/insights') {
        setBackLink('/insights')
        setBackLabel('Back to Insights')
      }
      // For other referrers, use default
      else {
        setBackLink(defaultBackLink)
        setBackLabel(defaultBackLabel)
      }
    } else {
      // No referrer found, use default
      setBackLink(defaultBackLink)
      setBackLabel(defaultBackLabel)
    }
  }, [defaultBackLink, defaultBackLabel])

  return { backLink, backLabel }
}

// Hook to track navigation for smart back navigation
export function useNavigationTracker() {
  const pathname = usePathname()

  useEffect(() => {
    // Store the current path as referrer when navigating away
    const handleBeforeUnload = () => {
      console.log('Navigation tracker - storing referrer:', pathname)
      sessionStorage.setItem('navigation_referrer', pathname)
    }

    // Listen for clicks on links to store referrer before navigation
    const handleLinkClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const link = target.closest('a')
      if (link && link.href && !link.href.startsWith('javascript:')) {
        console.log('Navigation tracker - link clicked, storing referrer:', pathname)
        sessionStorage.setItem('navigation_referrer', pathname)
      }
    }

    // Listen for link clicks
    document.addEventListener('click', handleLinkClick)

    // Also store when the component unmounts (navigation)
    return () => {
      document.removeEventListener('click', handleLinkClick)
      console.log('Navigation tracker - component unmounting, storing referrer:', pathname)
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
