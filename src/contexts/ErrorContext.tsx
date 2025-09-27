'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { setGlobalErrorReporter } from '@/lib/errorReporting'

export interface ErrorInfo {
  id: string
  message: string
  type: 'data_loading' | 'api_error' | 'network_error' | 'validation_error' | 'unknown'
  timestamp: number
  context?: {
    page?: string
    component?: string
    action?: string
    data?: any
  }
  severity: 'low' | 'medium' | 'high' | 'critical'
  retryable: boolean
  retryCount?: number
  maxRetries?: number
}

interface ErrorContextType {
  errors: ErrorInfo[]
  addError: (error: Omit<ErrorInfo, 'id' | 'timestamp'>) => void
  removeError: (id: string) => void
  clearErrors: () => void
  retryError: (id: string) => void
  hasErrors: boolean
  hasCriticalErrors: boolean
  getErrorsByType: (type: ErrorInfo['type']) => ErrorInfo[]
  getErrorsBySeverity: (severity: ErrorInfo['severity']) => ErrorInfo[]
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined)

interface ErrorProviderProps {
  children: ReactNode
}

export function ErrorProvider({ children }: ErrorProviderProps) {
  const [errors, setErrors] = useState<ErrorInfo[]>([])

  const addError = useCallback((error: Omit<ErrorInfo, 'id' | 'timestamp'>) => {
    const newError: ErrorInfo = {
      ...error,
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: error.retryCount || 0,
      maxRetries: error.maxRetries || 3
    }

    setErrors(prev => {
      // Avoid duplicate errors for the same context
      const isDuplicate = prev.some(existing => 
        existing.message === newError.message &&
        existing.type === newError.type &&
        existing.context?.page === newError.context?.page &&
        existing.context?.component === newError.context?.component &&
        Date.now() - existing.timestamp < 5000 // Within 5 seconds
      )

      if (isDuplicate) {
        return prev
      }

      return [...prev, newError]
    })
  }, [])

  const removeError = useCallback((id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id))
  }, [])

  const clearErrors = useCallback(() => {
    setErrors([])
  }, [])

  const retryError = useCallback((id: string) => {
    setErrors(prev => prev.map(error => {
      if (error.id === id && error.retryable) {
        return {
          ...error,
          retryCount: (error.retryCount || 0) + 1,
          timestamp: Date.now()
        }
      }
      return error
    }))
  }, [])

  const hasErrors = errors.length > 0
  const hasCriticalErrors = errors.some(error => error.severity === 'critical')

  const getErrorsByType = useCallback((type: ErrorInfo['type']) => {
    return errors.filter(error => error.type === type)
  }, [errors])

  const getErrorsBySeverity = useCallback((severity: ErrorInfo['severity']) => {
    return errors.filter(error => error.severity === severity)
  }, [errors])

  // Auto-cleanup old errors (older than 5 minutes)
  useEffect(() => {
    const cleanup = setInterval(() => {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
      setErrors(prev => prev.filter(error => error.timestamp > fiveMinutesAgo))
    }, 60000) // Check every minute

    return () => clearInterval(cleanup)
  }, [])

  // Set up global error reporter for non-React contexts
  useEffect(() => {
    setGlobalErrorReporter(addError)
    return () => setGlobalErrorReporter(() => {})
  }, [addError])

  const value: ErrorContextType = {
    errors,
    addError,
    removeError,
    clearErrors,
    retryError,
    hasErrors,
    hasCriticalErrors,
    getErrorsByType,
    getErrorsBySeverity
  }

  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  )
}

export function useError() {
  const context = useContext(ErrorContext)
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider')
  }
  return context
}

// Hook for easy error reporting
export function useErrorReporter() {
  const { addError } = useError()

  const reportError = useCallback((
    message: string,
    type: ErrorInfo['type'] = 'unknown',
    severity: ErrorInfo['severity'] = 'medium',
    context?: ErrorInfo['context'],
    retryable: boolean = false
  ) => {
    addError({
      message,
      type,
      severity,
      context,
      retryable
    })
  }, [addError])

  const reportDataLoadingError = useCallback((
    message: string,
    context?: ErrorInfo['context'],
    retryable: boolean = true
  ) => {
    reportError(message, 'data_loading', 'medium', context, retryable)
  }, [reportError])

  const reportApiError = useCallback((
    message: string,
    context?: ErrorInfo['context'],
    retryable: boolean = true
  ) => {
    reportError(message, 'api_error', 'high', context, retryable)
  }, [reportError])

  const reportNetworkError = useCallback((
    message: string,
    context?: ErrorInfo['context'],
    retryable: boolean = true
  ) => {
    reportError(message, 'network_error', 'high', context, retryable)
  }, [reportError])

  return {
    reportError,
    reportDataLoadingError,
    reportApiError,
    reportNetworkError
  }
}
