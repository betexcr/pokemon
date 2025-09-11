'use client';

import { useEffect } from 'react';
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

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Prevent closing dialog by clicking outside or pressing escape
  const handleBackdropClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Do nothing - prevent closing
  };

  const handleDialogClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Do nothing - prevent closing
  };

  const handleBackToLobby = () => {
    onClose();
    router.push('/lobby');
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 relative"
        onClick={handleDialogClick}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">⚔️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Battle Room</h2>
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <div className="bg-gray-100 rounded-lg p-4 mb-4">
            <div className="text-red-700 font-semibold text-lg mb-2">
              {isRoomFinished 
                ? `${opponentName} ended the room` 
                : `${opponentName} forfeited the battle`
              }
            </div>
            <div className="text-sm text-gray-700">
              {isRoomFinished 
                ? 'The room host has left and the room is now finished. You can go back to the lobby to find or create a new battle room.'
                : 'Your opponent left the room. You can go back to the lobby creation screen to start a new battle.'
              }
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-center">
          <button
            onClick={handleBackToLobby}
            className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Back to Battle Lobby
          </button>
        </div>
      </div>
    </div>
  );
}
