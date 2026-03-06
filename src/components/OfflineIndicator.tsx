'use client'

import React, { useState, useEffect } from 'react'
import { useNetworkState } from '@/lib/offlineManager'
import { getPrefetchState } from '@/lib/offlinePrefetch'

export default function OfflineIndicator() {
  const networkState = useNetworkState()
  const [isChecking, setIsChecking] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [hasOfflineData, setHasOfflineData] = useState(false)

  useEffect(() => {
    if (!networkState.isOnline) {
      const state = getPrefetchState()
      setHasOfflineData(!!state.lastFullPrefetch)
    }
  }, [networkState.isOnline])

  const handleManualCheck = async () => {
    setIsChecking(true)
    try {
      const response = await fetch('/', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000)
      })
      
      if (response.ok) {
        window.location.reload()
      } else {
        alert('Still offline - please check your internet connection')
      }
    } catch {
      alert('Connection check failed - please check your internet connection')
    } finally {
      setIsChecking(false)
    }
  }

  if (networkState.isOnline) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white text-center shadow-lg">
      <div className="flex items-center justify-center gap-2 py-2 px-4">
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728" />
        </svg>
        <span className="text-sm font-medium">
          You&apos;re offline.{' '}
          {hasOfflineData
            ? 'Cached data is available.'
            : 'Limited features available.'}
        </span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="ml-1 text-xs bg-red-700 hover:bg-red-800 px-2 py-1 rounded transition-colors"
        >
          {expanded ? 'Less' : 'Details'}
        </button>
        <button
          onClick={handleManualCheck}
          disabled={isChecking}
          className="ml-1 text-xs bg-red-700 hover:bg-red-800 disabled:opacity-50 px-2 py-1 rounded transition-colors"
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

      {expanded && (
        <div className="bg-red-700 border-t border-red-500 px-4 py-2 text-xs text-left max-w-lg mx-auto">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <span className="font-medium">Works offline:</span>
            <span>Browse cached Pokemon, AI battles, checklist, type matchups, teams</span>
            <span className="font-medium">Needs connection:</span>
            <span>Multiplayer lobby, usage stats, uncached Pokemon</span>
            <span className="font-medium">Search:</span>
            <span>{hasOfflineData ? 'Available (offline index)' : 'Limited to cached results'}</span>
          </div>
        </div>
      )}
    </div>
  )
}
