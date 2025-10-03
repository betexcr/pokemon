// React Query configuration for Pokemon data caching
// Provides optimized data fetching and caching with React Query

import React from 'react'
import { QueryClient, QueryClientProvider, useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pokemonCache, cacheUtils } from './cache'
import { getPokemon, getPokemonList, getPokemonTotalCount, searchPokemonByName } from './api'

// Query client configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache time - how long data stays in cache when not being used
      gcTime: 24 * 60 * 60 * 1000, // 24 hours
      // Stale time - how long data is considered fresh
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Retry configuration
      retry: (failureCount, error: any) => {
        // Don't retry on 404 errors
        if (error?.status === 404) return false
        // Retry up to 3 times for other errors
        return failureCount < 3
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: true,
      // Background refetch
      refetchOnMount: true,
    },
    mutations: {
      retry: 1,
    },
  },
})

// Query keys for consistent caching
export const queryKeys = {
  pokemon: {
    all: ['pokemon'] as const,
    lists: () => [...queryKeys.pokemon.all, 'list'] as const,
    list: (limit: number, offset: number) => [...queryKeys.pokemon.lists(), { limit, offset }] as const,
    details: () => [...queryKeys.pokemon.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.pokemon.details(), id] as const,
    totalCount: () => [...queryKeys.pokemon.all, 'totalCount'] as const,
  },
  search: {
    all: ['search'] as const,
    query: (query: string) => [...queryKeys.search.all, query] as const,
  },
  images: {
    all: ['images'] as const,
    pokemon: (id: number) => [...queryKeys.images.all, 'pokemon', id] as const,
  }
}

// Pokemon data hooks
export function usePokemon(id: number) {
  return useQuery({
    queryKey: queryKeys.pokemon.detail(id),
    queryFn: async () => {
      // Check cache first
      const cacheKey = cacheUtils.pokemonKey(id)
      const cached = pokemonCache.get(cacheKey)
      if (cached) {
        return cached
      }
      
      // Fetch from API
      const data = await getPokemon(id)
      
      // Cache the result
      pokemonCache.set(cacheKey, data)
      
      return data
    },
    enabled: !!id && id > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes for individual Pokemon
  })
}

export function usePokemonList(limit = 100, offset = 0) {
  return useQuery({
    queryKey: queryKeys.pokemon.list(limit, offset),
    queryFn: async () => {
      const cacheKey = cacheUtils.pokemonListKey(limit, offset)
      const cached = pokemonCache.get(cacheKey)
      if (cached) {
        return cached
      }
      
      const data = await getPokemonList(limit, offset)
      pokemonCache.set(cacheKey, data)
      
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes for lists
  })
}

export function usePokemonTotalCount() {
  return useQuery({
    queryKey: queryKeys.pokemon.totalCount(),
    queryFn: async () => {
      const cached = pokemonCache.get('pokemon_total_count')
      if (cached) {
        return cached
      }
      
      const count = await getPokemonTotalCount()
      pokemonCache.set('pokemon_total_count', count, 60 * 60 * 1000) // 1 hour
      
      return count
    },
    staleTime: 60 * 60 * 1000, // 1 hour for total count
  })
}

// Infinite query for paginated Pokemon data
export function useInfinitePokemonList(limit = 100) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.pokemon.lists(), 'infinite', { limit }],
    queryFn: async ({ pageParam = 0 }) => {
      const cacheKey = cacheUtils.pokemonListKey(limit, pageParam)
      const cached = pokemonCache.get(cacheKey)
      if (cached) {
        return cached
      }
      
      const data = await getPokemonList(limit, pageParam)
      pokemonCache.set(cacheKey, data)
      
      return data
    },
    getNextPageParam: (lastPage, allPages) => {
      const totalFetched = allPages.length * limit
      return lastPage.results.length === limit ? totalFetched : undefined
    },
    staleTime: 5 * 60 * 1000,
  })
}

// Search hook
export function usePokemonSearch(query: string) {
  return useQuery({
    queryKey: queryKeys.search.query(query),
    queryFn: async () => {
      const cacheKey = cacheUtils.searchKey(query)
      const cached = pokemonCache.get(cacheKey)
      if (cached) {
        return cached
      }
      
      const results = await searchPokemonByName(query)
      pokemonCache.set(cacheKey, results, 2 * 60 * 1000) // 2 minutes for search
      
      return results
    },
    enabled: !!query && query.length >= 2,
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
  })
}

// Prefetch utilities
export function usePrefetchPokemon() {
  const queryClient = useQueryClient()
  
  return {
    prefetchPokemon: (id: number) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.pokemon.detail(id),
        queryFn: async () => {
          const cacheKey = cacheUtils.pokemonKey(id)
          const cached = pokemonCache.get(cacheKey)
          if (cached) return cached
          
          const data = await getPokemon(id)
          pokemonCache.set(cacheKey, data)
          return data
        },
        staleTime: 10 * 60 * 1000,
      })
    },
    
    prefetchPokemonList: (limit: number, offset: number) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.pokemon.list(limit, offset),
        queryFn: async () => {
          const cacheKey = cacheUtils.pokemonListKey(limit, offset)
          const cached = pokemonCache.get(cacheKey)
          if (cached) return cached
          
          const data = await getPokemonList(limit, offset)
          pokemonCache.set(cacheKey, data)
          return data
        },
        staleTime: 5 * 60 * 1000,
      })
    },
    
    prefetchSearch: (query: string) => {
      if (query.length >= 2) {
        queryClient.prefetchQuery({
          queryKey: queryKeys.search.query(query),
          queryFn: async () => {
            const cacheKey = cacheUtils.searchKey(query)
            const cached = pokemonCache.get(cacheKey)
            if (cached) return cached
            
            const results = await searchPokemonByName(query)
            pokemonCache.set(cacheKey, results, 2 * 60 * 1000)
            return results
          },
          staleTime: 2 * 60 * 1000,
        })
      }
    }
  }
}

// Cache management hooks
export function useCacheManagement() {
  const queryClient = useQueryClient()
  
  return {
    // Clear all caches
    clearAllCaches: () => {
      queryClient.clear()
      pokemonCache.clear()
    },
    
    // Clear specific cache
    clearPokemonCache: (id?: number) => {
      if (id) {
        queryClient.removeQueries({ queryKey: queryKeys.pokemon.detail(id) })
        pokemonCache.delete(cacheUtils.pokemonKey(id))
      } else {
        queryClient.removeQueries({ queryKey: queryKeys.pokemon.all })
        pokemonCache.clear()
      }
    },
    
    // Clear search cache
    clearSearchCache: () => {
      queryClient.removeQueries({ queryKey: queryKeys.search.all })
    },
    
    // Get cache statistics
    getCacheStats: () => {
      return {
        reactQuery: {
          cache: queryClient.getQueryCache().getAll().length,
          mutations: queryClient.getMutationCache().getAll().length,
        },
        pokemonCache: pokemonCache.getStats(),
      }
    },
    
    // Invalidate and refetch
    invalidatePokemon: (id?: number) => {
      if (id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.pokemon.detail(id) })
      } else {
        queryClient.invalidateQueries({ queryKey: queryKeys.pokemon.all })
      }
    },
    
    // Set cache data manually
    setPokemonCache: (id: number, data: any) => {
      const cacheKey = cacheUtils.pokemonKey(id)
      pokemonCache.set(cacheKey, data)
      queryClient.setQueryData(queryKeys.pokemon.detail(id), data)
    }
  }
}

// Background sync hook
export function useBackgroundSync() {
  const queryClient = useQueryClient()
  
  return {
    // Sync Pokemon data in background
    syncPokemonData: async (ids: number[]) => {
      const promises = ids.map(id => 
        queryClient.prefetchQuery({
          queryKey: queryKeys.pokemon.detail(id),
          queryFn: async () => {
            const cacheKey = cacheUtils.pokemonKey(id)
            const cached = pokemonCache.get(cacheKey)
            if (cached) return cached
            
            const data = await getPokemon(id)
            pokemonCache.set(cacheKey, data)
            return data
          },
          staleTime: 10 * 60 * 1000,
        })
      )
      
      await Promise.allSettled(promises)
    },
    
    // Sync search results
    syncSearchResults: async (queries: string[]) => {
      const promises = queries.map(query => 
        queryClient.prefetchQuery({
          queryKey: queryKeys.search.query(query),
          queryFn: async () => {
            const cacheKey = cacheUtils.searchKey(query)
            const cached = pokemonCache.get(cacheKey)
            if (cached) return cached
            
            const results = await searchPokemonByName(query)
            pokemonCache.set(cacheKey, results, 2 * 60 * 1000)
            return results
          },
          staleTime: 2 * 60 * 1000,
        })
      )
      
      await Promise.allSettled(promises)
    }
  }
}

// React Query Provider component
export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  return React.createElement(QueryClientProvider, { client: queryClient }, children)
}

export default queryClient
