const { chromium } = require('playwright');

async function scrollDirectionTest() {
  console.log('🚀 Starting scroll direction test...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 200
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Listen to console logs
  page.on('console', msg => {
    if (msg.text().includes('📜') || msg.text().includes('🔄') || msg.text().includes('🎯')) {
      console.log('🔍 Console:', msg.text());
    }
  });
  
  try {
    console.log('📱 Navigating to localhost:3000...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'domcontentloaded',
      timeout: 10000 
    });
    
    console.log('⏳ Waiting for initial load...');
    await page.waitForTimeout(3000);
    
    // Check initial state
    const initialCount = await page.locator('[data-pokemon-id]').count();
    console.log(`📊 Initial Pokemon count: ${initialCount}`);
    
    // Test scrolling down
    console.log('📜 Testing scroll down...');
    await page.evaluate(() => {
      const scrollContainer = document.querySelector('.flex-1.min-h-0.overflow-y-auto');
      if (scrollContainer) {
        scrollContainer.scrollTop = 1000;
      }
    });
    
    await page.waitForTimeout(2000);
    
    // Test scrolling up
    console.log('📜 Testing scroll up...');
    await page.evaluate(() => {
      const scrollContainer = document.querySelector('.flex-1.min-h-0.overflow-y-auto');
      if (scrollContainer) {
        scrollContainer.scrollTop = 500;
      }
    });
    
    await page.waitForTimeout(2000);
    
    // Test scrolling down again
    console.log('📜 Testing scroll down again...');
    await page.evaluate(() => {
      const scrollContainer = document.querySelector('.flex-1.min-h-0.overflow-y-auto');
      if (scrollContainer) {
        scrollContainer.scrollTop = 1500;
      }
    });
    
    await page.waitForTimeout(2000);
    
    // Test scrolling up again
    console.log('📜 Testing scroll up again...');
    await page.evaluate(() => {
      const scrollContainer = document.querySelector('.flex-1.min-h-0.overflow-y-auto');
      if (scrollContainer) {
        scrollContainer.scrollTop = 200;
      }
    });
    
    await page.waitForTimeout(2000);
    
    // Check final state
    const finalCount = await page.locator('[data-pokemon-id]').count();
    console.log(`📊 Final Pokemon count: ${finalCount}`);
    
    // Take a screenshot
    await page.screenshot({ path: 'scroll-direction-test.png' });
    console.log('📸 Screenshot saved as scroll-direction-test.png');
    
    console.log('✅ Scroll direction test completed');
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
  } finally {
    await browser.close();
  }
}

scrollDirectionTest();
