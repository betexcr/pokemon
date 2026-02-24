/**
 * Global Request Manager
 * Handles cancellation, prioritization, tracking, and pooling of all API requests
 * Ensures old requests are cancelled when user navigates or scrolls
 * Limits concurrent requests to prevent overwhelming the API
 */

export type RequestPriority = 'critical' | 'high' | 'normal' | 'low' | 'background';

interface RequestEntry {
  controller: AbortController;
  priority: RequestPriority;
  context: string; // e.g., 'pokedex', 'search', 'viewport-pokemon-123'
  createdAt: number;
  url?: string;
  status: 'pending' | 'running' | 'completed' | 'cancelled';
}

interface PoolConfig {
  maxConcurrent: number;
  maxByContext: Record<string, number>;
}

class RequestManager {
  private requests = new Map<string, RequestEntry>();
  private requestIdCounter = 0;
  private observers: Set<(requests: Map<string, RequestEntry>) => void> = new Set();
  
  // Request pooling
  private requestQueue: string[] = []; // Queue of pending request IDs
  private activeRequests = new Set<string>(); // Currently running requests
  private poolConfig: PoolConfig = {
    maxConcurrent: 6, // Max total concurrent requests
    maxByContext: {
      'pokedex-main': 3,    // Pokedex loads at max 3 concurrent
      'search': 2,           // Search at most 2 concurrent
      'viewport': 2,         // Viewport loads at most 2 concurrent
      'default': 4           // Default max per context
    }
  };

  constructor(config?: Partial<PoolConfig>) {
    if (config) {
      this.poolConfig = { ...this.poolConfig, ...config };
    }
  }

  /**
   * Create a new request with optional priority management
   * Uses request pooling to limit concurrent requests
   */
  createRequest(
    context: string,
    priority: RequestPriority = 'normal',
    url?: string
  ): { signal: AbortSignal; requestId: string; startImmediately: () => void } {
    const requestId = `${context}-${++this.requestIdCounter}`;
    const controller = new AbortController();

    // Cancel lower priority requests in the same context if we're high priority
    if (priority === 'critical' || priority === 'high') {
      this.cancelLowerPriorityInContext(context, priority);
    }

    this.requests.set(requestId, {
      controller,
      priority,
      context,
      createdAt: Date.now(),
      url,
      status: 'pending'
    });

    // Add to queue for pooling
    this.requestQueue.push(requestId);

    // Auto-cleanup when request aborts
    controller.signal.addEventListener('abort', () => {
      this.completeRequest(requestId);
    });

    // Try to start request immediately if under pool limit
    const startImmediately = () => {
      setTimeout(() => this.processQueue(), 0);
    };

    this.notifyObservers();
    return { signal: controller.signal, requestId, startImmediately };
  }

  /**
   * Mark request as complete and process remaining queue
   */
  completeRequest(requestId: string): void {
    const entry = this.requests.get(requestId);
    if (entry) {
      entry.status = 'completed';
    }
    this.activeRequests.delete(requestId);
    this.requests.delete(requestId);
    this.notifyObservers();
    
    // Process next queued request
    this.processQueue();
  }

  /**
   * Process the request queue respecting pool limits
   */
  private processQueue(): void {
    // Check if we can start more requests
    while (this.requestQueue.length > 0 && this.canStartRequest()) {
      const requestId = this.requestQueue.shift();
      if (!requestId) break;

      const entry = this.requests.get(requestId);
      if (!entry) continue;

      entry.status = 'running';
      this.activeRequests.add(requestId);
      this.notifyObservers();
    }
  }

  /**
   * Check if we can start a new request based on pool limits
   */
  private canStartRequest(): boolean {
    // Check global limit
    if (this.activeRequests.size >= this.poolConfig.maxConcurrent) {
      return false;
    }

    return true;
  }

  /**
   * Get current pool status
   */
  getPoolStatus() {
    return {
      totalActive: this.activeRequests.size,
      maxConcurrent: this.poolConfig.maxConcurrent,
      queued: this.requestQueue.length,
      percentUsed: (this.activeRequests.size / this.poolConfig.maxConcurrent) * 100
    };
  }

  /**
   * Configure pool limits
   */
  setPoolConfig(config: Partial<PoolConfig>): void {
    this.poolConfig = { ...this.poolConfig, ...config };
    // Try to process more requests with new config
    this.processQueue();
  }

  /**
   * Cancel a specific request
   */
  cancelRequest(requestId: string): void {
    const entry = this.requests.get(requestId);
    if (entry) {
      entry.controller.abort();
      this.requests.delete(requestId);
      this.notifyObservers();
    }
  }

  /**
   * Cancel all requests in a specific context
   */
  cancelContext(context: string): void {
    const toCancel: string[] = [];
    this.requests.forEach((entry, requestId) => {
      if (entry.context === context) {
        toCancel.push(requestId);
      }
    });
    toCancel.forEach(id => this.cancelRequest(id));
  }

  /**
   * Cancel all lower priority requests in a context
   */
  private cancelLowerPriorityInContext(
    context: string,
    minPriority: RequestPriority
  ): void {
    const priorityOrder: RequestPriority[] = ['background', 'low', 'normal', 'high', 'critical'];
    const minIndex = priorityOrder.indexOf(minPriority);

    const toCancel: string[] = [];
    this.requests.forEach((entry, requestId) => {
      if (entry.context === context) {
        const entryIndex = priorityOrder.indexOf(entry.priority);
        if (entryIndex < minIndex) {
          toCancel.push(requestId);
        }
      }
    });
    toCancel.forEach(id => this.cancelRequest(id));
  }

  /**
   * Cancel requests for a specific context type across all instances
   * Useful for viewport loading - cancel all "viewport-*" requests when scrolling far
   */
  cancelContextPattern(pattern: string): void {
    const toCancel: string[] = [];
    this.requests.forEach((entry, requestId) => {
      if (entry.context.includes(pattern)) {
        toCancel.push(requestId);
      }
    });
    toCancel.forEach(id => this.cancelRequest(id));
  }

  /**
   * Cancel ALL requests - called on navigation away
   */
  cancelAll(): void {
    this.requests.forEach(entry => {
      entry.controller.abort();
    });
    this.requests.clear();
    this.notifyObservers();
  }

  /**
   * Get all active requests (for debugging)
   */
  getActiveRequests(): RequestEntry[] {
    return Array.from(this.requests.values());
  }

  /**
   * Get count of active requests by priority
   */
  getRequestStats() {
    const stats = {
      total: this.requests.size,
      byPriority: {
        critical: 0,
        high: 0,
        normal: 0,
        low: 0,
        background: 0,
      },
      byContext: {} as Record<string, number>,
    };

    this.requests.forEach(entry => {
      stats.byPriority[entry.priority]++;
      stats.byContext[entry.context] = (stats.byContext[entry.context] || 0) + 1;
    });

    return stats;
  }

  /**
   * Subscribe to request changes (for monitoring/debugging)
   */
  subscribe(callback: (requests: Map<string, RequestEntry>) => void): () => void {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  private notifyObservers(): void {
    this.observers.forEach(callback => {
      callback(new Map(this.requests));
    });
  }
}

// Global singleton instance
export const requestManager = new RequestManager();

export default requestManager;
