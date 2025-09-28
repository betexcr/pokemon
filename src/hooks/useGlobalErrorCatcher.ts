'use client'

import { useEffect, useCallback } from 'react'
import { useErrorReporter } from '@/contexts/ErrorContext'

interface GlobalErrorCatcherOptions {
  enableConsoleCapture?: boolean
  enableUnhandledRejection?: boolean
  enableNetworkErrorCapture?: boolean
  enableDataLoadingErrorCapture?: boolean
}

export function useGlobalErrorCatcher(options: GlobalErrorCatcherOptions = {}) {
  const {
    enableConsoleCapture = true,
    enableUnhandledRejection = true,
    enableNetworkErrorCapture = true,
    enableDataLoadingErrorCapture = true
  } = options

  const { reportError, reportApiError, reportNetworkError, reportDataLoadingError } = useErrorReporter()

  // Capture console errors
  useEffect(() => {
    if (!enableConsoleCapture) return

    const originalError = console.error
    const originalWarn = console.warn

    console.error = (...args) => {
      originalError.apply(console, args)
      
      // Defer error reporting to avoid setState during render
      setTimeout(() => {
        // Try to extract meaningful error information
        const errorMessage = args.find(arg => 
          typeof arg === 'string' || 
          (arg instanceof Error)
        )
        
        if (errorMessage) {
          const message = typeof errorMessage === 'string' 
            ? errorMessage 
            : errorMessage.message || 'Unknown error'
          
          // Determine error type based on message content
          let type: 'data_loading' | 'api_error' | 'network_error' | 'validation_error' | 'unknown' = 'unknown'
          let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
          
          // Skip reporting expected 404 errors for regional variants
          if (message.includes('404') && (message.includes('pokemon-species') || message.includes('10172'))) {
            return // Skip reporting expected 404s
          }
          
          if (message.includes('fetch') || message.includes('API') || message.includes('HTTP')) {
            type = 'api_error'
            severity = 'high'
          } else if (message.includes('network') || message.includes('connection') || message.includes('timeout')) {
            type = 'network_error'
            severity = 'high'
          } else if (message.includes('loading') || message.includes('data') || message.includes('Pokemon')) {
            type = 'data_loading'
            severity = 'medium'
          } else if (message.includes('validation') || message.includes('invalid')) {
            type = 'validation_error'
            severity = 'low'
          }

          reportError(message, type, severity, {
            action: 'console.error',
            data: errorMessage instanceof Error ? errorMessage.stack : undefined
          })
        }
      }, 0)
    }

    console.warn = (...args) => {
      originalWarn.apply(console, args)
      
      // Defer error reporting to avoid setState during render
      setTimeout(() => {
        const warningMessage = args.find(arg => typeof arg === 'string')
        if (warningMessage && warningMessage.includes('Pokemon')) {
          // Skip reporting deduplication warnings as they're not actual errors
          if (warningMessage.includes('Duplicate Pokemon found')) {
            return
          }
          
          // Only report warnings that indicate actual data loading problems
          if (warningMessage.includes('failed to load') || 
              warningMessage.includes('loading error') ||
              warningMessage.includes('data error') ||
              warningMessage.includes('fetch failed')) {
            reportError(warningMessage, 'data_loading', 'low', {
              action: 'console.warn'
            })
          }
        }
      }, 0)
    }

    return () => {
      console.error = originalError
      console.warn = originalWarn
    }
  }, [enableConsoleCapture, reportError])

  // Capture unhandled promise rejections
  useEffect(() => {
    if (!enableUnhandledRejection) return

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Defer error reporting to avoid setState during render
      setTimeout(() => {
        const error = event.reason
        let message = 'Unhandled promise rejection'
        let type: 'data_loading' | 'api_error' | 'network_error' | 'validation_error' | 'unknown' = 'unknown'
        let severity: 'low' | 'medium' | 'high' | 'critical' = 'high'

        if (error instanceof Error) {
          message = error.message
          if (error.message.includes('fetch') || error.message.includes('API')) {
            type = 'api_error'
          } else if (error.message.includes('network') || error.message.includes('connection')) {
            type = 'network_error'
          } else if (error.message.includes('loading') || error.message.includes('Pokemon')) {
            type = 'data_loading'
            severity = 'medium'
          }
        } else if (typeof error === 'string') {
          message = error
        }

        reportError(message, type, severity, {
          action: 'unhandledRejection',
          data: error instanceof Error ? error.stack : undefined
        })
      }, 0)
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection)
  }, [enableUnhandledRejection, reportError])

  // Capture network errors via fetch interception
  useEffect(() => {
    if (!enableNetworkErrorCapture) return

    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args)
        
        // Check for HTTP error status codes
        if (!response.ok) {
          const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url
          const isPokemonApi = url.includes('pokeapi.co') || url.includes('pokemon')
          
          if (isPokemonApi) {
            // Only report 404s for Pokemon that should exist (IDs 1-1302)
            // Skip reporting 404s for species endpoints as they're expected for regional variants
            const shouldReport404 = () => {
              // Don't report 404s for species endpoints - these are expected for regional variants
              if (url.includes('/pokemon-species/')) {
                return false
              }
              
              // Don't report 404s for GitHub API (PMD portraits)
              if (url.includes('api.github.com')) {
                return false
              }
              
              // Don't report 404s for Pokemon IDs that are known to be regional variants
              const pokemonIdMatch = url.match(/\/pokemon\/(\d+)/)
              if (pokemonIdMatch) {
                const pokemonId = parseInt(pokemonIdMatch[1])
                // Regional variants and special forms often don't have direct species entries
                if (pokemonId > 10000) {
                  return false
                }
              }
              
              return true
            }
            
            if (response.status === 404 && !shouldReport404()) {
              // Skip reporting expected 404s
              return response
            }
            
            // Defer error reporting to avoid setState during render
            setTimeout(() => {
              reportApiError(
                `API request failed: ${response.status} ${response.statusText}`,
                {
                  action: 'fetch',
                  data: { url, status: response.status, statusText: response.statusText }
                }
              )
            }, 0)
          }
        }
        
        return response
      } catch (error) {
        const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url
        const isPokemonApi = url.includes('pokeapi.co') || url.includes('pokemon')
        
        if (isPokemonApi) {
          // Defer error reporting to avoid setState during render
          setTimeout(() => {
            reportNetworkError(
              `Network request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              {
                action: 'fetch',
                data: { url, error: error instanceof Error ? error.message : String(error) }
              }
            )
          }, 0)
        }
        
        throw error
      }
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [enableNetworkErrorCapture, reportApiError, reportNetworkError])

  // Data loading error detection
  const reportDataLoadingFailure = useCallback((
    dataType: string,
    identifier: string | number,
    error: Error | string,
    context?: any
  ) => {
    if (!enableDataLoadingErrorCapture) return

    const message = `Failed to load ${dataType}: ${identifier}`
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    reportDataLoadingError(message, {
      source: 'dataLoading',
      dataType,
      identifier: String(identifier),
      error: errorMessage,
      ...context
    })
  }, [enableDataLoadingErrorCapture, reportDataLoadingError])

  return {
    reportDataLoadingFailure
  }
}
