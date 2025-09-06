'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pokemon } from '@/types/pokemon'
import { formatPokemonName } from '@/lib/utils'
import { ArrowLeft, Zap } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'
import Tabs from '@/components/pokemon/Tabs'
import OverviewSection from '@/components/pokemon/OverviewSection'
import StatsSection from '@/components/pokemon/StatsSection'
import MovesSection from '@/components/pokemon/MovesSection'
import EvolutionSection from '@/components/pokemon/EvolutionSection'
import MatchupsSection from '@/components/pokemon/MatchupsSection'

interface PokemonDetailClientProps {
  pokemon: Pokemon | null
  error: string | null
}

export default function PokemonDetailClient({ pokemon, error }: PokemonDetailClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'moves' | 'evolution' | 'matchups'>('overview')

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
        {/* Pokemon Header */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pokemon.sprites.other?.['official-artwork']?.front_default || pokemon.sprites.front_default || '/placeholder-pokemon.png'}
              alt={formatPokemonName(pokemon.name)}
              className="w-32 h-32 mx-auto object-contain"
            />
          </div>
          <h1 className={`text-4xl font-bold mt-4 ${
            theme === 'gold' ? 'font-retro text-gold-accent'
            : theme === 'green' ? 'font-gameboy text-green-accent'
            : theme === 'red' ? 'font-retro text-red-accent'
            : theme === 'ruby' ? 'font-retro text-ruby-accent'
            : 'text-text'
          }`}>
            {formatPokemonName(pokemon.name)}
          </h1>
          <p className="text-muted text-xl">#{pokemon.id.toString().padStart(3, '0')}</p>
        </div>

        {/* Tabs */}
        <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content */}
        <div className="bg-surface rounded-2xl border border-border">
          {activeTab === 'overview' && (
            <OverviewSection
              types={pokemon.types.map(t => t.type.name)}
              abilities={pokemon.abilities.map(a => ({ name: a.ability.name, is_hidden: a.is_hidden }))}
              flavorText="A mysterious Pokémon with unique abilities and characteristics."
              heightM={pokemon.height / 10}
              weightKg={pokemon.weight / 10}
              baseExp={pokemon.base_experience}
            />
          )}
          {activeTab === 'stats' && (
            <StatsSection
              stats={pokemon.stats.map(stat => ({ name: stat.stat.name, value: stat.base_stat }))}
            />
          )}
          {activeTab === 'moves' && (
            <MovesSection
              moves={pokemon.moves}
            />
          )}
          {activeTab === 'evolution' && (
            <EvolutionSection
              chain={[]}
            />
          )}
          {activeTab === 'matchups' && (
            <MatchupsSection
              groups={[]}
            />
          )}
        </div>
      </main>
    </div>
  )
}
