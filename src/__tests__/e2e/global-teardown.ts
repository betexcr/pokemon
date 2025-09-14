import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Global teardown: Cleaning up test environment');
  
  // Clean up any test data if needed
  // For now, just log completion
  console.log('✅ Test environment cleaned up');
}

export default globalTeardown;
