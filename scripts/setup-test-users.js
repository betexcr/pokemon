/**
 * Setup Test Users for Integration Testing
 * 
 * This script creates test user accounts in Firebase Auth
 * for automated integration testing.
 */

const { initializeApp } = require('firebase/app');
const { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile,
  deleteUser 
} = require('firebase/auth');
const { getFirestore, collection, addDoc, doc, setDoc } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Test user configurations
const TEST_USERS = [
  {
    email: 'test-host@pokemon-battles.test',
    password: 'TestHost123!',
    displayName: 'Test Host Trainer',
    role: 'host'
  },
  {
    email: 'test-guest@pokemon-battles.test',
    password: 'TestGuest123!',
    displayName: 'Test Guest Trainer',
    role: 'guest'
  },
  {
    email: 'test-admin@pokemon-battles.test',
    password: 'TestAdmin123!',
    displayName: 'Test Admin',
    role: 'admin'
  }
];

// Sample test teams
const SAMPLE_TEAMS = {
  host: {
    name: 'Host Test Team',
    slots: [
      { id: 25, level: 50, moves: [33, 45, 85, 98] }, // Pikachu
      { id: 6, level: 50, moves: [17, 35, 43, 52] },  // Charizard
      { id: 9, level: 50, moves: [55, 56, 57, 58] },  // Blastoise
      { id: null, level: 1, moves: [] },
      { id: null, level: 1, moves: [] },
      { id: null, level: 1, moves: [] }
    ]
  },
  guest: {
    name: 'Guest Test Team',
    slots: [
      { id: 150, level: 50, moves: [105, 106, 107, 108] }, // Mewtwo
      { id: 144, level: 50, moves: [64, 65, 66, 67] },     // Articuno
      { id: 145, level: 50, moves: [85, 86, 87, 88] },     // Zapdos
      { id: null, level: 1, moves: [] },
      { id: null, level: 1, moves: [] },
      { id: null, level: 1, moves: [] }
    ]
  }
};

async function setupTestUsers() {
  console.log('🔥 Setting up Firebase test users...');
  
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  
  const createdUsers = [];
  
  try {
    for (const userConfig of TEST_USERS) {
      console.log(`Creating user: ${userConfig.email}`);
      
      try {
        // Create user account
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          userConfig.email, 
          userConfig.password
        );
        
        const user = userCredential.user;
        
        // Update profile with display name
        await updateProfile(user, {
          displayName: userConfig.displayName
        });
        
        // Create user document in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: userConfig.displayName,
          role: userConfig.role,
          createdAt: new Date(),
          isTestUser: true
        });
        
        // Create sample teams for host and guest
        if (userConfig.role === 'host' || userConfig.role === 'guest') {
          const teamData = userConfig.role === 'host' ? SAMPLE_TEAMS.host : SAMPLE_TEAMS.guest;
          
          await addDoc(collection(db, 'user_teams'), {
            userId: user.uid,
            ...teamData,
            createdAt: new Date(),
            isTestTeam: true
          });
          
          console.log(`✅ Created ${teamData.name} for ${userConfig.displayName}`);
        }
        
        createdUsers.push({
          uid: user.uid,
          email: user.email,
          displayName: userConfig.displayName,
          role: userConfig.role
        });
        
        console.log(`✅ Created user: ${userConfig.displayName} (${userConfig.email})`);
        
      } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
          console.log(`⚠️  User ${userConfig.email} already exists, skipping...`);
        } else {
          console.error(`❌ Failed to create user ${userConfig.email}:`, error.message);
        }
      }
    }
    
    console.log('\n🎉 Test user setup completed!');
    console.log('Created users:');
    createdUsers.forEach(user => {
      console.log(`  - ${user.displayName} (${user.email}) - ${user.role}`);
    });
    
    console.log('\n📝 Environment variables for testing:');
    console.log('TEST_HOST_EMAIL=test-host@pokemon-battles.test');
    console.log('TEST_HOST_PASSWORD=TestHost123!');
    console.log('TEST_GUEST_EMAIL=test-guest@pokemon-battles.test');
    console.log('TEST_GUEST_PASSWORD=TestGuest123!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

async function cleanupTestUsers() {
  console.log('🧹 Cleaning up test users...');
  
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  
  try {
    for (const userConfig of TEST_USERS) {
      try {
        // Sign in to get the user
        const userCredential = await signInWithEmailAndPassword(
          auth,
          userConfig.email,
          userConfig.password
        );
        
        const user = userCredential.user;
        
        // Delete the user
        await deleteUser(user);
        console.log(`✅ Deleted user: ${userConfig.email}`);
        
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          console.log(`⚠️  User ${userConfig.email} not found, skipping...`);
        } else {
          console.error(`❌ Failed to delete user ${userConfig.email}:`, error.message);
        }
      }
    }
    
    console.log('🎉 Test user cleanup completed!');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

// Command line interface
const command = process.argv[2];

if (command === 'setup') {
  setupTestUsers();
} else if (command === 'cleanup') {
  cleanupTestUsers();
} else {
  console.log('Usage:');
  console.log('  node scripts/setup-test-users.js setup    - Create test users');
  console.log('  node scripts/setup-test-users.js cleanup  - Delete test users');
  process.exit(1);
}
