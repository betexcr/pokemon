import { test, expect, Page, BrowserContext } from '@playwright/test';

test.describe('Visual Battle Demo', () => {
  let hostContext: BrowserContext;
  let guestContext: BrowserContext;
  let hostPage: Page;
  let guestPage: Page;

  test.beforeAll(async ({ browser }) => {
    console.log('🎮 Setting up visual battle demo');
    
    hostContext = await browser.newContext();
    guestContext = await browser.newContext();
    
    hostPage = await hostContext.newPage();
    guestPage = await guestContext.newPage();
    
    // Enable console logging
    hostPage.on('console', msg => console.log(`HOST: ${msg.text()}`));
    guestPage.on('console', msg => console.log(`GUEST: ${msg.text()}`));
  });

  test.afterAll(async () => {
    console.log('🧹 Cleaning up visual battle demo');
    await hostContext?.close();
    await guestContext?.close();
  });

  test('Visual Pokemon Battle with Real UI', async () => {
    console.log('🎮 Starting visual Pokemon battle demo');
    
    // Step 1: Navigate to the app
    console.log('\n📱 Step 1: Loading Pokemon app');
    await hostPage.goto('/');
    await guestPage.goto('/');
    
    // Wait for the app to load
    await hostPage.waitForLoadState('networkidle');
    await guestPage.waitForLoadState('networkidle');
    
    // Wait a bit for Pokemon to load
    await hostPage.waitForTimeout(3000);
    await guestPage.waitForTimeout(3000);
    
    console.log('✅ Both pages loaded successfully');
    
    // Step 2: Navigate to lobby to create a room
    console.log('\n🏠 Step 2: Creating battle room');
    
    // Click on Lobby button or navigate directly
    await hostPage.goto('/lobby');
    await hostPage.waitForLoadState('networkidle');
    
    // Wait for lobby to load
    await hostPage.waitForTimeout(2000);
    
    console.log('✅ Lobby loaded');
    
    // Step 3: Create a room (if there's a create room button)
    try {
      // Look for create room button
      const createRoomButton = hostPage.locator('button:has-text("Create Room")').first();
      if (await createRoomButton.isVisible()) {
        await createRoomButton.click();
        console.log('✅ Create room button clicked');
      } else {
        console.log('ℹ️ No create room button found, using direct navigation');
      }
    } catch (error) {
      console.log('ℹ️ Create room button not found, continuing with direct navigation');
    }
    
    // Wait for room creation
    await hostPage.waitForTimeout(2000);
    
    // Get the current URL to see if we're in a room
    const currentUrl = hostPage.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    // Step 4: Have guest join the room
    console.log('\n👥 Step 3: Guest joining room');
    
    if (currentUrl.includes('/lobby/')) {
      // Extract room ID from URL
      const roomId = currentUrl.split('/lobby/')[1];
      console.log(`🏠 Room ID: ${roomId}`);
      
      // Guest joins the room
      await guestPage.goto(`/lobby/${roomId}`);
      await guestPage.waitForLoadState('networkidle');
      await guestPage.waitForTimeout(2000);
      
      console.log('✅ Guest joined the room');
    } else {
      console.log('ℹ️ No room ID found, both players will stay in lobby');
    }
    
    // Step 5: Look for team selection and battle elements
    console.log('\n🎯 Step 4: Looking for battle UI elements');
    
    // Take screenshots to see what's visible
    await hostPage.screenshot({ path: 'test-results/host-lobby.png', fullPage: true });
    await guestPage.screenshot({ path: 'test-results/guest-lobby.png', fullPage: true });
    
    console.log('📸 Screenshots taken: host-lobby.png, guest-lobby.png');
    
    // Step 6: Try to find and interact with battle-related elements
    console.log('\n⚔️ Step 5: Looking for battle elements');
    
    // Look for common battle UI elements
    const battleElements = [
      'button:has-text("Start Battle")',
      'button:has-text("Ready")',
      'button:has-text("Battle")',
      '[data-testid="start-battle-button"]',
      '[data-testid="ready-button"]',
      'select',
      'button',
      '.pokemon',
      '.team',
      '.battle'
    ];
    
    for (const selector of battleElements) {
      try {
        const element = hostPage.locator(selector).first();
        if (await element.isVisible()) {
          console.log(`✅ Found element: ${selector}`);
          
          // Try to click if it's a button
          if (selector.includes('button') || selector.includes('Button')) {
            try {
              await element.click();
              console.log(`🖱️ Clicked: ${selector}`);
              await hostPage.waitForTimeout(1000);
            } catch (error) {
              console.log(`⚠️ Could not click ${selector}: ${error.message}`);
            }
          }
        }
      } catch (error) {
        // Element not found, continue
      }
    }
    
    // Step 7: Navigate to battle runtime if possible
    console.log('\n🎮 Step 6: Attempting to start battle');
    
    // Try to navigate to battle runtime with a test battle ID
    const testBattleId = `visual-test-${Date.now()}`;
    
    await hostPage.goto(`/battle/runtime?battleId=${testBattleId}&host=true`);
    await guestPage.goto(`/battle/runtime?battleId=${testBattleId}&host=false`);
    
    await hostPage.waitForLoadState('networkidle');
    await guestPage.waitForLoadState('networkidle');
    
    // Wait for battle page to load
    await hostPage.waitForTimeout(3000);
    await guestPage.waitForTimeout(3000);
    
    // Take screenshots of battle pages
    await hostPage.screenshot({ path: 'test-results/host-battle.png', fullPage: true });
    await guestPage.screenshot({ path: 'test-results/guest-battle.png', fullPage: true });
    
    console.log('📸 Battle screenshots taken: host-battle.png, guest-battle.png');
    
    // Step 8: Look for any visible content on battle pages
    console.log('\n🔍 Step 7: Analyzing battle page content');
    
    const pageTitle = await hostPage.title();
    console.log(`📄 Host page title: ${pageTitle}`);
    
    const guestPageTitle = await guestPage.title();
    console.log(`📄 Guest page title: ${guestPageTitle}`);
    
    // Check for any visible text content
    const hostBodyText = await hostPage.locator('body').textContent();
    const guestBodyText = await guestPage.locator('body').textContent();
    
    console.log(`📝 Host page content length: ${hostBodyText?.length || 0} characters`);
    console.log(`📝 Guest page content length: ${guestBodyText?.length || 0} characters`);
    
    if (hostBodyText && hostBodyText.length > 100) {
      console.log(`📝 Host page preview: ${hostBodyText.substring(0, 200)}...`);
    }
    
    if (guestBodyText && guestBodyText.length > 100) {
      console.log(`📝 Guest page preview: ${guestBodyText.substring(0, 200)}...`);
    }
    
    // Step 9: Try to interact with any visible elements
    console.log('\n🎮 Step 8: Trying to interact with battle elements');
    
    // Look for any clickable elements
    const clickableElements = await hostPage.locator('button, a, [onclick], [role="button"]').all();
    console.log(`🖱️ Found ${clickableElements.length} clickable elements on host page`);
    
    const guestClickableElements = await guestPage.locator('button, a, [onclick], [role="button"]').all();
    console.log(`🖱️ Found ${guestClickableElements.length} clickable elements on guest page`);
    
    // Try clicking a few elements to see if anything happens
    for (let i = 0; i < Math.min(3, clickableElements.length); i++) {
      try {
        const element = clickableElements[i];
        const text = await element.textContent();
        console.log(`🖱️ Trying to click element ${i + 1}: "${text}"`);
        
        await element.click();
        await hostPage.waitForTimeout(1000);
        
        // Take screenshot after click
        await hostPage.screenshot({ path: `test-results/host-after-click-${i + 1}.png`, fullPage: true });
        console.log(`📸 Screenshot taken after click ${i + 1}`);
      } catch (error) {
        console.log(`⚠️ Could not click element ${i + 1}: ${error.message}`);
      }
    }
    
    // Step 10: Final verification
    console.log('\n✅ Step 9: Final verification');
    
    // Verify both pages are still responsive
    await expect(hostPage.locator('body')).toBeVisible();
    await expect(guestPage.locator('body')).toBeVisible();
    
    console.log('🎉 Visual battle demo completed successfully!');
    console.log('📸 Check the test-results/ folder for screenshots');
    
    // Keep browsers open for a moment to see the final state
    await hostPage.waitForTimeout(5000);
    await guestPage.waitForTimeout(5000);
  });
});
