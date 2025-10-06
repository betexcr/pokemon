const { chromium } = require('playwright');

async function monitorAllLogs() {
  console.log('📝 Monitoring all console logs...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    
    console.log('📍 Page loaded, monitoring all logs...');
    
    // Monitor ALL console logs
    const allLogs = [];
    page.on('console', msg => {
      allLogs.push(`[${msg.type()}] ${msg.text()}`);
    });
    
    // Wait for initial setup
    await page.waitForTimeout(5000);
    
    console.log('📜 Starting scroll test...');
    
    // Try scrolling
    for (let i = 0; i < 3; i++) {
      console.log(`📜 Scroll attempt ${i + 1}...`);
      
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(2000);
      
      const pokemonCount = await page.locator('[data-pokemon-id]').count();
      console.log(`🎯 Pokemon count: ${pokemonCount}`);
    }
    
    // Show all logs
    console.log('\n📝 All console logs:');
    allLogs.forEach(log => console.log(log));
    
    // Check for specific patterns
    const intersectionLogs = allLogs.filter(log => 
      log.includes('Intersection observer triggered') ||
      log.includes('Backup observer triggered') ||
      log.includes('useEffect observer triggered') ||
      log.includes('Sentinel triggered')
    );
    
    const loadingLogs = allLogs.filter(log => 
      log.includes('Loading more Pokemon') ||
      log.includes('Loaded') ||
      log.includes('offset=')
    );
    
    console.log('\n🔍 Intersection observer logs:');
    intersectionLogs.forEach(log => console.log(log));
    
    console.log('\n📦 Loading logs:');
    loadingLogs.forEach(log => console.log(log));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

monitorAllLogs().catch(console.error);



