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
          console.log(`📊 First Contentful Paint: ${entry.startTime.toFixed(0)}ms`)
        }
        if (entry.entryType === 'largest-contentful-paint') {
          metricsRef.current.lcp = entry.renderTime || entry.loadTime
          console.log(
            `📊 Largest Contentful Paint: ${(entry.renderTime || entry.loadTime).toFixed(0)}ms`
          )
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
              console.log(`📊 FCP: ${entry.startTime.toFixed(0)}ms`)
            }
          }
        })
        fcpObserver.observe({ type: 'paint', buffered: true })

        // Observe Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1] as any
          metricsRef.current.lcp = lastEntry.renderTime || lastEntry.loadTime
          console.log(`📊 LCP: ${(lastEntry.renderTime || lastEntry.loadTime).toFixed(0)}ms`)
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
    let fpsCheckInterval: number

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

    const scrollContainer = document.querySelector('.flex-1.min-h-0.overflow-y-auto')
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
            console.log(
              `📊 Average Scroll FPS: ${avgFps.toFixed(1)} (${frameDropCountRef.current} frame drops)`
            )
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

  // Periodically log metrics
  useEffect(() => {
    const loggingInterval = setInterval(() => {
      if (Object.keys(metricsRef.current).length > 0) {
        console.table(metricsRef.current)
      }
    }, 30000) // Every 30 seconds

    return () => clearInterval(loggingInterval)
  }, [])

  // Return metrics getter
  const getMetrics = useCallback((): PerformanceMetrics => {
    return { ...metricsRef.current }
  }, [])

  return { getMetrics, metricsRef }
}

/**
 * Hook to measure component render time
 */
export function useRenderPerformance(componentName: string) {
  const renderStartRef = useRef(Date.now())

  useEffect(() => {
    const renderTime = Date.now() - renderStartRef.current
    if (renderTime > 16) {
      // > 16ms indicates potential frame drop
      console.warn(
        `⚠️ ${componentName} render took ${renderTime}ms (potential frame drop at 60fps)`
      )
    } else {
      console.log(`✅ ${componentName} render: ${renderTime}ms`)
    }
  }, [componentName])
}

/**
 * Hook to measure interaction latency (keyboard, clicks)
 */
export function useInteractionMetrics() {
  const firstInputDelayRef = useRef<number | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          for (const entry of entries) {
            if (!firstInputDelayRef.current) {
              // Record the first input delay
              const fid = (entry as any).processingStart - entry.startTime
              firstInputDelayRef.current = fid
              console.log(`📊 First Input Delay: ${fid.toFixed(0)}ms`)
            }
          }
        })

        // Observe first input
        observer.observe({ type: 'first-input', buffered: true })

        return () => observer.disconnect()
      } catch (error) {
        console.warn('First Input observer not supported:', error)
      }
    }
  }, [])

  return { firstInputDelayRef }
}

/**
 * Report Core Web Vitals to analytics
 */
export function reportWebVitals() {
  if (typeof window === 'undefined') return

  const vitals: Record<string, number> = {}

  if ('PerformanceObserver' in window) {
    // FCP
    try {
      const fcpEntries = performance.getEntriesByName('first-contentful-paint')
      if (fcpEntries.length > 0) {
        vitals.fcp = fcpEntries[0].startTime
      }
    } catch {
      // ignored
    }

    // LCP
    try {
      const observer = new PerformanceObserver((list) => {
        const lastEntry = list.getEntries()[list.getEntries().length - 1] as any
        vitals.lcp = lastEntry.renderTime || lastEntry.loadTime
      })
      observer.observe({ type: 'largest-contentful-paint', buffered: true })
      setTimeout(() => observer.disconnect(), 1000)
    } catch {
      // ignored
    }

    // CLS
    try {
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutEntry = entry as any
          if (!layoutEntry.hadRecentInput) {
            clsValue += layoutEntry.value
          }
        }
      })
      clsObserver.observe({ type: 'layout-shift', buffered: true })
      setTimeout(() => {
        clsObserver.disconnect()
        vitals.cls = clsValue
      }, 1000)
    } catch {
      // ignored
    }
  }

  console.log('🎯 Core Web Vitals:', vitals)
  return vitals
}
