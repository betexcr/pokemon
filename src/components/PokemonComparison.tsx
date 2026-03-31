'use client'

import { useState, useEffect, useMemo } from 'react'
import { Pokemon } from '@/types/pokemon'
import { getShowdownAnimatedSprite } from '@/lib/utils'
import RadarChart from './RadarChart'
import { X, Plus, BarChart3, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { useTheme } from './ThemeProvider'

interface PokemonComparisonProps {
  pokemonList: Pokemon[]
  className?: string
}

export default function PokemonComparison({ pokemonList, className = '' }: PokemonComparisonProps) {
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon[]>([])
  const [showSelector, setShowSelector] = useState<boolean>(false)
  const [search, setSearch] = useState<string>('')
  const [comparisonData, setComparisonData] = useState<Array<{
    name: string;
    stats: {
      hp: number;
      attack: number;
      defense: number;
      'special-attack': number;
      'special-defense': number;
      speed: number;
    };
    color: string;
  }>>([])
  const [isOpen, setIsOpen] = useState(false)
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' })

  let theme = 'light'
  try {
    const themeContext = useTheme()
    theme = themeContext.theme
  } catch {
    // Theme provider not available, use default
  }

  const isRetro = theme === 'gold' || theme === 'red' || theme === 'ruby'
  const maxPokemon = 6

  const addPokemon = (pokemon: Pokemon) => {
    if (selectedPokemon.length < maxPokemon && !selectedPokemon.find(p => p.id === pokemon.id)) {
      setSelectedPokemon(prev => [...prev, pokemon])
    }
  }

  const removePokemon = (pokemonId: number) => {
    setSelectedPokemon(prev => prev.filter(p => p.id !== pokemonId))
  }

  const clearAll = () => {
    setSelectedPokemon([])
  }

  // Sorting logic
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  // Get sorted comparison data
  const sortedComparisonData = useMemo(() => {
    if (!sortConfig.key) return comparisonData

    return [...comparisonData].sort((a, b) => {
      let aValue: number
      let bValue: number

      if (sortConfig.key === 'name') {
        aValue = a.name.localeCompare(b.name)
        bValue = 0
        return sortConfig.direction === 'asc' ? aValue : -aValue
      } else if (sortConfig.key === 'total') {
        aValue = Object.values(a.stats).reduce((sum, stat) => sum + stat, 0)
        bValue = Object.values(b.stats).reduce((sum, stat) => sum + stat, 0)
      } else {
        aValue = a.stats[sortConfig.key as keyof typeof a.stats] || 0
        bValue = b.stats[sortConfig.key as keyof typeof b.stats] || 0
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1
      }
      return 0
    })
  }, [comparisonData, sortConfig])

  // Get sort icon for a column
  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) {
      return <ChevronsUpDown size={16} className="opacity-50" />
    }
    return sortConfig.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
  }

  // Generate colors for each Pokémon
  const getPokemonColor = (index: number) => {
    const colors = [
      '#FF0000', // Red
      '#00FF00', // Green
      '#0000FF', // Blue
      '#FFFF00', // Yellow
      '#FF00FF', // Magenta
      '#00FFFF', // Cyan
    ]
    return colors[index % colors.length]
  }

  // Convert Pokémon data to radar chart format
  useEffect(() => {
    const data = selectedPokemon.map((pokemon, index) => ({
      name: pokemon.name,
      stats: {
        hp: pokemon.stats.find(s => s.stat.name === 'hp')?.base_stat || 0,
        attack: pokemon.stats.find(s => s.stat.name === 'attack')?.base_stat || 0,
        defense: pokemon.stats.find(s => s.stat.name === 'defense')?.base_stat || 0,
        'special-attack': pokemon.stats.find(s => s.stat.name === 'special-attack')?.base_stat || 0,
        'special-defense': pokemon.stats.find(s => s.stat.name === 'special-defense')?.base_stat || 0,
        speed: pokemon.stats.find(s => s.stat.name === 'speed')?.base_stat || 0,
      },
      color: getPokemonColor(index)
    }))
    setComparisonData(data)
  }, [selectedPokemon])

  return (
    <div className={className}>
      {/* Comparison Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
          isRetro 
            ? theme === 'red' 
              ? 'bg-red-600 text-white hover:bg-red-700' 
              : theme === 'gold'
              ? 'bg-yellow-600 text-black hover:bg-yellow-700'
              : 'bg-pink-600 text-white hover:bg-pink-700'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        <BarChart3 size={16} />
        <span className="hidden sm:inline">Compare Pokémon</span>
        <span className="sm:hidden">Compare</span>
        {selectedPokemon.length > 0 && (
          <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
            isRetro 
              ? 'bg-white text-black' 
              : 'bg-blue-800 text-white'
          }`}>
            {selectedPokemon.length}/{maxPokemon}
          </span>
        )}
      </button>

      {/* Comparison Panel */}
      {isOpen && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
          isRetro ? 'bg-black/80' : 'bg-black/50'
        }`}>
          <div className={`w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-lg p-6 ${
            isRetro 
              ? theme === 'red'
                ? 'bg-red-50 border-4 border-red-600'
                : theme === 'gold'
                ? 'bg-yellow-50 border-4 border-yellow-600'
                : 'bg-pink-50 border-4 border-pink-600'
              : 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700'
          }`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-2xl font-bold ${
                isRetro 
                  ? theme === 'red' ? 'text-red-800' : theme === 'gold' ? 'text-yellow-800' : 'text-pink-800'
                  : 'text-gray-900 dark:text-gray-100'
              }`}>
                Pokémon Comparison
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close comparison"
                className={`p-2 rounded-full ${
                  isRetro 
                    ? theme === 'red' ? 'hover:bg-red-200' : theme === 'gold' ? 'hover:bg-yellow-200' : 'hover:bg-pink-200'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <X size={24} />
              </button>
            </div>

            {/* Selected Pokémon List */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${
                  isRetro 
                    ? theme === 'red' ? 'text-red-700' : theme === 'gold' ? 'text-yellow-700' : 'text-pink-700'
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  Selected Pokémon ({selectedPokemon.length}/{maxPokemon})
                </h3>
                {selectedPokemon.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className={`px-3 py-1 rounded text-sm ${
                      isRetro 
                        ? theme === 'red' ? 'bg-red-200 text-red-800 hover:bg-red-300' 
                        : theme === 'gold' ? 'bg-yellow-200 text-yellow-800 hover:bg-yellow-300'
                        : 'bg-pink-200 text-pink-800 hover:bg-pink-300'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                {selectedPokemon.map((pokemon, index) => (
                  <div
                    key={pokemon.id}
                    className={`relative p-4 rounded-lg border-2 ${
                      isRetro 
                        ? theme === 'red' ? 'border-red-400 bg-red-100' 
                        : theme === 'gold' ? 'border-yellow-400 bg-yellow-100'
                        : 'border-pink-400 bg-pink-100'
                        : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => removePokemon(pokemon.id)}
                      aria-label={`Remove ${pokemon.name}`}
                      className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center ${
                        isRetro 
                          ? theme === 'red' ? 'bg-red-600 text-white' 
                          : theme === 'gold' ? 'bg-yellow-600 text-black'
                          : 'bg-pink-600 text-white'
                          : 'bg-red-500 text-white'
                      }`}
                    >
                      <X size={12} />
                    </button>
                    <img
                      src={getShowdownAnimatedSprite(pokemon.name, 'front', false)}
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement
                        const fallback = pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`
                        if (target.src !== fallback) target.src = fallback
                      }}
                      alt={pokemon.name}
                      className={`w-full h-24 object-contain mb-2 ${
                        isRetro ? 'image-render-pixel' : ''
                      }`}
                    />
                    <p className={`text-center text-sm font-medium capitalize ${
                      isRetro 
                        ? theme === 'red' ? 'text-red-800' : theme === 'gold' ? 'text-yellow-800' : 'text-pink-800'
                        : 'text-gray-800 dark:text-gray-200'
                    }`}>
                      {pokemon.name}
                    </p>
                    <div 
                      className="w-full h-1 rounded-full mt-2"
                      style={{ backgroundColor: getPokemonColor(index) }}
                    />
                  </div>
                ))}

                {/* Add Pokémon Button */}
                {selectedPokemon.length < maxPokemon && (
                  <button
                    type="button"
                    onClick={() => setShowSelector(v => !v)}
                    aria-expanded={showSelector}
                    className={`p-4 rounded-lg border-2 border-dashed flex flex-col items-center justify-center ${
                      isRetro 
                        ? theme === 'red' ? 'border-red-400 text-red-600 hover:bg-red-100' 
                        : theme === 'gold' ? 'border-yellow-400 text-yellow-600 hover:bg-yellow-100'
                        : 'border-pink-400 text-pink-600 hover:bg-pink-100'
                        : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Plus size={24} />
                    <span className="text-sm mt-2">{showSelector ? 'Hide Selector' : 'Add Pokémon'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Selector (minimized by default) */}
            {showSelector && (
              <div className={`mb-6 rounded-lg border ${isRetro ? 'border-gray-300' : 'border-gray-200 dark:border-gray-700'} bg-white dark:bg-slate-900 p-4`}> 
                <div className="flex items-center gap-2 mb-3">
                  <input
                    value={search}
                    onChange={(e)=>setSearch(e.target.value)}
                    placeholder="Search by name or # (e.g., 'Lugia', '249', 'char')"
                    aria-label="Search Pokémon to compare"
                    className="w-full h-10 rounded-md border border-border px-3 text-sm"
                  />
                  <button
                    type="button"
                    onClick={()=> setShowSelector(false)}
                    className="h-10 px-3 rounded-md border border-border text-sm"
                  >
                    Close
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                  {pokemonList
                    .filter(p => {
                      if (!search) return true
                      const q = search.toLowerCase()
                      return p.name.toLowerCase().includes(q) || String(p.id).includes(q)
                    })
                    .map(p => (
                      <button
                        type="button"
                        key={p.id}
                        className="w-full text-left py-2 px-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 flex items-center gap-3"
                        onClick={() => { addPokemon(p); setShowSelector(false); setSearch('') }}
                      >
                        <img
                          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`}
                          alt={p.name}
                          className="w-8 h-8 object-contain"
                          loading="lazy"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate capitalize">{p.name}{p.id !== 0 ? `#${p.id}` : ''}</div>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Radar Chart */}
            {comparisonData.length > 0 && (
              <div className="flex justify-center">
                <RadarChart 
                  data={comparisonData} 
                  size={480}
                  className="mb-6"
                />
              </div>
            )}

            {/* Stats Table */}
            {comparisonData.length > 0 && (
              <div className="overflow-x-auto">
                <table className={`w-full border-collapse ${
                  isRetro 
                    ? theme === 'red' ? 'border-red-600' 
                    : theme === 'gold' ? 'border-yellow-600'
                    : 'border-pink-600'
                    : 'border-gray-300 dark:border-gray-700'
                }`}>
                  <thead>
                    <tr className={`${
                      isRetro 
                        ? theme === 'red' ? 'bg-red-200' 
                        : theme === 'gold' ? 'bg-yellow-200'
                        : 'bg-pink-200'
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      <th 
                        className={`p-3 text-left border cursor-pointer hover:bg-opacity-80 transition-colors ${
                          isRetro 
                            ? theme === 'red' ? 'border-red-600 hover:bg-red-300' 
                            : theme === 'gold' ? 'border-yellow-600 hover:bg-yellow-300'
                            : 'border-pink-600 hover:bg-pink-300'
                            : 'border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                        onClick={() => handleSort('name')}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSort('name'); } }}
                        role="button"
                        tabIndex={0}
                        title="Click to sort by name"
                      >
                        <div className="flex items-center gap-1">
                          Pokémon
                          {getSortIcon('name')}
                        </div>
                      </th>
                      <th 
                        className={`p-3 text-center border cursor-pointer hover:bg-opacity-80 transition-colors ${
                          isRetro 
                            ? theme === 'red' ? 'border-red-600 hover:bg-red-300' 
                            : theme === 'gold' ? 'border-yellow-600 hover:bg-yellow-300'
                            : 'border-pink-600 hover:bg-pink-300'
                            : 'border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                        onClick={() => handleSort('hp')}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSort('hp'); } }}
                        role="button"
                        tabIndex={0}
                        title="Click to sort by HP"
                      >
                        <div className="flex items-center justify-center gap-1">
                          HP
                          {getSortIcon('hp')}
                        </div>
                      </th>
                      <th 
                        className={`p-3 text-center border cursor-pointer hover:bg-opacity-80 transition-colors ${
                          isRetro 
                            ? theme === 'red' ? 'border-red-600 hover:bg-red-300' 
                            : theme === 'gold' ? 'border-yellow-600 hover:bg-yellow-300'
                            : 'border-pink-600 hover:bg-pink-300'
                            : 'border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                        onClick={() => handleSort('attack')}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSort('attack'); } }}
                        role="button"
                        tabIndex={0}
                        title="Click to sort by Attack"
                      >
                        <div className="flex items-center justify-center gap-1">
                          ATK
                          {getSortIcon('attack')}
                        </div>
                      </th>
                      <th 
                        className={`p-3 text-center border cursor-pointer hover:bg-opacity-80 transition-colors ${
                          isRetro 
                            ? theme === 'red' ? 'border-red-600 hover:bg-red-300' 
                            : theme === 'gold' ? 'border-yellow-600 hover:bg-yellow-300'
                            : 'border-pink-600 hover:bg-pink-300'
                            : 'border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                        onClick={() => handleSort('defense')}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSort('defense'); } }}
                        role="button"
                        tabIndex={0}
                        title="Click to sort by Defense"
                      >
                        <div className="flex items-center justify-center gap-1">
                          DEF
                          {getSortIcon('defense')}
                        </div>
                      </th>
                      <th 
                        className={`p-3 text-center border cursor-pointer hover:bg-opacity-80 transition-colors ${
                          isRetro 
                            ? theme === 'red' ? 'border-red-600 hover:bg-red-300' 
                            : theme === 'gold' ? 'border-yellow-600 hover:bg-yellow-300'
                            : 'border-pink-600 hover:bg-pink-300'
                            : 'border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                        onClick={() => handleSort('special-attack')}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSort('special-attack'); } }}
                        role="button"
                        tabIndex={0}
                        title="Click to sort by Special Attack"
                      >
                        <div className="flex items-center justify-center gap-1">
                          SPA
                          {getSortIcon('special-attack')}
                        </div>
                      </th>
                      <th 
                        className={`p-3 text-center border cursor-pointer hover:bg-opacity-80 transition-colors ${
                          isRetro 
                            ? theme === 'red' ? 'border-red-600 hover:bg-red-300' 
                            : theme === 'gold' ? 'border-yellow-600 hover:bg-yellow-300'
                            : 'border-pink-600 hover:bg-pink-300'
                            : 'border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                        onClick={() => handleSort('special-defense')}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSort('special-defense'); } }}
                        role="button"
                        tabIndex={0}
                        title="Click to sort by Special Defense"
                      >
                        <div className="flex items-center justify-center gap-1">
                          SPD
                          {getSortIcon('special-defense')}
                        </div>
                      </th>
                      <th 
                        className={`p-3 text-center border cursor-pointer hover:bg-opacity-80 transition-colors ${
                          isRetro 
                            ? theme === 'red' ? 'border-red-600 hover:bg-red-300' 
                            : theme === 'gold' ? 'border-yellow-600 hover:bg-yellow-300'
                            : 'border-pink-600 hover:bg-pink-300'
                            : 'border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                        onClick={() => handleSort('speed')}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSort('speed'); } }}
                        role="button"
                        tabIndex={0}
                        title="Click to sort by Speed"
                      >
                        <div className="flex items-center justify-center gap-1">
                          SPE
                          {getSortIcon('speed')}
                        </div>
                      </th>
                      <th 
                        className={`p-3 text-center border cursor-pointer hover:bg-opacity-80 transition-colors ${
                          isRetro 
                            ? theme === 'red' ? 'border-red-600 hover:bg-red-300' 
                            : theme === 'gold' ? 'border-yellow-600 hover:bg-yellow-300'
                            : 'border-pink-600 hover:bg-pink-300'
                            : 'border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                        onClick={() => handleSort('total')}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSort('total'); } }}
                        role="button"
                        tabIndex={0}
                        title="Click to sort by Total Stats"
                      >
                        <div className="flex items-center justify-center gap-1">
                          Total
                          {getSortIcon('total')}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedComparisonData.map((pokemon, index) => {
                      const total = Object.values(pokemon.stats).reduce((sum: number, stat: number) => sum + stat, 0)
                      return (
                        <tr key={pokemon.name} className={index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-gray-50 dark:bg-gray-800/50'}>
                          <td className={`p-3 border ${
                            isRetro 
                              ? theme === 'red' ? 'border-red-600' 
                              : theme === 'gold' ? 'border-yellow-600'
                              : 'border-pink-600'
                              : 'border-gray-300 dark:border-gray-700'
                          }`}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: getPokemonColor(index) }}
                              />
                              <span className="capitalize font-medium">{pokemon.name}</span>
                            </div>
                          </td>
                          {Object.values(pokemon.stats).map((stat: number, statIndex: number) => (
                            <td key={statIndex} className={`p-3 text-center border ${
                              isRetro 
                                ? theme === 'red' ? 'border-red-600' 
                                : theme === 'gold' ? 'border-yellow-600'
                                : 'border-pink-600'
                                : 'border-gray-300 dark:border-gray-700'
                            }`}>
                              {stat}
                            </td>
                          ))}
                          <td className={`p-3 text-center border font-bold ${
                            isRetro 
                              ? theme === 'red' ? 'border-red-600' 
                              : theme === 'gold' ? 'border-yellow-600'
                              : 'border-pink-600'
                              : 'border-gray-300 dark:border-gray-700'
                          }`}>
                            {total}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
