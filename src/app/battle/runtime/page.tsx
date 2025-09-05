"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, RotateCcw, MessageCircle } from "lucide-react";
import Image from "next/image";
import { getPokemon, getMove } from "@/lib/api";
import { Move } from "@/types/pokemon";
import { GYM_CHAMPIONS } from "@/lib/gym_champions";
import { 
  BattleState as TeamBattleState,
  initializeTeamBattle,
  executeTeamAction,
  getCurrentPokemon,
  handleAutomaticSwitching
} from "@/lib/team-battle-engine";
import TypeBadge from "@/components/TypeBadge";
import HealthBar from "@/components/HealthBar";
import Chat from "@/components/Chat";
import { ToastContainer, useToast } from "@/components/Toast";
import { useAuth } from "@/contexts/AuthContext";

const STORAGE_KEY = "pokemon-team-builder";

type SavedTeam = { 
  id: string; 
  name: string; 
  slots: Array<{ id: number | null; level: number; moves: unknown[] }>; 
};

function BattleRuntimePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // const { user } = useAuth();
  const { toasts, removeToast, showChatNotification } = useToast();
  
  const [battleState, setBattleState] = useState<TeamBattleState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMove, setSelectedMove] = useState<number | null>(null);
  const [isAITurn, setIsAITurn] = useState(false);
  const battleLogRef = useRef<HTMLDivElement>(null);
  
  // Animation states
  const [playerAnimation, setPlayerAnimation] = useState<'enter' | 'idle' | 'faint'>('idle');
  const [opponentAnimation, setOpponentAnimation] = useState<'enter' | 'idle' | 'faint'>('idle');
  const [previousPlayerId, setPreviousPlayerId] = useState<number | null>(null);
  const [previousOpponentId, setPreviousOpponentId] = useState<number | null>(null);

  // Multiplayer and chat states
  const [showChat, setShowChat] = useState(false);
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);

  const playerTeamId = searchParams.get("player");
  const opponentKind = searchParams.get("opponentKind");
  const opponentId = searchParams.get("opponentId");
  const multiplayerRoomId = searchParams.get("roomId");
  // const multiplayerTeamId = searchParams.get("teamId");

  // Initialize multiplayer mode
  useEffect(() => {
    if (multiplayerRoomId) {
      setIsMultiplayer(true);
      setRoomId(multiplayerRoomId);
      // TODO: Set up real-time battle synchronization
      console.log('Multiplayer battle initialized for room:', multiplayerRoomId);
    }
  }, [multiplayerRoomId]);

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
  }, [battleState, previousPlayerId, previousOpponentId, playerAnimation, opponentAnimation]);

  // Handle automatic switching when Pokémon faint
  useEffect(() => {
    if (!battleState || battleState.isComplete) return;

    const currentPlayer = getCurrentPokemon(battleState.player);
    const currentOpponent = getCurrentPokemon(battleState.opponent);

    // Check if any Pokémon has fainted and needs to be switched
    if (currentPlayer.currentHp <= 0 || currentOpponent.currentHp <= 0) {
      const updatedState = handleAutomaticSwitching(battleState);
      if (updatedState !== battleState) {
        setBattleState(updatedState);
      }
    }
  }, [battleState]);

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
  }, [battleState]);

  const initializeBattleState = useCallback(async () => {
    try {
      console.log('Starting battle initialization...');
      setLoading(true);
      setError(null);

      if (!playerTeamId || !opponentKind || !opponentId) {
        throw new Error("Missing battle parameters");
      }

      // Load saved teams
      const savedTeamsRaw = localStorage.getItem(STORAGE_KEY);
      let savedTeams: SavedTeam[] = [];
      
      if (!savedTeamsRaw) {
        // Create a default test team if none exists
        console.log('No saved teams found, creating default test team...');
        const defaultTeam: SavedTeam = {
          id: "1756959740815",
          name: "Test Team",
          slots: [
            {
              id: 25, // Pikachu
              level: 15,
              moves: [
                { name: 'thunderbolt', type: 'electric', power: 90, accuracy: 100, pp: 15, effect: 'Deals damage', damage_class: 'special', priority: 0 },
                { name: 'quick-attack', type: 'normal', power: 40, accuracy: 100, pp: 30, effect: 'Deals damage', damage_class: 'physical', priority: 1 },
                { name: 'iron-tail', type: 'steel', power: 100, accuracy: 75, pp: 15, effect: 'Deals damage', damage_class: 'physical', priority: 0 },
                { name: 'thunder', type: 'electric', power: 110, accuracy: 70, pp: 10, effect: 'Deals damage', damage_class: 'special', priority: 0 },
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
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedTeams));
        console.log('Default test team created');
      } else {
        savedTeams = JSON.parse(savedTeamsRaw);
      }

      // Get player team
      const playerTeam = savedTeams.find(t => t.id === playerTeamId);
      if (!playerTeam) {
        console.error('Player team not found. Available teams:', savedTeams.map(t => ({ id: t.id, name: t.name })));
        throw new Error(`Player team with ID "${playerTeamId}" not found. Available teams: ${savedTeams.map(t => t.name).join(', ')}`);
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
        if (!team) throw new Error("Opponent team not found");
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
      
      console.log('Battle initialized:', battle);

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

      
      setBattleState(sanitizedBattle as TeamBattleState);
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
    } finally {
      setLoading(false);
    }
  }, [playerTeamId, opponentKind, opponentId]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.error('Battle initialization timeout');
        setError('Battle initialization is taking too long. Please try again.');
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    initializeBattleState();
    
    return () => clearTimeout(timeoutId);
  }, [initializeBattleState, loading]);

  const handlePlayerMove = async (moveIndex: number) => {
    if (!battleState || battleState.turn !== 'player' || battleState.isComplete) return;

    setSelectedMove(moveIndex);
    
    // Execute player move
    const newState = await executeTeamAction(battleState, { type: 'move', moveIndex });
    setBattleState(newState);

    if (newState.isComplete) {
      setSelectedMove(null);
      return;
    }

    // AI turn
    setIsAITurn(true);
    try {
      // For now, use a simple AI move selection
      const currentOpponent = getCurrentPokemon(newState.opponent);
      const aiMoveIndex = Math.floor(Math.random() * currentOpponent.moves.length);
      const finalState = await executeTeamAction(newState, { type: 'move', moveIndex: aiMoveIndex });
      setBattleState(finalState);
    } catch (err) {
      console.error("AI move failed:", err);
    } finally {
      setIsAITurn(false);
      setSelectedMove(null);
    }
  };

  const restartBattle = () => {
    initializeBattleState();
  };

  if (loading) {
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
          <p>Initializing battle...</p>
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

  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="sticky top-0 z-50 border-b border-border bg-surface">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
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

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Battle Status */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">
            {isComplete ? (
              <span className={winner === 'player' ? 'text-green-500' : 'text-red-500'}>
                {winner === 'player' ? 'Victory!' : 'Defeat!'}
              </span>
            ) : (
              <span className={turn === 'player' ? 'text-blue-500' : 'text-red-500'}>
                {turn === 'player' ? 'Your Turn' : 'Opponent\'s Turn'}
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
          {!isComplete && turn === 'player' && player.currentHp > 0 && (
          <div className="bg-surface border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Select a Move</h3>
            <div className="grid grid-cols-2 gap-3">
              {player.moves.map((move, index) => (
                <button
                  key={index}
                  onClick={() => handlePlayerMove(index)}
                  disabled={isAITurn}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    selectedMove === index
                      ? 'border-poke-blue bg-blue-50'
                      : 'border-border hover:border-poke-blue hover:bg-blue-50'
                  } ${isAITurn ? 'opacity-50 cursor-not-allowed' : ''}`}
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

          {/* Pokémon Fainted Message */}
          {!isComplete && turn === 'player' && player.currentHp <= 0 && (
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

        {/* Chat Component for Multiplayer */}
        {isMultiplayer && roomId && showChat && (
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
