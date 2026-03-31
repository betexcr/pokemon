'use client';

import { useRef, useCallback } from 'react';
import { handleForfeit } from '@/lib/multiplayer/handleBattleEnd';

/**
 * Hook to provide forfeit functionality
 */
export function useForfeit(battleId: string, userId: string) {
  const forfeiting = useRef(false);
  
  const forfeit = useCallback(async () => {
    if (forfeiting.current) {
      return;
    }
    
    const confirmed = confirm('Are you sure you want to forfeit this battle?');
    if (!confirmed) return;
    
    try {
      forfeiting.current = true;
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
