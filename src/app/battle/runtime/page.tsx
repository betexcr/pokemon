"use client";

import { useEffect, useState, useCallback, useRef, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, RotateCcw, MessageCircle } from "lucide-react";
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
  switchToSelectedPokemon
} from "@/lib/team-battle-engine";
import TypeBadge from "@/components/TypeBadge";
import HealthBar from "@/components/HealthBar";
import Chat from "@/components/Chat";
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
        lastBattleStateJSONRef.current = serialized;
        setBattleState(next);
      }
    } catch {
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
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [multiplayerBattle, setMultiplayerBattle] = useState<MultiplayerBattleState | null>(null);
  const [battleId, setBattleId] = useState<string | null>(null);
  const [hostName, setHostName] = useState<string>('Host');
  const [guestName, setGuestName] = useState<string>('Guest');
  const lastBattleUpdatedAtRef = useRef<number>(0);

  const playerTeamId = searchParams.get("player");
  const opponentKind = searchParams.get("opponentKind");
  const opponentId = searchParams.get("opponentId");
  const multiplayerRoomId = searchParams.get("roomId");
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
        unsubscribe = battleService.onBattleChange(battleId, (battle) => {
          if (!battle) return;

          // Skip processing if this snapshot doesn't represent a newer update
          const updatedAt = battle.updatedAt instanceof Date ? battle.updatedAt.getTime() : Date.now();
          if (updatedAt === lastBattleUpdatedAtRef.current) return;
          lastBattleUpdatedAtRef.current = updatedAt;

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

          // If battle data exists, update the local battle state and align turn to local perspective
          if (battle.battleData && battle.status === 'active') {
            const aligned = { ...(battle.battleData as TeamBattleState) };
            try {
              if (battle.hostName) setHostName(battle.hostName);
              if (battle.guestName) setGuestName(battle.guestName);
              const userIsHost = user?.uid && battle.hostId && user.uid === battle.hostId;
              const userIsGuest = user?.uid && battle.guestId && user.uid === battle.guestId;
              if (userIsHost || userIsGuest) {
                const localTurn = battle.currentTurn === 'host'
                  ? (userIsHost ? 'player' : 'opponent')
                  : (userIsGuest ? 'player' : 'opponent');
                (aligned as any).turn = localTurn;
              }
            } catch {}
            setBattleStateIfChanged(aligned);
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

  // Force-align local turn with server turn whenever it changes (even if battleData is unchanged)
  useEffect(() => {
    if (!isMultiplayer || !multiplayerBattle || !battleState) return;
    try {
      const userIsHost = Boolean(user?.uid && multiplayerBattle.hostId && user?.uid === multiplayerBattle.hostId);
      const localTurn = multiplayerBattle.currentTurn === 'host'
        ? (userIsHost ? 'player' : 'opponent')
        : (userIsHost ? 'opponent' : 'player');
      if ((battleState as any).turn !== localTurn) {
        const aligned = { ...(battleState as any), turn: localTurn };
        setBattleStateIfChanged(aligned as TeamBattleState);
      }
    } catch {}
  }, [isMultiplayer, multiplayerBattle?.currentTurn, multiplayerBattle?.turnNumber, battleState, user]);

  // Handle chat notifications
  // const handleChatNotification = useCallback((message: string) => {
  //   if (!showChat) {
  //     showChatNotification(message, () => setShowChat(true));
  //   }
  // }, [showChat, showChatNotification]);

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

  // Handle automatic switching when Pokémon faint
  useEffect(() => {
    console.log('=== AUTOMATIC SWITCHING useEffect TRIGGERED ===');
    console.log('Conditions:', {
      hasBattleState: !!battleState,
      isComplete: battleState?.isComplete,
      switchingInProgress
    });
    
    if (!battleState || battleState.isComplete || switchingInProgress) {
      console.log('Early return from automatic switching useEffect');
      return;
    }

    const currentPlayer = getCurrentPokemon(battleState.player);
    const currentOpponent = getCurrentPokemon(battleState.opponent);

    // Debug: Always log current Pokemon status
    console.log('=== AUTOMATIC SWITCHING CHECK ===');
    console.log('Current player Pokemon:', {
      name: currentPlayer.pokemon.name,
      hp: currentPlayer.currentHp,
      isFainted: currentPlayer.currentHp <= 0
    });
    console.log('Current opponent Pokemon:', {
      name: currentOpponent.pokemon.name,
      hp: currentOpponent.currentHp,
      isFainted: currentOpponent.currentHp <= 0
    });

    // Check if any Pokémon has fainted and needs to be switched
    if (currentPlayer.currentHp <= 0 || currentOpponent.currentHp <= 0) {
      console.log('=== POKEMON FAINTED - DETAILED DEBUG ===');
      console.log('Player team state:', {
        currentIndex: battleState.player.currentIndex,
        faintedCount: battleState.player.faintedCount,
        teamSize: battleState.player.pokemon.length,
        pokemon: battleState.player.pokemon.map((p, i) => ({
          index: i,
          name: p.pokemon.name,
          hp: p.currentHp,
          maxHp: p.maxHp,
          isCurrent: i === battleState.player.currentIndex,
          isFainted: p.currentHp <= 0
        }))
      });
      
      console.log('Opponent team state:', {
        currentIndex: battleState.opponent.currentIndex,
        faintedCount: battleState.opponent.faintedCount,
        teamSize: battleState.opponent.pokemon.length,
        pokemon: battleState.opponent.pokemon.map((p, i) => ({
          index: i,
          name: p.pokemon.name,
          hp: p.currentHp,
          maxHp: p.maxHp,
          isCurrent: i === battleState.opponent.currentIndex,
          isFainted: p.currentHp <= 0
        }))
      });
      
      console.log('Current Pokemon status:', {
        playerFainted: currentPlayer.currentHp <= 0,
        opponentFainted: currentOpponent.currentHp <= 0,
        playerName: currentPlayer.pokemon.name,
        opponentName: currentOpponent.pokemon.name,
        playerHp: currentPlayer.currentHp,
        opponentHp: currentOpponent.currentHp
      });
      
      setSwitchingInProgress(true);
      // Use multiplayer switching for multiplayer battles, automatic for single-player
      const updatedState = isMultiplayer 
        ? handleMultiplayerSwitching(battleState, battleState.turn === 'player')
        : handleAutomaticSwitching(battleState);
      
      if (updatedState !== battleState) {
        console.log('=== SWITCHING OCCURRED ===');
        console.log('New player state:', {
          index: updatedState.player.currentIndex,
          name: getCurrentPokemon(updatedState.player).pokemon.name,
          hp: getCurrentPokemon(updatedState.player).currentHp
        });
        console.log('New opponent state:', {
          index: updatedState.opponent.currentIndex,
          name: getCurrentPokemon(updatedState.opponent).pokemon.name,
          hp: getCurrentPokemon(updatedState.opponent).currentHp
        });
        console.log('New turn:', updatedState.turn);
        
        // Safeguard: Ensure turn is set correctly after switching
        const newPlayer = getCurrentPokemon(updatedState.player);
        const newOpponent = getCurrentPokemon(updatedState.opponent);
        
        if (newPlayer.currentHp > 0 && newOpponent.currentHp > 0) {
          // Both Pokemon are alive, ensure turn is set correctly
          if (updatedState.turn !== 'player' && updatedState.turn !== 'opponent') {
            console.log('WARNING: Invalid turn state after switching, defaulting to player');
            updatedState.turn = 'player';
          }
        }
        
        setBattleStateIfChanged(updatedState);
        
        // Check if battle is now complete
        if (updatedState.isComplete) {
          console.log('Battle completed during switching!');
          setSwitchingInProgress(false);
          return;
        }
      } else {
        console.log('=== NO SWITCHING OCCURRED ===');
        console.log('Battle may be over or no available Pokemon');
        console.log('Player team defeated:', battleState.player.faintedCount >= battleState.player.pokemon.length);
        console.log('Opponent team defeated:', battleState.opponent.faintedCount >= battleState.opponent.pokemon.length);
        
        // Check if battle should be complete
        if (battleState.player.faintedCount >= battleState.player.pokemon.length) {
          console.log('Player team fully defeated - marking battle complete');
          const defeatState = { ...battleState, isComplete: true, winner: 'opponent' as const };
          setBattleStateIfChanged(defeatState);
          return;
        } else if (battleState.opponent.faintedCount >= battleState.opponent.pokemon.length) {
          console.log('Opponent team fully defeated - marking battle complete');
          const victoryState = { ...battleState, isComplete: true, winner: 'player' as const };
          setBattleStateIfChanged(victoryState);
          return;
        }
      }
      // Reset switching flag after a short delay
      setTimeout(() => setSwitchingInProgress(false), 100);
    }
  }, [
    battleState?.player?.currentIndex,
    battleState?.opponent?.currentIndex,
    playerHpString,
    opponentHpString,
    battleState?.isComplete,
    switchingInProgress
  ]);

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

  // Handle AI turns when it's the opponent's turn (single-player only)
  useEffect(() => {
    if (isMultiplayer) return; // Never run AI in multiplayer
    if (!battleState || battleState.isComplete || isAITurn || switchingInProgress) return;
    
    if (battleState.turn === 'opponent') {
      const currentOpponent = getCurrentPokemon(battleState.opponent);
      if (currentOpponent.currentHp > 0) {
        console.log('=== AI TURN TRIGGERED ===');
        console.log('Opponent Pokemon:', currentOpponent.pokemon.name, 'HP:', currentOpponent.currentHp);
        
        setIsAITurn(true);
        
        // Add a small delay to make the AI turn visible
        setTimeout(async () => {
          try {
            const aiMoveIndex = Math.floor(Math.random() * currentOpponent.moves.length);
            console.log('AI selecting move:', aiMoveIndex, currentOpponent.moves[aiMoveIndex]?.name);
            const newState = await executeTeamAction(battleState, { type: 'move', moveIndex: aiMoveIndex });
            setBattleState(newState);
          } catch (err) {
            console.error("AI move failed:", err);
          } finally {
            setIsAITurn(false);
          }
        }, 1000); // 1 second delay
      }
    }
  }, [isMultiplayer, battleState?.turn, battleState?.opponent?.currentIndex, isAITurn, switchingInProgress]);

  // Direct HP monitoring for immediate switching
  useEffect(() => {
    if (!battleState || battleState.isComplete || switchingInProgress) return;
    
    const currentPlayer = getCurrentPokemon(battleState.player);
    const currentOpponent = getCurrentPokemon(battleState.opponent);
    
    console.log('=== DIRECT HP MONITORING ===');
    console.log('Player HP:', currentPlayer.currentHp, 'Opponent HP:', currentOpponent.currentHp);
    
    if (currentPlayer.currentHp <= 0 || currentOpponent.currentHp <= 0) {
      console.log('=== IMMEDIATE SWITCHING TRIGGERED ===');
      setSwitchingInProgress(true);
      
      // Use multiplayer switching for multiplayer battles, automatic for single-player
      const updatedState = isMultiplayer 
        ? handleMultiplayerSwitching(battleState, battleState.turn === 'player')
        : handleAutomaticSwitching(battleState);
      if (updatedState !== battleState) {
        console.log('Immediate switching successful');
        setBattleStateIfChanged(updatedState);
        
        // Check if battle is now complete
        if (updatedState.isComplete) {
          console.log('Battle completed during switching!');
          setSwitchingInProgress(false);
          return;
        }
      } else {
        console.log('Immediate switching failed');
      }
      
      setTimeout(() => setSwitchingInProgress(false), 100);
    }
  }, [playerHpString, opponentHpString, switchingInProgress]);

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
        console.log('Initializing multiplayer battle...');
        
        // Get team data from multiplayer battle
        const isHost = user?.uid === battleMeta.hostId;
        const playerTeam = isHost ? battleMeta.hostTeam : battleMeta.guestTeam;
        const opponentTeam = isHost ? battleMeta.guestTeam : battleMeta.hostTeam;
        
        if (!playerTeam || !opponentTeam) {
          throw new Error("Team data not available for multiplayer battle");
        }
        
        // Convert SavedTeam to the format expected by initializeTeamBattle
        const convertTeamForBattle = async (team: SavedTeam) => {
          const battleTeam = [];
          for (const slot of team.slots) {
            if (slot.id) {
              try {
                const pokemon = await getPokemon(slot.id);
                const moves = await Promise.all(
                  slot.moves.map(async (move: unknown) => {
                    if (typeof move === 'string') {
                      return await getMove(move);
                    }
                    return move;
                  })
                );
                battleTeam.push({
                  pokemon,
                  level: slot.level,
                  moves: moves.filter((move): move is Move => move !== null && move !== undefined && typeof move === 'object' && 'name' in move)
                });
              } catch (error) {
                console.error(`Failed to load Pokemon ${slot.id}:`, error);
              }
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
        setBattleStateIfChanged(battleState);
        
        // Start the battle in Firestore
        if (effectiveBattleId) {
          await battleService.startBattle(effectiveBattleId, battleState as unknown);
        }
        
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
      const createFallbackMove = (name: string, type: string = 'normal', power: number = 40) => ({
        id: Math.floor(Math.random() * 10000), // Random ID for fallback moves
        name,
        accuracy: 100,
        effect_chance: null,
        pp: 35,
        priority: 0,
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
      });

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
          console.log('Initializing multiplayer battle...');
          
          // Get team data from multiplayer battle
          const isHost = user?.uid === battleMeta.hostId;
          const playerTeam = isHost ? battleMeta.hostTeam : battleMeta.guestTeam;
          const opponentTeam = isHost ? battleMeta.guestTeam : battleMeta.hostTeam;
          
          if (!playerTeam || !opponentTeam) {
            throw new Error("Team data not available for multiplayer battle");
          }
          
          // Convert SavedTeam to the format expected by initializeTeamBattle
          const convertTeamForBattle = async (team: SavedTeam) => {
            const battleTeam = [];
            for (const slot of team.slots) {
              if (slot.id) {
                try {
                  const pokemon = await getPokemon(slot.id);
                  const moves = await Promise.all(
                    slot.moves.map(async (move: unknown) => {
                      if (typeof move === 'string') {
                        return await getMove(move);
                      }
                      return move;
                    })
                  );
                  battleTeam.push({
                    pokemon,
                    level: slot.level,
                    moves: moves.filter((move): move is Move => move !== null && move !== undefined && typeof move === 'object' && 'name' in move)
                  });
                } catch (error) {
                  console.error(`Failed to load Pokemon ${slot.id}:`, error);
                }
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
          setBattleStateIfChanged(battleState);
          
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
    if (!battleState || battleState.turn !== 'player' || battleState.isComplete) return;

    setSelectedMove(moveIndex);
    
    if (isMultiplayer && battleId && multiplayerBattle) {
      // Multiplayer mode - sync move with other player
      try {
        const currentPokemon = getCurrentPokemon(battleState.player);
        const moveName = currentPokemon.moves[moveIndex]?.name || 'Unknown Move';
        
        // Add move to battle service
        await battleService.addMove(
          battleId,
          user?.uid || '',
          user?.displayName || 'Anonymous',
          moveIndex,
          moveName
        );
        
        // Execute move locally
        const newState = await executeTeamAction(battleState, { type: 'move', moveIndex });
        setBattleStateIfChanged(newState);
        
        // Update battle data and force next turn/turnNumber to ensure remote sync
        const userIsHost = Boolean(user?.uid && multiplayerBattle.hostId && user?.uid === multiplayerBattle.hostId);
        const nextTurn = userIsHost ? 'guest' : 'host';
        const nextTurnNumber = (multiplayerBattle.turnNumber || 0) + 1;
        await battleService.updateBattle(battleId, {
          battleData: newState as unknown,
          currentTurn: nextTurn,
          turnNumber: nextTurnNumber
        });
        // Broadcast a system-like chat message for visibility
        try {
          await chatService.sendSystemMessage(roomId as string, `${userIsHost ? hostName : guestName} used ${moveName}`);
        } catch {}
        
        if (newState.isComplete) {
          // Battle is complete
          await battleService.endBattle(battleId, newState.winner || 'draw', newState as unknown);
          setSelectedMove(null);
          return;
        }
        
      } catch (error) {
        console.error('Failed to sync move:', error);
        alert('Failed to sync move with opponent. Please try again.');
      } finally {
        setSelectedMove(null);
      }
    } else {
      // Single player mode - original AI logic
      const newState = await executeTeamAction(battleState, { type: 'move', moveIndex });
      setBattleStateIfChanged(newState);

      if (newState.isComplete) {
        setSelectedMove(null);
        return;
      }

      // AI turn will be handled by the useEffect
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
    // The useEffect will automatically trigger initialization
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-bg text-text flex items-center justify-center">
        <div className="text-center">
          <img 
            src="/loading.gif" 
            alt="Loading battle" 
            width={100} 
            height={100} 
            className="mx-auto mb-4"
          />
          <p>{authLoading ? 'Loading authentication...' : 'Initializing battle...'}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg text-text flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => router.push("/battle")}
            className="px-4 py-2 bg-poke-blue text-white rounded-lg hover:bg-poke-blue/90"
          >
            Back to Battle Setup
          </button>
        </div>
      </div>
    );
  }

  if (!battleState) return null;

  const { player: playerTeam, opponent: opponentTeam, turn, battleLog, isComplete, winner } = battleState;
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
              onClick={() => router.push("/battle")}
              className="flex items-center space-x-2 text-muted hover:text-text transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Back to Battle Setup</span>
            </button>
            <div className="flex items-center gap-2">
              {isMultiplayer && roomId && (
                <button
                  onClick={() => setShowChat(!showChat)}
                  className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
                  title="Toggle Chat"
                >
                  <MessageCircle className="h-4 w-4" />
                  Chat
                </button>
              )}
              <button
                onClick={restartBattle}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title="Restart Battle"
              >
                <RotateCcw className="h-4 w-4" />
                Restart
              </button>
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

        {/* Move Selection */}
          {(() => {
            const shouldShowMoves = !isComplete && turn === 'player' && player.currentHp > 0 && !battleState?.needsPokemonSelection;
            console.log('Move selection visibility check:', {
              isComplete,
              turn,
              playerHp: player.currentHp,
              playerName: player.pokemon.name,
              shouldShowMoves,
              switchingInProgress
            });
            return shouldShowMoves;
          })() && (
          <div className="bg-surface border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Select a Move</h3>
            <div className="grid grid-cols-2 gap-3">
              {player.moves.map((move, index) => (
                <button
                  key={index}
                  onClick={() => handlePlayerMove(index)}
                  disabled={isAITurn || (isMultiplayer && multiplayerBattle && user?.uid !== (multiplayerBattle.currentTurn === 'host' ? multiplayerBattle.hostId : multiplayerBattle.guestId)) || false}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    selectedMove === index
                      ? 'border-poke-blue bg-blue-50'
                      : 'border-border hover:border-poke-blue hover:bg-blue-50'
                  } ${(isAITurn || (isMultiplayer && multiplayerBattle && user?.uid !== (multiplayerBattle.currentTurn === 'host' ? multiplayerBattle.hostId : multiplayerBattle.guestId)) || false) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="font-medium capitalize">{move.name}</div>
                  <div className="text-sm text-muted">
                    {move.power ? `Power: ${move.power}` : 'Status Move'} • {move.accuracy || 100}% accuracy
                  </div>
                  <div className="text-xs text-muted capitalize">{getTypeName(move.type)}</div>
                </button>
              ))}
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
        {isMultiplayer && roomId && (
          <div className="fixed bottom-4 right-4 w-80 z-40">
            <Chat 
              roomId={roomId}
              isCollapsible={true}
              isCollapsed={false}
              onToggleCollapse={() => setShowChat(false)}
              className="shadow-2xl"
            />
          </div>
        )}
      </main>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Battle Results Dialog */}
      {showBattleResults && battleState && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="text-center mb-6">
              <h2 className={`text-3xl font-bold mb-2 ${
                battleState.winner === 'player' ? 'text-green-500' : 'text-red-500'
              }`}>
                {battleState.winner === 'player' ? 'Victory!' : 'Defeat!'}
              </h2>
              <p className="text-muted">
                {battleState.winner === 'player' 
                  ? 'Congratulations! You won the battle!' 
                  : 'Better luck next time!'}
              </p>
            </div>

            {/* Remaining Pokemon Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Player Team */}
              <div className="bg-white/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3 text-center">Your Team</h3>
                <div className="space-y-2">
                  {battleState.player.pokemon.map((pokemon, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 rounded bg-white/30">
                      <div className="relative w-12 h-12 flex-shrink-0">
                        <Image
                          src={getPokemonSpriteUrl(pokemon.pokemon.id)}
                          alt={pokemon.pokemon.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium capitalize text-sm">
                          {pokemon.pokemon.name}
                        </div>
                        <div className="text-xs text-muted">
                          Lv. {pokemon.level}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all ${
                                pokemon.currentHp > 0 ? 'bg-green-500' : 'bg-red-500'
                              }`}
                              style={{ 
                                width: `${Math.max(0, (pokemon.currentHp / pokemon.maxHp) * 100)}%` 
                              }}
                            />
                          </div>
                          <span className="text-xs font-mono">
                            {pokemon.currentHp}/{pokemon.maxHp}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Opponent Team */}
              <div className="bg-white/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3 text-center">Opponent Team</h3>
                <div className="space-y-2">
                  {battleState.opponent.pokemon.map((pokemon, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 rounded bg-white/30">
                      <div className="relative w-12 h-12 flex-shrink-0">
                        <Image
                          src={getPokemonSpriteUrl(pokemon.pokemon.id)}
                          alt={pokemon.pokemon.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium capitalize text-sm">
                          {pokemon.pokemon.name}
                        </div>
                        <div className="text-xs text-muted">
                          Lv. {pokemon.level}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all ${
                                pokemon.currentHp > 0 ? 'bg-green-500' : 'bg-red-500'
                              }`}
                              style={{ 
                                width: `${Math.max(0, (pokemon.currentHp / pokemon.maxHp) * 100)}%` 
                              }}
                            />
                          </div>
                          <span className="text-xs font-mono">
                            {pokemon.currentHp}/{pokemon.maxHp}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => router.push("/battle")}
                className="px-6 py-3 bg-poke-blue text-white rounded-lg hover:bg-poke-blue/90 transition-colors font-medium"
              >
                Back to Battle Setup
              </button>
              <button
                onClick={restartBattle}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Battle Again
              </button>
            </div>
          </div>
        </div>
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
