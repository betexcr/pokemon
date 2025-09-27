'use client'

import { useState, useEffect } from 'react'
import { useError } from '@/contexts/ErrorContext'
import { X, RefreshCw, AlertTriangle, Wifi, Database, Bug, ChevronLeft, ChevronRight, Download } from 'lucide-react'

interface ErrorTipProps {
  className?: string
}

// Crying Pokémon portraits for different error types
const CRYING_POKEMON = {
  data_loading: { id: '0025', name: 'Pikachu' }, // Pikachu crying
  api_error: { id: '0006', name: 'Charizard' }, // Charizard frustrated
  network_error: { id: '0009', name: 'Blastoise' }, // Blastoise confused
  validation_error: { id: '0143', name: 'Snorlax' }, // Snorlax sleepy
  unknown: { id: '0094', name: 'Gengar' } // Gengar mischievous
}

const ERROR_ICONS = {
  data_loading: Database,
  api_error: Bug,
  network_error: Wifi,
  validation_error: AlertTriangle,
  unknown: AlertTriangle
}

const ERROR_COLORS = {
  data_loading: 'text-blue-600 dark:text-blue-400',
  api_error: 'text-red-600 dark:text-red-400',
  network_error: 'text-orange-600 dark:text-orange-400',
  validation_error: 'text-yellow-600 dark:text-yellow-400',
  unknown: 'text-gray-600 dark:text-gray-400'
}

const ERROR_MESSAGES = {
  data_loading: {
    title: 'Data Loading Issue',
    description: 'Some Pokémon data couldn\'t be loaded properly.',
    suggestion: 'Try refreshing the page or check your connection.'
  },
  api_error: {
    title: 'API Error',
    description: 'There was a problem connecting to the Pokémon database.',
    suggestion: 'The servers might be busy. Please try again in a moment.'
  },
  network_error: {
    title: 'Connection Problem',
    description: 'Unable to connect to the Pokémon servers.',
    suggestion: 'Check your internet connection and try again.'
  },
  validation_error: {
    title: 'Validation Error',
    description: 'Some data doesn\'t look quite right.',
    suggestion: 'This might be a temporary issue. Try refreshing.'
  },
  unknown: {
    title: 'Something Went Wrong',
    description: 'An unexpected error occurred.',
    suggestion: 'Try refreshing the page or contact support if it persists.'
  }
}

export default function ErrorTip({ className = '' }: ErrorTipProps) {
  const { errors, removeError, retryError, clearErrors } = useError()
  const [isVisible, setIsVisible] = useState(false)
  const [currentErrorIndex, setCurrentErrorIndex] = useState(0)

  // Show error tip when there are errors
  useEffect(() => {
    if (errors.length > 0) {
      setIsVisible(true)
      setCurrentErrorIndex(0)
    } else {
      setIsVisible(false)
    }
  }, [errors.length])

  // Auto-advance through multiple errors
  useEffect(() => {
    if (errors.length <= 1) return

    const timer = setInterval(() => {
      setCurrentErrorIndex(prev => (prev + 1) % errors.length)
    }, 5000) // Show each error for 5 seconds

    return () => clearInterval(timer)
  }, [errors.length])

  if (!isVisible || errors.length === 0) return null

  const currentError = errors[currentErrorIndex]
  const pokemon = CRYING_POKEMON[currentError.type] || CRYING_POKEMON.unknown
  const IconComponent = ERROR_ICONS[currentError.type]
  const colorClass = ERROR_COLORS[currentError.type]
  const errorInfo = ERROR_MESSAGES[currentError.type]

  const handleRetry = () => {
    if (currentError.retryable) {
      retryError(currentError.id)
    }
  }

  const handleDismiss = () => {
    removeError(currentError.id)
  }

  const handleDismissAll = () => {
    clearErrors()
  }

  const handlePreviousError = () => {
    setCurrentErrorIndex(prev => prev === 0 ? errors.length - 1 : prev - 1)
  }

  const handleNextError = () => {
    setCurrentErrorIndex(prev => (prev + 1) % errors.length)
  }

  const handleDownloadErrorLog = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `pokemon-error-log-${timestamp}.txt`
    
    // Format all errors into a text log
    const errorLog = errors.map((error, index) => {
      const pokemon = CRYING_POKEMON[error.type] || CRYING_POKEMON.unknown
      const errorInfo = ERROR_MESSAGES[error.type]
      
      return `=== ERROR ${index + 1} of ${errors.length} ===
Timestamp: ${new Date(error.timestamp).toLocaleString()}
Type: ${error.type}
Severity: ${error.severity}
Title: ${errorInfo.title}
Message: ${error.message}
Pokemon: ${pokemon.name} (ID: ${pokemon.id})
${error.context?.page ? `Page: ${error.context.page}` : ''}
${error.context?.component ? `Component: ${error.context.component}` : ''}
${error.retryCount && error.maxRetries ? `Retries: ${error.retryCount}/${error.maxRetries}` : ''}
${error.context?.stack ? `Stack: ${error.context.stack}` : ''}
Retryable: ${error.retryable ? 'Yes' : 'No'}

Description: ${errorInfo.description}
Suggestion: ${errorInfo.suggestion}

${index < errors.length - 1 ? '---' : ''}
`
    }).join('\n')

    // Create and download the file
    const blob = new Blob([errorLog], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className={`fixed bottom-4 left-4 z-50 max-w-sm w-80 ${className}`}>
      <div className="bg-white dark:bg-gray-800 border-2 border-red-400 rounded-2xl shadow-2xl animate-in slide-in-from-left-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <img
              src={`/assets/pmd/${pokemon.id}/portrait/Crying.png`}
              alt={`${pokemon.name} crying`}
              className="w-8 h-8 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id.replace(/^0+/, '') || pokemon.id}.png`
              }}
            />
            <div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2">
                <IconComponent className={`w-4 h-4 ${colorClass}`} />
                {errorInfo.title}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Error {currentErrorIndex + 1} of {errors.length}
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Dismiss error"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Content */}
        <div className="p-4">
          <div className="mb-3">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {errorInfo.description}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              {errorInfo.suggestion}
            </p>
          </div>

          {/* Error Details (collapsible) */}
          <details className="mb-3">
            <summary className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
              Technical Details
            </summary>
            <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400">
              <p><strong>Type:</strong> {currentError.type}</p>
              <p><strong>Severity:</strong> {currentError.severity}</p>
              <p><strong>Message:</strong> {currentError.message}</p>
              {currentError.context?.page && (
                <p><strong>Page:</strong> {currentError.context.page}</p>
              )}
              {currentError.context?.component && (
                <p><strong>Component:</strong> {currentError.context.component}</p>
              )}
              {currentError.retryCount && currentError.maxRetries && (
                <p><strong>Retries:</strong> {currentError.retryCount}/{currentError.maxRetries}</p>
              )}
            </div>
          </details>

          {/* Pokémon Quote */}
          <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
            <p className="text-xs text-red-700 dark:text-red-300 font-medium">
              😢 {pokemon.name} says: &quot;Oops! Something went wrong while I was trying to help you!&quot;
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            {currentError.retryable && (
              <button
                onClick={handleRetry}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                title="Retry the failed operation"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </button>
            )}
            {errors.length > 1 && (
              <button
                onClick={handleDismissAll}
                className="text-xs px-3 py-1.5 rounded border border-gray-300 bg-gray-50 text-gray-800 dark:border-gray-700 dark:bg-gray-900/30 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900/50 transition-colors"
                title="Dismiss all errors"
              >
                Dismiss All
              </button>
            )}
            <button
              onClick={handleDownloadErrorLog}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-green-300 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-900/30 dark:text-green-200 hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
              title="Download error log"
            >
              <Download className="w-3 h-3" />
              Download Log
            </button>
          </div>

          {/* Navigation and Progress */}
          {errors.length > 1 && (
            <div className="flex items-center gap-2">
              {/* Previous/Next Navigation */}
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePreviousError}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Previous error"
                  aria-label="Previous error"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                <span className="text-xs text-gray-500 dark:text-gray-400 px-1">
                  {currentErrorIndex + 1}/{errors.length}
                </span>
                <button
                  onClick={handleNextError}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Next error"
                  aria-label="Next error"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {/* Progress dots */}
              <div className="flex gap-1">
                {errors.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentErrorIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentErrorIndex
                        ? 'bg-red-500'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                    aria-label={`Go to error ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
