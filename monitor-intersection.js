const { chromium } = require('playwright');

async function monitorIntersection() {
  console.log('🔍 Monitoring intersection observer behavior...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    
    console.log('📍 Page loaded, monitoring intersection...');
    
    // Monitor all console logs
    const intersectionLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('Intersection observer triggered') || 
          text.includes('Backup observer triggered') ||
          text.includes('useEffect observer triggered') ||
          text.includes('Sentinel triggered') ||
          text.includes('Loading more Pokemon')) {
        intersectionLogs.push(`[${new Date().toISOString()}] ${text}`);
      }
    });
    
    // Wait for initial setup
    await page.waitForTimeout(3000);
    
    console.log('📜 Starting scroll test...');
    
    // Try multiple scroll attempts
    for (let i = 0; i < 10; i++) {
      console.log(`📜 Scroll attempt ${i + 1}...`);
      
      // Scroll to bottom
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(2000);
      
      // Check Pokemon count
      const pokemonCount = await page.locator('[data-pokemon-id]').count();
      console.log(`🎯 Pokemon count: ${pokemonCount}`);
      
      // Check if count changed
      if (i === 0) {
        var initialCount = pokemonCount;
      } else if (pokemonCount > initialCount) {
        console.log('🎉 Pokemon count increased!');
        break;
      }
    }
    
    // Show intersection logs
    console.log('\n📝 Intersection observer logs:');
    intersectionLogs.forEach(log => console.log(log));
    
    // Final count
    const finalCount = await page.locator('[data-pokemon-id]').count();
    console.log(`🎯 Final Pokemon count: ${finalCount}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

monitorIntersection().catch(console.error);



