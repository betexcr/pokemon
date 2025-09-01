'use client'

import { useState, useEffect } from 'react'
import { Search, ArrowLeft, Scale, TrendingUp, Shield, Zap, X, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { getPokemonList, getPokemon } from '@/lib/api'
import { formatPokemonName, formatPokemonNumber, typeColors, cn, formatHeight, formatWeight } from '@/lib/utils'
import { Pokemon, NamedAPIResourceList } from '@/types/pokemon'
import TypeBadge from '@/components/TypeBadge'
import Button from '@/components/ui/Button'

export default function ComparePage() {
  const [pokemonList, setPokemonList] = useState<NamedAPIResourceList | null>(null)
  const [pokemon1, setPokemon1] = useState<Pokemon | null>(null)
  const [pokemon2, setPokemon2] = useState<Pokemon | null>(null)
  const [loading, setLoading] = useState(false)
  const [search1, setSearch1] = useState('')
  const [search2, setSearch2] = useState('')
  const [filteredList1, setFilteredList1] = useState<NamedAPIResourceList | null>(null)
  const [filteredList2, setFilteredList2] = useState<NamedAPIResourceList | null>(null)

  useEffect(() => {
    loadPokemonList()
  }, [])

  const loadPokemonList = async () => {
    try {
      const list = await getPokemonList(151, 0) // Load first 151 Pokémon
      setPokemonList(list)
      setFilteredList1(list)
      setFilteredList2(list)
    } catch (error) {
      console.error('Failed to load Pokémon list:', error)
    }
  }

  const searchPokemon = (searchTerm: string, setFilteredList: (list: NamedAPIResourceList | null) => void) => {
    if (!pokemonList) return

    if (!searchTerm.trim()) {
      setFilteredList(pokemonList)
      return
    }

    const filtered = pokemonList.results.filter(pokemon =>
      pokemon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pokemon.url.split('/').slice(-2)[0].includes(searchTerm)
    )

    setFilteredList({
      ...pokemonList,
      results: filtered,
      count: filtered.length,
    })
  }

  const selectPokemon = async (pokemonUrl: string, isFirst: boolean) => {
    setLoading(true)
    try {
      const pokemonId = pokemonUrl.split('/').slice(-2)[0]
      const pokemonData = await getPokemon(pokemonId)
      
      if (isFirst) {
        setPokemon1(pokemonData)
        setSearch1('')
        setFilteredList1(pokemonList)
      } else {
        setPokemon2(pokemonData)
        setSearch2('')
        setFilteredList2(pokemonList)
      }
    } catch (error) {
      console.error('Failed to load Pokémon:', error)
    } finally {
      setLoading(false)
    }
  }

  const clearPokemon = (isFirst: boolean) => {
    if (isFirst) {
      setPokemon1(null)
      setSearch1('')
      setFilteredList1(pokemonList)
    } else {
      setPokemon2(null)
      setSearch2('')
      setFilteredList2(pokemonList)
    }
  }

  const swapPokemon = () => {
    const temp = pokemon1
    setPokemon1(pokemon2)
    setPokemon2(temp)
  }

  const getPrimaryType = (pokemon: Pokemon) => {
    return pokemon.types[0]?.type.name || 'normal'
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
              {pokemon1 && pokemon2 && (
                <span className="text-sm text-muted hidden sm:block">
                  {formatPokemonName(pokemon1.name)} vs {formatPokemonName(pokemon2.name)}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <Button
                variant="primary"
                onClick={swapPokemon}
                disabled={!pokemon1 || !pokemon2}
                className="inline-flex items-center space-x-2"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Swap</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8 py-6">
        {/* Selection Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Pokémon 1 Selection */}
          <div className="bg-white rounded-2xl shadow-card border border-border/60 p-6">
            <h2 className="text-lg font-semibold text-text mb-4">Select First Pokémon</h2>
            
            {pokemon1 ? (
              <div className="relative">
                {/* Type-colored accent */}
                <div 
                  className="h-1.5 w-full rounded-t-2xl mb-4" 
                  style={{ backgroundColor: `var(--type-${getPrimaryType(pokemon1)})` }} 
                />
                
                <div className="text-center">
                  <div className="w-32 h-32 bg-white/60 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <img
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon1.id}.png`}
                      alt={formatPokemonName(pokemon1.name)}
                      className="w-24 h-24 object-contain"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-text mb-2 capitalize">
                    {formatPokemonName(pokemon1.name)}
                  </h3>
                  <p className="text-sm text-muted mb-4 font-mono">
                    {formatPokemonNumber(pokemon1.id)}
                  </p>
                  <div className="flex justify-center gap-2 mb-4">
                    {pokemon1.types.map((type) => (
                      <TypeBadge key={type.type.name} type={type.type.name} />
                    ))}
                  </div>
                </div>
                
                {/* Clear button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearPokemon(true)}
                  className="absolute right-3 top-3 rounded-full bg-white/80 shadow"
                  aria-label="Clear Pokémon"
                >
                  <X className="h-4 w-4 text-muted" />
                </Button>
              </div>
            ) : (
              <div>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted" />
                  <input
                    type="text"
                    placeholder="Search Pokémon..."
                    value={search1}
                    onChange={(e) => {
                      setSearch1(e.target.value)
                      searchPokemon(e.target.value, setFilteredList1)
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-xl focus:ring-2 focus:ring-poke-blue focus:border-transparent text-sm"
                  />
                </div>
                
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {filteredList1?.results.map((pokemon) => (
                    <button
                      key={pokemon.name}
                      onClick={() => selectPokemon(pokemon.url, true)}
                      className="w-full p-3 text-left hover:bg-surface rounded-xl transition-colors border border-transparent hover:border-border/60"
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.url.split('/').slice(-2)[0]}.png`}
                          alt={formatPokemonName(pokemon.name)}
                          className="w-8 h-8 object-contain"
                        />
                        <span className="font-medium capitalize text-text">
                          {formatPokemonName(pokemon.name)}
                        </span>
                        <span className="text-sm text-muted font-mono">
                          #{pokemon.url.split('/').slice(-2)[0]}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Pokémon 2 Selection */}
          <div className="bg-white rounded-2xl shadow-card border border-border/60 p-6">
            <h2 className="text-lg font-semibold text-text mb-4">Select Second Pokémon</h2>
            
            {pokemon2 ? (
              <div className="relative">
                {/* Type-colored accent */}
                <div 
                  className="h-1.5 w-full rounded-t-2xl mb-4" 
                  style={{ backgroundColor: `var(--type-${getPrimaryType(pokemon2)})` }} 
                />
                
                <div className="text-center">
                  <div className="w-32 h-32 bg-white/60 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <img
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon2.id}.png`}
                      alt={formatPokemonName(pokemon2.name)}
                      className="w-24 h-24 object-contain"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-text mb-2 capitalize">
                    {formatPokemonName(pokemon2.name)}
                  </h3>
                  <p className="text-sm text-muted mb-4 font-mono">
                    {formatPokemonNumber(pokemon2.id)}
                  </p>
                  <div className="flex justify-center gap-2 mb-4">
                    {pokemon2.types.map((type) => (
                      <TypeBadge key={type.type.name} type={type.type.name} />
                    ))}
                  </div>
                </div>
                
                {/* Clear button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearPokemon(false)}
                  className="absolute right-3 top-3 rounded-full bg-white/80 shadow"
                  aria-label="Clear Pokémon"
                >
                  <X className="h-4 w-4 text-muted" />
                </Button>
              </div>
            ) : (
              <div>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted" />
                  <input
                    type="text"
                    placeholder="Search Pokémon..."
                    value={search2}
                    onChange={(e) => {
                      setSearch2(e.target.value)
                      searchPokemon(e.target.value, setFilteredList2)
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-xl focus:ring-2 focus:ring-poke-blue focus:border-transparent text-sm"
                  />
                </div>
                
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {filteredList2?.results.map((pokemon) => (
                    <button
                      key={pokemon.name}
                      onClick={() => selectPokemon(pokemon.url, false)}
                      className="w-full p-3 text-left hover:bg-surface rounded-xl transition-colors border border-transparent hover:border-border/60"
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.url.split('/').slice(-2)[0]}.png`}
                          alt={formatPokemonName(pokemon.name)}
                          className="w-8 h-8 object-contain"
                        />
                        <span className="font-medium capitalize text-text">
                          {formatPokemonName(pokemon.name)}
                        </span>
                        <span className="text-sm text-muted font-mono">
                          #{pokemon.url.split('/').slice(-2)[0]}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Comparison Results */}
        {pokemon1 && pokemon2 && (
          <div className="bg-white rounded-2xl shadow-card border border-border/60 p-6">
            {/* Sticky comparison header for mobile */}
            <div className="lg:hidden sticky top-20 z-10 bg-white/80 backdrop-blur border-b border-border/60 -mx-6 px-6 py-3 mb-6">
              <h2 className="text-lg font-semibold text-text text-center">
                {formatPokemonName(pokemon1.name)} vs {formatPokemonName(pokemon2.name)}
              </h2>
            </div>
            
            <h2 className="text-2xl font-bold text-text mb-8 text-center tracking-tight hidden lg:block">
              Comparison Results
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Basic Info Comparison */}
              <div>
                <h3 className="text-lg font-semibold text-text mb-4 flex items-center">
                  <Scale className="h-5 w-5 mr-2 text-poke-blue" />
                  Basic Information
                </h3>
                <div className="space-y-4">
                  {[
                    { label: 'Height', p1: formatHeight(pokemon1.height), p2: formatHeight(pokemon2.height) },
                    { label: 'Weight', p1: formatWeight(pokemon1.weight), p2: formatWeight(pokemon2.weight) },
                    { label: 'Base Experience', p1: pokemon1.base_experience, p2: pokemon2.base_experience }
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-center p-3 bg-surface rounded-xl">
                      <span className="font-medium text-text">{item.label}</span>
                      <div className="flex items-center space-x-4">
                        <span className={cn(
                          "font-semibold",
                          item.p1 > item.p2 ? "text-poke-red" : "text-text"
                        )}>
                          {item.p1}
                        </span>
                        <span className="text-muted">vs</span>
                        <span className={cn(
                          "font-semibold",
                          item.p2 > item.p1 ? "text-poke-blue" : "text-text"
                        )}>
                          {item.p2}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Types Comparison */}
              <div>
                <h3 className="text-lg font-semibold text-text mb-4 flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-poke-blue" />
                  Types
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-muted mb-2">{formatPokemonName(pokemon1.name)}</div>
                    <div className="flex gap-2">
                      {pokemon1.types.map((type) => (
                        <TypeBadge key={type.type.name} type={type.type.name} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted mb-2">{formatPokemonName(pokemon2.name)}</div>
                    <div className="flex gap-2">
                      {pokemon2.types.map((type) => (
                        <TypeBadge key={type.type.name} type={type.type.name} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Comparison */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-text mb-6 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-poke-blue" />
                Base Stats Comparison
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="text-muted border-b border-border/60">
                      <th className="text-left py-3 font-medium">Stat</th>
                      <th className="text-center py-3 font-medium">{formatPokemonName(pokemon1.name)}</th>
                      <th className="text-center py-3 font-medium">{formatPokemonName(pokemon2.name)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'].map((statName) => {
                      const stat1 = pokemon1.stats.find(s => s.stat.name === statName)
                      const stat2 = pokemon2.stats.find(s => s.stat.name === statName)
                      const p1Stat = stat1?.base_stat || 0
                      const p2Stat = stat2?.base_stat || 0
                      const maxStat = Math.max(p1Stat, p2Stat)
                      
                      return (
                        <tr key={statName} className="border-b border-border/20">
                          <td className="py-3 capitalize font-medium text-text">
                            {statName.replace('-', ' ')}
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 max-w-24">
                                <div className="h-2 bg-border/40 rounded-full overflow-hidden">
                                  <div 
                                    className="h-2 bg-poke-red rounded-full transition-[width] ease-out duration-700"
                                    style={{ width: `${(p1Stat / 255) * 100}%` }}
                                  />
                                </div>
                              </div>
                              <span className={cn(
                                "font-semibold tabular-nums min-w-[2rem] text-center",
                                p1Stat > p2Stat ? "text-poke-red" : "text-text"
                              )}>
                                {p1Stat}
                              </span>
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 max-w-24">
                                <div className="h-2 bg-border/40 rounded-full overflow-hidden">
                                  <div 
                                    className="h-2 bg-poke-blue rounded-full transition-[width] ease-out duration-700"
                                    style={{ width: `${(p2Stat / 255) * 100}%` }}
                                  />
                                </div>
                              </div>
                              <span className={cn(
                                "font-semibold tabular-nums min-w-[2rem] text-center",
                                p2Stat > p1Stat ? "text-poke-blue" : "text-text"
                              )}>
                                {p2Stat}
                              </span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!pokemon1 || !pokemon2) && (
          <div className="text-center py-12">
            <Scale className="h-16 w-16 text-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-text mb-2">Select Pokémon to Compare</h3>
            <p className="text-muted">Choose two Pokémon from the lists above to see a detailed comparison</p>
          </div>
        )}
      </main>
    </div>
  )
}
