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
    debounceMs = 800,
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

  // Throttled search function with improved cancellation
  const performSearch = useCallback(async (term: string) => {
    if (!term.trim()) {
      setResults([])
      setIsLoading(false)
      setError(null)
      return
    }

    // Check cache first
    const cached = getCachedResults(term)
    if (cached) {
      setResults(cached)
      setIsLoading(false)
      return
    }

    // Cancel previous request
    if (abortController.current) {
      abortController.current.abort()
    }
    abortController.current = new AbortController()

    // Throttle requests with improved timing
    const now = Date.now()
    if (now - lastRequestTime.current < throttleMs) {
      const delay = throttleMs - (now - lastRequestTime.current)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
    lastRequestTime.current = Date.now()

    // Check if request was cancelled during throttle delay
    if (abortController.current.signal.aborted) {
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      const searchResults = await searchPokemonByName(term, abortController.current.signal)
      
      // Cache the results
      cacheResults(term, searchResults)
      
      setResults(searchResults)
    } catch (err) {
      if (err instanceof Error && (err.name === 'AbortError' || err.message === 'Search cancelled')) {
        // Request was cancelled, ignore
        return
      }
      
      // Provide user-friendly error messages
      let errorMessage = 'Search failed'
      if (err instanceof Error) {
        if (err.message.includes('503') || err.message.includes('Service Unavailable')) {
          errorMessage = 'The Pokémon database is temporarily unavailable. Please try again in a moment.'
        } else if (err.message.includes('temporarily unavailable')) {
          errorMessage = 'Service temporarily unavailable. Please try again in a moment.'
        } else if (err.message.includes('Network')) {
          errorMessage = 'Network error. Please check your connection and try again.'
        } else {
          errorMessage = err.message
        }
      }
      
      setError(errorMessage)
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
    // Update search term immediately for responsive typing - this should be the first thing
    setSearchTerm(newTerm)
    
    // Defer other state updates to prevent blocking the UI thread
    setTimeout(() => {
      if (!newTerm.trim()) {
        // Clear results immediately for empty search
        setResults([])
        setIsLoading(false)
        setError(null)
        debouncedSearch('')
        return
      }

      // Check cache immediately for instant results
      const cached = getCachedResults(newTerm)
      if (cached) {
        setResults(cached)
        setIsLoading(false)
        setError(null)
      } else {
        // Only set loading if we're not already loading to prevent unnecessary re-renders
        setIsLoading(prev => prev ? prev : true)
        debouncedSearch(newTerm)
      }
    }, 0)
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
