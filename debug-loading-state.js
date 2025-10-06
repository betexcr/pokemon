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
  await page.waitForTimeout(2000);

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
  await page.waitForTimeout(3000);

  // Check count after scroll
  const afterScrollCount = await page.evaluate(() => {
    const grid = document.querySelector('[data-pokemon-grid]');
    return grid ? grid.children.length : 0;
  });
  console.log(`📊 After scroll Pokemon count: ${afterScrollCount}`);

  // Check if there are more Pokemon to load
  const hasMore = await page.evaluate(() => {
    // Check if there's a loading indicator
    const loadingIndicator = document.querySelector('[data-testid="loading-more"]');
    const hasLoading = loadingIndicator && loadingIndicator.style.display !== 'none';
    
    // Check if there are skeleton cards
    const skeletonCards = document.querySelectorAll('[data-testid="pokemon-card-skeleton"]');
    
    return {
      hasLoading,
      skeletonCount: skeletonCards.length,
      totalCards: document.querySelector('[data-pokemon-grid]')?.children.length || 0
    };
  });

  console.log('🔍 Loading state:', hasMore);

  // Try to scroll more to see if we can load more
  console.log('📜 Scrolling more to check for additional loading...');
  await page.evaluate(() => {
    const scrollContainer = document.querySelector('.flex-1.min-h-0.overflow-y-auto');
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  });

  await page.waitForTimeout(3000);

  const finalCount = await page.evaluate(() => {
    const grid = document.querySelector('[data-pokemon-grid]');
    return grid ? grid.children.length : 0;
  });
  console.log(`📊 Final Pokemon count: ${finalCount}`);

  // Check the total count from the API
  const totalCount = await page.evaluate(async () => {
    try {
      const response = await fetch('/api/pokemon-list/?limit=1&offset=0');
      const data = await response.json();
      return data.count;
    } catch (error) {
      return 'Error fetching total count';
    }
  });
  console.log(`📊 Total Pokemon count from API: ${totalCount}`);

  await browser.close();
})();
