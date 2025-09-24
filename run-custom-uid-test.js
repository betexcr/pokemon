#!/usr/bin/env node

/**
 * Custom UID Test Runner
 * 
 * This script sets up test users with specific UIDs and runs the multiplayer battle test.
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🎮 Custom UID Multiplayer Battle Test Runner');
console.log('============================================');
console.log('🎯 Target UIDs: testbattle1-cli-uid, testbattle2-cli-uid');

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
    'FIREBASE_ADMIN_CLIENT_EMAIL',
    'FIREBASE_ADMIN_PRIVATE_KEY'
  ];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`❌ Missing required environment variable: ${envVar}`);
      process.exit(1);
    }
  }
  
  console.log('✅ Prerequisites check passed');
}

async function setupCustomTestUsers() {
  console.log('\n🏗️ Setting up custom test users with specific UIDs...');
  
  // Setup custom test users
  await runCommand('node setup-custom-test-users.js setup', 'Setting up custom test users with UIDs');
  
  console.log('✅ Custom test users setup completed');
}

async function runCustomUIDTests() {
  console.log('\n🎮 Running multiplayer battle tests with custom UIDs...');
  
  const testOptions = process.argv.slice(2);
  let testCommand = 'npx playwright test multiplayer-battle-custom-uid.test.ts';
  
  if (testOptions.includes('--ui')) {
    testCommand = 'npx playwright test multiplayer-battle-custom-uid.test.ts --ui';
  } else if (testOptions.includes('--headed')) {
    testCommand = 'npx playwright test multiplayer-battle-custom-uid.test.ts --headed';
  } else if (testOptions.includes('--debug')) {
    testCommand = 'npx playwright test multiplayer-battle-custom-uid.test.ts --debug';
  }
  
  await runCommand(testCommand, 'Running multiplayer battle tests with custom UIDs');
  
  console.log('✅ Custom UID multiplayer battle tests completed');
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
  console.log('\n🧹 Cleaning up custom test data...');
  
  try {
    await runCommand('node setup-custom-test-users.js cleanup', 'Cleaning up custom test users and data');
  } catch (error) {
    console.warn('⚠️ Cleanup failed, but test data may still exist in Firebase');
  }
  
  console.log('✅ Cleanup completed');
}

async function main() {
  try {
    await checkPrerequisites();
    await setupCustomTestUsers();
    await runCustomUIDTests();
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
      console.log('ℹ️ Test data preserved. Run "node setup-custom-test-users.js cleanup" to clean up later.');
    }
    
    console.log('\n🎉 Custom UID multiplayer battle test runner completed successfully!');
    console.log('🎯 Test users created with UIDs: testbattle1-cli-uid, testbattle2-cli-uid');
    
  } catch (error) {
    console.error('\n❌ Test runner failed:', error.message);
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🎮 Custom UID Multiplayer Battle Test Runner

Usage: node run-custom-uid-test.js [options]

Options:
  --ui       Run tests with Playwright UI
  --headed   Run tests in headed mode (visible browser)
  --debug    Run tests in debug mode
  --help     Show this help message

Examples:
  node run-custom-uid-test.js
  node run-custom-uid-test.js --ui
  node run-custom-uid-test.js --headed
  node run-custom-uid-test.js --debug

This script will:
1. Check prerequisites and environment setup
2. Set up test users with specific UIDs (testbattle1-cli-uid, testbattle2-cli-uid)
3. Run comprehensive multiplayer battle tests
4. Generate test reports
5. Optionally cleanup test data

Test Users:
- Host: testbattle1@pokemon-battles.test (UID: testbattle1-cli-uid)
- Guest: testbattle2@pokemon-battles.test (UID: testbattle2-cli-uid)
`);
  process.exit(0);
}

main();
