/**
 * Hook for using request analytics
 * Provides real-time monitoring of request patterns and performance
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { analyticsManager, RequestAnalytics } from '@/lib/requestAnalytics';
import { requestManager } from '@/lib/requestManager';

interface UseRequestAnalyticsOptions {
  /**
   * Auto-prune old metrics to prevent memory leaks
   */
  autoPrune?: boolean;
  
  /**
   * Update interval in milliseconds
   */
  updateInterval?: number;
}

export function useRequestAnalytics(options: UseRequestAnalyticsOptions = {}) {
  const { autoPrune = true, updateInterval = 1000 } = options;

  const [analytics, setAnalytics] = useState<RequestAnalytics>(analyticsManager.getAnalytics());
  const [poolStatus, setPoolStatus] = useState(requestManager.getPoolStatus());

  // Subscribe to analytics updates
  useEffect(() => {
    const unsubscribe = analyticsManager.subscribe(newAnalytics => {
      setAnalytics(newAnalytics);
    });

    return () => unsubscribe();
  }, []);

  // Periodically update pool status
  useEffect(() => {
    const interval = setInterval(() => {
      setPoolStatus(requestManager.getPoolStatus());
      
      if (autoPrune) {
        analyticsManager.prune(500, 30); // Keep 500 recent or 30 minutes
      }
    }, updateInterval);

    return () => clearInterval(interval);
  }, [autoPrune, updateInterval]);

  // Get formatted analytics for display
  const getDisplayStats = useCallback(() => {
    return {
      requests: {
        total: analytics.totalRequests,
        completed: analytics.completedRequests,
        cancelled: analytics.cancelledRequests,
        cancelled_percent: analytics.cancellationRate.toFixed(1),
        failed: analytics.failedRequests
      },
      performance: {
        avg_ms: analytics.averageResponseTime.toFixed(0),
        slowest_ms: analytics.slowestRequest?.time || 0,
        fastest_ms: analytics.fastestRequest?.time || 0
      },
      pool: {
        active: poolStatus.totalActive,
        max: poolStatus.maxConcurrent,
        queued: poolStatus.queued,
        utilization_percent: poolStatus.percentUsed.toFixed(1)
      },
      topContexts: Object.entries(analytics.requestsByContext)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([context, count]) => ({ context, count }))
    };
  }, [analytics, poolStatus]);

  // Get human-readable summary
  const getSummary = useCallback(() => {
    const stats = getDisplayStats();
    return `Requests: ${stats.requests.total} (${stats.requests.completed}✓ ${stats.requests.cancelled}✗ ${stats.requests.failed}⚠) | Pool: ${stats.pool.active}/${stats.pool.max} (${stats.pool.queued} queued) | Avg: ${stats.performance.avg_ms}ms`;
  }, [getDisplayStats]);

  return {
    analytics,
    poolStatus,
    getDisplayStats,
    getSummary,
    reset: () => analyticsManager.reset(),
    setLogging: (enabled: boolean) => analyticsManager.setLogging(enabled)
  };
}

export default useRequestAnalytics;
