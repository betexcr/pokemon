'use client'

import { useEffect, useRef } from 'react'

export default function ServiceWorkerRegistration() {
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    if (process.env.NODE_ENV === 'development') {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => registration.unregister().catch(() => {}))
      }).catch(() => {})
      if ('caches' in window) {
        caches.keys().then(keys => Promise.all(keys.map(key => caches.delete(key)))).catch(() => {})
      }
      return
    }

    let updateFoundHandler: (() => void) | null = null
    let messageHandler: ((event: MessageEvent) => void) | null = null

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
        registrationRef.current = registration

        updateFoundHandler = () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content available -- toast system or manual refresh handles this
              }
            })
          }
        }

        messageHandler = () => {
          // Cache update notifications handled by the app
        }

        registration.addEventListener('updatefound', updateFoundHandler)
        navigator.serviceWorker.addEventListener('message', messageHandler)
      } catch {
        // SW registration failed silently
      }
    }

    registerSW()

    return () => {
      if (registrationRef.current && updateFoundHandler) {
        registrationRef.current.removeEventListener('updatefound', updateFoundHandler)
      }
      if (messageHandler) {
        navigator.serviceWorker.removeEventListener('message', messageHandler)
      }
    }
  }, [])

  return null
}
