'use client';

import { useState } from 'react';
import BattleStartDialog from '@/components/BattleStartDialog';

export default function DemoBattleDialogPage() {
  const [showDialog, setShowDialog] = useState(false);

  const handleBattleStart = () => {
    console.log('Battle started!');
    alert('Battle would start now!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Battle Start Dialog Demo
        </h1>
        
        <p className="text-lg text-gray-600 mb-8 max-w-2xl">
          Click the button below to see the battle start dialog in action. 
          It features a 3-second countdown, the battle start GIF, a pixelated 
          health bar, and Pokemon-themed loading messages using the Pocket Monk font.
        </p>
        
        <button
          onClick={() => setShowDialog(true)}
          className="bg-poke-red hover:bg-poke-red/90 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors shadow-lg"
        >
          Start Battle Demo
        </button>
        
        <div className="mt-8 text-sm text-gray-500">
          <p>Features:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>3-second countdown timer with Pocket Monk font</li>
            <li>Battle start GIF as hero image</li>
            <li>Pixelated health bar with progress animation</li>
            <li>Pokemon-themed loading messages</li>
            <li>Automatic battle start after countdown</li>
          </ul>
        </div>
      </div>

      <BattleStartDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        onBattleStart={handleBattleStart}
      />
    </div>
  );
}

