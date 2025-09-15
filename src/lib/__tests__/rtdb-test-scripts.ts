#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';

const TEST_RESULTS_DIR = './test-results';
const COVERAGE_DIR = './coverage';

// Ensure test results directory exists
if (!existsSync(TEST_RESULTS_DIR)) {
  mkdirSync(TEST_RESULTS_DIR, { recursive: true });
}

if (!existsSync(COVERAGE_DIR)) {
  mkdirSync(COVERAGE_DIR, { recursive: true });
}

// Test scripts
const scripts = {
  'test:unit': 'vitest run src/lib/__tests__/firebase-rtdb-service.test.ts src/lib/__tests__/battle-engine-rtdb.test.ts src/lib/__tests__/battle-state-conversion.test.ts',
  'test:component': 'vitest run src/components/__tests__/RTDBBattleComponent.test.tsx',
  'test:integration': 'vitest run src/lib/__tests__/battle-flow-integration.test.ts src/lib/__tests__/rtdb-integration.test.ts',
  'test:performance': 'vitest run src/lib/__tests__/rtdb-performance.test.ts',
  'test:security': 'vitest run src/lib/__tests__/rtdb-security-rules.test.ts',
  'test:error-handling': 'vitest run src/lib/__tests__/rtdb-error-handling.test.ts',
  'test:migration': 'vitest run src/lib/__tests__/rtdb-migration.test.ts',
  'test:all': 'vitest run src/lib/__tests__/rtdb-test-runner.ts',
  'test:coverage': 'vitest run --coverage',
  'test:watch': 'vitest watch src/lib/__tests__/',
  'test:ui': 'vitest --ui',
  'test:debug': 'vitest run --reporter=verbose --no-coverage',
  'test:ci': 'vitest run --reporter=json --outputFile=./test-results/results.json --coverage --reporter=html --outputFile=./test-results/coverage.html'
};

// Function to run a test script
function runTest(scriptName: string) {
  const command = scripts[scriptName as keyof typeof scripts];
  if (!command) {
    console.error(`Unknown test script: ${scriptName}`);
    console.log('Available scripts:', Object.keys(scripts).join(', '));
    process.exit(1);
  }

  console.log(`Running ${scriptName}...`);
  console.log(`Command: ${command}`);
  
  try {
    execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log(`✅ ${scriptName} completed successfully`);
  } catch (error) {
    console.error(`❌ ${scriptName} failed:`, error);
    process.exit(1);
  }
}

// Function to run all tests
function runAllTests() {
  console.log('🚀 Running all RTDB tests...');
  
  const testOrder = [
    'test:unit',
    'test:component', 
    'test:integration',
    'test:performance',
    'test:security',
    'test:error-handling',
    'test:migration'
  ];

  let passed = 0;
  let failed = 0;

  for (const test of testOrder) {
    try {
      runTest(test);
      passed++;
    } catch (error) {
      failed++;
      console.error(`Failed: ${test}`);
    }
  }

  console.log(`\n📊 Test Summary:`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Total: ${passed + failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

// Function to generate test report
function generateReport() {
  console.log('📋 Generating test report...');
  
  try {
    // Run tests with JSON output
    execSync('vitest run --reporter=json --outputFile=./test-results/results.json', { 
      stdio: 'inherit' 
    });
    
    // Generate coverage report
    execSync('vitest run --coverage --reporter=html --outputFile=./test-results/coverage.html', { 
      stdio: 'inherit' 
    });
    
    console.log('✅ Test report generated successfully');
    console.log(`📁 Results: ${resolve(TEST_RESULTS_DIR)}`);
    console.log(`📊 Coverage: ${resolve(TEST_RESULTS_DIR, 'coverage.html')}`);
  } catch (error) {
    console.error('❌ Failed to generate test report:', error);
    process.exit(1);
  }
}

// Function to clean test results
function cleanResults() {
  console.log('🧹 Cleaning test results...');
  
  try {
    if (existsSync(TEST_RESULTS_DIR)) {
      execSync(`rm -rf ${TEST_RESULTS_DIR}/*`, { stdio: 'inherit' });
    }
    
    if (existsSync(COVERAGE_DIR)) {
      execSync(`rm -rf ${COVERAGE_DIR}/*`, { stdio: 'inherit' });
    }
    
    console.log('✅ Test results cleaned');
  } catch (error) {
    console.error('❌ Failed to clean test results:', error);
    process.exit(1);
  }
}

// Function to show help
function showHelp() {
  console.log(`
🧪 RTDB Test Scripts

Usage: node rtdb-test-scripts.ts <command>

Commands:
  test:unit          Run unit tests
  test:component     Run component tests  
  test:integration   Run integration tests
  test:performance   Run performance tests
  test:security      Run security tests
  test:error-handling Run error handling tests
  test:migration     Run migration tests
  test:all           Run all tests
  test:coverage      Run tests with coverage
  test:watch         Run tests in watch mode
  test:ui            Run tests with UI
  test:debug         Run tests in debug mode
  test:ci            Run tests for CI
  report             Generate test report
  clean              Clean test results
  help               Show this help

Examples:
  node rtdb-test-scripts.ts test:unit
  node rtdb-test-scripts.ts test:all
  node rtdb-test-scripts.ts report
  `);
}

// Main execution
const command = process.argv[2];

switch (command) {
  case 'test:unit':
  case 'test:component':
  case 'test:integration':
  case 'test:performance':
  case 'test:security':
  case 'test:error-handling':
  case 'test:migration':
  case 'test:all':
  case 'test:coverage':
  case 'test:watch':
  case 'test:ui':
  case 'test:debug':
  case 'test:ci':
    runTest(command);
    break;
  case 'report':
    generateReport();
    break;
  case 'clean':
    cleanResults();
    break;
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
  default:
    if (command) {
      console.error(`Unknown command: ${command}`);
    }
    showHelp();
    process.exit(1);
}
