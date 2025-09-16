'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Scale, X } from 'lucide-react'
import Link from 'next/link'
import LinkWithTransition from '@/components/LinkWithTransition'
import { getPokemon } from '@/lib/api'
import { formatPokemonName, getShowdownAnimatedSprite } from '@/lib/utils'
import { Pokemon } from '@/types/pokemon'
import TypeBadge from '@/components/TypeBadge'
import Button from '@/components/ui/Button'
import MultiPokemonRadarChart from '@/components/MultiPokemonRadarChart'
import PokeballReleaseAnimation from '@/components/PokeballReleaseAnimation'
import AppHeader from '@/components/AppHeader'
import PokemonSelector from '@/components/PokemonSelector'


export default function ComparePage() {
  
  
  const [pokemons, setPokemons] = useState<Pokemon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showReleaseAnimation, setShowReleaseAnimation] = useState(false)
  const [releasedPokemon, setReleasedPokemon] = useState<Pokemon[]>([])
  const [showReleasedOverlay, setShowReleasedOverlay] = useState<boolean>(false)
  const [sortBy, setSortBy] = useState<'total' | 'hp' | 'attack' | 'defense' | 'special-attack' | 'special-defense' | 'speed'>('total')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [highlightedPokemonId, setHighlightedPokemonId] = useState<number | null>(null)

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
    setReleasedPokemon(prev => prev.filter(p => p.id !== pokemonId))
    
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
    setReleasedPokemon([])
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
    setShowReleasedOverlay(true)
  }

  // Sort Pokemon based on selected stat
  const sortedPokemons = [...pokemons].sort((a, b) => {
    let aValue: number
    let bValue: number

    if (sortBy === 'total') {
      aValue = a.stats.reduce((sum, stat) => sum + stat.base_stat, 0)
      bValue = b.stats.reduce((sum, stat) => sum + stat.base_stat, 0)
    } else {
      aValue = a.stats.find(s => s.stat.name === sortBy)?.base_stat || 0
      bValue = b.stats.find(s => s.stat.name === sortBy)?.base_stat || 0
    }

    return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
  })

  const handleSort = (stat: typeof sortBy) => {
    if (sortBy === stat) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(stat)
      setSortOrder('desc')
    }
  }

  const handlePokemonSelect = (pokemon: Pokemon) => {
    if (!pokemons.some(p => p.id === pokemon.id)) {
      const newPokemons = [...pokemons, pokemon]
      setPokemons(newPokemons)
      
      // Update localStorage
      const newComparisonIds = newPokemons.map(p => p.id)
      localStorage.setItem('pokemon-comparison', JSON.stringify(newComparisonIds))
      // Keep released list in sync with current selection
      setReleasedPokemon(newPokemons)
    }
  }

  const handlePokemonRemove = (pokemonId: number) => {
    removePokemon(pokemonId)
  }



  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <img src="/loading.gif" alt="Loading comparison" width={100} height={100} className="mx-auto mb-4" />
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
          iconKey="compare"
          showIcon={true}
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
    <div className="h-screen root-full w-screen bg-gradient-to-br from-slate-900 via-slate-950 to-[#0b1120] flex flex-col overflow-hidden">
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
        iconKey="compare"
        showIcon={true}
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
        {/* Released overlay - appears over table when active */}
        {releasedPokemon.length > 0 && showReleasedOverlay && (
          <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 bg-black/50">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-border/60 w-full max-w-xl">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
                <h3 className="text-lg font-semibold text-text dark:text-slate-100">Released Pokémon</h3>
                <button
                  onClick={() => setShowReleasedOverlay(false)}
                  className="p-2 rounded hover:bg-gray-100 transition-colors"
                  aria-label="Close released pokemon overlay"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {releasedPokemon.map((pokemon) => (
                    <div key={pokemon.id} className="text-center">
                      <LinkWithTransition href={`/pokemon/${pokemon.id}`} transitionType="shared-element">
                        <img
                          src={getShowdownAnimatedSprite(pokemon.name)}
                          alt={formatPokemonName(pokemon.name)}
                          className="w-14 h-14 sm:w-16 sm:h-16 object-contain mx-auto"
                        />
                      </LinkWithTransition>
                      <p className="text-[11px] sm:text-xs text-muted dark:text-slate-300 mt-1 capitalize truncate">
                        {formatPokemonName(pokemon.name)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setShowReleasedOverlay(false)}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Pokemon Selector */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-card border border-border/60 p-6 mb-6">
          <h3 className="text-lg font-semibold text-text dark:text-slate-100 mb-4">Add Pokémon to Comparison</h3>
          <PokemonSelector
            selectedPokemon={pokemons}
            onPokemonSelect={handlePokemonSelect}
            onPokemonRemove={handlePokemonRemove}
            maxSelections={6}
            placeholder="Search Pokémon by name or # (e.g., 'Lugia', '249', 'char')"
            className="w-full"
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left side - Pokémon Stats Table */}
          <div className="flex-1">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-card border border-border/60 p-6 mb-8">
          <h3 className="text-lg font-semibold text-text dark:text-slate-100 mb-4">Pokémon Stats Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-semibold text-text dark:text-slate-200">Pokémon</th>
                  <th 
                    className="text-center py-3 px-2 font-semibold text-text dark:text-slate-200 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                    onClick={() => handleSort('total')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Total
                      {sortBy === 'total' && (
                        <span className="text-xs">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="text-center py-3 px-2 font-semibold text-text dark:text-slate-200 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                    onClick={() => handleSort('hp')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      HP
                      {sortBy === 'hp' && (
                        <span className="text-xs">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="text-center py-3 px-2 font-semibold text-text dark:text-slate-200 cursor-pointer hover:bg-gray-100 dark:hoverbg-slate-800 transition-colors"
                    onClick={() => handleSort('attack')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      ATK
                      {sortBy === 'attack' && (
                        <span className="text-xs">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="text-center py-3 px-2 font-semibold text-text cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => handleSort('defense')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      DEF
                      {sortBy === 'defense' && (
                        <span className="text-xs">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="text-center py-3 px-2 font-semibold text-text cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => handleSort('special-attack')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      SPA
                      {sortBy === 'special-attack' && (
                        <span className="text-xs">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="text-center py-3 px-2 font-semibold text-text cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => handleSort('special-defense')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      SPD
                      {sortBy === 'special-defense' && (
                        <span className="text-xs">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="text-center py-3 px-2 font-semibold text-text cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => handleSort('speed')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      SPE
                      {sortBy === 'speed' && (
                        <span className="text-xs">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-text">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedPokemons.map((pokemon) => {
                  const stats = {
                    hp: pokemon.stats.find(s => s.stat.name === 'hp')?.base_stat || 0,
                    attack: pokemon.stats.find(s => s.stat.name === 'attack')?.base_stat || 0,
                    defense: pokemon.stats.find(s => s.stat.name === 'defense')?.base_stat || 0,
                    'special-attack': pokemon.stats.find(s => s.stat.name === 'special-attack')?.base_stat || 0,
                    'special-defense': pokemon.stats.find(s => s.stat.name === 'special-defense')?.base_stat || 0,
                    speed: pokemon.stats.find(s => s.stat.name === 'speed')?.base_stat || 0,
                  };
                  const total = Object.values(stats).reduce((sum, v) => sum + v, 0)
                  
                  return (
                    <tr
                      key={pokemon.id}
                      className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${highlightedPokemonId === pokemon.id ? 'bg-blue-50/70 dark:bg-blue-900/20 outline outline-1 outline-blue-300' : ''}`}
                      onMouseEnter={() => setHighlightedPokemonId(pokemon.id)}
                      onMouseLeave={() => setHighlightedPokemonId(null)}
                      onTouchStart={() => setHighlightedPokemonId(pokemon.id)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <LinkWithTransition href={`/pokemon/${pokemon.id}`} transitionType="shared-element">
                            <img
                              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`}
                              alt={formatPokemonName(pokemon.name)}
                              className="w-8 h-8 object-contain cursor-pointer hover:scale-110 transition-transform"
                            />
                          </LinkWithTransition>
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
                        <span className="font-mono text-sm font-semibold">{total}</span>
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
                <MultiPokemonRadarChart pokemons={pokemons} highlightedPokemonId={highlightedPokemonId} />
              </div>
            </div>
          </div>

          {/* Right side - Released Pokémon */}
          {releasedPokemon.length > 0 && (
            <div className="w-full lg:w-80 flex-shrink-0">
              <div className="bg-white rounded-2xl shadow-card border border-border/60 p-4 lg:p-6 lg:sticky lg:top-6">
                <h3 className="text-lg font-semibold text-text mb-4">Released Pokémon</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-2 gap-3">
                  {releasedPokemon.map((pokemon) => (
                    <div key={pokemon.id} className="text-center">
                      <LinkWithTransition href={`/pokemon/${pokemon.id}`} transitionType="shared-element">
                        <img
                          src={getShowdownAnimatedSprite(pokemon.name)}
                          alt={formatPokemonName(pokemon.name)}
                          className={`w-14 h-14 sm:w-16 sm:h-16 object-contain mx-auto cursor-pointer transition-transform ${highlightedPokemonId === pokemon.id ? 'scale-110 drop-shadow-[0_0_6px_rgba(59,130,246,0.8)]' : 'hover:scale-110'}`}
                          onMouseEnter={() => setHighlightedPokemonId(pokemon.id)}
                          onMouseLeave={() => setHighlightedPokemonId(null)}
                          onFocus={() => setHighlightedPokemonId(pokemon.id)}
                          onBlur={() => setHighlightedPokemonId(null)}
                          onTouchStart={() => setHighlightedPokemonId(pokemon.id)}
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement
                            target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`
                          }}
                        />
                      </LinkWithTransition>
                      <p className="text-[11px] sm:text-xs text-muted mt-1 capitalize truncate">
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
