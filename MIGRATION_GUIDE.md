# Migration Guide: Firestore to Firebase RTDB Battle System

This guide explains how to migrate your current Firestore-based battle system to the new Firebase Realtime Database (RTDB) architecture that follows the documented battle engine flow.

## Overview of Changes

### 1. Database Architecture
- **Before**: Firestore documents with simple battle state
- **After**: RTDB with structured paths for public/private state separation

### 2. Authoritative Server
- **Before**: Clients directly update battle state
- **After**: Only Cloud Functions can modify authoritative fields

### 3. Turn State Machine
- **Before**: Simple turn tracking
- **After**: `phase ∈ {waiting, choosing, resolving, ended}` with version control

### 4. Choice Validation
- **Before**: Direct action posting
- **After**: Clients post choices to `/turns/{turn}/choices/{uid}` with server validation

## Migration Steps

### Step 1: Update Firebase Configuration

1. **Enable RTDB in Firebase Console**
   - Go to Firebase Console → Realtime Database
   - Create a new database
   - Choose your region
   - Set security rules to start in test mode

2. **Update Environment Variables**
   ```bash
   # Add to your .env.local
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com/
   ```

3. **Update firebase.ts**
   ```typescript
   import { getDatabase } from 'firebase/database';
   
   export const rtdb = getDatabase(app);
   ```

### Step 2: Deploy Security Rules

1. **Copy RTDB Rules**
   - Use the rules from `src/lib/firebase-rtdb-rules.json`
   - Deploy to Firebase Console → Realtime Database → Rules

2. **Test Rules**
   - Ensure authenticated users can only read/write their own data
   - Verify battle participants can read public state
   - Confirm only Cloud Functions can write to meta/public/private

### Step 3: Deploy Cloud Functions

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Initialize Functions**
   ```bash
   firebase init functions
   ```

3. **Deploy Functions**
   ```bash
   firebase deploy --only functions
   ```

### Step 4: Update Client Code

1. **Replace Battle Service**
   ```typescript
   // Old: import { battleService } from './battleService';
   import { rtdbService } from './firebase-rtdb-service';
   import { BattleFlowEngine } from './battle-engine-rtdb';
   ```

2. **Update Battle Components**
   ```typescript
   // Old: Use battleService directly
   const battle = await battleService.getBattle(battleId);
   
   // New: Use RTDB battle engine
   const battleEngine = new BattleFlowEngine(battleId);
   await battleEngine.initialize();
   ```

3. **Update Choice Submission**
   ```typescript
   // Old: Direct state updates
   await battleService.updateBattle(battleId, { actions: newActions });
   
   // New: Submit choices
   await battleEngine.submitMove(moveId, target);
   await battleEngine.submitSwitch(pokemonIndex);
   ```

### Step 5: Data Migration

1. **Create Migration Script**
   ```typescript
   // migrate-battles.js
   const admin = require('firebase-admin');
   const { getFirestore } = require('firebase-admin/firestore');
   const { getDatabase } = require('firebase-admin/database');
   
   async function migrateBattles() {
     const firestore = getFirestore();
     const rtdb = getDatabase();
     
     // Get all existing battles from Firestore
     const battlesSnapshot = await firestore.collection('battles').get();
     
     for (const doc of battlesSnapshot.docs) {
       const battleData = doc.data();
       
       // Convert to RTDB format
       await rtdbService.createBattle(
         doc.id,
         battleData.hostId,
         battleData.hostName,
         battleData.hostTeam,
         battleData.guestId,
         battleData.guestName,
         battleData.guestTeam
       );
     }
   }
   ```

2. **Run Migration**
   ```bash
   node migrate-battles.js
   ```

### Step 6: Update UI Components

1. **Replace Battle Components**
   - Use `RTDBBattleComponent` instead of existing battle components
   - Update to handle new phase system (choosing/resolving/ended)

2. **Update Lobby System**
   - Use RTDB lobby queue instead of Firestore rooms
   - Implement presence tracking

## Key Differences

### Battle State Structure

**Old (Firestore)**:
```typescript
{
  id: string;
  hostId: string;
  guestId: string;
  currentTurn: 'host' | 'guest';
  turnNumber: number;
  actions: BattleAction[];
  battleData: unknown;
  status: 'waiting' | 'active' | 'completed';
}
```

**New (RTDB)**:
```typescript
// /battles/{battleId}/meta
{
  phase: 'choosing' | 'resolving' | 'ended';
  turn: number;
  version: number;
  deadlineAt: number;
  players: { p1: {uid, name}, p2: {uid, name} };
}

// /battles/{battleId}/public
{
  p1: { active: {...}, benchPublic: [...] };
  p2: { active: {...}, benchPublic: [...] };
  field: { hazards: {...}, screens: {...} };
}

// /battles/{battleId}/private/{uid}
{
  team: [...]; // Full secret team info
  choiceLock: {...};
}
```

### Choice Submission

**Old**:
```typescript
await battleService.addAction(battleId, action);
```

**New**:
```typescript
await battleEngine.submitMove(moveId, target);
await battleEngine.submitSwitch(pokemonIndex);
```

### State Listening

**Old**:
```typescript
battleService.onBattleChange(battleId, (battle) => {
  // Handle battle changes
});
```

**New**:
```typescript
const battleEngine = new BattleFlowEngine(battleId);
await battleEngine.initialize((state) => {
  // Handle battle state changes
}, (phase) => {
  // Handle phase changes
});
```

## Testing

1. **Test Choice Submission**
   - Verify choices are submitted to correct RTDB path
   - Check Cloud Functions process choices correctly

2. **Test Turn Resolution**
   - Ensure both players' choices trigger resolution
   - Verify public/private state updates correctly

3. **Test Timeout Handling**
   - Verify timeout sweep function works
   - Check auto-forfeit behavior

4. **Test Security Rules**
   - Ensure users can only read their own private data
   - Verify Cloud Functions can write to all paths

## Rollback Plan

If issues arise, you can rollback by:

1. **Revert to Firestore**
   - Update imports back to old battle service
   - Restore original battle components

2. **Keep RTDB as Backup**
   - RTDB data will remain for future migration
   - No data loss during rollback

## Performance Considerations

1. **RTDB Listeners**
   - Use specific path listeners instead of broad listeners
   - Implement proper cleanup in useEffect

2. **Choice Validation**
   - Client-side validation before submission
   - Server-side validation in Cloud Functions

3. **State Updates**
   - Batch updates in Cloud Functions
   - Use transactions for critical updates

## Monitoring

1. **Cloud Functions Logs**
   - Monitor choice processing
   - Track resolution performance

2. **RTDB Usage**
   - Monitor read/write operations
   - Track data transfer

3. **Error Handling**
   - Implement proper error boundaries
   - Log and track client errors

This migration will provide a more robust, scalable, and cheat-resistant battle system that follows the documented architecture.
