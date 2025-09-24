'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pokemon } from '@/types/pokemon'
import { formatPokemonName } from '@/lib/utils'
import AppHeader from '@/components/AppHeader'
import Tabs from '@/components/pokemon/Tabs'
import OverviewSection from '@/components/pokemon/OverviewSection'
import StatsSection from '@/components/pokemon/StatsSection'
import MovesSection from '@/components/pokemon/MovesSection'
import EvolutionSection from '@/components/pokemon/EvolutionSection'
import { getPokemon, getPokemonSpecies, getEvolutionChain, getAbility, getMove } from '@/lib/api'
import { PokemonSpecies } from '@/types/pokemon'
import MatchupsSection from '@/components/pokemon/MatchupsSection'
import { calculateTypeEffectiveness } from '@/lib/api'
import PokemonHero from '@/components/PokemonHero'

interface PokemonDetailClientProps {
  pokemon: Pokemon | null
  error: string | null
}

export default function PokemonDetailClient({ pokemon, error }: PokemonDetailClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'stats' | 'moves' | 'evolution' | 'matchups'>('stats')
  const [evolutionChain, setEvolutionChain] = useState<Array<{ id: number; name: string; types: string[]; condition?: string }>>([])
  const [matchups, setMatchups] = useState<Array<{ title: string; types: string[]; tone: 'danger'|'ok'|'immune' }>>([])
  const [abilitiesWithDescriptions, setAbilitiesWithDescriptions] = useState<Array<{ name: string; is_hidden?: boolean; description?: string | null }>>([])
  const [movesWithEffects, setMovesWithEffects] = useState<Array<{ name: string; type: string; damage_class: 'physical' | 'special' | 'status'; power: number | null; accuracy: number | null; pp: number | null; level_learned_at: number | null; short_effect: string | null }>>([])
  const [speciesData, setSpeciesData] = useState<PokemonSpecies | null>(null)

  // Helper functions to extract flavor text and genus
  const getFlavorText = (species: PokemonSpecies | null): string => {
    if (!species?.flavor_text_entries) return "A mysterious Pokémon with unique abilities and characteristics."
    
    // Find English flavor text from the latest version (usually Sword/Shield or Scarlet/Violet)
    const englishEntries = species.flavor_text_entries.filter(entry => 
      entry.language.name === 'en'
    )
    
    if (englishEntries.length === 0) return "A mysterious Pokémon with unique abilities and characteristics."
    
    // Sort by version and take the most recent one
    const latestEntry = englishEntries[englishEntries.length - 1]
    return latestEntry.flavor_text.replace(/\f/g, ' ') // Replace form feed characters with spaces
  }

  const getGenus = (species: PokemonSpecies | null): string => {
    if (!species?.genera) return "Unknown Pokémon"
    
    // Find English genus
    const englishGenus = species.genera.find(genus => 
      genus.language.name === 'en'
    )
    
    return englishGenus?.genus || "Unknown Pokémon"
  }

  // Theme not required here; shared AppHeader handles styling

  // Load species data once on mount
  useEffect(() => {
    let isMounted = true
    const loadSpecies = async () => {
      try {
        if (!pokemon) return
        // Some Pokémon ids (forms) don't match species ids. Use species.name or id from species.url.
        const speciesIdentifier = (() => {
          const url = (pokemon as any).species?.url as string | undefined
          if (url) {
            const last = url.split('/').filter(Boolean).pop()
            const maybeId = last ? parseInt(last) : NaN
            if (!Number.isNaN(maybeId)) return maybeId
          }
          return (pokemon as any).species?.name ?? pokemon.id
        })()
        const species = await getPokemonSpecies(speciesIdentifier)
        if (isMounted) {
          setSpeciesData(species)
        }
      } catch (error) {
        console.error('Failed to load species data:', error)
      }
    }

    loadSpecies()
    return () => { isMounted = false }
  }, [pokemon])

  // Load evolution chain once on mount
  useEffect(() => {
    let isMounted = true
    const loadEvolution = async () => {
      try {
        if (!pokemon) return
        // Get species to find chain url
        const speciesIdentifier = (() => {
          const url = (pokemon as any).species?.url as string | undefined
          if (url) {
            const last = url.split('/').filter(Boolean).pop()
            const maybeId = last ? parseInt(last) : NaN
            if (!Number.isNaN(maybeId)) return maybeId
          }
          return (pokemon as any).species?.name ?? pokemon.id
        })()
        const species = await getPokemonSpecies(speciesIdentifier)
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
      const mult = calculateTypeEffectiveness([attacking], defending)
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

  // Fetch ability descriptions
  useEffect(() => {
    let isMounted = true
    const loadAbilities = async () => {
      try {
        if (!pokemon) return
        const abilities = await Promise.allSettled(
          pokemon.abilities.map(async (abilityRef) => {
            try {
              const ability = await getAbility(abilityRef.ability.name)
              const englishEffect = ability.effect_entries.find((entry: any) => entry.language.name === 'en')
              return {
                name: ability.name,
                is_hidden: abilityRef.is_hidden,
                description: englishEffect?.short_effect || englishEffect?.effect || null
              }
            } catch (error) {
              console.warn(`Failed to fetch ability ${abilityRef.ability.name}:`, error)
              return {
                name: abilityRef.ability.name,
                is_hidden: abilityRef.is_hidden,
                description: null
              }
            }
          })
        )
        
        if (isMounted) {
          const successfulAbilities = abilities
            .filter((result): result is PromiseFulfilledResult<{ name: string; is_hidden: boolean; description: string | null }> => 
              result.status === 'fulfilled'
            )
            .map(result => result.value)
          setAbilitiesWithDescriptions(successfulAbilities)
        }
      } catch (e) {
        console.warn('Failed to load abilities', e)
      }
    }
    loadAbilities()
    return () => { isMounted = false }
  }, [pokemon])

  // Fetch move effects
  useEffect(() => {
    let isMounted = true
    const loadMoves = async () => {
      try {
        if (!pokemon) return
        // Limit to first 20 moves to avoid too many API calls
        const movesToLoad = pokemon.moves.slice(0, 20)
        const moves = await Promise.allSettled(
          movesToLoad.map(async (moveRef) => {
            try {
              const move = await getMove(moveRef.move.name)
              const englishEffect = move.effect_entries.find((entry: any) => entry.language.name === 'en')
              return {
                name: move.name,
                type: move.type.name,
                damage_class: move.damage_class.name as 'physical' | 'special' | 'status',
                power: move.power,
                accuracy: move.accuracy,
                pp: move.pp,
                level_learned_at: moveRef.version_group_details[0]?.level_learned_at || null,
                short_effect: englishEffect?.short_effect || englishEffect?.effect || null
              }
            } catch (error) {
              console.warn(`Failed to fetch move ${moveRef.move.name}:`, error)
              return {
                name: moveRef.move.name,
                type: 'normal',
                damage_class: 'physical' as const,
                power: null,
                accuracy: null,
                pp: null,
                level_learned_at: moveRef.version_group_details[0]?.level_learned_at || null,
                short_effect: null
              }
            }
          })
        )
        
        if (isMounted) {
          const successfulMoves = moves
            .filter(result => result.status === 'fulfilled')
            .map(result => (result as PromiseFulfilledResult<any>).value)
          setMovesWithEffects(successfulMoves)
        }
      } catch (e) {
        console.warn('Failed to load moves', e)
      }
    }
    loadMoves()
    return () => { isMounted = false }
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
      <AppHeader 
        backLink="/" 
        backLabel="Pokédex" 
        title="PokéDex"
        subtitle={`${formatPokemonName(pokemon.name)} #${String(pokemon.id).padStart(4, '0')}`}
      />

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8 py-8">
        {/* Pokemon Hero with View Transition */}
        <PokemonHero 
          pokemon={pokemon} 
          abilities={abilitiesWithDescriptions.length > 0 ? abilitiesWithDescriptions : pokemon.abilities.map(a => ({ name: a.ability.name, is_hidden: a.is_hidden }))}
          flavorText={getFlavorText(speciesData)}
          genus={getGenus(speciesData)}
          hasGenderDifferences={!!speciesData?.has_gender_differences}
        />

        {/* Tabs */}
        <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content */}
        <div className="bg-surface rounded-2xl border border-border">
          {activeTab === 'stats' && (
            <StatsSection
              name={pokemon.name}
              stats={pokemon.stats.map(stat => ({ name: stat.stat.name, value: stat.base_stat }))}
            />
          )}
          {activeTab === 'moves' && (
            <MovesSection
              moves={movesWithEffects.length > 0 ? movesWithEffects : pokemon.moves.map(pokemonMove => ({
                name: pokemonMove.move.name,
                type: 'normal', // Default type, would need to fetch actual move data
                damage_class: 'physical' as const,
                power: null,
                accuracy: null,
                pp: null,
                level_learned_at: pokemonMove.version_group_details[0]?.level_learned_at || null,
                short_effect: null
              }))}
              pokemonTypes={pokemon.types.map(t => t.type.name)}
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
