import { useState, useCallback, useRef, useEffect } from 'react'
import { Pokemon } from '@/types/pokemon'
import { searchPokemonByName } from '@/lib/api'
import { debounce } from 'lodash'

interface SearchCache {
  [key: string]: {
    results: Pokemon[]
    timestamp: number
    ttl: number
  }
}

interface UseSearchOptions {
  debounceMs?: number
  cacheTtl?: number
  throttleMs?: number
}

export function useSearch(options: UseSearchOptions = {}) {
  const {
    debounceMs = 300,
    cacheTtl = 5 * 60 * 1000, // 5 minutes
    throttleMs = 100
  } = options

  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<Pokemon[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const searchCache = useRef<SearchCache>({})
  const lastRequestTime = useRef<number>(0)
  const abortController = useRef<AbortController | null>(null)

  // Check if search term is cached and valid
  const getCachedResults = useCallback((term: string): Pokemon[] | null => {
    const cached = searchCache.current[term.toLowerCase()]
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.results
    }
    return null
  }, [])

  // Cache search results
  const cacheResults = useCallback((term: string, results: Pokemon[]) => {
    searchCache.current[term.toLowerCase()] = {
      results,
      timestamp: Date.now(),
      ttl: cacheTtl
    }
  }, [cacheTtl])

  // Throttled search function
  const performSearch = useCallback(async (term: string) => {
    if (!term.trim()) {
      setResults([])
      setIsLoading(false)
      return
    }

    // Check cache first
    const cached = getCachedResults(term)
    if (cached) {
      setResults(cached)
      setIsLoading(false)
      return
    }

    // Throttle requests
    const now = Date.now()
    if (now - lastRequestTime.current < throttleMs) {
      const delay = throttleMs - (now - lastRequestTime.current)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
    lastRequestTime.current = Date.now()

    // Cancel previous request
    if (abortController.current) {
      abortController.current.abort()
    }
    abortController.current = new AbortController()

    try {
      setIsLoading(true)
      setError(null)
      
      const searchResults = await searchPokemonByName(term)
      
      // Cache the results
      cacheResults(term, searchResults)
      
      setResults(searchResults)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled, ignore
        return
      }
      setError(err instanceof Error ? err.message : 'Search failed')
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [getCachedResults, cacheResults, throttleMs])

  // Debounced search
  const debouncedSearch = useCallback(
    debounce(performSearch, debounceMs),
    [performSearch, debounceMs]
  )

  // Handle search term changes
  const handleSearchChange = useCallback((newTerm: string) => {
    setSearchTerm(newTerm)
    
    if (!newTerm.trim()) {
      setResults([])
      setIsLoading(false)
      setError(null)
      return
    }

    // Check cache immediately for instant results
    const cached = getCachedResults(newTerm)
    if (cached) {
      setResults(cached)
      setIsLoading(false)
      setError(null)
    } else {
      setIsLoading(true)
      debouncedSearch(newTerm)
    }
  }, [debouncedSearch, getCachedResults])

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchTerm('')
    setResults([])
    setIsLoading(false)
    setError(null)
    
    // Cancel any pending requests
    if (abortController.current) {
      abortController.current.abort()
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortController.current) {
        abortController.current.abort()
      }
    }
  }, [])

  return {
    searchTerm,
    results,
    isLoading,
    error,
    handleSearchChange,
    clearSearch,
    performSearch: debouncedSearch
  }
}
