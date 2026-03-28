'use client';

import { useEffect, useRef, useId } from 'react';
import { useRouter } from 'next/navigation';

interface ForfeitDialogProps {
  isOpen: boolean;
  opponentName: string;
  isRoomFinished?: boolean;
  onClose: () => void;
}

export default function ForfeitDialog({ 
  isOpen, 
  opponentName, 
  isRoomFinished = false, 
  onClose 
}: ForfeitDialogProps) {
  const router = useRouter();
  const titleId = useId();
  const descId = useId();
  const actionRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      actionRef.current?.focus();
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleBackToLobby = () => {
    onClose();
    router.push('/lobby');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      <div
        ref={dialogRef}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <div className="text-6xl mb-4" aria-hidden="true">⚔️</div>
          <h2 id={titleId} className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Battle Room
          </h2>
        </div>

        <div className="text-center mb-8">
          <div id={descId} className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-4">
            <div className="text-red-700 dark:text-red-400 font-semibold text-lg mb-2">
              {isRoomFinished 
                ? `${opponentName} ended the room` 
                : `${opponentName} forfeited the battle`
              }
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              {isRoomFinished 
                ? 'The room host has left and the room is now finished. You can go back to the lobby to find or create a new battle room.'
                : 'Your opponent left the room. You can go back to the lobby creation screen to start a new battle.'
              }
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            ref={actionRef}
            onClick={handleBackToLobby}
            className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            Back to Battle Lobby
          </button>
        </div>
      </div>
    </div>
  );
}
