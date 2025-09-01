'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { 
  ArrowLeft, 
  Heart, 
  Share2, 
  Zap, 
  Shield, 
  Target, 
  TrendingUp, 
  Users, 
  Star, 
  Weight, 
  Ruler,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import { getPokemon, getPokemonSpecies, getEvolutionChain, getType } from '@/lib/api'
import { formatPokemonName, formatPokemonNumber, typeColors, cn, formatHeight, formatWeight } from '@/lib/utils'
import { Pokemon, PokemonSpecies, EvolutionChain, Type } from '@/types/pokemon'
import Button from '@/components/ui/Button'

// Stat component for quick stats
function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <li className="flex flex-col items-center text-center">
      <Icon className="h-4 w-4 text-muted mb-1" />
      <span className="text-xs text-muted mb-1">{label}</span>
      <span className="text-sm font-medium tabular-nums">{value}</span>
    </li>
  )
}

// Tab component for navigation
function Tab({ href, children, isActive }: { href: string; children: React.ReactNode; isActive: boolean }) {
  return (
    <a
      href={href}
      className={cn(
        "rounded-full px-3 py-1.5 text-sm font-semibold transition-colors",
        "hover:bg-white/50 focus:outline-none focus:ring-2 focus:ring-poke-blue focus:ring-offset-2",
        isActive 
          ? "bg-poke-blue/10 text-poke-blue" 
          : "text-text hover:text-text"
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      {children}
    </a>
  )
}

// Type Badge component
function TypeBadge({ type }: { type: string }) {
  return (
    <span
      className={cn(
        "px-3 py-1 rounded-full text-sm font-medium border transition-colors",
        typeColors[type].bg,
        typeColors[type].text,
        typeColors[type].border
      )}
      style={{
        backgroundColor: `var(--type-${type})`,
        color: 'white',
        textShadow: '0 1px 2px rgba(0,0,0,0.3)'
      }}
    >
      {formatPokemonName(type)}
    </span>
  )
}

export default function PokemonDetailPage() {
  const params = useParams()
  const router = useRouter()
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
    
    // Load saved sprite preference
    const savedSprite = localStorage.getItem('pokemon-sprite-preference')
    if (savedSprite === 'shiny' || savedSprite === 'default') {
      setSelectedSprite(savedSprite)
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

  const handleSpriteToggle = (sprite: 'default' | 'shiny') => {
    setSelectedSprite(sprite)
    localStorage.setItem('pokemon-sprite-preference', sprite)
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

  const navigateToPokemon = (id: number) => {
    router.push(`/pokemon/${id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-poke-blue mx-auto mb-4"></div>
          <p className="text-muted">Loading Pokémon...</p>
        </div>
      </div>
    )
  }

  if (error || !pokemon) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
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
  const primaryType = pokemon.types[0]?.type.name || 'normal'
  const imageUrl = selectedSprite === 'shiny' 
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${pokemon.id}.png`
    : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="bg-surface/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link 
              href="/"
              className="flex items-center space-x-2 text-muted hover:text-text transition-colors"
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
                    isFavorite ? "fill-red-500 text-red-500" : "text-muted hover:text-red-500"
                  )} 
                />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Section */}
        <section
          className="relative rounded-2xl border border-border bg-surface overflow-hidden"
          style={{ 
            background: `linear-gradient(180deg, color-mix(in oklab, var(--type-${primaryType}) 14%, transparent) 0%, transparent 60%)`
          }}
        >
          {/* Type accent bar */}
          <div 
            className="h-1.5 w-full" 
            style={{ backgroundColor: `var(--type-${primaryType})` }} 
          />
          
          <div className="grid md:grid-cols-[1fr_520px_1fr] items-center p-8">
            <div className="hidden md:block" />
            <div className="aspect-square flex items-center justify-center">
              <Image
                src={imageUrl}
                alt={formatPokemonName(pokemon.name)}
                width={520}
                height={520}
                className="object-contain"
                sizes="(max-width: 768px) 80vw, 520px"
                priority
                onError={(e) => {
                  e.currentTarget.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`
                }}
              />
            </div>
            <div className="hidden md:block" />
          </div>
        </section>

        {/* Name and Type Section */}
        <div className="text-center">
          {/* Type chips above name */}
          <div className="mb-3 flex flex-wrap justify-center gap-2">
            {pokemon.types.map((type) => (
              <TypeBadge key={type.type.name} type={type.type.name} />
            ))}
          </div>

          {/* Name and Dex number */}
          <h1 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight text-text">
            {formatPokemonName(pokemon.name)}
          </h1>
          <p className="text-sm text-muted mt-1">
            {formatPokemonNumber(pokemon.id)}
          </p>

          {/* Shiny toggle */}
          <div className="mt-4 flex justify-center">
            <div className="flex bg-surface border border-border rounded-lg p-1">
              <button
                onClick={() => handleSpriteToggle('default')}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                  selectedSprite === 'default'
                    ? "bg-poke-blue text-white"
                    : "text-muted hover:text-text"
                )}
                aria-label="Normal sprite"
              >
                Normal
              </button>
              <button
                onClick={() => handleSpriteToggle('shiny')}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                  selectedSprite === 'shiny'
                    ? "bg-poke-yellow text-white"
                    : "text-muted hover:text-text"
                )}
                aria-label="Shiny sprite"
              >
                Shiny
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <ul className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted">
          <Stat icon={Ruler} label="Height" value={formatHeight(pokemon.height)} />
          <Stat icon={Weight} label="Weight" value={formatWeight(pokemon.weight)} />
          <Stat icon={Zap} label="Base Exp" value={pokemon.base_experience || 'N/A'} />
          <Stat icon={Sparkles} label="Abilities" value={pokemon.abilities.length} />
        </ul>

        {/* Sticky Tabs Navigation */}
        <nav className="sticky top-[64px] z-30 border-b border-border/60 bg-bg/80 backdrop-blur">
          <ul className="flex gap-2 py-2 overflow-x-auto">
            <Tab href="#overview" isActive={activeTab === 'overview'}>Overview</Tab>
            <Tab href="#stats" isActive={activeTab === 'stats'}>Stats</Tab>
            <Tab href="#moves" isActive={activeTab === 'moves'}>Moves</Tab>
            <Tab href="#evolution" isActive={activeTab === 'evolution'}>Evolution</Tab>
            <Tab href="#matchups" isActive={activeTab === 'matchups'}>Matchups</Tab>
          </ul>
        </nav>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === 'overview' && <OverviewTab pokemon={pokemon} species={species} />}
          {activeTab === 'stats' && <StatsTab pokemon={pokemon} />}
          {activeTab === 'moves' && <MovesTab pokemon={pokemon} />}
          {activeTab === 'evolution' && <EvolutionTab evolutionChain={evolutionChain} currentPokemonId={pokemon.id} onNavigate={navigateToPokemon} />}
          {activeTab === 'matchups' && <MatchupsTab types={types} />}
        </div>

        {/* Page Footer / Navigation */}
        <footer className="border-t border-border pt-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigateToPokemon(Math.max(1, pokemon.id - 1))}
                disabled={pokemon.id <= 1}
                aria-label="Previous Pokémon"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigateToPokemon(pokemon.id + 1)}
                aria-label="Next Pokémon"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="secondary"
                onClick={sharePokemon}
                aria-label="Share Pokémon"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <a
                href={`https://pokeapi.co/api/v2/pokemon/${pokemon.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted hover:text-text transition-colors flex items-center"
              >
                Open in PokeAPI
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>
          </div>
          
          <div className="mt-4 text-xs text-muted text-center">
            Data from PokeAPI • Last updated: {new Date().toLocaleDateString()}
          </div>
        </footer>
      </main>
    </div>
  )
}

// Overview Tab Component
function OverviewTab({ pokemon, species }: { pokemon: Pokemon; species: PokemonSpecies | null }) {
  return (
    <div className="space-y-8">
      {/* Abilities */}
      {pokemon.abilities.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-text mb-4">Abilities</h3>
          <div className="flex flex-wrap gap-2">
            {pokemon.abilities.map((ability, index) => (
              <div key={index} className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-surface border border-border rounded-full text-sm capitalize">
                  {ability.ability.name.replace('-', ' ')}
                </span>
                {ability.is_hidden && (
                  <span className="px-2 py-1 bg-muted text-muted text-xs rounded-full">
                    Hidden
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Flavor Text */}
      {species && (
        <section>
          <h3 className="text-lg font-semibold text-text mb-4">Description</h3>
          <p className="text-muted leading-7 max-w-2xl mx-auto">
            {species.flavor_text_entries.find(entry => entry.language.name === 'en')?.flavor_text || 'No description available.'}
          </p>
          
          {/* Species tag line */}
          {species.genera.find(genus => genus.language.name === 'en') && (
            <div className="mt-4 flex justify-center">
              <span className="px-3 py-1 bg-surface border border-border rounded-full text-sm text-muted">
                {species.genera.find(genus => genus.language.name === 'en')?.genus}
              </span>
            </div>
          )}
        </section>
      )}

      {/* Held Items */}
      {pokemon.held_items.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-text mb-4">Held Items</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pokemon.held_items.map((item, index) => (
              <div key={index} className="p-4 bg-surface border border-border rounded-lg">
                <div className="font-medium text-sm capitalize text-text">
                  {item.item.name.replace('-', ' ')}
                </div>
                <div className="text-xs text-muted mt-1">
                  Rarity: {item.version_details[0]?.rarity || 'Unknown'}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Species Details */}
      {species && (
        <section>
          <h3 className="text-lg font-semibold text-text mb-4">Species Details</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-surface border border-border rounded-lg">
              <div className="text-sm text-muted mb-1">Capture Rate</div>
              <div className="font-medium text-text">{species.capture_rate}</div>
            </div>
            <div className="text-center p-4 bg-surface border border-border rounded-lg">
              <div className="text-sm text-muted mb-1">Base Happiness</div>
              <div className="font-medium text-text">{species.base_happiness}</div>
            </div>
            <div className="text-center p-4 bg-surface border border-border rounded-lg">
              <div className="text-sm text-muted mb-1">Hatch Counter</div>
              <div className="font-medium text-text">{species.hatch_counter}</div>
            </div>
            <div className="text-center p-4 bg-surface border border-border rounded-lg">
              <div className="text-sm text-muted mb-1">Growth Rate</div>
              <div className="font-medium text-text capitalize">
                {species.growth_rate.name.replace('-', ' ')}
              </div>
            </div>
          </div>
        </section>
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
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-text">Base Stats</h3>
      
      <div className="space-y-4">
        {pokemon.stats.map((stat) => (
          <div key={stat.stat.name} className="grid grid-cols-[120px_1fr_auto] items-center gap-3">
            <span className="capitalize text-sm text-muted">{statNames[stat.stat.name]}</span>
            <div className="h-2 rounded bg-border/50">
              <div 
                className="h-2 rounded bg-poke-red transition-[width] duration-700"
                style={{ width: `${Math.min(stat.base_stat, 150) / 1.5}%` }} 
              />
            </div>
            <span className="text-sm tabular-nums text-text">{stat.base_stat}</span>
          </div>
        ))}
      </div>

      {/* Total Stats */}
      <div className="mt-6 p-4 bg-surface border border-border rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted">Total</span>
          <span className="text-lg font-bold text-text tabular-nums">
            {pokemon.stats.reduce((sum, stat) => sum + stat.base_stat, 0)}
          </span>
        </div>
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
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-text">Moves</h3>
      
      <div className="space-y-6">
        {Object.entries(movesByMethod).map(([method, moves]) => (
          <section key={method}>
            <h4 className="text-md font-medium text-text mb-4 capitalize">
              {method.replace('-', ' ')} ({moves.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {moves.map((move, index) => (
                <div
                  key={`${move.name}-${index}`}
                  className="p-4 bg-surface border border-border rounded-lg hover:bg-surface/80 transition-colors"
                >
                  <div className="font-medium text-sm text-text capitalize">
                    {move.name.replace('-', ' ')}
                  </div>
                  {method === 'level-up' && move.level > 0 && (
                    <div className="text-xs text-muted mt-1">Level {move.level}</div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

// Evolution Tab Component
function EvolutionTab({ 
  evolutionChain, 
  currentPokemonId, 
  onNavigate 
}: { 
  evolutionChain: EvolutionChain | null; 
  currentPokemonId: number;
  onNavigate: (id: number) => void;
}) {
  if (!evolutionChain) {
    return (
      <div className="text-center py-8">
        <p className="text-muted">No evolution data available</p>
      </div>
    )
  }

  interface EvolutionChainLink {
    species: { name: string };
    evolves_to: EvolutionChainLink[];
  }

  const renderEvolutionChain = (chain: EvolutionChainLink, level = 0): React.JSX.Element => {
    const pokemonId = parseInt(chain.species.name.match(/\d+/)?.[0] || '1')
    const isCurrent = pokemonId === currentPokemonId
    
    return (
      <div key={chain.species.name} className="flex items-center">
        <div 
          className={cn(
            "text-center cursor-pointer transition-all",
            isCurrent && "scale-110 ring-2 ring-poke-blue rounded-lg p-2"
          )}
          onClick={() => onNavigate(pokemonId)}
        >
          <div className="w-16 h-16 bg-surface border border-border rounded-full flex items-center justify-center mb-2">
            <img
              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`}
              alt={chain.species.name}
              className="w-12 h-12 object-contain"
            />
          </div>
          <div className="text-xs text-muted capitalize">
            {chain.species.name.replace('-', ' ')}
          </div>
        </div>
        
        {chain.evolves_to.length > 0 && (
          <div className="flex items-center space-x-4">
            <div className="text-muted">→</div>
            {chain.evolves_to.map((evolution: EvolutionChainLink) => renderEvolutionChain(evolution, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-text">Evolution Chain</h3>
      <div className="flex items-center justify-center overflow-x-auto">
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
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-text">Type Matchups</h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {allTypes.map(type => {
          const effectiveness = calculateEffectiveness(type, defendingTypes)
          let color = 'bg-surface text-text border-border'
          let label = 'Normal'
          
          if (effectiveness > 1) {
            color = 'bg-red-100 text-red-800 border-red-200'
            label = 'Super Effective'
          } else if (effectiveness < 1) {
            color = 'bg-green-100 text-green-800 border-green-200'
            label = 'Not Very Effective'
          } else if (effectiveness === 0) {
            color = 'bg-gray-200 text-gray-500 border-gray-300'
            label = 'No Effect'
          }

          return (
            <div key={type} className="text-center">
              <div className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium mb-1 capitalize border",
                color
              )}>
                {type.replace('-', ' ')}
              </div>
              <div className="text-xs text-muted">{label}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
