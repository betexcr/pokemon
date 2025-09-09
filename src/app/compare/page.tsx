'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Scale, X } from 'lucide-react'
import Link from 'next/link'
import { getPokemon } from '@/lib/api'
import { formatPokemonName } from '@/lib/utils'
import { Pokemon } from '@/types/pokemon'
import TypeBadge from '@/components/TypeBadge'
import Button from '@/components/ui/Button'
import MultiPokemonRadarChart from '@/components/MultiPokemonRadarChart'
import PokeballReleaseAnimation from '@/components/PokeballReleaseAnimation'
import AppHeader from '@/components/AppHeader'


export default function ComparePage() {
  
  
  const [pokemons, setPokemons] = useState<Pokemon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showReleaseAnimation, setShowReleaseAnimation] = useState(false)
  const [releasedPokemon, setReleasedPokemon] = useState<Pokemon[]>([])

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

  const handleReleasePokemon = () => {
    console.log('Release Pokémon clicked, pokemons:', pokemons.length)
    if (pokemons.length > 0) {
      console.log('Starting animation...')
      setShowReleaseAnimation(true)
    } else {
      console.log('No Pokémon to release')
    }
  }

  const handleAnimationComplete = () => {
    setShowReleaseAnimation(false)
    setReleasedPokemon([...pokemons])
  }



  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-poke-blue mx-auto mb-4"></div>
          <p className="text-muted">Loading comparison...</p>
        </div>
      </div>
    )
  }

  if (error || pokemons.length === 0) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col overflow-y-auto scrollbar-hide">
        <AppHeader
          title="Pokémon Comparison"
          backLink="/"
          backLabel="Back to PokéDex"
          showToolbar={false}
        />

        <main className="flex-1 mx-auto max-w-6xl px-4 md:px-6 lg:px-8 py-12">
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
    <div className="h-screen root-full w-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col overflow-hidden">
      {/* Pokéball Release Animation */}
      {showReleaseAnimation && (
        <PokeballReleaseAnimation 
          pokemons={pokemons} 
          onAnimationComplete={handleAnimationComplete}
        />
      )}
      {/* Header */}
      <AppHeader
        title="Pokémon Comparison"
        backLink="/"
        backLabel="Back to PokéDex"
        showToolbar={false}
        rightContent={(
          <div className="flex items-center space-x-3">
            {pokemons.length > 0 && (
              <Button
                variant="primary"
                onClick={handleReleasePokemon}
                className="inline-flex items-center space-x-2"
              >
                <span>Release Pokémon</span>
              </Button>
            )}
            {pokemons.length === 0 && (
              <Button
                variant="primary"
                onClick={() => {
                  const testPokemon = [
                    { id: 1, name: 'bulbasaur' },
                    { id: 4, name: 'charmander' },
                    { id: 7, name: 'squirtle' },
                    { id: 25, name: 'pikachu' },
                    { id: 39, name: 'jigglypuff' },
                    { id: 150, name: 'mewtwo' }
                  ]
                  localStorage.setItem('pokemon-comparison', JSON.stringify(testPokemon.map(p => p.id)))
                  window.location.reload()
                }}
                className="inline-flex items-center space-x-2"
              >
                <span>Load Test Pokémon</span>
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={clearAll}
              className="inline-flex items-center space-x-2"
            >
              <X className="h-4 w-4" />
              <span>Clear All</span>
            </Button>
          </div>
        )}
      />

      <main className="flex-1 min-h-0 overflow-y-auto scroll-stable mx-auto max-w-6xl px-4 md:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Left side - Pokémon Stats Table */}
          <div className="flex-1">
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
                          <Link href={`/pokemon/${pokemon.id}`}>
                            <img
                              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`}
                              alt={formatPokemonName(pokemon.name)}
                              className="w-8 h-8 object-contain cursor-pointer hover:scale-110 transition-transform"
                            />
                          </Link>
                          <div>
                            <div className="font-medium text-text capitalize">
                              {formatPokemonName(pokemon.name)}
                            </div>
                            {/* Removed Pokédex number display */}
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
              <div className="flex justify-center">
                <MultiPokemonRadarChart pokemons={pokemons} />
              </div>
            </div>
          </div>

          {/* Right side - Released Pokémon */}
          {releasedPokemon.length > 0 && (
            <div className="w-80 flex-shrink-0">
              <div className="bg-white rounded-2xl shadow-card border border-border/60 p-6 sticky top-6">
                <h3 className="text-lg font-semibold text-text mb-4">Released Pokémon</h3>
                <div className="grid grid-cols-3 gap-3">
                  {releasedPokemon.map((pokemon) => (
                    <div key={pokemon.id} className="text-center">
                      <Link href={`/pokemon/${pokemon.id}`}>
                        <img
                          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`}
                          alt={formatPokemonName(pokemon.name)}
                          className="w-16 h-16 object-contain mx-auto cursor-pointer hover:scale-110 transition-transform"
                        />
                      </Link>
                      <p className="text-xs text-muted mt-1 capitalize">
                        {formatPokemonName(pokemon.name)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
