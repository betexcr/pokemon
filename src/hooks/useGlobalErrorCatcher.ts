'use client'

import { useEffect, useCallback, useRef } from 'react'
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
  const pendingTimers = useRef(new Set<ReturnType<typeof setTimeout>>())

  // Capture console errors
  useEffect(() => {
    if (!enableConsoleCapture) return

    const timers = pendingTimers.current
    const originalError = console.error
    const originalWarn = console.warn

    console.error = (...args) => {
      originalError.apply(console, args)
      
      // Defer error reporting to avoid setState during render
      const id = setTimeout(() => {
        timers.delete(id)
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
          
          if (message.includes('404')) {
            return
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
      timers.add(id)
    }

    console.warn = (...args) => {
      originalWarn.apply(console, args)
      
      const warnId = setTimeout(() => {
        timers.delete(warnId)
        const warningMessage = args.find(arg => typeof arg === 'string')
        if (warningMessage && warningMessage.includes('Pokemon')) {
          if (warningMessage.includes('Duplicate Pokemon found')) {
            return
          }
          
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
      timers.add(warnId)
    }

    return () => {
      console.error = originalError
      console.warn = originalWarn
      timers.forEach(id => clearTimeout(id))
      timers.clear()
    }
  }, [enableConsoleCapture, reportError])

  // Capture unhandled promise rejections
  useEffect(() => {
    if (!enableUnhandledRejection) return

    const pendingTimers = new Set<ReturnType<typeof setTimeout>>()

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const id = setTimeout(() => {
        pendingTimers.delete(id)
        const error = event.reason
        let message = 'Unhandled promise rejection'
        let type: 'data_loading' | 'api_error' | 'network_error' | 'validation_error' | 'unknown' = 'unknown'
        let severity: 'low' | 'medium' | 'high' | 'critical' = 'high'

        if (error instanceof Error) {
          if (error.message.includes('404')) {
            return
          }
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
      pendingTimers.add(id)
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      pendingTimers.forEach(id => clearTimeout(id))
    }
  }, [enableUnhandledRejection, reportError])

  // Capture network errors via fetch interception
  useEffect(() => {
    if (!enableNetworkErrorCapture) return

    const pendingTimers = new Set<ReturnType<typeof setTimeout>>()
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args)
        
        if (!response.ok) {
          const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url
          const isPokemonApi = url.includes('pokeapi.co') || url.includes('pokemon')
          
          if (isPokemonApi) {
            if (response.status === 404) {
              return response
            }
            
            const id = setTimeout(() => {
              pendingTimers.delete(id)
              reportApiError(
                `API request failed: ${response.status} ${response.statusText}`,
                {
                  action: 'fetch',
                  data: { url, status: response.status, statusText: response.statusText }
                }
              )
            }, 0)
            pendingTimers.add(id)
          }
        }
        
        return response
      } catch (error) {
        const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url
        const isPokemonApi = url.includes('pokeapi.co') || url.includes('pokemon')
        
        if (isPokemonApi) {
          const id = setTimeout(() => {
            pendingTimers.delete(id)
            reportNetworkError(
              `Network request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              {
                action: 'fetch',
                data: { url, error: error instanceof Error ? error.message : String(error) }
              }
            )
          }, 0)
          pendingTimers.add(id)
        }
        
        throw error
      }
    }

    return () => {
      window.fetch = originalFetch
      pendingTimers.forEach(id => clearTimeout(id))
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
