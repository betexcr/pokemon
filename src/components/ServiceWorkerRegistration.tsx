'use client'

import { useEffect } from 'react'

/**
 * Unregisters all service workers so the site is not installable as a PWA
 * (no offline “app” install / address-bar install icon from Chromium).
 */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister().catch(() => {})
        })
      })
      .catch(() => {})
  }, [])

  return null
}
