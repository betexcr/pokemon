'use client'

import { useState, useEffect } from 'react'
import { Heart, Star, Sparkles, Zap, Frown, Smile } from 'lucide-react'

interface ContestMascotProps {
  selectedCategory?: string | null
  currentRound?: 'intro' | 'talent' | 'results'
  exciteMeter?: number
  lastMove?: string | null
  isRepeatedMove?: boolean
  isSpectacular?: boolean
  hearts?: number
  stars?: number
}

export default function ContestMascot({ 
  selectedCategory, 
  currentRound, 
  exciteMeter = 0, 
  lastMove, 
  isRepeatedMove = false,
  isSpectacular = false,
  hearts = 0,
  stars = 0
}: ContestMascotProps) {
  const [currentMood, setCurrentMood] = useState<'neutral' | 'happy' | 'excited' | 'bored' | 'spectacular'>('neutral')
  const [showReaction, setShowReaction] = useState(false)
  const [reactionText, setReactionText] = useState('')

  // Determine mascot mood based on game state
  useEffect(() => {
    if (isSpectacular) {
      setCurrentMood('spectacular')
      setReactionText('🎆 SPECTACULAR! 🎆')
      setShowReaction(true)
      setTimeout(() => setShowReaction(false), 3000)
    } else if (isRepeatedMove) {
      setCurrentMood('bored')
      setReactionText('😴 The audience is getting bored...')
      setShowReaction(true)
      setTimeout(() => setShowReaction(false), 2000)
    } else if (exciteMeter >= 75) {
      setCurrentMood('excited')
      setReactionText('⭐ Almost spectacular! ⭐')
      setShowReaction(true)
      setTimeout(() => setShowReaction(false), 2000)
    } else if (hearts > 0 || stars > 0) {
      setCurrentMood('happy')
      setReactionText('✨ Great performance! ✨')
      setShowReaction(true)
      setTimeout(() => setShowReaction(false), 1500)
    } else {
      setCurrentMood('neutral')
    }
  }, [isSpectacular, isRepeatedMove, exciteMeter, hearts, stars])

  const getMascotEmoji = () => {
    switch (currentMood) {
      case 'spectacular': return '🎆'
      case 'excited': return '⭐'
      case 'happy': return '😊'
      case 'bored': return '😴'
      default: return '👨‍⚖️'
    }
  }

  const getMascotColor = () => {
    switch (currentMood) {
      case 'spectacular': return 'from-purple-400 to-pink-400'
      case 'excited': return 'from-blue-400 to-purple-400'
      case 'happy': return 'from-green-400 to-blue-400'
      case 'bored': return 'from-gray-400 to-gray-500'
      default: return 'from-blue-400 to-cyan-400'
    }
  }

  const getCategoryTheme = () => {
    switch (selectedCategory) {
      case 'cute': return { bg: 'bg-pink-100', border: 'border-pink-300', icon: '💖' }
      case 'beauty': return { bg: 'bg-rose-100', border: 'border-rose-300', icon: '🌸' }
      case 'cool': return { bg: 'bg-blue-100', border: 'border-blue-300', icon: '❄️' }
      case 'tough': return { bg: 'bg-red-100', border: 'border-red-300', icon: '💪' }
      case 'clever': return { bg: 'bg-green-100', border: 'border-green-300', icon: '🧠' }
      default: return { bg: 'bg-purple-100', border: 'border-purple-300', icon: '✨' }
    }
  }

  const categoryTheme = getCategoryTheme()

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {/* Reaction Speech Bubble */}
      {showReaction && (
        <div className="absolute bottom-20 right-0 mb-2 animate-bounce">
          <div className={`
            bg-white dark:bg-gray-800 rounded-2xl px-4 py-2 shadow-lg border-2
            ${categoryTheme.border} max-w-xs
          `}>
            <p className="text-sm font-bold text-center text-gray-800 dark:text-gray-200">
              {reactionText}
            </p>
            <div className="absolute bottom-[-8px] right-4 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white dark:border-t-gray-800"></div>
          </div>
        </div>
      )}

      {/* Mascot Avatar */}
      <div className={`
        relative w-16 h-16 rounded-full border-4 ${categoryTheme.border}
        bg-gradient-to-br ${getMascotColor()} shadow-lg
        flex items-center justify-center cursor-pointer
        transition-all duration-300 hover:scale-110 hover:shadow-xl
        ${currentMood === 'spectacular' ? 'animate-pulse' : ''}
        ${currentMood === 'bored' ? 'animate-bounce' : ''}
      `}>
        {/* Mascot Face */}
        <div className="text-2xl animate-bounce">
          {getMascotEmoji()}
        </div>

        {/* Category Icon Overlay */}
        {selectedCategory && (
          <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center text-xs">
            {categoryTheme.icon}
          </div>
        )}

        {/* Status Indicators */}
        <div className="absolute -top-1 -left-1 flex flex-col gap-1">
          {hearts > 0 && (
            <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
              <Heart className="w-2 h-2 text-white" />
            </div>
          )}
          {stars > 0 && (
            <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center animate-pulse">
              <Star className="w-2 h-2 text-white" />
            </div>
          )}
        </div>

        {/* Excite Meter Indicator */}
        {exciteMeter > 0 && (
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
            <div className="w-12 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-yellow-400 to-red-500 transition-all duration-500"
                style={{ width: `${exciteMeter}%` }}
              />
            </div>
          </div>
        )}

        {/* Floating Sparkles */}
        {currentMood === 'spectacular' && (
          <>
            <div className="absolute -top-4 -left-4 animate-ping">
              <Sparkles className="w-3 h-3 text-yellow-400" />
            </div>
            <div className="absolute -top-4 -right-4 animate-ping delay-150">
              <Sparkles className="w-3 h-3 text-pink-400" />
            </div>
            <div className="absolute -bottom-4 -left-4 animate-ping delay-300">
              <Sparkles className="w-3 h-3 text-purple-400" />
            </div>
            <div className="absolute -bottom-4 -right-4 animate-ping delay-500">
              <Sparkles className="w-3 h-3 text-blue-400" />
            </div>
          </>
        )}
      </div>

      {/* Mascot Name Tag */}
      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
        <div className="bg-white dark:bg-gray-800 rounded-lg px-2 py-1 shadow-md border border-gray-200 dark:border-gray-600">
          <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
            Judge {categoryTheme.icon}
          </p>
        </div>
      </div>
    </div>
  )
}
