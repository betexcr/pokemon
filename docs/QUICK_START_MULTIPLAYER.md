# Quick Start: Complete Multiplayer Battles

This guide helps you finish the multiplayer battle implementation in ~1 week.

## Prerequisites

✅ You already have:
- Firebase project configured
- Firestore and RTDB set up
- Lobby system working
- Team builder working
- Battle engine implemented

## Step-by-Step Implementation

### Day 1-2: Turn Resolution Core

#### Step 1: Add Helper Functions to RTDB Service

Edit [src/lib/firebase-rtdb-service.ts](../src/lib/firebase-rtdb-service.ts):

```typescript
// Add these methods to the FirebaseRTDBService class

async getBattleState(battleId: string): Promise<BattleState> {
  if (!this.db) throw new Error('RTDB not initialized');
  
  const metaSnap = await get(ref(this.db, `battles/${battleId}/meta`));
  const publicSnap = await get(ref(this.db, `battles/${battleId}/public`));
  
  const meta = metaSnap.val() as RTDBBattleMeta;
  const publicState = publicSnap.val() as RTDBBattlePublic;
  
  // Get private state for current user
  const { auth } = await import('./firebase');
  const uid = auth?.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');
  
  const privateSnap = await get(ref(this.db, `battles/${battleId}/private/${uid}`));
  const privateState = privateSnap.val() as RTDBBattlePrivate;
  
  // Convert to BattleState format (implement mapping logic)
  return convertRTDBToBattleState(meta, publicState, privateState);
}

async writeResolution(
  battleId: string,
  turn: number,
  resolution: RTDBResolution
): Promise<void> {
  if (!this.db) throw new Error('RTDB not initialized');
  
  const resolutionRef = ref(this.db, `battles/${battleId}/turns/${turn}/resolution`);
  await set(resolutionRef, resolution);
}

async updatePublicState(
  battleId: string,
  updates: Partial<RTDBBattlePublic>
): Promise<void> {
  if (!this.db) throw new Error('RTDB not initialized');
  
  const publicRef = ref(this.db, `battles/${battleId}/public`);
  await update(publicRef, updates);
}

async updateBattleMeta(
  battleId: string,
  updates: Partial<RTDBBattleMeta>
): Promise<void> {
  if (!this.db) throw new Error('RTDB not initialized');
  
  const metaRef = ref(this.db, `battles/${battleId}/meta`);
  await update(metaRef, updates);
}
```

#### Step 2: Create Turn Resolution Logic

Create [src/lib/multiplayer/resolveTurn.ts](../src/lib/multiplayer/):

```typescript
import { executeTurn } from '@/server/executeTurn';
import { rtdbService, RTDBChoice, RTDBResolution } from '@/lib/firebase-rtdb-service';
import { BattleState } from '@/lib/team-battle-engine';

export async function resolveTurn(
  battleId: string,
  turn: number,
  choices: Record<string, RTDBChoice>
): Promise<void> {
  console.log(`🎮 Resolving turn ${turn} for battle ${battleId}`);
  
  try {
    // 1. Get current battle state from RTDB
    const battleState = await rtdbService.getBattleState(battleId);
    
    // 2. Add choices to battle state as actions
    battleState.actionQueue = convertChoicesToActions(choices, battleState);
    
    // 3. Execute turn using server logic
    const updatedState = await executeTurn(battleState);
    
    // 4. Create resolution record
    const resolution: RTDBResolution = {
      by: 'client-host',
      committedAt: Date.now(),
      rngSeedUsed: battleState.rng,
      diffs: calculateStateDiffs(battleState, updatedState),
      logs: updatedState.battleLog.slice(-10), // Last 10 log entries
      stateHashAfter: hashBattleState(updatedState)
    };
    
    // 5. Write resolution to RTDB
    await rtdbService.writeResolution(battleId, turn, resolution);
    
    // 6. Update public state with new HP, status, etc
    await rtdbService.updatePublicState(battleId, {
      p1: convertToPublicPokemon(updatedState.player),
      p2: convertToPublicPokemon(updatedState.opponent),
      field: updatedState.field,
      lastResultSummary: getLastMoveResult(updatedState.battleLog)
    });
    
    // 7. Update private states for both players
    await updatePrivateStates(battleId, updatedState);
    
    // 8. Check if battle is complete
    if (updatedState.isComplete) {
      await handleBattleEnd(battleId, updatedState);
    } else {
      // Increment turn and reset phase to 'choosing'
      await rtdbService.updateBattleMeta(battleId, {
        turn: turn + 1,
        phase: 'choosing',
        deadlineAt: Date.now() + 30000 // 30 second deadline
      });
    }
    
    console.log(`✅ Turn ${turn} resolved successfully`);
  } catch (error) {
    console.error(`❌ Failed to resolve turn ${turn}:`, error);
    throw error;
  }
}

// Helper functions
function convertChoicesToActions(
  choices: Record<string, RTDBChoice>,
  state: BattleState
): BattleAction[] {
  // Implementation: Convert RTDB choices to battle actions
  return [];
}

function calculateStateDiffs(before: BattleState, after: BattleState) {
  // Implementation: Calculate what changed
  return [];
}

function hashBattleState(state: BattleState): string {
  // Implementation: Create hash of state for validation
  return '';
}

async function updatePrivateStates(battleId: string, state: BattleState) {
  // Implementation: Update each player's private state
}
```

#### Step 3: Create Turn Manager Component

Create [src/components/multiplayer/BattleTurnManager.tsx](../src/components/multiplayer/):

```typescript
'use client';

import { useEffect, useState, useRef } from 'react';
import { rtdbService, RTDBChoice } from '@/lib/firebase-rtdb-service';
import { resolveTurn } from '@/lib/multiplayer/resolveTurn';

interface Props {
  battleId: string;
  isHost: boolean;
  userId: string;
}

export function BattleTurnManager({ battleId, isHost, userId }: Props) {
  const [currentTurn, setCurrentTurn] = useState(1);
  const [choices, setChoices] = useState<Record<string, RTDBChoice>>({});
  const [resolving, setResolving] = useState(false);
  const lastResolvedTurn = useRef(0);
  
  // Listen to current turn from meta
  useEffect(() => {
    return rtdbService.onBattleMeta(battleId, (meta) => {
      if (meta) {
        setCurrentTurn(meta.turn);
      }
    });
  }, [battleId]);
  
  // Listen to choices for current turn
  useEffect(() => {
    return rtdbService.onBattleChoices(battleId, currentTurn, (choices) => {
      setChoices(choices || {});
    });
  }, [battleId, currentTurn]);
  
  // Auto-resolve when both choices are in (HOST ONLY)
  useEffect(() => {
    if (!isHost || resolving) return;
    if (currentTurn <= lastResolvedTurn.current) return;
    
    const choiceCount = Object.keys(choices).length;
    if (choiceCount < 2) return; // Wait for both players
    
    console.log(`🎯 Both choices received for turn ${currentTurn}, resolving...`);
    setResolving(true);
    lastResolvedTurn.current = currentTurn;
    
    resolveTurn(battleId, currentTurn, choices)
      .then(() => {
        console.log(`✅ Turn ${currentTurn} resolved`);
        setResolving(false);
        setChoices({}); // Clear choices for next turn
      })
      .catch((error) => {
        console.error(`❌ Turn resolution failed:`, error);
        setResolving(false);
        // Could show error UI here
      });
  }, [isHost, resolving, currentTurn, choices, battleId]);
  
  // This is a headless component - no UI
  return null;
}
```

#### Step 4: Integrate Into Battle Component

Edit [src/components/RTDBBattleComponent.tsx](../src/components/RTDBBattleComponent.tsx):

```typescript
import { BattleTurnManager } from './multiplayer/BattleTurnManager';

export default function RTDBBattleComponent({ battleId, userId }) {
  const [meta, setMeta] = useState<RTDBBattleMeta | null>(null);
  
  useEffect(() => {
    return rtdbService.onBattleMeta(battleId, setMeta);
  }, [battleId]);
  
  const isHost = meta?.players.p1.uid === userId;
  
  return (
    <div className="battle-container">
      {/* Add turn manager */}
      <BattleTurnManager 
        battleId={battleId}
        isHost={isHost}
        userId={userId}
      />
      
      {/* Existing battle UI */}
      <BattleUI ... />
    </div>
  );
}
```

### Day 3: Battle Completion

#### Step 5: Create Battle End Handler

Create [src/lib/multiplayer/handleBattleEnd.ts](../src/lib/multiplayer/):

```typescript
import { battleService } from '@/lib/battleService';
import { roomService } from '@/lib/roomService';
import { rtdbService } from '@/lib/firebase-rtdb-service';
import { BattleState } from '@/lib/team-battle-engine';

export async function handleBattleEnd(
  battleId: string,
  finalState: BattleState
): Promise<void> {
  console.log(`🏁 Battle ${battleId} ended`);
  
  try {
    // Determine winner
    const winnerUid = finalState.winner === 'player' 
      ? finalState.player.uid 
      : finalState.opponent.uid;
    
    // 1. Update RTDB meta to 'ended' state
    await rtdbService.updateBattleMeta(battleId, {
      phase: 'ended',
      winnerUid: winnerUid,
      endedReason: 'victory'
    });
    
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
      completedAt: new Date()
    });
    
    // 4. Update room status
    if (battle.roomId) {
      await roomService.updateRoom(battle.roomId, {
        status: 'finished'
      });
    }
    
    console.log(`✅ Battle cleanup complete. Winner: ${winnerUid}`);
  } catch (error) {
    console.error('❌ Failed to handle battle end:', error);
    throw error;
  }
}
```

#### Step 6: Create Battle End Screen

Create [src/components/multiplayer/BattleEndScreen.tsx](../src/components/multiplayer/):

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { Trophy, Medal, ArrowLeft } from 'lucide-react';

interface Props {
  winner: 'player' | 'opponent';
  playerName: string;
  opponentName: string;
  battleStats?: {
    turns: number;
    damageDealt: number;
    damageTaken: number;
  };
}

export function BattleEndScreen({ winner, playerName, opponentName, battleStats }: Props) {
  const router = useRouter();
  const isWinner = winner === 'player';
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-8 max-w-md w-full mx-4 text-center space-y-6">
        {/* Trophy Icon */}
        <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center ${
          isWinner ? 'bg-yellow-500/20' : 'bg-gray-500/20'
        }`}>
          {isWinner ? (
            <Trophy className="w-16 h-16 text-yellow-500" />
          ) : (
            <Medal className="w-16 h-16 text-gray-500" />
          )}
        </div>
        
        {/* Result */}
        <div>
          <h2 className={`text-3xl font-bold mb-2 ${
            isWinner ? 'text-yellow-500' : 'text-gray-400'
          }`}>
            {isWinner ? 'Victory!' : 'Defeat'}
          </h2>
          <p className="text-muted-foreground">
            {isWinner ? `You defeated ${opponentName}!` : `${opponentName} won the battle.`}
          </p>
        </div>
        
        {/* Stats */}
        {battleStats && (
          <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Turns:</span>
              <span className="font-semibold">{battleStats.turns}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Damage Dealt:</span>
              <span className="font-semibold">{battleStats.damageDealt}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Damage Taken:</span>
              <span className="font-semibold">{battleStats.damageTaken}</span>
            </div>
          </div>
        )}
        
        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={() => router.push('/lobby')}
            className="w-full px-4 py-3 bg-poke-blue text-white rounded-lg hover:bg-poke-blue/90 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Lobby
          </button>
        </div>
      </div>
    </div>
  );
}
```

Update [src/components/RTDBBattleComponent.tsx](../src/components/RTDBBattleComponent.tsx) to show end screen:

```typescript
export default function RTDBBattleComponent({ battleId, userId }) {
  const [meta, setMeta] = useState<RTDBBattleMeta | null>(null);
  const [showEndScreen, setShowEndScreen] = useState(false);
  
  useEffect(() => {
    return rtdbService.onBattleMeta(battleId, (meta) => {
      setMeta(meta);
      if (meta?.phase === 'ended') {
        setShowEndScreen(true);
      }
    });
  }, [battleId]);
  
  return (
    <>
      {/* ... existing battle UI ... */}
      
      {showEndScreen && meta && (
        <BattleEndScreen
          winner={meta.winnerUid === userId ? 'player' : 'opponent'}
          playerName={meta.players.p1.name}
          opponentName={meta.players.p2.name}
          battleStats={{
            turns: meta.turn,
            damageDealt: 0, // Calculate from logs
            damageTaken: 0
          }}
        />
      )}
    </>
  );
}
```

### Day 4-5: Error Handling

#### Step 7: Add Forfeit Functionality

Create [src/lib/multiplayer/forfeitHandler.ts](../src/lib/multiplayer/):

```typescript
import { rtdbService } from '@/lib/firebase-rtdb-service';
import { handleBattleEnd } from './handleBattleEnd';

export async function forfeitBattle(
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
  
  // Update meta
  await rtdbService.updateBattleMeta(battleId, {
    phase: 'ended',
    winnerUid: opponentUid,
    endedReason: 'forfeit'
  });
  
  // Trigger battle end flow
  await handleBattleEnd(battleId, {
    winner: opponentUid === meta.players.p1.uid ? 'player' : 'opponent',
    // ... other state fields
  } as any);
}
```

Add forfeit button to battle UI:

```typescript
<button
  onClick={() => forfeitBattle(battleId, userId)}
  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
>
  Forfeit
</button>
```

#### Step 8: Add Timeout Handling

Create [src/hooks/useChoiceTimeout.ts](../src/hooks/):

```typescript
import { useEffect, useRef } from 'react';

export function useChoiceTimeout(
  deadlineAt: number,
  onTimeout: () => void
) {
  const timerRef = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    const remaining = deadlineAt - Date.now();
    
    if (remaining <= 0) {
      onTimeout();
      return;
    }
    
    timerRef.current = setTimeout(onTimeout, remaining);
    
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [deadlineAt, onTimeout]);
}
```

Use in battle component:

```typescript
const handleTimeout = async () => {
  console.warn('⏰ Choice timeout - auto-forfeiting');
  await forfeitBattle(battleId, userId);
};

useChoiceTimeout(meta?.deadlineAt || 0, handleTimeout);
```

### Day 6-7: Polish & Testing

#### Step 9: Add Loading States

```typescript
{resolving && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
    <div className="bg-card p-6 rounded-lg text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
      <p>Resolving turn...</p>
    </div>
  </div>
)}
```

#### Step 10: Add Battle Animations

```typescript
// Add to move execution
const [animating, setAnimating] = useState(false);

const handleMove = async (moveId: string) => {
  setAnimating(true);
  
  // Submit choice
  await rtdbService.submitChoice(...);
  
  // Wait for resolution
  await waitForResolution();
  
  // Play animation
  await playMoveAnimation(moveId);
  
  setAnimating(false);
};
```

#### Step 11: Test Everything

```bash
# Start dev server
npm run dev

# Open two browser windows
# Window 1: Create room
# Window 2: Join room

# Test:
1. Both players ready up
2. Battle starts
3. Both submit moves
4. Turn resolves automatically
5. HP updates correctly
6. Battle continues until one faints
7. Winner screen appears
8. Can return to lobby
9. Test forfeit button
10. Test timeout (wait >30s without choosing)
```

## Verification Checklist

After implementation, verify:

- [ ] Turns resolve when both choices submitted
- [ ] HP/status updates correctly after each turn
- [ ] Battle log shows move results
- [ ] Battle ends when all Pokémon faint
- [ ] Winner determined correctly
- [ ] Both players see same result
- [ ] Room status updates to 'finished'
- [ ] Can return to lobby after battle
- [ ] Forfeit works
- [ ] Timeout triggers forfeit
- [ ] No console errors
- [ ] Works on mobile
- [ ] Multiple concurrent battles work

## Common Issues & Solutions

**Issue**: Choices submitted but nothing happens
- **Solution**: Check if `BattleTurnManager` is rendered and `isHost` is correct

**Issue**: "Battle state not found" error
- **Solution**: Ensure battle is created in RTDB before starting

**Issue**: Turn resolves but UI doesn't update
- **Solution**: Check RTDB listeners are active and updating state

**Issue**: Both players try to resolve turn
- **Solution**: Only host should resolve (check `isHost` condition)

**Issue**: Firebase quota exceeded
- **Solution**: Add rate limiting, reduce update frequency

## Next Steps After Basic Flow Works

1. **Add battle history** - Store completed battles
2. **Add statistics** - Win/loss ratios, favorite Pokémon
3. **Add matchmaking** - Auto-match players by skill
4. **Add chat** - In-battle messaging
5. **Add replays** - Watch past battles
6. **Add tournaments** - Multi-round competitions

## Need Help?

- Check [MULTIPLAYER_STATUS.md](./MULTIPLAYER_STATUS.md) for architecture
- Check [MULTIPLAYER_IMPLEMENTATION_PLAN.md](./MULTIPLAYER_IMPLEMENTATION_PLAN.md) for details
- Check Firebase Console for real-time debugging
- Check browser DevTools Network tab for RTDB traffic
