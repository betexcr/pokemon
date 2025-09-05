#!/usr/bin/env node

const { execSync } = require('child_process');

// Configuration
const PROJECT_ID = 'pokemon-battles-86a0d';
const CUSTOM_DOMAIN = 'pokemon.ultharcr.com';

async function addCustomDomain() {
  console.log('🔧 Adding custom domain to Firebase Auth...');
  console.log(`📝 Project: ${PROJECT_ID}`);
  console.log(`🌐 Domain: ${CUSTOM_DOMAIN}`);
  console.log('');

  try {
    // Use gcloud to get access token
    console.log('🔑 Getting access token...');
    const accessToken = execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim();
    
    // Use curl to make the API call
    console.log('➕ Adding domain to authorized domains...');
    
    const curlCommand = `curl -X PATCH \
      "https://identitytoolkit.googleapis.com/v2/projects/${PROJECT_ID}/config" \
      -H "Authorization: Bearer ${accessToken}" \
      -H "Content-Type: application/json" \
      -d '{
        "authorizedDomains": [
          "localhost",
          "pokemon-battles-86a0d.web.app",
          "${CUSTOM_DOMAIN}"
        ]
      }'`;

    const result = execSync(curlCommand, { encoding: 'utf8' });
    
    console.log('✅ Successfully added custom domain!');
    console.log('📋 Authorized domains now include:');
    console.log('   - localhost');
    console.log('   - pokemon-battles-86a0d.web.app');
    console.log(`   - ${CUSTOM_DOMAIN}`);
    console.log('');
    console.log('🎉 Custom domain successfully added!');
    console.log(`🔗 Your app can now authenticate users from: https://${CUSTOM_DOMAIN}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('gcloud')) {
      console.log('');
      console.log('💡 Alternative method:');
      console.log('1. Go to: https://console.firebase.google.com/project/pokemon-battles-86a0d/authentication/settings');
      console.log('2. Click "Authorized domains" tab');
      console.log('3. Click "Add domain"');
      console.log(`4. Enter: ${CUSTOM_DOMAIN}`);
      console.log('5. Click "Add"');
    }
  }
}

addCustomDomain();
