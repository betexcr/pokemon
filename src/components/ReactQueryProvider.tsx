'use client'

import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Query client configuration
const queryClient = new QueryClient({
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

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

export default queryClient
