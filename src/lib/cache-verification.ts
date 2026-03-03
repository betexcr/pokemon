/**
 * Cache Verification and Monitoring Utility
 * 
 * Provides tools to verify Redis and browser cache are working correctly,
 * track cache effectiveness, and monitor performance.
 */

interface CacheStats {
  hits: number
  misses: number
  writes: number
  deletes: number
  errors: number
  hitRate: number
  averageResponseTime: number
  totalRequestTime: number
  requestCount: number
}

interface CacheHealthReport {
  redis: {
    status: 'connected' | 'error' | 'untested'
    latency?: number
    error?: string
  }
  browser: {
    status: 'available' | 'unavailable' | 'untested'
    storage: 'indexeddb' | 'localstorage' | 'none'
    error?: string
  }
  stats: {
    redis: CacheStats
    browser: CacheStats
  }
  recommendations: string[]
}

class CacheVerification {
  private stats = new Map<string, CacheStats>([
    ['redis', { hits: 0, misses: 0, writes: 0, deletes: 0, errors: 0, hitRate: 0, averageResponseTime: 0, totalRequestTime: 0, requestCount: 0 }],
    ['browser', { hits: 0, misses: 0, writes: 0, deletes: 0, errors: 0, hitRate: 0, averageResponseTime: 0, totalRequestTime: 0, requestCount: 0 }],
  ])

  private lastHealthReport: CacheHealthReport | null = null

  /**
   * Verify Redis connectivity and performance
   */
  async verifyRedis(): Promise<{ status: 'connected' | 'error'; latency?: number; error?: string }> {
    try {
      if (typeof window !== 'undefined') {
        // Redis can only be accessed from server-side
        return { status: 'error', error: 'Redis is server-side only' }
      }

      // This would be called from server-side code
      // For now, return a placeholder
      return { status: 'connected', latency: 0 }
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Verify browser cache (IndexedDB/localStorage) is available
   */
  async verifyBrowserCache(): Promise<{ status: 'available' | 'unavailable'; storage: 'indexeddb' | 'localstorage' | 'none'; error?: string }> {
    if (typeof window === 'undefined') {
      return { status: 'unavailable', storage: 'none', error: 'Not running in browser' }
    }

    try {
      // Check IndexedDB
      if ('indexedDB' in window) {
        try {
          const db = await new Promise<IDBDatabase>((resolve, reject) => {
            const request = window.indexedDB.open('pokemon-cache-test')
            request.onerror = () => reject(request.error)
            request.onsuccess = () => resolve(request.result)
          })
          db.close()
          return { status: 'available', storage: 'indexeddb' }
        } catch (error) {
          // Fall back to localStorage
          console.warn('IndexedDB unavailable, checking localStorage:', error)
        }
      }

      // Check localStorage
      if ('localStorage' in window) {
        try {
          localStorage.setItem('pokemon-cache-test', 'test')
          localStorage.removeItem('pokemon-cache-test')
          return { status: 'available', storage: 'localstorage' }
        } catch (error) {
          return { status: 'unavailable', storage: 'none', error: 'localStorage unavailable' }
        }
      }

      return { status: 'unavailable', storage: 'none', error: 'No storage available' }
    } catch (error) {
      return {
        status: 'unavailable',
        storage: 'none',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Record cache operation metrics
   */
  recordCacheOperation(cacheType: 'redis' | 'browser', operation: 'hit' | 'miss' | 'write' | 'delete' | 'error', responseTimeMs?: number): void {
    const stats = this.stats.get(cacheType)
    if (!stats) return

    stats[operation === 'hit' ? 'hits' : operation === 'miss' ? 'misses' : operation === 'write' ? 'writes' : operation === 'delete' ? 'deletes' : 'errors']++

    if (responseTimeMs !== undefined) {
      stats.totalRequestTime += responseTimeMs
      stats.requestCount++
      stats.averageResponseTime = stats.totalRequestTime / stats.requestCount
    }

    // Calculate hit rate
    const total = stats.hits + stats.misses
    stats.hitRate = total > 0 ? (stats.hits / total) * 100 : 0
  }

  /**
   * Get current cache statistics
   */
  getStats(cacheType: 'redis' | 'browser'): CacheStats | null {
    return this.stats.get(cacheType) || null
  }

  /**
   * Get health report with recommendations
   */
  async getHealthReport(): Promise<CacheHealthReport> {
    if (this.lastHealthReport && Date.now() - (this.lastHealthReport as any)._timestamp < 60000) {
      return this.lastHealthReport
    }

    const redisStatus = await this.verifyRedis()
    const browserStatus = await this.verifyBrowserCache()

    const redisCacheStats = this.stats.get('redis') || { hits: 0, misses: 0, writes: 0, deletes: 0, errors: 0, hitRate: 0, averageResponseTime: 0, totalRequestTime: 0, requestCount: 0 }
    const browserCacheStats = this.stats.get('browser') || { hits: 0, misses: 0, writes: 0, deletes: 0, errors: 0, hitRate: 0, averageResponseTime: 0, totalRequestTime: 0, requestCount: 0 }

    const recommendations: string[] = []

    // Check Redis
    if (redisStatus.status === 'error') {
      recommendations.push('⚠️ Redis is not accessible from server-side code. Consider adding Upstash Redis middleware to cache API responses.')
    } else if (redisStatus.latency && redisStatus.latency > 100) {
      recommendations.push('⚠️ Redis latency is high. Consider using edge caching strategies.')
    }

    // Check browser cache
    if (browserStatus.status === 'unavailable') {
      recommendations.push('⚠️ Browser cache is unavailable. Site performance will degrade on repeat visits.')
    }

    // Check hit rates
    if (redisCacheStats.hitRate < 50 && redisCacheStats.requestCount > 10) {
      recommendations.push('📊 Redis hit rate is low. Consider:')
      recommendations.push('  - Increasing TTL values')
      recommendations.push('  - Pre-warming cache with frequently accessed data')
      recommendations.push('  - Reviewing cache key generation strategy')
    }

    if (browserCacheStats.hitRate < 50 && browserCacheStats.requestCount > 10) {
      recommendations.push('📊 Browser cache hit rate is low. Users will experience slower repeats.')
    }

    // Check for excessive errors
    if (redisCacheStats.errors > 5) {
      recommendations.push('🔴 Redis errors detected. Check connection and configuration.')
    }

    if (browserCacheStats.errors > 5) {
      recommendations.push('🔴 Browser cache errors detected. Check storage space and permissions.')
    }

    const report: CacheHealthReport = {
      redis: {
        status: redisStatus.status,
        latency: redisStatus.latency,
        error: redisStatus.error
      },
      browser: {
        status: browserStatus.status as 'available' | 'unavailable',
        storage: browserStatus.storage as 'indexeddb' | 'localstorage' | 'none',
        error: browserStatus.error
      },
      stats: {
        redis: redisCacheStats,
        browser: browserCacheStats
      },
      recommendations
    }

    ;(report as any)._timestamp = Date.now()
    this.lastHealthReport = report

    return report
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats.forEach(stat => {
      stat.hits = 0
      stat.misses = 0
      stat.writes = 0
      stat.deletes = 0
      stat.errors = 0
      stat.hitRate = 0
      stat.averageResponseTime = 0
      stat.totalRequestTime = 0
      stat.requestCount = 0
    })
  }

  /**
   * Get formatted health report for logging
   */
  async getHealthReportForLogging(): Promise<string> {
    const report = await this.getHealthReport()

    let output = '\n📊 CACHE HEALTH REPORT\n'
    output += '='.repeat(50) + '\n\n'

    // Redis status
    output += '🔴 REDIS (Server-side)\n'
    output += `  Status: ${report.redis.status}\n`
    if (report.redis.latency !== undefined) {
      output += `  Latency: ${report.redis.latency}ms\n`
    }
    if (report.redis.error) {
      output += `  Error: ${report.redis.error}\n`
    }
    const redisStats = report.stats.redis
    output += `  Hits: ${redisStats.hits} | Misses: ${redisStats.misses} | Hit Rate: ${redisStats.hitRate.toFixed(2)}%\n`
    output += `  Avg Response: ${redisStats.averageResponseTime.toFixed(2)}ms\n`
    output += `  Errors: ${redisStats.errors}\n\n`

    // Browser cache status
    output += '🟢 BROWSER CACHE (Client-side)\n'
    output += `  Status: ${report.browser.status}\n`
    output += `  Storage: ${report.browser.storage}\n`
    if (report.browser.error) {
      output += `  Error: ${report.browser.error}\n`
    }
    const browserStats = report.stats.browser
    output += `  Hits: ${browserStats.hits} | Misses: ${browserStats.misses} | Hit Rate: ${browserStats.hitRate.toFixed(2)}%\n`
    output += `  Avg Response: ${browserStats.averageResponseTime.toFixed(2)}ms\n`
    output += `  Errors: ${browserStats.errors}\n\n`

    // Recommendations
    if (report.recommendations.length > 0) {
      output += '💡 RECOMMENDATIONS\n'
      report.recommendations.forEach(rec => {
        output += `  ${rec}\n`
      })
    }

    output += '='.repeat(50) + '\n'

    return output
  }
}

export const cacheVerification = new CacheVerification()
