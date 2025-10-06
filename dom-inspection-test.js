const { chromium } = require('playwright');

async function domInspectionTest() {
  console.log('🔍 Starting DOM inspection test...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('📱 Navigating to localhost:3001...');
    await page.goto('http://localhost:3001', { 
      waitUntil: 'domcontentloaded',
      timeout: 10000 
    });
    
    console.log('⏳ Waiting for initial load...');
    await page.waitForTimeout(5000);
    
    // Check for various Pokemon card selectors
    const selectors = [
      '[data-testid="pokemon-card"]',
      '.pokemon-card',
      '[data-pokemon-id]',
      '.grid > div',
      '.pokemon-grid > div',
      '[role="button"]',
      '.cursor-pointer'
    ];
    
    console.log('🔍 Checking various selectors...');
    for (const selector of selectors) {
      const count = await page.locator(selector).count();
      console.log(`  ${selector}: ${count} elements`);
    }
    
    // Check for sentinel
    const sentinelSelectors = [
      '[data-infinite-scroll-sentinel="true"]',
      '[data-sentinel]',
      '.sentinel',
      '#sentinel'
    ];
    
    console.log('🎯 Checking sentinel selectors...');
    for (const selector of sentinelSelectors) {
      const count = await page.locator(selector).count();
      console.log(`  ${selector}: ${count} elements`);
    }
    
    // Check for loading states
    const loadingSelectors = [
      '[data-testid="loading-skeleton"]',
      '.skeleton',
      '.loading',
      '.animate-pulse'
    ];
    
    console.log('⏳ Checking loading selectors...');
    for (const selector of loadingSelectors) {
      const count = await page.locator(selector).count();
      console.log(`  ${selector}: ${count} elements`);
    }
    
    // Get page content info
    const bodyText = await page.textContent('body');
    const hasPokemon = bodyText.includes('Pokemon') || bodyText.includes('Pokémon');
    console.log(`📝 Page contains Pokemon text: ${hasPokemon}`);
    
    // Check for any divs with Pokemon-related content
    const allDivs = await page.locator('div').count();
    console.log(`📦 Total div elements: ${allDivs}`);
    
    // Look for any elements with Pokemon names or numbers
    const pokemonElements = await page.locator('*:has-text("Bulbasaur"), *:has-text("Charmander"), *:has-text("Squirtle"), *:has-text("#001"), *:has-text("#002"), *:has-text("#003")').count();
    console.log(`🎮 Elements with Pokemon names/numbers: ${pokemonElements}`);
    
    // Take a screenshot
    await page.screenshot({ path: 'dom-inspection-test.png' });
    console.log('📸 Screenshot saved as dom-inspection-test.png');
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
  } finally {
    await browser.close();
  }
}

domInspectionTest();



