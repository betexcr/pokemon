'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { BattleSprite, BattleSpriteRef } from './BattleSprite'
import { GYM_CHAMPIONS } from '@/lib/gym_champions'
import { getPokemon, getMove } from '@/lib/api'
import { initializeTeamBattle, processBattleTurn, type BattleState as EngineState, type BattleAction as EngineAction } from '@/lib/team-battle-engine'
import Tooltip from '@/components/Tooltip'
import { formatPokemonName } from '@/lib/utils'

interface AIBattleSceneProps {
  playerTeam: Array<{ id: number; level: number }>
  opponentChampionId: string
  className?: string
  viewMode?: 'animated' | 'classic'
}

interface Pokemon {
  id: number
  name: string
  species: string
  level: number
  types: string[]
  abilities?: string[]
  stats: {
    hp: number
    atk: number
    def: number
    spa: number
    spd: number
    spe: number
  }
  moves: Array<{
    id: string
    name: string
    type: string
    power: number | null
    accuracy: number | null
    pp: number
  }>
  currentHp: number
  maxHp: number
  status?: string
  fainted?: boolean
}

interface BattleState {
  phase: 'choosing' | 'resolving' | 'ended'
  turn: number
  playerActive: Pokemon | null
  opponentActive: Pokemon | null
  playerTeam: Pokemon[]
  opponentTeam: Pokemon[]
  lastAction: string
  battleLog: string[]
  winner: 'player' | 'opponent' | null
  playerAtkStage?: number
  opponentAtkStage?: number
}

export const AIBattleScene: React.FC<AIBattleSceneProps> = ({
  playerTeam,
  opponentChampionId,
  className = '',
  viewMode = 'animated'
}) => {
  const router = useRouter()
  const playerSpriteRef = React.useRef<BattleSpriteRef>(null)
  const opponentSpriteRef = React.useRef<BattleSpriteRef>(null)
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [battleState, setBattleState] = useState<BattleState | null>(null)
  const [engineState, setEngineState] = useState<EngineState | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [moveInfo, setMoveInfo] = useState<Record<string, { type: string; short_effect?: string }>>({})

  // Get opponent champion data
  const opponentChampion = useMemo(() => {
    return GYM_CHAMPIONS.find(c => c.id === opponentChampionId)
  }, [opponentChampionId])

  // Initialize battle
  useEffect(() => {
    const initializeBattle = async () => {
      try {
        setLoading(true)
        setError(null)

        if (!opponentChampion) {
          throw new Error('Opponent champion not found')
        }

        // Load player team data
        const playerTeamData: Pokemon[] = []
        for (const slot of playerTeam) {
          if (slot.id) {
            const pokemonData = await getPokemon(slot.id)
            const stats = pokemonData.stats.reduce((acc, stat) => {
              acc[stat.stat.name] = stat.base_stat
              return acc
            }, {} as any)

            // Get moves (simplified - just first 4 moves)
            const moves = pokemonData.moves.slice(0, 4).map(move => ({
              id: move.move.name,
              name: move.move.name,
              type: 'normal', // Simplified
              power: 50, // Simplified
              accuracy: 100, // Simplified
              pp: 20 // Simplified
            }))

            playerTeamData.push({
              id: pokemonData.id,
              name: pokemonData.name,
              species: pokemonData.name,
              level: slot.level,
              types: pokemonData.types.map(t => t.type.name),
              // capture abilities for shared engine mapping
              abilities: (pokemonData.abilities || []).map((a: any) => a.ability?.name).filter(Boolean),
              stats: {
                hp: stats.hp || 100,
                atk: stats.attack || 100,
                def: stats.defense || 100,
                spa: stats['special-attack'] || 100,
                spd: stats['special-defense'] || 100,
                spe: stats.speed || 100
              },
              moves,
              currentHp: stats.hp || 100,
              maxHp: stats.hp || 100
            })
          }
        }

        // Load opponent team data
        const opponentTeamData: Pokemon[] = []
        for (const slot of opponentChampion.team.slots) {
          const pokemonData = await getPokemon(slot.id)
          const stats = pokemonData.stats.reduce((acc, stat) => {
            acc[stat.stat.name] = stat.base_stat
            return acc
          }, {} as any)

          // Get moves (simplified)
          const moves = pokemonData.moves.slice(0, 4).map(move => ({
            id: move.move.name,
            name: move.move.name,
            type: 'normal', // Simplified
            power: 50, // Simplified
            accuracy: 100, // Simplified
            pp: 20 // Simplified
          }))

          opponentTeamData.push({
            id: pokemonData.id,
            name: pokemonData.name,
            species: pokemonData.name,
            level: slot.level,
            types: pokemonData.types.map(t => t.type.name),
            abilities: (pokemonData.abilities || []).map((a: any) => a.ability?.name).filter(Boolean),
            stats: {
              hp: stats.hp || 100,
              atk: stats.attack || 100,
              def: stats.defense || 100,
              spa: stats['special-attack'] || 100,
              spd: stats['special-defense'] || 100,
              spe: stats.speed || 100
            },
            moves,
            currentHp: stats.hp || 100,
            maxHp: stats.hp || 100
          })
        }

        // Initialize shared engine state
        const toEngineTeam = (teamArr: Pokemon[]) => teamArr.map(p => ({
          pokemon: {
            id: p.id,
            name: p.name,
            types: p.types.map(t => ({ type: { name: t } })) as any,
            stats: [
              { base_stat: p.stats.hp, stat: { name: 'hp' } } as any,
              { base_stat: p.stats.atk, stat: { name: 'attack' } } as any,
              { base_stat: p.stats.def, stat: { name: 'defense' } } as any,
              { base_stat: p.stats.spa, stat: { name: 'special-attack' } } as any,
              { base_stat: p.stats.spd, stat: { name: 'special-defense' } } as any,
              { base_stat: p.stats.spe, stat: { name: 'speed' } } as any
            ],
            abilities: (p as any).abilities ? (p as any).abilities.map((name: string) => ({ ability: { name }, is_hidden: false })) : [{ ability: { name: 'none' }, is_hidden: false }],
            moves: p.moves.map(m => ({ move: { name: m.id } })) as any,
            sprites: { front_default: '' } as any
          },
          level: p.level,
          moves: p.moves.map(m => ({ name: m.id })) as any
        }))

        const eng = initializeTeamBattle(
          toEngineTeam(playerTeamData) as any,
          toEngineTeam(opponentTeamData) as any,
          'Player', 'Opponent'
        )
        setEngineState(eng)

        // UI-local mirror for rendering
        setBattleState({
          phase: 'choosing',
          turn: 1,
          playerActive: playerTeamData[0] || null,
          opponentActive: opponentTeamData[0] || null,
          playerTeam: playerTeamData,
          opponentTeam: opponentTeamData,
          lastAction: '',
          battleLog: eng.battleLog.map(e => e.message),
          winner: null
        })

      } catch (err) {
        console.error('Failed to initialize battle:', err)
        setError(err instanceof Error ? err.message : 'Failed to initialize battle')
      } finally {
        setLoading(false)
      }
    }

    initializeBattle()
  }, [playerTeam, opponentChampion])

  // Prefetch tooltip data for the player's current moves
  useEffect(() => {
    const load = async () => {
      if (!battleState?.playerActive?.moves?.length) return
      const entries = await Promise.all(
        battleState.playerActive.moves.map(async (m) => {
          try {
            const mv: any = await getMove(m.id)
            const english = (mv.effect_entries || []).find((e: any) => e.language?.name === 'en')
            return [m.id, { type: mv.type?.name || 'normal', short_effect: english?.short_effect || english?.effect }]
          } catch {
            return [m.id, { type: 'normal' }]
          }
        })
      )
      const next: Record<string, { type: string; short_effect?: string }> = {}
      for (const [k, v] of entries) next[k as string] = v as any
      setMoveInfo(next)
    }
    load()
  }, [battleState?.playerActive?.moves])

  // Handle move selection
  const handleMoveSelection = useCallback(async (moveId: string) => {
    if (!battleState || !engineState || isAnimating || battleState.phase !== 'choosing') return
    // Prevent acting with a fainted active
    if (battleState.playerActive?.fainted || (battleState.playerActive && battleState.playerActive.currentHp <= 0)) return

    setIsAnimating(true)
    setBattleState(prev => (prev ? { ...prev, phase: 'resolving' } : prev))
    
    try {
      const playerAction: EngineAction = { type: 'move', moveId }
      const oppMove = battleState.opponentActive?.moves[Math.floor(Math.random() * battleState.opponentActive.moves.length)]
      const opponentMoveId = oppMove?.id || 'tackle'
      const opponentAction: EngineAction = { type: 'move', moveId: opponentMoveId }

      // Capture pre-turn HP to compute simple damage numbers for toasts
      const prevPlayer = engineState.player
      const prevOpp = engineState.opponent
      const prevPlayerCur = prevPlayer.pokemon[prevPlayer.currentIndex]
      const prevOppCur = prevOpp.pokemon[prevOpp.currentIndex]

      const next = await processBattleTurn(engineState, playerAction, opponentAction)
      setEngineState(next)

      // Emit toasts for both actions using engine-provided effectiveness
      if (typeof window !== 'undefined' && (window as any).__battle_toast) {
        const nextPlayerCur = next.player.pokemon[next.player.currentIndex]
        const nextOppCur = next.opponent.pokemon[next.opponent.currentIndex]
        const dealt = Math.max(0, (prevOppCur?.currentHp ?? 0) - (nextOppCur?.currentHp ?? 0))
        const taken = Math.max(0, (prevPlayerCur?.currentHp ?? 0) - (nextPlayerCur?.currentHp ?? 0))
        const lastDamage = [...next.battleLog].reverse().find(e => (e as any).type === 'damage_dealt') as any
        let effText = ''
        if (lastDamage?.effectiveness === 'super_effective') effText = "It's super effective!"
        else if (lastDamage?.effectiveness === 'not_very_effective') effText = "It's not very effective."
        else if (lastDamage?.effectiveness === 'no_effect') effText = 'It had no effect.'
        ;(window as any).__battle_toast({
          title: `You used ${moveId}`,
          message: `${dealt ? `Dealt ${dealt} damage. ` : ''}${effText}`.trim()
        })
        ;(window as any).__battle_toast({
          title: `${formatPokemonName(battleState.opponentActive?.name || 'Opponent')} used ${opponentMoveId}`,
          message: `${taken ? `Dealt ${taken} damage. ` : ''}`.trim()
        })
      }

      // Mirror engine state into UI state for rendering
      setBattleState(prev => {
        if (!prev || !next) return prev
        const playerTeamNext = next.player.pokemon
        const oppTeamNext = next.opponent.pokemon
        const playerCur = playerTeamNext[next.player.currentIndex]
        const oppCur = oppTeamNext[next.opponent.currentIndex]
        const mapActive = (
          cur: any,
          prevActive: Pokemon | null,
          prevTeam: Pokemon[]
        ): Pokemon | null => {
          if (!cur) return null
          const fromTeam = prevTeam.find(p => p.id === cur.pokemon.id) || undefined
          const base = (prevActive && prevActive.id === cur.pokemon.id) ? prevActive : (fromTeam || prevActive || null)
          return base ? { ...base, currentHp: cur.currentHp, maxHp: cur.maxHp, fainted: cur.currentHp <= 0 } : null
        }
        return {
          ...prev,
          phase: next.isComplete ? 'ended' : (next.phase === 'choice' ? 'choosing' : next.phase === 'resolution' ? 'resolving' : 'choosing'),
          turn: next.turn,
          battleLog: next.battleLog.map(e => e.message),
          playerActive: mapActive(playerCur, prev.playerActive, prev.playerTeam),
          opponentActive: mapActive(oppCur, prev.opponentActive, prev.opponentTeam || []),
          winner: next.isComplete ? (next.winner || null) : null
        }
      })

      // If battle ended, stop animating immediately
      if (next.isComplete) {
        setIsAnimating(false)
      }

      // Simple animation hint
      await new Promise(resolve => setTimeout(resolve, 600))
      
    } catch (err) {
      console.error('Failed to execute move:', err)
    } finally {
      setIsAnimating(false)
    }
  }, [battleState, isAnimating])

  // Handle Pokemon switch using proper battle engine
  const handlePokemonSwitch = useCallback(async (pokemonIndex: number) => {
    if (!battleState || !engineState || isAnimating || battleState.phase !== 'choosing') return

    setIsAnimating(true)
    setBattleState(prev => (prev ? { ...prev, phase: 'resolving' } : prev))
    
    try {
      // Use the proper battle engine to handle the switch
      const playerAction: EngineAction = { type: 'switch', switchIndex: pokemonIndex }
      
      // Generate AI move (random selection)
      const aiMoveIndex = Math.floor(Math.random() * (battleState.opponentActive?.moves.length || 1))
      const aiMove = battleState.opponentActive?.moves[aiMoveIndex]
      const aiMoveName = aiMove?.name || 'Tackle'
      const opponentAction: EngineAction = { type: 'move', moveId: aiMoveName }

      console.log('🔄 Switching to Pokemon at index:', pokemonIndex)
      console.log('🤖 AI will use move:', aiMoveName)

      // Process the turn using the battle engine
      const newEngineState = await processBattleTurn(engineState, playerAction, opponentAction)
      setEngineState(newEngineState)

      // Update the UI state based on the engine state
      const newPlayerActive = newEngineState.player.pokemon[newEngineState.player.currentIndex]
      const newOpponentActive = newEngineState.opponent.pokemon[newEngineState.opponent.currentIndex]

      setBattleState(prev => {
        if (!prev) return prev

        // Convert engine state to UI state
        const newPlayerTeam = newEngineState.player.pokemon.map(p => ({
          id: p.pokemon.id,
          name: p.pokemon.name,
          level: p.level,
          currentHp: p.currentHp,
          maxHp: p.maxHp,
          fainted: p.currentHp <= 0,
          moves: p.moves.map(m => ({ 
            id: m.id, 
            name: m.id, 
            type: 'normal', 
            power: 50, 
            accuracy: 100, 
            pp: m.pp 
          })),
          species: p.pokemon.name,
          types: p.pokemon.types?.map(t => t.type.name) || [],
          stats: {
            hp: p.maxHp,
            atk: 100, // Default values for AI battle
            def: 100,
            spa: 100,
            spd: 100,
            spe: 100
          }
        }))

        const newOpponentTeam = newEngineState.opponent.pokemon.map(p => ({
          id: p.pokemon.id,
          name: p.pokemon.name,
          level: p.level,
          currentHp: p.currentHp,
          maxHp: p.maxHp,
          fainted: p.currentHp <= 0,
          moves: p.moves.map(m => ({ 
            id: m.id, 
            name: m.id, 
            type: 'normal', 
            power: 50, 
            accuracy: 100, 
            pp: m.pp 
          })),
          species: p.pokemon.name,
          types: p.pokemon.types?.map(t => t.type.name) || [],
          stats: {
            hp: p.maxHp,
            atk: 100, // Default values for AI battle
            def: 100,
            spa: 100,
            spd: 100,
            spe: 100
          }
        }))

        return {
          ...prev,
          phase: newEngineState.phase === 'choice' ? 'choosing' : 'resolving',
          turn: newEngineState.turn,
          battleLog: newEngineState.battleLog.map(entry => entry.message),
          playerActive: newPlayerTeam[newEngineState.player.currentIndex],
          playerTeam: newPlayerTeam,
          opponentActive: newOpponentTeam[newEngineState.opponent.currentIndex],
          opponentTeam: newOpponentTeam,
          winner: newEngineState.winner || null,
          isComplete: newEngineState.isComplete
        }
      })

      // Animation delay for turn resolution
      await new Promise(resolve => setTimeout(resolve, 1500))
      
    } catch (err) {
      console.error('Failed to switch Pokemon:', err)
    } finally {
      setIsAnimating(false)
    }
  }, [battleState, engineState, isAnimating])

  // Handle forfeit
  const handleForfeit = useCallback(() => {
    setBattleState(prev => {
      if (!prev) return prev
      return {
        ...prev,
        winner: 'opponent',
        phase: 'ended',
        battleLog: [...prev.battleLog, 'You forfeited the battle!']
      }
    })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading battle...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">Error: {error}</p>
          <button 
            onClick={() => router.push('/battle')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Back to Battle Selection
          </button>
        </div>
      </div>
    )
  }

  if (!battleState) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Initializing battle...</p>
      </div>
    )
  }

  return (
    <div className={`h-screen bg-gradient-to-b from-blue-100 to-green-100 ${className}`}>
      {/* Battle Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold">
            Turn {battleState.turn} | Phase: {battleState.phase}
          </div>
          <div className="text-sm text-gray-600">
            vs {opponentChampion?.name || 'Unknown Trainer'}
          </div>
        </div>
      </div>

      {/* Battle Field */}
      <div className="flex-1 p-6">
        <div className="grid grid-cols-2 gap-8 h-full">
          {/* Player Side */}
          <div className="flex flex-col justify-center items-center">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-blue-600">Your Pokemon</h2>
            </div>
            {battleState.playerActive && (
              <BattleSprite
                ref={playerSpriteRef}
                species={battleState.playerActive.species}
                level={battleState.playerActive.level}
                hp={{ 
                  cur: battleState.playerActive.currentHp, 
                  max: battleState.playerActive.maxHp 
                }}
                status={battleState.playerActive.status}
                volatiles={{}}
                types={battleState.playerActive.types}
                side="player"
                field={{
                  safeguardTurns: 0,
                  mistTurns: 0,
                  reflectTurns: 0,
                  lightScreenTurns: 0
                }}
                className="transform scale-110"
                spriteMode={viewMode === 'animated' ? 'animated' : 'static'}
              />
            )}
          </div>

          {/* Opponent Side */}
          <div className="flex flex-col justify-center items-center">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-red-600">Opponent</h2>
            </div>
            {battleState.opponentActive && (
              <BattleSprite
                ref={opponentSpriteRef}
                species={battleState.opponentActive.species}
                level={battleState.opponentActive.level}
                hp={{ 
                  cur: battleState.opponentActive.currentHp, 
                  max: battleState.opponentActive.maxHp 
                }}
                status={battleState.opponentActive.status}
                volatiles={{}}
                types={battleState.opponentActive.types}
                side="opponent"
                field={{
                  safeguardTurns: 0,
                  mistTurns: 0,
                  reflectTurns: 0,
                  lightScreenTurns: 0
                }}
                className="transform scale-110"
                spriteMode={viewMode === 'animated' ? 'animated' : 'static'}
              />
            )}
          </div>
        </div>
      </div>

      {/* Resolving Phase Indicator */}
      {battleState.phase === 'resolving' && (
        <div className="bg-yellow-500/90 backdrop-blur-sm border-t border-yellow-400 p-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="animate-pulse text-white font-semibold">
              Resolving moves...
            </div>
          </div>
        </div>
      )}

      {/* Action Panel */}
      {battleState.phase === 'choosing' && (
        <div className="bg-white/90 backdrop-blur-sm border-t border-gray-200 p-4">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-lg font-semibold mb-4">Choose Your Action</h3>
            
            {/* Move Selection */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">Moves</h4>
              <div className="grid grid-cols-2 gap-3">
                {battleState.playerActive?.moves.map((move, index) => (
                  <button
                    key={index}
                    onClick={() => handleMoveSelection(move.id)}
                    disabled={isAnimating}
                    className="p-3 rounded-lg border-2 border-blue-500 bg-blue-50 hover:bg-blue-100 hover:border-blue-600 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="font-medium capitalize">
                      <Tooltip 
                        content={moveInfo[move.id]?.short_effect || ''} 
                        type={(moveInfo[move.id]?.type as any) || 'normal'} 
                        variant="move" 
                        position="top"
                        containViewport={false}
                        maxWidth="w-64"
                      >
                        <span className="cursor-help">{move.name}</span>
                      </Tooltip>
                    </div>
                    <div className="text-sm text-gray-600">PP: {move.pp}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Pokemon Switch */}
            <div className="mb-4">
              <h4 className="font-medium mb-3">Switch Pokemon</h4>
              <div className="grid grid-cols-3 gap-2">
                {battleState.playerTeam.map((pokemon, index) => (
                  <button
                    key={index}
                    onClick={() => handlePokemonSwitch(index)}
                    disabled={pokemon.fainted || isAnimating}
                    className={`p-2 rounded-lg border transition-all duration-200 ${
                      pokemon.fainted || isAnimating
                        ? 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-60'
                        : 'border-green-500 bg-green-50 hover:bg-green-100 hover:border-green-600'
                    }`}
                  >
                    <div className="text-sm font-medium capitalize truncate">
                      {formatPokemonName(pokemon.name)}
                    </div>
                    <div className="text-xs text-gray-600">
                      HP: {pokemon.currentHp}/{pokemon.maxHp}
                    </div>
                    {pokemon.fainted && (
                      <div className="text-xs text-red-600">Fainted</div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Forfeit Button */}
            <div className="text-center">
              <button
                onClick={handleForfeit}
                disabled={isAnimating}
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Forfeit Battle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Battle Log */}
      {battleState.battleLog.length > 0 && (
        <div className="bg-black/80 text-white p-4 text-sm font-mono max-h-32 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            {[...battleState.battleLog].slice().reverse().map((log, index) => (
              <div key={index} className={`${
                log.includes('Turn') ? 'text-yellow-400 font-bold' : 
                log.includes('used') ? 'text-blue-400' :
                log.includes('dealt') ? 'text-red-400' :
                log.includes('fainted') ? 'text-red-500 font-bold' :
                log.includes('won') || log.includes('lost') ? 'text-green-400 font-bold' :
                'text-green-400'
              }`}>
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Battle Complete */}
      {battleState.phase === 'ended' && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 text-center max-w-2xl w-full">
            <h2 className="text-3xl font-bold mb-4">
              {battleState.winner === 'player' ? 'Victory!' : 'Defeat!'}
            </h2>
            <p className="text-lg mb-4">
              {battleState.winner === 'player'
                ? 'You won the battle!'
                : 'You lost the battle!'}
            </p>
            {/* Battle log summary below the result */}
            {battleState.battleLog.length > 0 && (
              <div className="text-left mb-6">
                <h3 className="text-base font-semibold mb-2">Battle Log</h3>
                <div className="bg-gray-100 border border-gray-200 rounded p-3 max-h-60 overflow-y-auto font-mono text-xs">
                  {[...battleState.battleLog].slice().reverse().map((log, idx) => (
                    <div key={idx} className="mb-0.5">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <button
                onClick={() => router.push('/battle')}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Battle Again
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Back to PokéDex
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
