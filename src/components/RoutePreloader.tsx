'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/** Prefetch only high-traffic destinations; avoid contending with Pokédex loads. */
const CRITICAL_ROUTES = ['/battle', '/team', '/lobby']

export default function RoutePreloader() {
  const router = useRouter()

  useEffect(() => {
    let cancelled = false
    const preloadOnIdle = () => {
      if (cancelled) return
      CRITICAL_ROUTES.forEach((route) => router.prefetch(route))
    }

    const timeoutId = window.setTimeout(() => {
      if (typeof (window as any).requestIdleCallback === 'function') {
        ;(window as any).requestIdleCallback(preloadOnIdle, { timeout: 4000 })
      } else {
        preloadOnIdle()
      }
    }, 2500)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [router])

  return null
}
