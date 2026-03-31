'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import LinkWithTransition from '@/components/LinkWithTransition'
import { getPokemon } from '@/lib/api'
import { formatPokemonName } from '@/lib/utils'
import { Pokemon } from '@/types/pokemon'
import TypeBadge from '@/components/TypeBadge'
import MultiPokemonRadarChart from '@/components/MultiPokemonRadarChart'
import AppHeader from '@/components/AppHeader'
import PokemonSelector from '@/components/PokemonSelector'
import OfflineBanner from '@/components/OfflineBanner'

// Static export for Next.js 15 compatibility
export const dynamic = 'force-dynamic'

export default function ComparePage() {
  const [pokemons, setPokemons] = useState<Pokemon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'total' | 'hp' | 'attack' | 'defense' | 'special-attack' | 'special-defense' | 'speed'>('total')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [highlightedPokemonId, setHighlightedPokemonId] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false

    const loadSelectedPokemon = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const savedComparison = localStorage.getItem('pokemon-comparison')
        if (!savedComparison) {
          setPokemons([])
          setLoading(false)
          return
        }

        const parsed = JSON.parse(savedComparison)
        const comparisonIds: number[] = Array.isArray(parsed)
          ? parsed.filter((id: unknown): id is number => typeof id === 'number' && Number.isInteger(id))
          : []
        if (comparisonIds.length === 0) {
          setPokemons([])
          setLoading(false)
          return
        }

        const pokemonPromises = comparisonIds.map(id => getPokemon(id))
        const loadedPokemons = await Promise.all(pokemonPromises)
        if (cancelled) return
        setPokemons(loadedPokemons)
      } catch (err) {
        if (cancelled) return
        console.error('Failed to load Pokémon:', err)
        setError('Failed to load selected Pokémon')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadSelectedPokemon()
    return () => { cancelled = true }
  }, [])

  const removePokemon = (pokemonId: number) => {
    const newPokemons = pokemons.filter(p => p.id !== pokemonId)
    setPokemons(newPokemons)
    
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

  const handlePokemonSelect = async (pokemon: Pokemon) => {
    if (!pokemons.some(p => p.id === pokemon.id)) {
      let fullPokemon = pokemon
      if (!pokemon.stats?.length) {
        try {
          fullPokemon = await getPokemon(pokemon.id)
        } catch (err) {
          console.error('Failed to fetch full Pokemon data:', err)
        }
      }
      const newPokemons = [...pokemons, fullPokemon]
      setPokemons(newPokemons)
      
      const newComparisonIds = newPokemons.map(p => p.id)
      localStorage.setItem('pokemon-comparison', JSON.stringify(newComparisonIds))
    }
  }

  const handlePokemonRemove = (pokemonId: number) => {
    removePokemon(pokemonId)
  }

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <img src="/loading.gif" alt="Loading comparison" width={100} height={100} className="mx-auto mb-4" />
          <p className="text-muted">Loading comparison...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <p className="text-red-500 dark:text-red-400 font-semibold mb-4">{error}</p>
          <button
            type="button"
            onClick={() => loadSelectedPokemon()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen root-full w-screen bg-gradient-to-br from-slate-900 via-slate-950 to-[#0b1120] flex flex-col overflow-hidden">
      <OfflineBanner cachedMessage="You're offline. Only previously viewed Pokemon are available for comparison." />
      {/* Header */}
      <AppHeader
        title="Pokémon Comparison"
        backLink="/"
        backLabel="Back to PokéDex"
        showToolbar={true}
        iconKey="compare"
        showIcon={true}
        rightContent={null}
      />

      <main className="flex-1 min-h-0 overflow-y-auto scroll-stable mx-auto max-w-6xl px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        {/* Pokemon Selector */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-card border border-border/60 p-4 sm:p-6 mb-4 sm:mb-6">
          <h3 className="text-lg font-semibold text-text dark:text-slate-100 mb-4">Add Pokémon to Comparison</h3>
          <PokemonSelector
            selectedPokemon={pokemons}
            onPokemonSelect={handlePokemonSelect}
            onPokemonRemove={handlePokemonRemove}
            maxSelections={6}
            placeholder="Search Pokémon by name or # (e.g., 'Lugia', '249', 'char')"
            className="w-full"
          />
          {pokemons.length === 0 && (
            <p className="mt-3 text-sm text-muted">Start typing above to add Pokémon to compare.</p>
          )}
        </div>

        {/* Pokémon Stats Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-card border border-border/60 p-4 sm:p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text dark:text-slate-100">Pokémon Stats Comparison</h3>
            <button
              type="button"
              onClick={clearAll}
              className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Clear All
            </button>
          </div>
          
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-semibold text-text dark:text-slate-200">Pokémon</th>
                  {(['total', 'hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'] as const).map((stat) => {
                    const labels: Record<string, string> = { total: 'Total', hp: 'HP', attack: 'ATK', defense: 'DEF', 'special-attack': 'SPA', 'special-defense': 'SPD', speed: 'SPE' }
                    return (
                      <th
                        key={stat}
                        className="text-center py-3 px-2 font-semibold text-text dark:text-slate-200 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                        onClick={() => handleSort(stat)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSort(stat); } }}
                        aria-sort={sortBy === stat ? (sortOrder === 'asc' ? 'ascending' : 'descending') : undefined}
                      >
                        <div className="flex items-center justify-center gap-1">
                          {labels[stat]}
                          {sortBy === stat && (
                            <span className="text-xs">
                              {sortOrder === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                    )
                  })}
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
                              className="w-16 h-16 object-contain cursor-pointer hover:scale-110 transition-transform"
                            />
                          </LinkWithTransition>
                          <div>
                            <div className="font-medium text-text capitalize">
                              {formatPokemonName(pokemon.name)}
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
                          type="button"
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

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
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
                <div
                  key={pokemon.id}
                  className={`p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 transition-all ${highlightedPokemonId === pokemon.id ? 'ring-2 ring-blue-400 shadow-lg' : 'shadow-sm'}`}
                  onMouseEnter={() => setHighlightedPokemonId(pokemon.id)}
                  onMouseLeave={() => setHighlightedPokemonId(null)}
                  onTouchStart={() => setHighlightedPokemonId(pokemon.id)}
                >
                  {/* Pokemon Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <LinkWithTransition href={`/pokemon/${pokemon.id}`} transitionType="shared-element">
                        <img
                          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`}
                          alt={formatPokemonName(pokemon.name)}
                          className="w-20 h-20 object-contain cursor-pointer hover:scale-110 transition-transform"
                        />
                      </LinkWithTransition>
                      <div>
                        <div className="font-semibold text-text capitalize text-lg">
                          {formatPokemonName(pokemon.name)}
                        </div>
                        <div className="flex gap-1 mt-1">
                          {pokemon.types.map((type) => (
                            <TypeBadge key={type.type.name} type={type.type.name} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePokemon(pokemon.id)}
                      className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                      aria-label={`Remove ${formatPokemonName(pokemon.name)} from comparison`}
                    >
                      <X className="h-5 w-5 text-red-500" />
                    </button>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="text-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                      <div className="text-xs text-muted mb-1">Total</div>
                      <div className="font-mono font-bold text-lg">{total}</div>
                    </div>
                    {([
                      { key: 'hp' as const, label: 'HP', value: stats.hp },
                      { key: 'attack' as const, label: 'ATK', value: stats.attack },
                      { key: 'defense' as const, label: 'DEF', value: stats.defense },
                      { key: 'special-attack' as const, label: 'SPA', value: stats['special-attack'] },
                      { key: 'special-defense' as const, label: 'SPD', value: stats['special-defense'] },
                      { key: 'speed' as const, label: 'SPE', value: stats.speed },
                    ]).map(({ key, label, value }) => (
                      <div
                        key={key}
                        className={`text-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg cursor-pointer transition-colors ${sortBy === key ? 'bg-blue-100 dark:bg-blue-900/30' : 'hover:bg-gray-100 dark:hover:bg-slate-600'}`}
                        onClick={() => handleSort(key)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSort(key); } }}
                      >
                        <div className="text-xs text-muted mb-1">{label}</div>
                        <div className="font-mono font-semibold">{value}</div>
                        {sortBy === key && (
                          <div className="text-xs mt-1">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </div>
                        )}
                      </div>
                    ))}
                    <div 
                      className={`text-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg cursor-pointer transition-colors ${sortBy === 'total' ? 'bg-blue-100 dark:bg-blue-900/30' : 'hover:bg-gray-100 dark:hover:bg-slate-600'}`}
                      onClick={() => handleSort('total')}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSort('total'); } }}
                    >
                      <div className="text-xs text-muted mb-1">Sort</div>
                      <div className="text-lg">↕️</div>
                      {sortBy === 'total' && (
                        <div className="text-xs mt-1">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Radar Chart */}
        {pokemons.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-card border border-border/60 p-4 sm:p-6 mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-text mb-4 sm:mb-6 text-center tracking-tight">
              Stats Comparison
            </h2>
            <div className="w-full">
              <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl mx-auto aspect-square">
                <MultiPokemonRadarChart pokemons={pokemons} highlightedPokemonId={highlightedPokemonId} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
