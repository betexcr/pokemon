#!/usr/bin/env node

/**
 * Script to add custom domain to Firebase Authentication authorized domains
 * This script provides instructions for adding pokemon.ultharcr.com to Firebase
 */

const { initializeApp } = require('firebase/app');
const { getAuth } = require('firebase/auth');

console.log('🔧 Firebase Custom Domain Setup');
console.log('================================\n');

console.log('Your custom domain: pokemon.ultharcr.com');
console.log('Firebase Project: pokemon-battles-86a0d\n');

console.log('📋 Manual Steps Required:');
console.log('1. Go to Firebase Console: https://console.firebase.google.com/project/pokemon-battles-86a0d');
console.log('2. Navigate to Authentication > Settings');
console.log('3. Scroll down to "Authorized domains" section');
console.log('4. Click "Add domain"');
console.log('5. Enter: pokemon.ultharcr.com');
console.log('6. Click "Add"\n');

console.log('✅ After adding the domain, your authentication should work on pokemon.ultharcr.com');
console.log('\n🔗 Direct link to Authentication settings:');
console.log('https://console.firebase.google.com/project/pokemon-battles-86a0d/authentication/settings');

console.log('\n📝 Current authorized domains should include:');
console.log('- localhost (for development)');
console.log('- pokemon-battles-86a0d.web.app (default Firebase hosting)');
console.log('- pokemon-battles-86a0d.firebaseapp.com (default Firebase hosting)');
console.log('- pokemon.ultharcr.com (your custom domain - needs to be added)');

console.log('\n⚠️  Important Notes:');
console.log('- The domain must be added to the same Firebase project (pokemon-battles-86a0d)');
console.log('- It may take a few minutes for the changes to propagate');
console.log('- Make sure your custom domain is properly configured in your DNS/hosting provider');
console.log('- The domain should point to your Firebase hosting');