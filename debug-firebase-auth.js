// Debug script to test Firebase Auth REST API
const https = require('https');

const apiKey = 'AIzaSyASbdOWHRBH_QAqpjRrp9KyzPWheNuUZmY';
const baseUrl = 'https://identitytoolkit.googleapis.com/v1';

async function testFirebaseAuth() {
  console.log('🔧 Testing Firebase Auth REST API...');
  console.log('🔧 API Key:', apiKey.substring(0, 10) + '...');
  
  const testUser = {
    email: 'debug-test@pokemon-battles.test',
    password: 'TestPassword123!',
    displayName: 'Debug Test User'
  };

  const postData = JSON.stringify({
    email: testUser.email,
    password: testUser.password,
    displayName: testUser.displayName,
    returnSecureToken: true
  });

  const options = {
    hostname: 'identitytoolkit.googleapis.com',
    port: 443,
    path: `/v1/accounts:signUp?key=${apiKey}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      console.log('🔧 Response status:', res.statusCode);
      console.log('🔧 Response headers:', res.headers);
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('🔧 Raw response data:', data);
        
        try {
          const response = JSON.parse(data);
          console.log('🔧 Parsed response:', JSON.stringify(response, null, 2));
          
          if (res.statusCode === 200) {
            console.log('✅ Success!');
            resolve(response);
          } else {
            console.log('❌ Error response');
            reject(new Error(`HTTP ${res.statusCode}: ${response.error?.message || data}`));
          }
        } catch (error) {
          console.log('❌ Failed to parse response:', error.message);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Request error:', error);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

testFirebaseAuth()
  .then((result) => {
    console.log('🎉 Test completed successfully!');
    console.log('Result:', result);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error.message);
  });
