import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Global setup: Preparing test environment');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  try {
    const baseURL = process.env.TEST_BASE_URL || 'http://localhost:3000';
    await page.goto(baseURL, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
    console.log('✅ Test environment ready');
  } catch (error) {
    console.warn('⚠️ Global setup non-fatal error (continuing):', error);
  } finally {
    await browser.close();
  }
}

export default globalSetup;
