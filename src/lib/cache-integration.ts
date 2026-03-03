/**
 * Cache Integration Helper
 * 
 * Integrates cache verification, metrics, and monitoring into existing API layer.
 * This module wraps cache operations to provide comprehensive tracking and reporting.
 */

import { cacheMetrics, cacheStrategy, cacheInvalidation, extractCachePrefix } from './cache-strategy'
import { cacheVerification } from './cache-verification'

/**
 * Wrap cache get operation with metrics tracking
 */
export async function getCacheWithMetrics<T>(
  cacheKey: string,
  getter: () => Promise<T | null>,
  responseTimeMs?: number
): Promise<T | null> {
  const prefix = extractCachePrefix(cacheKey)
  const startTime = Date.now()

  try {
    const result = await getter()

    if (result) {
      const elapsed = Date.now() - startTime
      cacheMetrics.recordHit(prefix, elapsed)
      console.log(`📦 Cache hit for ${prefix} (${elapsed}ms)`)
    } else {
      cacheMetrics.recordMiss(prefix)
    }

    return result
  } catch (error) {
    cacheMetrics.recordError(prefix)
    console.error(`Cache error for ${prefix}:`, error)
    return null
  }
}

/**
 * Wrap cache set operation with metrics tracking
 */
export async function setCacheWithMetrics(
  cacheKey: string,
  setter: () => Promise<void>
): Promise<void> {
  const prefix = extractCachePrefix(cacheKey)

  try {
    await setter()
    cacheMetrics.recordWrite(prefix)
  } catch (error) {
    cacheMetrics.recordError(prefix)
    console.error(`Cache write error for ${prefix}:`, error)
  }
}

/**
 * Get cache health report with detailed analysis
 */
export async function getCacheHealthReport() {
  return await cacheVerification.getHealthReport()
}

/**
 * Get formatted cache health report for console logging
 */
export async function logCacheHealth() {
  const report = await cacheVerification.getHealthReportForLogging()
  console.log(report)
}

/**
 * Get cache statistics
 */
export function getCacheMetrics() {
  return {
    browser: cacheMetrics.getAllMetrics(),
    verification: cacheVerification.getStats('browser')
  }
}

/**
 * Reset cache statistics
 */
export function resetCacheMetrics() {
  cacheVerification.resetStats()
  // Note: cacheMetrics doesn't have a global reset, would need to add
}

/**
 * Get cache hit rate by prefix
 */
export function getCacheHitRate(prefix: string): number {
  return cacheMetrics.getHitRate(prefix)
}

/**
 * Get all cache hit rates
 */
export function getAllCacheHitRates() {
  const metrics = cacheMetrics.getAllMetrics()
  const rates: Record<string, number> = {}

  for (const [prefix, metric] of Object.entries(metrics)) {
    const total = (metric as any).hits + (metric as any).misses
    rates[prefix] = total > 0 ? ((metric as any).hits / total) * 100 : 0
  }

  return rates
}

/**
 * Check cache health and log recommendations
 */
export async function checkCacheHealth() {
  const report = await getCacheHealthReport()

  if (report.recommendations.length > 0) {
    console.warn('⚠️ Cache health issues detected:')
    report.recommendations.forEach(rec => console.warn(`  ${rec}`))
  } else {
    console.log('✅ Cache health is good!')
  }

  return report
}

/**
 * Perform cache diagnostics and return detailed report
 */
export async function runCacheDiagnostics() {
  console.log('🔍 Running cache diagnostics...\n')

  const report = await getCacheHealthReport()

  // Browser cache status
  console.log('📊 Browser Cache Status:')
  console.log(`  - Storage: ${report.browser.storage}`)
  console.log(`  - Status: ${report.browser.status}`)
  if (report.browser.error) console.log(`  - Error: ${report.browser.error}`)

  const browserStats = report.stats.browser
  console.log(`  - Hits: ${browserStats.hits}`)
  console.log(`  - Misses: ${browserStats.misses}`)
  console.log(`  - Hit Rate: ${browserStats.hitRate.toFixed(2)}%`)
  console.log(`  - Errors: ${browserStats.errors}`)
  console.log(`  - Avg Response: ${browserStats.averageResponseTime.toFixed(2)}ms`)

  // Redis status
  console.log('\n🔴 Redis Status:')
  console.log(`  - Status: ${report.redis.status}`)
  if (report.redis.latency !== undefined) console.log(`  - Latency: ${report.redis.latency}ms`)
  if (report.redis.error) console.log(`  - Error: ${report.redis.error}`)

  const redisStats = report.stats.redis
  console.log(`  - Hits: ${redisStats.hits}`)
  console.log(`  - Misses: ${redisStats.misses}`)
  console.log(`  - Hit Rate: ${redisStats.hitRate.toFixed(2)}%`)
  console.log(`  - Errors: ${redisStats.errors}`)

  // Per-prefix metrics
  console.log('\n📈 Per-Prefix Hit Rates:')
  const hitRates = getAllCacheHitRates()
  for (const [prefix, rate] of Object.entries(hitRates)) {
    const indicator = rate > 70 ? '🟢' : rate > 40 ? '🟡' : '🔴'
    console.log(`  ${indicator} ${prefix}: ${rate.toFixed(2)}%`)
  }

  // Recommendations
  if (report.recommendations.length > 0) {
    console.log('\n💡 Recommendations:')
    report.recommendations.forEach((rec, i) => {
      console.log(`  ${i + 1}. ${rec}`)
    })
  } else {
    console.log('\n✅ No issues detected!')
  }

  return report
}

/**
 * Memory usage estimation (client-side only)
 */
export function estimateCacheMemoryUsage(): { estimated: number; unit: string } {
  if (typeof window === 'undefined') {
    return { estimated: 0, unit: 'bytes' }
  }

  try {
    if (navigator && 'storage' in navigator && 'estimate' in navigator.storage) {
      // Use Storage API if available
      navigator.storage.estimate().then(estimate => {
        if (estimate.quota) console.log(`Storage quota: ${(estimate.quota / 1024 / 1024).toFixed(2)}MB`)
        if (estimate.usage) console.log(`Storage usage: ${(estimate.usage / 1024 / 1024).toFixed(2)}MB`)
        if (estimate.quota && estimate.usage) console.log(`Storage available: ${((estimate.quota - estimate.usage) / 1024 / 1024).toFixed(2)}MB`)
      })
    }
  } catch (error) {
    console.warn('Could not estimate storage:', error)
  }

  return { estimated: 0, unit: 'bytes' }
}

/**
 * Export cache diagnostics data as JSON (for external analysis)
 */
export async function exportCacheDiagnosticsData() {
  const report = await getCacheHealthReport()
  const hitRates = getAllCacheHitRates()

  return {
    timestamp: new Date().toISOString(),
    browser: report.browser,
    redis: report.redis,
    stats: report.stats,
    hitRates,
    recommendations: report.recommendations
  }
}

/**
 * Log cache diagnostics to console (useful for debugging)
 */
export async function logCacheDiagnostics() {
  const data = await exportCacheDiagnosticsData()
  console.table(data)
  return data
}
