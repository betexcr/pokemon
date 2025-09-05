'use client'

import { useRouter } from 'next/navigation'
import { Pokemon } from '@/types/pokemon'
import { formatPokemonName, typeColors, cn } from '@/lib/utils'
import { ArrowLeft, Heart, Zap, Shield, Swords, Target, TrendingUp } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'

interface PokemonDetailClientProps {
  pokemon: Pokemon | null
  error: string | null
}

export default function PokemonDetailClient({ pokemon, error }: PokemonDetailClientProps) {
  const router = useRouter()

  let theme = 'light'
  try {
    const themeContext = useTheme()
    theme = themeContext.theme
  } catch {
    // Theme provider not available, use default
  }

  if (error || !pokemon) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Pokémon not found'}</p>
          <button 
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-poke-blue text-white rounded-lg hover:bg-poke-blue/90"
          >
            Back to Pokédex
          </button>
        </div>
      </div>
    )
  }

  const getStatColor = (stat: string) => {
    switch (stat.toLowerCase()) {
      case 'hp': return 'text-red-500'
      case 'attack': return 'text-orange-500'
      case 'defense': return 'text-blue-500'
      case 'special-attack': return 'text-purple-500'
      case 'special-defense': return 'text-green-500'
      case 'speed': return 'text-yellow-500'
      default: return 'text-gray-500'
    }
  }

  const getStatIcon = (stat: string) => {
    switch (stat.toLowerCase()) {
      case 'hp': return <Heart className="h-4 w-4" />
      case 'attack': return <Swords className="h-4 w-4" />
      case 'defense': return <Shield className="h-4 w-4" />
      case 'special-attack': return <Zap className="h-4 w-4" />
      case 'special-defense': return <Shield className="h-4 w-4" />
      case 'speed': return <TrendingUp className="h-4 w-4" />
      default: return <Target className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className={`sticky top-0 z-50 border-b border-border bg-surface`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/')}
                className="flex items-center space-x-2 text-muted hover:text-text transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Pokédex</span>
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <Zap className={`h-8 w-8 ${
                theme === 'gold' ? 'text-gold-accent' 
                : theme === 'green' ? 'text-green-accent'
                : theme === 'red' ? 'text-red-accent'
                : theme === 'ruby' ? 'text-ruby-accent'
                : 'text-poke-yellow'
              }`} />
              <h1 className={`text-2xl font-bold ${
                theme === 'gold' ? 'font-retro text-gold-accent'
                : theme === 'green' ? 'font-gameboy text-green-accent'
                : theme === 'red' ? 'font-retro text-red-accent'
                : theme === 'ruby' ? 'font-retro text-ruby-accent'
                : 'text-text'
              }`}>
                PokéDex
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Image and Basic Info */}
          <div className="space-y-6">
            {/* Pokemon Image */}
            <div className="bg-surface rounded-2xl p-8 border border-border">
              <div className="text-center">
                <div className="relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pokemon.sprites.other?.['official-artwork']?.front_default || pokemon.sprites.front_default || '/placeholder-pokemon.png'}
                    alt={formatPokemonName(pokemon.name)}
                    className="w-64 h-64 mx-auto object-contain"
                  />
                </div>
                <h1 className={`text-3xl font-bold mt-4 ${
                  theme === 'gold' ? 'font-retro text-gold-accent'
                  : theme === 'green' ? 'font-gameboy text-green-accent'
                  : theme === 'red' ? 'font-retro text-red-accent'
                  : theme === 'ruby' ? 'font-retro text-ruby-accent'
                  : 'text-text'
                }`}>
                  {formatPokemonName(pokemon.name)}
                </h1>
                <p className="text-muted text-lg">#{pokemon.id.toString().padStart(3, '0')}</p>
              </div>
            </div>

            {/* Types */}
            <div className="bg-surface rounded-2xl p-6 border border-border">
              <h2 className="text-xl font-semibold mb-4 text-text">Types</h2>
              <div className="flex flex-wrap gap-2">
                {pokemon.types.map((type, index) => (
                  <span
                    key={index}
                    className={cn(
                      'px-4 py-2 rounded-full text-sm font-medium border',
                      typeColors[type.type.name].bg,
                      typeColors[type.type.name].text,
                      typeColors[type.type.name].border
                    )}
                  >
                    {formatPokemonName(type.type.name)}
                  </span>
                ))}
              </div>
            </div>

            {/* Physical Stats */}
            <div className="bg-surface rounded-2xl p-6 border border-border">
              <h2 className="text-xl font-semibold mb-4 text-text">Physical Stats</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-muted text-sm">Height</p>
                  <p className="text-lg font-semibold text-text">{pokemon.height / 10}m</p>
                </div>
                <div className="text-center">
                  <p className="text-muted text-sm">Weight</p>
                  <p className="text-lg font-semibold text-text">{pokemon.weight / 10}kg</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Stats and Abilities */}
          <div className="space-y-6">
            {/* Base Stats */}
            <div className="bg-surface rounded-2xl p-6 border border-border">
              <h2 className="text-xl font-semibold mb-6 text-text">Base Stats</h2>
              <div className="space-y-4">
                {pokemon.stats.map((stat, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={getStatColor(stat.stat.name)}>
                          {getStatIcon(stat.stat.name)}
                        </span>
                        <span className="text-sm font-medium text-text capitalize">
                          {stat.stat.name.replace('-', ' ')}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-text">{stat.base_stat}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          stat.base_stat >= 100 ? 'bg-green-500' :
                          stat.base_stat >= 80 ? 'bg-yellow-500' :
                          stat.base_stat >= 60 ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min((stat.base_stat / 150) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Abilities */}
            <div className="bg-surface rounded-2xl p-6 border border-border">
              <h2 className="text-xl font-semibold mb-4 text-text">Abilities</h2>
              <div className="space-y-2">
                {pokemon.abilities.map((ability, index) => (
                  <div
                    key={index}
                    className={cn(
                      'px-3 py-2 rounded-lg border',
                      ability.is_hidden
                        ? 'bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-300'
                        : 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300'
                    )}
                  >
                    <span className="font-medium capitalize">
                      {formatPokemonName(ability.ability.name)}
                    </span>
                    {ability.is_hidden && (
                      <span className="ml-2 text-xs opacity-75">(Hidden)</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Moves */}
            <div className="bg-surface rounded-2xl p-6 border border-border">
              <h2 className="text-xl font-semibold mb-4 text-text">Moves</h2>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {pokemon.moves.slice(0, 20).map((move, index) => (
                  <div
                    key={index}
                    className="px-3 py-1 bg-gray-50 dark:bg-gray-800 rounded text-sm text-text capitalize"
                  >
                    {formatPokemonName(move.move.name)}
                  </div>
                ))}
                {pokemon.moves.length > 20 && (
                  <div className="col-span-2 text-center text-muted text-sm">
                    +{pokemon.moves.length - 20} more moves
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
