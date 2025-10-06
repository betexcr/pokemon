const { chromium } = require('playwright');

async function testScrollDirectionFix() {
  console.log('🚀 Testing scroll direction fix...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Listen to console logs
  page.on('console', msg => {
    if (msg.text().includes('🔄') || msg.text().includes('📜') || msg.text().includes('⚠️')) {
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
    
    // Test 1: Scroll down first
    console.log('📜 Test 1: Scrolling down...');
    await page.evaluate(() => {
      const scrollContainer = document.querySelector('.flex-1.min-h-0.overflow-y-auto');
      if (scrollContainer) {
        scrollContainer.scrollTop = 800;
      }
    });
    
    await page.waitForTimeout(1000);
    
    // Test 2: Scroll up (should trigger direction change)
    console.log('📜 Test 2: Scrolling up (should trigger direction change)...');
    await page.evaluate(() => {
      const scrollContainer = document.querySelector('.flex-1.min-h-0.overflow-y-auto');
      if (scrollContainer) {
        scrollContainer.scrollTop = 400;
      }
    });
    
    await page.waitForTimeout(1000);
    
    // Test 3: Scroll down again (should trigger direction change)
    console.log('📜 Test 3: Scrolling down again (should trigger direction change)...');
    await page.evaluate(() => {
      const scrollContainer = document.querySelector('.flex-1.min-h-0.overflow-y-auto');
      if (scrollContainer) {
        scrollContainer.scrollTop = 1200;
      }
    });
    
    await page.waitForTimeout(1000);
    
    // Test 4: Scroll up again (should trigger direction change)
    console.log('📜 Test 4: Scrolling up again (should trigger direction change)...');
    await page.evaluate(() => {
      const scrollContainer = document.querySelector('.flex-1.min-h-0.overflow-y-auto');
      if (scrollContainer) {
        scrollContainer.scrollTop = 100;
      }
    });
    
    await page.waitForTimeout(1000);
    
    console.log('✅ Scroll direction fix test completed');
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
  } finally {
    await browser.close();
  }
}

testScrollDirectionFix();



