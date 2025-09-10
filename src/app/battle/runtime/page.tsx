"use client";

import { useEffect, useState, useCallback, useRef, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, MessageCircle } from "lucide-react";
import Image from "next/image";
import { getPokemon, getMove, getPokemonSpriteUrl } from "@/lib/api";
import { Move } from "@/types/pokemon";
import { GYM_CHAMPIONS } from "@/lib/gym_champions";
import { 
  BattleState as TeamBattleState,
  initializeTeamBattle,
  executeTeamAction,
  getCurrentPokemon,
  handleAutomaticSwitching,
  handleMultiplayerSwitching,
  switchToSelectedPokemon,
  bothPlayersSelectedMoves
} from "@/lib/team-battle-engine";
import TypeBadge from "@/components/TypeBadge";
import HealthBar from "@/components/HealthBar";
import Chat from "@/components/Chat";
import BattleOverDialog from "@/components/BattleOverDialog";
import { ToastContainer, useToast } from "@/components/Toast";
import { chatService } from "@/lib/chatService";
import { battleService, type MultiplayerBattleState } from '@/lib/battleService';
import { useAuth } from "@/contexts/AuthContext";
import { type MoveData } from '@/lib/userTeams';

const STORAGE_KEY = "pokemon-team-builder";

type SavedTeam = { 
  id: string; 
  name: string; 
  slots: Array<{ id: number | null; level: number; moves: unknown[] }>; 
};

function BattleRuntimePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { toasts, removeToast } = useToast();
  
  const [battleState, setBattleState] = useState<TeamBattleState | null>(null);
  const lastBattleStateJSONRef = useRef<string>('');

  const setBattleStateIfChanged = useCallback((next: TeamBattleState) => {
    try {
      const serialized = JSON.stringify(next);
      if (serialized !== lastBattleStateJSONRef.current) {
        console.log('=== BATTLE STATE UPDATE ===');
        console.log('Previous battle log length:', battleState?.battleLog?.length || 0);
        console.log('New battle log length:', next.battleLog?.length || 0);
        console.log('Previous turn number:', battleState?.turnNumber);
        console.log('New turn number:', next.turnNumber);
        console.log('State changed, updating battle state');
        lastBattleStateJSONRef.current = serialized;
        setBattleState(next);
      } else {
        console.log('=== BATTLE STATE NO CHANGE ===');
        console.log('Battle state unchanged, skipping update');
        console.log('Current battle log length:', battleState?.battleLog?.length || 0);
        console.log('New battle log length:', next.battleLog?.length || 0);
      }
    } catch (error) {
      console.error('Error in setBattleStateIfChanged:', error);
      // Fallback: if serialization fails, still set once
      setBattleState(next);
    }
  }, []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [selectedMove, setSelectedMove] = useState<number | null>(null);
  const [isAITurn, setIsAITurn] = useState(false);
  const [switchingInProgress, setSwitchingInProgress] = useState(false);
  const [showBattleResults, setShowBattleResults] = useState(false);
  const [battleReady, setBattleReady] = useState(false);
  const [bothPlayersReady, setBothPlayersReady] = useState(false);
  const battleLogRef = useRef<HTMLDivElement>(null);

  // Memoize battle state dependencies to prevent useEffect issues
  // Stable string snapshots to avoid effect dependency loops
  const playerHpString = useMemo(() => {
    if (!battleState) return '';
    return battleState.player.pokemon.map(p => p.currentHp).join(',');
  }, [battleState]);
  
  const opponentHpString = useMemo(() => {
    if (!battleState) return '';
    return battleState.opponent.pokemon.map(p => p.currentHp).join(',');
  }, [battleState]);
  
  const playerIdString = useMemo(() => {
    if (!battleState) return '';
    return battleState.player.pokemon.map(p => p.pokemon.id).join(',');
  }, [battleState]);
  
  const opponentIdString = useMemo(() => {
    if (!battleState) return '';
    return battleState.opponent.pokemon.map(p => p.pokemon.id).join(',');
  }, [battleState]);
  
  const playerDebugString = useMemo(() => {
    if (!battleState) return '';
    return battleState.player.pokemon.map(p => `${p.pokemon.name}-${p.currentHp}`).join(',');
  }, [battleState]);
  
  // Animation states
  const [playerAnimation, setPlayerAnimation] = useState<'enter' | 'idle' | 'faint'>('idle');
  const [opponentAnimation, setOpponentAnimation] = useState<'enter' | 'idle' | 'faint'>('idle');
  const [previousPlayerId, setPreviousPlayerId] = useState<number | null>(null);
  const [previousOpponentId, setPreviousOpponentId] = useState<number | null>(null);

  // Multiplayer and chat states
  const [showChat, setShowChat] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastReadAtRef = useRef<number>(Date.now());
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [multiplayerBattle, setMultiplayerBattle] = useState<MultiplayerBattleState | null>(null);
  const [battleId, setBattleId] = useState<string | null>(null);
  const [hostName, setHostName] = useState<string>('Host');
  const [guestName, setGuestName] = useState<string>('Guest');
  const lastBattleUpdatedAtRef = useRef<number>(0);
  const teamFlippingAppliedRef = useRef<boolean>(false);
  const lastAppliedTurnNumberRef = useRef<number>(0);
  const initialBattleStateSetRef = useRef<boolean>(false);

  const playerTeamId = searchParams.get("player");
  const opponentKind = searchParams.get("opponentKind");
  const opponentId = searchParams.get("opponentId");
  const multiplayerRoomId = searchParams.get("roomId");
  const isHostParam = searchParams.get("isHost");
  const userRole = searchParams.get("role"); // "host" or "guest"
  const userId = searchParams.get("userId");
  const userName = searchParams.get("userName");
  const pokemonListParam = searchParams.get("pokemonList");
  // const multiplayerTeamId = searchParams.get("teamId");

  // Initialize multiplayer mode (avoid unstable object deps)
  const urlBattleId = searchParams.get("battleId");
  const urlRoomId = searchParams.get("roomId");
  useEffect(() => {
    if (multiplayerRoomId || urlBattleId) {
      setIsMultiplayer(true);
      if (multiplayerRoomId) setRoomId(multiplayerRoomId);
      if (urlBattleId) {
        setBattleId(urlBattleId);
        console.log('Multiplayer battle initialized', { multiplayerRoomId, urlBattleId });
      }
    }
  }, [multiplayerRoomId, urlBattleId]);

  // Listen to multiplayer battle changes (gate on auth and brief backoff if needed)
  useEffect(() => {
    if (!battleId || !isMultiplayer || authLoading || !user) return;

    let unsubscribe: (() => void) | null = null;
    let attempts = 0;
    const maxAttempts = 5;
    const baseDelayMs = 200;

    const trySubscribe = () => {
      attempts += 1;
      try {
        unsubscribe = battleService.onBattleChange(battleId, async (battle) => {
          if (!battle) return;

          // Skip processing if this snapshot doesn't represent a newer update
          const updatedAt = battle.updatedAt instanceof Date ? battle.updatedAt.getTime() : Date.now();
          if (updatedAt === lastBattleUpdatedAtRef.current) return;
          lastBattleUpdatedAtRef.current = updatedAt;

          console.log('📡 === FIREBASE BATTLE UPDATE RECEIVED ===');
          console.log('👤 Current user:', user?.displayName || user?.uid || 'Anonymous');
          console.log('🆔 Battle ID:', battle.id);
          console.log('📊 Battle status:', battle.status);
          console.log('🔄 Turn number:', battle.turnNumber);
          console.log('👥 Current turn:', battle.currentTurn);
          console.log('📝 Moves count:', battle.moves?.length || 0);
          console.log('🎮 Battle data exists:', !!battle.battleData);

          // Only update local state if something meaningful changed
          setMultiplayerBattle(prev => {
            try {
              const a = prev ? JSON.stringify({
                id: prev.id,
                status: prev.status,
                currentTurn: prev.currentTurn,
                turnNumber: prev.turnNumber
              }) : '';
              const b = JSON.stringify({
                id: battle.id,
                status: battle.status,
                currentTurn: battle.currentTurn,
                turnNumber: battle.turnNumber
              });
              if (a === b) {
                return prev;
              }
            } catch {}
            return battle;
          });

          // If battle data exists, update the local battle state and align perspective/turn to local user
          if (battle.battleData && battle.status === 'active') {
            // Apply server updates for battle progression (moves, turns, etc.)
            // Skip only if this is the same turn number we've already applied AND no battle data changes
            const serverData = battle.battleData as TeamBattleState;
            const hasBattleDataChanges = serverData && (
              serverData.selectedMoves !== battleState?.selectedMoves ||
              serverData.phase !== battleState?.phase ||
              serverData.executionQueue?.length !== battleState?.executionQueue?.length ||
              serverData.battleLog?.length !== battleState?.battleLog?.length
            );
            
            const shouldApplyServerUpdate = !initialBattleStateSetRef.current || 
              (battle.turnNumber && battle.turnNumber > lastAppliedTurnNumberRef.current) ||
              (battle.battleData && battle.status === 'active' && battle.turnNumber !== lastAppliedTurnNumberRef.current) ||
              hasBattleDataChanges;
            
            console.log('🔄 === SERVER UPDATE EVALUATION ===');
            console.log('👤 Current user:', user?.displayName || user?.uid || 'Anonymous');
            console.log('🏁 Initial battle state set:', initialBattleStateSetRef.current);
            console.log('🔄 Battle turn number:', battle.turnNumber);
            console.log('📊 Last applied turn number:', lastAppliedTurnNumberRef.current);
            console.log('📊 Battle status:', battle.status);
            console.log('🎮 Battle data exists:', !!battle.battleData);
            console.log('🔄 Battle data turn number:', (battle.battleData as TeamBattleState)?.turnNumber);
            console.log('🔍 Has battle data changes:', hasBattleDataChanges);
            console.log('✅ Should apply server update:', shouldApplyServerUpdate);
            console.log('📊 Has battle state:', !!battleState);
            
            // Log the server battle data phase information
            console.log('🔄 Server phase:', serverData.phase);
            console.log('📊 Server selected moves:', serverData.selectedMoves);
            console.log('⚡ Server execution queue length:', serverData.executionQueue?.length || 0);
            
            if (shouldApplyServerUpdate) {
              // Apply server updates to ensure proper synchronization
              
              try {
                if (battle.hostName) setHostName(battle.hostName);
                if (battle.guestName) setGuestName(battle.guestName);

                console.log('🔄 === APPLYING SERVER UPDATE (FULL SYNC) ===');
                console.log('👤 Current user:', user?.displayName || user?.uid || 'Anonymous');
                console.log('📡 Applying complete server state for proper move synchronization');
                console.log('📝 Server battle log length:', serverData.battleLog?.length || 0);
                console.log('🔄 Server turn number:', serverData.turnNumber);
                console.log('✅ Server is complete:', serverData.isComplete);
                console.log('🔄 Server phase:', serverData.phase);
                console.log('📊 Server selected moves:', serverData.selectedMoves);
                console.log('⚡ Server execution queue length:', serverData.executionQueue?.length || 0);

                // Always merge server updates with local state to preserve team positioning
                // while ensuring battle progression is synchronized
                console.log('🔀 Merging server update with local state for proper synchronization');
                
                let synchronizedState: TeamBattleState;
                
                if (battleState) {
                  // Merge with existing local state to preserve team positioning
                  synchronizedState = {
                    ...serverData,
                    // Preserve local team positioning but update battle progression data
                    player: {
                      ...serverData.player,
                      pokemon: battleState.player.pokemon.map((localPokemon, index) => {
                        const serverPokemon = serverData.player?.pokemon?.[index];
                        if (serverPokemon) {
                          return {
                            ...localPokemon, // Preserve local Pokemon data (name, moves, etc.)
                            currentHp: serverPokemon.currentHp,
                            status: serverPokemon.status,
                            statModifiers: serverPokemon.statModifiers || localPokemon.statModifiers,
                          };
                        }
                        return localPokemon;
                      })
                    },
                    opponent: {
                      ...serverData.opponent,
                      pokemon: battleState.opponent.pokemon.map((localPokemon, index) => {
                        const serverPokemon = serverData.opponent?.pokemon?.[index];
                        if (serverPokemon) {
                          return {
                            ...localPokemon, // Preserve local Pokemon data (name, moves, etc.)
                            currentHp: serverPokemon.currentHp,
                            status: serverPokemon.status,
                            statModifiers: serverPokemon.statModifiers || localPokemon.statModifiers,
                          };
                        }
                        return localPokemon;
                      })
                    },
                    // Preserve phase system data from server
                    phase: serverData.phase || 'selection',
                    selectedMoves: serverData.selectedMoves || {},
                    executionQueue: serverData.executionQueue || []
                  };
                } else {
                  // No local state: align server (host-perspective) data to local user's perspective
                  console.log('📡 No local battle state; aligning server data to local perspective');
                  const isHostUser = Boolean(user?.uid && battle.hostId && user.uid === battle.hostId);

                  const normalizeState = (state: TeamBattleState, hostView: boolean): TeamBattleState => {
                    if (hostView) {
                      return {
                        ...state,
                        phase: state.phase || 'selection',
                        selectedMoves: state.selectedMoves || {},
                        executionQueue: state.executionQueue || []
                      } as TeamBattleState;
                    }
                    // Guest viewing host-authored state: swap sides so local user is always `player`
                    return {
                      ...state,
                      player: { ...state.opponent },
                      opponent: { ...state.player },
                      // Remap any selection bookkeeping
                      selectedMoves: {
                        player: state.selectedMoves?.opponent,
                        opponent: state.selectedMoves?.player
                      },
                      phase: state.phase || 'selection',
                      executionQueue: state.executionQueue || []
                    } as TeamBattleState;
                  };

                  synchronizedState = normalizeState(serverData, isHostUser);
                }

                console.log('✅ Synchronized state applied successfully');
                console.log('👤 Current user:', user?.displayName || user?.uid || 'Anonymous');
                console.log('📝 Battle log entries:', synchronizedState.battleLog?.length || 0);
                console.log('📝 Battle log content:', synchronizedState.battleLog);
                console.log('🔄 Turn number:', synchronizedState.turnNumber);
                console.log('🔄 Phase:', synchronizedState.phase);
                console.log('📊 Selected moves:', synchronizedState.selectedMoves);
                console.log('⚡ Execution queue length:', synchronizedState.executionQueue?.length || 0);
                console.log('👥 Turn:', synchronizedState.turn);
                console.log('❤️ Player HP:', synchronizedState.player?.pokemon?.[0]?.currentHp);
                console.log('❤️ Opponent HP:', synchronizedState.opponent?.pokemon?.[0]?.currentHp);
                console.log('📊 Previous battle state log length:', battleState?.battleLog?.length || 0);
                console.log('📊 New battle state log length:', synchronizedState.battleLog?.length || 0);
                
                setBattleStateIfChanged(synchronizedState);
              } catch (error) {
                console.error('Error applying server update:', error);
                // Fallback to local state if sync fails (only if we have local state)
                if (battleState) {
                  setBattleStateIfChanged(battleState);
                }
                return;
              }
              
              // Track the latest server-applied turn number to gate move UI
              lastAppliedTurnNumberRef.current = battle.turnNumber || 0;
              console.log('✅ Server update applied successfully with team positioning preserved');
            }
          }

          // Authoritative resolution: host resolves when both moves submitted for current turn
          try {
            const isHostUser = Boolean(user?.uid && battle.hostId && user.uid === battle.hostId);
            const currentTurnNumber = battle.turnNumber || 1;
            const movesThisTurn = (battle.moves || []).filter(m => m.turnNumber === currentTurnNumber);

            // Only the host runs resolution to avoid double execution
            if (isHostUser && battle.status === 'active' && movesThisTurn.length >= 2) {
              console.log('🧮 Host resolving turn', currentTurnNumber, 'with moves:', movesThisTurn);
              // Ensure we have local battle state to operate on
              const baseState: TeamBattleState | null = (battle.battleData as TeamBattleState) || battleState;
              if (baseState && baseState.phase === 'selection') {
                // Map Firebase moves to player/opponent actions based on actual IDs
                const hostMove = movesThisTurn.find(m => m.playerId === battle.hostId);
                const guestMove = movesThisTurn.find(m => m.playerId === battle.guestId);
                if (hostMove && guestMove) {
                  let working = { ...baseState, battleLog: [...baseState.battleLog] } as TeamBattleState;
                  // Host is always the player perspective in server battleData we maintain
                  working = await executeTeamAction(working, { type: 'move', moveIndex: hostMove.moveIndex }, true);
                  working = await executeTeamAction(working, { type: 'move', moveIndex: guestMove.moveIndex }, false);

                  // If execution already advanced (both selected), the above calls may have executed to end-of-turn
                  // Persist results and advance server turn bookkeeping
                  const nextTurn = (battle.turnNumber || 1) + 1;
                  const nextCurrentTurn: 'host' | 'guest' = battle.currentTurn === 'host' ? 'guest' : 'host';

                  await battleService.updateBattle(battle.id, {
                    battleData: working as unknown,
                    turnNumber: nextTurn,
                    currentTurn: nextCurrentTurn,
                    moves: []
                  });

                  console.log('✅ Host wrote resolved battle state for turn', currentTurnNumber, '-> next turn', nextTurn);
                }
              }
            }
          } catch (resolveErr) {
            console.error('Error during host turn resolution:', resolveErr);
          }
          
          // Advance local turn marker to match server if it changed
          setMultiplayerBattle(prev => {
            if (!prev) return battle;
            if (prev.currentTurn !== battle.currentTurn || prev.turnNumber !== battle.turnNumber) {
              return { ...battle } as MultiplayerBattleState;
            }
            return prev;
          });

          // If battle is completed, handle end
          if (battle.status === 'completed') {
            console.log('Battle completed! Winner:', battle.winner);
          }
        });
      } catch (e) {
        if (attempts < maxAttempts) {
          const delay = baseDelayMs * attempts;
          setTimeout(trySubscribe, delay);
        }
      }
    };

    trySubscribe();

    return () => {
      lastBattleUpdatedAtRef.current = 0;
      if (unsubscribe) unsubscribe();
    };
  }, [battleId, isMultiplayer, authLoading, user]);

  // Teams are now correctly assigned at initialization, no need for runtime alignment

  // Monitor when both players are ready for battle
  useEffect(() => {
    if (!isMultiplayer || !multiplayerBattle || !battleReady) return;
    
    // Check if both players are in the battle by looking at the battle data
    // Both players are ready when the battle has been started by both
    const hasHostTeam = Boolean(multiplayerBattle.hostTeam);
    const hasGuestTeam = Boolean(multiplayerBattle.guestTeam);
    const battleIsActive = multiplayerBattle.status === 'active';
    const battleIsWaiting = multiplayerBattle.status === 'waiting';
    
    // Consider both players ready if they have teams and battle is either active or waiting
    const bothReady = hasHostTeam && hasGuestTeam && (battleIsActive || battleIsWaiting);
    
    console.log('=== BOTH PLAYERS READY CHECK ===');
    console.log('Has host team:', hasHostTeam, 'Team data:', multiplayerBattle.hostTeam);
    console.log('Has guest team:', hasGuestTeam, 'Team data:', multiplayerBattle.guestTeam);
    console.log('Battle is active:', battleIsActive, 'Battle is waiting:', battleIsWaiting, 'Status:', multiplayerBattle.status);
    console.log('Both players ready:', bothReady);
    console.log('Current turn:', multiplayerBattle.currentTurn);
    console.log('Turn number:', multiplayerBattle.turnNumber);
    console.log('Battle ready flag:', battleReady);
    
    setBothPlayersReady(bothReady);
  }, [isMultiplayer, multiplayerBattle, battleReady]);

  // Track unread messages for badge
  useEffect(() => {
    if (!isMultiplayer || !roomId) return;
    const unsubscribe = chatService.onMessagesChange(roomId, (messages) => {
      const lastRead = lastReadAtRef.current;
      const unread = messages.filter(m => (m.timestamp?.getTime?.() || 0) > lastRead).length;
      setUnreadCount(unread);
    });
    return () => unsubscribe();
  }, [isMultiplayer, roomId]);

  // Animation class helpers
  const getPlayerAnimationClasses = () => {
    switch (playerAnimation) {
      case 'enter':
        return 'animate-slide-in-left';
      case 'faint':
        return 'animate-faint-down';
      default:
        return '';
    }
  };

  const getOpponentAnimationClasses = () => {
    switch (opponentAnimation) {
      case 'enter':
        return 'animate-slide-in-right';
      case 'faint':
        return 'animate-faint-down';
      default:
        return '';
    }
  };

  // Auto-scroll battle log to top when it updates (since newest entries are at top)
  useEffect(() => {
    if (battleLogRef.current && battleState?.battleLog) {
      battleLogRef.current.scrollTop = 0;
    }
  }, [battleState?.battleLog]);

  // Handle Pokémon change animations
  useEffect(() => {
    if (!battleState) return;

    const currentPlayer = getCurrentPokemon(battleState.player);
    const currentOpponent = getCurrentPokemon(battleState.opponent);

    // Check if player Pokémon changed
    if (previousPlayerId !== null && previousPlayerId !== currentPlayer.pokemon.id) {
      // New Pokémon entered
      setPlayerAnimation('enter');
      setTimeout(() => setPlayerAnimation('idle'), 800);
    } else if (previousPlayerId === null) {
      // Initial Pokémon
      setPlayerAnimation('enter');
      setTimeout(() => setPlayerAnimation('idle'), 800);
    }

    // Check if opponent Pokémon changed
    if (previousOpponentId !== null && previousOpponentId !== currentOpponent.pokemon.id) {
      // New Pokémon entered
      setOpponentAnimation('enter');
      setTimeout(() => setOpponentAnimation('idle'), 800);
    } else if (previousOpponentId === null) {
      // Initial Pokémon
      setOpponentAnimation('enter');
      setTimeout(() => setOpponentAnimation('idle'), 800);
    }

    // Check for fainting
    if (currentPlayer.currentHp <= 0 && playerAnimation !== 'faint') {
      setPlayerAnimation('faint');
    }
    if (currentOpponent.currentHp <= 0 && opponentAnimation !== 'faint') {
      setOpponentAnimation('faint');
    }

    setPreviousPlayerId(currentPlayer.pokemon.id);
    setPreviousOpponentId(currentOpponent.pokemon.id);
  }, [
    battleState?.player?.currentIndex,
    battleState?.opponent?.currentIndex,
    playerIdString,
    opponentIdString,
    previousPlayerId, 
    previousOpponentId, 
    playerAnimation, 
    opponentAnimation
  ]);

  // Removed automatic switching logic to prevent infinite loops

  // Debug logging for Pokémon changes
  useEffect(() => {
    if (!battleState) return;
    
    const player = getCurrentPokemon(battleState.player);
    const playerTeam = battleState.player;
    
    console.log('Current player Pokémon:', {
      name: player.pokemon.name,
      hp: `${player.currentHp}/${player.maxHp}`,
      currentIndex: playerTeam.currentIndex,
      faintedCount: playerTeam.faintedCount,
      teamSize: playerTeam.pokemon.length
    });
  }, [
    battleState?.player?.currentIndex,
    playerDebugString
  ]);

  // Show battle results dialog when battle is complete
  useEffect(() => {
    if (battleState?.isComplete && !showBattleResults) {
      setShowBattleResults(true);
    }
  }, [battleState?.isComplete, showBattleResults]);

  // Handle AI move selection during selection phase (single-player only)
  useEffect(() => {
    if (isMultiplayer) return; // Never run AI in multiplayer
    if (!battleState || battleState.isComplete || isAITurn || switchingInProgress) return;
    
    // Only run AI during selection phase when opponent hasn't selected a move yet
    if (battleState.phase === 'selection' && !battleState.selectedMoves.opponent) {
      const currentOpponent = getCurrentPokemon(battleState.opponent);
      if (currentOpponent.currentHp > 0) {
        console.log('=== AI MOVE SELECTION TRIGGERED ===');
        console.log('Opponent Pokemon:', currentOpponent.pokemon.name, 'HP:', currentOpponent.currentHp);
        console.log('Player has selected move:', !!battleState.selectedMoves.player);
        
        setIsAITurn(true);
        
        // Add a small delay to make the AI selection visible
        setTimeout(async () => {
          try {
            const aiMoveIndex = Math.floor(Math.random() * currentOpponent.moves.length);
            console.log('AI selecting move:', aiMoveIndex, currentOpponent.moves[aiMoveIndex]?.name);
            const newState = await executeTeamAction(battleState, { type: 'move', moveIndex: aiMoveIndex }, false);
            setBattleStateIfChanged(newState);
          } catch (err) {
            console.error("AI move selection failed:", err);
          } finally {
            setIsAITurn(false);
          }
        }, 1000); // 1 second delay
      }
    }
  }, [isMultiplayer, battleState?.phase, battleState?.selectedMoves, isAITurn, switchingInProgress]);

  // Handle execution phase when both players have selected moves
  useEffect(() => {
    if (!battleState || battleState.isComplete || switchingInProgress) return;
    
    // If we're in execution phase and there are actions to execute
    if (battleState.phase === 'execution' && battleState.executionQueue.length > 0) {
      console.log('⚡ === EXECUTION PHASE TRIGGERED ===');
      console.log('👤 Current user:', user?.displayName || user?.uid || 'Anonymous');
      console.log('⚡ Execution queue length:', battleState.executionQueue.length);
      console.log('⚡ Execution queue:', battleState.executionQueue);
      console.log('📊 Selected moves:', battleState.selectedMoves);
      console.log('🔄 Current phase:', battleState.phase);
      
      // Execute the next action with a delay for visual effect
      setTimeout(async () => {
        try {
          const newState = await executeTeamAction(battleState, { type: 'execute' });
          console.log('⚡ === EXECUTION RESULT ===');
          console.log('👤 Current user:', user?.displayName || user?.uid || 'Anonymous');
          console.log('🔄 New phase:', newState.phase);
          console.log('⚡ Remaining queue length:', newState.executionQueue.length);
          console.log('📊 Updated selected moves:', newState.selectedMoves);
          setBattleStateIfChanged(newState);
        } catch (err) {
          console.error("❌ Action execution failed:", err);
        }
      }, 1500); // 1.5 second delay for execution
    }
  }, [battleState?.phase, battleState?.executionQueue.length, switchingInProgress]);

  // Removed direct HP monitoring to prevent infinite loops

  const initializeBattleState = useCallback(async () => {
    try {
      console.log('Starting battle initialization...');
      setLoading(true);
      setError(null);

      // Resolve multiplayer mode from URL directly to avoid race conditions
      const urlRoomId = searchParams.get("roomId");
      const urlBattleId = searchParams.get("battleId");
      const effectiveIsMultiplayer = isMultiplayer || Boolean(urlRoomId || urlBattleId);
      const effectiveBattleId = battleId || urlBattleId || null;

        // Handle multiplayer battles
        if (effectiveIsMultiplayer) {
          // Ensure we have a battleId before proceeding
          if (!effectiveBattleId) {
            // Wait for URL/listener to provide battleId
            return;
          }
          // Ensure we have battle metadata; fetch once if listener hasn't populated yet
          let battleMeta = multiplayerBattle;
          if (!battleMeta) {
            if (!effectiveBattleId) {
              throw new Error('Missing battle ID for multiplayer battle');
            }
            try {
              const fetched = await battleService.getBattle(effectiveBattleId);
              if (fetched) {
                battleMeta = fetched;
                setMultiplayerBattle(fetched);
              } else {
                throw new Error('Battle not found');
              }
            } catch (e) {
              // If we cannot fetch yet (e.g., permissions), wait for snapshot listener
              console.warn('Waiting for battle snapshot, could not fetch immediately:', e);
              return; // exit init now; listener will re-run init next effect tick
            }
          }

          // If after fetch we still don't have meta, wait
          if (!battleMeta) {
            return;
          }
          
          // Ensure both teams are present before proceeding
          if (!battleMeta.hostTeam || !battleMeta.guestTeam) {
            console.log('Waiting for both teams to be present in battle data...');
            return; // Wait for both teams to be available
          }
        console.log('Initializing multiplayer battle...');
        console.log('=== BATTLE INITIALIZATION DEBUG ===');
        console.log('Battle meta:', battleMeta);
        console.log('User:', user);
        console.log('Is multiplayer:', isMultiplayer);
        
        // Get team data from URL parameters instead of Firebase
        const isHost = userRole === 'host';
        let playerTeam, opponentTeam;
        
        if (pokemonListParam) {
          // Use Pokemon list from URL parameters
          const userPokemonList = JSON.parse(pokemonListParam);
          const userTeam = {
            id: `user_${userId}`,
            name: `${userName}'s Team`,
            slots: userPokemonList.map((pokemon: any) => ({
              id: pokemon.id,
              level: pokemon.level,
              moves: pokemon.moves || []
            }))
          };
          
          // CRITICAL FIX: Each player should get their own team as playerTeam
          // and the opponent's team as opponentTeam
          if (isHost) {
            // Host uses their URL team as playerTeam, guest team from Firebase as opponentTeam
            playerTeam = userTeam;
            opponentTeam = battleMeta.guestTeam;
          } else {
            // Guest uses their URL team as playerTeam, host team from Firebase as opponentTeam
            playerTeam = userTeam;
            opponentTeam = battleMeta.hostTeam;
          }
        } else {
          // Fallback to Firebase data if URL params not available
          playerTeam = isHost ? battleMeta.hostTeam : battleMeta.guestTeam;
          opponentTeam = isHost ? battleMeta.guestTeam : battleMeta.hostTeam;
        }
        
        console.log('=== TEAM ASSIGNMENT DEBUG ===');
        console.log('User UID:', user?.uid);
        console.log('Battle hostId:', battleMeta.hostId);
        console.log('Battle guestId:', battleMeta.guestId);
        console.log('User role from URL:', userRole);
        console.log('Is host param:', isHostParam);
        console.log('Is host (calculated):', isHost);
        console.log('URL params:', { roomId: multiplayerRoomId, battleId: urlBattleId, role: userRole, isHost: isHostParam });
        console.log('Host team data:', battleMeta.hostTeam);
        console.log('Guest team data:', battleMeta.guestTeam);
        console.log('Player team (assigned):', playerTeam);
        console.log('Opponent team (assigned):', opponentTeam);
        
        // Check if both teams are the same (this would be the bug)
        if (JSON.stringify(battleMeta.hostTeam) === JSON.stringify(battleMeta.guestTeam)) {
          console.error('🚨 BUG DETECTED: Host and guest teams are identical!');
          console.error('This means both players will see the same Pokémon');
        }
        
        // Additional validation: Check if assigned teams are different
        if (JSON.stringify(playerTeam) === JSON.stringify(opponentTeam)) {
          console.error('🚨 CRITICAL BUG: Player and opponent teams are identical!');
          console.error('Player team:', playerTeam);
          console.error('Opponent team:', opponentTeam);
          console.error('This will cause both players to have the same Pokémon!');
        }
        
        if (!playerTeam || !opponentTeam) {
          throw new Error("Team data not available for multiplayer battle");
        }
        
        // Team validation: when using URL parameters, we expect the user's team to be different from Firebase
        // since we're using the URL team for the current user and Firebase team for the opponent
        console.log('Team assignment validation:');
        console.log('User team (from URL):', playerTeam);
        console.log('Opponent team (from Firebase):', opponentTeam);
        
        // Convert SavedTeam to the format expected by initializeTeamBattle
        const convertTeamForBattle = async (team: SavedTeam) => {
          const battleTeam = [] as Array<{ pokemon: any; level: number; moves: Move[] }>; 
          for (const slot of team.slots) {
            if (!slot?.id) continue;
              try {
                const pokemon = await getPokemon(slot.id);
              // Always resolve moves by name to ensure correct per-player move sets
              const moveNames: string[] = Array.isArray(slot.moves)
                ? slot.moves.map((m: any) => (typeof m === 'string' ? m : (m?.name || ''))).filter(Boolean)
                : [];
              const resolvedMovesResults = await Promise.allSettled(moveNames.map((n) => getMove(n)));
              const resolvedMoves: Move[] = resolvedMovesResults
                .filter((r): r is PromiseFulfilledResult<Move> => r.status === 'fulfilled' && !!r.value)
                .map((r) => r.value);
              // Basic fallback if no valid moves
              const fallback: Move[] = resolvedMoves.length > 0 ? resolvedMoves : [
                { id: 1, name: 'tackle', accuracy: 100, effect_chance: null, pp: 35, priority: 0, power: 40, contest_combos: { normal: { use_before: [], use_after: [] }, super: { use_before: [], use_after: [] } }, contest_effect: { name: 'tough', url: '' }, contest_type: { name: 'tough', url: '' }, damage_class: { name: 'physical', url: '' }, effect_entries: [{ effect: 'Deals damage', language: { name: 'en', url: '' }, short_effect: 'Deals damage' }], effect_changes: [], learned_by_pokemon: [], flavor_text_entries: [], generation: { name: 'generation-i', url: '' }, machines: [], meta: { ailment: { name: 'none', url: '' }, ailment_chance: 0, category: { name: 'damage', url: '' }, crit_rate: 0, drain: 0, flinch_chance: 0, healing: 0, max_hits: null, max_turns: null, min_hits: null, min_turns: null, stat_chance: 0 }, names: [{ language: { name: 'en', url: '' }, name: 'tackle' }], past_values: [], stat_changes: [], super_contest_effect: { name: 'tough', url: '' }, target: { name: 'selected-pokemon', url: '' }, type: { name: 'normal', url: '' } } as unknown as Move
              ];
                battleTeam.push({
                  pokemon,
                  level: slot.level,
                moves: fallback
                });
              } catch (error) {
                console.error(`Failed to load Pokemon ${slot.id}:`, error);
            }
          }
          return battleTeam;
        };

        // Initialize battle with converted teams
        const playerBattleTeam = await convertTeamForBattle(playerTeam as SavedTeam);
        const opponentBattleTeam = await convertTeamForBattle(opponentTeam as SavedTeam);
        
        const battleState = await initializeTeamBattle(
          playerBattleTeam,
          opponentBattleTeam
        );
        
        // Apply role-based positioning: 
        // - Guest sees their Pokemon in back (player position) and host Pokemon in front (opponent position)
        // - Host sees their Pokemon in back (player position) and guest Pokemon in front (opponent position)
        // The battle state is already correctly assigned based on the URL parameters
        setBattleStateIfChanged(battleState);
        initialBattleStateSetRef.current = true;
        
        // Start the battle in Firestore
        if (effectiveBattleId) {
          await battleService.startBattle(effectiveBattleId, battleState as unknown);
        }
        
        // Mark this player as ready for battle
        setBattleReady(true);
        
        setLoading(false);
        return;
      }

      // Single player battle logic
      if (!playerTeamId || !opponentKind || !opponentId) {
        throw new Error("Missing battle parameters");
      }

      // Load saved teams from Firebase or localStorage based on authentication
      let savedTeams: SavedTeam[] = [];
      
      if (user) {
        // User is authenticated, try Firebase first, then fallback to localStorage
        try {
          const { getUserTeams } = await import('@/lib/userTeams');
          const firebaseTeams = await getUserTeams(user.uid);
          savedTeams = firebaseTeams;
          console.log('Loaded teams from Firebase:', savedTeams.length);
        } catch (error) {
          console.error('Failed to load teams from Firebase:', error);
          // Fallback to localStorage
          const savedTeamsRaw = localStorage.getItem(STORAGE_KEY);
          if (savedTeamsRaw) {
            try {
              savedTeams = JSON.parse(savedTeamsRaw);
              console.log('Fallback: Loaded teams from localStorage:', savedTeams.length);
            } catch (parseError) {
              console.error('Failed to parse localStorage teams:', parseError);
              savedTeams = [];
            }
          }
        }
      } else {
        // User not authenticated, load from localStorage
        const savedTeamsRaw = localStorage.getItem(STORAGE_KEY);
        if (savedTeamsRaw) {
          try {
            savedTeams = JSON.parse(savedTeamsRaw);
            console.log('Loaded teams from localStorage:', savedTeams.length);
          } catch (parseError) {
            console.error('Failed to parse localStorage teams:', parseError);
            savedTeams = [];
          }
        }
      }
      
      // Create a default test team if none exists
      if (savedTeams.length === 0) {
        console.log('No saved teams found, creating default test team...');
        const defaultTeam: SavedTeam = {
          id: "1756959740815",
          name: "Test Team",
                      slots: [
              {
                id: 25, // Pikachu
                level: 15,
                moves: [
                  { name: 'thunderbolt', type: 'electric', power: 90, accuracy: 100, pp: 15, level_learned_at: 15, damage_class: 'special' as const },
                  { name: 'quick-attack', type: 'normal', power: 40, accuracy: 100, pp: 30, level_learned_at: 10, damage_class: 'physical' as const },
                  { name: 'iron-tail', type: 'steel', power: 100, accuracy: 75, pp: 15, level_learned_at: 20, damage_class: 'physical' as const },
                  { name: 'thunder', type: 'electric', power: 110, accuracy: 70, pp: 10, level_learned_at: 25, damage_class: 'special' as const },
                ]
              },
              { id: null, level: 15, moves: [] },
              { id: null, level: 15, moves: [] },
              { id: null, level: 15, moves: [] },
              { id: null, level: 15, moves: [] },
              { id: null, level: 15, moves: [] },
            ]
        };
        savedTeams = [defaultTeam];
        
        // Save to appropriate storage
        if (user) {
          // Save to Firebase
          try {
            const { saveTeamToFirebase } = await import('@/lib/userTeams');
            await saveTeamToFirebase(user.uid, {
              name: defaultTeam.name,
              slots: defaultTeam.slots as Array<{ id: number | null; level: number; moves: MoveData[] }>, // Type assertion for compatibility
              isPublic: false,
              description: 'Default test team'
            });
          } catch (error) {
            console.error('Failed to save default team to Firebase:', error);
            // Fallback to localStorage
            localStorage.setItem(STORAGE_KEY, JSON.stringify(savedTeams));
          }
        } else {
          // Save to localStorage
          localStorage.setItem(STORAGE_KEY, JSON.stringify(savedTeams));
        }
        console.log('Default test team created');
      }

      // Get player team
      console.log('Looking for player team with ID:', playerTeamId);
      console.log('Available teams:', savedTeams.map(t => ({ id: t.id, name: t.name })));
      
      const playerTeam = savedTeams.find(t => t.id === playerTeamId);
      if (!playerTeam) {
        console.error('Player team not found. Available teams:', savedTeams.map(t => ({ id: t.id, name: t.name })));
        console.error('User authentication state:', { user: !!user, uid: user?.uid });
        console.error('Storage check - localStorage teams:', localStorage.getItem(STORAGE_KEY));
        
        // Try to provide more helpful error message
        const availableTeamNames = savedTeams.map(t => t.name).join(', ');
        const errorMessage = availableTeamNames 
          ? `Player team with ID "${playerTeamId}" not found. Available teams: ${availableTeamNames}`
          : `Player team with ID "${playerTeamId}" not found. No teams available. Please create a team first.`;
        
        throw new Error(errorMessage);
      }

      // Get opponent team
      let opponentTeam: { name: string; slots: Array<{ id: number; level: number }> };
      
      if (opponentKind === "champion") {
        const champion = GYM_CHAMPIONS.find(c => c.id === opponentId);
        if (!champion) {
          console.error('Champion not found. Available champions:', GYM_CHAMPIONS.map(c => ({ id: c.id, name: c.name })));
          throw new Error(`Champion with ID "${opponentId}" not found. Available champions: ${GYM_CHAMPIONS.map(c => c.name).join(', ')}`);
        }
        opponentTeam = champion.team;
      } else {
        const team = savedTeams.find(t => t.id === opponentId);
        if (!team) {
          console.error('Opponent team not found. Available teams:', savedTeams.map(t => ({ id: t.id, name: t.name })));
          throw new Error(`Opponent team with ID "${opponentId}" not found. Available teams: ${savedTeams.map(t => t.name).join(', ')}`);
        }
        opponentTeam = {
          name: team.name,
          slots: team.slots.filter(s => s.id != null).map(s => ({ id: s.id as number, level: s.level }))
        };
      }

      // Get first Pokemon from each team
      const playerSlotIndex = playerTeam.slots.findIndex(s => s.id != null);
      const playerSlot = playerTeam.slots[playerSlotIndex];
      const opponentSlot = opponentTeam.slots[0];
      
      console.log('Player slot:', playerSlot);
      console.log('Opponent slot:', opponentSlot);
      
      if (!playerSlot || !opponentSlot) {
        throw new Error("No valid Pokemon found in teams");
      }

      // Fetch Pokemon data with error handling
      console.log('Fetching Pokemon data...');
      const [playerResult, opponentResult] = await Promise.allSettled([
        getPokemon(playerSlot.id as number),
        getPokemon(opponentSlot.id)
      ]);
      
      console.log('Player result:', playerResult);
      console.log('Opponent result:', opponentResult);

      if (playerResult.status === 'rejected') {
        throw new Error(`Failed to load player Pokemon: ${playerResult.reason}`);
      }
      if (opponentResult.status === 'rejected') {
        throw new Error(`Failed to load opponent Pokemon: ${opponentResult.reason}`);
      }

      const playerPokemon = playerResult.value;
      const opponentPokemon = opponentResult.value;

      // Get moves for each Pokemon (simplified - use first 4 moves from their movepool)
      const playerMoves = (playerSlot.moves as { name: string }[]).slice(0, 4).map(m => m.name);
      const opponentMoves = ["tackle", "scratch", "quick-attack", "defense-curl"]; // More reliable move names

      // Fetch move data with error handling
      const [playerMoveData, opponentMoveData] = await Promise.all([
        Promise.allSettled(playerMoves.map(name => getMove(name))) as Promise<PromiseSettledResult<Move>[]>,
        Promise.allSettled(opponentMoves.map(name => getMove(name))) as Promise<PromiseSettledResult<Move>[]>
      ]);

      // Filter out failed moves and create fallback moves
      const getValidMoves = (results: PromiseSettledResult<Move>[]) => {
        return results
          .filter((result): result is PromiseFulfilledResult<Move> => result.status === 'fulfilled')
          .map(result => result.value)
          .filter(Boolean);
      };

      const validPlayerMoves = getValidMoves(playerMoveData);
      const validOpponentMoves = getValidMoves(opponentMoveData);

      // Create fallback moves if we don't have enough
      const createFallbackMove = (name: string, type: string = 'normal', power: number = 40) => {
        // Define priority moves
        const priorityMoves: Record<string, number> = {
          'quick-attack': 1,
          'extreme-speed': 2,
          'mach-punch': 1,
          'bullet-punch': 1,
          'ice-shard': 1,
          'sucker-punch': 1,
          'vacuum-wave': 1,
          'detect': 4,
          'protect': 4,
          'endure': 4,
          'feint': 2,
          'fake-out': 3,
          'first-impression': 2,
          'ally-switch': 2,
          'teleport': -6,
          'roar': -6,
          'whirlwind': -6,
          'circle-throw': -6,
          'dragon-tail': -6,
          'trick-room': -7,
          'magic-room': -7,
          'wonder-room': -7
        };

        return {
          id: Math.floor(Math.random() * 10000), // Random ID for fallback moves
          name,
          accuracy: 100,
          effect_chance: null,
          pp: 35,
          priority: priorityMoves[name] || 0,
          power,
        contest_combos: {
          normal: {
            use_before: [],
            use_after: []
          },
          super: {
            use_before: [],
            use_after: []
          }
        },
        contest_effect: {
          name: 'tough',
          url: ''
        },
        contest_type: {
          name: 'tough',
          url: ''
        },
        damage_class: {
          name: 'physical',
          url: ''
        },
        effect_entries: [{
        effect: 'Deals damage',
          language: {
            name: 'en',
            url: ''
          },
          short_effect: 'Deals damage'
        }],
        effect_changes: [],
        learned_by_pokemon: [],
        flavor_text_entries: [{
          flavor_text: 'Deals damage',
          language: {
            name: 'en',
            url: ''
          },
          version_group: {
            name: 'red-blue',
            url: ''
          }
        }],
        generation: {
          name: 'generation-i',
          url: ''
        },
        machines: [],
        meta: {
          ailment: {
            name: 'none',
            url: ''
          },
          ailment_chance: 0,
          category: {
            name: 'damage',
            url: ''
          },
          crit_rate: 0,
          drain: 0,
          flinch_chance: 0,
          healing: 0,
          max_hits: null,
          max_turns: null,
          min_hits: null,
          min_turns: null,
          stat_chance: 0
        },
        names: [{
          language: {
            name: 'en',
            url: ''
          },
          name
        }],
        past_values: [],
        stat_changes: [],
        super_contest_effect: {
          name: 'tough',
          url: ''
        },
        target: {
          name: 'selected-pokemon',
          url: ''
        },
        type: {
          name: type,
          url: ''
        }
      };
      };

      const finalPlayerMoves = validPlayerMoves.length > 0 ? validPlayerMoves : [
        createFallbackMove('tackle'),
        createFallbackMove('scratch'),
        createFallbackMove('quick-attack'),
        createFallbackMove('defense-curl', 'normal', 0)
      ];

      const finalOpponentMoves = validOpponentMoves.length > 0 ? validOpponentMoves : [
        createFallbackMove('tackle'),
        createFallbackMove('scratch'),
        createFallbackMove('quick-attack'),
        createFallbackMove('defense-curl', 'normal', 0)
      ];

      // Initialize team battle
      console.log('Initializing team battle...');
      
      // Create player team (use the selected Pokémon as first, add others from saved team)
      const playerTeamData = [
        {
          pokemon: playerPokemon,
          level: playerSlot.level,
          moves: finalPlayerMoves
        }
      ];
      
      // Add other Pokémon from the saved team if available
      console.log('Saved teams:', savedTeams);
      console.log('Player team ID:', playerTeamId);
      if (savedTeams.length > 0 && playerTeamId) {
        const team = savedTeams.find(t => t.id === playerTeamId);
        console.log('Found team:', team);
        if (team && team.slots && Array.isArray(team.slots)) {
          for (let i = 0; i < team.slots.length; i++) {
            if (i !== playerSlotIndex) {
              const slot = team.slots[i];
              if (slot && slot.id) {
                try {
                  const pokemon = await getPokemon(slot.id);
                  const moves: Move[] = slot.moves && Array.isArray(slot.moves) ? 
                    (slot.moves as { name: string }[]).slice(0, 4).map(m => createFallbackMove(m.name)) : [
                    createFallbackMove('scratch'),
                    createFallbackMove('quick-attack'),
                    createFallbackMove('defense-curl', 'normal', 0)
                  ];
                  playerTeamData.push({
                    pokemon,
                    level: slot.level || 50,
                    moves
                  });
                } catch (err) {
                  console.warn(`Failed to load Pokémon ${slot.id}:`, err);
                }
              }
            }
          }
        }
      }
      
      // Create opponent team with all Pokémon
      const opponentTeamData = [];
      
      // Add the first Pokémon (already fetched)
      opponentTeamData.push({
        pokemon: opponentPokemon,
        level: opponentSlot.level,
        moves: finalOpponentMoves
      });
      
      // Add remaining Pokémon from the opponent team
      for (let i = 1; i < opponentTeam.slots.length; i++) {
        const slot = opponentTeam.slots[i];
        if (slot.id) {
          try {
            const pokemon = await getPokemon(slot.id);
            const moves: Move[] = [
              createFallbackMove('scratch'),
              createFallbackMove('quick-attack'),
              createFallbackMove('defense-curl', 'normal', 0)
            ];
            opponentTeamData.push({
              pokemon,
              level: slot.level,
              moves
            });
          } catch (err) {
            console.warn(`Failed to load opponent Pokémon ${slot.id}:`, err);
          }
        }
      }
      
      const battle = initializeTeamBattle(playerTeamData, opponentTeamData, playerTeam.name, opponentTeam.name);
      
      console.log('Battle initialized:', {
        playerTeamSize: playerTeamData.length,
        opponentTeamSize: opponentTeamData.length,
        opponentTeamPokemon: opponentTeamData.map(p => ({ name: p.pokemon.name, level: p.level })),
        battleState: {
          playerTeamSize: battle.player.pokemon.length,
          opponentTeamSize: battle.opponent.pokemon.length,
          opponentPokemon: battle.opponent.pokemon.map(p => ({ name: p.pokemon.name, hp: p.currentHp }))
        }
      });

      // Ensure battle log is properly formatted
      const sanitizedBattle = {
        ...battle,
        battleLog: battle.battleLog.map(entry => {
          if (typeof entry === 'string') {
            return entry;
          } else if (entry && typeof entry === 'object' && 'message' in entry) {
            // Ensure all properties are strings or primitives
            const sanitizedEntry = {
              type: (entry.type || 'battle_start') as 'turn_start' | 'move_used' | 'damage_dealt' | 'status_applied' | 'status_damage' | 'status_effect' | 'pokemon_fainted' | 'pokemon_sent_out' | 'battle_start' | 'battle_end',
              message: String(entry.message || ''),
            } as { type: 'turn_start' | 'move_used' | 'damage_dealt' | 'status_applied' | 'status_damage' | 'status_effect' | 'pokemon_fainted' | 'pokemon_sent_out' | 'battle_start' | 'battle_end'; message: string; pokemon?: string; move?: string; turn?: number; effectiveness?: string };
            
            // Add optional properties if they exist and are strings
            if (entry.pokemon && typeof entry.pokemon === 'string') {
              sanitizedEntry.pokemon = entry.pokemon;
            }
            if (entry.move && typeof entry.move === 'string') {
              sanitizedEntry.move = entry.move;
            }
            if (entry.turn && typeof entry.turn === 'number') {
              sanitizedEntry.turn = entry.turn;
            }
            if (entry.effectiveness && typeof entry.effectiveness === 'string') {
              sanitizedEntry.effectiveness = entry.effectiveness as 'normal' | 'super_effective' | 'not_very_effective' | 'no_effect';
            }
            
            return sanitizedEntry;
          } else {
            // Handle any invalid objects
            return {
              type: 'default',
              message: '[Invalid log entry]'
            };
          }
        })
      };

      
      setBattleStateIfChanged(sanitizedBattle as TeamBattleState);
      initialBattleStateSetRef.current = true;
      setInitialized(true);
    } catch (err) {
      console.error('Battle initialization error:', err);
      let errorMessage = "Failed to initialize battle";
      
      if (err instanceof Error) {
        if (err.message.includes('Failed to fetch')) {
          errorMessage = "Network error: Unable to connect to Pokemon API. Please check your internet connection.";
        } else if (err.message.includes('HTTP error')) {
          errorMessage = `API error: ${err.message}`;
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setInitialized(true);
    } finally {
      setLoading(false);
    }
  }, [playerTeamId, opponentKind, opponentId, isMultiplayer, user]);

  useEffect(() => {
    // Only initialize once and wait for auth to be ready
    if (initialized || authLoading) return;
    
    // For multiplayer battles, skip this effect - handled by separate effect
    if (isMultiplayer) {
      return;
    }
    
    const timeoutId = setTimeout(() => {
      if (loading && !initialized) {
        console.error('Battle initialization timeout');
        setError('Battle initialization is taking too long. Please try again.');
        setLoading(false);
        setInitialized(true);
      }
    }, 10000); // 10 second timeout

    initializeBattleState();
    
    return () => clearTimeout(timeoutId);
  }, [initialized, authLoading, isMultiplayer, user]); // Kept stable deps

  // Separate effect to handle multiplayer battle initialization when data becomes available
  useEffect(() => {
    if (!isMultiplayer || initialized || !multiplayerBattle || !battleId || !user) return;
    
    console.log('Multiplayer battle data available, initializing...');
    // Call initializeBattleState directly without including it in dependencies
    const initBattle = async () => {
      try {
        console.log('Starting battle initialization...');
        setLoading(true);
        setError(null);

        // Resolve multiplayer mode from URL directly to avoid race conditions
        const urlRoomId = searchParams.get("roomId");
        const urlBattleId = searchParams.get("battleId");
        const effectiveIsMultiplayer = isMultiplayer || Boolean(urlRoomId || urlBattleId);
        const effectiveBattleId = battleId || urlBattleId || null;

        // Handle multiplayer battles
        if (effectiveIsMultiplayer) {
          // Ensure we have a battleId before proceeding
          if (!effectiveBattleId) {
            // Wait for URL/listener to provide battleId
            return;
          }
          // Ensure we have battle metadata; fetch once if listener hasn't populated yet
          let battleMeta = multiplayerBattle;
          
          if (!battleMeta) {
            try {
              const fetchedBattle = await battleService.getBattle(effectiveBattleId);
              if (fetchedBattle) {
                battleMeta = fetchedBattle;
              }
            } catch (err) {
              console.error('Failed to fetch battle metadata:', err);
              throw new Error('Failed to load battle data');
            }
          }

          // If after fetch we still don't have meta, wait
          if (!battleMeta) {
            return;
          }
          
          // Ensure both teams are present before proceeding
          if (!battleMeta.hostTeam || !battleMeta.guestTeam) {
            console.log('Waiting for both teams to be present in battle data...');
            return; // Wait for both teams to be available
          }
          
          console.log('Initializing multiplayer battle...');
          
          // Get team data from URL parameters instead of Firebase
          const isHost = userRole === 'host';
          let playerTeam, opponentTeam;
          
          if (pokemonListParam) {
            // Use Pokemon list from URL parameters
            const userPokemonList = JSON.parse(pokemonListParam);
            const userTeam = {
              id: `user_${userId}`,
              name: `${userName}'s Team`,
              slots: userPokemonList.map((pokemon: any) => ({
                id: pokemon.id,
                level: pokemon.level,
                moves: pokemon.moves || []
              }))
            };
            
            // CRITICAL FIX: Each player should get their own team as playerTeam
            // and the opponent's team as opponentTeam
            if (isHost) {
              // Host uses their URL team as playerTeam, guest team from Firebase as opponentTeam
              playerTeam = userTeam;
              opponentTeam = battleMeta.guestTeam;
            } else {
              // Guest uses their URL team as playerTeam, host team from Firebase as opponentTeam
              playerTeam = userTeam;
              opponentTeam = battleMeta.hostTeam;
            }
          } else {
            // Fallback to Firebase data if URL params not available
            playerTeam = isHost ? battleMeta.hostTeam : battleMeta.guestTeam;
            opponentTeam = isHost ? battleMeta.guestTeam : battleMeta.hostTeam;
          }
          
          // Additional validation: Check if assigned teams are different
          if (JSON.stringify(playerTeam) === JSON.stringify(opponentTeam)) {
            console.error('🚨 CRITICAL BUG: Player and opponent teams are identical!');
            console.error('Player team:', playerTeam);
            console.error('Opponent team:', opponentTeam);
            console.error('This will cause both players to have the same Pokémon!');
          }
          
          if (!playerTeam || !opponentTeam) {
            throw new Error("Team data not available for multiplayer battle");
          }
          
          // Convert SavedTeam to the format expected by initializeTeamBattle
          const convertTeamForBattle = async (team: SavedTeam) => {
            const battleTeam = [] as Array<{ pokemon: any; level: number; moves: Move[] }>;
            for (const slot of team.slots) {
              if (!slot?.id) continue;
                try {
                  const pokemon = await getPokemon(slot.id);
                const moveNames: string[] = Array.isArray(slot.moves)
                  ? slot.moves.map((m: any) => (typeof m === 'string' ? m : (m?.name || ''))).filter(Boolean)
                  : [];
                const resolvedMovesResults = await Promise.allSettled(moveNames.map((n) => getMove(n)));
                const resolvedMoves: Move[] = resolvedMovesResults
                  .filter((r): r is PromiseFulfilledResult<Move> => r.status === 'fulfilled' && !!r.value)
                  .map((r) => r.value);
                const movesToUse: Move[] = resolvedMoves.length > 0 ? resolvedMoves : [
                  { id: 1, name: 'tackle', accuracy: 100, effect_chance: null, pp: 35, priority: 0, power: 40, contest_combos: { normal: { use_before: [], use_after: [] }, super: { use_before: [], use_after: [] } }, contest_effect: { name: 'tough', url: '' }, contest_type: { name: 'tough', url: '' }, damage_class: { name: 'physical', url: '' }, effect_entries: [{ effect: 'Deals damage', language: { name: 'en', url: '' }, short_effect: 'Deals damage' }], effect_changes: [], learned_by_pokemon: [], flavor_text_entries: [], generation: { name: 'generation-i', url: '' }, machines: [], meta: { ailment: { name: 'none', url: '' }, ailment_chance: 0, category: { name: 'damage', url: '' }, crit_rate: 0, drain: 0, flinch_chance: 0, healing: 0, max_hits: null, max_turns: null, min_hits: null, min_turns: null, stat_chance: 0 }, names: [{ language: { name: 'en', url: '' }, name: 'tackle' }], past_values: [], stat_changes: [], super_contest_effect: { name: 'tough', url: '' }, target: { name: 'selected-pokemon', url: '' }, type: { name: 'normal', url: '' } } as unknown as Move
                ];
                  battleTeam.push({
                    pokemon,
                    level: slot.level,
                  moves: movesToUse
                  });
                } catch (error) {
                  console.error(`Failed to load Pokemon ${slot.id}:`, error);
              }
            }
            return battleTeam;
          };

          // Initialize battle with converted teams
          const playerBattleTeam = await convertTeamForBattle(playerTeam as SavedTeam);
          const opponentBattleTeam = await convertTeamForBattle(opponentTeam as SavedTeam);
          
          const battleState = await initializeTeamBattle(
            playerBattleTeam,
            opponentBattleTeam
          );
          
          // Apply role-based positioning: 
          // - Guest sees their Pokemon in back (player position) and host Pokemon in front (opponent position)
          // - Host sees their Pokemon in back (player position) and guest Pokemon in front (opponent position)
          // The battle state is already correctly assigned based on the URL parameters
          setBattleStateIfChanged(battleState);
          initialBattleStateSetRef.current = true;
          
          // Start the battle in Firestore (host only)
          if (effectiveBattleId && user?.uid === battleMeta.hostId) {
            await battleService.startBattle(effectiveBattleId, battleState as unknown);
            // Set initial server turn based on host
            await battleService.updateBattle(effectiveBattleId, {
              currentTurn: 'host',
              turnNumber: 1,
              battleData: battleState as unknown
            });
          }
          
          // Mark this player as ready for battle
          setBattleReady(true);
          
          setInitialized(true);
        }
      } catch (err) {
        console.error('Battle initialization failed:', err);
        let errorMessage = 'Failed to initialize battle. Please try again.';
        if (err instanceof Error) {
          if (err.message.includes('API')) {
            errorMessage = `API error: ${err.message}`;
          } else {
            errorMessage = err.message;
          }
        }
        
        setError(errorMessage);
        setInitialized(true);
      } finally {
        setLoading(false);
      }
    };
    
    initBattle();
  }, [isMultiplayer, initialized, multiplayerBattle, battleId, user, urlRoomId, urlBattleId]);

  const handlePlayerMove = async (moveIndex: number) => {
    console.log('🎮 === MOVE BUTTON CLICKED ===');
    console.log('👤 Player:', user?.displayName || user?.uid || 'Anonymous');
    console.log('🎯 Move index:', moveIndex);
    console.log('📊 Battle state exists:', !!battleState);
    console.log('🔄 Battle phase:', battleState?.phase);
    console.log('✅ Battle complete:', battleState?.isComplete);
    console.log('🌐 Is multiplayer:', isMultiplayer);
    console.log('🆔 Battle ID:', battleId);
    console.log('⚔️ Multiplayer battle exists:', !!multiplayerBattle);
    
    if (!battleState || battleState.isComplete) {
      console.log('❌ Move blocked - battle complete');
      return;
    }

    // Only allow move selection during selection phase
    if (battleState.phase !== 'selection') {
      console.log('❌ Move blocked - not in selection phase, current phase:', battleState.phase);
      return;
    }

    console.log('✅ Move conditions met, proceeding with move selection');
    setSelectedMove(moveIndex);
    
    if (isMultiplayer && battleId && multiplayerBattle) {
      // Multiplayer mode - sync move selection with other player
      try {
        // Get the Pokémon from the player position (teams are already correctly assigned)
        const currentPokemon = getCurrentPokemon(battleState.player);
        const moveName = currentPokemon.moves[moveIndex]?.name || 'Unknown Move';
        
        console.log('🌐 === MULTIPLAYER MOVE SELECTION ===');
        console.log('👤 Player:', user?.displayName || user?.uid || 'Anonymous');
        console.log('🔍 Player Pokémon:', currentPokemon.pokemon.name);
        console.log('⚡ Move name:', moveName);
        console.log('📊 Current selected moves:', battleState.selectedMoves);
        
        // Add move to battle service
        console.log('📤 === ADDING MOVE TO BATTLE SERVICE ===');
        console.log('🆔 Battle ID:', battleId);
        console.log('👤 User ID:', user?.uid);
        console.log('🎯 Move index:', moveIndex);
        console.log('⚡ Move name:', moveName);
        
        await battleService.addMove(
          battleId,
          user?.uid || '',
          user?.displayName || 'Anonymous',
          moveIndex,
          moveName
        );
        
        console.log('✅ Move added to battle service successfully');
        console.log('📡 Move should now be visible to other players via Firebase');
        
        // Select move locally (this will update the battle state)
        const newState = await executeTeamAction(battleState, { type: 'move', moveIndex }, true);
        console.log('🎯 === LOCAL MOVE SELECTION RESULT ===');
        console.log('👤 Player:', user?.displayName || user?.uid || 'Anonymous');
        console.log('🔄 New state phase:', newState.phase);
        console.log('📊 New state selected moves:', newState.selectedMoves);
        console.log('✅ Both players selected moves:', bothPlayersSelectedMoves(newState));
        console.log('⚡ Execution queue length:', newState.executionQueue?.length || 0);
        
        setBattleStateIfChanged(newState);
        
        // Update battle data in Firebase
        await battleService.updateBattle(battleId, {
          battleData: newState as unknown
        });
        
        console.log('📡 Battle updated in Firebase with move selection');
        console.log('🔄 Other players should now see phase:', newState.phase);
        console.log('📊 Other players should now see selected moves:', newState.selectedMoves);
        
        // Broadcast a system-like chat message for visibility
        try {
          const currentUserId = userId || user?.uid;
          const userIsHost = Boolean(currentUserId && multiplayerBattle.hostId && currentUserId === multiplayerBattle.hostId);
          await chatService.sendSystemMessage(roomId as string, `${userIsHost ? hostName : guestName} selected ${moveName}`);
        } catch (error) {
          console.warn('Failed to send system message:', error);
        }
        
        if (newState.isComplete) {
          // Battle is complete
          await battleService.endBattle(battleId, newState.winner || 'draw', newState as unknown);
          setSelectedMove(null);
          return;
        }
        
      } catch (error) {
        console.error('Failed to sync move selection:', error);
        alert('Failed to sync move selection with opponent. Please try again.');
      } finally {
        setSelectedMove(null);
      }
    } else {
      // Single player mode - select move and trigger AI selection
      const newState = await executeTeamAction(battleState, { type: 'move', moveIndex }, true);
      setBattleStateIfChanged(newState);

      if (newState.isComplete) {
        setSelectedMove(null);
        return;
      }

      // If both players have selected moves, execution will happen automatically
      // AI move selection will be handled by the useEffect
      setSelectedMove(null);
    }
  };

  const handlePokemonSelection = (pokemonIndex: number) => {
    if (!battleState || !battleState.needsPokemonSelection) return;
    
    console.log('=== POKEMON SELECTION HANDLER ===');
    console.log('Selected Pokemon index:', pokemonIndex);
    console.log('Needs selection for:', battleState.needsPokemonSelection);
    
    const isPlayerSelection = battleState.needsPokemonSelection === 'player';
    const updatedState = switchToSelectedPokemon(battleState, pokemonIndex, isPlayerSelection);
    
    console.log('Updated battle state after Pokemon selection:', updatedState);
    setBattleStateIfChanged(updatedState);
    setSwitchingInProgress(false);
  };

  const restartBattle = () => {
    setInitialized(false);
    setLoading(true);
    setError(null);
    setBattleState(null);
    setSwitchingInProgress(false);
    setShowBattleResults(false);
    initialBattleStateSetRef.current = false;
    // The useEffect will automatically trigger initialization
  };

  if (loading || authLoading) {
    // Remove blocking overlay so upstream dialogs/pages remain visible
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg text-text flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => router.push(isMultiplayer && roomId ? `/lobby/${roomId}` : "/battle")}
            className="px-4 py-2 bg-poke-blue text-white rounded-lg hover:bg-poke-blue/90"
          >
            Back to Battle Setup
          </button>
        </div>
      </div>
    );
  }

  if (!battleState) return null;

  const { player: playerTeam, opponent: opponentTeam, battleLog, isComplete, winner } = battleState;
  
  // Determine the correct turn based on actual user IDs
  const getCorrectTurn = () => {
    if (!isMultiplayer || !multiplayerBattle) {
      return battleState.turn;
    }
    
    // For multiplayer, determine turn based on actual user IDs
    const serverTurn = multiplayerBattle.currentTurn;
    const currentUserId = userId || user?.uid;
    
    if (!currentUserId) {
      console.warn('No current user ID available for turn determination');
      return battleState.turn;
    }
    
    // Check if it's the current user's turn based on their actual ID
    const isCurrentUserTurn = (serverTurn === 'host' && currentUserId === multiplayerBattle.hostId) ||
                             (serverTurn === 'guest' && currentUserId === multiplayerBattle.guestId);
    
    console.log('=== TURN DETERMINATION DEBUG ===');
    console.log('Current user ID:', currentUserId);
    console.log('Server turn:', serverTurn);
    console.log('Host ID:', multiplayerBattle.hostId);
    console.log('Guest ID:', multiplayerBattle.guestId);
    console.log('Is current user turn:', isCurrentUserTurn);
    
    return isCurrentUserTurn ? 'player' : 'opponent';
  };
  
  const turn = getCorrectTurn();
  
  // Teams are already correctly assigned during battle initialization
  const player = getCurrentPokemon(playerTeam);
  const opponent = getCurrentPokemon(opponentTeam);
  const getTypeName = (t: string | { name?: string; type?: { name?: string } } | undefined) => 
    (typeof t === 'string' ? t : (t?.name || t?.type?.name || 'unknown'));

  // Debug logging for move selection visibility
  console.log('Battle state debug:', {
    isComplete,
    turn,
    playerHp: player.currentHp,
    playerName: player.pokemon.name,
    opponentHp: opponent.currentHp,
    opponentName: opponent.pokemon.name,
    shouldShowMoves: !isComplete && turn === 'player' && player.currentHp > 0,
    playerTeamCurrentIndex: playerTeam.currentIndex,
    opponentTeamCurrentIndex: opponentTeam.currentIndex,
    playerMovesCount: player.moves.length,
    opponentTeamSize: opponentTeam.pokemon.length,
    opponentTeamFaintedCount: opponentTeam.faintedCount,
    opponentTeamPokemon: opponentTeam.pokemon.map((p, i) => ({
      index: i,
      name: p.pokemon.name,
      hp: p.currentHp,
      isCurrent: i === opponentTeam.currentIndex
    }))
  });

  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="sticky top-0 z-50 border-b border-border bg-surface">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => router.push(isMultiplayer ? '/lobby' : "/battle")}
              className="flex items-center space-x-2 text-muted hover:text-text transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">{isMultiplayer ? 'Back to Lobby' : 'Back to Battle Setup'}</span>
            </button>
            <div className="flex items-center gap-2">
              {isMultiplayer && roomId && (
                <button
                  onClick={() => { setShowChat(true); lastReadAtRef.current = Date.now(); setUnreadCount(0); }}
                  className="relative flex items-center gap-2 px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
                  title="Open Chat"
                >
                  <MessageCircle className="h-4 w-4" />
                  Chat
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">{unreadCount}</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-4 py-6">
        {/* Battle Status */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">
            {isComplete ? (
              <span className={winner === 'player' ? 'text-green-500' : 'text-red-500'}>
                {winner === 'player' ? 'Victory!' : 'Defeat!'}
              </span>
            ) : (
              <span className={turn === 'player' ? 'text-blue-500' : 'text-red-500'}>
                {isMultiplayer && multiplayerBattle ? (
                  turn === 'player' ? (
                    user?.uid === (multiplayerBattle.currentTurn === 'host' ? multiplayerBattle.hostId : multiplayerBattle.guestId) 
                      ? 'Your Turn' 
                      : `${multiplayerBattle.currentTurn === 'host' ? multiplayerBattle.hostName : multiplayerBattle.guestName}'s Turn`
                  ) : (
                    user?.uid === (multiplayerBattle.currentTurn === 'host' ? multiplayerBattle.hostId : multiplayerBattle.guestId) 
                      ? 'Your Turn' 
                      : `${multiplayerBattle.currentTurn === 'host' ? multiplayerBattle.hostName : multiplayerBattle.guestName}'s Turn`
                  )
                ) : (
                  turn === 'player' ? 'Your Turn' : 'Opponent\'s Turn'
                )}
              </span>
            )}
          </h1>
          {isAITurn && <p className="text-muted">AI is thinking...</p>}
          {isMultiplayer && !bothPlayersReady && (
            <p className="text-yellow-600 font-medium">
              Waiting for both players to be ready...
            </p>
          )}
          {isMultiplayer && bothPlayersReady && (
            <p className="text-green-600 font-medium">
              Both players ready! Battle can begin.
            </p>
          )}
        </div>

        {/* Battle Field and Log side-by-side on large screens */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 space-y-6">
          {/* Opponent Pokemon - Top */}
          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="flex items-center gap-4 mb-4">
              {/* HP Count on the LEFT */}
              <div className="text-right">
                <div className="text-sm font-medium">
                  {opponent.currentHp} / {opponent.maxHp}
                </div>
                <div className="text-xs text-muted">HP</div>
              </div>
              
              {/* Everything else on the RIGHT */}
              <div className="flex-1 flex items-center justify-end gap-4">
                <div className="text-right">
                  <h3 className="text-xl font-semibold capitalize">{opponent.pokemon.name}</h3>
                  <p className="text-sm text-muted">Lv. {opponent.level}</p>
                  <div className="flex gap-1 mt-1 justify-end">
                    {opponent.pokemon.types.map((type, index) => {
                      const typeName = typeof type === 'string' ? type : type.type?.name || 'unknown';
                      return (
                        <TypeBadge
                          key={`${opponent.pokemon.id}-type-${index}`}
                          type={typeName}
                          variant="span"
                          className="text-xs px-2 py-1"
                        />
                      );
                    })}
                  </div>
                  {/* Status Ailment Badges */}
                  {opponent.status && (
                    <div className="flex gap-1 mt-2 justify-end">
                      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 border border-red-200">
                        {opponent.status}
                    </span>
                    </div>
                  )}
                </div>
                <div className="relative w-24 h-24 flex items-center justify-end">
                  <Image
                    src={opponent.pokemon.sprites.front_default || opponent.pokemon.sprites.front_shiny || '/placeholder-pokemon.png'}
                    alt={opponent.pokemon.name}
                    width={96}
                    height={96}
                    className={`object-contain ${getOpponentAnimationClasses()}`}
                    onError={(e) => {
                      console.error('Failed to load opponent sprite:', e.currentTarget.src);
                    }}
                    onLoad={() => {
                      console.log('Successfully loaded opponent sprite:', opponent.pokemon.sprites.front_default);
                    }}
                  />
                </div>
              </div>
            </div>
            
            {/* Health Bar */}
            <div className="mb-2">
              <HealthBar 
                currentHp={opponent.currentHp} 
                maxHp={opponent.maxHp} 
                size="md"
              />
            </div>
          </div>

          {/* Player Pokemon - Bottom */}
          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="flex items-center gap-4 mb-4">
              {/* Everything on the LEFT */}
              <div className="flex-1 flex items-center gap-4">
                <div className="relative w-24 h-24 flex items-center justify-center">
                <Image
                    src={player.pokemon.sprites.back_default || player.pokemon.sprites.back_shiny || player.pokemon.sprites.front_default || '/placeholder-pokemon.png'}
                    alt={player.pokemon.name}
                    width={96}
                    height={96}
                    className={`object-contain ${getPlayerAnimationClasses()}`}
                    onError={(e) => {
                      console.error('Failed to load player sprite:', e.currentTarget.src);
                    }}
                    onLoad={() => {
                      console.log('Successfully loaded player sprite:', player.pokemon.sprites.back_default || player.pokemon.sprites.front_default);
                    }}
                />
              </div>
                <div>
                  <h3 className="text-xl font-semibold capitalize">{player.pokemon.name}</h3>
                  <p className="text-sm text-muted">Lv. {player.level}</p>
                <div className="flex gap-1 mt-1">
                    {player.pokemon.types.map((type, index) => {
                      const typeName = typeof type === 'string' ? type : type.type?.name || 'unknown';
                      return (
                        <TypeBadge
                          key={`${player.pokemon.id}-type-${index}`}
                          type={typeName}
                          variant="span"
                          className="text-xs px-2 py-1"
                        />
                      );
                    })}
                  </div>
                  {/* Status Ailment Badges */}
                  {player.status && (
                    <div className="flex gap-1 mt-2">
                      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 border border-red-200">
                        {player.status}
                    </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* HP Count on the RIGHT */}
              <div className="text-left">
                <div className="text-sm font-medium">
                  {player.currentHp} / {player.maxHp}
                </div>
                <div className="text-xs text-muted">HP</div>
              </div>
            </div>
            
            {/* Health Bar */}
            <div className="mb-2">
              <HealthBar 
                currentHp={player.currentHp} 
                maxHp={player.maxHp} 
                size="md"
              />
            </div>

          </div>
        </div>

        {/* Phase Indicator */}
        {battleState && !battleState.isComplete && (
          <div className="text-center mb-4">
            <div className={`text-lg font-bold ${
              battleState.phase === 'selection' ? 'text-blue-600' : 
              battleState.phase === 'execution' ? 'text-orange-600' : 
              'text-purple-600'
            }`}>
              {battleState.phase === 'selection' ? 'Select Your Move' :
               battleState.phase === 'execution' ? 'Executing Moves...' :
               'Switching Pokémon...'}
            </div>
            {battleState.phase === 'selection' && (
              <div className="text-sm text-gray-600">
                {battleState.selectedMoves.player ? '✓ Move Selected' : 'Choose a move'}
              </div>
            )}
          </div>
        )}

        {/* Move Selection */}
          {(() => {
            // Show moves during selection phase when player hasn't selected yet
            const shouldShowMoves = !isComplete
              && battleState?.phase === 'selection'
              && player.currentHp > 0
              && !battleState?.needsPokemonSelection
              && !battleState?.selectedMoves.player;
            
            console.log('=== MOVE SELECTION VISIBILITY DEBUG ===');
            console.log('Phase-based conditions:', {
              isComplete,
              phase: battleState?.phase,
              playerHp: player.currentHp,
              playerName: player.pokemon.name,
              needsPokemonSelection: battleState?.needsPokemonSelection,
              playerHasSelected: battleState?.selectedMoves.player
            });
            console.log('Final decision:', {
              shouldShowMoves,
              switchingInProgress
            });
            return shouldShowMoves;
          })() && (
          <div className="bg-surface border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Select a Move</h3>
            <div className="grid grid-cols-2 gap-3">
              {player.moves.map((move, index) => {
                const isDisabled = isAITurn || switchingInProgress || battleState?.phase !== 'selection' || !!battleState?.selectedMoves.player;
                console.log(`Move ${index} (${move.name}) disabled state:`, {
                  isDisabled,
                  isAITurn,
                  switchingInProgress,
                  phase: battleState?.phase,
                  playerHasSelected: battleState?.selectedMoves.player,
                  disabledReason: isAITurn ? 'AI turn' : switchingInProgress ? 'Switching' : battleState?.phase !== 'selection' ? 'Not selection phase' : battleState?.selectedMoves.player ? 'Already selected' : 'Other'
                });
                return (
                <button
                  key={index}
                  onClick={() => handlePlayerMove(index)}
                  disabled={isDisabled}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    selectedMove === index
                      ? 'border-poke-blue bg-blue-50'
                      : 'border-border hover:border-poke-blue hover:bg-blue-50'
                  } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="font-medium capitalize">{move.name}</div>
                  <div className="text-sm text-muted">
                    {move.power ? `Power: ${move.power}` : 'Status Move'} • {move.accuracy || 100}% accuracy
                  </div>
                  <div className="text-xs text-muted capitalize">{getTypeName(move.type)}</div>
                </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Pokemon Selection for Multiplayer Battles */}
        {isMultiplayer && battleState?.needsPokemonSelection === 'player' && (
          <div className="bg-surface border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 text-red-600">Choose your next Pokemon!</h3>
            <p className="text-muted mb-4">Your current Pokemon has fainted. Select which Pokemon to send out next:</p>
            <div className="grid grid-cols-2 gap-3">
              {playerTeam.pokemon.map((pokemon, index) => {
                const isCurrent = index === playerTeam.currentIndex;
                const isFainted = pokemon.currentHp <= 0;
                const isSelectable = !isCurrent && !isFainted;
                
                return (
                  <button
                    key={index}
                    onClick={() => isSelectable && handlePokemonSelection(index)}
                    disabled={!isSelectable}
                    className={`p-4 rounded-lg border text-left transition-colors ${
                      isSelectable
                        ? 'border-border hover:border-poke-blue hover:bg-blue-50 cursor-pointer'
                        : 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Image
                        src={getPokemonSpriteUrl(pokemon.pokemon.id)}
                        alt={pokemon.pokemon.name}
                        width={48}
                        height={48}
                        className="w-12 h-12"
                      />
                      <div className="flex-1">
                        <div className="font-medium capitalize">{pokemon.pokemon.name}</div>
                        <div className="text-sm text-muted">
                          Level {pokemon.level} • HP: {pokemon.currentHp}/{pokemon.maxHp}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-red-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(pokemon.currentHp / pokemon.maxHp) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    {isCurrent && (
                      <div className="text-xs text-blue-600 mt-2 font-medium">Currently Active</div>
                    )}
                    {isFainted && (
                      <div className="text-xs text-red-600 mt-2 font-medium">Fainted</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

          {/* Pokémon Fainted Message */}
          {!isComplete && turn === 'player' && player.currentHp <= 0 && !battleState?.needsPokemonSelection && (
        <div className="bg-surface border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 text-red-600">{player.pokemon.name} has fainted!</h3>
            <p className="text-muted">Waiting for next Pokémon to be sent out...</p>
          </div>
          )}

          {/* Battle Log (sticky on large screens) */}
          <div ref={battleLogRef} className="bg-surface border border-border rounded-xl p-6 lg:sticky lg:top-24 h-[420px] overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">Battle Log</h3>
            <div className="space-y-2">
            {battleLog.filter(log => log != null).reverse().map((log, index) => {
              // Handle both old string format and new BattleLogEntry format
              let message = '';
              let type = 'default';
              
              try {
                if (typeof log === 'string') {
                  message = log;
                } else if (log && typeof log === 'object') {
                  if ('message' in log && typeof log.message === 'string') {
                    message = log.message;
                    type = log.type || 'default';
                  } else if ('name' in log) {
                    // Handle case where Pokemon/Move object was accidentally passed
                    const name = typeof log.name === 'string' ? log.name : 
                                (log.name && typeof log.name === 'object' && 'name' in log.name) ? log.name.name : 'Unknown';
                    message = `[Object: ${name}]`;
                  } else {
                    message = '[Invalid log entry]';
                  }
                } else {
                  message = String(log);
                }
              } catch (error) {
                console.error('Error processing battle log entry:', error, log);
                message = '[Error processing log entry]';
              }
              
              return (
                <div 
                  key={index} 
                  className={`text-sm p-3 rounded border-l-4 ${
                    type === 'battle_start' ? 'bg-blue-50 border-blue-400 font-bold' :
                    type === 'turn_start' ? 'bg-green-50 border-green-400 font-semibold' :
                    type === 'move_used' ? 'bg-yellow-50 border-yellow-400' :
                    type === 'damage_dealt' ? 'bg-red-50 border-red-400' :
                    type === 'status_applied' ? 'bg-purple-50 border-purple-400' :
                    type === 'status_damage' ? 'bg-orange-50 border-orange-400' :
                    type === 'status_effect' ? 'bg-gray-50 border-gray-400' :
                    type === 'pokemon_fainted' ? 'bg-red-100 border-red-500' :
                    'bg-gray-50 border-gray-300'
                  }`}
                >
                  {message.split('\n').map((line, lineIndex) => (
                    <div key={lineIndex} className={lineIndex > 0 ? 'mt-1' : ''}>
                      {line}
              </div>
            ))}
                </div>
              );
            })}
            </div>
          </div>
        </div>

        {/* Chat Component for Multiplayer - always visible overlay during battle */}
        {isMultiplayer && roomId && showChat && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]" onClick={() => setShowChat(false)}>
            <div className="bg-surface border border-border rounded-xl w-full max-w-md mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-3 border-b border-border">
                <div className="font-semibold">Room Chat</div>
                <button className="text-sm px-2 py-1" onClick={() => setShowChat(false)}>Close</button>
              </div>
              <div className="p-3">
                <Chat 
                  roomId={roomId}
                  isCollapsible={false}
                  isCollapsed={false}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Battle Over Dialog */}
      {showBattleResults && battleState && (
        <BattleOverDialog
          isOpen={showBattleResults}
          onClose={() => setShowBattleResults(false)}
          winner={battleState.winner}
          playerTeam={battleState.player.pokemon}
          opponentTeam={battleState.opponent.pokemon}
          isMultiplayer={isMultiplayer}
          hostName={multiplayerBattle?.hostName}
          guestName={multiplayerBattle?.guestName}
        />
      )}
    </div>
  );
}

// Wrapper component with Suspense boundary
export default function BattleRuntimePageWrapper() {
  return (
    <Suspense fallback={<div>Loading battle...</div>}>
      <BattleRuntimePage />
    </Suspense>
  );
}
