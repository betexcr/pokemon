'use client';

import { useRouter } from 'next/navigation';
import { Trophy, Medal, ArrowLeft, RotateCcw } from 'lucide-react';

interface Props {
  winner: 'player' | 'opponent' | null;
  playerName: string;
  opponentName: string;
  endReason?: 'victory' | 'forfeit' | 'timeout';
  battleStats?: {
    turns: number;
    damageDealt?: number;
    damageTaken?: number;
  };
  returnTo?: { path: string; label: string };
}

/**
 * BattleEndScreen - Modal shown when battle completes
 */
export function BattleEndScreen({ 
  winner, 
  playerName, 
  opponentName, 
  endReason = 'victory',
  battleStats,
  returnTo = { path: '/lobby', label: 'Return to Lobby' },
}: Props) {
  const router = useRouter();
  const isWinner = winner === 'player';
  const isDraw = winner === null;
  
  // Determine title and message based on outcome
  let title = 'Draw';
  let message = 'The battle ended in a draw.';
  let iconColor = 'text-gray-500';
  let bgColor = 'bg-gray-500/20';
  
  if (isWinner) {
    if (endReason === 'forfeit') {
      title = 'Victory by Forfeit';
      message = `${opponentName} forfeited the battle.`;
    } else if (endReason === 'timeout') {
      title = 'Victory by Timeout';
      message = `${opponentName} ran out of time.`;
    } else {
      title = 'Victory!';
      message = `You defeated ${opponentName}!`;
    }
    iconColor = 'text-yellow-500';
    bgColor = 'bg-yellow-500/20';
  } else if (!isDraw) {
    if (endReason === 'forfeit') {
      title = 'Forfeited';
      message = 'The battle was forfeited.';
    } else if (endReason === 'timeout') {
      title = 'Timeout';
      message = 'You ran out of time.';
    } else {
      title = 'Defeat';
      message = `${opponentName} won the battle.`;
    }
    iconColor = 'text-gray-400';
    bgColor = 'bg-gray-500/20';
  }
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg p-8 max-w-md w-full mx-4 text-center space-y-6">
        {/* Trophy/Medal Icon */}
        <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center ${bgColor}`}>
          {isWinner ? (
            <Trophy className={`w-16 h-16 ${iconColor}`} />
          ) : (
            <Medal className={`w-16 h-16 ${iconColor}`} />
          )}
        </div>
        
        {/* Result Title */}
        <div>
          <h2 className={`text-3xl font-bold mb-2 ${iconColor}`}>
            {title}
          </h2>
          <p className="text-muted-foreground">
            {message}
          </p>
        </div>
        
        {/* Battle Stats */}
        {battleStats && (
          <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Turns:</span>
              <span className="font-semibold">{battleStats.turns}</span>
            </div>
            {battleStats.damageDealt !== undefined && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Damage Dealt:</span>
                <span className="font-semibold">{battleStats.damageDealt}</span>
              </div>
            )}
            {battleStats.damageTaken !== undefined && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Damage Taken:</span>
                <span className="font-semibold">{battleStats.damageTaken}</span>
              </div>
            )}
          </div>
        )}
        
        {/* Match Info */}
        <div className="bg-muted rounded-lg p-4 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">You:</span>
            <span className="font-semibold">{playerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Opponent:</span>
            <span className="font-semibold">{opponentName}</span>
          </div>
        </div>
        
        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={() => router.push(returnTo.path)}
            className="w-full px-4 py-3 bg-poke-blue text-white rounded-lg hover:bg-poke-blue/90 transition-colors flex items-center justify-center gap-2 font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            {returnTo.label}
          </button>
          
          {/* Optional: Add rematch button in future
          <button
            onClick={() => {}}
            className="w-full px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Request Rematch
          </button>
          */}
        </div>
      </div>
    </div>
  );
}
