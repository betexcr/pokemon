#!/usr/bin/env node

/**
 * Multiplayer Battle Test Runner
 * 
 * This script sets up and runs comprehensive multiplayer battle tests
 * with real Firebase users and 6-Pokemon teams.
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🎮 Multiplayer Battle Test Runner');
console.log('================================');

async function runCommand(command, description) {
  console.log(`\n🔄 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    console.log(`✅ ${description} completed successfully`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    throw error;
  }
}

async function checkPrerequisites() {
  console.log('\n🔍 Checking prerequisites...');
  
  // Check if .env.local exists
  const fs = require('fs');
  if (!fs.existsSync('.env.local')) {
    console.error('❌ .env.local file not found. Please copy env.test.example to .env.local and configure it.');
    process.exit(1);
  }
  
  // Check if Firebase config is present
  require('dotenv').config({ path: '.env.local' });
  const requiredEnvVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'TEST_HOST_EMAIL',
    'TEST_HOST_PASSWORD',
    'TEST_GUEST_EMAIL',
    'TEST_GUEST_PASSWORD'
  ];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`❌ Missing required environment variable: ${envVar}`);
      process.exit(1);
    }
  }
  
  console.log('✅ Prerequisites check passed');
}

async function setupTestEnvironment() {
  console.log('\n🏗️ Setting up test environment...');
  
  // Install dependencies if needed
  try {
    execSync('npm list @playwright/test', { stdio: 'pipe' });
  } catch (error) {
    console.log('📦 Installing Playwright...');
    await runCommand('npm install @playwright/test', 'Installing Playwright');
    await runCommand('npx playwright install', 'Installing Playwright browsers');
  }
  
  // Setup test users with 6-Pokemon teams
  await runCommand('npm run test:setup-users', 'Setting up test users with 6-Pokemon teams');
  
  console.log('✅ Test environment setup completed');
}

async function runMultiplayerBattleTests() {
  console.log('\n🎮 Running multiplayer battle tests...');
  
  const testOptions = process.argv.slice(2);
  let testCommand = 'npm run test:multiplayer-battle';
  
  if (testOptions.includes('--ui')) {
    testCommand = 'npm run test:multiplayer-battle:ui';
  } else if (testOptions.includes('--headed')) {
    testCommand = 'npm run test:multiplayer-battle:headed';
  } else if (testOptions.includes('--debug')) {
    testCommand = 'npm run test:multiplayer-battle:debug';
  }
  
  await runCommand(testCommand, 'Running multiplayer battle tests');
  
  console.log('✅ Multiplayer battle tests completed');
}

async function generateTestReport() {
  console.log('\n📊 Generating test report...');
  
  try {
    await runCommand('npx playwright show-report', 'Opening test report');
  } catch (error) {
    console.log('📋 Test report available at: playwright-report/index.html');
  }
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    await runCommand('npm run test:cleanup-users', 'Cleaning up test users and data');
  } catch (error) {
    console.warn('⚠️ Cleanup failed, but test data may still exist in Firebase');
  }
  
  console.log('✅ Cleanup completed');
}

async function main() {
  try {
    await checkPrerequisites();
    await setupTestEnvironment();
    await runMultiplayerBattleTests();
    await generateTestReport();
    
    // Ask user if they want to cleanup
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise((resolve) => {
      rl.question('\n🧹 Do you want to cleanup test data? (y/N): ', resolve);
    });
    
    rl.close();
    
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      await cleanup();
    } else {
      console.log('ℹ️ Test data preserved. Run "npm run test:cleanup-users" to clean up later.');
    }
    
    console.log('\n🎉 Multiplayer battle test runner completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test runner failed:', error.message);
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🎮 Multiplayer Battle Test Runner

Usage: node scripts/run-multiplayer-battle-test.js [options]

Options:
  --ui       Run tests with Playwright UI
  --headed   Run tests in headed mode (visible browser)
  --debug    Run tests in debug mode
  --help     Show this help message

Examples:
  node scripts/run-multiplayer-battle-test.js
  node scripts/run-multiplayer-battle-test.js --ui
  node scripts/run-multiplayer-battle-test.js --headed
  node scripts/run-multiplayer-battle-test.js --debug

This script will:
1. Check prerequisites and environment setup
2. Install Playwright if needed
3. Set up test users with 6-Pokemon teams
4. Run comprehensive multiplayer battle tests
5. Generate test reports
6. Optionally cleanup test data
`);
  process.exit(0);
}

main();
