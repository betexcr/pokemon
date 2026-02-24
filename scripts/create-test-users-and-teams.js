#!/usr/bin/env node
/**
 * Script to create test users and teams for E2E testing
 * Run with: node scripts/create-test-users-and-teams.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!serviceAccountKey) {
  console.error('❌ FIREBASE_SERVICE_ACCOUNT_KEY environment variable not set');
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(serviceAccountKey);
} catch (err) {
  console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', err.message);
  process.exit(1);
}

const dbUrl = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
if (!dbUrl) {
  console.error('❌ NEXT_PUBLIC_FIREBASE_DATABASE_URL environment variable not set');
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: dbUrl,
  });
}

const auth = admin.auth();
const db = admin.firestore();

const testUsers = [
  {
    email: 'test-player-1@pokemon.local',
    password: 'TestPlayer123!',
    displayName: 'Player One',
    teamName: 'Thunder Squad'
  },
  {
    email: 'test-player-2@pokemon.local',
    password: 'TestPlayer456!',
    displayName: 'Player Two',
    teamName: 'Water Warriors'
  }
];

const team1Pokemon = [
  { id: 25, level: 50, nature: 'Timid', isShiny: false },   // Pikachu
  { id: 94, level: 50, nature: 'Calm', isShiny: false },    // Gengar
  { id: 149, level: 50, nature: 'Adamant', isShiny: false }, // Dragonite
  { id: 6, level: 50, nature: 'Modest', isShiny: false },   // Charizard
  { id: 248, level: 50, nature: 'Careful', isShiny: false }, // Tyranitar
  { id: 384, level: 50, nature: 'Brave', isShiny: false }   // Rayquaza
];

const team2Pokemon = [
  { id: 9, level: 50, nature: 'Quiet', isShiny: false },    // Blastoise
  { id: 130, level: 50, nature: 'Timid', isShiny: false },  // Gyarados
  { id: 119, level: 50, nature: 'Calm', isShiny: false },   // Seaking
  { id: 131, level: 50, nature: 'Bold', isShiny: false },   // Lapras
  { id: 54, level: 50, nature: 'Modest', isShiny: false },  // Psyduck
  { id: 87, level: 50, nature: 'Quiet', isShiny: false }    // Dewgong
];

const moveData = {
  // Electric moves
  thunderbolt: {
    name: 'thunderbolt',
    type: 'electric',
    damage_class: 'special',
    power: 90,
    accuracy: 100,
    pp: 15,
    level_learned_at: null,
    short_effect: 'Has a 10% chance to paralyze the target.'
  },
  quick_attack: {
    name: 'quick-attack',
    type: 'normal',
    damage_class: 'physical',
    power: 40,
    accuracy: 100,
    pp: 30,
    level_learned_at: null,
    short_effect: 'Inflicts regular damage with no additional effect.'
  },
  thunder_wave: {
    name: 'thunder-wave',
    type: 'electric',
    damage_class: 'status',
    power: null,
    accuracy: 90,
    pp: 20,
    level_learned_at: null,
    short_effect: 'Paralyzes the target.'
  },
  iron_tail: {
    name: 'iron-tail',
    type: 'steel',
    damage_class: 'physical',
    power: 100,
    accuracy: 75,
    pp: 15,
    level_learned_at: null,
    short_effect: 'Has a 30% chance to lower the target\'s Defense by one stage.'
  },
  // Ghost/Psychic moves
  shadow_ball: {
    name: 'shadow-ball',
    type: 'ghost',
    damage_class: 'special',
    power: 80,
    accuracy: 100,
    pp: 15,
    level_learned_at: null,
    short_effect: 'Has a 20% chance to lower the target\'s Special Defense by one stage.'
  },
  psychic: {
    name: 'psychic',
    type: 'psychic',
    damage_class: 'special',
    power: 90,
    accuracy: 100,
    pp: 10,
    level_learned_at: null,
    short_effect: 'Has a 10% chance to lower the target\'s Special Defense by one stage.'
  },
  focus_blast: {
    name: 'focus-blast',
    type: 'fighting',
    damage_class: 'special',
    power: 120,
    accuracy: 70,
    pp: 5,
    level_learned_at: null,
    short_effect: 'Has a 10% chance to lower the target\'s Special Defense by one stage.'
  },
  sludge_bomb: {
    name: 'sludge-bomb',
    type: 'poison',
    damage_class: 'special',
    power: 90,
    accuracy: 100,
    pp: 10,
    level_learned_at: null,
    short_effect: 'Has a 30% chance to poison the target.'
  },
  // Dragon moves
  dragon_claw: {
    name: 'dragon-claw',
    type: 'dragon',
    damage_class: 'physical',
    power: 80,
    accuracy: 100,
    pp: 15,
    level_learned_at: null,
    short_effect: 'Inflicts regular damage with no additional effect.'
  },
  outrage: {
    name: 'outrage',
    type: 'dragon',
    damage_class: 'physical',
    power: 120,
    accuracy: 100,
    pp: 10,
    level_learned_at: null,
    short_effect: 'User becomes confused after using this move.'
  },
  earthquake: {
    name: 'earthquake',
    type: 'ground',
    damage_class: 'physical',
    power: 100,
    accuracy: 100,
    pp: 10,
    level_learned_at: null,
    short_effect: 'Inflicts regular damage with no additional effect.'
  },
  // Fire/Flying moves
  flamethrower: {
    name: 'flamethrower',
    type: 'fire',
    damage_class: 'special',
    power: 90,
    accuracy: 100,
    pp: 15,
    level_learned_at: null,
    short_effect: 'Has a 10% chance to burn the target.'
  },
  air_slash: {
    name: 'air-slash',
    type: 'flying',
    damage_class: 'special',
    power: 75,
    accuracy: 95,
    pp: 15,
    level_learned_at: null,
    short_effect: 'Has a 30% chance to make the target flinch.'
  },
  fire_blast: {
    name: 'fire-blast',
    type: 'fire',
    damage_class: 'special',
    power: 110,
    accuracy: 85,
    pp: 5,
    level_learned_at: null,
    short_effect: 'Has a 10% chance to burn the target.'
  },
  roost: {
    name: 'roost',
    type: 'flying',
    damage_class: 'status',
    power: null,
    accuracy: null,
    pp: 10,
    level_learned_at: null,
    short_effect: 'User recovers half its maximum HP.'
  },
  // Rock/Dark moves
  stone_edge: {
    name: 'stone-edge',
    type: 'rock',
    damage_class: 'physical',
    power: 100,
    accuracy: 80,
    pp: 5,
    level_learned_at: null,
    short_effect: 'Has a high critical-hit ratio.'
  },
  crunch: {
    name: 'crunch',
    type: 'dark',
    damage_class: 'physical',
    power: 80,
    accuracy: 100,
    pp: 15,
    level_learned_at: null,
    short_effect: 'Has a 20% chance to lower the target\'s Defense by one stage.'
  },
  pursuit: {
    name: 'pursuit',
    type: 'dark',
    damage_class: 'physical',
    power: 40,
    accuracy: 100,
    pp: 20,
    level_learned_at: null,
    short_effect: 'Inflicts regular damage with no additional effect.'
  },
  // Water moves
  surf: {
    name: 'surf',
    type: 'water',
    damage_class: 'special',
    power: 90,
    accuracy: 100,
    pp: 15,
    level_learned_at: null,
    short_effect: 'Inflicts regular damage with no additional effect.'
  },
  ice_beam: {
    name: 'ice-beam',
    type: 'ice',
    damage_class: 'special',
    power: 90,
    accuracy: 100,
    pp: 10,
    level_learned_at: null,
    short_effect: 'Has a 10% chance to freeze the target.'
  },
  waterfall: {
    name: 'waterfall',
    type: 'water',
    damage_class: 'physical',
    power: 80,
    accuracy: 100,
    pp: 15,
    level_learned_at: null,
    short_effect: 'Has a 20% chance to make the target flinch.'
  },
  hydro_pump: {
    name: 'hydro-pump',
    type: 'water',
    damage_class: 'special',
    power: 110,
    accuracy: 80,
    pp: 5,
    level_learned_at: null,
    short_effect: 'Inflicts regular damage with no additional effect.'
  },
  scald: {
    name: 'scald',
    type: 'water',
    damage_class: 'special',
    power: 80,
    accuracy: 100,
    pp: 15,
    level_learned_at: null,
    short_effect: 'Has a 30% chance to burn the target.'
  },
  blizzard: {
    name: 'blizzard',
    type: 'ice',
    damage_class: 'special',
    power: 110,
    accuracy: 70,
    pp: 5,
    level_learned_at: null,
    short_effect: 'Has a 10% chance to freeze the target.'
  },
  // Normal/Status moves
  tackle: {
    name: 'tackle',
    type: 'normal',
    damage_class: 'physical',
    power: 40,
    accuracy: 100,
    pp: 35,
    level_learned_at: null,
    short_effect: 'Inflicts regular damage with no additional effect.'
  },
  rest: {
    name: 'rest',
    type: 'psychic',
    damage_class: 'status',
    power: null,
    accuracy: null,
    pp: 10,
    level_learned_at: null,
    short_effect: 'User sleeps for two turns, restoring HP and status.'
  },
  protect: {
    name: 'protect',
    type: 'normal',
    damage_class: 'status',
    power: null,
    accuracy: null,
    pp: 10,
    level_learned_at: null,
    short_effect: 'User is protected from most attacking moves this turn.'
  },
  toxic: {
    name: 'toxic',
    type: 'poison',
    damage_class: 'status',
    power: null,
    accuracy: 90,
    pp: 10,
    level_learned_at: null,
    short_effect: 'Badly poisons the target, dealing increasing damage each turn.'
  }
};

async function createUsersAndTeams() {
  // Define movesets for each pokemon
  const pokemonMovesets = {
    25: ['thunderbolt', 'quick_attack', 'iron_tail', 'thunder_wave'], // Pikachu
    94: ['shadow_ball', 'psychic', 'focus_blast', 'sludge_bomb'], // Gengar
    149: ['dragon_claw', 'outrage', 'earthquake', 'fire_blast'], // Dragonite
    6: ['flamethrower', 'air_slash', 'fire_blast', 'roost'], // Charizard
    248: ['stone_edge', 'crunch', 'earthquake', 'pursuit'], // Tyranitar
    384: ['dragon_claw', 'outrage', 'earthquake', 'stone_edge'], // Rayquaza
    9: ['surf', 'ice_beam', 'waterfall', 'scald'], // Blastoise
    130: ['surf', 'ice_beam', 'earthquake', 'crunch'], // Gyarados
    119: ['surf', 'scald', 'blizzard', 'protect'], // Seaking
    131: ['surf', 'ice_beam', 'blizzard', 'toxic'], // Lapras
    54: ['scald', 'psychic', 'rest', 'protect'], // Psyduck
    87: ['ice_beam', 'blizzard', 'surf', 'rest'] // Dewgong
  };

  const createdUsers = [];

  try {
    console.log('\n🚀 Starting user and team creation...\n');

    for (let i = 0; i < testUsers.length; i++) {
      const userConfig = testUsers[i];
      const pokemonList = i === 0 ? team1Pokemon : team2Pokemon;

      console.log(`\n📝 Creating user ${i + 1}: ${userConfig.email}`);

      let userRecord;
      try {
        userRecord = await auth.createUser({
          email: userConfig.email,
          password: userConfig.password,
          displayName: userConfig.displayName,
          emailVerified: true
        });
        console.log(`✅ User created with UID: ${userRecord.uid}`);
      } catch (err) {
        if (err.code === 'auth/email-already-exists') {
          console.log(`⚠️  User already exists, fetching UID...`);
          const userByEmail = await auth.getUserByEmail(userConfig.email);
          userRecord = userByEmail;
          console.log(`✅ Found existing user with UID: ${userRecord.uid}`);
        } else {
          throw err;
        }
      }

      // Create team for user
      console.log(`\n📚 Creating team "${userConfig.teamName}" for ${userConfig.displayName}...`);

      // Add moves to pokemon
      const slotsWithMoves = pokemonList.map((pokemon, idx) => {
        const moveKeys = pokemonMovesets[pokemon.id] || ['tackle', 'protect', 'rest', 'toxic'];

        return {
          id: pokemon.id,
          level: pokemon.level,
          nature: pokemon.nature,
          isShiny: pokemon.isShiny,
          moves: moveKeys.map(key => moveData[key])
        };
      });

      const teamRef = await db.collection('teams').add({
        name: userConfig.teamName,
        userId: userRecord.uid,
        slots: slotsWithMoves,
        isPublic: false,
        description: `Test team for ${userConfig.displayName}`,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`✅ Team created with ID: ${teamRef.id}`);

      createdUsers.push({
        email: userConfig.email,
        password: userConfig.password,
        uid: userRecord.uid,
        displayName: userConfig.displayName,
        teamId: teamRef.id,
        teamName: userConfig.teamName,
        pokemonCount: slotsWithMoves.length
      });
    }

    console.log('\n\n═══════════════════════════════════════════════════════════');
    console.log('✅ USER AND TEAM CREATION COMPLETE');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('CREATED USERS AND TEAMS:\n');
    createdUsers.forEach((user, idx) => {
      console.log(`User ${idx + 1}:`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Password: ${user.password}`);
      console.log(`  UID: ${user.uid}`);
      console.log(`  Display Name: ${user.displayName}`);
      console.log(`  Team ID: ${user.teamId}`);
      console.log(`  Team Name: ${user.teamName}`);
      console.log(`  Pokemon Count: ${user.pokemonCount}`);
      console.log('');
    });

    // Save to file
    const outputPath = path.join(__dirname, '..', 'test-users.json');
    fs.writeFileSync(outputPath, JSON.stringify(createdUsers, null, 2));
    console.log(`\n📄 User data saved to: ${outputPath}\n`);

    return createdUsers;
  } catch (error) {
    console.error('\n❌ Error during user/team creation:', error);
    throw error;
  }
}

createUsersAndTeams()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
