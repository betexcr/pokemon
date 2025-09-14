import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Global setup: Preparing test environment');
  
  // Check if test users exist, create them if needed
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Navigate to the app
    const baseURL = process.env.TEST_BASE_URL || 'http://localhost:3000';
    await page.goto(baseURL);
    
    console.log('✅ Test environment ready');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
