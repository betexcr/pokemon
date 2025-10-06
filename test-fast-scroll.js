const { chromium } = require('playwright');

async function testFastScroll() {
  console.log('🚀 Testing fast scroll responsiveness...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 50
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Listen to console logs
  page.on('console', msg => {
    if (msg.text().includes('🔄') || msg.text().includes('📜') || msg.text().includes('⏳')) {
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
    
    // Test fast scrolling down
    console.log('📜 Test 1: Fast scroll down...');
    await page.evaluate(() => {
      const scrollContainer = document.querySelector('.flex-1.min-h-0.overflow-y-auto');
      if (scrollContainer) {
        scrollContainer.scrollTop = 2000;
      }
    });
    
    await page.waitForTimeout(500);
    
    // Test fast scrolling up
    console.log('📜 Test 2: Fast scroll up...');
    await page.evaluate(() => {
      const scrollContainer = document.querySelector('.flex-1.min-h-0.overflow-y-auto');
      if (scrollContainer) {
        scrollContainer.scrollTop = 500;
      }
    });
    
    await page.waitForTimeout(500);
    
    // Test rapid direction changes
    console.log('📜 Test 3: Rapid direction changes...');
    for (let i = 0; i < 5; i++) {
      await page.evaluate((scrollPos) => {
        const scrollContainer = document.querySelector('.flex-1.min-h-0.overflow-y-auto');
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollPos;
        }
      }, i % 2 === 0 ? 1500 : 300);
      
      await page.waitForTimeout(100);
    }
    
    await page.waitForTimeout(1000);
    
    console.log('✅ Fast scroll test completed');
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
  } finally {
    await browser.close();
  }
}

testFastScroll();


