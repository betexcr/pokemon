const { chromium } = require('playwright');

async function debugApiCalls() {
  console.log('🔍 Debugging API calls for infinite scroll...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Monitor network requests
    const apiCalls = [];
    page.on('request', request => {
      if (request.url().includes('/api/pokemon-list')) {
        apiCalls.push({
          url: request.url(),
          method: request.method(),
          timestamp: new Date().toISOString()
        });
        console.log(`🌐 API Request: ${request.method()} ${request.url()}`);
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/pokemon-list')) {
        console.log(`📡 API Response: ${response.status()} ${response.url()}`);
      }
    });
    
    // Navigate to the Pokemon app
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    
    console.log('📍 Page loaded, checking initial state...');
    
    // Check initial Pokemon count
    let currentCount = await page.locator('[data-pokemon-id]').count();
    console.log(`🎯 Initial Pokemon count: ${currentCount}`);
    
    // Check for sentinel
    const sentinel = await page.locator('[data-infinite-scroll-sentinel="true"]');
    const sentinelCount = await sentinel.count();
    console.log(`🎯 Sentinel count: ${sentinelCount}`);
    
    if (sentinelCount > 0) {
      // Scroll to sentinel
      console.log('📜 Scrolling to sentinel...');
      await sentinel.first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(3000);
      
      // Check if more Pokemon loaded
      const newCount = await page.locator('[data-pokemon-id]').count();
      console.log(`🎯 Pokemon count after scrolling: ${newCount}`);
      
      // Check for loading indicators
      const loadingIndicators = await page.locator('.animate-spin').count();
      console.log(`⏳ Loading indicators: ${loadingIndicators}`);
    }
    
    // Try to manually trigger scroll multiple times
    for (let i = 0; i < 3; i++) {
      console.log(`📜 Manual scroll attempt ${i + 1}...`);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(2000);
      
      const count = await page.locator('[data-pokemon-id]').count();
      console.log(`🎯 Pokemon count after scroll ${i + 1}: ${count}`);
    }
    
    // Check console messages
    const consoleMessages = [];
    page.on('console', msg => {
      if (msg.type() === 'log' && msg.text().includes('Sentinel triggered')) {
        consoleMessages.push(`🚀 ${msg.text()}`);
      } else if (msg.type() === 'log' && msg.text().includes('Loading more Pokemon')) {
        consoleMessages.push(`📦 ${msg.text()}`);
      } else if (msg.type() === 'error') {
        consoleMessages.push(`❌ ${msg.text()}`);
      }
    });
    
    await page.waitForTimeout(3000);
    
    console.log('\n📝 Relevant console messages:');
    consoleMessages.forEach(msg => console.log(msg));
    
    console.log('\n🌐 API calls made:');
    apiCalls.forEach(call => console.log(`  ${call.method} ${call.url} (${call.timestamp})`));
    
    // Test the API directly
    console.log('\n🧪 Testing API directly...');
    try {
      const apiResponse = await page.evaluate(async () => {
        const response = await fetch('/api/pokemon-list?limit=100&offset=200');
        return {
          status: response.status,
          ok: response.ok,
          data: await response.json()
        };
      });
      console.log(`📡 Direct API test: ${apiResponse.status} ${apiResponse.ok ? 'OK' : 'ERROR'}`);
      if (apiResponse.data && apiResponse.data.results) {
        console.log(`📊 API returned ${apiResponse.data.results.length} Pokemon`);
      }
    } catch (error) {
      console.log(`❌ Direct API test failed: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error during API debug:', error);
  } finally {
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

debugApiCalls().catch(console.error);



