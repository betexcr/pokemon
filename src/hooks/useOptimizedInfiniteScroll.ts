'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'

interface UseOptimizedInfiniteScrollOptions {
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
  // Performance optimizations
  enableVirtualization?: boolean
  virtualItemHeight?: number
  overscan?: number
  batchSize?: number
  preloadThreshold?: number
}

interface UseOptimizedInfiniteScrollReturn<T> {
  data: T[]
  loading: boolean
  hasMore: boolean
  error: string | null
  loadMore: () => Promise<void>
  reset: () => void
  sentinelRef: (node: HTMLDivElement | null) => void
  // Virtualization helpers
  virtualItems: Array<{
    index: number
    start: number
    end: number
    size: number
  }>
  totalSize: number
  scrollElement: HTMLElement | null
}

export function useOptimizedInfiniteScroll<T>(
  fetchFunction: (offset: number, limit: number) => Promise<T[]>,
  options: UseOptimizedInfiniteScrollOptions
): UseOptimizedInfiniteScrollReturn<T> {
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
    maxItemsFallback,
    enableVirtualization = false,
    virtualItemHeight = 200,
    overscan = 5,
    batchSize = 20,
    preloadThreshold = 0.8
  } = options

  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [offset, setOffset] = useState(0)
  const [retryCount, setRetryCount] = useState(0)
  const [totalCount, setTotalCount] = useState<number | null>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)
  
  const totalCountResolvedRef = useRef(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const [sentinelNode, setSentinelNode] = useState<HTMLDivElement | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const isLoadingRef = useRef(false)
  const lastLoadTimeRef = useRef(0)
  const scrollElementRef = useRef<HTMLElement | null>(null)
  const preloadTriggeredRef = useRef(false)

  const expectedTotal = useMemo(() => {
    if (typeof totalCount === 'number') return totalCount
    if (typeof maxItemsFallback === 'number') return maxItemsFallback
    return null
  }, [totalCount, maxItemsFallback])

  // Optimized load more function with batching and preloading
  const loadMore = useCallback(async () => {
    console.log('🔍 loadMore called:', { enabled, isLoading: isLoadingRef.current, hasMore, offset })
    
    if (!enabled || isLoadingRef.current || !hasMore) {
      console.log('🔍 loadMore early return:', { enabled, isLoading: isLoadingRef.current, hasMore })
      return
    }

    // Protection against rapid calls
    const now = Date.now()
    if (now - lastLoadTimeRef.current < 100) {
      console.log('🔍 loadMore rate limited:', { timeSinceLastLoad: now - lastLoadTimeRef.current })
      return
    }
    lastLoadTimeRef.current = now

    console.log('🔍 loadMore proceeding with fetch:', { offset, fetchSize })
    isLoadingRef.current = true
    setLoading(true)
    setError(null)

    try {
      let pageOffset = offset
      let attempts = 0
      let newData: T[] = []

      // Use smaller batch size for better performance
      const currentBatchSize = fetchSize > 0 ? fetchSize : batchSize

      while (attempts < 3) {
        console.log(`🔍 Fetching batch: offset=${pageOffset}, limit=${currentBatchSize}, attempt=${attempts + 1}`)
        const batch = await fetchFunction(pageOffset, currentBatchSize)
        console.log(`🔍 Batch result: received ${batch.length} items`)
        if (batch.length > 0) {
          newData = batch
          break
        }

        // Only try next batch if we haven't reached the expected total yet
        if (expectedTotal != null && pageOffset + currentBatchSize < expectedTotal) {
          attempts += 1
          pageOffset += currentBatchSize
          continue
        }

        break
      }

      if (newData.length === 0) {
        // Only set hasMore to false if we actually got no data and we've tried multiple times
        if (attempts >= 3) {
          console.log('🛑 No more data available after multiple attempts, setting hasMore to false')
          setHasMore(false)
        } else {
          // Try next offset
          const nextOffset = pageOffset + currentBatchSize
          console.log('🔄 No data in this batch, trying next offset:', nextOffset)
          setOffset(nextOffset)
        }
        return
      }

      let appendedCount = 0
      // Deduplicate data based on id property if it exists
      setData(prev => {
        const existingIds = new Set(prev.map((item: any) => item.id))
        const uniqueNewData = newData.filter((item: any) => !existingIds.has(item.id))
        appendedCount = uniqueNewData.length
        if (appendedCount === 0) {
          return prev
        }
        return [...prev, ...uniqueNewData]
      })

      // Advance offset by actual number of new records appended.
      // If we didn't append anything (all duplicates), still move forward by the batch size
      // to avoid requesting the same window repeatedly.
      const advanceBy = appendedCount > 0 ? appendedCount : newData.length
      setOffset(pageOffset + advanceBy)
      setRetryCount(0)

      // Don't set hasMore to false based on expected total - let the API response determine this
      // Only set hasMore to false when we actually get no data from the API

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

      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
      isLoadingRef.current = false
    }
  }, [enabled, hasMore, offset, fetchSize, fetchFunction, retryCount, retryAttempts, retryDelay, expectedTotal, batchSize])

  // Preload function for better UX
  const preloadMore = useCallback(async () => {
    if (!enabled || isLoadingRef.current || !hasMore || preloadTriggeredRef.current) {
      return
    }

    preloadTriggeredRef.current = true
    await loadMore()
    preloadTriggeredRef.current = false
  }, [enabled, hasMore, loadMore])

  // Reset function
  const reset = useCallback(() => {
    setData([])
    setOffset(0)
    setHasMore(true)
    setError(null)
    setRetryCount(0)
    isLoadingRef.current = false
    setTotalCount(null)
    totalCountResolvedRef.current = false
    preloadTriggeredRef.current = false
  }, [])

  // Virtualization calculations
  const virtualItems = useMemo(() => {
    if (!enableVirtualization || data.length === 0) {
      return []
    }

    const items: Array<{
      index: number
      start: number
      end: number
      size: number
    }> = []

    let start = 0
    for (let i = 0; i < data.length; i++) {
      const size = virtualItemHeight
      const end = start + size
      
      items.push({
        index: i,
        start,
        end,
        size
      })
      
      start = end
    }

    return items
  }, [data.length, enableVirtualization, virtualItemHeight])

  const totalSize = useMemo(() => {
    if (!enableVirtualization) return 0
    return data.length * virtualItemHeight
  }, [data.length, enableVirtualization, virtualItemHeight])

  // Scroll tracking for virtualization
  useEffect(() => {
    if (!enableVirtualization) return

    const scrollElement = document.querySelector('.flex-1.min-h-0.overflow-y-auto') as HTMLElement
    if (!scrollElement) return

    scrollElementRef.current = scrollElement

    const handleScroll = () => {
      const { scrollTop, clientHeight } = scrollElement
      setScrollTop(scrollTop)
      setContainerHeight(clientHeight)

      // Preload when approaching the end
      if (hasMore && !loading && scrollTop > 0) {
        const scrollPercentage = scrollTop / (scrollElement.scrollHeight - clientHeight)
        if (scrollPercentage > preloadThreshold) {
          preloadMore()
        }
      }
    }

    scrollElement.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial call

    return () => {
      scrollElement.removeEventListener('scroll', handleScroll)
    }
  }, [enableVirtualization, hasMore, loading, preloadMore, preloadThreshold])

  // Intersection observer for automatic loading
  useEffect(() => {
    if (!enabled || !hasMore || loading) {
      console.log('🔍 IntersectionObserver setup skipped:', { enabled, hasMore, loading })
      return
    }
    
    console.log('🔍 Setting up IntersectionObserver:', { enabled, hasMore, loading, dataLength: data.length })

    const setupObserver = () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }

      observerRef.current = new IntersectionObserver(
        (entries) => {
          const [entry] = entries
          console.log('🔍 IntersectionObserver triggered:', { 
            isIntersecting: entry.isIntersecting, 
            ratio: entry.intersectionRatio.toFixed(2),
            mostlyVisible: entry.intersectionRatio > 0.5,
            isLoading: isLoadingRef.current,
            hasMore,
            dataLength: data.length,
            offset
          })
          if (entry.isIntersecting && !isLoadingRef.current && hasMore) {
            console.log('🔍 Calling loadMore from IntersectionObserver')
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
        console.log('🔍 IntersectionObserver observing sentinel node')
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

  // Scroll-based backup detection
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
    sentinelRef: setSentinelRef,
    virtualItems,
    totalSize,
    scrollElement: scrollElementRef.current
  }
}

export default useOptimizedInfiniteScroll
