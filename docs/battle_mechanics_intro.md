Real-Time Battle System Architecture

To achieve real-time, turn-based battles, we’ll use a combination of Firestore for data sync and Firebase Cloud Functions for server-side logic. Below is an overview of the architecture and data flow:

Firestore Game State: We create a Firestore document (e.g. in a battles collection) for each battle. This document holds the authoritative game state: which players are involved, each player’s current Pokémon stats (HP, status, etc.), the moves chosen for the current turn, turn counter or phase, and any other needed info (like a log of actions or battle outcome). Both players’ clients will listen to this document in real-time. Firestore’s snapshot listener will instantly notify clients of changes, ensuring both see the battle progress in sync.

Next.js Client: Each player runs the Next.js front-end (likely a page like /battle/[id].jsx for a given match). The client uses the Firebase SDK to:

Subscribe to the battle document: On component mount, attach an onSnapshot listener to the battle doc. This way, whenever the server updates the state, both clients receive the new state immediately and can render updates (HP changes, messages like “It’s super effective!”, etc.)
medium.com
reddit.com
.

Send player actions: When it’s time to choose a move, the UI will let each player pick one of their Pokémon’s moves. On selection, the client will write an update to Firestore (e.g. setting their move field in the battle doc). We ensure each player can update only their own move choice. This can be done by using Firestore security rules or by structuring the data so that one player cannot overwrite the other’s data.

The clients do not resolve the turn locally (to prevent desync or cheating); they merely send their choice and wait for the server’s resolution.

Cloud Functions (Server logic): A secure, server-side component will monitor the game state and perform the core battle logic. We will write a Cloud Function triggered whenever a battle document is updated (specifically, when moves are added). The sequence is:

Cloud Function wakes when Firestore reports a change to a battle document (an onUpdate trigger on /battles/{battleId}).

It checks if both players have submitted a move for the turn (e.g. fields player1Move and player2Move are now set) and that those moves haven’t been processed yet.

The function then retrieves the necessary data (the players’ Pokémon stats, the moves chosen, etc.) and computes the outcome of the turn. This includes determining move order (compare Pokémon speeds and move priorities, just like the Pokémon engine), calculating damage, applying status effects, checking for KOs, etc.

The function writes the resolution results back to the Firestore document. For example, it updates HP values of the Pokémon, notes any Pokémon that fainted, and could add a summary of what happened (e.g. “Charizard used Flamethrower dealing 70 damage!”) to a log or lastAction field. It also might reset the move choice fields or set a flag indicating the turn is resolved.

If the battle is over (one player’s team is defeated), the function can update a winner field or mark the battle as completed.

By using Cloud Functions in this way, the authoritative game logic runs on the server side, ensuring fairness and consistency (neither client can tamper with outcomes). This pattern — client writes intent to DB, Cloud Function processes and updates DB — is a common serverless game loop approach
medium.com
. Clients will automatically get the updated state via the Firestore listener, triggering the next phase of the UI.

Real-Time Sync: Because both clients are listening to the battle document, any update from the server (or either player) propagates instantly. For example, once the Cloud Function writes the turn results, both players’ apps get the new HP and status values and can display the outcome nearly in real-time. Likewise, if we want to show a “Both players have locked in their moves!” message, we could have the UI detect when both move fields are non-empty (or a phase field flips to “resolving”). The latency is low — typically on the order of a few hundred milliseconds or less — and Firestore handles the heavy lifting of synchronization.

Data Security & Move Hiding: In a true Pokémon battle, each player’s move choice is hidden from the opponent until the turn resolves. To mimic this, we should prevent players from seeing the other’s move field before resolution. There are a couple of ways to do this within Firestore’s free tier setup:

Security rules approach: Structure the battle document so that each player’s move is only readable by that player (and by the server). For example, you might nest moves under each player’s UID and write Firestore security rules to allow only the corresponding user to read that field. The Cloud Function, running with admin privileges, can read both moves to process the turn, then write the outcome for both to see.

Alternate structure: Another approach is using separate sub-collections or docs for pending moves (one for each player) that only that player can read/write. The Cloud Function can listen to these or fetch them, then write the combined result to the main battle doc. However, this adds complexity. For simplicity, you could also accept that both moves might be visible but not act on that information in the client. The most important part is that the outcome cannot be influenced by a cheating client, which is ensured by doing calculations in the trusted Cloud Function.

Given our focus on the free tier and simplicity, we will primarily use a single Firestore document for the battle state and rely on security rules (or just mindful client code) to handle move privacy. Now, let’s break down the implementation steps clearly.

Implementation Steps

Data Model Design (Firestore): Define a clear schema for the battle document in Firestore. For example, a document in battles collection with an ID for the match (you can use matchId or Firestore-generated ID). The document could have structure like:

battles/{battleId} {
    player1Id: "UID_of_player1",
    player2Id: "UID_of_player2",
    player1Pokemon: { name: "Pikachu", hp: 35, speed: 90, ... },  // current Pokémon stats
    player2Pokemon: { name: "Charmander", hp: 39, speed: 65, ... },
    player1Move: null,    // will hold the move choice (e.g. "Thunderbolt") for current turn
    player2Move: null,
    turn: 1,
    phase: "selection",   // could be "selection", "resolution", or "finished"
    log: [] ,             // array of text events for battle narration (optional)
    winner: null          // set to player1Id or player2Id when battle ends
}


You can adjust fields as needed (perhaps include each Pokémon’s full stats or an index of which Pokémon is active if using teams). Keep the document concise to minimize read/write payload. Note: If you need static data like move power or type effectiveness, those can be stored in a separate collection or in Cloud Function code, to avoid bloating the battle doc.

Initialize Firebase in Next.js: Add Firebase to your Next.js project if not already (since you mentioned auth is set up, you likely have done this). This means including the Firebase SDK config, and initializing Firestore. Ensure this is done in a way that doesn’t run multiple times (you might use a singleton pattern or check apps.length). In the battle page/component, import Firestore and Auth as needed.

Firestore Security Rules (Optional but Recommended): Write rules to secure the battles collection. For example, allow read/write access only to the two users involved in a battle doc. You might structure it so that only player1Id and player2Id can read/write that document. Also, if hiding moves, a rule could allow a player to write their move but not read the opponent’s move until phase changes (though rules can’t easily do conditional field-level reads). At minimum, restrict access so random users can’t read/write others’ battle data. Since we’re staying in free tier, we won’t use any paid services for security – just the standard Firestore rules.

Real-time Listeners on the Client: In your Next.js battle component, set up a listener on the battle document:

Use onSnapshot(docRef, callback) from Firestore. The callback will be passed a document snapshot whenever the data changes. In the callback, update your React state with the latest game state. For example, you might store player1Pokemon.hp, player2Pokemon.hp, etc. in state to render health bars, and a list of log messages to display actions. This live subscription ensures the UI is always up-to-date with the server state in real time
medium.com
.

When the snapshot updates, check the phase or relevant fields. If phase becomes "resolution", you know the turn outcome was just processed – you can display animations or text for the moves. If winner becomes non-null, the battle ended, so you can show the victory/defeat message.

The listener will also let you detect when both players have submitted moves. For instance, you could have the UI show “Waiting for opponent...” when only one move is in, and then remove that once both are ready and the resolution is happening.

Move Selection and Submission: Implement the UI for move selection (e.g. a list of moves/buttons for the current Pokémon). When the player picks a move:

Call a Firestore update on the battle document to set that player’s move field. For example:

await updateDoc(battleRef, { player1Move: "Thunderbolt" });


(Use the correct field depending on which player; you’ll know from the context whether the user is player1 or player2). This write will trigger the Firestore onUpdate event for our Cloud Function (if it’s the second move) or simply update the doc (if it’s the first move).

After submitting, the UI should indicate the move is locked in. The player should not be allowed to select again until next turn. Optionally, you can write something like player1MoveConfirmed: true to the doc as well, but it’s not strictly necessary – the presence of player1Move itself can imply it.

Efficiency note: This approach uses one write per player per turn to submit moves. That’s 2 writes per turn. On the free tier, 20,000 writes per day are free, which would cover 10,000 turns (since each turn has two move writes, ignoring resolution write). This is more than enough for a hobby project. If you needed to further reduce writes, you could have the clients call a Cloud Function to submit moves in one go, but that adds complexity and is usually not needed.

Cloud Function: Turn Resolution Logic: Set up a Firebase Cloud Function to handle the battle calculations. This will likely be a function triggered on Firestore writes to the battles/{battleId} document. Pseudocode for the function logic:

exports.resolveTurn = functions.firestore
    .document("battles/{battleId}")
    .onUpdate((change, context) => {
        const before = change.before.data();
        const after = change.after.data();
        // If moves are set in 'after' state and were null in 'before' (meaning they were just added)
        if (!before.player1Move && !before.player2Move && after.player1Move && after.player2Move) {
            // Both moves have now been submitted
            let p1Move = after.player1Move;
            let p2Move = after.player2Move;
            // Retrieve relevant stats
            let p1Speed = after.player1Pokemon.speed;
            let p2Speed = after.player2Pokemon.speed;
            // Determine move order (simplified: higher speed first, tie-breaker by coin flip or any rule)
            let first = (p1Speed > p2Speed) ? 'player1' : 
                        (p2Speed > p1Speed) ? 'player2' : 
                        (Math.random() < 0.5 ? 'player1' : 'player2');
            // Compute damage or effect of first move
            // (You would have a move database or logic to get power, type, etc. For example:)
            let damage = computeDamage(first === 'player1' ? p1Move : p2Move, ...stats...);
            // Subtract HP from the target
            if (first === 'player1') {
                after.player2Pokemon.hp = Math.max(0, after.player2Pokemon.hp - damage);
            } else {
                after.player1Pokemon.hp = Math.max(0, after.player1Pokemon.hp - damage);
            }
            // If target fainted and battle ends, set winner
            let winner = null;
            if (after.player1Pokemon.hp <= 0) winner = after.player2Id;
            if (after.player2Pokemon.hp <= 0) winner = after.player1Id;
            // If target survived, execute the second move (if battle not ended by first move)
            if (!winner) {
                // compute damage for second move...
                // subtract HP from the other Pokémon
                // check again for faint
                if (after.player1Pokemon.hp <= 0) winner = after.player2Id;
                if (after.player2Pokemon.hp <= 0) winner = after.player1Id;
            }
            // Prepare log message of what happened (optional)
            let logEntry = generateDescription(p1Move, p2Move, first, damage, after);
            after.log = [...(after.log || []), logEntry];
            // Set phase to "resolution" (or directly to "selection" for next turn if we immediately loop)
            after.phase = winner ? "finished" : "resolution";
            after.winner = winner || null;
            // Clear moves for next turn
            after.player1Move = null;
            after.player2Move = null;
            if (!winner) {
                after.turn = (after.turn || 1) + 1;
                // You could also set phase back to "selection" after a short delay, etc.
            }
            // Finally, write the updated state back to Firestore
            return change.after.ref.set(after, { merge: true });
        }
        return null;
    });


This is a rough outline – in practice you’ll implement proper damage calculation (considering move power, attack vs defense stats, type effectiveness, critical hits, etc., depending on how closely you mirror Pokémon mechanics). The key is that the function verifies both moves are present and then performs all updates in one atomic step. We check that before the update, moves were not set and after update they are, to ensure we only run logic once per turn. The function then writes back the computed state (HP changes, etc.). Using change.after.ref.set(..., {merge: true}) updates the document. This single write contains all the outcome changes, which will trigger the listeners on both clients exactly once with the new state (efficient and consistent). The Cloud Function approach keeps logic off the client, preventing cheating and desynchronization
medium.com
.

Free tier considerations: Cloud Functions have a free invocation quota (125k/month) which is plenty for this usage. Each battle turn triggers one function invocation. The function execution time for a simple damage calculation will be only a few milliseconds, well under free tier limits. Just be careful to avoid infinite loops (don’t have the function write changes that retrigger itself continuously — our check on moves ensures it stops after one resolution per turn). Also, bundling all outcome changes in one write (as above) means you’re using 1 write per turn resolution, keeping usage low.

Client Reaction to Resolution: When the Cloud Function updates the Firestore doc with the turn results, the clients’ snapshot listener will fire with the latest state. The client should handle this update by:

Displaying the outcome of the moves: e.g., show damage animations or update HP bars. You can use the logged text or the difference in HP to inform the UI. If you included a log or lastAction field, show those messages (“Pikachu used Thunderbolt… it’s super effective!”).

If phase was set to "resolution", you might briefly show a “Resolution in progress” state (or you can combine resolution and selection seamlessly by immediately going to next turn).

Clear any local selection UI (since the turn ended, moves have been executed).

If winner is set (battle over), declare the winner and perhaps disable further input. If not, transition the UI to the next turn: increment turn counter display, allow the players to choose moves again (once phase goes back to “selection” or simply on next render where player1Move and player2Move are null again).

You may also incorporate a small delay/timer before the next turn begins, for a better user experience (to give time to read what happened). This can be done purely on the client side (e.g., wait 2 seconds then set some state to enable move buttons).

Staying Within Free Tier Limits: The above design is mindful of free-tier quotas:

Minimize reads: Both clients only listen to a single document (their battle). Each turn causes a few document updates, so the number of read events per client is low. Even if a battle had, say, 50 turns, and each turn generates 3 updates (two moves, one result), that’s 150 document change events. For two clients, 300 reads total. Firestore’s free tier (50k/day) easily covers many battles of this size daily. To further optimize, you might not even need to send an update when a single player picks a move (you could locally note “ready” and only write both at once, but that complicates sync). It’s usually fine to update on each move for user feedback (“Player has chosen a move” indicator).

Minimize writes: We use at most 3 writes per turn (two moves and one outcome). In many cases, it’s actually 2 writes if one player’s move is the final piece that triggers the resolution (their move write + the function’s write, since the first move by itself doesn’t necessarily need to trigger an immediate write back). Regardless, even 3 writes/turn is fine. With 20k free writes/day, that could handle thousands of turns. If needed, you could optimize away one of those writes by having the Cloud Function also clear the moves for next turn in the same resolution write (as shown above), so you don’t need extra writes to reset state.

Data size: Keep the battle document lean (only store what's necessary). This keeps bandwidth low (Firestore free tier includes 10GiB/month of data transfer). A couple of small documents updating will likely never approach that. Avoid storing large blobs or too many nested objects. For example, if you have full Pokémon base stats or move definitions, store them once (maybe in a static JSON or separate collection) rather than copying into every battle doc.

Concurrent connections: Firebase free tier allows up to 100 simultaneous connections to the database. Each listening client is one connection. Unless you anticipate more than 100 players online at once, you’re within limits. If needed, upgrading to Blaze (pay-as-you-go) would be next, but for early development 100 concurrent users is usually enough.

By carefully controlling the frequency of updates and the amount of data in each update, this system will run comfortably within the free tier of Firebase.

Testing the System

Once implemented, test the battle system with two users (you can open two browser windows, or have a test account). Ensure that:

Both clients see updates in real time (move selections, HP changes).

The turn resolution happens correctly according to Pokémon rules (test scenarios like one Pokémon being faster, tie speeds, one-hit KOs, simultaneous KO, etc.).

No obvious race conditions: e.g., what if both players select at almost exactly the same time? (Firestore will handle it – one write will arrive first, then the other, triggering the Cloud Function once when it sees both moves set).

Try to break the system: what if a player disconnects mid-battle? You might use presence detection (not trivial on Firestore, easier on Realtime DB) or simply declare if a player is offline for too long they forfeit. This could be an enhancement outside the core battle logic.

Confirm that the free-tier usage in the Firebase console stays low (you can simulate many turns and see the read/write counts).

With a working implementation and tests passing, you’ll have a solid foundation to expand (add more Pokémon moves, support switching Pokémon, etc.). The approach scales: more battles just mean more documents, and you can use Firebase’s capabilities (sharding, etc.) if you ever needed to handle very large loads.

Optimized Prompt for Codex

Finally, as requested, here is an optimized prompt you can use with OpenAI Codex to generate the code. This prompt concisely summarizes the requirements and architecture for Codex:

**Task**: Build a Next.js application component for a real-time Pokémon-style battle system using Firebase (free tier).

**Requirements/Features**:
- Use **Firebase Firestore** as the backend to store game state and sync it in real-time to two players.
- The game is **turn-based** between two players. Both players choose a move simultaneously each turn, then a **resolution phase** computes the outcome based on move order (speed stats) and applies effects (damage, etc.), similar to Pokémon battles.
- The **state** of the battle (players’ Pokémon, HP, chosen moves, turn number, etc.) should be stored in a Firestore document. Use one document per battle for simplicity.
- Implement real-time updates: clients should listen to the battle document and update the UI instantly when changes occur (Firestore onSnapshot listeners).
- Each player can send their move choice to the server by updating the Firestore doc (e.g., setting `player1Move` or `player2Move` fields).
- Use **Firebase Cloud Functions** to handle the turn resolution logic on the server side:
  - Trigger a Cloud Function (`onUpdate` on the battle doc) when both `player1Move` and `player2Move` are set.
  - In the function, determine which move goes first (compare speed or use priority rules), calculate damage, update HP values, and determine if any Pokémon faint.
  - Write the results back to the Firestore document (e.g., update HP fields, set a `log` message or `lastAction` describing what happened, clear the move fields for the next turn, increment turn counter, and if someone won, set a `winner` field).
- Ensure the system prevents cheating: the server (Cloud Function) is the source of truth for HP deduction and win condition.
- On the client side, create a React component (Next.js page) that:
  - Subscribes to the battle document with `onSnapshot` and keeps local state in sync with the Firestore data.
  - Renders the battle state (players’ Pokémon and HP, etc., plus any battle log messages).
  - Provides UI for the player to select a move (e.g., buttons for moves) when `playerMove` is null (i.e., waiting for input).
  - After the player selects a move, disable input until resolution. Possibly show “Waiting for opponent...” if the other player hasn’t chosen yet.
  - When the state update indicates the turn resolved (e.g., HP changed or `log` updated), display the outcome (e.g., update health bars, show attack messages).
  - If a `winner` is set in the state, declare the result and end the battle (no further moves).
- Use Firebase’s free-tier friendly practices:
  - Initialize the Firebase app and Firestore only once.
  - Keep reads/writes low (subscribe only to the needed document, batch updates in the Cloud Function).
  - (No need to implement user authentication logic in this prompt, assume players are already authenticated and we know their UIDs to identify them in the battle.)

**Output**: Provide the Next.js front-end code (React component/page) and a sample Cloud Function code (in Node.js) needed to realize this system. Include relevant Firebase initialization and comments explaining key sections of the code.


Copy and paste the above prompt into the Codex environment. It’s crafted to cover the essential details and should guide Codex to produce a working implementation. Make sure to review and test the generated code, as some adjustments might be needed for things like your specific project configuration or to fine-tune the Pokémon mechanics. Good luck with your Pokémon battle system!
reddit.com
medium.com