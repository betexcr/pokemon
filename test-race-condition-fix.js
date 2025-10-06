const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Listen to console logs
  page.on('console', msg => {
    if (msg.type() === 'log') {
      console.log('Browser log:', msg.text());
    }
  });

  console.log('🌐 Opening page...');
  await page.goto('http://localhost:3001');

  console.log('⏳ Waiting for page to load...');
  await page.waitForSelector('[data-pokemon-grid]', { timeout: 10000 });

  // Wait a bit for initial load
  await page.waitForTimeout(3000);

  // Check initial state
  const initialCount = await page.evaluate(() => {
    const grid = document.querySelector('[data-pokemon-grid]');
    return grid ? grid.children.length : 0;
  });
  console.log(`📊 Initial Pokemon count: ${initialCount}`);

  // Scroll down to trigger loading
  console.log('📜 Scrolling to trigger loading...');
  await page.evaluate(() => {
    const scrollContainer = document.querySelector('.flex-1.min-h-0.overflow-y-auto');
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  });

  // Wait for loading to complete
  await page.waitForTimeout(5000);

  // Check count after first scroll
  const afterFirstScroll = await page.evaluate(() => {
    const grid = document.querySelector('[data-pokemon-grid]');
    return grid ? grid.children.length : 0;
  });
  console.log(`📊 After first scroll Pokemon count: ${afterFirstScroll}`);

  // Scroll more to trigger additional loading
  console.log('📜 Scrolling more to trigger additional loading...');
  await page.evaluate(() => {
    const scrollContainer = document.querySelector('.flex-1.min-h-0.overflow-y-auto');
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  });

  // Wait for additional loading
  await page.waitForTimeout(5000);

  // Check count after second scroll
  const afterSecondScroll = await page.evaluate(() => {
    const grid = document.querySelector('[data-pokemon-grid]');
    return grid ? grid.children.length : 0;
  });
  console.log(`📊 After second scroll Pokemon count: ${afterSecondScroll}`);

  // Try one more scroll
  console.log('📜 Scrolling one more time...');
  await page.evaluate(() => {
    const scrollContainer = document.querySelector('.flex-1.min-h-0.overflow-y-auto');
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  });

  await page.waitForTimeout(5000);

  const finalCount = await page.evaluate(() => {
    const grid = document.querySelector('[data-pokemon-grid]');
    return grid ? grid.children.length : 0;
  });
  console.log(`📊 Final Pokemon count: ${finalCount}`);

  // Check if we're making progress
  const progress = {
    initial: initialCount,
    afterFirst: afterFirstScroll,
    afterSecond: afterSecondScroll,
    final: finalCount
  };

  console.log('📈 Progress summary:', progress);

  if (finalCount > 300) {
    console.log('✅ SUCCESS: Infinite scroll is working and loading more than 300 Pokemon!');
  } else if (finalCount === 300) {
    console.log('⚠️  PARTIAL: Infinite scroll loaded to 300 Pokemon but not progressing further');
  } else {
    console.log('❌ FAILED: Infinite scroll not working properly');
  }

  await browser.close();
})();


