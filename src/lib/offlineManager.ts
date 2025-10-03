// Offline Manager for better network state handling
// Provides robust offline detection and fallback mechanisms

import React from 'react'

export interface NetworkState {
  isOnline: boolean
  isSlowConnection: boolean
  lastOnlineTime: number
  connectionType: string
}

class OfflineManager {
  private isOnline = navigator.onLine
  private isSlowConnection = false
  private lastOnlineTime = Date.now()
  private connectionType = 'unknown'
  private listeners: Array<(state: NetworkState) => void> = []
  private retryQueue: Array<() => Promise<void>> = []
  private isRetrying = false

  constructor() {
    // Only initialize in browser environment
    if (typeof window !== 'undefined') {
      this.setupEventListeners()
      this.detectConnectionType()
      this.startConnectionMonitoring()
    }
  }

  private setupEventListeners() {
    if (typeof window === 'undefined') return
    
    window.addEventListener('online', () => {
      this.isOnline = true
      this.lastOnlineTime = Date.now()
      this.notifyListeners()
      this.processRetryQueue()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
      this.notifyListeners()
    })

    // Monitor connection changes
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      connection.addEventListener('change', () => {
        this.detectConnectionType()
        this.notifyListeners()
      })
    }
  }

  private detectConnectionType() {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection
      this.connectionType = connection.effectiveType || 'unknown'
      this.isSlowConnection = connection.effectiveType === 'slow-2g' || 
                            connection.effectiveType === '2g' ||
                            connection.downlink < 1
    }
  }

  private startConnectionMonitoring() {
    if (typeof window === 'undefined') return
    
    // Ping a lightweight endpoint to verify actual connectivity
    setInterval(() => {
      this.checkConnectivity()
    }, 30000) // Check every 30 seconds
  }

  private async checkConnectivity() {
    if (typeof window === 'undefined') return
    
    try {
      // Use a lightweight endpoint for connectivity check
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok && !this.isOnline) {
        // We're actually online, update state
        this.isOnline = true
        this.lastOnlineTime = Date.now()
        this.notifyListeners()
        this.processRetryQueue()
      }
    } catch (error) {
      if (this.isOnline) {
        // We're actually offline, update state
        this.isOnline = false
        this.notifyListeners()
      }
    }
  }

  private notifyListeners() {
    const state: NetworkState = {
      isOnline: this.isOnline,
      isSlowConnection: this.isSlowConnection,
      lastOnlineTime: this.lastOnlineTime,
      connectionType: this.connectionType
    }
    
    this.listeners.forEach(listener => {
      try {
        listener(state)
      } catch (error) {
        console.error('Error in network state listener:', error)
      }
    })
  }

  private async processRetryQueue() {
    if (this.isRetrying || this.retryQueue.length === 0) return
    
    this.isRetrying = true
    
    while (this.retryQueue.length > 0 && this.isOnline) {
      const retryFn = this.retryQueue.shift()
      if (retryFn) {
        try {
          await retryFn()
        } catch (error) {
          console.warn('Retry failed:', error)
          // Re-queue if it's a network error
          if (error instanceof TypeError && error.message.includes('fetch')) {
            this.retryQueue.push(retryFn)
          }
        }
      }
    }
    
    this.isRetrying = false
  }

  // Public API
  getNetworkState(): NetworkState {
    return {
      isOnline: this.isOnline,
      isSlowConnection: this.isSlowConnection,
      lastOnlineTime: this.lastOnlineTime,
      connectionType: this.connectionType
    }
  }

  addListener(listener: (state: NetworkState) => void) {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  queueRetry(retryFn: () => Promise<void>) {
    this.retryQueue.push(retryFn)
    if (this.isOnline) {
      this.processRetryQueue()
    }
  }

  // Enhanced fetch with offline handling
  async fetchWithOfflineSupport(
    url: string, 
    options: RequestInit = {},
    retryCount = 3
  ): Promise<Response> {
    const fetchWithRetry = async (attempt: number): Promise<Response> => {
      try {
        // Add timeout to prevent hanging requests
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)
        
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        return response
      } catch (error) {
        if (attempt < retryCount && this.isOnline) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000
          await new Promise(resolve => setTimeout(resolve, delay))
          return fetchWithRetry(attempt + 1)
        }
        throw error
      }
    }

    if (!this.isOnline) {
      // Queue for retry when online
      return new Promise((resolve, reject) => {
        this.queueRetry(async () => {
          try {
            const response = await fetchWithRetry(0)
            resolve(response)
          } catch (error) {
            reject(error)
          }
        })
      })
    }

    return fetchWithRetry(0)
  }

  // Check if we should use cached data
  shouldUseCache(): boolean {
    return !this.isOnline || this.isSlowConnection
  }

  // Get cache strategy based on network state
  getCacheStrategy(): 'cache-first' | 'network-first' | 'stale-while-revalidate' {
    if (!this.isOnline) return 'cache-first'
    if (this.isSlowConnection) return 'stale-while-revalidate'
    return 'network-first'
  }
}

// Global instance
export const offlineManager = new OfflineManager()

// React hook for network state
export function useNetworkState() {
  const [networkState, setNetworkState] = React.useState(offlineManager.getNetworkState())

  React.useEffect(() => {
    const unsubscribe = offlineManager.addListener(setNetworkState)
    return unsubscribe
  }, [])

  return networkState
}

// Utility functions
export const networkUtils = {
  // Check if we're offline
  isOffline: () => !offlineManager.getNetworkState().isOnline,
  
  // Check if connection is slow
  isSlowConnection: () => offlineManager.getNetworkState().isSlowConnection,
  
  // Get connection type
  getConnectionType: () => offlineManager.getNetworkState().connectionType,
  
  // Enhanced fetch with offline support
  fetch: (url: string, options?: RequestInit) => 
    offlineManager.fetchWithOfflineSupport(url, options),
  
  // Queue a retry operation
  queueRetry: (retryFn: () => Promise<void>) => 
    offlineManager.queueRetry(retryFn),
  
  // Get appropriate cache strategy
  getCacheStrategy: () => offlineManager.getCacheStrategy(),
  
  // Check if we should use cache
  shouldUseCache: () => offlineManager.shouldUseCache()
}

export default offlineManager
