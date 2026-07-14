'use client'

import { useEffect } from 'react'
import { trackEvent } from '@/lib/analytics'

/**
 * Reports coarse Web Vitals via the analytics beacon when available.
 */
export default function PerformanceMonitor() {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') return

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'largest-contentful-paint') {
            trackEvent('page_view', {
              metric: 'LCP',
              value: Math.round(entry.startTime),
            })
          }
        }
      })
      observer.observe({ type: 'largest-contentful-paint', buffered: true })
      return () => observer.disconnect()
    } catch {
      return undefined
    }
  }, [])

  return null
}
