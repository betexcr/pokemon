const { chromium } = require('playwright');

async function simpleTest() {
  console.log('🔍 Simple test to check component rendering...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Monitor all console logs
    const allLogs = [];
    page.on('console', msg => {
      allLogs.push(`[${msg.type()}] ${msg.text()}`);
    });
    
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    
    console.log('📍 Page loaded');
    
    // Wait for any logs
    await page.waitForTimeout(5000);
    
    // Show all logs
    console.log('\n📝 All console logs:');
    allLogs.forEach(log => console.log(log));
    
    // Check Pokemon count
    const pokemonCount = await page.locator('[data-pokemon-id]').count();
    console.log(`🎯 Pokemon count: ${pokemonCount}`);
    
    // Try scrolling
    console.log('📜 Scrolling...');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(3000);
    
    const newPokemonCount = await page.locator('[data-pokemon-id]').count();
    console.log(`🎯 Pokemon count after scroll: ${newPokemonCount}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

simpleTest().catch(console.error);



