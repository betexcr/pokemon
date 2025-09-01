'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { 
  Heart, 
  Share2, 
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { getPokemon, getPokemonSpecies, getEvolutionChain } from '@/lib/api'
import { formatPokemonName, formatPokemonNumber, cn } from '@/lib/utils'
import { Pokemon, PokemonSpecies, EvolutionChain } from '@/types/pokemon'
import Button from '@/components/ui/Button'
import Tabs from '@/components/pokemon/Tabs'
import OverviewSection from '@/components/pokemon/OverviewSection'
import StatsSection from '@/components/pokemon/StatsSection'
import MovesSection from '@/components/pokemon/MovesSection'
import EvolutionSection from '@/components/pokemon/EvolutionSection'
import MatchupsSection from '@/components/pokemon/MatchupsSection'
import TypeBadge from '@/components/TypeBadge'







export default function PokemonDetailPage() {
  const params = useParams()
  const router = useRouter()
  const pokemonId = params.id as string
  
  const [pokemon, setPokemon] = useState<Pokemon | null>(null)
  const [species, setSpecies] = useState<PokemonSpecies | null>(null)
  const [evolutionChain, setEvolutionChain] = useState<EvolutionChain | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [comparisonList, setComparisonList] = useState<number[]>([])
  const [selectedSprite, setSelectedSprite] = useState<'default' | 'shiny'>('default')
  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'moves' | 'evolution' | 'matchups'>('overview')

  useEffect(() => {
    loadPokemonData()
    const savedComparison = localStorage.getItem('pokemon-comparison')
    if (savedComparison) {
      setComparisonList(JSON.parse(savedComparison))
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
      // Type data is no longer needed since we're using the new components
    } catch (err) {
      setError('Failed to load Pokémon data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const toggleComparison = (pokemonId: number) => {
    const newComparison = comparisonList.includes(pokemonId)
      ? comparisonList.filter(id => id !== pokemonId)
      : [...comparisonList, pokemonId]
    
    setComparisonList(newComparison)
    localStorage.setItem('pokemon-comparison', JSON.stringify(newComparison))
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

  const isInComparison = comparisonList.includes(pokemon.id)
  const primaryType = pokemon.types[0]?.type.name || 'normal'
  const imageUrl = selectedSprite === 'shiny' 
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${pokemon.id}.png`
    : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="bg-surface/80 backdrop-blur-sm sticky top-0 z-50">
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
                variant="outline"
                size="sm"
                onClick={sharePokemon}
                aria-label="Share Pokémon"
              >
                <Share2 className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleComparison(pokemon.id)}
                className={cn(
                  comparisonList.includes(pokemon.id) && "scale-110 ring-2 ring-blue-500"
                )}
                aria-label={comparisonList.includes(pokemon.id) ? "Remove from comparison" : "Add to comparison"}
              >
                <svg 
                  className={cn(
                    "h-5 w-5 transition-colors",
                    comparisonList.includes(pokemon.id) ? "fill-blue-500 text-blue-500" : "text-muted hover:text-blue-500"
                  )}
                  viewBox="0 0 24 24"
                >
                  <path d="M9 3l-1.5 1.5L6 3 4.5 4.5 3 3v18l1.5-1.5L6 21l1.5-1.5L9 21V3zm6 0l-1.5 1.5L12 3l-1.5 1.5L9 3v18l1.5-1.5L12 21l1.5-1.5L15 21V3z"/>
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Hero Section */}
        <section 
          className="relative rounded-xl bg-surface overflow-hidden mx-4"
          style={{ 
            background: `linear-gradient(180deg, color-mix(in oklab, var(--type-${primaryType}) 14%, transparent) 0%, transparent 60%)`
          }}
        >
          {/* Type accent bar */}
          <div 
            className="h-1.5 w-full" 
            style={{ backgroundColor: `var(--type-${primaryType})` }} 
          />
          
          <div className="flex justify-center items-center p-4">
            <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center">
              <Image
                src={imageUrl}
                alt={formatPokemonName(pokemon.name)}
                width={256}
                height={256}
                className="object-contain w-full h-full"
                sizes="(max-width: 768px) 192px, 256px"
                priority
                onError={(e) => {
                  e.currentTarget.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`
                }}
              />
            </div>
          </div>
        </section>

        {/* Name and Type Section */}
        <div className="text-center px-4">
          {/* Type chips above name */}
          <div className="mb-3 flex flex-wrap justify-center gap-3">
            {pokemon.types.map((type) => (
              <TypeBadge key={type.type.name} type={type.type.name} />
            ))}
          </div>

          {/* Name and Dex number */}
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text">
            {formatPokemonName(pokemon.name)}
          </h1>
          <p className="text-sm text-muted mt-1">
            {formatPokemonNumber(pokemon.id)}
          </p>

          {/* Shiny toggle */}
          <div className="mt-3 flex justify-center">
            <div className="flex bg-surface border border-border rounded-lg p-1">
              <button
                onClick={() => handleSpriteToggle('default')}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-md transition-colors",
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
                  "px-4 py-2 text-sm font-medium rounded-md transition-colors",
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



        {/* Tab Navigation */}
        <Tabs activeTab={activeTab} onTabChange={setActiveTab} />
        
        {/* Tab Content */}
        {activeTab === 'overview' && (
          <OverviewSection
            types={pokemon.types.map(t => t.type.name)}
            abilities={pokemon.abilities.map(a => ({ name: a.ability.name, is_hidden: a.is_hidden }))}
            flavorText={species?.flavor_text_entries.find(entry => entry.language.name === 'en')?.flavor_text || 'No description available.'}
            genus={species?.genera.find(genus => genus.language.name === 'en')?.genus}
            heightM={pokemon.height / 10}
            weightKg={pokemon.weight / 10}
            baseExp={pokemon.base_experience || 0}
          />
        )}

        {activeTab === 'stats' && (
          <StatsSection stats={pokemon.stats.map(s => ({ name: s.stat.name, value: s.base_stat }))} />
        )}

        {activeTab === 'moves' && (
          <MovesSection moves={pokemon.moves
            .filter(move => move.version_group_details.some(detail => detail.move_learn_method.name === 'level-up'))
            .map(move => {
              const levelUpDetail = move.version_group_details.find(detail => detail.move_learn_method.name === 'level-up');
              return {
                name: move.move.name,
                type: 'normal', // We'll need to fetch this from the move API
                damage_class: 'physical' as const, // We'll need to fetch this from the move API
                power: null,
                accuracy: null,
                pp: null,
                level_learned_at: levelUpDetail?.level_learned_at || null
              };
            })
            .filter((move, index, self) => 
              index === self.findIndex(m => m.name === move.name)
            ) // Remove duplicates
          } />
        )}

        {activeTab === 'evolution' && (
          <EvolutionSection chain={evolutionChain ? (() => {
            const chain: Array<{id: number; name: string; types: string[]; condition?: string}> = [];
            
            // Add the base evolution
            const baseId = parseInt(evolutionChain.chain.species.url.split('/').slice(-2)[0]);
            chain.push({
              id: baseId,
              name: evolutionChain.chain.species.name,
              types: ['normal'], // We'll need to fetch this
              condition: undefined
            });
            
            // Add first evolution if it exists
            if (evolutionChain.chain.evolves_to.length > 0) {
              const firstEvo = evolutionChain.chain.evolves_to[0];
              const firstEvoId = parseInt(firstEvo.species.url.split('/').slice(-2)[0]);
              chain.push({
                id: firstEvoId,
                name: firstEvo.species.name,
                types: ['normal'], // We'll need to fetch this
                condition: firstEvo.evolution_details[0]?.trigger?.name || undefined
              });
              
              // Add second evolution if it exists
              if (firstEvo.evolves_to.length > 0) {
                const secondEvo = firstEvo.evolves_to[0];
                const secondEvoId = parseInt(secondEvo.species.url.split('/').slice(-2)[0]);
                chain.push({
                  id: secondEvoId,
                  name: secondEvo.species.name,
                  types: ['normal'], // We'll need to fetch this
                  condition: secondEvo.evolution_details[0]?.trigger?.name || undefined
                });
              }
            }
            
            return chain;
          })() : []} />
        )}

        {activeTab === 'matchups' && (
          <MatchupsSection groups={(() => {
            const types = pokemon.types.map(t => t.type.name);
            const weakTo: string[] = [];
            const resistantTo: string[] = [];
            const immuneTo: string[] = [];
            
            // This is a simplified type effectiveness calculation
            // In a real implementation, you'd fetch the type effectiveness data from PokeAPI
            const typeChart: Record<string, Record<string, number>> = {
              normal: { rock: 0.5, ghost: 0, steel: 0.5 },
              fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
              water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
              electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
              grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
              ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
              fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, steel: 2, fairy: 0.5 },
              poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
              ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
              flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
              psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
              bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
              rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
              ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
              dragon: { dragon: 2, steel: 0.5, fairy: 0 },
              dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
              steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
              fairy: { fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 }
            };
            
            const allTypes = ['normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'];
            
            allTypes.forEach(type => {
              let effectiveness = 1;
              types.forEach(pokemonType => {
                if (typeChart[pokemonType] && typeChart[pokemonType][type] !== undefined) {
                  effectiveness *= typeChart[pokemonType][type];
                }
              });
              
              if (effectiveness > 1) {
                weakTo.push(type);
              } else if (effectiveness < 1 && effectiveness > 0) {
                resistantTo.push(type);
              } else if (effectiveness === 0) {
                immuneTo.push(type);
              }
            });
            
            return [
              { title: "Weak to (2×)", types: weakTo, tone: "danger" as const },
              { title: "Resistant to (½×)", types: resistantTo, tone: "ok" as const },
              { title: "Immune to (0×)", types: immuneTo, tone: "immune" as const }
            ];
          })()} />
        )}

        {/* Page Footer / Navigation */}
        <footer className="pt-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => navigateToPokemon(Math.max(1, pokemon.id - 1))}
                disabled={pokemon.id <= 1}
                aria-label="Previous Pokémon"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => navigateToPokemon(pokemon.id + 1)}
                aria-label="Next Pokémon"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
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










