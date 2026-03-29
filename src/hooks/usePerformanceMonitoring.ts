/**
 * Performance Monitoring Hook
 * 
 * Tracks rendering, scrolling, and interaction performance in the Pokedex view
 */

'use client'

import { useEffect, useRef, useCallback } from 'react'

export interface PerformanceMetrics {
  fcp?: number // First Contentful Paint
  lcp?: number // Largest Contentful Paint
  fid?: number // First Input Delay
  cls?: number // Cumulative Layout Shift
  averageScrollFps?: number
  averageLoadTime?: number
  totalFrameDrops?: number
}

/**
 * Hook to monitor Pokedex view performance
 */
export function usePokedexPerformanceMonitoring() {
  const metricsRef = useRef<PerformanceMetrics>({})
  const frameCountRef = useRef(0)
  const frameDropCountRef = useRef(0)
  const lastFrameTimeRef = useRef(Date.now())
  const scrollFpsArrayRef = useRef<number[]>([])
  const rafRef = useRef<number | null>(null)

  // Monitor Web Vitals (FCP, LCP)
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Function to handle visible entries
    const handleVisibleEntries = (entryList: any[]) => {
      for (const entry of entryList) {
        if (entry.name === 'first-contentful-paint') {
          metricsRef.current.fcp = entry.startTime
        }
        if (entry.entryType === 'largest-contentful-paint') {
          metricsRef.current.lcp = entry.renderTime || entry.loadTime
        }
      }
    }

    // Try modern performance observer
    if ('PerformanceObserver' in window) {
      try {
        // Observe First Contentful Paint
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          for (const entry of entries) {
            if (entry.name === 'first-contentful-paint') {
              metricsRef.current.fcp = entry.startTime
            }
          }
        })
        fcpObserver.observe({ type: 'paint', buffered: true })

        // Observe Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1] as any
          metricsRef.current.lcp = lastEntry.renderTime || lastEntry.loadTime
        })
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })

        return () => {
          fcpObserver.disconnect()
          lcpObserver.disconnect()
        }
      } catch (error) {
        console.warn('Performance Observer not fully supported:', error)
      }
    }
  }, [])

  // Monitor scroll FPS
  const monitorScrollFps = useCallback(() => {
    if (typeof window === 'undefined') return

    let lastScrollTime = Date.now()
    let scrollFpsCount = 0

    const measureScrollFps = () => {
      const now = Date.now()
      const delta = now - lastScrollTime

      // Calculate FPS (assuming 60fps = 16.67ms per frame)
      if (delta > 0) {
        const fps = Math.round(1000 / delta)
        scrollFpsCount++

        if (scrollFpsCount % 10 === 0) {
          // Sample every 10 frames
          scrollFpsArrayRef.current.push(fps)
        }

        // Detect frame drops
        if (delta > 33) {
          // More than 33ms = less than 30fps = frame drop
          frameDropCountRef.current++
        }
      }

      lastScrollTime = now
      rafRef.current = requestAnimationFrame(measureScrollFps)
    }

    const scrollContainer = document.querySelector('[data-main-scroll]')
    if (!scrollContainer) return

    let isScrolling = false
    const startMonitoring = () => {
      if (!isScrolling) {
        isScrolling = true
        rafRef.current = requestAnimationFrame(measureScrollFps)

        // Stop monitoring after scroll ends
        setTimeout(() => {
          isScrolling = false
          if (rafRef.current) {
            cancelAnimationFrame(rafRef.current)
            rafRef.current = null
          }

          // Calculate average FPS
          if (scrollFpsArrayRef.current.length > 0) {
            const avgFps =
              scrollFpsArrayRef.current.reduce((a, b) => a + b, 0) / scrollFpsArrayRef.current.length
            metricsRef.current.averageScrollFps = avgFps
          }
        }, 100)
      }
    }

    scrollContainer.addEventListener('scroll', startMonitoring, { passive: true })

    return () => {
      scrollContainer.removeEventListener('scroll', startMonitoring)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  // Start monitoring when component mounts
  useEffect(() => {
    return monitorScrollFps()
  }, [monitorScrollFps])

  // Return metrics getter
  const getMetrics = useCallback((): PerformanceMetrics => {
    return { ...metricsRef.current }
  }, [])

  return { getMetrics, metricsRef }
}
