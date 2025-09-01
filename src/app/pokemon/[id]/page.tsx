'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Heart, Share2, Zap, Shield, Target, TrendingUp, Users, Star, Weight, Ruler } from 'lucide-react'
import Link from 'next/link'
import { getPokemon, getPokemonSpecies, getEvolutionChain, getType } from '@/lib/api'
import { formatPokemonName, formatPokemonNumber, typeColors, cn, formatHeight, formatWeight } from '@/lib/utils'
import { Pokemon, PokemonSpecies, EvolutionChain, Type } from '@/types/pokemon'
import Button from '@/components/ui/Button'

export default function PokemonDetailPage() {
  const params = useParams()
  const pokemonId = params.id as string
  
  const [pokemon, setPokemon] = useState<Pokemon | null>(null)
  const [species, setSpecies] = useState<PokemonSpecies | null>(null)
  const [evolutionChain, setEvolutionChain] = useState<EvolutionChain | null>(null)
  const [types, setTypes] = useState<Type[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'moves' | 'evolution' | 'matchups'>('overview')
  const [favorites, setFavorites] = useState<number[]>([])
  const [selectedSprite, setSelectedSprite] = useState<'default' | 'shiny'>('default')

  useEffect(() => {
    loadPokemonData()
    const savedFavorites = localStorage.getItem('pokemon-favorites')
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites))
    }
  }, [pokemonId])

  const loadPokemonData = async () => {
    try {
      setLoading(true)
      const [pokemonData, speciesData] = await Promise.all([
        getPokemon(pokemonId),
        getPokemonSpecies(pokemonId)
      ])
      
      setPokemon(pokemonData)
      setSpecies(speciesData)

      // Load evolution chain
      if (speciesData.evolution_chain?.url) {
        const chainId = speciesData.evolution_chain.url.split('/').slice(-2)[0]
        const evolutionData = await getEvolutionChain(parseInt(chainId))
        setEvolutionChain(evolutionData)
      }

      // Load type data for matchups
      const typeData = await Promise.all(
        pokemonData.types.map(type => getType(type.type.name))
      )
      setTypes(typeData)
    } catch (err) {
      setError('Failed to load Pokémon data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const toggleFavorite = (pokemonId: number) => {
    const newFavorites = favorites.includes(pokemonId)
      ? favorites.filter(id => id !== pokemonId)
      : [...favorites, pokemonId]
    
    setFavorites(newFavorites)
    localStorage.setItem('pokemon-favorites', JSON.stringify(newFavorites))
  }

  const sharePokemon = () => {
    if (navigator.share) {
      navigator.share({
        title: `${formatPokemonName(pokemon?.name || '')} - PokéDex`,
        text: `Check out ${formatPokemonName(pokemon?.name || '')} on PokéDex!`,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Pokémon...</p>
        </div>
      </div>
    )
  }

  if (error || !pokemon) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Pokémon not found'}</p>
          <Link href="/">
            <Button variant="primary">
              Back to PokéDex
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const isFavorite = favorites.includes(pokemon.id)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link 
              href="/"
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to PokéDex</span>
            </Link>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={sharePokemon}
                aria-label="Share Pokémon"
              >
                <Share2 className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleFavorite(pokemon.id)}
                className={cn(
                  isFavorite && "scale-110 ring-2 ring-poke-red"
                )}
                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart 
                  className={cn(
                    "h-5 w-5 transition-colors",
                    isFavorite ? "fill-red-500 text-red-500" : "text-gray-400 hover:text-red-500"
                  )} 
                />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Pokémon Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-6 lg:space-y-0 lg:space-x-8">
            {/* Image Gallery */}
            <div className="flex-shrink-0">
              <div className="w-80 h-80 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center mb-4">
                <img
                  src={selectedSprite === 'shiny' 
                    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${pokemon.id}.png`
                    : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`
                  }
                  alt={formatPokemonName(pokemon.name)}
                  className="w-64 h-64 object-contain"
                  onError={(e) => {
                    e.currentTarget.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`
                  }}
                />
              </div>
              
              {/* Sprite Toggle */}
              <div className="flex justify-center space-x-2">
                <Button
                  variant={selectedSprite === 'default' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setSelectedSprite('default')}
                >
                  Normal
                </Button>
                <Button
                  variant={selectedSprite === 'shiny' ? 'cta' : 'secondary'}
                  size="sm"
                  onClick={() => setSelectedSprite('shiny')}
                >
                  Shiny
                </Button>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start space-x-2 mb-2">
                <span className="text-lg text-gray-500 font-mono">
                  {formatPokemonNumber(pokemon.id)}
                </span>
                {species?.is_legendary && (
                  <Star className="h-5 w-5 text-yellow-500" />
                )}
                {species?.is_mythical && (
                  <Star className="h-5 w-5 text-purple-500" />
                )}
              </div>
              
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {formatPokemonName(pokemon.name)}
              </h1>

              {/* Types */}
              <div className="flex justify-center lg:justify-start gap-3 mb-6">
                {pokemon.types.map((type) => (
                  <span
                    key={type.type.name}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium",
                      typeColors[type.type.name].bg,
                      typeColors[type.type.name].text,
                      typeColors[type.type.name].border
                    )}
                  >
                    {formatPokemonName(type.type.name)}
                  </span>
                ))}
              </div>

              {/* Basic Info Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <Ruler className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-500">Height</span>
                  </div>
                  <div className="font-medium">{formatHeight(pokemon.height)}</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <Weight className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-500">Weight</span>
                  </div>
                  <div className="font-medium">{formatWeight(pokemon.weight)}</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <Zap className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-500">Base Exp</span>
                  </div>
                  <div className="font-medium">{pokemon.base_experience}</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-500">Abilities</span>
                  </div>
                  <div className="font-medium">{pokemon.abilities.length}</div>
                </div>
              </div>

              {/* Abilities */}
              {pokemon.abilities.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Abilities</h3>
                  <div className="space-y-2">
                    {pokemon.abilities.map((ability, index) => (
                      <div key={index} className="flex items-center justify-center lg:justify-start space-x-2">
                        <span className="text-sm text-gray-600 capitalize">
                          {ability.ability.name.replace('-', ' ')}
                        </span>
                        {ability.is_hidden && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            Hidden
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Species Info */}
              {species && (
                <div className="text-sm text-gray-600">
                  <p className="mb-2">
                    {species.flavor_text_entries.find(entry => entry.language.name === 'en')?.flavor_text || 'No description available.'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {species.genera.find(genus => genus.language.name === 'en') && (
                      <span className="text-gray-500">
                        {species.genera.find(genus => genus.language.name === 'en')?.genus}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6 overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview', icon: Target },
                { id: 'stats', label: 'Stats', icon: TrendingUp },
                { id: 'moves', label: 'Moves', icon: Zap },
                { id: 'evolution', label: 'Evolution', icon: Users },
                { id: 'matchups', label: 'Matchups', icon: Shield },
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as 'overview' | 'stats' | 'moves' | 'evolution' | 'matchups')}
                    className={cn(
                      "flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap",
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && <OverviewTab pokemon={pokemon} species={species} />}
            {activeTab === 'stats' && <StatsTab pokemon={pokemon} />}
            {activeTab === 'moves' && <MovesTab pokemon={pokemon} />}
            {activeTab === 'evolution' && <EvolutionTab evolutionChain={evolutionChain} />}
            {activeTab === 'matchups' && <MatchupsTab types={types} />}
          </div>
        </div>
      </main>
    </div>
  )
}

// Overview Tab Component
function OverviewTab({ pokemon, species }: { pokemon: Pokemon; species: PokemonSpecies | null }) {
  return (
    <div className="space-y-6">
      {/* Held Items */}
      {pokemon.held_items.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Held Items</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {pokemon.held_items.map((item, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-sm capitalize">
                  {item.item.name.replace('-', ' ')}
                </div>
                <div className="text-xs text-gray-500">
                  Rarity: {item.version_details[0]?.rarity || 'Unknown'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Species Details */}
      {species && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Species Details</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Capture Rate</div>
              <div className="font-medium">{species.capture_rate}</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Base Happiness</div>
              <div className="font-medium">{species.base_happiness}</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Hatch Counter</div>
              <div className="font-medium">{species.hatch_counter}</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Growth Rate</div>
              <div className="font-medium capitalize">
                {species.growth_rate.name.replace('-', ' ')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Stats Tab Component
function StatsTab({ pokemon }: { pokemon: Pokemon }) {
  const statNames: Record<string, string> = {
    hp: 'HP',
    attack: 'Attack',
    defense: 'Defense',
    'special-attack': 'Sp. Atk',
    'special-defense': 'Sp. Def',
    speed: 'Speed'
  }

  const maxStat = Math.max(...pokemon.stats.map(s => s.base_stat))

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Base Stats</h3>
      <div className="space-y-4">
        {pokemon.stats.map((stat) => (
          <div key={stat.stat.name} className="flex items-center space-x-4">
            <div className="w-20 text-sm font-medium text-gray-600">
              {statNames[stat.stat.name]}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-900">{stat.base_stat}</span>
                <span className="text-xs text-gray-500">{stat.effort > 0 ? `+${stat.effort}` : ''}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(stat.base_stat / maxStat) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Moves Tab Component
function MovesTab({ pokemon }: { pokemon: Pokemon }) {
  const movesByMethod = pokemon.moves.reduce((acc, move) => {
    move.version_group_details.forEach(detail => {
      const method = detail.move_learn_method.name
      if (!acc[method]) acc[method] = []
      acc[method].push({
        name: move.move.name,
        level: detail.level_learned_at,
        version: detail.version_group.name
      })
    })
    return acc
  }, {} as Record<string, Array<{ name: string; level: number; version: string }>>)

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Moves</h3>
      <div className="space-y-6">
        {Object.entries(movesByMethod).map(([method, moves]) => (
          <div key={method}>
            <h4 className="text-md font-medium text-gray-700 mb-3 capitalize">
              {method.replace('-', ' ')} ({moves.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {moves.map((move, index) => (
                <div
                  key={`${move.name}-${index}`}
                  className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="font-medium text-sm text-gray-900 capitalize">
                    {move.name.replace('-', ' ')}
                  </div>
                  {method === 'level-up' && move.level > 0 && (
                    <div className="text-xs text-gray-500">Level {move.level}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Evolution Tab Component
function EvolutionTab({ evolutionChain }: { evolutionChain: EvolutionChain | null }) {
  if (!evolutionChain) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No evolution data available</p>
      </div>
    )
  }

  interface EvolutionChainLink {
    species: { name: string };
    evolves_to: EvolutionChainLink[];
  }

  const renderEvolutionChain = (chain: EvolutionChainLink, level = 0): React.JSX.Element => {
    return (
      <div key={chain.species.name} className="flex items-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
            <span className="text-xs text-gray-600 capitalize">
              {chain.species.name.replace('-', ' ')}
            </span>
          </div>
          <div className="text-xs text-gray-500 capitalize">
            {chain.species.name.replace('-', ' ')}
          </div>
        </div>
        
        {chain.evolves_to.length > 0 && (
          <div className="flex items-center space-x-4">
            <div className="text-gray-400">→</div>
            {chain.evolves_to.map((evolution: EvolutionChainLink) => renderEvolutionChain(evolution, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Evolution Chain</h3>
      <div className="flex items-center justify-center">
        {renderEvolutionChain(evolutionChain.chain)}
      </div>
    </div>
  )
}

// Matchups Tab Component
function MatchupsTab({ types }: { types: Type[] }) {
  const allTypes = [
    'normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison',
    'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
  ]

  const calculateEffectiveness = (attackingType: string, defendingTypes: string[]): number => {
    const effectivenessChart: Record<string, Record<string, number>> = {
      fire: { grass: 2, water: 0.5, fire: 0.5 },
      water: { fire: 2, grass: 0.5, water: 0.5 },
      grass: { water: 2, fire: 0.5, grass: 0.5 },
      electric: { water: 2, grass: 0.5, electric: 0.5 },
      ice: { grass: 2, fire: 0.5, ice: 0.5 },
      fighting: { normal: 2, ice: 2, flying: 0.5, psychic: 0.5 },
      poison: { grass: 2, poison: 0.5, ground: 0.5 },
      ground: { fire: 2, electric: 2, grass: 0.5, flying: 0 },
      flying: { grass: 2, fighting: 2, electric: 0.5, rock: 0.5 },
      psychic: { fighting: 2, poison: 2, psychic: 0.5 },
      bug: { grass: 2, psychic: 2, fire: 0.5, flying: 0.5 },
      rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5 },
      ghost: { psychic: 2, ghost: 2, normal: 0 },
      dragon: { dragon: 2 },
      dark: { psychic: 2, ghost: 2, fighting: 0.5 },
      steel: { ice: 2, rock: 2, steel: 0.5, fire: 0.5 },
      fairy: { fighting: 2, dragon: 2, poison: 0.5, steel: 0.5 },
    }

    let totalEffectiveness = 1
    
    for (const defendingType of defendingTypes) {
      const effectiveness = effectivenessChart[attackingType]?.[defendingType] || 1
      totalEffectiveness *= effectiveness
    }

    return totalEffectiveness
  }

  const defendingTypes = types.map(t => t.name)

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Type Matchups</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {allTypes.map(type => {
          const effectiveness = calculateEffectiveness(type, defendingTypes)
          let color = 'bg-gray-100 text-gray-700'
          let label = 'Normal'
          
          if (effectiveness > 1) {
            color = 'bg-green-100 text-green-800'
            label = 'Super Effective'
          } else if (effectiveness < 1) {
            color = 'bg-red-100 text-red-800'
            label = 'Not Very Effective'
          } else if (effectiveness === 0) {
            color = 'bg-gray-200 text-gray-500'
            label = 'No Effect'
          }

          return (
            <div key={type} className="text-center">
              <div className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium mb-1 capitalize",
                color
              )}>
                {type.replace('-', ' ')}
              </div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
