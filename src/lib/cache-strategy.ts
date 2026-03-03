/**
 * Enhanced Cache Strategy
 * 
 * Implements optimized caching with:
 * - Cache versioning and invalidation
 * - Request deduplication at cache level
 * - Automatic cache warming
 * - Better error handling
 * - Cache metrics
 */

import { cacheVerification } from './cache-verification'

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  version: number
  hits: number
  lastHit: number
}

interface CacheStrategy {
  ttl: number // Time to live in seconds
  warm?: boolean // Pre-load this data
  version?: number // Cache version for invalidation
  priority?: 'low' | 'medium' | 'high' // Eviction priority
}

const DEFAULT_STRATEGIES: Record<string, CacheStrategy> = {
  'pokemon-list': { ttl: 24 * 60 * 60, warm: true, priority: 'high' },
  'pokemon-detail': { ttl: 24 * 60 * 60, priority: 'high' },
  'pokemon-species': { ttl: 7 * 24 * 60 * 60, priority: 'medium' },
  'evolution-chain': { ttl: 7 * 24 * 60 * 60, priority: 'medium' },
  'type': { ttl: 30 * 24 * 60 * 60, priority: 'low' },
  'ability': { ttl: 30 * 24 * 60 * 60, priority: 'low' },
  'move': { ttl: 30 * 24 * 60 * 60, priority: 'low' },
  'search': { ttl: 60 * 60, priority: 'low' },
}

const CACHE_VERSION = 1

/**
 * Enhanced cache strategy manager
 */
export class EnhancedCacheStrategy {
  private strategies: Map<string, CacheStrategy> = new Map()
  private pendingWarmup: Set<string> = new Set()
  private inFlightUpdates: Map<string, Promise<any>> = new Map()

  constructor() {
    // Initialize default strategies
    Object.entries(DEFAULT_STRATEGIES).forEach(([key, strategy]) => {
      this.strategies.set(key, { ...strategy, version: CACHE_VERSION })
    })
  }

  /**
   * Get strategy for a cache key prefix
   */
  getStrategy(prefix: string): CacheStrategy {
    return this.strategies.get(prefix) || { ttl: 60 * 60 } // Default 1 hour
  }

  /**
   * Update strategy
   */
  updateStrategy(prefix: string, strategy: Partial<CacheStrategy>): void {
    const existing = this.strategies.get(prefix) || { ttl: 60 * 60 }
    this.strategies.set(prefix, { ...existing, ...strategy })
  }

  /**
   * Invalidate cache by version
   */
  invalidateByVersion(prefix: string, newVersion: number): void {
    const strategy = this.strategies.get(prefix)
    if (strategy) {
      strategy.version = newVersion
    }
  }

  /**
   * Get cache keys that should be pre-warmed
   */
  getWarmupKeys(): string[] {
    return Array.from(this.strategies.entries())
      .filter(([_, strategy]) => strategy.warm)
      .map(([key]) => key)
  }

  /**
   * Mark cache for warmup
   */
  markForWarmup(prefix: string): void {
    this.pendingWarmup.add(prefix)
  }

  /**
   * Get pending warmup operations
   */
  getPendingWarmups(): string[] {
    return Array.from(this.pendingWarmup)
  }

  /**
   * Clear pending warmup
   */
  clearPendingWarmup(prefix: string): void {
    this.pendingWarmup.delete(prefix)
  }

  /**
   * Track in-flight cache updates to prevent race conditions
   */
  async executeWithDeduplication<T>(
    key: string,
    executor: () => Promise<T>
  ): Promise<T> {
    // If already in flight, return existing promise
    if (this.inFlightUpdates.has(key)) {
      return this.inFlightUpdates.get(key) as Promise<T>
    }

    // Create new promise and store it
    const promise = executor().finally(() => {
      this.inFlightUpdates.delete(key)
    })

    this.inFlightUpdates.set(key, promise)
    return promise
  }

  /**
   * Check if cache entry is valid based on version and TTL
   */
  isEntryValid<T>(entry: CacheEntry<T>, strategy: CacheStrategy): boolean {
    if (!entry || typeof entry !== 'object') return false

    // Check version
    if (entry.version !== strategy.version) return false

    // Check TTL
    const age = Date.now() - entry.timestamp
    return age < entry.ttl
  }
}

/**
 * Cache invalidation strategies
 */
export class CacheInvalidation {
  private invalidationRules: Map<string, () => Promise<string[]>> = new Map()

  /**
   * Register an invalidation rule
   */
  registerRule(
    pattern: string,
    rule: () => Promise<string[]>
  ): void {
    this.invalidationRules.set(pattern, rule)
  }

  /**
   * Invalidate by pattern
   */
  async invalidatePattern(pattern: string): Promise<string[]> {
    const rule = this.invalidationRules.get(pattern)
    return rule ? rule() : []
  }

  /**
   * Invalidate single resource
   */
  getInvalidationKeysForResource(resourceType: string, resourceId: string): string[] {
    const keys: string[] = []

    // Invalidate related caches when a resource changes
    const invalidationMap: Record<string, string[]> = {
      'pokemon': [
        `pokemon:pokemon:{"id":${resourceId}}`,
        `pokemon:pokemon-list:*`,
        `pokemon:pokemon-skeletons:*`,
        `pokemon:pokemon-pagination:*`,
      ],
      'move': [
        `pokemon:move:{"id":"${resourceId}"}`,
        `pokemon:pokemon-detail:*`, // Pokemon moves change
      ],
      'ability': [
        `pokemon:ability:{"id":"${resourceId}"}`,
        `pokemon:pokemon-detail:*`, // Pokemon abilities change
      ],
    }

    return invalidationMap[resourceType] || []
  }
}

/**
 * Get cache key prefix from full cache key
 */
export function extractCachePrefix(cacheKey: string): string {
  // Cache key format: pokemon:prefix:params
  const parts = cacheKey.split(':')
  return parts[1] || 'unknown'
}

/**
 * Cache metrics and analytics
 */
export class CacheMetrics {
  private metrics: Map<string, { hits: number; misses: number; writes: number; errors: number }> = new Map()

  recordHit(prefix: string, responseTimeMs: number): void {
    const metric = this.metrics.get(prefix) || { hits: 0, misses: 0, writes: 0, errors: 0 }
    metric.hits++
    this.metrics.set(prefix, metric)
    cacheVerification.recordCacheOperation('browser', 'hit', responseTimeMs)
  }

  recordMiss(prefix: string): void {
    const metric = this.metrics.get(prefix) || { hits: 0, misses: 0, writes: 0, errors: 0 }
    metric.misses++
    this.metrics.set(prefix, metric)
    cacheVerification.recordCacheOperation('browser', 'miss')
  }

  recordWrite(prefix: string): void {
    const metric = this.metrics.get(prefix) || { hits: 0, misses: 0, writes: 0, errors: 0 }
    metric.writes++
    this.metrics.set(prefix, metric)
    cacheVerification.recordCacheOperation('browser', 'write')
  }

  recordError(prefix: string): void {
    const metric = this.metrics.get(prefix) || { hits: 0, misses: 0, writes: 0, errors: 0 }
    metric.errors++
    this.metrics.set(prefix, metric)
    cacheVerification.recordCacheOperation('browser', 'error')
  }

  getMetric(prefix: string) {
    return this.metrics.get(prefix) || { hits: 0, misses: 0, writes: 0, errors: 0 }
  }

  getAllMetrics() {
    return Object.fromEntries(this.metrics)
  }

  getHitRate(prefix: string): number {
    const metric = this.getMetric(prefix)
    const total = metric.hits + metric.misses
    return total > 0 ? (metric.hits / total) * 100 : 0
  }
}

// Export singleton instances
export const cacheStrategy = new EnhancedCacheStrategy()
export const cacheInvalidation = new CacheInvalidation()
export const cacheMetrics = new CacheMetrics()
