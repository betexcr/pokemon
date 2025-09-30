'use client'

import { useEffect, useState } from 'react'
import { Sparkles, Star } from 'lucide-react'

interface ExciteMeterProps {
  value: number // 0-100
}

export default function ExciteMeter({ value }: ExciteMeterProps) {
  const [isSpectacular, setIsSpectacular] = useState(false)
  const [showSparkles, setShowSparkles] = useState(false)

  useEffect(() => {
    if (value >= 100) {
      setIsSpectacular(true)
      setShowSparkles(true)
      setTimeout(() => setShowSparkles(false), 2000)
    } else {
      setIsSpectacular(false)
    }
  }, [value])

  const getMeterColor = () => {
    if (value >= 100) return 'from-purple-500 to-pink-500'
    if (value >= 75) return 'from-blue-500 to-purple-500'
    if (value >= 50) return 'from-green-500 to-blue-500'
    if (value >= 25) return 'from-yellow-500 to-green-500'
    return 'from-gray-400 to-gray-500'
  }

  const getMeterEmoji = () => {
    if (value >= 100) return '🎆'
    if (value >= 75) return '⭐'
    if (value >= 50) return '✨'
    if (value >= 25) return '💫'
    return '🌟'
  }

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 rounded-2xl p-6 shadow-lg mb-6">
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">
          Excite Meter
        </h3>
        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl">{getMeterEmoji()}</span>
          <span className="text-lg font-bold text-gray-600 dark:text-gray-400">
            {value}/100
          </span>
          {isSpectacular && (
            <span className="text-2xl animate-bounce">🎆</span>
          )}
        </div>
      </div>

      {/* Meter Bar */}
      <div className="relative">
        <div className="w-full h-8 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
          <div 
            className={`h-full bg-gradient-to-r ${getMeterColor()} transition-all duration-500 ease-out relative`}
            style={{ width: `${Math.min(value, 100)}%` }}
          >
            {/* Sparkle animation overlay */}
            {showSparkles && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Meter segments */}
        <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span>0</span>
          <span>25</span>
          <span>50</span>
          <span>75</span>
          <span>100</span>
        </div>
      </div>

      {/* Status Message */}
      <div className="text-center mt-4">
        {isSpectacular ? (
          <div className="text-lg font-bold text-purple-600 dark:text-purple-400 animate-pulse">
            🎆 SPECTACULAR TALENT READY! 🎆
          </div>
        ) : value >= 75 ? (
          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
            ⭐ Almost Spectacular! ⭐
          </div>
        ) : value >= 50 ? (
          <div className="text-lg font-bold text-green-600 dark:text-green-400">
            ✨ Getting Excited! ✨
          </div>
        ) : value >= 25 ? (
          <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
            💫 Building Energy! 💫
          </div>
        ) : (
          <div className="text-lg font-bold text-gray-600 dark:text-gray-400">
            🌟 Start Performing! 🌟
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          💡 Use moves that match your contest category to fill the meter!
        </p>
      </div>
    </div>
  )
}
