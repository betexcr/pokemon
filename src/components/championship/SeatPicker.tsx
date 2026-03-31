'use client';

import { UserCircle } from 'lucide-react';
import type { ChampionshipParticipant } from '@/lib/championship/types';

interface SeatPickerProps {
  size: number;
  participants: ChampionshipParticipant[];
  currentUserUid?: string;
  onPickSeat: (seed: number) => void;
  disabled?: boolean;
}

export default function SeatPicker({
  size,
  participants,
  currentUserUid,
  onPickSeat,
  disabled,
}: SeatPickerProps) {
  const seats = Array.from({ length: size }, (_, i) => {
    const seed = i + 1;
    const occupant = participants.find((p) => p.seed === seed);
    return { seed, occupant };
  });

  const currentParticipant = participants.find((p) => p.uid === currentUserUid);

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted">Pick your bracket position:</div>
      <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-2">
        {seats.map(({ seed, occupant }) => {
          const isMe = occupant?.uid === currentUserUid;
          const isTaken = !!occupant;

          return (
            <button
              type="button"
              key={seed}
              onClick={() => !disabled && !isTaken && onPickSeat(seed)}
              disabled={disabled || (isTaken && !isMe)}
              className={`relative flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all min-h-[72px] ${
                isMe
                  ? 'border-yellow-500 bg-yellow-500/10 ring-1 ring-yellow-500/30'
                  : isTaken
                    ? 'border-border bg-surface/80 opacity-60 cursor-not-allowed'
                    : 'border-dashed border-border hover:border-yellow-500/50 hover:bg-yellow-500/5 cursor-pointer'
              }`}
            >
              <span className="text-[10px] text-muted mb-1">Seed {seed}</span>
              {occupant ? (
                <>
                  {occupant.photoURL ? (
                    <img
                      src={occupant.photoURL}
                      alt={occupant.name}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <UserCircle className="w-6 h-6 text-muted" />
                  )}
                  <span className="text-[10px] text-text truncate w-full mt-0.5">
                    {isMe ? 'You' : occupant.name.split(' ')[0]}
                  </span>
                </>
              ) : (
                <span className="text-lg text-muted/30">+</span>
              )}
            </button>
          );
        })}
      </div>
      {currentParticipant && (
        <p className="text-xs text-muted">
          Your current seed: <strong className="text-yellow-400">#{currentParticipant.seed}</strong>.
          Click another open slot to change.
        </p>
      )}
    </div>
  );
}
