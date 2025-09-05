#!/usr/bin/env node

const { execSync } = require('child_process');
const https = require('https');

// Configuration
const PROJECT_ID = 'pokemon-battles-86a0d';
const CUSTOM_DOMAIN = 'pokemon.ultharcr.com';

async function getAccessToken() {
  try {
    // Get the access token from Firebase CLI
    const token = execSync('firebase login:ci --no-localhost', { encoding: 'utf8' }).trim();
    return token;
  } catch (error) {
    console.error('Error getting Firebase token:', error.message);
    console.log('Please run: firebase login:ci --no-localhost');
    process.exit(1);
  }
}

async function addAuthorizedDomain(accessToken) {
  const url = `https://identitytoolkit.googleapis.com/v2/projects/${PROJECT_ID}/config`;
  
  const data = JSON.stringify({
    authorizedDomains: [
      'localhost',
      'pokemon-battles-86a0d.web.app',
      CUSTOM_DOMAIN
    ]
  });

  const options = {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('✅ Successfully added custom domain to authorized domains!');
          console.log('📋 Authorized domains now include:');
          console.log('   - localhost');
          console.log('   - pokemon-battles-86a0d.web.app');
          console.log(`   - ${CUSTOM_DOMAIN}`);
          resolve(JSON.parse(responseData));
        } else {
          console.error('❌ Error adding custom domain:', responseData);
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('🔧 Adding custom domain to Firebase Auth authorized domains...');
  console.log(`📝 Project: ${PROJECT_ID}`);
  console.log(`🌐 Domain: ${CUSTOM_DOMAIN}`);
  console.log('');

  try {
    // Get access token
    console.log('🔑 Getting Firebase access token...');
    const accessToken = await getAccessToken();
    
    // Add the custom domain
    console.log('➕ Adding custom domain to authorized domains...');
    await addAuthorizedDomain(accessToken);
    
    console.log('');
    console.log('🎉 Custom domain successfully added!');
    console.log(`🔗 Your app can now authenticate users from: https://${CUSTOM_DOMAIN}`);
    
  } catch (error) {
    console.error('❌ Failed to add custom domain:', error.message);
    process.exit(1);
  }
}

main();
