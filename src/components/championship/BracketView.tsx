'use client';

import { Trophy } from 'lucide-react';
import MatchCard from './MatchCard';
import { getRoundName } from '@/lib/championship/bracket';
import type {
  ChampionshipMatch,
  ChampionshipParticipant,
} from '@/lib/championship/types';

interface BracketViewProps {
  bracket: ChampionshipMatch[];
  participants: ChampionshipParticipant[];
  totalRounds: number;
  currentRound: number;
  currentUserUid?: string;
  winnerUid?: string;
  winnerName?: string;
  onStartBattle?: (match: ChampionshipMatch) => void;
}

export default function BracketView({
  bracket,
  participants,
  totalRounds,
  currentRound,
  currentUserUid,
  winnerUid,
  winnerName,
  onStartBattle,
}: BracketViewProps) {
  const rounds = Array.from({ length: totalRounds }, (_, i) => i + 1);

  return (
    <div className="space-y-4">
      {winnerUid && winnerName && (
        <div className="text-center p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
          <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
          <div className="text-lg font-bold text-yellow-400">{winnerName}</div>
          <div className="text-sm text-muted">is the Champion!</div>
        </div>
      )}

      {/* Desktop: horizontal bracket flow */}
      <div className="hidden md:block overflow-x-auto">
        <div className="flex gap-4 min-w-fit py-2">
          {rounds.map((round) => {
            const roundMatches = bracket.filter((m) => m.round === round);
            const isCurrent = round === currentRound;
            const roundName = getRoundName(round, totalRounds);

            return (
              <div key={round} className="flex-shrink-0 w-56">
                <div
                  className={`text-center text-xs font-semibold mb-3 pb-1.5 border-b ${
                    isCurrent
                      ? 'text-yellow-400 border-yellow-500/40'
                      : 'text-muted border-border'
                  }`}
                >
                  {roundName}
                </div>
                <div className="space-y-3 flex flex-col justify-around h-full">
                  {roundMatches.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      participants={participants}
                      currentUserUid={currentUserUid}
                      onStartBattle={onStartBattle}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile: stacked rounds */}
      <div className="md:hidden space-y-4">
        {rounds.map((round) => {
          const roundMatches = bracket.filter((m) => m.round === round);
          const isCurrent = round === currentRound;
          const roundName = getRoundName(round, totalRounds);

          return (
            <div key={round}>
              <div
                className={`text-xs font-semibold mb-2 pb-1 border-b ${
                  isCurrent
                    ? 'text-yellow-400 border-yellow-500/40'
                    : 'text-muted border-border'
                }`}
              >
                {roundName}
              </div>
              <div className="space-y-2">
                {roundMatches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    participants={participants}
                    currentUserUid={currentUserUid}
                    onStartBattle={onStartBattle}
                    compact={round < currentRound}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
