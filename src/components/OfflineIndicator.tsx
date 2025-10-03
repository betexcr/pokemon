'use client'

import React, { useState } from 'react'
import { useNetworkState } from '@/lib/offlineManager'

export default function OfflineIndicator() {
  const networkState = useNetworkState()
  const [isChecking, setIsChecking] = useState(false)

  const handleManualCheck = async () => {
    setIsChecking(true)
    try {
      // Force a connectivity check
      const response = await fetch('/', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000)
      })
      
      if (response.ok) {
        // If we can reach the server, reload to update state
        window.location.reload()
      } else {
        alert('Still offline - please check your internet connection')
      }
    } catch (error) {
      alert('Connection check failed - please check your internet connection')
    } finally {
      setIsChecking(false)
    }
  }

  if (networkState.isOnline) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white text-center py-2 px-4 shadow-lg">
      <div className="flex items-center justify-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728" />
        </svg>
        <span className="text-sm font-medium">
          You're offline. Some features may be limited.
        </span>
        <button
          onClick={handleManualCheck}
          disabled={isChecking}
          className="ml-2 text-xs bg-red-700 hover:bg-red-800 disabled:opacity-50 px-2 py-1 rounded transition-colors"
        >
          {isChecking ? 'Checking...' : 'Check Connection'}
        </button>
        <button
          onClick={() => window.location.reload()}
          className="ml-1 text-xs bg-red-700 hover:bg-red-800 px-2 py-1 rounded transition-colors"
        >
          Reload
        </button>
      </div>
    </div>
  )
}
