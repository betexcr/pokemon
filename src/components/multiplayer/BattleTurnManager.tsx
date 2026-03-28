'use client';

import { useEffect, useState } from 'react';
import { rtdbService, RTDBChoice } from '@/lib/firebase-rtdb-service';

interface Props {
  battleId: string;
  isHost: boolean;
}

/**
 * BattleTurnManager - Headless component that manages turn resolution
 * Only the host triggers resolution to avoid duplicate processing
 */
export function BattleTurnManager({ battleId, isHost }: Props) {
  const [currentTurn, setCurrentTurn] = useState(1);
  const [phase, setPhase] = useState<'choosing' | 'resolving' | 'ended'>('choosing');
  const [choices, setChoices] = useState<Record<string, RTDBChoice>>({});
  // Listen to battle meta for turn and phase updates
  useEffect(() => {
    const unsubscribe = rtdbService.onBattleMeta(battleId, (meta) => {
      if (meta) {
        setCurrentTurn(meta.turn);
        setPhase(meta.phase);
      }
    });
    
    return unsubscribe;
  }, [battleId]);
  
  // Listen to choices for current turn
  useEffect(() => {
    if (phase === 'ended') return;
    
    const unsubscribe = rtdbService.onBattleChoices(battleId, currentTurn, (newChoices) => {
      setChoices(newChoices || {});
    });
    
    return unsubscribe;
  }, [battleId, currentTurn, phase]);
  
  // Resolution is handled server-side in the submit API route.
  // This component only observes meta/choices for UI state.
  
  // This is a headless component - no UI
  return null;
}
