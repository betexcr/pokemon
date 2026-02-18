# Multiplayer Architecture Diagrams

## Current State (80% Complete)

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER FLOW                               │
└─────────────────────────────────────────────────────────────────┘

Player A                                              Player B
   │                                                      │
   │ 1. Create Room                                      │
   ├──────────────────► Firestore (battle_rooms) ◄───────┤ 2. Join Room
   │                                                      │
   │ 3. Select Team & Ready                               │ 4. Select Team & Ready
   ├──────────────────► Firestore ◄──────────────────────┤
   │                                                      │
   │ 5. Host clicks "Start"                              │
   ├──────────────────► Firestore                        │
   │                      │                               │
   │                      └─────► RTDB (create battle)   │
   │                                                      │
   │ <───────────────── RTDB ──────────────────────────► │
   │  (Real-time sync of battle state)                   │
   │                                                      │
   │ 6. Submit Choice                                    │ 7. Submit Choice
   ├──────────────────► RTDB/battles/{id}/turns/1/choices │
   │                                                      │
   │                                                      │
   │ ❌ STOPS HERE - NO RESOLUTION HAPPENS ❌            │
   │                                                      │
```

## Target State (100% Complete)

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPLETE BATTLE FLOW                         │
└─────────────────────────────────────────────────────────────────┘

Player A (Host)                RTDB                    Player B (Guest)
      │                         │                            │
      │ 1. Submit Move          │                            │
      ├────────────────────────►│                            │
      │                         │                            │
      │                         │◄───────────────────────────┤ 2. Submit Move
      │                         │                            │
      │                         │                            │
      │◄─ Both choices ready! ──┤──── Both choices ready! ──►│
      │                         │                            │
   ┌──▼──────────────────┐      │                            │
   │ BattleTurnManager   │      │                            │
   │ - Fetches state     │      │                            │
   │ - Calls executeTurn │      │                            │
   │ - Posts resolution  │      │                            │
   └──┬──────────────────┘      │                            │
      │                         │                            │
      │ 3. Write Resolution     │                            │
      ├────────────────────────►│                            │
      │                         │                            │
      │                         ├──── Resolution Ready ─────►│
      │                         │                            │
      │◄──── Display Result ────┤──── Display Result ───────►│
      │                         │                            │
      │                      ┌──▼──┐                         │
      │                      │Check│                         │
      │                      │ Win │                         │
      │                      └──┬──┘                         │
      │                         │                            │
      │                    [If not ended]                    │
      │                    Turn = Turn + 1                   │
      │                    Back to step 1                    │
      │                         │                            │
      │                    [If ended]                        │
      │                         │                            │
      │◄─── Update Meta ────────┤──── Update Meta ──────────►│
      │    (winner, end reason) │                            │
      │                         │                            │
      │◄─── Update Firestore ───┤──── Update Firestore ─────►│
      │    (battle status)       │                            │
      │                         │                            │
      │◄─── Update Room ────────┤──── Update Room ──────────►│
      │    (status: finished)    │                            │
      │                         │                            │
      │                         │                            │
      │ Show Winner Screen      │      Show Winner Screen    │
      └─────────────────────────┴────────────────────────────┘
```

## Data Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FIRESTORE                               │
│                    (Persistent Storage)                         │
└─────────────────────────────────────────────────────────────────┘

/battle_rooms/{roomId}
  ├─ hostId: string
  ├─ hostName: string
  ├─ hostTeam: array
  ├─ hostReady: boolean
  ├─ guestId: string
  ├─ guestName: string
  ├─ guestTeam: array
  ├─ guestReady: boolean
  ├─ status: "waiting" | "ready" | "battling" | "finished"
  ├─ battleId: string (reference)
  └─ createdAt: timestamp

/battles/{battleId}
  ├─ roomId: string
  ├─ hostId: string
  ├─ guestId: string
  ├─ status: "waiting" | "active" | "finished"
  ├─ winner: "host" | "guest" | null
  ├─ createdAt: timestamp
  └─ completedAt: timestamp

/userTeams/{teamId}
  ├─ userId: string
  ├─ name: string
  ├─ slots: array
  └─ updatedAt: timestamp


┌─────────────────────────────────────────────────────────────────┐
│                  REALTIME DATABASE                              │
│                 (Live Battle State)                             │
└─────────────────────────────────────────────────────────────────┘

/battles/{battleId}
  │
  ├─ /meta                          # Battle metadata
  │  ├─ createdAt: number
  │  ├─ format: "singles"
  │  ├─ ruleSet: "gen9-no-weather"
  │  ├─ players:
  │  │  ├─ p1: { uid, name }
  │  │  └─ p2: { uid, name }
  │  ├─ phase: "choosing" | "resolving" | "ended"
  │  ├─ turn: number
  │  ├─ deadlineAt: number
  │  ├─ version: number
  │  ├─ winnerUid: string (optional)
  │  └─ endedReason: "forfeit" | "timeout" | "victory"
  │
  ├─ /public                        # Visible to both players
  │  ├─ /field
  │  │  ├─ /hazards
  │  │  │  ├─ p1: { sr, spikes, tSpikes, web }
  │  │  │  └─ p2: { sr, spikes, tSpikes, web }
  │  │  └─ /screens
  │  │     ├─ p1: { reflect, lightScreen }
  │  │     └─ p2: { reflect, lightScreen }
  │  ├─ /p1
  │  │  ├─ active: { species, hp, status, boosts, ... }
  │  │  └─ benchPublic: [{ species, fainted, revealedMoves }]
  │  ├─ /p2
  │  │  ├─ active: { species, hp, status, boosts, ... }
  │  │  └─ benchPublic: [{ species, fainted, revealedMoves }]
  │  ├─ lastResultSummary: string
  │  └─ battleLog: [string]
  │
  ├─ /private                       # Secret info per player
  │  ├─ /{p1Uid}
  │  │  ├─ team: [full pokemon objects with moves, items, abilities]
  │  │  └─ choiceLock: { moveId, target, locked }
  │  └─ /{p2Uid}
  │     ├─ team: [full pokemon objects]
  │     └─ choiceLock: { moveId, target, locked }
  │
  ├─ /participants                  # For security rules
  │  ├─ {p1Uid}: { role: "p1", name, joinedAt }
  │  └─ {p2Uid}: { role: "p2", name, joinedAt }
  │
  └─ /turns
     └─ /{turnNumber}
        ├─ /choices
        │  ├─ /{p1Uid}: { action, payload, committedAt, clientVersion }
        │  └─ /{p2Uid}: { action, payload, committedAt, clientVersion }
        │
        └─ /resolution
           ├─ by: "client-host" | "function"
           ├─ committedAt: number
           ├─ rngSeedUsed: number
           ├─ diffs: [state changes]
           ├─ logs: [battle messages]
           └─ stateHashAfter: string
```

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      COMPONENT TREE                             │
└─────────────────────────────────────────────────────────────────┘

/battle/runtime
  │
  └─ BattleRuntimePage (wrapper)
      │
      ├─ RTDBBattleComponent
      │   │
      │   ├─ BattleTurnManager ✨ NEW
      │   │   │
      │   │   ├─ useEffect: Listen to choices
      │   │   │
      │   │   └─ useEffect: Auto-resolve when ready
      │   │       │
      │   │       └─► resolveTurn() ✨ NEW
      │   │           │
      │   │           ├─► executeTurn()
      │   │           ├─► rtdbService.writeResolution()
      │   │           └─► handleBattleEnd() ✨ NEW
      │   │
      │   ├─ BattleUI
      │   │   ├─ PokemonDisplay
      │   │   ├─ MoveSelector
      │   │   ├─ BattleLog
      │   │   └─ TurnIndicator
      │   │
      │   └─ BattleEndScreen ✨ NEW
      │       ├─ Winner Display
      │       ├─ Battle Stats
      │       └─ Return to Lobby Button
      │
      └─ ToastContainer


/lobby/room
  │
  └─ RoomPageClient
      │
      ├─ Room Info Display
      ├─ Team Selector
      ├─ Ready Button
      └─ Start Battle Button (host only)
```

## Security Rules Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    FIRESTORE RULES                              │
└─────────────────────────────────────────────────────────────────┘

/battle_rooms/{roomId}
  ├─ READ:   authenticated AND (public status OR participant)
  ├─ CREATE: authenticated AND hostId == auth.uid
  ├─ UPDATE: authenticated AND (hostId OR guestId == auth.uid)
  └─ DELETE: authenticated AND hostId == auth.uid

/battles/{battleId}
  ├─ CREATE: authenticated AND hostId == auth.uid
  ├─ READ:   authenticated AND (hostId OR guestId == auth.uid)
  ├─ UPDATE: authenticated AND (hostId OR guestId == auth.uid)
  └─ DELETE: authenticated AND hostId == auth.uid

/userTeams/{teamId}
  ├─ CREATE: authenticated AND userId == auth.uid
  ├─ READ:   authenticated AND userId == auth.uid
  ├─ UPDATE: authenticated AND userId == auth.uid
  └─ DELETE: authenticated AND userId == auth.uid


┌─────────────────────────────────────────────────────────────────┐
│                       RTDB RULES                                │
└─────────────────────────────────────────────────────────────────┘

/battles/{battleId}
  │
  ├─ /meta
  │  ├─ READ:  participant
  │  └─ WRITE: false (set once at creation)
  │
  ├─ /public
  │  ├─ READ:  participant
  │  └─ WRITE: false (updated by resolution)
  │
  ├─ /private/{uid}
  │  ├─ READ:  auth.uid == {uid}
  │  └─ WRITE: auth.uid == {uid}
  │
  └─ /turns/{turn}/choices/{uid}
     ├─ READ:  participant
     └─ WRITE: auth.uid == {uid}
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    ERROR SCENARIOS                              │
└─────────────────────────────────────────────────────────────────┘

1. Player Disconnects Mid-Turn
   ├─ Firestore listener detects disconnect
   ├─ Start timeout timer (30 seconds)
   ├─ If reconnects: Resume from last state
   └─ If timeout: Auto-forfeit

2. Invalid Move Submitted
   ├─ Client validates before submitting
   ├─ Server validates during resolution
   └─ If invalid: Force struggle or random valid move

3. Simultaneous Battle End
   ├─ Both detect via RTDB meta.phase == 'ended'
   ├─ Host writes once (with transaction)
   └─ Guest reads and displays

4. Resolution Mismatch (Cheating Attempt)
   ├─ Guest validates resolution hash
   ├─ If mismatch: Flag in logs, show warning
   └─ Guest can choose to concede or dispute

5. RTDB Connection Lost
   ├─ Firebase SDK auto-reconnects
   ├─ State syncs from last snapshot
   └─ Show "Reconnecting..." banner

6. Firestore Write Fails
   ├─ Retry with exponential backoff
   ├─ Show error toast after 3 attempts
   └─ Allow manual retry button
```

## Free Tier Monitoring

```
┌─────────────────────────────────────────────────────────────────┐
│                  QUOTA DASHBOARD                                │
└─────────────────────────────────────────────────────────────────┘

Daily Firestore Writes (20K limit)
[█████████░░░░░░░░░░░] 45% (9,000 / 20,000)
  ├─ Projected: ~15,000 today
  ├─ Battles today: ~1,500
  └─ Status: ✅ Healthy

Daily RTDB Downloads (10GB limit)
[██░░░░░░░░░░░░░░░░░░] 10% (1GB / 10GB)
  ├─ Projected: ~3GB today
  ├─ Avg per battle: 2MB
  └─ Status: ✅ Healthy

Concurrent Connections (100 limit)
[████░░░░░░░░░░░░░░░░] 20% (20 / 100)
  ├─ Active battles: 10
  ├─ Lobby users: 15
  └─ Status: ✅ Healthy

You can comfortably run:
  ✅ ~2,000 battles/day
  ✅ ~100 concurrent players
  ✅ ~50 simultaneous battles
```

---

## Summary

The architecture is **well-designed** for Firebase free tier with:
- Clear separation between persistent (Firestore) and real-time (RTDB) data
- Efficient security rules to prevent unauthorized access
- Client-side resolution to avoid Cloud Functions costs
- Built-in validation to prevent cheating
- Graceful error handling for edge cases

The missing pieces are **straightforward to implement** using the existing infrastructure!
