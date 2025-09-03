'use client'

import { useState, useEffect } from 'react'
import { Pokemon } from '@/types/pokemon'
import RadarChart from './RadarChart'
import { X, Plus, BarChart3 } from 'lucide-react'
import { useTheme } from './ThemeProvider'

interface PokemonComparisonProps {
  pokemonList: Pokemon[]
  className?: string
}

export default function PokemonComparison({ pokemonList, className = '' }: PokemonComparisonProps) {
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon[]>([])
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
        onClick={() => setIsOpen(!isOpen)}
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
              : 'bg-white border border-gray-200'
          }`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-2xl font-bold ${
                isRetro 
                  ? theme === 'red' ? 'text-red-800' : theme === 'gold' ? 'text-yellow-800' : 'text-pink-800'
                  : 'text-gray-900'
              }`}>
                Pokémon Comparison
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className={`p-2 rounded-full ${
                  isRetro 
                    ? theme === 'red' ? 'hover:bg-red-200' : theme === 'gold' ? 'hover:bg-yellow-200' : 'hover:bg-pink-200'
                    : 'hover:bg-gray-100'
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
                    : 'text-gray-700'
                }`}>
                  Selected Pokémon ({selectedPokemon.length}/{maxPokemon})
                </h3>
                {selectedPokemon.length > 0 && (
                  <button
                    onClick={clearAll}
                    className={`px-3 py-1 rounded text-sm ${
                      isRetro 
                        ? theme === 'red' ? 'bg-red-200 text-red-800 hover:bg-red-300' 
                        : theme === 'gold' ? 'bg-yellow-200 text-yellow-800 hover:bg-yellow-300'
                        : 'bg-pink-200 text-pink-800 hover:bg-pink-300'
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
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
                        : 'border-gray-300 bg-gray-50'
                    }`}
                  >
                    <button
                      onClick={() => removePokemon(pokemon.id)}
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
                      src={pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default || ''}
                      alt={pokemon.name}
                      className={`w-full h-24 object-contain mb-2 ${
                        isRetro ? 'image-render-pixel' : ''
                      }`}
                    />
                    <p className={`text-center text-sm font-medium capitalize ${
                      isRetro 
                        ? theme === 'red' ? 'text-red-800' : theme === 'gold' ? 'text-yellow-800' : 'text-pink-800'
                        : 'text-gray-800'
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
                    onClick={() => {
                      // Show Pokémon selection modal or dropdown
                      const randomPokemon = pokemonList[Math.floor(Math.random() * pokemonList.length)]
                      addPokemon(randomPokemon)
                    }}
                    className={`p-4 rounded-lg border-2 border-dashed flex flex-col items-center justify-center ${
                      isRetro 
                        ? theme === 'red' ? 'border-red-400 text-red-600 hover:bg-red-100' 
                        : theme === 'gold' ? 'border-yellow-400 text-yellow-600 hover:bg-yellow-100'
                        : 'border-pink-400 text-pink-600 hover:bg-pink-100'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Plus size={24} />
                    <span className="text-sm mt-2">Add Pokémon</span>
                  </button>
                )}
              </div>
            </div>

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
                    : 'border-gray-300'
                }`}>
                  <thead>
                    <tr className={`${
                      isRetro 
                        ? theme === 'red' ? 'bg-red-200' 
                        : theme === 'gold' ? 'bg-yellow-200'
                        : 'bg-pink-200'
                        : 'bg-gray-100'
                    }`}>
                      <th className={`p-3 text-left border ${
                        isRetro 
                          ? theme === 'red' ? 'border-red-600' 
                          : theme === 'gold' ? 'border-yellow-600'
                          : 'border-pink-600'
                          : 'border-gray-300'
                      }`}>Pokémon</th>
                      <th className={`p-3 text-center border ${
                        isRetro 
                          ? theme === 'red' ? 'border-red-600' 
                          : theme === 'gold' ? 'border-yellow-600'
                          : 'border-pink-600'
                          : 'border-gray-300'
                      }`}>HP</th>
                      <th className={`p-3 text-center border ${
                        isRetro 
                          ? theme === 'red' ? 'border-red-600' 
                          : theme === 'gold' ? 'border-yellow-600'
                          : 'border-pink-600'
                          : 'border-gray-300'
                      }`}>ATK</th>
                      <th className={`p-3 text-center border ${
                        isRetro 
                          ? theme === 'red' ? 'border-red-600' 
                          : theme === 'gold' ? 'border-yellow-600'
                          : 'border-pink-600'
                          : 'border-gray-300'
                      }`}>DEF</th>
                      <th className={`p-3 text-center border ${
                        isRetro 
                          ? theme === 'red' ? 'border-red-600' 
                          : theme === 'gold' ? 'border-yellow-600'
                          : 'border-pink-600'
                          : 'border-gray-300'
                      }`}>SPA</th>
                      <th className={`p-3 text-center border ${
                        isRetro 
                          ? theme === 'red' ? 'border-red-600' 
                          : theme === 'gold' ? 'border-yellow-600'
                          : 'border-pink-600'
                          : 'border-gray-300'
                      }`}>SPD</th>
                      <th className={`p-3 text-center border ${
                        isRetro 
                          ? theme === 'red' ? 'border-red-600' 
                          : theme === 'gold' ? 'border-yellow-600'
                          : 'border-pink-600'
                          : 'border-gray-300'
                      }`}>SPE</th>
                      <th className={`p-3 text-center border ${
                        isRetro 
                          ? theme === 'red' ? 'border-red-600' 
                          : theme === 'gold' ? 'border-yellow-600'
                          : 'border-pink-600'
                          : 'border-gray-300'
                      }`}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData.map((pokemon, index) => {
                      const total = Object.values(pokemon.stats).reduce((sum: number, stat: number) => sum + stat, 0)
                      return (
                        <tr key={pokemon.name} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className={`p-3 border ${
                            isRetro 
                              ? theme === 'red' ? 'border-red-600' 
                              : theme === 'gold' ? 'border-yellow-600'
                              : 'border-pink-600'
                              : 'border-gray-300'
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
                                : 'border-gray-300'
                            }`}>
                              {stat}
                            </td>
                          ))}
                          <td className={`p-3 text-center border font-bold ${
                            isRetro 
                              ? theme === 'red' ? 'border-red-600' 
                              : theme === 'gold' ? 'border-yellow-600'
                              : 'border-pink-600'
                              : 'border-gray-300'
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
