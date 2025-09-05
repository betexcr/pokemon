#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

// Configuration
const PROJECT_ID = 'pokemon-battles-86a0d';
const CUSTOM_DOMAIN = 'pokemon.ultharcr.com';

function createSetupInstructions() {
  const instructions = `
# 🔧 Custom Domain Setup for Firebase Authentication

## 📋 Current Configuration
- **Project ID:** ${PROJECT_ID}
- **Custom Domain:** ${CUSTOM_DOMAIN}
- **Current App URL:** https://pokemon-battles-86a0d.web.app

## 🎯 Required Steps

### 1. Add Custom Domain to Firebase Auth (REQUIRED)
**Direct Link:** https://console.firebase.google.com/project/${PROJECT_ID}/authentication/settings

**Steps:**
1. Click on **"Authorized domains"** tab
2. Click **"Add domain"** button
3. Enter: \`${CUSTOM_DOMAIN}\`
4. Click **"Add"**

### 2. Configure Custom Domain for Hosting (OPTIONAL)
**Direct Link:** https://console.firebase.google.com/project/${PROJECT_ID}/hosting

**Steps:**
1. Click **"Add custom domain"**
2. Enter: \`${CUSTOM_DOMAIN}\`
3. Follow the verification steps
4. Update your DNS records as instructed

### 3. DNS Configuration (if using custom domain for hosting)
Add these DNS records with your domain provider:
- **Type:** CNAME
- **Name:** pokemon (or @ for root domain)
- **Value:** pokemon-battles-86a0d.web.app

## ✅ Verification
After completing the steps above:
- **Auth will work on:** https://${CUSTOM_DOMAIN}
- **App will be accessible at:** https://${CUSTOM_DOMAIN} (if hosting is configured)

## 🔗 Quick Links
- **Firebase Console:** https://console.firebase.google.com/project/${PROJECT_ID}
- **Auth Settings:** https://console.firebase.google.com/project/${PROJECT_ID}/authentication/settings
- **Hosting Settings:** https://console.firebase.google.com/project/${PROJECT_ID}/hosting
- **Current App:** https://pokemon-battles-86a0d.web.app

## 🚀 Current Status
✅ App deployed and working
✅ Firebase Auth configured
⏳ Custom domain needs to be added to authorized domains
`;

  return instructions;
}

function main() {
  console.log('🔧 Firebase Custom Domain Setup');
  console.log('================================');
  console.log('');
  
  const instructions = createSetupInstructions();
  console.log(instructions);
  
  // Save instructions to file
  fs.writeFileSync('CUSTOM_DOMAIN_SETUP.md', instructions);
  console.log('📄 Instructions saved to: CUSTOM_DOMAIN_SETUP.md');
  console.log('');
  
  console.log('🎯 Next Steps:');
  console.log('1. Open the Firebase Console link above');
  console.log('2. Add the custom domain to authorized domains');
  console.log('3. Test authentication on your custom domain');
  console.log('');
  console.log('🔗 Direct link to Auth Settings:');
  console.log(`https://console.firebase.google.com/project/${PROJECT_ID}/authentication/settings`);
}

main();
