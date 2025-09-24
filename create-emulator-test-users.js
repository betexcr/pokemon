// Script to create test users using Firebase Auth Emulator REST API
// This will help us create the test users needed for the e2e tests

const http = require('http');

// Firebase emulator configuration
const emulatorHost = '127.0.0.1';
const emulatorPort = 9099;
const apiKey = 'fake-api-key'; // Emulator uses fake API key

async function createUser(email, password, displayName) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      email: email,
      password: password,
      displayName: displayName,
      returnSecureToken: true
    });

    const options = {
      hostname: emulatorHost,
      port: emulatorPort,
      path: `/identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 200) {
            resolve(response);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${response.error?.message || data}`));
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function setupTestUsers() {
  try {
    console.log('🔐 Setting up test users in Firebase emulator...');
    
    // Create testbattle1 user
    try {
      console.log('Creating testbattle1@pokemon-battles.test...');
      const user1 = await createUser(
        'testbattle1@pokemon-battles.test',
        'test1234',
        'TestBattle1'
      );
      console.log('✅ Created user1:', user1.email, 'UID:', user1.localId);
    } catch (error) {
      if (error.message.includes('EMAIL_EXISTS')) {
        console.log('ℹ️ testbattle1@pokemon-battles.test already exists');
      } else {
        console.error('❌ Error creating user1:', error.message);
      }
    }
    
    // Create testbattle2 user
    try {
      console.log('Creating testbattle2@pokemon-battles.test...');
      const user2 = await createUser(
        'testbattle2@pokemon-battles.test',
        'test1234',
        'TestBattle2'
      );
      console.log('✅ Created user2:', user2.email, 'UID:', user2.localId);
    } catch (error) {
      if (error.message.includes('EMAIL_EXISTS')) {
        console.log('ℹ️ testbattle2@pokemon-battles.test already exists');
      } else {
        console.error('❌ Error creating user2:', error.message);
      }
    }
    
    console.log('🎉 Test users setup completed in emulator!');
    console.log('Now you can run the e2e tests with proper authentication.');
    
  } catch (error) {
    console.error('❌ Error setting up test users:', error);
  }
}

// Run the setup
setupTestUsers();
