const { chromium } = require('playwright');

async function testCurrentState() {
  console.log('🔍 Testing current state of Pokemon list...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to the Pokemon app
    console.log('📍 Navigating to http://localhost:3001');
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    
    // Take initial screenshot
    await page.screenshot({ path: 'current-state-initial.png' });
    console.log('📸 Initial screenshot saved');
    
    // Check initial Pokemon count
    let pokemonCount = await page.locator('[data-pokemon-id]').count();
    console.log(`🎯 Initial Pokemon count: ${pokemonCount}`);
    
    // Check for sentinel element
    const sentinel = await page.locator('[data-infinite-scroll-sentinel="true"]');
    const sentinelCount = await sentinel.count();
    console.log(`🎯 Sentinel elements found: ${sentinelCount}`);
    
    if (sentinelCount > 0) {
      const sentinelVisible = await sentinel.first().isVisible();
      console.log(`👁️ Sentinel is visible: ${sentinelVisible}`);
      
      if (sentinelVisible) {
        // Get sentinel position
        const sentinelBox = await sentinel.first().boundingBox();
        console.log(`📍 Sentinel position:`, sentinelBox);
        
        // Scroll to sentinel
        console.log('📜 Scrolling to sentinel...');
        await sentinel.first().scrollIntoViewIfNeeded();
        await page.waitForTimeout(3000);
        
        // Check count after scrolling to sentinel
        pokemonCount = await page.locator('[data-pokemon-id]').count();
        console.log(`🎯 Pokemon count after scrolling to sentinel: ${pokemonCount}`);
        
        // Take screenshot after scrolling to sentinel
        await page.screenshot({ path: 'current-state-after-sentinel.png' });
        console.log('📸 Screenshot after sentinel scroll saved');
      }
    }
    
    // Try multiple scroll attempts
    console.log('📜 Trying multiple scroll attempts...');
    for (let i = 0; i < 5; i++) {
      console.log(`📜 Scroll attempt ${i + 1}...`);
      
      // Scroll to bottom
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(2000);
      
      // Check count
      pokemonCount = await page.locator('[data-pokemon-id]').count();
      console.log(`🎯 Pokemon count after scroll ${i + 1}: ${pokemonCount}`);
      
      // Check for loading indicators
      const loadingCount = await page.locator('.animate-spin').count();
      console.log(`⏳ Loading indicators: ${loadingCount}`);
      
      if (loadingCount > 0) {
        console.log('⏳ Waiting for loading to complete...');
        await page.waitForTimeout(3000);
      }
    }
    
    // Final count and screenshot
    const finalCount = await page.locator('[data-pokemon-id]').count();
    console.log(`🎯 Final Pokemon count: ${finalCount}`);
    
    await page.screenshot({ path: 'current-state-final.png' });
    console.log('📸 Final screenshot saved');
    
    // Check console for any errors or logs
    const consoleMessages = [];
    page.on('console', msg => {
      if (msg.type() === 'log' && (msg.text().includes('Sentinel triggered') || msg.text().includes('Loading more Pokemon'))) {
        consoleMessages.push(`📝 ${msg.text()}`);
      } else if (msg.type() === 'error') {
        consoleMessages.push(`❌ ERROR: ${msg.text()}`);
      }
    });
    
    await page.waitForTimeout(2000);
    
    if (consoleMessages.length > 0) {
      console.log('\n📝 Console messages:');
      consoleMessages.forEach(msg => console.log(msg));
    }
    
    // Test API directly
    console.log('\n🧪 Testing API directly...');
    try {
      const apiTest = await page.evaluate(async () => {
        try {
          const response = await fetch('/api/pokemon-list?limit=100&offset=200');
          const data = await response.json();
          return {
            status: response.status,
            ok: response.ok,
            count: data.results ? data.results.length : 0,
            hasNext: !!data.next
          };
        } catch (error) {
          return { error: error.message };
        }
      });
      console.log(`📡 API test result:`, apiTest);
    } catch (error) {
      console.log(`❌ API test failed: ${error.message}`);
    }
    
    console.log('\n✅ Test completed!');
    
    if (finalCount > 200) {
      console.log('🎉 SUCCESS: More than 200 Pokemon loaded!');
    } else {
      console.log('❌ ISSUE: Only 200 Pokemon loaded - infinite scroll not working');
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    console.log('⏳ Keeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

testCurrentState().catch(console.error);



