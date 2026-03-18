'use client';

import { Swords, Trophy, Clock, Loader2 } from 'lucide-react';
import type { ChampionshipMatch, ChampionshipParticipant } from '@/lib/championship/types';

interface MatchCardProps {
  match: ChampionshipMatch;
  participants: ChampionshipParticipant[];
  currentUserUid?: string;
  onStartBattle?: (match: ChampionshipMatch) => void;
  compact?: boolean;
}

export default function MatchCard({
  match,
  participants,
  currentUserUid,
  onStartBattle,
  compact = false,
}: MatchCardProps) {
  const p1 = participants.find((p) => p.uid === match.player1Uid);
  const p2 = participants.find((p) => p.uid === match.player2Uid);
  const winner = participants.find((p) => p.uid === match.winnerUid);

  const isMyMatch =
    match.player1Uid === currentUserUid || match.player2Uid === currentUserUid;
  const canBattle =
    isMyMatch && match.status === 'ready' && match.player1Uid && match.player2Uid;

  const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    pending: {
      icon: <Clock className="w-3 h-3" />,
      color: 'text-gray-400',
      label: 'Pending',
    },
    ready: {
      icon: <Swords className="w-3 h-3" />,
      color: 'text-green-400',
      label: 'Ready',
    },
    in_progress: {
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
      color: 'text-blue-400',
      label: 'Battling',
    },
    completed: {
      icon: <Trophy className="w-3 h-3" />,
      color: 'text-yellow-400',
      label: 'Done',
    },
  };

  const status = statusConfig[match.status] ?? statusConfig.pending;

  if (compact) {
    return (
      <div
        className={`flex items-center gap-1.5 px-2 py-1.5 rounded border text-xs ${
          match.status === 'completed'
            ? 'border-border/50 bg-surface/50'
            : isMyMatch
              ? 'border-yellow-500/40 bg-yellow-500/5'
              : 'border-border bg-surface'
        }`}
      >
        <PlayerSlot player={p1} isWinner={match.winnerUid === p1?.uid} compact />
        <span className="text-muted/50 text-[10px]">vs</span>
        <PlayerSlot player={p2} isWinner={match.winnerUid === p2?.uid} compact />
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border p-3 transition-all ${
        isMyMatch && match.status !== 'completed'
          ? 'border-yellow-500/40 bg-yellow-500/5 shadow-sm shadow-yellow-500/5'
          : 'border-border bg-surface'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`flex items-center gap-1 text-[10px] font-medium ${status.color}`}>
          {status.icon}
          {status.label}
        </span>
        {match.roomId && match.status === 'in_progress' && (
          <span className="text-[10px] text-muted">Room active</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <PlayerSlot player={p1} isWinner={match.winnerUid === p1?.uid} />
        <div className="flex-shrink-0 text-xs text-muted font-bold">VS</div>
        <PlayerSlot player={p2} isWinner={match.winnerUid === p2?.uid} />
      </div>

      {canBattle && onStartBattle && (
        <button
          onClick={() => onStartBattle(match)}
          className="mt-2.5 w-full bg-yellow-600 hover:bg-yellow-700 text-white py-1.5 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
        >
          <Swords className="w-3.5 h-3.5" />
          Go to Battle
        </button>
      )}

      {match.status === 'completed' && winner && (
        <div className="mt-2 text-center text-xs text-yellow-400 flex items-center justify-center gap-1">
          <Trophy className="w-3 h-3" />
          {winner.name} wins
        </div>
      )}
    </div>
  );
}

function PlayerSlot({
  player,
  isWinner,
  compact = false,
}: {
  player?: ChampionshipParticipant;
  isWinner?: boolean;
  compact?: boolean;
}) {
  if (!player) {
    return (
      <div
        className={`flex-1 ${compact ? '' : 'text-center'} py-1 rounded text-muted/40 italic ${
          compact ? 'text-[10px]' : 'text-xs'
        }`}
      >
        TBD
      </div>
    );
  }

  return (
    <div
      className={`flex-1 ${compact ? '' : 'text-center'} py-1 rounded ${
        isWinner ? 'text-yellow-400 font-semibold' : 'text-text'
      } ${compact ? 'text-[10px]' : 'text-xs'}`}
    >
      <span className="text-muted/50 mr-1">#{player.seed}</span>
      {player.name.split(' ')[0]}
      {isWinner && !compact && <Trophy className="w-3 h-3 inline ml-1 -mt-0.5" />}
    </div>
  );
}
