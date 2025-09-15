const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.database();

// Cloud Function: Matchmaking
exports.matchmake = functions.database
  .ref('/lobbies/{region}/queue/{uid}')
  .onWrite(async (change, context) => {
    const { region, uid } = context.params;
    
    // Only process when a new player joins
    if (!change.after.exists()) {
      return null;
    }
    
    console.log(`Player ${uid} joined lobby in region ${region}`);
    
    // Get all players in the queue
    const queueRef = db.ref(`lobbies/${region}/queue`);
    const queueSnapshot = await queueRef.once('value');
    const queue = queueSnapshot.val() || {};
    
    const players = Object.entries(queue);
    
    // Find two compatible players
    if (players.length >= 2) {
      const [p1Uid, p1Data] = players[0];
      const [p2Uid, p2Data] = players[1];
      
      // Create battle
      const battleId = `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Get player data from Firestore (teams, names, etc.)
      const p1Doc = await admin.firestore().collection('users').doc(p1Uid).get();
      const p2Doc = await admin.firestore().collection('users').doc(p2Uid).get();
      
      const p1Data_fs = p1Doc.data();
      const p2Data_fs = p2Doc.data();
      
      // Create battle in RTDB
      await createBattle(battleId, p1Uid, p1Data_fs, p2Uid, p2Data_fs);
      
      // Remove players from queue
      await queueRef.child(p1Uid).remove();
      await queueRef.child(p2Uid).remove();
      
      console.log(`Created battle ${battleId} between ${p1Uid} and ${p2Uid}`);
    }
    
    return null;
  });

// Cloud Function: Choice validation and resolution
exports.onChoiceCreate = functions.database
  .ref('/battles/{bid}/turns/{turn}/choices/{uid}')
  .onCreate(async (snap, context) => {
    const { bid, turn, uid } = context.params;
    const choice = snap.val();
    
    console.log(`Choice received for battle ${bid}, turn ${turn}, player ${uid}:`, choice);
    
    // 1) Read meta & both choices
    const metaRef = db.ref(`/battles/${bid}/meta`);
    const choicesRef = db.ref(`/battles/${bid}/turns/${turn}/choices`);
    
    const [metaSnap, choicesSnap] = await Promise.all([
      metaRef.once('value'),
      choicesRef.once('value')
    ]);
    
    const meta = metaSnap.val();
    const choices = choicesSnap.val() || {};
    
    // 2) Guard rails
    if (meta.phase !== 'choosing' || choice.clientVersion !== meta.version) {
      console.log('Invalid choice - wrong phase or version');
      return null;
    }
    
    // 3) If both choices present -> resolve
    const playerIds = [meta.players.p1.uid, meta.players.p2.uid];
    if (playerIds.every(u => choices[u])) {
      console.log('Both choices received, starting resolution');
      await resolveTurn(bid, Number(turn), meta, choices);
    }
    
    return null;
  });

// Cloud Function: Turn timeout sweep
exports.turnTimeoutSweep = functions.pubsub
  .schedule('every 15 seconds')
  .onRun(async (context) => {
    console.log('Running turn timeout sweep');
    
    const battlesRef = db.ref('battles');
    const battlesSnapshot = await battlesRef.once('value');
    const battles = battlesSnapshot.val() || {};
    
    const now = Date.now();
    
    for (const [battleId, battleData] of Object.entries(battles)) {
      if (battleData.meta && battleData.meta.phase === 'choosing') {
        const deadline = battleData.meta.deadlineAt;
        if (deadline && now > deadline) {
          console.log(`Battle ${battleId} timed out, handling timeout`);
          await handleTurnTimeout(battleId, battleData);
        }
      }
    }
    
    return null;
  });

// Helper function: Create battle
async function createBattle(battleId, p1Uid, p1Data, p2Uid, p2Data) {
  const now = Date.now();
  const deadlineAt = now + (30 * 1000); // 30 seconds per turn
  
  // Create meta
  const metaRef = db.ref(`battles/${battleId}/meta`);
  await metaRef.set({
    createdAt: admin.database.ServerValue.TIMESTAMP,
    format: 'singles',
    ruleSet: 'gen9-no-weather',
    region: 'global',
    players: {
      p1: { uid: p1Uid, name: p1Data.displayName || 'Player 1' },
      p2: { uid: p2Uid, name: p2Data.displayName || 'Player 2' }
    },
    phase: 'choosing',
    turn: 1,
    deadlineAt: admin.database.ServerValue.TIMESTAMP,
    version: 1
  });

  // Create public state (masked info)
  const publicRef = db.ref(`battles/${battleId}/public`);
  await publicRef.set({
    field: {
      hazards: {
        p1: { sr: false, spikes: 0, tSpikes: 0, web: false },
        p2: { sr: false, spikes: 0, tSpikes: 0, web: false }
      },
      screens: {
        p1: { reflect: 0, lightScreen: 0 },
        p2: { reflect: 0, lightScreen: 0 }
      }
    },
    p1: {
      active: createPublicPokemonData(p1Data.team?.[0] || {}),
      benchPublic: (p1Data.team || []).slice(1).map(pokemon => ({
        species: pokemon.pokemon?.name || 'Unknown',
        fainted: false,
        revealedMoves: []
      }))
    },
    p2: {
      active: createPublicPokemonData(p2Data.team?.[0] || {}),
      benchPublic: (p2Data.team || []).slice(1).map(pokemon => ({
        species: pokemon.pokemon?.name || 'Unknown',
        fainted: false,
        revealedMoves: []
      }))
    },
    lastResultSummary: ''
  });

  // Create private state (full team info)
  const p1PrivateRef = db.ref(`battles/${battleId}/private/${p1Uid}`);
  await p1PrivateRef.set({
    team: p1Data.team || [],
    choiceLock: {}
  });

  const p2PrivateRef = db.ref(`battles/${battleId}/private/${p2Uid}`);
  await p2PrivateRef.set({
    team: p2Data.team || [],
    choiceLock: {}
  });
}

// Helper function: Create public Pokemon data
function createPublicPokemonData(pokemon) {
  return {
    species: pokemon.pokemon?.name || 'Unknown',
    level: pokemon.level || 50,
    types: pokemon.pokemon?.types?.map(t => 
      typeof t === 'string' ? t : t.type?.name || 'normal'
    ) || ['normal'],
    hp: { 
      cur: pokemon.currentHp || pokemon.maxHp || 100, 
      max: pokemon.maxHp || 100 
    },
    status: pokemon.status,
    boosts: {
      atk: pokemon.statModifiers?.attack || 0,
      def: pokemon.statModifiers?.defense || 0,
      spa: pokemon.statModifiers?.specialAttack || 0,
      spd: pokemon.statModifiers?.specialDefense || 0,
      spe: pokemon.statModifiers?.speed || 0,
      acc: pokemon.statModifiers?.accuracy || 0,
      eva: pokemon.statModifiers?.evasion || 0
    },
    itemKnown: false,
    abilityKnown: false
  };
}

// Helper function: Resolve turn
async function resolveTurn(bid, turn, meta, choices) {
  console.log(`Resolving turn ${turn} for battle ${bid}`);
  
  // Atomic phase flip to prevent other resolvers
  const metaRef = db.ref(`battles/${bid}/meta`);
  await metaRef.transaction((current) => {
    if (!current || current.phase !== 'choosing' || current.version !== meta.version) {
      return; // Abort
    }
    current.phase = 'resolving';
    return current;
  });

  // Re-read authoritative state
  const [publicSnap, p1PrivateSnap, p2PrivateSnap] = await Promise.all([
    db.ref(`battles/${bid}/public`).once('value'),
    db.ref(`battles/${bid}/private/${meta.players.p1.uid}`).once('value'),
    db.ref(`battles/${bid}/private/${meta.players.p2.uid}`).once('value')
  ]);

  const publicState = publicSnap.val();
  const p1Private = p1PrivateSnap.val();
  const p2Private = p2PrivateSnap.val();

  // Run battle resolution logic here
  // This would integrate with your existing battle engine
  const resolution = await runBattleResolution(publicState, p1Private, p2Private, choices);

  // Write resolution
  const resolutionRef = db.ref(`battles/${bid}/turns/${turn}/resolution`);
  await resolutionRef.set({
    by: 'function',
    committedAt: admin.database.ServerValue.TIMESTAMP,
    rngSeedUsed: resolution.rngSeed,
    diffs: resolution.diffs,
    logs: resolution.logs,
    stateHashAfter: resolution.stateHash
  });

  // Update battle state
  const updates = {};
  updates[`battles/${bid}/public`] = resolution.newPublicState;
  updates[`battles/${bid}/private/${meta.players.p1.uid}`] = resolution.newP1Private;
  updates[`battles/${bid}/private/${meta.players.p2.uid}`] = resolution.newP2Private;
  updates[`battles/${bid}/meta/version`] = meta.version + 1;
  updates[`battles/${bid}/meta/turn`] = turn + 1;
  updates[`battles/${bid}/meta/phase`] = 'choosing';
  updates[`battles/${bid}/meta/deadlineAt`] = admin.database.ServerValue.TIMESTAMP;

  await db.ref().update(updates);

  console.log(`Turn ${turn} resolved for battle ${bid}`);
}

// Helper function: Run battle resolution
async function runBattleResolution(publicState, p1Private, p2Private, choices) {
  // This would integrate with your existing battle engine
  // For now, return a mock resolution
  return {
    rngSeed: Math.floor(Math.random() * 1000000),
    diffs: [],
    logs: ['Battle resolution completed'],
    stateHash: 'mock-hash',
    newPublicState: publicState,
    newP1Private: p1Private,
    newP2Private: p2Private
  };
}

// Helper function: Handle turn timeout
async function handleTurnTimeout(battleId, battleData) {
  const meta = battleData.meta;
  const choicesRef = db.ref(`battles/${battleId}/turns/${meta.turn}/choices`);
  const choicesSnap = await choicesRef.once('value');
  const choices = choicesSnap.val() || {};

  // Auto-forfeit or pick safe default for idle player
  const playerIds = [meta.players.p1.uid, meta.players.p2.uid];
  const missingPlayer = playerIds.find(uid => !choices[uid]);

  if (missingPlayer) {
    // Auto-forfeit the missing player
    const updates = {};
    updates[`battles/${battleId}/meta/phase`] = 'ended';
    updates[`battles/${battleId}/meta/winnerUid`] = playerIds.find(uid => uid !== missingPlayer);
    updates[`battles/${battleId}/meta/endedReason`] = 'timeout';

    await db.ref().update(updates);
    console.log(`Player ${missingPlayer} forfeited due to timeout in battle ${battleId}`);
  }
}

// Cloud Function: Create Battle with Teams (authoritative)
exports.createBattleWithTeams = functions.https.onCall(async (data, context) => {
  const caller = context.auth?.uid;
  if (!caller) {
    throw new functions.https.HttpsError("unauthenticated", "Sign in first.");
  }

  const { roomId, p1Uid, p2Uid } = data || {};
  
  // Get UIDs
  const uidA = p1Uid || caller;
  const uidB = p2Uid;

  if (!uidA || !uidB || uidA === uidB) {
    throw new functions.https.HttpsError("invalid-argument", "Need two distinct players.");
  }
  if (caller !== uidA && caller !== uidB) {
    throw new functions.https.HttpsError("permission-denied", "Caller must be one of the players.");
  }

  // Get team data from Firestore room
  let teamA, teamB;
  if (roomId) {
    try {
      const roomDoc = await admin.firestore().collection('rooms').doc(roomId).get();
      if (!roomDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Room not found.");
      }
      
      const roomData = roomDoc.data();
      teamA = roomData.hostTeam;
      teamB = roomData.guestTeam;
      
      if (!teamA || !teamB) {
        throw new functions.https.HttpsError("failed-precondition", "Both players must have selected teams.");
      }
    } catch (error) {
      console.error('Error fetching room data:', error);
      throw new functions.https.HttpsError("internal", "Failed to fetch room data.");
    }
  } else {
    // Fallback to direct team data (for backwards compatibility)
    const { p1Team, p2Team } = data || {};
    teamA = p1Team;
    teamB = p2Team;
  }

  // Validate teams
  if (!teamA || !teamA.slots || !Array.isArray(teamA.slots) || teamA.slots.length < 1 || teamA.slots.length > 6) {
    throw new functions.https.HttpsError("invalid-argument", "Team A must have 1–6 Pokémon.");
  }
  if (!teamB || !teamB.slots || !Array.isArray(teamB.slots) || teamB.slots.length < 1 || teamB.slots.length > 6) {
    throw new functions.https.HttpsError("invalid-argument", "Team B must have 1–6 Pokémon.");
  }

  // Helper function to convert team slot to battle Pokemon
  async function convertTeamSlot(slot) {
    if (!slot.id) {
      throw new functions.https.HttpsError("invalid-argument", "Invalid Pokemon slot: missing ID");
    }
    
    try {
      // Fetch Pokemon data from PokeAPI
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${slot.id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch Pokemon ${slot.id}`);
      }
      const pokemonData = await response.json();
      
      // Convert moves
      const moves = (slot.moves || []).map(move => ({
        id: move.name || move.id || 'tackle',
        pp: move.pp || 35
      }));
      
      return {
        species: pokemonData.name,
        level: slot.level || 50,
        types: pokemonData.types.map(t => t.type.name),
        stats: {
          hp: pokemonData.stats.find(s => s.stat.name === 'hp')?.base_stat || 50,
          atk: pokemonData.stats.find(s => s.stat.name === 'attack')?.base_stat || 50,
          def: pokemonData.stats.find(s => s.stat.name === 'defense')?.base_stat || 50,
          spa: pokemonData.stats.find(s => s.stat.name === 'special-attack')?.base_stat || 50,
          spd: pokemonData.stats.find(s => s.stat.name === 'special-defense')?.base_stat || 50,
          spe: pokemonData.stats.find(s => s.stat.name === 'speed')?.base_stat || 50
        },
        item: null, // Could be added later
        ability: pokemonData.abilities.find(a => !a.is_hidden)?.ability?.name || null,
        moves: moves
      };
    } catch (error) {
      console.error(`Error converting Pokemon ${slot.id}:`, error);
      // Fallback to basic data
      return {
        species: `pokemon-${slot.id}`,
        level: slot.level || 50,
        types: ['Normal'],
        stats: {
          hp: 50,
          atk: 50,
          def: 50,
          spa: 50,
          spd: 50,
          spe: 50
        },
        item: null,
        ability: null,
        moves: (slot.moves || []).map(move => ({
          id: move.name || move.id || 'tackle',
          pp: move.pp || 35
        }))
      };
    }
  }

  // Convert both teams
  const convertedTeamA = await Promise.all(teamA.slots.map(convertTeamSlot));
  const convertedTeamB = await Promise.all(teamB.slots.map(convertTeamSlot));

  // Basic presence check (optional)
  const [aExists, bExists] = await Promise.all([
    db.ref(`/users/${uidA}`).get(),
    db.ref(`/users/${uidB}`).get(),
  ]);
  if (!aExists.exists() || !bExists.exists()) {
    throw new functions.https.HttpsError("failed-precondition", "Both users must exist.");
  }

  // Create battle
  const battleRef = db.ref("/battles").push();
  const battleId = battleRef.key;
  const now = admin.database.ServerValue.TIMESTAMP;

  // Helper function to mask public view
  function maskPublicView(pokemon) {
    return {
      species: pokemon.species,
      level: pokemon.level,
      types: pokemon.types,
      hp: { cur: pokemon.stats.hp, max: pokemon.stats.hp }, // full at start
      status: null,
      boosts: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 },
    };
  }

  // Public masked state (only revealed info)
  const p1PublicActive = maskPublicView(convertedTeamA[0]);
  const p2PublicActive = maskPublicView(convertedTeamB[0]);

  // Build initial structure
  const meta = {
    createdAt: now,
    format: "singles",
    ruleSet: "gen9-no-weather",
    players: { p1: { uid: uidA }, p2: { uid: uidB } },
    phase: "choosing",
    turn: 1,
    version: 1,
    deadlineAt: admin.database.ServerValue.TIMESTAMP,
    winnerUid: null,
    endedReason: null
  };

  const publicState = {
    field: {
      hazards: { 
        [uidA]: { sr: false, spikes: 0, tSpikes: 0, web: false },
        [uidB]: { sr: false, spikes: 0, tSpikes: 0, web: false } 
      },
      screens: { 
        [uidA]: { reflect: 0, lightScreen: 0 },
        [uidB]: { reflect: 0, lightScreen: 0 } 
      }
    },
    [uidA]: { 
      active: p1PublicActive, 
      benchPublic: convertedTeamA.slice(1).map(m => ({ 
        species: m.species, 
        fainted: false, 
        revealedMoves: [] 
      })) 
    },
    [uidB]: { 
      active: p2PublicActive, 
      benchPublic: convertedTeamB.slice(1).map(m => ({ 
        species: m.species, 
        fainted: false, 
        revealedMoves: [] 
      })) 
    },
    lastResultSummary: "Battle started."
  };

  const privateState = {
    [uidA]: {
      team: convertedTeamA, // full secrets with PP/items/abilities
      choiceLock: {}
    },
    [uidB]: {
      team: convertedTeamB,
      choiceLock: {}
    }
  };

  const initialTurn = {
    choices: {}, // players will write their choices here
    resolution: null
  };

  // Multi-location atomic write
  const updates = {};
  updates[`/battles/${battleId}/meta`] = meta;
  updates[`/battles/${battleId}/public`] = publicState;
  updates[`/battles/${battleId}/private/${uidA}`] = privateState[uidA];
  updates[`/battles/${battleId}/private/${uidB}`] = privateState[uidB];
  updates[`/battles/${battleId}/turns/1`] = initialTurn;

  await db.ref().update(updates);

  console.log(`Created battle ${battleId} between ${uidA} and ${uidB}`);

  return { battleId };
});

// Helper function to apply volatile effects and update public/private state
function applyVolatileEffects(publicState, privateState, moveId, targetUid) {
  const updates = {};
  
  // Example volatile applications (you'd expand this based on move effects)
  switch (moveId) {
    case 'taunt':
      // Public volatile: everyone can see taunt status
      updates[`/battles/${battleId}/public/${targetUid}/active/volatiles/taunt`] = { turnsLeft: 3 };
      break;
      
    case 'encore':
      // Public volatile: everyone can see encore status
      updates[`/battles/${battleId}/public/${targetUid}/active/volatiles/encore`] = { turnsLeft: 3 };
      // Private volatile: only target knows which move is encored
      updates[`/battles/${battleId}/private/${targetUid}/encoreMoveId`] = moveId;
      break;
      
    case 'hyper-beam':
    case 'giga-impact':
      // Public volatile: everyone can see recharge status
      updates[`/battles/${battleId}/public/${targetUid}/active/volatiles/recharge`] = true;
      break;
      
    case 'protect':
      // Public volatile: everyone can see protect was used
      updates[`/battles/${battleId}/public/${targetUid}/active/volatiles/protectUsedLastTurn`] = true;
      break;
      
    case 'substitute':
      // Public volatile: everyone can see substitute HP
      updates[`/battles/${battleId}/public/${targetUid}/active/volatiles/subHp`] = 25; // 25% of max HP
      break;
      
    case 'disable':
      // Private volatile: only target knows which move is disabled
      updates[`/battles/${battleId}/private/${targetUid}/disable`] = { 
        moveId: moveId, 
        turnsLeft: 4 
      };
      break;
      
    case 'choice-band':
    case 'choice-specs':
    case 'choice-scarf':
      // Private volatile: only user knows about choice lock
      updates[`/battles/${battleId}/private/${targetUid}/choiceLock`] = { 
        moveId: moveId, 
        locked: true 
      };
      break;
  }
  
  return updates;
}

// Helper function to decrement PP in private state
function decrementPP(privateState, moveId) {
  const team = privateState.team || [];
  for (const pokemon of team) {
    for (const move of pokemon.moves || []) {
      if (move.id === moveId && move.pp > 0) {
        move.pp--;
        break;
      }
    }
  }
  return privateState;
}

// Helper function to process turn resolution
async function processTurnResolution(battleId, turn, choices) {
  const updates = {};
  
  // Get current battle state
  const [metaSnap, publicSnap, p1PrivateSnap, p2PrivateSnap] = await Promise.all([
    db.ref(`/battles/${battleId}/meta`).get(),
    db.ref(`/battles/${battleId}/public`).get(),
    db.ref(`/battles/${battleId}/private/${metaSnap.val().players.p1.uid}`).get(),
    db.ref(`/battles/${battleId}/private/${metaSnap.val().players.p2.uid}`).get()
  ]);
  
  const meta = metaSnap.val();
  const publicState = publicSnap.val();
  const p1Private = p1PrivateSnap.val();
  const p2Private = p2PrivateSnap.val();
  
  // Process each choice
  for (const [uid, choice] of Object.entries(choices)) {
    if (choice.action === 'move') {
      const moveId = choice.payload.moveId;
      
      // Decrement PP in private state
      const privateState = uid === meta.players.p1.uid ? p1Private : p2Private;
      const updatedPrivate = decrementPP(privateState, moveId);
      updates[`/battles/${battleId}/private/${uid}`] = updatedPrivate;
      
      // Apply volatile effects
      const volatileUpdates = applyVolatileEffects(publicState, privateState, moveId, uid);
      Object.assign(updates, volatileUpdates);
    }
  }
  
  // Update turn and phase
  updates[`/battles/${battleId}/meta/turn`] = turn + 1;
  updates[`/battles/${battleId}/meta/phase`] = 'choosing';
  updates[`/battles/${battleId}/meta/version`] = meta.version + 1;
  updates[`/battles/${battleId}/meta/deadlineAt`] = admin.database.ServerValue.TIMESTAMP;
  
  // Write all updates atomically
  await db.ref().update(updates);
  
  console.log(`Turn ${turn} resolved for battle ${battleId}`);
}

// Database trigger: Process turn resolution when both players have chosen
exports.processTurnResolution = functions.database
  .ref('/battles/{battleId}/turns/{turn}/choices')
  .onWrite(async (change, context) => {
    const { battleId, turn } = context.params;
    
    // Only process when choices are written (not deleted)
    if (!change.after.exists()) return null;
    
    const choices = change.after.val();
    if (!choices) return null;
    
    // Get battle meta to check if both players have chosen
    const metaSnap = await db.ref(`/battles/${battleId}/meta`).get();
    const meta = metaSnap.val();
    
    if (!meta) return null;
    
    const p1Uid = meta.players.p1.uid;
    const p2Uid = meta.players.p2.uid;
    
    // Check if both players have made choices
    if (!choices[p1Uid] || !choices[p2Uid]) {
      console.log(`Waiting for both players to choose in battle ${battleId}, turn ${turn}`);
      return null;
    }
    
    console.log(`Both players have chosen in battle ${battleId}, turn ${turn}. Processing resolution...`);
    
    // Process the turn resolution
    await processTurnResolution(battleId, parseInt(turn), choices);
    
    return null;
  });
