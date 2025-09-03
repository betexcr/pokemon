'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pokemon } from '@/types/pokemon'
import { getPokemonList, getPokemon, getMove } from '@/lib/api'
import { formatPokemonName } from '@/lib/utils'
import Image from 'next/image'
import TypeBadge from '@/components/TypeBadge'

type TeamSlot = { id: number | null; level: number; moves: string[] }
type SavedTeam = { id: string; name: string; slots: TeamSlot[] }

const STORAGE_KEY = 'saved-teams'

export default function TeamBuilderPage() {
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [fetchingPokemon, setFetchingPokemon] = useState<Set<number>>(new Set())
  const [availableMoves, setAvailableMoves] = useState<Record<number, Array<{ name: string; type: string; damage_class: "physical" | "special" | "status"; power: number | null; accuracy: number | null; pp: number | null; level_learned_at: number | null; short_effect?: string | null }>>>({})
  const [openMoveTooltip, setOpenMoveTooltip] = useState<{ slotIndex: number; moveIndex: number } | null>(null)
  const [teamSlots, setTeamSlots] = useState<TeamSlot[]>(
    Array.from({ length: 6 }, () => ({ id: null, level: 50, moves: [] }))
  )
  const [savedTeams, setSavedTeams] = useState<SavedTeam[]>([])
  const [teamName, setTeamName] = useState('')

  // Load data
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        // Get more Pokémon for Team Builder (up to 500 to cover more generations)
        const pokemonList = await getPokemonList(500, 0)
        
        // Create basic Pokémon objects with IDs and names
        const basicPokemon = pokemonList.results.map((pokemonRef, index) => {
          const pokemonId = pokemonRef.url.split('/').slice(-2)[0]
          return {
            id: parseInt(pokemonId),
            name: pokemonRef.name,
            base_experience: 0,
            height: 0,
            weight: 0,
            is_default: true,
            order: parseInt(pokemonId),
            abilities: [],
            forms: [],
            game_indices: [],
            held_items: [],
            location_area_encounters: '',
            moves: [],
            sprites: {
              front_default: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`,
              front_shiny: null,
              front_female: null,
              front_shiny_female: null,
              back_default: null,
              back_shiny: null,
              back_female: null,
              back_shiny_female: null,
              other: {
                dream_world: { front_default: null, front_female: null },
                home: { front_default: null, front_female: null, front_shiny: null, front_shiny_female: null },
                'official-artwork': {
                  front_default: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`,
                  front_shiny: null
                }
              }
            },
            stats: [],
            types: [],
            species: { name: '', url: '' },
            evolution_chain: { name: '', url: '' }
          } as Pokemon
        })
        

        setAllPokemon(basicPokemon)
      } catch (e) {
        console.error('Error loading Pokémon:', e)
        setError('Failed to load Pokémon list')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Load saved teams
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setSavedTeams(JSON.parse(raw))
    } catch {}
  }, [])

  const persistTeams = useCallback((teams: SavedTeam[]) => {
    setSavedTeams(teams)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(teams)) } catch {}
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return []
    
    // Search by ID (exact match if it's a number)
    if (/^\d+$/.test(q)) {
      const id = parseInt(q)
      if (id >= 1 && id <= 500) {
        const exactMatch = allPokemon.find(p => p.id === id)
        if (exactMatch) return [exactMatch]
      }
    }
    
    // Search by name (partial match)
    const results = allPokemon.filter(p => 
      formatPokemonName(p.name).toLowerCase().includes(q) ||
      p.id.toString().includes(q)
    )
    
    return results.slice(0, 50) // Limit results for better performance
  }, [allPokemon, search])

  const setSlot = async (idx: number, patch: Partial<TeamSlot>) => {
    if (patch.id && typeof patch.id === 'number') {
      // Fetch full Pokémon details if we don't have them
      const existingPokemon = allPokemon.find(p => p.id === patch.id)
      if (existingPokemon && existingPokemon.types.length === 0) {
        try {
          setFetchingPokemon(prev => new Set(prev).add(patch.id as number))
          const fullPokemon = await getPokemon(patch.id as number)
          setAllPokemon(prev => prev.map(p => p.id === patch.id ? fullPokemon : p))
        } catch (error) {
          console.error('Failed to fetch Pokémon details:', error)
        } finally {
          setFetchingPokemon(prev => {
            const newSet = new Set(prev)
            if (patch.id) newSet.delete(patch.id)
            return newSet
          })
        }
      }
    }
    
    // Update available moves if level or Pokémon changes
    if (patch.level || patch.id) {
      const updatedSlot = { ...teamSlots[idx], ...patch }
      if (updatedSlot.id && updatedSlot.level) {
        const moves = await getAvailableMoves(updatedSlot.id, updatedSlot.level)
        setAvailableMoves(prev => ({ ...prev, [idx]: moves }))
      }
    }
    
    setTeamSlots(prev => prev.map((s, i) => i === idx ? { ...s, ...patch } : s))
  }

  const clearTeam = () => setTeamSlots(Array.from({ length: 6 }, () => ({ id: null, level: 50, moves: [] })))

  const saveTeam = () => {
    const name = teamName.trim() || `Team ${new Date().toLocaleString()}`
    const id = `${Date.now()}`
    const team: SavedTeam = { id, name, slots: teamSlots }
    persistTeams([team, ...savedTeams])
    setTeamName('')
  }

  const loadTeam = (team: SavedTeam) => {
    setTeamSlots(team.slots)
    setTeamName(team.name)
  }

  const deleteTeam = (id: string) => {
    persistTeams(savedTeams.filter(t => t.id !== id))
  }

  // Get available moves for a Pokémon at a specific level
  const getAvailableMoves = useCallback(async (pokemonId: number, level: number): Promise<Array<{ name: string; type: string; damage_class: "physical" | "special" | "status"; power: number | null; accuracy: number | null; pp: number | null; level_learned_at: number | null; short_effect?: string | null }>> => {
    try {
      const pokemon = allPokemon.find(p => p.id === pokemonId)
      if (!pokemon || pokemon.moves.length === 0) {
        // Fetch full Pokémon data if we don't have moves
        const fullPokemon = await getPokemon(pokemonId)
        const levelUpMoves = fullPokemon.moves
          .filter(move => move.version_group_details.some(detail => detail.move_learn_method.name === 'level-up'))
          .map(move => {
            const levelUpDetail = move.version_group_details.find(detail => detail.move_learn_method.name === 'level-up');
            return {
              moveName: move.move.name,
              level_learned_at: levelUpDetail?.level_learned_at || null
            };
          })
          .filter((move, index, self) => 
            index === self.findIndex(m => m.moveName === move.moveName)
          );

        // Fetch full move details for each move
        const movePromises = levelUpMoves.map(async ({ moveName, level_learned_at }) => {
          try {
            const moveData = await getMove(moveName);
            const englishEffect = (moveData.effect_entries || []).find((e: { language: { name: string }; short_effect?: string; effect?: string }) => e.language?.name === 'en');
            return {
              name: moveData.name,
              type: moveData.type.name,
              damage_class: moveData.damage_class.name as "physical" | "special" | "status",
              power: moveData.power,
              accuracy: moveData.accuracy,
              pp: moveData.pp,
              level_learned_at,
              short_effect: englishEffect?.short_effect || englishEffect?.effect || null
            };
          } catch (error) {
            console.error(`Failed to fetch move ${moveName}:`, error);
            return {
              name: moveName,
              type: 'normal',
              damage_class: 'physical' as const,
              power: null,
              accuracy: null,
              pp: null,
              level_learned_at
            };
          }
        });

        const moveResults = await Promise.all(movePromises);
        return moveResults
          .filter(move => !move.level_learned_at || move.level_learned_at <= level)
          .slice(0, 20); // Limit to first 20 moves for performance
      }

      // If we have basic move data, fetch full details
      const levelUpMoves = pokemon.moves
        .filter(move => move.version_group_details.some(detail => detail.move_learn_method.name === 'level-up'))
        .map(move => {
          const levelUpDetail = move.version_group_details.find(detail => detail.move_learn_method.name === 'level-up');
          return {
            moveName: move.move.name,
            level_learned_at: levelUpDetail?.level_learned_at || null
          };
        })
        .filter((move, index, self) => 
          index === self.findIndex(m => m.moveName === move.moveName)
        );

      // Fetch full move details for each move
      const movePromises = levelUpMoves.map(async ({ moveName, level_learned_at }) => {
        try {
          const moveData = await getMove(moveName);
          const englishEffect = (moveData.effect_entries || []).find((e: { language: { name: string }; short_effect?: string; effect?: string }) => e.language?.name === 'en');
          return {
            name: moveData.name,
            type: moveData.type.name,
            damage_class: moveData.damage_class.name as "physical" | "special" | "status",
            power: moveData.power,
            accuracy: moveData.accuracy,
            pp: moveData.pp,
            level_learned_at,
            short_effect: englishEffect?.short_effect || englishEffect?.effect || null
          };
        } catch (error) {
          console.error(`Failed to fetch move ${moveName}:`, error);
          return {
            name: moveName,
            type: 'normal',
            damage_class: 'physical' as const,
            power: null,
            accuracy: null,
            pp: null,
            level_learned_at
          };
        }
      });

      const moveResults = await Promise.all(movePromises);
      return moveResults
        .filter(move => !move.level_learned_at || move.level_learned_at <= level)
        .slice(0, 20);
    } catch (error) {
      console.error('Error getting available moves:', error)
      return []
    }
  }, [allPokemon])

  // Helper function to capitalize strings
  const capitalize = (s: string) => s[0].toUpperCase() + s.slice(1)

  // Handle move selection
  const toggleMove = (slotIndex: number, moveName: string) => {
    setTeamSlots(prev => prev.map((slot, i) => {
      if (i === slotIndex) {
        const currentMoves = slot.moves
        if (currentMoves.includes(moveName)) {
          // Remove move
          return { ...slot, moves: currentMoves.filter(m => m !== moveName) }
        } else if (currentMoves.length < 4) {
          // Add move (max 4)
          return { ...slot, moves: [...currentMoves, moveName] }
        }
      }
      return slot
    }))
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-bg text-text">Loading Team Builder…</div>
  )
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-bg text-red-600">{error}</div>
  )

  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="sticky top-0 z-40 border-b border-border bg-surface">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Team Builder</h1>
          <div className="flex items-center gap-2">
            <input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Team name"
              className="px-3 py-2 border border-border rounded-lg bg-surface"
            />
            <button onClick={saveTeam} className="px-3 py-2 rounded-lg bg-poke-blue text-white">Save Team</button>
            <button onClick={clearTeam} className="px-3 py-2 rounded-lg border border-border">Clear</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Search & Add - Now at the top */}
        <section className="border border-border rounded-xl bg-surface p-4">
          <h2 className="text-lg font-semibold mb-4">Add Pokémon</h2>
          <div className="relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or # (e.g., 'Lugia', '249', 'char')"
              className="w-full mb-3 px-3 py-2 pr-10 border border-border rounded-lg bg-white"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 transition-colors"
                title="Clear search"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto divide-y divide-border">
            {filtered.length === 0 && search.trim() ? (
              <div className="py-4 text-center text-muted">
                No Pokémon found. Try a different search term.
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-4 text-center text-muted">
                Start typing to search for Pokémon...
              </div>
            ) : (
              filtered.map(p => (
                <button
                  key={p.id}
                  className="w-full text-left py-3 px-3 hover:bg-white/60 flex items-center gap-3"
                  onClick={async () => {
                    const firstEmpty = teamSlots.findIndex(s => s.id == null)
                    if (firstEmpty >= 0) await setSlot(firstEmpty, { id: p.id })
                  }}
                >
                  <div className="relative w-12 h-12 flex-shrink-0">
                    <Image
                      src={p.sprites.other['official-artwork'].front_default || p.sprites.front_default || ''}
                      alt={p.name}
                      width={48}
                      height={48}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">#{p.id} {formatPokemonName(p.name)}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {p.types?.length > 0 ? p.types.map(t => (
                        <TypeBadge key={t.type.name} type={t.type.name} variant="span" />
                      )) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {fetchingPokemon.has(p.id) && (
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    )}
                    <span className="text-xs text-muted">Add</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        {/* Team slots */}
        <section className="border border-border rounded-xl bg-surface p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Your Team</h2>
            <div className="text-sm text-muted">
              {teamSlots.filter(s => s.id != null).length} / 6 Pokémon
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamSlots.map((slot, idx) => {
              const poke = allPokemon.find(p => p.id === slot.id) || null
              return (
                <div key={idx} className="border border-border rounded-lg p-3 bg-white/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Slot {idx + 1}</span>
                    <div className="flex items-center gap-2">
                      {poke && (
                        <button 
                          onClick={() => saveTeam()} 
                          className="text-xs text-blue-600 hover:text-blue-800 hover:scale-110 transition-transform"
                          title="Save team with this Pokémon"
                        >
                          💾
                        </button>
                      )}
                      <button 
                        onClick={() => setSlot(idx, { id: null })} 
                        className="text-xs text-red-600 hover:text-red-800"
                        title="Remove Pokémon from slot"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  
                  {poke ? (
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative w-16 h-16 flex-shrink-0">
                        <Image
                          src={poke.sprites.other['official-artwork'].front_default || poke.sprites.front_default || ''}
                          alt={poke.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">#{poke.id} {formatPokemonName(poke.name)}</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {poke.types?.length > 0 ? poke.types.map(t => (
                            <TypeBadge key={t.type.name} type={t.type.name} variant="span" />
                          )) : null}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm mb-3 h-16 flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-300 rounded">
                      Empty Slot
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 mb-3">
                    <label className="text-xs">Level</label>
                    <input type="number" min={1} max={100} value={slot.level} onChange={(e) => setSlot(idx, { level: Math.max(1, Math.min(100, Number(e.target.value) || 50)) })} className="w-20 px-2 py-1 border border-border rounded" />
                  </div>
                  
                  {/* Moveset Selector */}
                  {poke && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Moves ({slot.moves.length}/4)</label>
                        {slot.moves.length > 0 && (
                          <button 
                            onClick={() => setSlot(idx, { moves: [] })} 
                            className="text-xs text-red-600 hover:text-red-800 px-2 py-1 rounded border border-red-200 hover:bg-red-50"
                            title="Clear all moves"
                          >
                            Clear All
                          </button>
                        )}
                      </div>
                      
                      {/* Selected Moves Table */}
                      {slot.moves.length > 0 && (
                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                          <table className="w-full text-xs">
                            <thead className="bg-gray-50 border-b border-gray-200">
                              <tr className="[&>th]:px-2 [&>th]:py-1 text-left text-gray-600">
                                <th>Move</th><th>Type</th><th>Cat.</th><th>Power</th><th>Acc.</th><th>PP</th>
                              </tr>
                            </thead>
                            <tbody>
                              {slot.moves.map((moveName, moveIdx) => {
                                const moveData = availableMoves[idx]?.find(m => m.name === moveName);
                                return (
                                  <tr key={moveIdx} className="[&>td]:px-2 [&>td]:py-1 border-b border-gray-100">
                                    <td className="font-medium capitalize">
                                      <div className="flex items-center gap-2">
                                        <span>{moveName}</span>
                                        <button 
                                          onClick={() => toggleMove(idx, moveName)}
                                          className="text-red-500 hover:text-red-700 text-xs"
                                          title="Remove move"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    </td>
                                    <td>{moveData ? <TypeBadge type={moveData.type} variant="span" /> : '—'}</td>
                                    <td className="capitalize">{moveData?.damage_class || '—'}</td>
                                    <td>{moveData?.power ?? '—'}</td>
                                    <td>{moveData?.accuracy ?? '—'}</td>
                                    <td>{moveData?.pp ?? '—'}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                      
                      {/* Available Moves Table */}
                      {availableMoves[idx] && availableMoves[idx].length > 0 && (
                        <div className="space-y-2">
                          <div className="text-xs text-gray-600 font-medium">Available moves:</div>
                          <div className="overflow-x-auto rounded-lg border border-gray-200 max-h-48">
                            <table className="w-full text-xs">
                              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                                <tr className="[&>th]:px-2 [&>th]:py-1 text-left text-gray-600">
                                  <th>Move</th><th>Type</th><th>Cat.</th><th>Power</th><th>Acc.</th><th>PP</th><th>Lvl</th><th></th>
                                </tr>
                              </thead>
                              <tbody>
                                {availableMoves[idx]
                                  .filter(move => !slot.moves.includes(move.name))
                                  .slice(0, 15)
                                  .map((move, moveIdx) => (
                                    <tr key={move.name} className="[&>td]:px-2 [&>td]:py-1 border-b border-gray-100 hover:bg-gray-50">
                                      <td className="font-medium capitalize">
                                        <span
                                          className="relative group cursor-help"
                                          onClick={() => setOpenMoveTooltip(openMoveTooltip?.slotIndex === idx && openMoveTooltip?.moveIndex === moveIdx ? null : { slotIndex: idx, moveIndex: moveIdx })}
                                        >
                                          {move.name}
                                          {move.short_effect && (
                                            <span className={`pointer-events-auto absolute left-0 top-full z-20 mt-1 w-80 max-w-[90vw] rounded-md bg-black p-3 text-sm leading-snug text-white shadow-xl ring-1 ring-black/40 ${openMoveTooltip?.slotIndex === idx && openMoveTooltip?.moveIndex === moveIdx ? 'block' : 'hidden sm:group-hover:block'}`}
                                            >
                                              {move.short_effect}
                                            </span>
                                          )}
                                        </span>
                                      </td>
                                      <td><TypeBadge type={move.type} variant="span" /></td>
                                      <td className="capitalize">{move.damage_class}</td>
                                      <td>{move.power ?? '—'}</td>
                                      <td>{move.accuracy ?? '—'}</td>
                                      <td>{move.pp ?? '—'}</td>
                                      <td>{move.level_learned_at ?? '—'}</td>
                                      <td>
                                        <button
                                          onClick={() => toggleMove(idx, move.name)}
                                          disabled={slot.moves.length >= 4}
                                          className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:cursor-not-allowed"
                                          title={slot.moves.length >= 4 ? 'Maximum 4 moves reached' : 'Add move'}
                                        >
                                          +
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* Saved teams */}
        <section className="border border-border rounded-xl bg-surface p-4">
          <h2 className="text-lg font-semibold mb-4">Saved Teams</h2>
          {savedTeams.length === 0 ? (
            <p className="text-sm text-muted">No teams saved yet.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {savedTeams.map(team => (
                <div key={team.id} className="border border-border rounded-lg p-3 bg-white/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{team.name}</span>
                    <div className="flex items-center gap-2">
                      <button 
                        className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded border border-blue-200 hover:bg-blue-50" 
                        onClick={() => loadTeam(team)}
                      >
                        Load
                      </button>
                      <button 
                        className="text-xs text-red-600 hover:text-red-800 px-2 py-1 rounded border border-red-200 hover:bg-red-50" 
                        onClick={() => deleteTeam(team.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-muted mb-2">
                    {team.slots.filter(s => s.id != null).length} / 6 Pokémon
                    {team.slots.some(s => s.moves && s.moves.length > 0) && (
                      <span className="ml-2">• {team.slots.reduce((total, s) => total + (s.moves?.length || 0), 0)} moves</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {team.slots.map((slot, idx) => {
                      if (slot.id) {
                        const poke = allPokemon.find(p => p.id === slot.id)
                        return poke ? (
                          <div key={idx} className="relative w-8 h-8" title={`${formatPokemonName(poke.name)} Lv.${slot.level}`}>
                            <Image
                              src={poke.sprites.other['official-artwork'].front_default || poke.sprites.front_default || ''}
                              alt={poke.name}
                              width={32}
                              height={32}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        ) : null
                      }
                      return (
                        <div key={idx} className="w-8 h-8 border border-dashed border-gray-300 rounded flex items-center justify-center">
                          <span className="text-xs text-gray-400">?</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}


