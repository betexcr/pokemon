Here’s a production-ready architecture for Singles Pokémon battles over Firebase Realtime Database (RTDB) that’s fast, fair, and cheat-resistant. It splits public vs. private state, makes clients write only intents, and lets Cloud Functions be the authoritative arbiter.

1) Core concepts
	•	Authoritative server: Only Cloud Functions (Admin SDK) can modify authoritative fields (HP, statuses, turn result, logs). Clients can only post their choices and update presence.
	•	Public vs. Private state: What both players must see (HP, statuses, revealed info) vs. each player’s secrets (full movesets/PP/bench).
	•	Turn state machine: phase ∈ {waiting, choosing, resolving, ended} with a turn counter and a version (optimistic concurrency).
	•	Single source of truth: Every resolution writes a diff + full snapshot hash to detect drift.
	•	Time limits: Per-turn deadlineAt (server time) with auto-resolve / auto-forfeit.

2) RTDB data model (paths)

/users/{uid}
  displayName, rating, avatarUrl, ...

/presence/{uid}
  connected: true|false
  lastActiveAt: serverTimestamp

/lobbies/{region}/queue/{uid}
  joinedAt, prefs (format, minRating, ...)

/battles/{battleId}
/battles/{battleId}/meta
  createdAt, format: "singles", ruleSet: "gen9-no-weather", region
  players: { p1: {uid}, p2: {uid} }
  phase: "choosing" | "resolving" | "ended"
  turn: 1
  deadlineAt: serverTimestamp
  version: 17                     // increments each turn
  winnerUid: null | uid
  endedReason: null | "forfeit" | "timeout"

/battles/{battleId}/public        // visible to both
  field:
    hazards: {p1: {sr:true, spikes:1, tSpikes:0, web:false},
              p2: {...}}
    screens: {p1:{reflect:0, lightScreen:0}, p2:{...}}
  p1:
    active: { species, level, types, hp:{cur,max}, status, boosts, itemKnown?:true, abilityKnown?:true, subHp?:0 }
    benchPublic: [{species, fainted, revealedMoves:[...]}]   // no PP, no unrevealed info
  p2: { ... symmetrical ... }
  lastResultSummary: "P1 used Thunderbolt..."

/battles/{battleId}/private
  {uid-of-p1}:
    team: full secret info (moves with PP, items, abilities, IV/EV if you store them)
    choiceLock: { moveId?, target?, locked?:bool }
  {uid-of-p2}: { ... }

/battles/{battleId}/turns/{turn}
/battles/{battleId}/turns/{turn}/choices/{uid}
  action: "move"|"switch"|"forfeit"
  payload: { moveId?, target?, switchToIndex? }
  committedAt: serverTimestamp
  clientVersion: 17                // must match meta.version

/battles/{battleId}/turns/{turn}/resolution
  by: "function"
  committedAt: serverTimestamp
  rngSeedUsed: 1234567
  diffs: [...]                     // array of patch operations applied
  logs:  ["text line 1", ...]
  stateHashAfter: "sha256:..."

Notes
• No weather: simply omit from public.field.
• If you later add spectators, store a read-only /battles/{id}/spectate pointer list.

3) Security Rules (RTDB)
	•	Require Auth.
	•	Clients may only write:
	•	their own /turns/{t}/choices/{uid} (and only once per turn, and only in phase “choosing”, and only if clientVersion equals current meta.version),
	•	their own /presence/{uid} and lobby queue entries,
	•	never to /public, /meta, or any /resolution paths.
	•	Read:
	•	Both players can read /public, /meta, and their own /private/{uid}.
	•	Deny reading opponent’s /private.

Example rules (trimmed but enforceable):

{
  "rules": {
    ".read": false,
    ".write": false,

    "presence": {
      "$uid": {
        ".read": "auth != null && auth.uid == $uid",
        ".write": "auth != null && auth.uid == $uid"
      }
    },

    "lobbies": {
      "$region": {
        "queue": {
          "$uid": {
            ".read": "auth != null && auth.uid == $uid",
            ".write": "auth != null && auth.uid == $uid",
            "joinedAt": {".validate": "newData.isNumber() || newData.val() == now"}
          }
        }
      }
    },

    "battles": {
      "$bid": {
        "meta": {
          ".read": "auth != null && root.child('battles/'+$bid+'/meta/players').val().p1.uid == auth.uid || root.child('battles/'+$bid+'/meta/players').val().p2.uid == auth.uid",
          ".write": false
        },
        "public": {
          ".read": "auth != null && (root.child('battles/'+$bid+'/meta/players/p1/uid').val() == auth.uid || root.child('battles/'+$bid+'/meta/players/p2/uid').val() == auth.uid)",
          ".write": false
        },
        "private": {
          "$uid": {
            ".read": "auth != null && auth.uid == $uid",
            ".write": false
          },
          "$other": {
            ".read": false, ".write": false
          }
        },
        "turns": {
          "$turn": {
            "choices": {
              "$uid": {
                ".read": "auth != null && (auth.uid == $uid)",
                ".write": "
                  auth != null &&
                  auth.uid == $uid &&
                  root.child('battles/'+$bid+'/meta/phase').val() == 'choosing' &&
                  !data.exists() &&                            /* only once */
                  newData.child('action').isString() &&
                  (newData.child('action').val() == 'move' || newData.child('action').val() == 'switch' || newData.child('action').val() == 'forfeit') &&
                  newData.child('clientVersion').val() == root.child('battles/'+$bid+'/meta/version').val()
                "
              }
            },
            "resolution": { ".read": "auth != null", ".write": false }
          }
        }
      }
    }
  }
}

4) Cloud Functions (authoritative logic)

Use TypeScript Functions with Admin SDK. Recommended triggers and responsibilities:
	1.	matchmake.onWrite(queue)
	•	When two compatible players are in /lobbies/{region}/queue, create /battles/{id}:
	•	Fill meta, public (masked info), private/{uid} (full team), set phase="choosing", turn=1, deadlineAt=now+T.
	2.	battle.onChoiceWrite (onCreate at /battles/{id}/turns/{turn}/choices/{uid})
	•	Validate server-side legality (e.g., chosen move exists, PP>0, not Taunted if status move, not Disabled, switch target alive, etc.). If illegal: delete choice, optionally mark a warning.
	•	If both choices present and meta.phase=="choosing": start resolution (see next function).
	3.	battle.resolveTurn (callable or internal function invoked by onChoiceWrite)
	•	Use a transaction over /battles/{id} root:
	•	Re-read meta.version and ensure it matches both clientVersions.
	•	Set meta.phase="resolving".
	•	Compute full turn outcome (server RNG):
	•	Order actions (priority/speed), run move pipeline, update authoritative HP/status/PP, apply hazards, residual at end of turn.
	•	Produce diffs, logs, stateHashAfter.
	•	Commit turns/{t}/resolution and update:
	•	public (HP, statuses, revealed info)
	•	private/{uid} (PP, choiceLock updates, etc.)
	•	meta: version++, turn++, phase="choosing" (or "ended"), deadlineAt=now+T, winnerUid if ended.
	•	All writes in a single multi-location update to keep them atomic(ish).
	4.	battle.turnTimeoutSweep (pub/sub schedule every 15s)
	•	Query battles where phase="choosing" and deadlineAt < now.
	•	For each, if one side posted choice and the other didn’t:
	•	Auto-forfeit the idle side or pick a safe default (e.g., Struggle or random valid switch) then call resolveTurn.
	•	Prevents stuck games.
	5.	presence.onConnect / onDisconnect
	•	Mirror /.info/connected into /presence/{uid} with lastActiveAt and transient connected.
	•	Optionally mark soft forfeit after N seconds disconnected (only during battle).

Tip: keep one deterministic RNG per battle (seed saved in meta) so replays are reproducible.

5) Client flow (React/Next, RN, etc.)
	1.	Auth with Firebase Auth; write /presence/{uid} using onDisconnect to clear.
	2.	Matchmaking: write /lobbies/{region}/queue/{uid} with prefs; listen for a /battles/{id} that lists you in meta.players.
	3.	Subscribe to:
	•	/battles/{id}/meta (phase/turn/deadline),
	•	/battles/{id}/public,
	•	/battles/{id}/private/{uid}.
	4.	UI states:
	•	If meta.phase==="choosing": enable Move / Switch UI using server-validated options computed locally from current state (to be responsive).
	•	On confirm, write /turns/{turn}/choices/{uid} with clientVersion=meta.version.
	•	Lock local UI after posting; show “Waiting for opponent…”.
	5.	Show timer from deadlineAt - serverTime(). Use onDisconnect to mark presence.
	6.	When turns/{t}/resolution appears (or meta.version increments), animate result, then proceed to next choosing phase.

6) Anti-cheat & integrity
	•	Never let clients write HP/PP/status or opponent-visible secrets.
	•	Validate choices in rules (shape, once/turn) and in Functions (legality).
	•	Save a state hash after each resolution; on client load you can verify (for debugging or spectator sanity).
	•	Keep battle logs immutable under /turns/{t}/resolution/logs (read-only to clients).
	•	Redact private data: opponent never reads your /private/{uid}; /public only includes revealed info.

7) Concurrency & races
	•	Use a transaction (or ref.update with a version precondition) when switching phase and advancing the turn to avoid double-resolves.
	•	Resolution function should re-read both choices within the same critical section; if phase != "choosing" or version changed, abort.

8) Performance & cost
	•	Keep /public compact (primitives & small arrays).
	•	Don’t spam writes: one multi-path update per resolution.
	•	Use serverTimestamp everywhere you track time.
	•	Clean finished battles with a TTL path (scheduled cleanup moves old records to cold storage or deletes after N days).

9) Minimal Function skeleton (TypeScript)

// firestoreInit.ts (RTDB Admin)
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
admin.initializeApp();
const db = admin.database();

exports.onChoiceCreate = functions.database
  .ref('/battles/{bid}/turns/{turn}/choices/{uid}')
  .onCreate(async (snap, ctx) => {
    const { bid, turn } = ctx.params;
    const choice = snap.val();

    // 1) Read meta & both choices
    const metaRef = db.ref(`/battles/${bid}/meta`);
    const [metaSnap, choicesSnap] = await Promise.all([
      metaRef.get(),
      db.ref(`/battles/${bid}/turns/${turn}/choices`).get()
    ]);
    const meta = metaSnap.val();
    const choices = choicesSnap.val() || {};

    // 2) Guard rails
    if (meta.phase !== 'choosing' || choice.clientVersion !== meta.version) return null;

    // 3) If both choices present -> resolve
    const playerIds = [meta.players.p1.uid, meta.players.p2.uid];
    if (playerIds.every(u => choices[u])) {
      await resolveTurn(bid, Number(turn), meta, choices); // implement full pipeline
    }
    return null;
  });

async function resolveTurn(bid: string, turn: number, meta: any, choices: any) {
  // Example: atomic phase flip to prevent other resolvers
  await db.ref(`/battles/${bid}/meta`).transaction(m => {
    if (!m || m.phase !== 'choosing' || m.version !== meta.version) return; // abort
    m.phase = 'resolving';
    return m;
  });

  // Re-read authoritative state (public/private), then compute outcome...
  // const state = await loadBattleState(bid);
  // const result = runResolutionEngine(state, choices);
  // const update = buildMultiPathUpdate(bid, result);

  // Example final write:
  // await db.ref().update(update);
}

10) What you can build next (drop-in modules)
	•	Resolution engine (pure TS): given state + choices → returns diffs, logs, nextState, winner?.
	•	Legality checker: validates a posted choice against current state (server copy).
	•	UI adapter: exposes legal moves/switches for the client (so the UI never shows illegal options).
	•	Replay generator: replays from logs + RNG seed to verify consistency.

If you want, I can hand you:
	1.	a ready-to-paste RTDB rules file,
	2.	a Functions project with the full resolution pipeline stubbed for your Singles/no-weather spec,
	3.	a tiny React hook (useBattle) that binds to /meta, /public, and your /private/{uid} and manages timers + choice posting.