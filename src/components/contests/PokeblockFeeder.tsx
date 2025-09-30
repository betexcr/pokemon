'use client'

import { useState } from 'react'
import { Heart, Star, Sparkles } from 'lucide-react'

interface ContestStats {
  coolness: number
  beauty: number
  cuteness: number
  cleverness: number
  toughness: number
}

interface PokeblockFeederProps {
  pokemonStats: ContestStats
  onPokeblockFeed: (color: string, stat: keyof ContestStats) => void
}

export default function PokeblockFeeder({ pokemonStats, onPokeblockFeed }: PokeblockFeederProps) {
  const [showAnimation, setShowAnimation] = useState<string | null>(null)

  const pokeblocks = [
    { color: 'Red', stat: 'coolness' as keyof ContestStats, bgColor: 'bg-red-400', hoverColor: 'hover:bg-red-500' },
    { color: 'Blue', stat: 'beauty' as keyof ContestStats, bgColor: 'bg-blue-400', hoverColor: 'hover:bg-blue-500' },
    { color: 'Pink', stat: 'cuteness' as keyof ContestStats, bgColor: 'bg-pink-400', hoverColor: 'hover:bg-pink-500' },
    { color: 'Green', stat: 'cleverness' as keyof ContestStats, bgColor: 'bg-green-400', hoverColor: 'hover:bg-green-500' },
    { color: 'Yellow', stat: 'toughness' as keyof ContestStats, bgColor: 'bg-yellow-400', hoverColor: 'hover:bg-yellow-500' },
    { color: 'Rainbow', stat: 'coolness' as keyof ContestStats, bgColor: 'bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400', hoverColor: 'hover:from-pink-500 hover:via-purple-500 hover:to-blue-500' }
  ]

  const handlePokeblockClick = (color: string, stat: keyof ContestStats) => {
    if (color === 'Rainbow') {
      // Rainbow block affects all stats
      onPokeblockFeed(color, 'coolness')
      onPokeblockFeed(color, 'beauty')
      onPokeblockFeed(color, 'cuteness')
      onPokeblockFeed(color, 'cleverness')
      onPokeblockFeed(color, 'toughness')
    } else {
      onPokeblockFeed(color, stat)
    }
    
    setShowAnimation(color)
    setTimeout(() => setShowAnimation(null), 1000)
  }

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 rounded-2xl p-6 shadow-lg">
      <h3 className="text-xl font-bold text-center mb-6 text-gray-700 dark:text-gray-300">
        🍬 Pokéblock Feeder 🍬
      </h3>
      
      {/* Current Stats Display */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {Object.entries(pokemonStats).map(([stat, value]) => (
          <div key={stat} className="text-center">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize mb-1">
              {stat}
            </div>
            <div className="flex items-center justify-center gap-1">
              <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-pink-400 to-purple-400 transition-all duration-500"
                  style={{ width: `${(value / 255) * 100}%` }}
                />
              </div>
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-2">
                {value}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Pokéblock Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {pokeblocks.map((block) => (
          <button
            key={block.color}
            onClick={() => handlePokeblockClick(block.color, block.stat)}
            className={`relative group ${block.bgColor} ${block.hoverColor} rounded-xl p-4 text-white font-bold transition-all duration-300 hover:scale-105 hover:shadow-lg transform`}
          >
            {/* Animation overlay */}
            {showAnimation === block.color && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-ping">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
              </div>
            )}
            
            <div className="relative z-10">
              <div className="text-2xl mb-2">
                {block.color === 'Rainbow' ? '🌈' : '🍬'}
              </div>
              <div className="text-sm font-bold">
                {block.color} Pokéblock
              </div>
              <div className="text-xs opacity-90">
                +20 {block.color === 'Rainbow' ? 'All Stats' : block.stat}
              </div>
            </div>
            
            {/* Hover effect */}
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
          </button>
        ))}
      </div>

      {/* Tips */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          💡 Tip: Feed matching colored Pokéblocks to boost the contest stat you need!
        </p>
      </div>
    </div>
  )
}
