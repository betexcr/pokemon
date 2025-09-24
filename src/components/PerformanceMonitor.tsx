'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function PerformanceMonitor() {
  const pathname = usePathname()

  useEffect(() => {
    // Only run in development mode
    if (process.env.NODE_ENV !== 'development') return

    // Measure navigation performance
    const startTime = performance.now()
    
    const handleLoad = () => {
      const endTime = performance.now()
      const loadTime = endTime - startTime
      
      console.log(`🚀 Navigation to ${pathname} took ${loadTime.toFixed(2)}ms`)
      
      // Log performance insights
      if (loadTime < 100) {
        console.log('✅ Excellent navigation performance!')
      } else if (loadTime < 300) {
        console.log('👍 Good navigation performance')
      } else if (loadTime < 500) {
        console.log('⚠️ Moderate navigation performance - could be improved')
      } else {
        console.log('🐌 Slow navigation - needs optimization')
      }
    }

    // Measure page load time
    if (document.readyState === 'complete') {
      handleLoad()
    } else {
      window.addEventListener('load', handleLoad)
      return () => window.removeEventListener('load', handleLoad)
    }
  }, [pathname])

  return null // This component doesn't render anything
}