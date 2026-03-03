'use client'

/**
 * Image Performance Monitoring Utility (2026 Best Practices)
 * Tracks image loading metrics for optimization insights
 */

interface ImageMetrics {
  url: string
  loadTime: number
  size?: number
  fromCache: boolean
  connectionType?: string
  timestamp: number
}

class ImagePerformanceMonitor {
  private metrics: ImageMetrics[] = []
  private maxMetrics = 100 // Keep last 100 for analysis
  
  /**
   * Record image load metrics
   */
  recordLoad(url: string, loadTime: number, fromCache: boolean = false, size?: number) {
    const connectionType = this.getConnectionType()
    
    this.metrics.push({
      url,
      loadTime,
      size,
      fromCache,
      connectionType,
      timestamp: Date.now()
    })
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }
  }
  
  /**
   * Get connection type using Network Information API
   */
  private getConnectionType(): string {
    if (typeof navigator === 'undefined' || !('connection' in navigator)) {
      return 'unknown'
    }
    
    const connection = (navigator as any).connection
    return connection?.effectiveType || 'unknown'
  }
  
  /**
   * Get average load time
   */
  getAverageLoadTime(): number {
    if (this.metrics.length === 0) return 0
    
    const total = this.metrics.reduce((sum, m) => sum + m.loadTime, 0)
    return total / this.metrics.length
  }
  
  /**
   * Get cache hit rate
   */
  getCacheHitRate(): number {
    if (this.metrics.length === 0) return 0
    
    const cached = this.metrics.filter(m => m.fromCache).length
    return (cached / this.metrics.length) * 100
  }
  
  /**
   * Get performance summary
   */
  getSummary() {
    const avgLoadTime = this.getAverageLoadTime()
    const cacheHitRate = this.getCacheHitRate()
    const recentMetrics = this.metrics.slice(-10)
    
    return {
      totalImages: this.metrics.length,
      averageLoadTime: Math.round(avgLoadTime),
      cacheHitRate: Math.round(cacheHitRate),
      connectionType: this.getConnectionType(),
      recentLoads: recentMetrics.map(m => ({
        url: m.url.substring(m.url.lastIndexOf('/') + 1),
        loadTime: Math.round(m.loadTime),
        fromCache: m.fromCache
      }))
    }
  }
  
  /**
   * Get performance recommendations
   */
  getRecommendations(): string[] {
    const recommendations: string[] = []
    const avgLoadTime = this.getAverageLoadTime()
    const cacheHitRate = this.getCacheHitRate()
    
    if (avgLoadTime > 500) {
      recommendations.push('Consider enabling image compression or using a CDN')
    }
    
    if (cacheHitRate < 30) {
      recommendations.push('Low cache hit rate - consider preloading more images')
    }
    
    const connectionType = this.getConnectionType()
    if (connectionType === 'slow-2g' || connectionType === '2g') {
      recommendations.push('User on slow connection - reduce image quality or size')
    }
    
    return recommendations
  }
  
  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = []
  }
}

// Singleton instance
export const imagePerformanceMonitor = new ImagePerformanceMonitor()

/**
 * Hook to measure image load performance
 */
export function measureImageLoad(url: string, fromCache: boolean = false) {
  const startTime = performance.now()
  
  return () => {
    const loadTime = performance.now() - startTime
    imagePerformanceMonitor.recordLoad(url, loadTime, fromCache)
  }
}

/**
 * Intelligent preloading based on viewport and connection
 */
export function shouldPreloadImage(): boolean {
  if (typeof navigator === 'undefined') return true
  
  const connection = (navigator as any).connection
  if (!connection) return true
  
  // Don't preload on slow connections or when data saver is on
  if (connection.saveData) return false
  
  const slowTypes = ['slow-2g', '2g']
  return !slowTypes.includes(connection.effectiveType)
}

/**
 * Get optimal image quality based on connection
 */
export function getOptimalImageQuality(): 'high' | 'medium' | 'low' {
  if (typeof navigator === 'undefined') return 'high'
  
  const connection = (navigator as any).connection
  if (!connection) return 'high'
  
  if (connection.saveData) return 'low'
  
  switch (connection.effectiveType) {
    case 'slow-2g':
    case '2g':
      return 'low'
    case '3g':
      return 'medium'
    default:
      return 'high'
  }
}

/**
 * Calculate optimal number of images to preload
 */
export function getOptimalPreloadCount(): number {
  const quality = getOptimalImageQuality()
  
  switch (quality) {
    case 'low':
      return 5
    case 'medium':
      return 10
    case 'high':
      return 20
    default:
      return 10
  }
}
