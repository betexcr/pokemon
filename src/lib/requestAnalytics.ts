/**
 * Request Analytics and Monitoring
 * Tracks request patterns, timing, and performance metrics for debugging and optimization
 */

export interface RequestAnalytics {
  totalRequests: number;
  completedRequests: number;
  cancelledRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  slowestRequest: { url?: string; time: number } | null;
  fastestRequest: { url?: string; time: number } | null;
  requestsByContext: Record<string, number>;
  requestsByPriority: Record<string, number>;
  cancellationRate: number; // percentage
}

interface RequestMetric {
  requestId: string;
  url?: string;
  context: string;
  priority: string;
  startTime: number;
  endTime?: number;
  responseTime?: number;
  status: 'completed' | 'cancelled' | 'failed';
  reason?: string;
}

class RequestAnalyticsManager {
  private metrics: Map<string, RequestMetric> = new Map();
  private observers: Set<(analytics: RequestAnalytics) => void> = new Set();
  private enableLogging = false;

  constructor(enableLogging = false) {
    this.enableLogging = enableLogging;
  }

  /**
   * Record request start
   */
  recordStart(requestId: string, url?: string, context?: string, priority?: string): void {
    this.metrics.set(requestId, {
      requestId,
      url,
      context: context || 'unknown',
      priority: priority || 'normal',
      startTime: Date.now(),
      status: 'completed'
    });
  }

  /**
   * Record request completion
   */
  recordComplete(requestId: string, status: 'completed' | 'cancelled' | 'failed', reason?: string): void {
    const metric = this.metrics.get(requestId);
    if (metric) {
      metric.endTime = Date.now();
      metric.responseTime = metric.endTime - metric.startTime;
      metric.status = status;
      metric.reason = reason;

      if (this.enableLogging) {
        console.log(`📊 Request ${requestId}: ${status} (${metric.responseTime}ms)`, {
          url: metric.url,
          context: metric.context,
          priority: metric.priority
        });
      }
    }
  }

  /**
   * Get current analytics
   */
  getAnalytics(): RequestAnalytics {
    const metrics = Array.from(this.metrics.values());
    const completed = metrics.filter(m => m.status === 'completed');
    const cancelled = metrics.filter(m => m.status === 'cancelled');
    const failed = metrics.filter(m => m.status === 'failed');
    const responseTimes = completed
      .filter(m => m.responseTime !== undefined)
      .map(m => m.responseTime!) as number[];

    const requestsByContext: Record<string, number> = {};
    const requestsByPriority: Record<string, number> = {};

    metrics.forEach(m => {
      requestsByContext[m.context] = (requestsByContext[m.context] || 0) + 1;
      requestsByPriority[m.priority] = (requestsByPriority[m.priority] || 0) + 1;
    });

    const sortedTimes = responseTimes.sort((a, b) => a - b);

    return {
      totalRequests: metrics.length,
      completedRequests: completed.length,
      cancelledRequests: cancelled.length,
      failedRequests: failed.length,
      averageResponseTime: responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0,
      slowestRequest: sortedTimes.length > 0
        ? { url: completed[completed.length - 1]?.url, time: sortedTimes[sortedTimes.length - 1] }
        : null,
      fastestRequest: sortedTimes.length > 0
        ? { url: completed[0]?.url, time: sortedTimes[0] }
        : null,
      requestsByContext,
      requestsByPriority,
      cancellationRate: metrics.length > 0
        ? (cancelled.length / metrics.length) * 100
        : 0
    };
  }

  /**
   * Clear old metrics (keep only last N or last X minutes)
   */
  prune(keepCount: number = 1000, keepMinutes: number = 60): void {
    const now = Date.now();
    const cutoffTime = now - (keepMinutes * 60 * 1000);
    
    // First, remove old entries by timestamp
    const entries = Array.from(this.metrics.entries())
      .filter(([, metric]) => metric.startTime > cutoffTime)
      .sort((a, b) => b[1].startTime - a[1].startTime)
      .slice(0, keepCount);

    this.metrics.clear();
    entries.forEach(([id, metric]) => {
      this.metrics.set(id, metric);
    });
  }

  /**
   * Subscribe to analytics updates
   */
  subscribe(callback: (analytics: RequestAnalytics) => void): () => void {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  /**
   * Notify observers of analytics changes
   */
  private notifyObservers(): void {
    const analytics = this.getAnalytics();
    this.observers.forEach(callback => callback(analytics));
  }

  /**
   * Enable/disable logging
   */
  setLogging(enabled: boolean): void {
    this.enableLogging = enabled;
  }

  /**
   * Reset all analytics
   */
  reset(): void {
    this.metrics.clear();
  }
}

// Global singleton instance
export const analyticsManager = new RequestAnalyticsManager(process.env.NODE_ENV === 'development');

export default analyticsManager;
