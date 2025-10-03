'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
          })

          console.log('Service Worker registered successfully:', registration)

          // Handle updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content is available, show update notification
                  console.log('New content is available, please refresh.')
                  
                  // You could show a toast notification here
                  if (confirm('New version available! Refresh to update?')) {
                    window.location.reload()
                  }
                }
              })
            }
          })

          // Handle service worker messages
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'CACHE_UPDATED') {
              console.log('Cache updated:', event.data.payload)
            }
          })

        } catch (error) {
          console.error('Service Worker registration failed:', error)
        }
      }

      registerSW()
    }
  }, [])

  return null
}
