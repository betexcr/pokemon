'use client';

import { Crown, UserCircle } from 'lucide-react';
import type { ChampionshipParticipant } from '@/lib/championship/types';

interface ParticipantListProps {
  participants: ChampionshipParticipant[];
  size: number;
  hostUid: string;
  currentUserUid?: string;
}

export default function ParticipantList({
  participants,
  size,
  hostUid,
  currentUserUid,
}: ParticipantListProps) {
  const sorted = [...participants].sort((a, b) => a.seed - b.seed);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-muted mb-3">
        <span>Participants</span>
        <span>
          {participants.length}/{size} trainers
        </span>
      </div>
      <div className="grid gap-2">
        {sorted.map((p) => {
          const isHost = p.uid === hostUid;
          const isMe = p.uid === currentUserUid;
          const hasTeam = p.team && p.team.length > 0;

          return (
            <div
              key={p.uid}
              className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${
                isMe
                  ? 'border-yellow-500/40 bg-yellow-500/5'
                  : 'border-border bg-surface'
              }`}
            >
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-surface border border-border text-xs font-bold text-muted">
                #{p.seed}
              </div>

              {p.photoURL ? (
                <img
                  src={p.photoURL}
                  alt=""
                  className="w-7 h-7 rounded-full"
                />
              ) : (
                <UserCircle className="w-7 h-7 text-muted" />
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-sm text-text truncate">
                    {p.name}
                  </span>
                  {isHost && (
                    <Crown className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
                  )}
                  {isMe && (
                    <span className="text-[10px] text-yellow-400 flex-shrink-0">
                      (you)
                    </span>
                  )}
                </div>
              </div>

              {hasTeam ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-600/20 text-green-300 border border-green-600/30">
                  Team Ready
                </span>
              ) : (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-600/20 text-gray-400 border border-gray-600/30">
                  No Team
                </span>
              )}
            </div>
          );
        })}

        {/* Empty slots */}
        {Array.from({ length: size - participants.length }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="flex items-center gap-3 p-2.5 rounded-lg border border-dashed border-border/50 bg-surface/50"
          >
            <div className="w-7 h-7 rounded-full border border-dashed border-border flex items-center justify-center text-xs text-muted/50">
              ?
            </div>
            <span className="text-sm text-muted/50 italic">Waiting for trainer...</span>
          </div>
        ))}
      </div>
    </div>
  );
}
