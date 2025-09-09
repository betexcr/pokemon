'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pokemon } from '@/types/pokemon'
import { getPokemonList, getPokemon, getMove, getPokemonSpriteUrl, getPokemonTotalCount } from '@/lib/api'
import { formatPokemonName } from '@/lib/utils'
import Image from 'next/image'
import TypeBadge from '@/components/TypeBadge'
import Tooltip from '@/components/Tooltip'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ChevronDown, ChevronRight, Cloud, CloudOff, Save, Loader2, Wifi } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { 
  saveTeamToFirebase, 
  deleteTeamFromFirebase, 
  getUserTeams, 
  syncTeamsWithFirebase,
  type SavedTeam as FirebaseSavedTeam,
  type TeamSlot,
  type MoveData
} from '@/lib/userTeams'
import AuthModal from '@/components/auth/AuthModal'
import AppHeader from '@/components/AppHeader'

// Types are now imported from userTeams.ts

const STORAGE_KEY = 'pokemon-team-builder'

export default function TeamBuilderPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [availableMoves, setAvailableMoves] = useState<Record<number, Array<{ name: string; type: string; damage_class: "physical" | "special" | "status"; power: number | null; accuracy: number | null; pp: number | null; level_learned_at: number | null; learn_method: string; short_effect?: string | null }>>>({})
  const [teamSlots, setTeamSlots] = useState<TeamSlot[]>(
    Array.from({ length: 6 }, () => ({ id: null, level: 50, moves: [] as MoveData[] }))
  )
  const [savedTeams, setSavedTeams] = useState<FirebaseSavedTeam[]>([])
  const [teamName, setTeamName] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [collapsedSlots, setCollapsedSlots] = useState<Set<number>>(new Set([0, 1, 2, 3, 4, 5]))
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [levelMovesOnly, setLevelMovesOnly] = useState(true)
  
  // Virtualized scrolling state
  const [pokemonOffset, setPokemonOffset] = useState(0)
  const [hasMorePokemon, setHasMorePokemon] = useState(true)
  const [loadingMorePokemon, setLoadingMorePokemon] = useState(false)
  const [totalPokemonCount, setTotalPokemonCount] = useState(0)

  // First-click suggestions: original 151
  const firstGenSuggestions = useMemo(() => {
    return allPokemon
      .filter(p => p.id >= 1 && p.id <= 151)
      .sort((a, b) => a.id - b.id)
      .slice(0, 151)
  }, [allPokemon])

  // Prefetch types for visible suggestions so badges are shown immediately
  // (hook positioned after dependencies are defined below)

  // Filter Pokémon based on search term (for search mode)
  const filteredPokemon = useMemo(() => {
    if (!searchTerm.trim()) return []
    
    const term = searchTerm.toLowerCase().trim()
    return allPokemon.filter(pokemon => {
      const name = pokemon.name.toLowerCase()
      const id = pokemon.id.toString()
      
      // Handle both hyphen and space variations (e.g., "ho-oh" vs "ho oh")
      const normalizedName = name.replace(/[- ]/g, '')
      const normalizedTerm = term.replace(/[- ]/g, '')
      
      return name.includes(term) || 
             id.includes(term) || 
             normalizedName.includes(normalizedTerm)
    })
  }, [allPokemon, searchTerm])

  // Load more Pokemon for virtualized scrolling
  const loadMorePokemon = useCallback(async () => {
    if (loadingMorePokemon || !hasMorePokemon || searchTerm.trim()) return
    
    setLoadingMorePokemon(true)
    try {
      const newOffset = pokemonOffset + 30
      const pokemonList = await getPokemonList(30, newOffset)
      
      if (pokemonList.results.length === 0) {
        setHasMorePokemon(false)
        return
      }
      
      // Create basic Pokémon objects with minimal data
      const newPokemon = pokemonList.results.map((pokemonRef) => {
        const pokemonId = pokemonRef.url.split('/').slice(-2)[0]
        const id = parseInt(pokemonId)
        
        return {
          id,
          name: pokemonRef.name,
          base_experience: 0,
          height: 0,
          weight: 0,
          is_default: true,
          order: id,
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
          types: [], // Will be populated when Pokémon is selected
          species: { name: pokemonRef.name, url: '' }
        } as Pokemon
      })

      setAllPokemon(prev => [...prev, ...newPokemon])
      setPokemonOffset(newOffset)
      
      if (pokemonList.results.length < 30) {
        setHasMorePokemon(false)
      }
    } catch (error) {
      console.error('Error loading more Pokémon:', error)
    } finally {
      setLoadingMorePokemon(false)
    }
  }, [pokemonOffset, hasMorePokemon, loadingMorePokemon, searchTerm])

  // Function to fetch type data for a Pokémon
  const fetchPokemonTypes = useCallback(async (pokemonId: number) => {
    try {
      const pokemonData = await getPokemon(pokemonId)
      setAllPokemon(prev => prev.map(p => 
        p.id === pokemonId 
          ? { ...p, types: pokemonData.types }
          : p
      ))
    } catch (error) {
      console.error(`Failed to fetch types for Pokémon ${pokemonId}:`, error)
    }
  }, [])

  // Prefetch types for visible suggestions so badges are shown immediately
  useEffect(() => {
    if (!showDropdown) return
    const visible = (searchTerm.trim() ? filteredPokemon.slice(0, 50) : firstGenSuggestions)
    visible.forEach(p => { if ((p.types?.length || 0) === 0) fetchPokemonTypes(p.id) })
  }, [showDropdown, searchTerm, /* filteredPokemon causes init order issue */ firstGenSuggestions, fetchPokemonTypes])

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      // Check if target has closest method and if it's within the dropdown container
      if (!target || typeof target.closest !== 'function' || !target.closest('.search-dropdown-container')) {
        setShowDropdown(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [showDropdown])

  // Handle scroll for virtualized loading in dropdown
  useEffect(() => {
    const handleScroll = (event: Event) => {
      const target = event.target as Element
      // Check if target has closest method and if it's within the dropdown list
      if (!target || typeof target.closest !== 'function' || !target.closest('.pokemon-dropdown-list')) return
      
      const element = target as HTMLElement
      const { scrollTop, scrollHeight, clientHeight } = element
      
      // Load more when user scrolls to within 100px of the bottom
      if (scrollHeight - scrollTop <= clientHeight + 100) {
        loadMorePokemon()
      }
    }

    if (showDropdown && !searchTerm.trim()) {
      document.addEventListener('scroll', handleScroll, true)
      return () => {
        document.removeEventListener('scroll', handleScroll, true)
      }
    }
  }, [showDropdown, searchTerm, loadMorePokemon])

  // Fetch type data for displayed Pokémon
  useEffect(() => {
    if (filteredPokemon.length > 0) {
      filteredPokemon.forEach(pokemon => {
        if (pokemon.types.length === 0) {
          fetchPokemonTypes(pokemon.id)
        }
      })
    }
  }, [filteredPokemon, fetchPokemonTypes])

  // Load initial data
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        // Get total count and first 50 Pokémon
        const [totalCount, pokemonList] = await Promise.all([
          getPokemonTotalCount(),
          getPokemonList(50, 0)
        ])
        
        setTotalPokemonCount(totalCount)
        
        // Create basic Pokémon objects with minimal data for search
        const basicPokemon = pokemonList.results.map((pokemonRef) => {
          const pokemonId = pokemonRef.url.split('/').slice(-2)[0]
          const id = parseInt(pokemonId)
          
          return {
            id,
            name: pokemonRef.name,
            base_experience: 0,
            height: 0,
            weight: 0,
            is_default: true,
            order: id,
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
            types: [], // Will be populated when Pokémon is selected
            species: { name: pokemonRef.name, url: '' }
          } as Pokemon
        })

        setAllPokemon(basicPokemon)
        setPokemonOffset(50)
        setHasMorePokemon(totalCount > 50)
      } catch (e) {
        console.error('Error loading Pokémon:', e)
        setError('Failed to load Pokémon list')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Load saved teams from Firebase or localStorage
  useEffect(() => {
    const loadTeams = async () => {
      if (user) {
        // User is authenticated, load from Firebase
        try {
          setSyncing(true)
          const firebaseTeams = await getUserTeams(user.uid)
          setSavedTeams(firebaseTeams)
          
          // Also sync any local teams to Firebase
          try {
            const localTeamsRaw = localStorage.getItem(STORAGE_KEY)
            if (localTeamsRaw) {
              const localTeams = JSON.parse(localTeamsRaw) as FirebaseSavedTeam[]
              await syncTeamsWithFirebase(user.uid, localTeams)
              // Clear local storage after sync
              localStorage.removeItem(STORAGE_KEY)
            }
          } catch (error) {
            console.error('Error syncing local teams:', error)
          }
        } catch (error) {
          console.error('Error loading teams from Firebase:', error)
          // Fallback to localStorage
          try {
            const raw = localStorage.getItem(STORAGE_KEY)
            if (raw) setSavedTeams(JSON.parse(raw))
          } catch {}
        } finally {
          setSyncing(false)
        }
      } else {
        // User not authenticated, load from localStorage
        try {
          const raw = localStorage.getItem(STORAGE_KEY)
          if (raw) setSavedTeams(JSON.parse(raw))
        } catch {}
      }
    }

    loadTeams()
  }, [user])

  const persistTeams = useCallback((teams: FirebaseSavedTeam[]) => {
    setSavedTeams(teams)
    if (user) {
      // User is authenticated, save to Firebase
      // Note: This is a local state update, actual saving happens in saveTeam function
    } else {
      // User not authenticated, save to localStorage
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(teams)) } catch {}
    }
  }, [user])



  const setSlot = async (idx: number, patch: Partial<TeamSlot>) => {
    if (patch.id && typeof patch.id === 'number') {
      // Fetch full Pokémon details if we don't have them
      const existingPokemon = allPokemon.find(p => p.id === patch.id)
      if (existingPokemon && existingPokemon.types.length === 0) {
        try {
          const fullPokemon = await getPokemon(patch.id as number)
          setAllPokemon(prev => prev.map(p => p.id === patch.id ? fullPokemon : p))
        } catch (error) {
          console.error('Failed to fetch Pokémon details:', error)
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
    
    // Auto-expand/collapse based on Pokémon assignment
    if (patch.id !== undefined) {
      setCollapsedSlots(prev => {
        const newSet = new Set(prev)
        if (patch.id === null) {
          // Collapse when Pokémon is removed
          newSet.add(idx)
        } else {
          // Expand when Pokémon is added
          newSet.delete(idx)
        }
        return newSet
      })
    }
  }

  const clearTeam = () => {
    setTeamSlots(Array.from({ length: 6 }, () => ({ id: null, level: 50, moves: [] as MoveData[] })))
    setCollapsedSlots(new Set([0, 1, 2, 3, 4, 5])) // Collapse all slots when clearing team
  }

  const saveTeam = async () => {
    if (!user) {
      // User not authenticated, save to localStorage
      const name = teamName.trim() || `Team ${new Date().toLocaleString()}`
      const id = `local_${Date.now()}`
      const team: FirebaseSavedTeam = { 
        id, 
        name, 
        slots: teamSlots,
        userId: 'anonymous',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      persistTeams([team, ...savedTeams])
      setTeamName('')
      return
    }

    // User is authenticated, save to Firebase
    setSaving(true)
    try {
      const name = teamName.trim() || `Team ${new Date().toLocaleString()}`
      const teamData = {
        name,
        slots: teamSlots,
        isPublic: false,
        description: ''
      }

      const teamId = await saveTeamToFirebase(user.uid, teamData)
      const newTeam: FirebaseSavedTeam = {
        id: teamId,
        name,
        slots: teamSlots,
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
        isPublic: false,
        description: ''
      }

      setSavedTeams([newTeam, ...savedTeams])
      setTeamName('')
    } catch (error) {
      console.error('Error saving team:', error)
      setError('Failed to save team. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const loadTeam = async (team: FirebaseSavedTeam) => {
    setTeamSlots(team.slots)
    setTeamName(team.name)
    
    // Set collapsed state based on which slots have Pokémon
    const newCollapsedSlots = new Set<number>()
    team.slots.forEach((slot, idx) => {
      if (slot.id === null) {
        newCollapsedSlots.add(idx)
      }
    })
    setCollapsedSlots(newCollapsedSlots)
    
    // Load available moves for each Pokemon in the team
    const movePromises = team.slots.map(async (slot, idx) => {
      if (slot.id && slot.level) {
        try {
          const moves = await getAvailableMoves(slot.id, slot.level)
          return { idx, moves }
        } catch (error) {
          console.error(`Failed to load moves for Pokemon ${slot.id}:`, error)
          return { idx, moves: [] }
        }
      }
      return { idx, moves: [] }
    })
    
    const moveResults = await Promise.all(movePromises)
    const newAvailableMoves: Record<number, Array<{ name: string; type: string; damage_class: "physical" | "special" | "status"; power: number | null; accuracy: number | null; pp: number | null; level_learned_at: number | null; learn_method: string; short_effect?: string | null }>> = {}
    
    moveResults.forEach(({ idx, moves }) => {
      if (moves.length > 0) {
        newAvailableMoves[idx] = moves
      }
    })
    
    setAvailableMoves(newAvailableMoves)
  }

  const deleteTeam = async (id: string) => {
    if (!user) {
      // User not authenticated, delete from localStorage
      persistTeams(savedTeams.filter(t => t.id !== id))
      return
    }

    // User is authenticated, delete from Firebase
    try {
      await deleteTeamFromFirebase(id, user.uid)
      setSavedTeams(savedTeams.filter(t => t.id !== id))
    } catch (error) {
      console.error('Error deleting team:', error)
      setError('Failed to delete team. Please try again.')
    }
  }

  // Get available moves for a Pokémon at a specific level
  const getAvailableMoves = useCallback(async (pokemonId: number, level: number): Promise<Array<{ name: string; type: string; damage_class: "physical" | "special" | "status"; power: number | null; accuracy: number | null; pp: number | null; level_learned_at: number | null; learn_method: string; short_effect?: string | null }>> => {
    try {
      const pokemon = allPokemon.find(p => p.id === pokemonId)
      if (!pokemon || pokemon.moves.length === 0) {
        // Fetch full Pokémon data if we don't have moves
        const fullPokemon = await getPokemon(pokemonId)
        const allMoves = fullPokemon.moves
          .filter(move => move.version_group_details.some(detail => 
            ['level-up', 'machine', 'egg', 'tutor'].includes(detail.move_learn_method.name)
          ))
          .map(move => {
            // Prioritize level-up moves, then machine, egg, tutor
            const levelUpDetail = move.version_group_details.find(detail => detail.move_learn_method.name === 'level-up');
            const machineDetail = move.version_group_details.find(detail => detail.move_learn_method.name === 'machine');
            const eggDetail = move.version_group_details.find(detail => detail.move_learn_method.name === 'egg');
            const tutorDetail = move.version_group_details.find(detail => detail.move_learn_method.name === 'tutor');
            
            return {
              moveName: move.move.name,
              level_learned_at: levelUpDetail?.level_learned_at || null,
              learn_method: levelUpDetail ? 'level-up' : 
                           machineDetail ? 'machine' : 
                           eggDetail ? 'egg' : 
                           tutorDetail ? 'tutor' : 'unknown'
            };
          })
          .filter((move, index, self) => 
            index === self.findIndex(m => m.moveName === move.moveName)
          );

        // Fetch full move details for each move
        const movePromises = allMoves.map(async ({ moveName, level_learned_at, learn_method }) => {
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
              learn_method,
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
              level_learned_at,
              learn_method
            };
          }
        });

        const moveResults = await Promise.all(movePromises);
        return moveResults
          .filter(move => {
            // For level-up moves, only include if level_learned_at <= level
            if (move.learn_method === 'level-up') {
              return move.level_learned_at && move.level_learned_at <= level
            }
            // For other move types (machine, egg, tutor), include them all
            return true
          })
      }

      // If we have basic move data, fetch full details
      const allMoves = pokemon.moves
        .filter(move => move.version_group_details.some(detail => 
          ['level-up', 'machine', 'egg', 'tutor'].includes(detail.move_learn_method.name)
        ))
        .map(move => {
          // Prioritize level-up moves, then machine, egg, tutor
          const levelUpDetail = move.version_group_details.find(detail => detail.move_learn_method.name === 'level-up');
          const machineDetail = move.version_group_details.find(detail => detail.move_learn_method.name === 'machine');
          const eggDetail = move.version_group_details.find(detail => detail.move_learn_method.name === 'egg');
          const tutorDetail = move.version_group_details.find(detail => detail.move_learn_method.name === 'tutor');
          
          return {
            moveName: move.move.name,
            level_learned_at: levelUpDetail?.level_learned_at || null,
            learn_method: levelUpDetail ? 'level-up' : 
                         machineDetail ? 'machine' : 
                         eggDetail ? 'egg' : 
                         tutorDetail ? 'tutor' : 'unknown'
          };
        })
        .filter((move, index, self) => 
          index === self.findIndex(m => m.moveName === move.moveName)
        );

      // Fetch full move details for each move
      const movePromises = allMoves.map(async ({ moveName, level_learned_at, learn_method }) => {
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
            learn_method,
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
            level_learned_at,
            learn_method
          };
        }
      });

      const moveResults = await Promise.all(movePromises);
      return moveResults
        .filter(move => {
          // For level-up moves, only include if level_learned_at <= level
          if (move.learn_method === 'level-up') {
            return move.level_learned_at && move.level_learned_at <= level
          }
          // For other move types (machine, egg, tutor), include them all
          return true
        })
    } catch (error) {
      console.error('Error getting available moves:', error)
      return []
    }
  }, [allPokemon, levelMovesOnly])

  // Helper function to capitalize strings

  // Toggle collapsed state for a team slot
  const toggleSlotCollapse = (slotIndex: number) => {
    setCollapsedSlots(prev => {
      const newSet = new Set(prev)
      if (newSet.has(slotIndex)) {
        newSet.delete(slotIndex)
      } else {
        newSet.add(slotIndex)
      }
      return newSet
    })
  }

  // Handle move selection
  const toggleMove = (slotIndex: number, move: MoveData) => {
    setTeamSlots(prev => prev.map((slot, i) => {
      if (i === slotIndex) {
        const currentMoves = slot.moves
        if (currentMoves.some(m => m.name === move.name)) {
          // Remove move
          return { ...slot, moves: currentMoves.filter(m => m.name !== move.name) }
        } else if (currentMoves.length < 4) {
          // Add move (max 4)
          const newMoves = [...currentMoves, move]
          
          // Auto-collapse when 4 moves are added
          if (newMoves.length === 4) {
            setCollapsedSlots(prev => {
              const newSet = new Set(prev)
              newSet.add(slotIndex)
              return newSet
            })
          }
          
          return { ...slot, moves: newMoves }
        }
      }
      return slot
    }))
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-bg text-text">
      <div className="text-center">
        <img 
          src="/loading.gif" 
          alt="Loading Pokémon" 
          width={100} 
          height={100} 
          className="mx-auto mb-4"
        />
        <p className="text-muted">Loading Team Builder...</p>
      </div>
    </div>
  )
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-bg text-red-600">{error}</div>
  )

  return (
    <div className="min-h-screen bg-bg text-text overflow-x-hidden">
      <AppHeader
        title="Team Builder"
        backLink="/"
        backLabel="Back to PokéDex"
        showToolbar={false}
        showThemeToggle={false}
      />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6 overflow-x-hidden">
        {/* Add Pokémon Search */}
        <section className="border border-border rounded-xl bg-surface p-4 overflow-visible">
          <h2 className="text-lg font-semibold mb-4 text-text">Add Pokémon</h2>
          <div className="relative search-dropdown-container max-w-full z-[10000]">
            <input
              type="text"
              placeholder="Search Pokémon by name or # (e.g., 'Lugia', '249', 'char')"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setShowDropdown(true)}
              className="w-full max-w-full px-4 py-6 border border-border rounded-lg bg-white text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-poke-blue focus:border-transparent"
            />
            
            {showDropdown && (
              <div className="absolute top-full left-0 w-full max-w-full mt-1 bg-white border border-border rounded-lg shadow-2xl z-[10010] max-h-96 overflow-y-auto pokemon-dropdown-list">
                {(searchTerm.trim() ? filteredPokemon : allPokemon).length > 0 ? (
                  <div className="divide-y divide-border">
                    {(searchTerm.trim() ? filteredPokemon.slice(0, 50) : allPokemon).map((pokemon) => (
                      <button
                        key={pokemon.id}
                        onClick={async () => {
                          const slot = teamSlots.findIndex(s => s.id === null)
                          if (slot !== -1) {
                            await setSlot(slot, { id: pokemon.id })
                            // Close dropdown and clear search term
                            setShowDropdown(false)
                            setSearchTerm('')
                            // Focus on the selected Pokemon slot by expanding it
                            setCollapsedSlots(prev => {
                              const newSet = new Set(prev)
                              newSet.delete(slot)
                              return newSet
                            })
                          }
                        }}
                        className="w-full text-left hover:bg-gray-50 flex items-center gap-1 transition-colors h-10 py-1"
                      >
                        <div className="relative w-6 h-6 flex-shrink-0 bg-gray-100 rounded">
                          <Image
                            src={getPokemonSpriteUrl(pokemon.id)}
                            alt={pokemon.name}
                            width={24}
                            height={24}
                            className="w-full h-full object-contain"
                            unoptimized
                          />
                        </div>
                        <div className="flex-1 min-w-0 leading-none">
                          <div className="font-medium capitalize text-text text-xs leading-none">
                            {formatPokemonName(pokemon.name)}
                          </div>
                          <div className="text-[10px] text-muted leading-none">
                            #{String(pokemon.id).padStart(4, '0')}
                          </div>
                        </div>
                        <div className="flex gap-1 items-center">
                          {pokemon.types.length > 0 ? (
                            pokemon.types.map((typeObj) => {
                              // Handle both object format { type: { name: "fire" } } and string format "fire"
                              const typeName = typeof typeObj === 'string' ? typeObj : typeObj.type?.name
                              return typeName ? (
                                <TypeBadge key={`${pokemon.id}-${typeName}`} type={typeName} variant="span" />
                              ) : null
                            })
                          ) : (
                            <span className="text-xs text-muted">…</span>
                          )}
                        </div>
                      </button>
                    ))}
                    
                    {/* Loading indicator for virtualized scrolling */}
                    {!searchTerm.trim() && loadingMorePokemon && (
                      <div className="p-4 text-center text-muted">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-poke-blue mx-auto mb-2"></div>
                        <p className="text-sm">Loading more Pokémon...</p>
                      </div>
                    )}
                    
                    {/* End of list indicator */}
                    {!searchTerm.trim() && !hasMorePokemon && allPokemon.length > 0 && (
                      <div className="p-4 text-center text-muted text-sm">
                        All {totalPokemonCount} Pokémon loaded
                      </div>
                    )}
                  </div>
                ) : searchTerm.trim() ? (
                  <div className="p-4 text-center text-muted">
                    No Pokémon found matching &quot;{searchTerm}&quot;
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted">No suggestions available</div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Team slots */}
        <section className="border border-border rounded-xl bg-surface p-4 overflow-x-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text">Your Team</h2>
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted">
                {teamSlots.filter(s => s.id != null).length} / 6 Pokémon
              </div>
              <input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Team name"
                className="px-3 py-2 border border-border rounded-lg bg-surface text-text"
              />
              <button 
                onClick={saveTeam} 
                disabled={saving}
                className="px-3 py-2 rounded-lg bg-poke-blue text-white hover:bg-poke-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Team
                  </>
                )}
              </button>
              <button onClick={clearTeam} className="px-3 py-2 rounded-lg border border-border text-text hover:bg-white/50 transition-colors">Clear</button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
            {teamSlots.map((slot, idx) => {
              const poke = allPokemon.find(p => p.id === slot.id) || null
              return (
                <div key={idx} className="border border-border rounded-lg bg-white/50 w-full min-w-0">
                  {/* Collapsible Header */}
                  <div 
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleSlotCollapse(idx)}
                  >
                    <div className="flex items-center gap-2">
                      {collapsedSlots.has(idx) ? (
                        <ChevronRight className="h-4 w-4 text-muted" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted" />
                      )}
                      <span className="text-sm font-medium text-text">Slot {idx + 1}</span>
                      {poke && (
                        <span className="text-xs text-muted">
                          #{poke.id} {formatPokemonName(poke.name)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {poke && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            saveTeam()
                          }} 
                          className="text-xs text-blue-600 hover:text-blue-800 hover:scale-110 transition-transform"
                          title="Save team with this Pokémon"
                        >
                          💾
                        </button>
                      )}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          setSlot(idx, { id: null })
                        }} 
                        className="text-xs text-red-600 hover:text-red-800"
                        title="Remove Pokémon from slot"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  
                  {/* Collapsible Content */}
                  {!collapsedSlots.has(idx) && (
                    <div className="px-3 pb-3 w-full min-w-0">
                  
                  {poke ? (
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative w-16 h-16 flex-shrink-0">
                        <Image
                          src={getPokemonSpriteUrl(poke.id)}
                          alt={poke.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-text">#{poke.id} {formatPokemonName(poke.name)}</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {poke.types?.length > 0 ? poke.types.map(t => (
                            <TypeBadge key={t.type.name} type={t.type.name} variant="span" />
                          )) : null}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm mb-3 h-16 flex items-center justify-center text-muted border-2 border-dashed border-border rounded">
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
                        <label className="text-sm font-medium text-text">Moves ({slot.moves.length}/4)</label>
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
                        <div className="overflow-x-auto rounded-lg border border-gray-200 w-full">
                          <table className="w-full text-xs min-w-max">
                            <thead className="bg-gray-50 border-b border-gray-200">
                              <tr className="[&>th]:px-2 [&>th]:py-1 text-left text-muted">
                                <th>Move</th><th>Type</th><th>Cat.</th><th>Power</th><th>Acc.</th><th>PP</th>
                              </tr>
                            </thead>
                            <tbody>
                              {slot.moves.map((move) => (
                                <tr key={move.name} className="[&>td]:px-2 [&>td]:py-1 border-b border-gray-100">
                                  <td className="font-medium capitalize text-text">
                                    <div className="flex items-center gap-2">
                                      <span>{move.name}</span>
                                      <button 
                                        onClick={() => toggleMove(idx, move)}
                                        className="text-red-500 hover:text-red-700 text-xs"
                                        title="Remove move"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  </td>
                                  <td><TypeBadge type={move.type} variant="span" /></td>
                                  <td className="capitalize">{move.damage_class}</td>
                                  <td>{move.power ?? '—'}</td>
                                  <td>{move.accuracy ?? '—'}</td>
                                  <td>{move.pp ?? '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      
                      {/* Available Moves Table */}
                      {availableMoves[idx] && availableMoves[idx].length > 0 && slot.moves.length < 4 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-muted font-medium">
                              Available moves ({availableMoves[idx].filter(move => !slot.moves.some(slotMove => slotMove.name === move.name)).filter(move => {
                                if (levelMovesOnly) {
                                  return move.learn_method === 'level-up' && move.level_learned_at && move.level_learned_at <= slot.level
                                }
                                return true
                              }).length}):
                              {availableMoves[idx].filter(move => !slot.moves.some(slotMove => slotMove.name === move.name)).length > 20 && (
                                <span className="ml-2 text-blue-600">• Scroll to see all moves</span>
                              )}
                            </div>
                            <label className="flex items-center gap-2 text-xs text-muted cursor-pointer">
                              <input
                                type="checkbox"
                                checked={levelMovesOnly}
                                onChange={(e) => setLevelMovesOnly(e.target.checked)}
                                className="rounded border-gray-300"
                              />
                              Level moves only
                            </label>
                          </div>
                          <div className="overflow-x-auto rounded-lg border border-gray-200 w-full max-h-80 overflow-y-auto">
                            <table className="w-full text-xs min-w-max">
                              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                                <tr className="[&>th]:px-2 [&>th]:py-1 text-left text-muted">
                                  <th>Move</th><th>Type</th><th>Cat.</th><th>Power</th><th>Acc.</th><th>PP</th><th>Lvl</th><th>Method</th><th></th>
                                </tr>
                              </thead>
                              <tbody>
                                {availableMoves[idx]
                                  .filter(move => !slot.moves.some(slotMove => slotMove.name === move.name))
                                  .filter(move => {
                                    if (levelMovesOnly) {
                                      // Only show level-up moves that are actually available at this level
                                      return move.learn_method === 'level-up' && move.level_learned_at && move.level_learned_at <= slot.level
                                    }
                                    // Show all moves when filter is off
                                    return true
                                  })
                                  .sort((a, b) => {
                                    // Sort by learning method priority: level-up, machine, egg, tutor
                                    const methodPriority = { 'level-up': 1, 'machine': 2, 'egg': 3, 'tutor': 4, 'unknown': 5 }
                                    const aMethodPriority = methodPriority[a.learn_method as keyof typeof methodPriority] || 5
                                    const bMethodPriority = methodPriority[b.learn_method as keyof typeof methodPriority] || 5
                                    
                                    if (aMethodPriority !== bMethodPriority) {
                                      return aMethodPriority - bMethodPriority
                                    }
                                    
                                    // If same method, sort by level learned (ascending), with null values at the end
                                    const aLevel = a.level_learned_at ?? 999
                                    const bLevel = b.level_learned_at ?? 999
                                    if (aLevel !== bLevel) {
                                      return aLevel - bLevel
                                    }
                                    
                                    // If same level, sort by power (higher power first)
                                    const aPower = a.power ?? 0
                                    const bPower = b.power ?? 0
                                    return bPower - aPower
                                  })
                                  .map((move) => (
                                    <tr 
                                      key={move.name} 
                                      className="[&>td]:px-2 [&>td]:py-1 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                                      onClick={() => toggleMove(idx, move)}
                                      title={slot.moves.length >= 4 ? 'Maximum 4 moves reached' : 'Click to add move'}
                                    >
                                      <td className="font-medium capitalize text-text">
                                        {move.short_effect ? (
                                          <Tooltip content={move.short_effect} maxWidth="w-80" variant="move" type={move.type} position="top">
                                            <span className="cursor-help">
                                              {move.name}
                                            </span>
                                          </Tooltip>
                                        ) : (
                                          <span>{move.name}</span>
                                        )}
                                      </td>
                                      <td><TypeBadge type={move.type} variant="span" /></td>
                                      <td className="capitalize">{move.damage_class}</td>
                                      <td>{move.power ?? '—'}</td>
                                      <td>{move.accuracy ?? '—'}</td>
                                      <td>{move.pp ?? '—'}</td>
                                      <td>{move.level_learned_at ?? '—'}</td>
                                      <td className="capitalize text-xs">
                                        <span className={`px-1 py-0.5 rounded text-xs ${
                                          move.learn_method === 'level-up' ? 'bg-blue-100 text-blue-800' :
                                          move.learn_method === 'machine' ? 'bg-purple-100 text-purple-800' :
                                          move.learn_method === 'egg' ? 'bg-green-100 text-green-800' :
                                          move.learn_method === 'tutor' ? 'bg-orange-100 text-orange-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                          {move.learn_method}
                                        </span>
                                      </td>
                                      <td>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            toggleMove(idx, move)
                                          }}
                                          disabled={slot.moves.length >= 4}
                                          className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                          title={slot.moves.length >= 4 ? 'Maximum 4 moves reached' : 'Add move'}
                                        >
                                          +
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                {/* Spacer row for better bottom spacing */}
                                <tr>
                                  <td colSpan={9} className="h-4"></td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
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
        <section className="border border-border rounded-xl bg-surface p-4 overflow-x-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text">Saved Teams</h2>
            {user ? (
              <div className="flex items-center gap-1 text-sm text-green-600">
                <Cloud className="h-4 w-4" />
                <span>Synced to Cloud</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-sm text-orange-600">
                <CloudOff className="h-4 w-4" />
                <span>Local Storage Only</span>
              </div>
            )}
          </div>
          {savedTeams.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted mb-2">No teams saved yet.</p>
              {!user ? (
                <div className="space-y-3">
                  <p className="text-xs text-muted">
                    Sign in to sync your teams across devices
                  </p>
                  <button
                    onClick={() => {
                      console.log('Auth button clicked, setting showAuthModal to true');
                      setShowAuthModal(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                  >
                    <Wifi className="h-4 w-4" />
                    Go online to save your teams!
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {savedTeams.map(team => (
                <div key={team.id} className="border border-border rounded-lg p-3 bg-white/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{team.name}</span>
                      {team.id.startsWith('local_') ? (
                        <div title="Local only">
                          <CloudOff className="h-3 w-3 text-orange-500" />
                        </div>
                      ) : (
                        <div title="Synced to cloud">
                          <Cloud className="h-3 w-3 text-green-500" />
                        </div>
                      )}
                    </div>
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
                    <div className="text-xs text-muted mt-1">
                      {team.updatedAt.toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {team.slots.map((slot, idx) => {
                      if (slot.id) {
                        const poke = allPokemon.find(p => p.id === slot.id)
                        return poke ? (
                          <div key={idx} className="relative w-8 h-8" title={`${formatPokemonName(poke.name)} Lv.${slot.level}`}>
                            <Image
                              src={getPokemonSpriteUrl(poke.id)}
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
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        initialMode="login"
      />
    </div>
  )
}


