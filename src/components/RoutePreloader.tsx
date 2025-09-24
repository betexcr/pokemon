'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

// Critical routes that should be preloaded for instant navigation
const CRITICAL_ROUTES = [
  '/team',
  '/battle', 
  '/top50',
  '/compare',
  '/trends',
  '/type-matchups',
  '/evolutions',
  '/checklist',
  '/usage'
]

export default function RoutePreloader() {
  const router = useRouter()

  useEffect(() => {
    // Preload critical routes after a short delay to avoid blocking initial render
    const preloadRoutes = () => {
      CRITICAL_ROUTES.forEach(route => {
        router.prefetch(route)
      })
    }

    // Preload routes after 1 second to avoid blocking initial page load
    const timeoutId = setTimeout(preloadRoutes, 1000)

    return () => clearTimeout(timeoutId)
  }, [router])

  return null // This component doesn't render anything
}
