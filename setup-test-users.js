const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = {
  // You'll need to add your service account key here or use environment variables
  type: "service_account",
  project_id: "pokemon-battles-86a0d",
  // Add other required fields...
};

// For emulator testing, we can use a simple initialization
admin.initializeApp({
  projectId: 'pokemon-battles-86a0d',
  // Use emulator for testing
});

const auth = admin.auth();

async function createTestUsers() {
  try {
    console.log('🔐 Creating test users...');
    
    // Create testbattle1 user
    try {
      const user1 = await auth.createUser({
        uid: 'testbattle1-uid',
        email: 'testbattle1@pokemon-battles.test',
        password: 'test1234',
        displayName: 'TestBattle1'
      });
      console.log('✅ Created user1:', user1.email);
    } catch (error) {
      if (error.code === 'auth/uid-already-exists' || error.code === 'auth/email-already-exists') {
        console.log('ℹ️ User1 already exists');
      } else {
        console.error('❌ Error creating user1:', error.message);
      }
    }
    
    // Create testbattle2 user
    try {
      const user2 = await auth.createUser({
        uid: 'testbattle2-uid',
        email: 'testbattle2@pokemon-battles.test',
        password: 'test1234',
        displayName: 'TestBattle2'
      });
      console.log('✅ Created user2:', user2.email);
    } catch (error) {
      if (error.code === 'auth/uid-already-exists' || error.code === 'auth/email-already-exists') {
        console.log('ℹ️ User2 already exists');
      } else {
        console.error('❌ Error creating user2:', error.message);
      }
    }
    
    console.log('🎉 Test users setup completed!');
    
  } catch (error) {
    console.error('❌ Error setting up test users:', error);
  }
}

// Run the setup
createTestUsers();
