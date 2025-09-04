"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, RotateCcw } from "lucide-react";
import Image from "next/image";
import { getPokemon, getMove } from "@/lib/api";
import { GYM_CHAMPIONS } from "@/lib/gym_champions";
import { 
  BattleState, 
  BattlePokemon, 
  initializeBattle, 
  executeAction,
  calculateHp,
  calculateStat 
} from "@/lib/battle-engine";
import { getAIMove, Difficulty } from "@/lib/ai-battle";

const STORAGE_KEY = "pokemon-team-builder";

type SavedTeam = { 
  id: string; 
  name: string; 
  slots: Array<{ id: number | null; level: number; moves: any[] }>; 
};

export default function BattleRuntimePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMove, setSelectedMove] = useState<number | null>(null);
  const [isAITurn, setIsAITurn] = useState(false);

  const playerTeamId = searchParams.get("player");
  const opponentKind = searchParams.get("opponentKind");
  const opponentId = searchParams.get("opponentId");
  const difficulty = (searchParams.get("difficulty") as Difficulty) || "normal";

  const initializeBattleState = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!playerTeamId || !opponentKind || !opponentId) {
        throw new Error("Missing battle parameters");
      }

      // Load saved teams
      const savedTeamsRaw = localStorage.getItem(STORAGE_KEY);
      if (!savedTeamsRaw) throw new Error("No saved teams found");
      const savedTeams: SavedTeam[] = JSON.parse(savedTeamsRaw);

      // Get player team
      const playerTeam = savedTeams.find(t => t.id === playerTeamId);
      if (!playerTeam) throw new Error("Player team not found");

      // Get opponent team
      let opponentTeam: { name: string; slots: Array<{ id: number; level: number }> };
      
      if (opponentKind === "champion") {
        const champion = GYM_CHAMPIONS.find(c => c.id === opponentId);
        if (!champion) throw new Error("Champion not found");
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
      const playerSlot = playerTeam.slots.find(s => s.id != null);
      const opponentSlot = opponentTeam.slots[0];
      
      if (!playerSlot || !opponentSlot) {
        throw new Error("No valid Pokemon found in teams");
      }

      // Fetch Pokemon data with error handling
      const [playerResult, opponentResult] = await Promise.allSettled([
        getPokemon(playerSlot.id as number),
        getPokemon(opponentSlot.id)
      ]);

      if (playerResult.status === 'rejected') {
        throw new Error(`Failed to load player Pokemon: ${playerResult.reason}`);
      }
      if (opponentResult.status === 'rejected') {
        throw new Error(`Failed to load opponent Pokemon: ${opponentResult.reason}`);
      }

      const playerPokemon = playerResult.value;
      const opponentPokemon = opponentResult.value;

      // Get moves for each Pokemon (simplified - use first 4 moves from their movepool)
      const playerMoves = playerSlot.moves.slice(0, 4).map(m => m.name);
      const opponentMoves = ["tackle", "scratch", "quick-attack", "defense-curl"]; // More reliable move names

      // Fetch move data with error handling
      const [playerMoveData, opponentMoveData] = await Promise.all([
        Promise.allSettled(playerMoves.map(name => getMove(name))),
        Promise.allSettled(opponentMoves.map(name => getMove(name)))
      ]);

      // Filter out failed moves and create fallback moves
      const getValidMoves = (results: PromiseSettledResult<any>[]) => {
        return results
          .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
          .map(result => result.value)
          .filter(Boolean);
      };

      const validPlayerMoves = getValidMoves(playerMoveData);
      const validOpponentMoves = getValidMoves(opponentMoveData);

      // Create fallback moves if we don't have enough
      const createFallbackMove = (name: string, type: string = 'normal', power: number = 40) => ({
        name,
        type,
        power,
        accuracy: 100,
        pp: 35,
        effect: 'Deals damage',
        damage_class: 'physical' as const,
        priority: 0
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

      // Initialize battle
      const battle = initializeBattle(
        playerPokemon,
        playerSlot.level,
        finalPlayerMoves,
        opponentPokemon,
        opponentSlot.level,
        finalOpponentMoves
      );

      setBattleState(battle);
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
    initializeBattleState();
  }, [initializeBattleState]);

  const handlePlayerMove = async (moveIndex: number) => {
    if (!battleState || battleState.turn !== 'player' || battleState.isComplete) return;

    setSelectedMove(moveIndex);
    
    // Execute player move
    const newState = executeAction(battleState, { type: 'move', moveIndex });
    setBattleState(newState);

    if (newState.isComplete) {
      setSelectedMove(null);
      return;
    }

    // AI turn
    setIsAITurn(true);
    try {
      const aiAction = await getAIMove(newState, difficulty, 1500);
      const finalState = executeAction(newState, aiAction);
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

  const { player, opponent, turn, battleLog, isComplete, winner } = battleState;

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

        {/* Battle Field */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Player Pokemon */}
          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative w-24 h-24">
                <Image
                  src={player.pokemon.sprites.front_default || '/placeholder-pokemon.png'}
                  alt={player.pokemon.name}
                  fill
                  className="object-contain"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold capitalize">{player.pokemon.name}</h3>
                <p className="text-sm text-muted">Lv. {player.level}</p>
                <div className="flex gap-1 mt-1">
                  {player.pokemon.types.map(type => (
                    <span
                      key={type}
                      className="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-800"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            {/* HP Bar */}
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span>HP</span>
                <span>{player.currentHp} / {player.maxHp}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    player.currentHp / player.maxHp > 0.5 ? 'bg-green-500' :
                    player.currentHp / player.maxHp > 0.25 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${(player.currentHp / player.maxHp) * 100}%` }}
                />
              </div>
            </div>

            {/* Status */}
            {player.status && (
              <div className="text-sm text-orange-500">
                Status: {player.status}
              </div>
            )}
          </div>

          {/* Opponent Pokemon */}
          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative w-24 h-24">
                <Image
                  src={opponent.pokemon.sprites.front_default || '/placeholder-pokemon.png'}
                  alt={opponent.pokemon.name}
                  fill
                  className="object-contain"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold capitalize">{opponent.pokemon.name}</h3>
                <p className="text-sm text-muted">Lv. {opponent.level}</p>
                <div className="flex gap-1 mt-1">
                  {opponent.pokemon.types.map(type => (
                    <span
                      key={type}
                      className="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-800"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            {/* HP Bar */}
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span>HP</span>
                <span>{opponent.currentHp} / {opponent.maxHp}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    opponent.currentHp / opponent.maxHp > 0.5 ? 'bg-green-500' :
                    opponent.currentHp / opponent.maxHp > 0.25 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${(opponent.currentHp / opponent.maxHp) * 100}%` }}
                />
              </div>
            </div>

            {/* Status */}
            {opponent.status && (
              <div className="text-sm text-orange-500">
                Status: {opponent.status}
              </div>
            )}
          </div>
        </div>

        {/* Move Selection */}
        {!isComplete && turn === 'player' && (
          <div className="bg-surface border border-border rounded-xl p-6 mb-6">
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
                  <div className="text-xs text-muted capitalize">{move.type}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Battle Log */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Battle Log</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {battleLog.map((log, index) => (
              <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                {log}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
