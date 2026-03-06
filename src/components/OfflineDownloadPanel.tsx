'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { prefetchAllData, getPrefetchState, type PrefetchProgress } from '@/lib/offlinePrefetch'
import { browserCache } from '@/lib/memcached'
import { useNetworkState } from '@/lib/offlineManager'

export default function OfflineDownloadPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [progress, setProgress] = useState<PrefetchProgress | null>(null)
  const [stats, setStats] = useState<{ totalKeys: number; pokemonDetailKeys: number; estimatedSizeMB: number } | null>(null)
  const [prefetchState, setPrefetchState] = useState(getPrefetchState())
  const abortRef = useRef<AbortController | null>(null)
  const networkState = useNetworkState()

  const refreshStats = useCallback(async () => {
    const s = await browserCache.getCacheStats()
    setStats(s)
    setPrefetchState(getPrefetchState())
  }, [])

  useEffect(() => {
    if (isOpen) refreshStats()
  }, [isOpen, refreshStats])

  const handleStart = async () => {
    abortRef.current = new AbortController()
    try {
      await prefetchAllData(setProgress, abortRef.current.signal)
    } catch {
      // handled via progress state
    } finally {
      abortRef.current = null
      refreshStats()
    }
  }

  const handleCancel = () => {
    abortRef.current?.abort()
  }

  const handleClearCache = async () => {
    if (!confirm('Clear all cached Pokemon data? You will need to re-download for offline use.')) return
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' })
    }
    await browserCache.clearPattern('pokemon')
    localStorage.removeItem('pokemon-offline-prefetch-state')
    refreshStats()
    setProgress(null)
  }

  const isDownloading = progress?.phase === 'pokemon' || progress?.phase === 'species' || progress?.phase === 'types' || progress?.phase === 'images'
  const pct = progress && progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors"
        title="Offline data manager"
        aria-label="Open offline download manager"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !isDownloading && setIsOpen(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Offline Data Manager</h2>
              {!isDownloading && (
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <div className="text-xs text-gray-500 dark:text-gray-400">Cached Items</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">{stats?.totalKeys ?? '...'}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <div className="text-xs text-gray-500 dark:text-gray-400">Est. Size</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">{stats ? `${stats.estimatedSizeMB} MB` : '...'}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 col-span-2">
                <div className="text-xs text-gray-500 dark:text-gray-400">Last Full Download</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {prefetchState.lastFullPrefetch
                    ? new Date(prefetchState.lastFullPrefetch).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : 'Never'}
                </div>
              </div>
            </div>

            {/* Progress */}
            {progress && progress.phase !== 'idle' && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600 dark:text-gray-300">{progress.message}</span>
                  <span className="font-mono text-gray-500">{pct}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      progress.phase === 'done' ? 'bg-green-500' : progress.phase === 'error' ? 'bg-red-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2">
              {!isDownloading ? (
                <>
                  <button
                    onClick={handleStart}
                    disabled={!networkState.isOnline}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-2.5 px-4 rounded-lg font-medium transition-colors text-sm"
                  >
                    {!networkState.isOnline
                      ? 'Go online to download'
                      : prefetchState.lastFullPrefetch
                        ? 'Re-download All Data'
                        : 'Download for Offline Use'}
                  </button>
                  <button
                    onClick={handleClearCache}
                    className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg text-sm transition-colors"
                  >
                    Clear Cached Data
                  </button>
                </>
              ) : (
                <button
                  onClick={handleCancel}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 px-4 rounded-lg font-medium transition-colors text-sm"
                >
                  Cancel Download
                </button>
              )}
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
              Downloads all 1025 Pokemon, species data, types, and images for complete offline access.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
