'use client'

import React from 'react'
import { useOfflineGuard } from '@/hooks/useOfflineGuard'

interface OfflineBannerProps {
  requiresNetwork?: boolean
  blockedMessage?: string
  cachedMessage?: string
}

export default function OfflineBanner({
  requiresNetwork = false,
  blockedMessage = 'This feature requires an internet connection.',
  cachedMessage = "You're offline. Showing cached data.",
}: OfflineBannerProps) {
  const { isOffline, isFeatureBlocked } = useOfflineGuard(requiresNetwork)

  if (!isOffline) return null

  if (isFeatureBlocked) {
    return (
      <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg px-4 py-3 mb-4 text-sm flex items-center gap-2">
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728" />
        </svg>
        {blockedMessage}
      </div>
    )
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 rounded-lg px-4 py-3 mb-4 text-sm flex items-center gap-2">
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {cachedMessage}
    </div>
  )
}
