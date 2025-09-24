const { chromium } = require('playwright');

async function simpleDebug() {
  console.log('🔍 Simple Debug - Opening browser for manual inspection...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('📱 Navigating to main page...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    // Wait for initial page load
    await page.waitForTimeout(3000);
    
    console.log('⚡ Scrolling to Pokemon #700...');
    
    // Find Pokemon #700 and scroll to it
    await page.evaluate(() => {
      const pokemon700 = document.querySelector('[data-pokemon-id="700"]');
      if (pokemon700) {
        pokemon700.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    
    // Wait for scroll to complete
    await page.waitForTimeout(3000);
    
    console.log('🔍 Checking console logs...');
    
    // Get console logs
    const logs = await page.evaluate(() => {
      return window.consoleLogs || [];
    });
    
    console.log('Console logs:', logs);
    
    console.log('⏱️ Waiting 5 more seconds for data to load...');
    console.log('Please check the browser console and network tab manually.');
    console.log('Look for:');
    console.log('1. "Fetching data for Pokemon #700" log');
    console.log('2. "✅ Loaded Pokemon #700" log with types data');
    console.log('3. Network requests to pokeapi.co for Pokemon #700');
    
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ Debug failed with error:', error);
  } finally {
    console.log('Press Ctrl+C to close the browser...');
    // Keep browser open for manual inspection
    await new Promise(() => {});
  }
}

// Run the debug
simpleDebug().catch(console.error);
