'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import UserProfile from '@/components/auth/UserProfile';
import ProtectedRoute from '@/components/auth/ProtectedRoute';



interface OnlineBattleState {
  roomId: string;
  player1: {
    id: string;
    name: string;
    team: Array<{
      id: number;
      name: string;
      hp: number;
      maxHp: number;
      moves: string[];
    }>;
    currentPokemon: number;
  };
  player2: {
    id: string;
    name: string;
    team: Array<{
      id: number;
      name: string;
      hp: number;
      maxHp: number;
      moves: string[];
    }>;
    currentPokemon: number;
  };
  turn: 'player1' | 'player2';
  turnNumber: number;
  battleLog: string[];
  isComplete: boolean;
  winner?: 'player1' | 'player2';
}

function OnlineBattlePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const roomId = params.roomId as string;
  
  const [battleState, setBattleState] = useState<OnlineBattleState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMove, setSelectedMove] = useState<number | null>(null);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);

  // Mock battle state - will be replaced with Firebase/Firestore
  useEffect(() => {
    if (!user) return;

    const mockBattleState: OnlineBattleState = {
      roomId,
      player1: {
        id: user.uid,
        name: user.displayName || 'Player 1',
        team: [
          { id: 1, name: 'Charizard', hp: 100, maxHp: 100, moves: ['Flamethrower', 'Dragon Claw', 'Earthquake', 'Roost'] },
          { id: 2, name: 'Blastoise', hp: 100, maxHp: 100, moves: ['Hydro Pump', 'Ice Beam', 'Earthquake', 'Protect'] },
          { id: 3, name: 'Venusaur', hp: 100, maxHp: 100, moves: ['Solar Beam', 'Sludge Bomb', 'Earthquake', 'Sleep Powder'] }
        ],
        currentPokemon: 0
      },
      player2: {
        id: 'opponent',
        name: 'Opponent',
        team: [
          { id: 4, name: 'Pikachu', hp: 100, maxHp: 100, moves: ['Thunderbolt', 'Quick Attack', 'Iron Tail', 'Thunder Wave'] },
          { id: 5, name: 'Lapras', hp: 100, maxHp: 100, moves: ['Surf', 'Ice Beam', 'Thunderbolt', 'Perish Song'] },
          { id: 6, name: 'Snorlax', hp: 100, maxHp: 100, moves: ['Body Slam', 'Earthquake', 'Rest', 'Sleep Talk'] }
        ],
        currentPokemon: 0
      },
      turn: 'player1',
      turnNumber: 1,
      battleLog: [
        'Battle started!',
        'Player 1 sent out Charizard!',
        'Player 2 sent out Pikachu!'
      ],
      isComplete: false
    };

    setTimeout(() => {
      setBattleState(mockBattleState);
      setLoading(false);
    }, 1000);
  }, [roomId, user]);

  const makeMove = async (moveIndex: number) => {
    if (!battleState || !user || battleState.turn !== (battleState.player1.id === user.uid ? 'player1' : 'player2')) {
      return;
    }

    setSelectedMove(moveIndex);
    setWaitingForOpponent(true);

    try {
      // TODO: Send move to Firebase/Firestore
      console.log('Making move:', moveIndex);
      
      // Mock move execution
      setTimeout(() => {
        setBattleState(prev => {
          if (!prev) return null;
          
          const newLog = [...prev.battleLog];
          const currentPlayer = prev.turn === 'player1' ? prev.player1 : prev.player2;
          const currentPokemon = currentPlayer.team[currentPlayer.currentPokemon];
          const move = currentPokemon.moves[moveIndex];
          
          newLog.push(`${currentPlayer.name}&apos;s ${currentPokemon.name} used ${move}!`);
          
          return {
            ...prev,
            turn: prev.turn === 'player1' ? 'player2' : 'player1',
            turnNumber: prev.turnNumber + 1,
            battleLog: newLog
          };
        });
        
        setWaitingForOpponent(false);
        setSelectedMove(null);
      }, 2000);
    } catch (error) {
      console.error('Failed to make move:', error);
      setWaitingForOpponent(false);
      setSelectedMove(null);
    }
  };

  const switchPokemon = async (pokemonIndex: number) => {
    if (!battleState || !user) return;

    try {
      // TODO: Send switch to Firebase/Firestore
      console.log('Switching to Pokemon:', pokemonIndex);
      
      setBattleState(prev => {
        if (!prev) return null;
        
        const isPlayer1 = prev.player1.id === user.uid;
        const newLog = [...prev.battleLog];
        
        if (isPlayer1) {
          newLog.push(`${prev.player1.name} switched to ${prev.player1.team[pokemonIndex].name}!`);
          return {
            ...prev,
            player1: { ...prev.player1, currentPokemon: pokemonIndex },
            battleLog: newLog
          };
        } else {
          newLog.push(`${prev.player2.name} switched to ${prev.player2.team[pokemonIndex].name}!`);
          return {
            ...prev,
            player2: { ...prev.player2, currentPokemon: pokemonIndex },
            battleLog: newLog
          };
        }
      });
    } catch (error) {
      console.error('Failed to switch Pokemon:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading battle...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !battleState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚔️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Battle Error</h2>
            <p className="text-gray-600 mb-6">Unable to load the battle. Please try again.</p>
            <button
              onClick={() => router.push('/lobby')}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Back to Lobby
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isPlayer1 = battleState.player1.id === user?.uid;
  const currentPlayer = isPlayer1 ? battleState.player1 : battleState.player2;
  const opponent = isPlayer1 ? battleState.player2 : battleState.player1;
  const isMyTurn = battleState.turn === (isPlayer1 ? 'player1' : 'player2');
  const currentPokemon = currentPlayer.team[currentPlayer.currentPokemon];
  const opponentPokemon = opponent.team[opponent.currentPokemon];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/lobby')}
                className="text-red-600 hover:text-red-800 transition-colors"
              >
                ← Back to Lobby
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Online Battle</h1>
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-medium">
                Turn {battleState.turnNumber}
              </span>
            </div>
            <UserProfile />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Battle Field */}
          <div className="lg:col-span-2 space-y-6">
            {/* Opponent's Pokemon */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{opponent.name}</h3>
                <div className="text-sm text-gray-600">
                  {opponentPokemon.hp}/{opponentPokemon.maxHp} HP
                </div>
              </div>
              
              <div className="bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(opponentPokemon.hp / opponentPokemon.maxHp) * 100}%` }}
                ></div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-2">{opponentPokemon.name}</div>
                <div className="text-gray-600">Level 50</div>
              </div>
            </div>

            {/* Battle Log */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Battle Log</h3>
              <div className="bg-gray-50 rounded-lg p-4 h-48 overflow-y-auto">
                {battleState.battleLog.map((log, index) => (
                  <div key={index} className="text-sm text-gray-700 mb-1">
                    {log}
                  </div>
                ))}
              </div>
            </div>

            {/* Your Pokemon */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{currentPlayer.name}</h3>
                <div className="text-sm text-gray-600">
                  {currentPokemon.hp}/{currentPokemon.maxHp} HP
                </div>
              </div>
              
              <div className="bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentPokemon.hp / currentPokemon.maxHp) * 100}%` }}
                ></div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-2">{currentPokemon.name}</div>
                <div className="text-gray-600">Level 50</div>
              </div>
            </div>
          </div>

          {/* Battle Controls */}
          <div className="space-y-6">
            {/* Turn Status */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Battle Status</h3>
              
              {waitingForOpponent ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-600">Waiting for opponent...</p>
                </div>
              ) : isMyTurn ? (
                <div className="text-center">
                  <div className="text-green-600 text-2xl mb-2">⚡</div>
                  <p className="text-green-600 font-medium">Your turn!</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-yellow-600 text-2xl mb-2">⏳</div>
                  <p className="text-yellow-600 font-medium">Opponent&apos;s turn</p>
                </div>
              )}
            </div>

            {/* Moves */}
            {isMyTurn && !waitingForOpponent && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Moves</h3>
                <div className="grid grid-cols-2 gap-2">
                  {currentPokemon.moves.map((move, index) => (
                    <button
                      key={index}
                      onClick={() => makeMove(index)}
                      disabled={selectedMove === index}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white p-3 rounded-lg font-medium transition-colors text-sm"
                    >
                      {move}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Team */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Team</h3>
              <div className="space-y-2">
                {currentPlayer.team.map((pokemon, index) => (
                  <button
                    key={index}
                    onClick={() => switchPokemon(index)}
                    disabled={index === currentPlayer.currentPokemon || !isMyTurn || waitingForOpponent}
                    className={`w-full p-3 rounded-lg font-medium transition-colors text-sm ${
                      index === currentPlayer.currentPokemon
                        ? 'bg-green-600 text-white cursor-not-allowed'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700 disabled:bg-gray-100 disabled:text-gray-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{pokemon.name}</span>
                      <span className="text-xs">
                        {pokemon.hp}/{pokemon.maxHp} HP
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export the protected version as default
export default function ProtectedOnlineBattlePage() {
  return (
    <ProtectedRoute>
      <OnlineBattlePage />
    </ProtectedRoute>
  );
}
