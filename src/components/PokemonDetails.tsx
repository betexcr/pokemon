'use client'

import { useState, useEffect } from 'react'
import PokemonHero from '@/components/PokemonHero'
import Tabs from '@/components/pokemon/Tabs'
import StatsSection from '@/components/pokemon/StatsSection'
import MovesSection from '@/components/pokemon/MovesSection'
import EvolutionSection from '@/components/pokemon/EvolutionSection'
import MatchupsSection from '@/components/pokemon/MatchupsSection'
import { Pokemon } from '@/types/pokemon'
import { getPokemonSpecies, getPokemonAbilities, getPokemonMoves, getEvolutionChainNodes, calculateTypeEffectiveness } from '@/lib/api'

interface PokemonDetailsProps {
  pokemon: Pokemon
  showHeader?: boolean
  className?: string
  loading?: boolean
}

export default function PokemonDetails({ pokemon, showHeader = true, className = '', loading: externalLoading }: PokemonDetailsProps) {
  const [abilities, setAbilities] = useState<{ name: string; is_hidden?: boolean; description?: string | null }[]>([])
  const [flavorText, setFlavorText] = useState<string>('')
  const [genus, setGenus] = useState<string>('')
  const [hasGenderDifferences, setHasGenderDifferences] = useState<boolean>(false)
  const [moves, setMoves] = useState<any[]>([])
  const [evolutionChain, setEvolutionChain] = useState<any[]>([])
  const [typeMatchups, setTypeMatchups] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'stats' | 'moves' | 'evolution' | 'matchups'>('stats')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPokemonDetails = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Load all data in parallel for better performance
        const [species, abilitiesData, movesData, evolutionData] = await Promise.all([
          getPokemonSpecies(pokemon.id),
          getPokemonAbilities(pokemon.id),
          getPokemonMoves(pokemon.id),
          getEvolutionChainNodes(pokemon.id)
        ])
        
        // Set species data
        setFlavorText(species.flavor_text_entries?.[0]?.flavor_text || '')
        // Get English genus specifically
        const englishGenus = species.genera?.find((genus: any) => genus.language.name === 'en')?.genus || ''
        setGenus(englishGenus)
        setHasGenderDifferences(species.has_gender_differences || false)
        
        // Set other data
        setAbilities(abilitiesData)
        setMoves(movesData)
        setEvolutionChain(evolutionData)
        
        // Calculate type matchups
        const pokemonTypes = pokemon.types.map(t => t.type.name)
        const allTypes = ['normal','fire','water','electric','grass','ice','fighting','poison','ground','flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy']
        
        const typeEffectiveness = allTypes.map(attackingType => {
          const effectiveness = calculateTypeEffectiveness([attackingType], pokemonTypes)
          return {
            type: attackingType,
            effectiveness,
            multiplier: effectiveness === 0 ? 'x0' : effectiveness === 0.5 ? 'x0.5' : effectiveness === 1 ? 'x1' : effectiveness === 2 ? 'x2' : effectiveness === 4 ? 'x4' : `x${effectiveness}`
          }
        })
        
        // Group by effectiveness
        const weakTo = typeEffectiveness.filter(e => e.effectiveness >= 2).map(e => e.type)
        const resists = typeEffectiveness.filter(e => e.effectiveness === 0.5).map(e => e.type)
        const immune = typeEffectiveness.filter(e => e.effectiveness === 0).map(e => e.type)
        
        const matchupGroups = [
          { title: "Weak to (2×+)", types: weakTo, tone: "danger" as const },
          { title: "Resists (0.5×)", types: resists, tone: "ok" as const },
          { title: "Immune (0×)", types: immune, tone: "immune" as const }
        ]
        
        setTypeMatchups(matchupGroups)
        
      } catch (error) {
        console.error('Failed to load Pokemon details:', error)
        setError('Failed to load Pokemon details. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadPokemonDetails()
  }, [pokemon.id, pokemon.types])

  const renderTabContent = () => {
    // Transform Pokemon stats to the format expected by StatsSection
    const transformedStats = pokemon.stats.map(stat => ({
      name: stat.stat.name,
      value: stat.base_stat
    }))

    switch (activeTab) {
      case 'stats':
        return <StatsSection stats={transformedStats} name={pokemon.name} />
      case 'moves':
        return <MovesSection pokemon={pokemon} moves={moves} />
      case 'evolution':
        return <EvolutionSection chain={evolutionChain} />
      case 'matchups':
        return <MatchupsSection groups={typeMatchups} />
      default:
        return <StatsSection stats={transformedStats} name={pokemon.name} />
    }
  }

  return (
    <div className={`pokemon-details ${className}`}>
      {showHeader && (
        <PokemonHero 
          pokemon={pokemon}
          abilities={abilities}
          flavorText={flavorText}
          genus={genus}
          hasGenderDifferences={hasGenderDifferences}
        />
      )}
      
      <div className="mt-8">
        <Tabs 
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        
        <div className="mt-6">
          {(loading || externalLoading) ? (
            <div className="flex items-center justify-center min-h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-poke-blue"></div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center min-h-64 text-center">
              <div className="text-red-500 text-lg mb-2">⚠️</div>
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-poke-blue text-white rounded-lg hover:bg-poke-blue/80 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            renderTabContent()
          )}
        </div>
      </div>
    </div>
  )
}
