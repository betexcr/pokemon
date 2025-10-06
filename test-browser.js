const { chromium } = require('playwright');

async function testPokemonList() {
  console.log('🚀 Opening browser to test Pokemon list...');
  
  const browser = await chromium.launch({ 
    headless: false, // Show the browser
    slowMo: 1000 // Slow down actions to see what's happening
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to the Pokemon app
    console.log('📍 Navigating to http://localhost:3001');
    await page.goto('http://localhost:3001');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot to see the initial state
    await page.screenshot({ path: 'initial-load.png' });
    console.log('📸 Screenshot saved: initial-load.png');
    
    // Check if we can see Pokemon cards
    const pokemonCards = await page.locator('[data-pokemon-id]').count();
    console.log(`🎯 Found ${pokemonCards} Pokemon cards`);
    
    // Check for skeleton cards
    const skeletonCards = await page.locator('[data-testid="pokemon-skeleton-grid"]').count();
    console.log(`💀 Found ${skeletonCards} skeleton grids`);
    
    // Try to scroll down to test infinite scroll
    console.log('📜 Scrolling down to test infinite scroll...');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    
    // Check how many Pokemon cards we have after scrolling
    const pokemonCardsAfterScroll = await page.locator('[data-pokemon-id]').count();
    console.log(`🎯 Found ${pokemonCardsAfterScroll} Pokemon cards after scroll`);
    
    // Take another screenshot after scrolling
    await page.screenshot({ path: 'after-scroll.png' });
    console.log('📸 Screenshot saved: after-scroll.png');
    
    // Check for loading indicators
    const loadingIndicators = await page.locator('.animate-spin').count();
    console.log(`⏳ Found ${loadingIndicators} loading indicators`);
    
    // Check for errors in console
    const consoleLogs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleLogs.push(`❌ Console Error: ${msg.text()}`);
      }
    });
    
    // Wait a bit more to catch any errors
    await page.waitForTimeout(3000);
    
    if (consoleLogs.length > 0) {
      console.log('🐛 Console errors found:');
      consoleLogs.forEach(log => console.log(log));
    }
    
    console.log('✅ Browser test completed!');
    
  } catch (error) {
    console.error('❌ Error during browser test:', error);
  } finally {
    // Keep browser open for a bit to see results
    console.log('⏳ Keeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

testPokemonList().catch(console.error);



