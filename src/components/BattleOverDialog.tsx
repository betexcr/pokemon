"use client";

import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

interface BattleOverDialogProps {
  isOpen: boolean;
  onClose: () => void;
  winner: 'player' | 'opponent' | 'draw';
  playerTeam: any[];
  opponentTeam: any[];
  isMultiplayer?: boolean;
  hostName?: string;
  guestName?: string;
}

export default function BattleOverDialog({
  isOpen,
  onClose,
  winner,
  playerTeam,
  opponentTeam,
  isMultiplayer = false,
  hostName,
  guestName
}: BattleOverDialogProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleBackToBattles = () => {
    router.push('/battle');
  };

  const getWinnerText = () => {
    if (winner === 'draw') return 'Draw!';
    if (isMultiplayer) {
      return winner === 'player' ? 'You Win!' : 'You Lose!';
    }
    return winner === 'player' ? 'Victory!' : 'Defeat!';
  };

  const getWinnerMessage = () => {
    if (winner === 'draw') return 'The battle ended in a draw!';
    if (isMultiplayer) {
      return winner === 'player' 
        ? `Congratulations! You defeated ${guestName || 'your opponent'}!`
        : `Better luck next time! ${hostName || 'Your opponent'} won!`;
    }
    return winner === 'player' 
      ? 'Congratulations! You won the battle!'
      : 'Better luck next time!';
  };

  const getWinnerColor = () => {
    if (winner === 'draw') return 'text-yellow-500';
    return winner === 'player' ? 'text-green-500' : 'text-red-500';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface border border-border rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <h2 className={`text-3xl font-bold mb-2 ${getWinnerColor()}`}>
              {getWinnerText()}
            </h2>
            <p className="text-muted">
              {getWinnerMessage()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-text transition-colors p-1"
            aria-label="Close dialog"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Remaining Pokemon Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Player Team */}
          <div className="bg-white/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 text-center">
              {isMultiplayer ? 'Your Team' : 'Your Team'}
            </h3>
            <div className="space-y-2">
              {playerTeam.map((pokemon, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    pokemon.currentHp > 0 ? 'bg-green-100' : 'bg-red-100'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <img
                      src={pokemon.pokemon.sprites?.front_default || '/placeholder-pokemon.png'}
                      alt={pokemon.pokemon.name}
                      className="w-8 h-8"
                    />
                    <span className="font-medium capitalize">
                      {pokemon.pokemon.name}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className={pokemon.currentHp > 0 ? 'text-green-600' : 'text-red-600'}>
                      {pokemon.currentHp > 0 ? 'Active' : 'Fainted'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Opponent Team */}
          <div className="bg-white/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 text-center">
              {isMultiplayer ? `${hostName || 'Opponent'}'s Team` : 'Opponent Team'}
            </h3>
            <div className="space-y-2">
              {opponentTeam.map((pokemon, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    pokemon.currentHp > 0 ? 'bg-green-100' : 'bg-red-100'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <img
                      src={pokemon.pokemon.sprites?.front_default || '/placeholder-pokemon.png'}
                      alt={pokemon.pokemon.name}
                      className="w-8 h-8"
                    />
                    <span className="font-medium capitalize">
                      {pokemon.pokemon.name}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className={pokemon.currentHp > 0 ? 'text-green-600' : 'text-red-600'}>
                      {pokemon.currentHp > 0 ? 'Active' : 'Fainted'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleBackToBattles}
            className="px-6 py-3 bg-poke-blue text-white rounded-lg hover:bg-poke-blue/90 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <span>Back to Battles</span>
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-surface border border-border text-text rounded-lg hover:bg-white/50 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
