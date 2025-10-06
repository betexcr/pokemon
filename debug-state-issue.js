const { chromium } = require('playwright');

async function debugStateIssue() {
  console.log('🔍 Debugging state management issue...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    
    console.log('📍 Page loaded, monitoring state...');
    
    // Monitor all console logs
    const allLogs = [];
    page.on('console', msg => {
      allLogs.push(`[${msg.type()}] ${msg.text()}`);
    });
    
    // Check initial state
    let pokemonCount = await page.locator('[data-pokemon-id]').count();
    console.log(`🎯 Initial Pokemon count: ${pokemonCount}`);
    
    // Test API directly to see what's available
    console.log('🧪 Testing API at different offsets...');
    for (let offset = 200; offset <= 800; offset += 100) {
      try {
        const apiTest = await page.evaluate(async (offsetValue) => {
          try {
            const response = await fetch(`/api/pokemon-list?limit=100&offset=${offsetValue}`);
            const data = await response.json();
            return {
              offset: offsetValue,
              status: response.status,
              count: data.results ? data.results.length : 0,
              hasNext: !!data.next,
              hasPrevious: !!data.previous
            };
          } catch (error) {
            return { offset: offsetValue, error: error.message };
          }
        }, offset);
        console.log(`📡 API offset ${offset}:`, apiTest);
        
        if (apiTest.error || apiTest.count === 0) {
          console.log(`🛑 API issue at offset ${offset}, stopping test`);
          break;
        }
      } catch (error) {
        console.log(`❌ Error testing offset ${offset}:`, error.message);
      }
    }
    
    // Try scrolling and monitoring state changes
    console.log('\n📜 Testing scroll behavior...');
    for (let i = 0; i < 5; i++) {
      console.log(`📜 Scroll attempt ${i + 1}...`);
      
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(3000);
      
      const newCount = await page.locator('[data-pokemon-id]').count();
      console.log(`🎯 Pokemon count: ${newCount}`);
      
      if (newCount === pokemonCount && i > 1) {
        console.log('🛑 Count not changing, checking for issues...');
        break;
      }
      pokemonCount = newCount;
    }
    
    // Show all relevant console logs
    console.log('\n📝 All console logs:');
    allLogs.filter(log => 
      log.includes('Sentinel triggered') || 
      log.includes('Loading more Pokemon') || 
      log.includes('Loaded') ||
      log.includes('offset=') ||
      log.includes('hasMorePokemon') ||
      log.includes('Reached total') ||
      log.includes('No more Pokemon')
    ).forEach(log => console.log(log));
    
    // Check final state
    const finalCount = await page.locator('[data-pokemon-id]').count();
    console.log(`🎯 Final Pokemon count: ${finalCount}`);
    
  } catch (error) {
    console.error('❌ Error during debug:', error);
  } finally {
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

debugStateIssue().catch(console.error);



