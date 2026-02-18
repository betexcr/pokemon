'use client';

import { useEffect, useState, useRef } from 'react';
import { rtdbService, RTDBChoice } from '@/lib/firebase-rtdb-service';
import { resolveTurn } from '@/lib/multiplayer/resolveTurn';

interface Props {
  battleId: string;
  isHost: boolean;
  userId: string;
}

/**
 * BattleTurnManager - Headless component that manages turn resolution
 * Only the host triggers resolution to avoid duplicate processing
 */
export function BattleTurnManager({ battleId, isHost, userId }: Props) {
  const [currentTurn, setCurrentTurn] = useState(1);
  const [phase, setPhase] = useState<'choosing' | 'resolving' | 'ended'>('choosing');
  const [choices, setChoices] = useState<Record<string, RTDBChoice>>({});
  const [resolving, setResolving] = useState(false);
  const lastResolvedTurn = useRef(0);
  
  // Listen to battle meta for turn and phase updates
  useEffect(() => {
    const unsubscribe = rtdbService.onBattleMeta(battleId, (meta) => {
      if (meta) {
        setCurrentTurn(meta.turn);
        setPhase(meta.phase);
        
        // Reset resolution state when turn increments
        if (meta.turn > lastResolvedTurn.current) {
          setResolving(false);
        }
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
  
  // Auto-resolve when both choices are submitted (HOST ONLY)
  useEffect(() => {
    // Only host resolves to avoid duplicate processing
    if (!isHost) return;
    
    // Don't resolve if already resolving or battle ended
    if (resolving || phase === 'ended') return;
    
    // Don't re-resolve the same turn
    if (currentTurn <= lastResolvedTurn.current) return;
    
    // Wait for both players to submit choices
    const choiceCount = Object.keys(choices).length;
    if (choiceCount < 2) {
      console.log(`⏳ Waiting for choices... (${choiceCount}/2)`);
      return;
    }
    
    console.log(`🎯 Both choices received for turn ${currentTurn}, starting resolution...`);
    setResolving(true);
    lastResolvedTurn.current = currentTurn;
    
    // Mark as resolving in RTDB so both players see it
    rtdbService.updateBattleMeta(battleId, { phase: 'resolving' })
      .catch(err => console.warn('Failed to update phase to resolving:', err));
    
    // Resolve the turn
    resolveTurn(battleId, currentTurn, choices)
      .then(() => {
        console.log(`✅ Turn ${currentTurn} resolved successfully`);
        setResolving(false);
        setChoices({}); // Clear choices for next turn
      })
      .catch((error) => {
        console.error(`❌ Turn resolution failed:`, error);
        setResolving(false);
        
        // Reset to choosing phase so players can try again
        rtdbService.updateBattleMeta(battleId, { phase: 'choosing' })
          .catch(err => console.warn('Failed to reset phase:', err));
      });
  }, [isHost, resolving, currentTurn, choices, battleId, phase]);
  
  // Debug logging
  useEffect(() => {
    console.log(`🎮 Turn Manager State:`, {
      isHost,
      currentTurn,
      phase,
      choiceCount: Object.keys(choices).length,
      resolving,
      lastResolved: lastResolvedTurn.current
    });
  }, [isHost, currentTurn, phase, choices, resolving]);
  
  // This is a headless component - no UI
  return null;
}
