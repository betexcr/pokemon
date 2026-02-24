const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||  '{}');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  });
}

const db = admin.firestore();

async function createTestTeams() {
  console.log('Creating test teams for test users...');
  
  const testUsers = [
    {
      email: 'test-host@pokemon-battles.test',
      uid: 'vbZwTqtzuAdJZaBRmnfIorXXJle2', // From test output
      teamName: 'Host Battle Team'
    },
    {
      email: 'test-guest@pokemon-battles.test',
      uid: 'wYnr9PKDr0atR14hkon6o15zizc2', // From test output
      teamName: 'Guest Battle Team'
    }
  ];
  
  const sampleTeam = {
    slots: [
      {
        id: 25, // Pikachu
        level: 50,
        nature: 'Hardy',
        isShiny: false,
        moves: [
          {
            name: 'thunderbolt',
            type: 'electric',
            damage_class: 'special',
            power: 90,
            accuracy: 100,
            pp: 15,
            level_learned_at: null,
            short_effect: 'Has a 10% chance to paralyze the target.'
          },
          {
            name: 'quick-attack',
            type: 'normal',
            damage_class: 'physical',
            power: 40,
            accuracy: 100,
            pp: 30,
            level_learned_at: null,
            short_effect: 'Inflicts regular damage with no additional effect.'
          },
          {
            name: 'iron-tail',
            type: 'steel',
            damage_class: 'physical',
            power: 100,
            accuracy: 75,
            pp: 15,
            level_learned_at: null,
            short_effect: 'Has a 30% chance to lower the target\'s Defense by one stage.'
          },
          {
            name: 'electro-ball',
            type: 'electric',
            damage_class: 'special',
            power: null,
            accuracy: 100,
            pp: 10,
            level_learned_at: null,
            short_effect: 'Power increases with the user\'s Speed compared to the target.'
          }
        ]
      },
      {
        id: 6, // Charizard
        level: 50,
        nature: 'Hardy',
        isShiny: false,
        moves: [
          {
            name: 'flamethrower',
            type: 'fire',
            damage_class: 'special',
            power: 90,
            accuracy: 100,
            pp: 15,
            level_learned_at: null,
            short_effect: 'Has a 10% chance to burn the target.'
          },
          {
            name: 'air-slash',
            type: 'flying',
            damage_class: 'special',
            power: 75,
            accuracy: 95,
            pp: 15,
            level_learned_at: null,
            short_effect: 'Has a 30% chance to make the target flinch.'
          },
          {
            name: 'dragon-claw',
            type: 'dragon',
            damage_class: 'physical',
            power: 80,
            accuracy: 100,
            pp: 15,
            level_learned_at: null,
            short_effect: 'Inflicts regular damage with no additional effect.'
          },
          {
            name: 'fire-blast',
            type: 'fire',
            damage_class: 'special',
            power: 110,
            accuracy: 85,
            pp: 5,
            level_learned_at: null,
            short_effect: 'Has a 10% chance to burn the target.'
          }
        ]
      },
      {
        id: 9, // Blastoise
        level: 50,
        nature: 'Hardy',
        isShiny: false,
        moves: [
          {
            name: 'surf',
            type: 'water',
            damage_class: 'special',
            power: 90,
            accuracy: 100,
            pp: 15,
            level_learned_at: null,
            short_effect: 'Inflicts regular damage with no additional effect.'
          },
          {
            name: 'ice-beam',
            type: 'ice',
            damage_class: 'special',
            power: 90,
            accuracy: 100,
            pp: 10,
            level_learned_at: null,
            short_effect: 'Has a 10% chance to freeze the target.'
          },
          {
            name: 'aqua-tail',
            type: 'water',
            damage_class: 'physical',
            power: 90,
            accuracy: 90,
            pp: 10,
            level_learned_at: null,
            short_effect: 'Inflicts regular damage with no additional effect.'
          },
          {
            name: 'hydro-pump',
            type: 'water',
            damage_class: 'special',
            power: 110,
            accuracy: 80,
            pp: 5,
            level_learned_at: null,
            short_effect: 'Inflicts regular damage with no additional effect.'
          }
        ]
      }
    ],
    isPublic: false,
    description: 'Test team for E2E battles'
  };
  
  for (const user of testUsers) {
    try {
      console.log(`Creating team for ${user.email}...`);
      
      // Check if team already exists
      const existingTeams = await db.collection('teams')
        .where('userId', '==', user.uid)
        .where('name', '==', user.teamName)
        .get();
      
      if (!existingTeams.empty) {
        console.log(`  Team already exists for ${user.email}`);
        continue;
      }
      
      // Create the team
      const teamDoc = await db.collection('teams').add({
        name: user.teamName,
        userId: user.uid,
        ...sampleTeam,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`  ✅ Created team ${teamDoc.id} for ${user.email}`);
    } catch (error) {
      console.error(`  ❌ Failed to create team for ${user.email}:`, error);
    }
  }
  
  console.log('\n✅ Test teams setup complete!');
}

createTestTeams().catch(console.error);
