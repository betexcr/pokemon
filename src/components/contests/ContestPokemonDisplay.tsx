'use client'

import { Pokemon } from '@/types/pokemon'
import { formatPokemonName } from '@/lib/utils'
import { Heart, Star, Sparkles, Zap } from 'lucide-react'
import Image from 'next/image'

interface ContestPokemonDisplayProps {
  selectedPokemon: Pokemon[]
  selectedCategory?: string | null
  currentRound?: 'intro' | 'talent' | 'results'
}

export default function ContestPokemonDisplay({ 
  selectedPokemon, 
  selectedCategory,
  currentRound 
}: ContestPokemonDisplayProps) {
  if (selectedPokemon.length === 0) return null

  const getCategoryTheme = (category: string | null) => {
    switch (category) {
      case 'cute':
        return { bg: 'bg-pink-100', border: 'border-pink-300', text: 'text-pink-700', icon: '💖' }
      case 'beauty':
        return { bg: 'bg-rose-100', border: 'border-rose-300', text: 'text-rose-700', icon: '🌸' }
      case 'cool':
        return { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-700', icon: '❄️' }
      case 'tough':
        return { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-700', icon: '💪' }
      case 'clever':
        return { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-700', icon: '🧠' }
      default:
        return { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-700', icon: '✨' }
    }
  }

  const categoryTheme = getCategoryTheme(selectedCategory)

  const getRoundIcon = (round: string | undefined) => {
    switch (round) {
      case 'intro': return <Star className="w-4 h-4 text-yellow-500" />
      case 'talent': return <Zap className="w-4 h-4 text-purple-500" />
      case 'results': return <Sparkles className="w-4 h-4 text-green-500" />
      default: return <Heart className="w-4 h-4 text-pink-500" />
    }
  }

  const getShowdownAnimatedSprite = (name: string, id: number) => {
    const n = name.toLowerCase()
    const mapped = n
      .replace(/\s+/g, '')
      .replace("mr-mime", "mr.mime")
      .replace("mime-jr", "mimejr")
      .replace("type-null", "typenull")
      .replace("jangmo-o", "jangmoo")
      .replace("hakamo-o", "hakamo-o")
      .replace("kommo-o", "kommoo")
      .replace("ho-oh", "hooh")
      .replace("porygon-z", "porygonz")
      .replace("nidoran-f", "nidoranf")
      .replace("nidoran-m", "nidoranm")
    return `https://play.pokemonshowdown.com/sprites/ani/${mapped}.gif`
  }

  return (
    <div className="mb-8">
      <h3 className="text-xl font-bold text-center mb-4 text-gray-700 dark:text-gray-300">
        🎭 Your Contest Team
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {selectedPokemon.map((pokemon, index) => (
          <div
            key={`${pokemon.id}-${index}`}
            className={`
              relative overflow-hidden rounded-2xl p-4 shadow-lg transition-all duration-300 hover:scale-105
              ${selectedCategory ? `${categoryTheme.bg} ${categoryTheme.border} border-2` : 'bg-gradient-to-br from-pink-100 to-purple-100 border-2 border-pink-300'}
              dark:from-gray-800 dark:to-gray-700 dark:border-gray-600
            `}
          >
            {/* Background Sparkles */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-2 right-2 text-lg animate-pulse">✨</div>
              <div className="absolute bottom-2 left-2 text-lg animate-pulse delay-150">⭐</div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl animate-bounce">💫</div>
            </div>

            {/* Pokemon Image */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="relative w-20 h-20 mb-3">
                <Image
                  src={getShowdownAnimatedSprite(pokemon.name, pokemon.id)}
                  alt={pokemon.name}
                  width={80}
                  height={80}
                  className="w-full h-full object-contain animate-bounce"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement
                    target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`
                  }}
                />
                {/* Floating hearts around Pokemon */}
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center animate-ping">
                  <Heart className="w-2 h-2 text-white" />
                </div>
                <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center animate-ping delay-300">
                  <Star className="w-2 h-2 text-white" />
                </div>
              </div>

              {/* Pokemon Name */}
              <h4 className="font-bold text-lg text-gray-800 dark:text-gray-200 mb-2 text-center">
                {formatPokemonName(pokemon.name)}
              </h4>

              {/* Contest Category Badge */}
              {selectedCategory && (
                <div className={`
                  inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium
                  ${categoryTheme.bg} ${categoryTheme.text} ${categoryTheme.border} border
                `}>
                  <span>{categoryTheme.icon}</span>
                  <span className="capitalize">{selectedCategory} Contest</span>
                </div>
              )}

              {/* Round Status */}
              {currentRound && (
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  {getRoundIcon(currentRound)}
                  <span className="capitalize">{currentRound} Round</span>
                </div>
              )}

              {/* Pokemon Types */}
              {pokemon.types && pokemon.types.length > 0 && (
                <div className="mt-2 flex gap-1">
                  {pokemon.types.map((typeObj, typeIndex) => {
                    const typeName = typeof typeObj === 'string' ? typeObj : typeObj.type?.name
                    return typeName ? (
                      <span
                        key={typeIndex}
                        className="px-2 py-1 bg-white/80 dark:bg-gray-800/80 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300"
                      >
                        {typeName}
                      </span>
                    ) : null
                  })}
                </div>
              )}

              {/* Contest Stats Preview */}
              <div className="mt-3 w-full">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Contest Potential</div>
                <div className="flex gap-1">
                  {['coolness', 'beauty', 'cuteness', 'cleverness', 'toughness'].map((stat, statIndex) => (
                    <div key={stat} className="flex-1">
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-pink-400 to-purple-400 rounded-full transition-all duration-1000"
                          style={{ 
                            width: `${Math.random() * 40 + 30}%`,
                            animationDelay: `${statIndex * 200}ms`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Kawaii Border Animation */}
            <div className="absolute inset-0 rounded-2xl border-2 border-transparent bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 opacity-0 hover:opacity-100 transition-opacity duration-300 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Team Status Message */}
      {selectedCategory && (
        <div className="mt-4 text-center">
          <div className={`
            inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
            ${categoryTheme.bg} ${categoryTheme.text} ${categoryTheme.border} border
          `}>
            <span>{categoryTheme.icon}</span>
            <span>Ready for {selectedCategory} Contest!</span>
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
        </div>
      )}
    </div>
  )
}
