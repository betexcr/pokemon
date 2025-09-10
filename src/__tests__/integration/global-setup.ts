/**
 * Global Setup for Integration Tests
 * 
 * This runs once before all tests to:
 * 1. Verify Firebase configuration
 * 2. Create test users if they don't exist
 * 3. Set up test data
 */

import { chromium, FullConfig } from '@playwright/test';
import { execSync } from 'child_process';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global test setup...');
  
  // Check if Firebase is configured
  const requiredEnvVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.error(`  - ${varName}`));
    console.error('\nPlease set up your Firebase configuration in .env.local');
    process.exit(1);
  }
  
  console.log('✅ Firebase configuration verified');
  
  // Set up test users
  try {
    console.log('👥 Setting up test users...');
    execSync('node scripts/setup-test-users.js setup', { stdio: 'inherit' });
    console.log('✅ Test users setup completed');
  } catch (error) {
    console.error('❌ Failed to setup test users:', error);
    process.exit(1);
  }
  
  // Verify the application is running
  const baseURL = config.projects[0].use?.baseURL || 'http://localhost:3000';
  console.log(`🌐 Verifying application is running at ${baseURL}...`);
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    await page.goto(baseURL, { timeout: 30000 });
    await page.waitForLoadState('networkidle');
    console.log('✅ Application is running and accessible');
  } catch (error) {
    console.error(`❌ Application is not accessible at ${baseURL}`);
    console.error('Make sure to run "npm run dev" before running tests');
    process.exit(1);
  } finally {
    await browser.close();
  }
  
  console.log('🎉 Global setup completed successfully!');
}

export default globalSetup;

