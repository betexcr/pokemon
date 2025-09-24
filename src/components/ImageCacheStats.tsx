'use client'

import { useState, useEffect } from 'react'
import { imageCache } from '@/lib/imageCache'

export default function ImageCacheStats() {
  const [stats, setStats] = useState(imageCache.getStats())
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(imageCache.getStats())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors z-50"
        title="Show image cache stats"
      >
        📊 Cache
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4 shadow-lg z-50 max-w-xs">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Image Cache Stats</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Images:</span>
          <span className="text-gray-900 dark:text-white">{stats.count}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Size:</span>
          <span className="text-gray-900 dark:text-white">
            {(stats.size / 1024 / 1024).toFixed(1)}MB
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Usage:</span>
          <span className="text-gray-900 dark:text-white">
            {stats.usage.toFixed(1)}%
          </span>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(stats.usage, 100)}%` }}
          />
        </div>
        
        <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={() => {
              imageCache.clear()
              setStats(imageCache.getStats())
            }}
            className="w-full bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 transition-colors"
          >
            Clear Cache
          </button>
        </div>
      </div>
    </div>
  )
}
