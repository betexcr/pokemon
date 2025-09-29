'use client'

import { useState, useEffect } from 'react'
import PokemonHero from '@/components/PokemonHero'
import Tabs from '@/components/pokemon/Tabs'
import StatsSection from '@/components/pokemon/StatsSection'
import MovesSection from '@/components/pokemon/MovesSection'
import EvolutionSection from '@/components/pokemon/EvolutionSection'
import MatchupsSection from '@/components/pokemon/MatchupsSection'
import { Pokemon } from '@/types/pokemon'
import { getPokemonSpecies, getPokemonAbilities, getPokemonMoves, getEvolutionChainNodes } from '@/lib/api'
import { getMatchup } from '@/lib/getMatchup'

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
        const [species, abilitiesData, movesData, evolutionData] = await Promise.allSettled([
          getPokemonSpecies(pokemon.id),
          getPokemonAbilities(pokemon.id),
          getPokemonMoves(pokemon.id),
          getEvolutionChainNodes(pokemon.id)
        ])
        
        // Handle species data
        if (species.status === 'fulfilled') {
          const speciesData = species.value
          const englishFlavorText = speciesData.flavor_text_entries?.find((entry: any) => entry.language.name === 'en')?.flavor_text || ''
          setFlavorText(englishFlavorText)
          const englishGenus = speciesData.genera?.find((genus: any) => genus.language.name === 'en')?.genus || ''
          setGenus(englishGenus)
          setHasGenderDifferences(speciesData.has_gender_differences || false)
        } else {
          console.warn('Failed to load species data:', species.reason)
        }
        
        // Handle abilities data
        if (abilitiesData.status === 'fulfilled') {
          setAbilities(abilitiesData.value)
        } else {
          console.warn('Failed to load abilities data:', abilitiesData.reason)
          setAbilities([])
        }
        
        // Handle moves data
        if (movesData.status === 'fulfilled') {
          setMoves(movesData.value)
        } else {
          console.warn('Failed to load moves data:', movesData.reason)
          setMoves([])
        }
        
        // Handle evolution data
        if (evolutionData.status === 'fulfilled') {
          setEvolutionChain(evolutionData.value)
        } else {
          console.warn('Failed to load evolution data:', evolutionData.reason)
          setEvolutionChain([])
        }
        
        // Calculate type matchups using the new getMatchup function
        const pokemonTypes = pokemon.types.map(t => t.type.name)
        
        // Convert to proper case for getMatchup function
        const defendingTypes = pokemonTypes.map(type => 
          type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()
        )
        
        const matchups = getMatchup(defendingTypes)
        
        // Group by effectiveness with separate categories
        const doubleWeak = matchups.x4.map(type => type.toLowerCase())
        const weakTo = matchups.x2.map(type => type.toLowerCase())
        const resists = matchups.x0_5.map(type => type.toLowerCase())
        const quarterResists = matchups.x0_25.map(type => type.toLowerCase())
        const immune = matchups.x0.map(type => type.toLowerCase())
        
        const matchupGroups = [
          ...(doubleWeak.length > 0 ? [{ title: "Double Weak (4×)", types: doubleWeak, tone: "danger" as const }] : []),
          ...(weakTo.length > 0 ? [{ title: "Weak to (2×)", types: weakTo, tone: "danger" as const }] : []),
          ...(resists.length > 0 ? [{ title: "Resists (0.5×)", types: resists, tone: "ok" as const }] : []),
          ...(quarterResists.length > 0 ? [{ title: "Quarter Resists (0.25×)", types: quarterResists, tone: "ok" as const }] : []),
          ...(immune.length > 0 ? [{ title: "Immune (0×)", types: immune, tone: "immune" as const }] : [])
        ]
        
        setTypeMatchups(matchupGroups)
        
      } catch (error) {
        console.error('Failed to load Pokemon details:', error)
        // Only set error if it's a critical failure, not just missing optional data
        if (error instanceof Error && error.message.includes('does not exist')) {
          setError('This Pokemon does not exist.')
        } else {
          setError('Failed to load some Pokemon details. Some information may be missing.')
        }
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
