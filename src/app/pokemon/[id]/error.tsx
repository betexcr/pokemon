'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PokemonError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error for debugging
    console.error('Pokemon details page error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-bg text-text flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold mb-4 text-red-600 dark:text-red-400">
          Error Loading Pokémon
        </h1>
        <p className="text-lg mb-6 text-gray-600 dark:text-gray-400">
          We encountered an error while loading the Pokémon details. This might be a temporary issue.
        </p>
        <div className="space-y-4">
          <button
            onClick={reset}
            className="w-full px-6 py-3 bg-poke-blue text-white rounded-lg hover:bg-poke-blue/80 transition-colors font-medium"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
          >
            Back to PokéDex
          </button>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400">
              Error Details (Development)
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-auto">
              {error.message}
              {error.stack && `\n\nStack trace:\n${error.stack}`}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}
