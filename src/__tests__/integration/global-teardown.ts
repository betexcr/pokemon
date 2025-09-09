/**
 * Global Teardown for Integration Tests
 * 
 * This runs once after all tests to:
 * 1. Clean up test data
 * 2. Remove test users
 * 3. Generate test reports
 */

import { execSync } from 'child_process';
import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global test teardown...');
  
  // Clean up test users and data
  try {
    console.log('🗑️  Cleaning up test data...');
    execSync('node scripts/setup-test-users.js cleanup', { stdio: 'inherit' });
    console.log('✅ Test data cleanup completed');
  } catch (error) {
    console.warn('⚠️  Failed to cleanup test data:', error);
    // Don't exit on cleanup failure - tests might have already passed
  }
  
  // Generate test summary
  try {
    const fs = require('fs');
    const path = require('path');
    
    const resultsPath = path.join(process.cwd(), 'test-results', 'results.json');
    
    if (fs.existsSync(resultsPath)) {
      const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
      
      console.log('\n📊 Test Summary:');
      console.log(`  Total Tests: ${results.stats?.total || 0}`);
      console.log(`  Passed: ${results.stats?.passed || 0}`);
      console.log(`  Failed: ${results.stats?.failed || 0}`);
      console.log(`  Skipped: ${results.stats?.skipped || 0}`);
      console.log(`  Duration: ${results.stats?.duration || 0}ms`);
      
      if (results.stats?.failed > 0) {
        console.log('\n❌ Some tests failed. Check the HTML report for details.');
        console.log('📄 HTML Report: test-results/index.html');
      } else {
        console.log('\n🎉 All tests passed!');
      }
    }
  } catch (error) {
    console.warn('⚠️  Could not generate test summary:', error);
  }
  
  console.log('🏁 Global teardown completed');
}

export default globalTeardown;
