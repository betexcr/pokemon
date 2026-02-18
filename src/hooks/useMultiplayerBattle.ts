'use client';

import { useEffect, useRef, useCallback } from 'react';
import { handleForfeit, handleTimeout } from '@/lib/multiplayer/handleBattleEnd';

/**
 * Hook to watch for choice timeout and auto-forfeit
 */
export function useChoiceTimeout(
  battleId: string,
  userId: string,
  deadlineAt: number,
  enabled: boolean = true
) {
  const timerRef = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    if (!enabled || !deadlineAt || deadlineAt === 0) return;
    
    const remaining = deadlineAt - Date.now();
    
    // Already past deadline
    if (remaining <= 0) {
      console.warn('⏰ Deadline already passed');
      return;
    }
    
    // Set timeout
    console.log(`⏰ Setting timeout for ${Math.round(remaining / 1000)}s`);
    timerRef.current = setTimeout(() => {
      console.warn(`⏰ Choice timeout - auto-forfeiting player ${userId}`);
      handleTimeout(battleId, userId).catch(err => {
        console.error('Failed to handle timeout:', err);
      });
    }, remaining);
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [battleId, userId, deadlineAt, enabled]);
}

/**
 * Hook to provide forfeit functionality
 */
export function useForfeit(battleId: string, userId: string) {
  const forfeiting = useRef(false);
  
  const forfeit = useCallback(async () => {
    if (forfeiting.current) {
      console.warn('Already forfeiting...');
      return;
    }
    
    const confirmed = confirm('Are you sure you want to forfeit this battle?');
    if (!confirmed) return;
    
    try {
      forfeiting.current = true;
      console.log(`🏳️ Forfeiting battle ${battleId}`);
      await handleForfeit(battleId, userId);
    } catch (error) {
      console.error('Failed to forfeit:', error);
      alert('Failed to forfeit battle. Please try again.');
    } finally {
      forfeiting.current = false;
    }
  }, [battleId, userId]);
  
  return forfeit;
}
