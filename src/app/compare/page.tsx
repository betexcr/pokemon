'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Scale, TrendingUp, Shield, X, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { getPokemon } from '@/lib/api'
import { formatPokemonName, formatPokemonNumber, cn, formatHeight, formatWeight } from '@/lib/utils'
import { Pokemon } from '@/types/pokemon'
import TypeBadge from '@/components/TypeBadge'
import Button from '@/components/ui/Button'
import MultiPokemonRadarChart from '@/components/MultiPokemonRadarChart'
import StatsSlider from '@/components/pokemon/StatsSlider'

export default function ComparePage() {
  const [pokemons, setPokemons] = useState<Pokemon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSelectedPokemon()
  }, [])

  const loadSelectedPokemon = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get comparison list from localStorage
      const savedComparison = localStorage.getItem('pokemon-comparison')
      if (!savedComparison) {
        setError('No Pokémon selected for comparison')
        setLoading(false)
        return
      }

      const comparisonIds: number[] = JSON.parse(savedComparison)
      if (comparisonIds.length === 0) {
        setError('No Pokémon selected for comparison')
        setLoading(false)
        return
      }

      // Load all selected Pokémon
      const pokemonPromises = comparisonIds.map(id => getPokemon(id))
      const loadedPokemons = await Promise.all(pokemonPromises)
      setPokemons(loadedPokemons)
    } catch (err) {
      console.error('Failed to load Pokémon:', err)
      setError('Failed to load selected Pokémon')
    } finally {
      setLoading(false)
    }
  }

  const removePokemon = (pokemonId: number) => {
    const newPokemons = pokemons.filter(p => p.id !== pokemonId)
    setPokemons(newPokemons)
    
    // Update localStorage
    const newComparisonIds = newPokemons.map(p => p.id)
    if (newComparisonIds.length === 0) {
      localStorage.removeItem('pokemon-comparison')
    } else {
      localStorage.setItem('pokemon-comparison', JSON.stringify(newComparisonIds))
    }
  }

  const clearAll = () => {
    setPokemons([])
    localStorage.removeItem('pokemon-comparison')
  }

  const getPrimaryType = (pokemon: Pokemon) => {
    return pokemon.types[0]?.type.name || 'normal'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-poke-blue mx-auto mb-4"></div>
          <p className="text-muted">Loading comparison...</p>
        </div>
      </div>
    )
  }

  if (error || pokemons.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <header className="bg-white/80 backdrop-blur border-b border-border/60 sticky top-0 z-50 shadow-sm">
          <div className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link 
                href="/"
                className="flex items-center space-x-2 text-muted hover:text-text transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Back to PokéDex</span>
              </Link>
              
              <div className="flex items-center space-x-3">
                <Scale className="h-6 w-6 text-poke-blue" />
                <h1 className="text-xl font-bold text-text tracking-tight">Pokémon Comparison</h1>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8 py-12">
          <div className="text-center">
            <Scale className="h-16 w-16 text-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-text mb-2">No Pokémon Selected</h3>
            <p className="text-muted mb-6">
              {error || 'Select Pokémon from the main page to compare their stats'}
            </p>
            <Link href="/">
              <Button variant="primary">
                Go to PokéDex
              </Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Sticky Header */}
      <header className="bg-white/80 backdrop-blur border-b border-border/60 sticky top-0 z-50 shadow-sm">
        <div className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link 
              href="/"
              className="flex items-center space-x-2 text-muted hover:text-text transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Back to PokéDex</span>
            </Link>
            
            <div className="flex items-center space-x-3">
              <Scale className="h-6 w-6 text-poke-blue" />
              <h1 className="text-xl font-bold text-text tracking-tight">Pokémon Comparison</h1>
              <span className="text-sm text-muted hidden sm:block">
                {pokemons.length} Pokémon selected
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                variant="secondary"
                onClick={clearAll}
                className="inline-flex items-center space-x-2"
              >
                <X className="h-4 w-4" />
                <span>Clear All</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8 py-6">
        {/* Pokémon Stats Table */}
        <div className="bg-white rounded-2xl shadow-card border border-border/60 p-6 mb-8">
          <h3 className="text-lg font-semibold text-text mb-4">Pokémon Stats Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-semibold text-text">Pokémon</th>
                  <th className="text-center py-3 px-2 font-semibold text-text">HP</th>
                  <th className="text-center py-3 px-2 font-semibold text-text">ATK</th>
                  <th className="text-center py-3 px-2 font-semibold text-text">DEF</th>
                  <th className="text-center py-3 px-2 font-semibold text-text">SPA</th>
                  <th className="text-center py-3 px-2 font-semibold text-text">SPD</th>
                  <th className="text-center py-3 px-2 font-semibold text-text">SPE</th>
                  <th className="text-center py-3 px-4 font-semibold text-text">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pokemons.map((pokemon) => {
                  const stats = {
                    hp: pokemon.stats.find(s => s.stat.name === 'hp')?.base_stat || 0,
                    attack: pokemon.stats.find(s => s.stat.name === 'attack')?.base_stat || 0,
                    defense: pokemon.stats.find(s => s.stat.name === 'defense')?.base_stat || 0,
                    'special-attack': pokemon.stats.find(s => s.stat.name === 'special-attack')?.base_stat || 0,
                    'special-defense': pokemon.stats.find(s => s.stat.name === 'special-defense')?.base_stat || 0,
                    speed: pokemon.stats.find(s => s.stat.name === 'speed')?.base_stat || 0,
                  };
                  
                  return (
                    <tr key={pokemon.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`}
                            alt={formatPokemonName(pokemon.name)}
                            className="w-8 h-8 object-contain"
                          />
                          <div>
                            <div className="font-medium text-text capitalize">
                              {formatPokemonName(pokemon.name)}
                            </div>
                            <div className="text-sm text-muted">
                              #{pokemon.id}
                            </div>
                            <div className="flex gap-1 mt-1">
                              {pokemon.types.map((type) => (
                                <TypeBadge key={type.type.name} type={type.type.name} />
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="text-center py-3 px-2">
                        <span className="font-mono text-sm">{stats.hp}</span>
                      </td>
                      <td className="text-center py-3 px-2">
                        <span className="font-mono text-sm">{stats.attack}</span>
                      </td>
                      <td className="text-center py-3 px-2">
                        <span className="font-mono text-sm">{stats.defense}</span>
                      </td>
                      <td className="text-center py-3 px-2">
                        <span className="font-mono text-sm">{stats['special-attack']}</span>
                      </td>
                      <td className="text-center py-3 px-2">
                        <span className="font-mono text-sm">{stats['special-defense']}</span>
                      </td>
                      <td className="text-center py-3 px-2">
                        <span className="font-mono text-sm">{stats.speed}</span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <button
                          onClick={() => removePokemon(pokemon.id)}
                          className="p-2 rounded hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                          aria-label={`Remove ${formatPokemonName(pokemon.name)} from comparison`}
                        >
                          <X className="h-4 w-4 text-red-500" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="bg-white rounded-2xl shadow-card border border-border/60 p-6 mb-8">
          <h2 className="text-2xl font-bold text-text mb-6 text-center tracking-tight">
            Stats Comparison
          </h2>
          <MultiPokemonRadarChart pokemons={pokemons} />
        </div>

        {/* Detailed Stats Table */}
        <div className="bg-white rounded-2xl shadow-card border border-border/60 p-6">
          <h3 className="text-lg font-semibold text-text mb-6 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-poke-blue" />
            Detailed Stats Comparison
          </h3>
          
          <div className="space-y-6">
            {['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'].map((statName) => {
              const stats = pokemons.map(pokemon => {
                const stat = pokemon.stats.find(s => s.stat.name === statName)
                return stat?.base_stat || 0
              })
              const maxStat = Math.max(...stats)
              
              // Get stat label
              const getStatLabel = (statName: string) => {
                switch (statName.toLowerCase()) {
                  case 'hp': return 'HP';
                  case 'attack': return 'ATK';
                  case 'defense': return 'DEF';
                  case 'special-attack': return 'SPA';
                  case 'special-defense': return 'SPD';
                  case 'speed': return 'SPE';
                  default: return statName.toUpperCase();
                }
              };
              
              return (
                <div key={statName} className="space-y-3">
                  <h4 className="text-sm font-medium text-muted capitalize">
                    {statName.replace('-', ' ')}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pokemons.map((pokemon, index) => {
                      const stat = pokemon.stats.find(s => s.stat.name === statName)
                      const value = stat?.base_stat || 0
                      const color = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-cyan-500', 'bg-lime-500', 'bg-orange-500', 'bg-indigo-500'][index % 10]
                      
                      return (
                        <div key={pokemon.id} className="flex items-center gap-3">
                          <div className="w-16">
                            <span className="text-sm font-medium capitalize">
                              {formatPokemonName(pokemon.name)}
                            </span>
                          </div>
                          <div className="flex-1">
                            <StatsSlider
                              label=""
                              value={value}
                              max={255}
                              colorClass={color}
                              className="mb-0"
                            />
                          </div>
                          <div className="w-12 text-right">
                            <span className={cn(
                              "text-sm font-semibold tabular-nums",
                              value === maxStat ? "text-green-600" : "text-text"
                            )}>
                              {value}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
