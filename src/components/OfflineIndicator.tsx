'use client'

import React from 'react'
import { useNetworkState } from '@/lib/offlineManager'

export default function OfflineIndicator() {
  const networkState = useNetworkState()

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
          onClick={() => window.location.reload()}
          className="ml-2 text-xs bg-red-700 hover:bg-red-800 px-2 py-1 rounded transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  )
}
