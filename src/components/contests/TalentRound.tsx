'use client'

import { useState } from 'react'
import { contestData } from '@/data/contestData'
import { Heart, Star, Sparkles } from 'lucide-react'

interface TalentRoundProps {
  selectedCategory: string
  onMoveUse: (move: string, category: string) => void
  usedMoves: string[]
}

export default function TalentRound({ selectedCategory, onMoveUse, usedMoves }: TalentRoundProps) {
  const [selectedMove, setSelectedMove] = useState<string | null>(null)

  // Filter moves by category
  const categoryMoves = contestData.moves.filter(move => move.category === selectedCategory)
  const otherMoves = contestData.moves.filter(move => move.category !== selectedCategory)

  const handleMoveClick = (move: string, category: string) => {
    setSelectedMove(move)
    onMoveUse(move, category)
    
    // Reset selection after a short delay
    setTimeout(() => setSelectedMove(null), 500)
  }

  const isMoveUsed = (moveName: string) => usedMoves.includes(moveName)
  const isLastMove = (moveName: string) => usedMoves[usedMoves.length - 1] === moveName

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 rounded-2xl p-6 shadow-lg">
      <h3 className="text-xl font-bold text-center mb-6 text-gray-700 dark:text-gray-300">
        🎭 Talent Round - Choose Your Moves! 🎭
      </h3>
      
      {/* Category-specific moves (bonus points) */}
      <div className="mb-6">
        <h4 className="text-lg font-bold mb-4 text-center text-pink-600 dark:text-pink-400">
          ✨ {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Moves (Bonus Points!) ✨
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {categoryMoves.map((move) => (
            <button
              key={move.name}
              onClick={() => handleMoveClick(move.name, move.category)}
              disabled={selectedMove === move.name}
              className={`relative group p-4 rounded-xl text-left transition-all duration-300 hover:scale-105 hover:shadow-lg transform ${
                isLastMove(move.name)
                  ? 'bg-red-100 dark:bg-red-900/30 border-2 border-red-400 text-red-700 dark:text-red-300'
                  : isMoveUsed(move.name)
                  ? 'bg-gray-100 dark:bg-gray-700 border-2 border-gray-400 text-gray-500 dark:text-gray-400'
                  : 'bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 text-white hover:shadow-xl'
              } ${selectedMove === move.name ? 'animate-pulse' : ''}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm">{move.name}</span>
                <div className="flex items-center gap-1">
                  {isLastMove(move.name) && <span className="text-red-500">😴</span>}
                  {isMoveUsed(move.name) && !isLastMove(move.name) && <span className="text-gray-500">✓</span>}
                  <span className="text-xs">
                    {move.power === 4 ? '⭐⭐⭐⭐' : move.power === 3 ? '⭐⭐⭐' : '⭐⭐'}
                  </span>
                </div>
              </div>
              <p className="text-xs opacity-90">{move.description}</p>
              
              {/* Bonus indicator */}
              {!isMoveUsed(move.name) && (
                <div className="absolute top-1 right-1">
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Other category moves (normal points) */}
      <div>
        <h4 className="text-lg font-bold mb-4 text-center text-blue-600 dark:text-blue-400">
          🎪 Other Moves (Normal Points) 🎪
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {otherMoves.slice(0, 6).map((move) => (
            <button
              key={move.name}
              onClick={() => handleMoveClick(move.name, move.category)}
              disabled={selectedMove === move.name}
              className={`relative group p-4 rounded-xl text-left transition-all duration-300 hover:scale-105 hover:shadow-lg transform ${
                isLastMove(move.name)
                  ? 'bg-red-100 dark:bg-red-900/30 border-2 border-red-400 text-red-700 dark:text-red-300'
                  : isMoveUsed(move.name)
                  ? 'bg-gray-100 dark:bg-gray-700 border-2 border-gray-400 text-gray-500 dark:text-gray-400'
                  : 'bg-gradient-to-r from-blue-400 to-cyan-400 hover:from-blue-500 hover:to-cyan-500 text-white hover:shadow-xl'
              } ${selectedMove === move.name ? 'animate-pulse' : ''}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm">{move.name}</span>
                <div className="flex items-center gap-1">
                  {isLastMove(move.name) && <span className="text-red-500">😴</span>}
                  {isMoveUsed(move.name) && !isLastMove(move.name) && <span className="text-gray-500">✓</span>}
                  <span className="text-xs">
                    {move.power === 4 ? '⭐⭐⭐⭐' : move.power === 3 ? '⭐⭐⭐' : '⭐⭐'}
                  </span>
                </div>
              </div>
              <p className="text-xs opacity-90">{move.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4">
        <h4 className="font-bold text-yellow-800 dark:text-yellow-200 mb-2">
          💡 Talent Round Tips:
        </h4>
        <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
          <li>• Use {selectedCategory} moves for bonus hearts! ✨</li>
          <li>• Don't repeat the same move twice - the audience gets bored! 😴</li>
          <li>• Fill the Excite Meter for spectacular talent! 🎆</li>
          <li>• Higher power moves give more hearts! ⭐</li>
        </ul>
      </div>
    </div>
  )
}
