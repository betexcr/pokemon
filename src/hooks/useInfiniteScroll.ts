'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'

interface UseInfiniteScrollOptions {
  fetchSize: number
  initialLoad?: boolean
  enabled?: boolean
  retryAttempts?: number
  retryDelay?: number
  scrollThreshold?: number
  rootMargin?: string
  threshold?: number
  getTotalCount?: () => Promise<number>
  maxItemsFallback?: number
}

interface UseInfiniteScrollReturn<T> {
  data: T[]
  loading: boolean
  hasMore: boolean
  error: string | null
  loadMore: () => Promise<void>
  reset: () => void
  sentinelRef: (node: HTMLDivElement | null) => void
}

export function useInfiniteScroll<T>(
  fetchFunction: (offset: number, limit: number) => Promise<T[]>,
  options: UseInfiniteScrollOptions
): UseInfiniteScrollReturn<T> {
  const {
    fetchSize,
    initialLoad = true,
    enabled = true,
    retryAttempts = 3,
    retryDelay = 1000,
    scrollThreshold = 200,
    rootMargin = '200px',
    threshold = 0.1,
    getTotalCount,
    maxItemsFallback
  } = options

  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [offset, setOffset] = useState(0)
  const [retryCount, setRetryCount] = useState(0)
  const [totalCount, setTotalCount] = useState<number | null>(null)
  const totalCountResolvedRef = useRef(false)
  
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const [sentinelNode, setSentinelNode] = useState<HTMLDivElement | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const isLoadingRef = useRef(false)
  const lastLoadTimeRef = useRef(0)

  const expectedTotal = useMemo(() => {
    if (typeof totalCount === 'number') return totalCount
    if (typeof maxItemsFallback === 'number') return maxItemsFallback
    return null
  }, [totalCount, maxItemsFallback])

  // Secure load more function with comprehensive error handling
  const loadMore = useCallback(async () => {
    if (!enabled || isLoadingRef.current || !hasMore) {
      return
    }

    // Protection against rapid calls
    const now = Date.now()
    if (now - lastLoadTimeRef.current < 500) {
      return
    }
    lastLoadTimeRef.current = now

    isLoadingRef.current = true
    setLoading(true)
    setError(null)

    try {
      let pageOffset = offset
      let attempts = 0
      let newData: T[] = []

      while (attempts < 3) {
        const batch = await fetchFunction(pageOffset, fetchSize)
        if (batch.length > 0) {
          newData = batch
          break
        }

        if (expectedTotal != null && pageOffset + fetchSize < expectedTotal) {
          attempts += 1
          pageOffset += fetchSize
          continue
        }

        break
      }

      if (newData.length === 0) {
        setHasMore(false)
        return
      }

      // Deduplicate data based on id property if it exists
      setData(prev => {
        const existingIds = new Set(prev.map((item: any) => item.id))
        const uniqueNewData = newData.filter((item: any) => !existingIds.has(item.id))
        return [...prev, ...uniqueNewData]
      })

      // Advance by the actual number of items received to avoid gaps when fetchers return partial pages
      setOffset(pageOffset + newData.length)
      setRetryCount(0) // Reset retry count on successful load

      // End-of-data detection: rely on known total when available
      if (expectedTotal != null && pageOffset + newData.length >= expectedTotal) {
        setHasMore(false)
      }

    } catch (err) {
      console.error('Error loading more data:', err)
      
      // Retry logic with exponential backoff
      if (retryCount < retryAttempts) {
        setRetryCount(prev => prev + 1)
        const delay = retryDelay * Math.pow(2, retryCount)
        setTimeout(() => {
          loadMore()
        }, delay)
        return
      }

      // If all retries failed, surface error but allow manual retry attempts
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
      isLoadingRef.current = false
    }
  }, [enabled, hasMore, offset, fetchSize, fetchFunction, retryCount, retryAttempts, retryDelay, expectedTotal])

  // Reset function to clear all data and start fresh
  const reset = useCallback(() => {
    setData([])
    setOffset(0)
    setHasMore(true)
    setError(null)
    setRetryCount(0)
    isLoadingRef.current = false
    setTotalCount(null)
    totalCountResolvedRef.current = false
  }, [])

  // Set up intersection observer for automatic loading
  useEffect(() => {
    if (!enabled || !hasMore || loading) {
      return
    }

    const setupObserver = () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }

      observerRef.current = new IntersectionObserver(
        (entries) => {
          const [entry] = entries
          if (entry.isIntersecting && !isLoadingRef.current && hasMore) {
            loadMore()
          }
        },
        {
          root: null,
          rootMargin,
          threshold
        }
      )

      if (sentinelNode) {
        observerRef.current.observe(sentinelNode)
      }
    }

    setupObserver()

    return () => {
      if (observerRef.current) {
        if (sentinelNode) {
          observerRef.current.unobserve(sentinelNode)
        }
        observerRef.current.disconnect()
      }
    }
  }, [enabled, hasMore, loading, loadMore, rootMargin, threshold, sentinelNode])

  // Set up scroll-based backup detection
  useEffect(() => {
    if (!enabled || !hasMore || loading) {
      return
    }

    const handleScroll = () => {
      if (isLoadingRef.current || !hasMore) return

      const scrollElement = document.querySelector('.flex-1.min-h-0.overflow-y-auto') || 
                           document.documentElement
      
      const { scrollTop, scrollHeight, clientHeight } = scrollElement
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight

      if (distanceFromBottom < scrollThreshold) {
        loadMore()
      }
    }

    const scrollElement = document.querySelector('.flex-1.min-h-0.overflow-y-auto') || 
                         document.documentElement

    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll, { passive: true })
      return () => {
        scrollElement.removeEventListener('scroll', handleScroll)
      }
    }
  }, [enabled, hasMore, loading, loadMore, scrollThreshold])

  // Initial load
  useEffect(() => {
    if (initialLoad && enabled && data.length === 0) {
      loadMore()
    }
  }, [initialLoad, enabled, data.length, loadMore])

  // Sentinel ref setter
  const setSentinelRef = useCallback((node: HTMLDivElement | null) => {
    sentinelRef.current = node
    setSentinelNode(prev => (prev === node ? prev : node))

    if (observerRef.current) {
      observerRef.current.disconnect()
      if (node) {
        observerRef.current.observe(node)
      }
    }
  }, [])

  // Resolve total count once when enabled
  useEffect(() => {
    if (!enabled) return
    if (!getTotalCount) return
    if (totalCountResolvedRef.current) return

    let cancelled = false

    const resolveTotal = async () => {
      try {
        const total = await getTotalCount()
        if (!cancelled && typeof total === 'number' && !Number.isNaN(total)) {
          setTotalCount(total)
        }
      } catch {
        if (!cancelled && typeof maxItemsFallback === 'number') {
          setTotalCount(maxItemsFallback)
        }
      } finally {
        if (!cancelled) {
          totalCountResolvedRef.current = true
        }
      }
    }

    resolveTotal()

    return () => {
      cancelled = true
    }
  }, [enabled, getTotalCount, maxItemsFallback])

  return {
    data,
    loading,
    hasMore,
    error,
    loadMore,
    reset,
    sentinelRef: setSentinelRef
  }
}

export default useInfiniteScroll
