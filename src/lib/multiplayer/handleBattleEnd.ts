import { battleService } from '@/lib/battleService';
import { roomService } from '@/lib/roomService';
import { rtdbService } from '@/lib/firebase-rtdb-service';
import { BattleState } from '@/lib/team-battle-engine';
import { createBattleRng } from '@/lib/battle-rng';
import { EMPTY_HAZARDS } from '@/lib/team-battle-types';

/**
 * Handle battle completion - update RTDB, Firestore, and room status
 */
export async function handleBattleEnd(
  battleId: string,
  finalState: BattleState,
  endReason: 'victory' | 'forfeit' | 'timeout' = 'victory'
): Promise<void> {
  console.log(`🏁 Battle ${battleId} ended. Reason: ${endReason}`);
  
  try {
    // Get meta to determine UIDs
    const meta = await rtdbService.getBattleMeta(battleId);
    if (!meta) {
      console.warn('Battle meta not found, cannot complete battle end flow');
      return;
    }
    
    // Determine winner UID
    let winnerUid: string | undefined;
    
    if (finalState.winner === 'player') {
      winnerUid = meta.players.p1.uid;
    } else if (finalState.winner === 'opponent') {
      winnerUid = meta.players.p2.uid;
    }
    
    // 1. Update RTDB meta to 'ended' state
    await rtdbService.updateBattleMeta(battleId, {
      phase: 'ended',
      winnerUid: winnerUid,
      endedReason: endReason
    });
    
    console.log(`✅ RTDB meta updated - Winner: ${winnerUid}, Reason: ${endReason}`);
    
    // 2. Get battle info from Firestore
    const battle = await battleService.getBattle(battleId);
    if (!battle) {
      console.warn('Battle document not found in Firestore');
      return;
    }
    
    // 3. Update Firestore battle document
    await battleService.updateBattle(battleId, {
      status: 'finished',
      winner: finalState.winner,
      updatedAt: new Date()
    } as any);
    
    console.log(`✅ Firestore battle document updated`);
    
    // 4. Update room status if room exists
    if (battle.roomId) {
      try {
        await roomService.updateRoom(battle.roomId, {
          status: 'finished'
        });
        console.log(`✅ Room ${battle.roomId} status updated to finished`);
      } catch (roomError) {
        console.warn('Failed to update room status:', roomError);
        // Don't throw - battle end is more important than room status
      }
    }
    
    console.log(`🎉 Battle cleanup complete. Winner: ${winnerUid || 'None'}`);
  } catch (error) {
    console.error('❌ Failed to handle battle end:', error);
    throw error;
  }
}

/**
 * Handle forfeit - mark battle as ended with forfeit reason
 */
export async function handleForfeit(
  battleId: string,
  userId: string
): Promise<void> {
  console.log(`🏳️ Player ${userId} forfeiting battle ${battleId}`);
  
  const meta = await rtdbService.getBattleMeta(battleId);
  if (!meta) throw new Error('Battle not found');
  
  // Determine opponent (winner)
  const opponentUid = meta.players.p1.uid === userId 
    ? meta.players.p2.uid 
    : meta.players.p1.uid;
  
  const winner = meta.players.p1.uid === opponentUid ? 'player' : 'opponent';
  
  // Create a minimal battle state for end handling
  const emptyScreens = {
    reflect: { turns: 0 },
    lightScreen: { turns: 0 }
  };
  
  const finalState: BattleState = {
    player: { 
      pokemon: [], 
      currentIndex: 0, 
      faintedCount: 0, 
      sideConditions: { screens: emptyScreens, hazards: EMPTY_HAZARDS } 
    },
    opponent: { 
      pokemon: [], 
      currentIndex: 0, 
      faintedCount: 0, 
      sideConditions: { screens: emptyScreens, hazards: EMPTY_HAZARDS } 
    },
    turn: meta.turn,
    rng: createBattleRng(),
    battleLog: [],
    isComplete: true,
    winner: winner,
    phase: 'choice',
    actionQueue: [],
    field: {}
  };
  
  await handleBattleEnd(battleId, finalState, 'forfeit');
}

/**
 * Handle timeout - mark battle as ended with timeout reason
 */
export async function handleTimeout(
  battleId: string,
  timedOutUserId: string
): Promise<void> {
  console.log(`⏰ Player ${timedOutUserId} timed out in battle ${battleId}`);
  
  const meta = await rtdbService.getBattleMeta(battleId);
  if (!meta) throw new Error('Battle not found');
  
  // Opponent wins by timeout
  const opponentUid = meta.players.p1.uid === timedOutUserId 
    ? meta.players.p2.uid 
    : meta.players.p1.uid;
  
  const winner = meta.players.p1.uid === opponentUid ? 'player' : 'opponent';
  
  // Create a minimal battle state for end handling
  const emptyScreens = {
    reflect: { turns: 0 },
    lightScreen: { turns: 0 }
  };
  
  const finalState: BattleState = {
    player: { 
      pokemon: [], 
      currentIndex: 0, 
      faintedCount: 0, 
      sideConditions: { screens: emptyScreens, hazards: EMPTY_HAZARDS } 
    },
    opponent: { 
      pokemon: [], 
      currentIndex: 0, 
      faintedCount: 0, 
      sideConditions: { screens: emptyScreens, hazards: EMPTY_HAZARDS } 
    },
    turn: meta.turn,
    rng: createBattleRng(),
    battleLog: [],
    isComplete: true,
    winner: winner,
    phase: 'choice',
    actionQueue: [],
    field: {}
  };
  
  await handleBattleEnd(battleId, finalState, 'timeout');
}
