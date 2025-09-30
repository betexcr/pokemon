'use client'

import { Trophy, Star, Heart, Ribbon, Sparkles } from 'lucide-react'
import { contestData } from '@/data/contestData'

interface ContestRankProps {
  rank: string
  stars: number
  hearts: number
  totalScore: number
}

export default function ContestRank({ rank, stars, hearts, totalScore }: ContestRankProps) {
  const rankData = contestData.ranks.find(r => r.name === rank)
  const nextRank = contestData.ranks.find(r => r.minScore > totalScore)
  
  const getRankEmoji = (rankName: string) => {
    switch (rankName) {
      case 'Master': return '👑'
      case 'Hyper': return '💎'
      case 'Super': return '🏆'
      default: return '🏅'
    }
  }

  const getRankColor = (rankName: string) => {
    switch (rankName) {
      case 'Master': return 'from-purple-500 to-pink-500'
      case 'Hyper': return 'from-blue-500 to-purple-500'
      case 'Super': return 'from-green-500 to-blue-500'
      default: return 'from-gray-400 to-gray-600'
    }
  }

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 rounded-2xl p-8 shadow-lg text-center">
      <div className="mb-6">
        <div className="text-6xl mb-4">{getRankEmoji(rank)}</div>
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
          Contest Complete!
        </h2>
        <div className={`inline-block px-6 py-3 rounded-full bg-gradient-to-r ${getRankColor(rank)} text-white font-bold text-xl shadow-lg`}>
          {rank} Rank
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-r from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/30 rounded-xl p-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Star className="w-6 h-6 text-yellow-500" />
            <span className="text-lg font-bold text-yellow-700 dark:text-yellow-300">Stars</span>
          </div>
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {stars}
          </div>
          <div className="text-sm text-yellow-600 dark:text-yellow-400">
            Introduction Round
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 rounded-xl p-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Heart className="w-6 h-6 text-red-500" />
            <span className="text-lg font-bold text-red-700 dark:text-red-300">Hearts</span>
          </div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {hearts}
          </div>
          <div className="text-sm text-red-600 dark:text-red-400">
            Talent Round
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl p-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Trophy className="w-6 h-6 text-purple-500" />
            <span className="text-lg font-bold text-purple-700 dark:text-purple-300">Total</span>
          </div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {totalScore}
          </div>
          <div className="text-sm text-purple-600 dark:text-purple-400">
            Final Score
          </div>
        </div>
      </div>

      {/* Rewards */}
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-4 text-gray-700 dark:text-gray-300">
          🏆 Rewards Earned 🏆
        </h3>
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-2 bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 rounded-xl px-4 py-3">
            <Ribbon className="w-6 h-6 text-pink-500" />
            <span className="font-bold text-pink-700 dark:text-pink-300">
              {rankData?.reward || 'Participation Ribbon'}
            </span>
          </div>
        </div>
      </div>

      {/* Next Rank Progress */}
      {nextRank && (
        <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4">
          <h4 className="text-lg font-bold mb-2 text-gray-700 dark:text-gray-300">
            Next Rank Progress
          </h4>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {totalScore} / {nextRank.minScore} points
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-400 to-purple-400 transition-all duration-500"
              style={{ width: `${Math.min((totalScore / nextRank.minScore) * 100, 100)}%` }}
            />
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {nextRank.minScore - totalScore} more points needed for {nextRank.name} Rank!
          </div>
        </div>
      )}

      {/* Celebration Message */}
      <div className="mt-6">
        {rank === 'Master' && (
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 animate-pulse">
            🎆 MASTER CONTEST COORDINATOR! 🎆
          </div>
        )}
        {rank === 'Hyper' && (
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
            💎 Excellent Performance! 💎
          </div>
        )}
        {rank === 'Super' && (
          <div className="text-lg font-bold text-green-600 dark:text-green-400">
            🏆 Great Job! 🏆
          </div>
        )}
        {rank === 'Normal' && (
          <div className="text-lg font-bold text-gray-600 dark:text-gray-400">
            🏅 Good Start! 🏅
          </div>
        )}
      </div>
    </div>
  )
}
