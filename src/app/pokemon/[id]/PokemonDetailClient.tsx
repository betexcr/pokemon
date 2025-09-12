'use client'

import { useEffect, useState } from 'react'
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
import { getPokemon, getPokemonSpecies, getEvolutionChain } from '@/lib/api'
import MatchupsSection from '@/components/pokemon/MatchupsSection'
import { calculateTypeEffectiveness } from '@/lib/api'

interface PokemonDetailClientProps {
  pokemon: Pokemon | null
  error: string | null
}

export default function PokemonDetailClient({ pokemon, error }: PokemonDetailClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'moves' | 'evolution' | 'matchups'>('overview')
  const [evolutionChain, setEvolutionChain] = useState<Array<{ id: number; name: string; types: string[]; condition?: string }>>([])
  const [matchups, setMatchups] = useState<Array<{ title: string; types: string[]; tone: 'danger'|'ok'|'immune' }>>([])

  let theme = 'light'
  try {
    const themeContext = useTheme()
    theme = themeContext.theme
  } catch {
    // Theme provider not available, use default
  }

  // Load evolution chain once on mount
  useEffect(() => {
    let isMounted = true
    const loadEvolution = async () => {
      try {
        if (!pokemon) return
        // Get species to find chain url
        const species = await getPokemonSpecies(pokemon.id)
        const chainUrl = species.evolution_chain?.url
        if (!chainUrl) return
        const chainId = parseInt(chainUrl.split('/').filter(Boolean).pop() || '0')
        if (!chainId) return
        const chain = await getEvolutionChain(chainId)
        // Flatten chain into list with ids/names/conditions
        const nodes: Array<{ id: number; name: string; types: string[]; condition?: string }> = []
        const walk = async (node: any, condition?: string) => {
          const speciesUrl: string = node.species?.url || ''
          const id = parseInt(speciesUrl.split('/').filter(Boolean).pop() || '0')
          if (id) {
            try {
              const p = await getPokemon(id)
              const types = (p.types || []).map((t: any) => t.type.name)
              nodes.push({ id, name: p.name, types, condition })
            } catch {}
          }
          for (const next of node.evolves_to || []) {
            const details = next.evolution_details?.[0]
            const cond = details?.trigger?.name?.replace(/-/g, ' ') || undefined
            await walk(next, cond)
          }
        }
        await walk(chain.chain)
        if (isMounted) setEvolutionChain(nodes)
      } catch (e) {
        console.warn('Failed to load evolution chain', e)
      }
    }
    loadEvolution()
    return () => { isMounted = false }
  }, [pokemon])

  // Compute matchups based on Pokémon types
  useEffect(() => {
    if (!pokemon) return
    const defending = pokemon.types.map(t => t.type.name)
    const allTypes = ['normal','fire','water','electric','grass','ice','fighting','poison','ground','flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy']
    const weaknesses: string[] = []
    const resistances: string[] = []
    const immunities: string[] = []
    allTypes.forEach(attacking => {
      const mult = calculateTypeEffectiveness(attacking, defending)
      if (mult === 0) immunities.push(attacking)
      else if (mult > 1) weaknesses.push(attacking)
      else if (mult < 1) resistances.push(attacking)
    })
    setMatchups([
      { title: 'Weak to (2×+)', types: weaknesses, tone: 'danger' },
      { title: 'Resists (0.5×)', types: resistances, tone: 'ok' },
      { title: 'Immune (0×)', types: immunities, tone: 'immune' }
    ])
  }, [pokemon])

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
        <div className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8">
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
                : 'text-poke-blue'
              }`} style={{ fontFamily: 'Pokemon Solid, sans-serif', color: 'var(--color-poke-blue) !important' }}>
                PokéDex
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8 py-8">
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
              name={pokemon.name}
              stats={pokemon.stats.map(stat => ({ name: stat.stat.name, value: stat.base_stat }))}
            />
          )}
          {activeTab === 'moves' && (
            <MovesSection
              moves={pokemon.moves.map(pokemonMove => ({
                name: pokemonMove.move.name,
                type: 'normal', // Default type, would need to fetch actual move data
                damage_class: 'physical' as const,
                power: null,
                accuracy: null,
                pp: null,
                level_learned_at: pokemonMove.version_group_details[0]?.level_learned_at || null,
                short_effect: null
              }))}
            />
          )}
          {activeTab === 'evolution' && (
            <EvolutionSection
              chain={evolutionChain}
            />
          )}
          {activeTab === 'matchups' && (
            <MatchupsSection
              groups={matchups}
            />
          )}
        </div>
      </main>
    </div>
  )
}
