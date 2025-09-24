#!/usr/bin/env node

const admin = require('firebase-admin');

// Configuration
const PROJECT_ID = 'pokemon-battles-86a0d';
const CUSTOM_DOMAIN = 'pokemon.ultharcr.com';

async function addCustomDomainWithAdmin() {
  console.log('🔧 Adding custom domain using Firebase Admin SDK...');
  console.log(`📝 Project: ${PROJECT_ID}`);
  console.log(`🌐 Domain: ${CUSTOM_DOMAIN}`);
  console.log('');

  try {
    // Initialize Firebase Admin with project ID
    if (!admin.apps.length) {
      admin.initializeApp({
        projectId: PROJECT_ID,
      });
    }

    // Get the auth service
    const auth = admin.auth();
    
    // Get current project config
    console.log('📋 Getting current project configuration...');
    
    // Note: Firebase Admin SDK doesn't have direct methods for authorized domains
    // We need to use the REST API with the service account
    
    console.log('⚠️  Firebase Admin SDK doesn\'t support authorized domains configuration directly.');
    console.log('');
    console.log('💡 Manual steps required:');
    console.log('1. Go to: https://console.firebase.google.com/project/pokemon-battles-86a0d/authentication/settings');
    console.log('2. Click "Authorized domains" tab');
    console.log('3. Click "Add domain"');
    console.log(`4. Enter: ${CUSTOM_DOMAIN}`);
    console.log('5. Click "Add"');
    console.log('');
    console.log('🔗 Or use the direct link:');
    console.log('https://console.firebase.google.com/project/pokemon-battles-86a0d/authentication/settings');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addCustomDomainWithAdmin();
