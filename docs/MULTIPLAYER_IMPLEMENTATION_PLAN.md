# Multiplayer Battle Implementation Plan

## Current Status Summary

### ✅ Implemented Components
- Firestore lobby/room system
- RTDB battle state structure
- Security rules for both databases
- Client-side battle engine
- Team builder and validation
- Room creation/joining flow

### ❌ Missing Components
- Turn resolution automation
- Battle completion flow
- Reconnection handling
- Forfeit mechanism
- Proper error recovery

## Recommended Solution: Client-Side Resolution (Free Tier Compatible)

This approach uses **zero Cloud Functions** and stays within Firebase free tier limits.

### Architecture Overview

```
Player A (Host)          Firebase RTDB           Player B (Guest)
     |                        |                         |
     |--[Submit Choice]------>|                         |
     |                        |<---[Submit Choice]------|
     |                        |                         |
     |<--[Both choices ready] |                         |
     |                        |                         |
  [Execute Turn]              |                         |
     |                        |                         |
     |--[Post Resolution]---->|                         |
     |                        |----[Resolution]-------->|
     |                        |                         |
                           [Validate]
```

### Implementation Steps

#### 1. Add Turn Resolution Trigger (Client-Side)

**File**: `src/components/multiplayer/BattleTurnManager.tsx` (NEW)

This component watches for both players' choices and triggers resolution.

```typescript
export function BattleTurnManager({ battleId, isHost, userId }) {
  const [choices, setChoices] = useState<Record<string, RTDBChoice>>({});
  const [turn, setTurn] = useState(1);
  const [resolving, setResolving] = useState(false);

  // Listen for choices
  useEffect(() => {
    return rtdbService.onBattleChoices(battleId, turn, (choices) => {
      setChoices(choices || {});
    });
  }, [battleId, turn]);

  // Auto-resolve when both choices are in (HOST ONLY)
  useEffect(() => {
    if (!isHost || resolving) return;
    
    const choiceCount = Object.keys(choices).length;
    if (choiceCount === 2) {
      setResolving(true);
      resolveTurn(battleId, turn, choices)
        .then(() => {
          setTurn(t => t + 1);
          setResolving(false);
        })
        .catch(err => {
          console.error('Turn resolution failed:', err);
          setResolving(false);
        });
    }
  }, [choices, isHost, resolving, battleId, turn]);

  return null; // Headless component
}
```

#### 2. Turn Resolution Function

**File**: `src/lib/multiplayer/resolveTurn.ts` (NEW)

```typescript
import { executeTurn } from '@/server/executeTurn';
import { rtdbService } from '@/lib/firebase-rtdb-service';

export async function resolveTurn(
  battleId: string,
  turn: number,
  choices: Record<string, RTDBChoice>
): Promise<void> {
  // 1. Fetch current battle state from RTDB
  const battleState = await rtdbService.getBattleState(battleId);
  
  // 2. Convert choices to actions
  const actions = convertChoicesToActions(choices, battleState);
  
  // 3. Execute turn using existing server logic
  const updatedState = await executeTurn(battleState);
  
  // 4. Write resolution to RTDB
  await rtdbService.writeResolution(battleId, turn, {
    by: 'client-host',
    committedAt: Date.now(),
    rngSeedUsed: battleState.rng,
    diffs: calculateStateDiffs(battleState, updatedState),
    logs: updatedState.battleLog,
    stateHashAfter: hashState(updatedState)
  });
  
  // 5. Update public state
  await rtdbService.updatePublicState(battleId, updatedState);
  
  // 6. Check for battle end
  if (updatedState.isComplete) {
    await handleBattleEnd(battleId, updatedState);
  }
}
```

#### 3. Battle End Handler

**File**: `src/lib/multiplayer/handleBattleEnd.ts` (NEW)

```typescript
export async function handleBattleEnd(
  battleId: string,
  finalState: BattleState
): Promise<void> {
  // Update RTDB meta
  await rtdbService.updateBattleMeta(battleId, {
    phase: 'ended',
    winnerUid: finalState.winner === 'player' 
      ? finalState.player.uid 
      : finalState.opponent.uid,
    endedReason: 'victory'
  });
  
  // Update Firestore battle document
  await battleService.updateBattle(battleId, {
    status: 'finished',
    winner: finalState.winner,
    completedAt: new Date()
  });
  
  // Update room status
  const battle = await battleService.getBattle(battleId);
  if (battle?.roomId) {
    await roomService.updateRoom(battle.roomId, {
      status: 'finished'
    });
  }
}
```

#### 4. Add Anti-Cheat Validation (Guest)

**File**: `src/lib/multiplayer/validateResolution.ts` (NEW)

```typescript
export function validateResolution(
  beforeState: BattleState,
  resolution: RTDBResolution,
  choices: Record<string, RTDBChoice>
): boolean {
  // Re-execute turn locally
  const localState = executeTurnLocally(beforeState, choices);
  const localHash = hashState(localState);
  
  // Compare hash
  if (localHash !== resolution.stateHashAfter) {
    console.warn('Resolution hash mismatch! Possible cheating.');
    // Could trigger dispute resolution or reconnection
    return false;
  }
  
  return true;
}
```

#### 5. Forfeit and Timeout Handling

**File**: `src/lib/multiplayer/forfeitHandler.ts` (NEW)

```typescript
export async function handleForfeit(
  battleId: string,
  userId: string
): Promise<void> {
  const meta = await rtdbService.getBattleMeta(battleId);
  const opponentUid = meta.players.p1.uid === userId 
    ? meta.players.p2.uid 
    : meta.players.p1.uid;
  
  await rtdbService.updateBattleMeta(battleId, {
    phase: 'ended',
    winnerUid: opponentUid,
    endedReason: 'forfeit'
  });
  
  await handleBattleEnd(battleId, {
    /* ... */
    winner: opponentUid === meta.players.p1.uid ? 'player' : 'opponent'
  });
}

// Timeout watcher (runs on both clients)
export function startTimeoutWatcher(
  battleId: string,
  turn: number,
  deadlineAt: number,
  onTimeout: () => void
): () => void {
  const remaining = deadlineAt - Date.now();
  
  if (remaining <= 0) {
    onTimeout();
    return () => {};
  }
  
  const timer = setTimeout(onTimeout, remaining);
  return () => clearTimeout(timer);
}
```

#### 6. Update Battle Runtime Component

**File**: `src/components/RTDBBattleComponent.tsx`

Add the turn manager and timeout watchers:

```typescript
function RTDBBattleComponent({ battleId, userId }) {
  const [meta, setMeta] = useState<RTDBBattleMeta | null>(null);
  const isHost = meta?.players.p1.uid === userId;
  
  // Add turn manager
  return (
    <>
      <BattleTurnManager 
        battleId={battleId} 
        isHost={isHost} 
        userId={userId}
      />
      <BattleUI ... />
    </>
  );
}
```

### Firebase Free Tier Usage Estimates

#### Per Battle (2 players, average 20 turns):

**Firestore:**
- Room creation: 1 write
- Team updates: 4 writes (both players ready)
- Battle start: 2 writes (battle doc + room update)
- Battle end: 2 writes
- **Total: ~10 writes, ~15 reads**

**RTDB:**
- Battle creation: 1 write
- Per turn: 2 choice writes + 1 resolution write = 3 writes
- State updates: 1 write per turn
- **Total: ~80 writes, ~100 reads per battle**

**Daily Capacity (Free Tier):**
- Firestore: 20K writes = **~2000 battles/day**
- RTDB: 10GB download ≈ **~5000 battles/day** (with 2MB avg state)

More than sufficient for development and moderate usage!

## Testing Checklist

- [ ] Create room and join as guest
- [ ] Both players submit choices
- [ ] Turn resolves automatically (host-side)
- [ ] Guest validates resolution
- [ ] Battle completes when team faints
- [ ] Winner determined correctly
- [ ] Room status updates to 'finished'
- [ ] Forfeit works for both players
- [ ] Timeout triggers after deadline
- [ ] Reconnection recovers state
- [ ] Multiple concurrent battles work
- [ ] Cleanup happens after battle ends

## Migration Path

### Phase 1: Core Flow (Week 1)
1. Implement `BattleTurnManager`
2. Create `resolveTurn` function
3. Hook into existing battle UI
4. Test basic 2-player flow

### Phase 2: Polish (Week 2)
1. Add validation/anti-cheat
2. Implement forfeit
3. Add timeout handling
4. Error recovery

### Phase 3: UX (Week 3)
1. Loading states during resolution
2. Battle animations
3. Post-battle summary
4. Rematch functionality

## Alternative: Cloud Functions (If Budget Allows)

If you later want server-authoritative resolution:

**File**: `functions/src/resolveTurn.ts`

```typescript
export const onBothChoicesSubmitted = functions.database
  .ref('/battles/{battleId}/turns/{turn}/choices/{userId}')
  .onCreate(async (snapshot, context) => {
    const { battleId, turn } = context.params;
    
    // Check if both players submitted
    const choicesRef = admin.database()
      .ref(`/battles/${battleId}/turns/${turn}/choices`);
    const choicesSnap = await choicesRef.once('value');
    const choices = choicesSnap.val();
    
    if (Object.keys(choices).length === 2) {
      // Execute turn server-side
      await resolveTurnServerSide(battleId, Number(turn), choices);
    }
  });
```

**Costs**: ~2 invocations per turn = 40 invocations per battle
**Free Tier**: 2M invocations/month = 50K battles/month

Still very generous!

## Conclusion

The client-side resolution approach is **perfect for Firebase free tier** and can handle thousands of daily battles. It's simpler to deploy (no Functions), maintains low latency, and stays within free quotas.

The architecture is also **upgrade-friendly** - you can move to Cloud Functions later without changing the RTDB structure or client code significantly.
