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
import { PokemonDetailsSkeleton, StatsSectionSkeleton, MovesSectionSkeleton, EvolutionSectionSkeleton, MatchupsSectionSkeleton } from '@/components/skeletons/PokemonDetailsSkeleton'

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
  const [loadingMoves, setLoadingMoves] = useState(true)
  const [loadingEvolution, setLoadingEvolution] = useState(true)
  const [loadingMatchups, setLoadingMatchups] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPokemonDetails = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Load critical data first (species for flavor text and genus)
        const speciesPromise = getPokemonSpecies(pokemon.id).then(speciesData => {
          const englishFlavorText = speciesData.flavor_text_entries?.find((entry: any) => entry.language.name === 'en')?.flavor_text || ''
          setFlavorText(englishFlavorText)
          const englishGenus = speciesData.genera?.find((genus: any) => genus.language.name === 'en')?.genus || ''
          setGenus(englishGenus)
          setHasGenderDifferences(speciesData.has_gender_differences || false)
          return speciesData
        }).catch(error => {
          console.warn('Failed to load species data:', error)
          return null
        })

        // Load abilities data (important for hero section)
        const abilitiesPromise = getPokemonAbilities(pokemon.id).then(data => {
          setAbilities(data)
          return data
        }).catch(error => {
          console.warn('Failed to load abilities data:', error)
          setAbilities([])
          return []
        })

        // Wait for critical data to load before showing content
        await Promise.allSettled([speciesPromise, abilitiesPromise])
        
        // Allow UI to render with basic data while loading secondary data
        setLoading(false)

        // Load moves data separately for progressive loading
        const movesPromise = getPokemonMoves(pokemon.id).then(data => {
          setMoves(data)
          setLoadingMoves(false)
          return data
        }).catch(error => {
          console.warn('Failed to load moves data:', error)
          setMoves([])
          setLoadingMoves(false)
        })

        // Load evolution data separately for progressive loading
        const evolutionPromise = getEvolutionChainNodes(pokemon.id).then(data => {
          setEvolutionChain(data)
          setLoadingEvolution(false)
          return data
        }).catch(error => {
          console.warn('Failed to load evolution data:', error)
          setEvolutionChain([])
          setLoadingEvolution(false)
        })

        // Calculate type matchups immediately (no API call needed)
        const pokemonTypes = pokemon.types.map(t => t.type.name)
        
        // Convert to proper case for getMatchup function
        const defendingTypes = pokemonTypes.map(type => 
          type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()
        )
        
        const matchups = getMatchup(defendingTypes)
        setTypeMatchups(matchups)
        setLoadingMatchups(false)

        // Don't wait for secondary data - let it load in background
        Promise.allSettled([movesPromise, evolutionPromise]).catch(error => {
          console.warn('Failed to load secondary data:', error)
        })
        
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
        return loading ? <StatsSectionSkeleton /> : <StatsSection stats={transformedStats} name={pokemon.name} />
      case 'moves':
        return loadingMoves ? <MovesSectionSkeleton /> : <MovesSection moves={moves} pokemonTypes={pokemon.types.map(t => t.type.name)} />
      case 'evolution':
        return loadingEvolution ? <EvolutionSectionSkeleton /> : <EvolutionSection chain={evolutionChain} />
      case 'matchups':
        return loadingMatchups ? <MatchupsSectionSkeleton /> : <MatchupsSection groups={typeMatchups} />
      default:
        return loading ? <StatsSectionSkeleton /> : <StatsSection stats={transformedStats} name={pokemon.name} />
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
          loading={loading}
        />
      )}
      
      <div className="mt-8">
        <Tabs 
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        
        <div className="mt-6">
          {(loading || externalLoading) ? (
            <PokemonDetailsSkeleton />
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
