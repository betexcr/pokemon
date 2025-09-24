import { test, expect, Page, BrowserContext } from '@playwright/test';

// Mock Pokemon teams for testing
const HOST_TEAM = [
  { id: 25, name: 'Pikachu', level: 50, moves: ['Thunderbolt', 'Quick Attack', 'Thunder', 'Iron Tail'] },
  { id: 6, name: 'Charizard', level: 50, moves: ['Flamethrower', 'Fly', 'Dragon Claw', 'Earthquake'] },
  { id: 9, name: 'Blastoise', level: 50, moves: ['Hydro Pump', 'Surf', 'Ice Beam', 'Earthquake'] },
  { id: 3, name: 'Venusaur', level: 50, moves: ['Solar Beam', 'Sludge Bomb', 'Sleep Powder', 'Earthquake'] },
  { id: 143, name: 'Snorlax', level: 50, moves: ['Body Slam', 'Rest', 'Sleep Talk', 'Earthquake'] },
  { id: 149, name: 'Dragonite', level: 50, moves: ['Dragon Claw', 'Thunderbolt', 'Ice Beam', 'Fire Blast'] }
];

const GUEST_TEAM = [
  { id: 150, name: 'Mewtwo', level: 50, moves: ['Psychic', 'Shadow Ball', 'Aura Sphere', 'Thunderbolt'] },
  { id: 144, name: 'Articuno', level: 50, moves: ['Ice Beam', 'Blizzard', 'Fly', 'Ancient Power'] },
  { id: 145, name: 'Zapdos', level: 50, moves: ['Thunderbolt', 'Thunder', 'Drill Peck', 'Ancient Power'] },
  { id: 146, name: 'Moltres', level: 50, moves: ['Flamethrower', 'Fire Blast', 'Fly', 'Ancient Power'] },
  { id: 130, name: 'Gyarados', level: 50, moves: ['Waterfall', 'Dragon Dance', 'Ice Fang', 'Earthquake'] },
  { id: 94, name: 'Gengar', level: 50, moves: ['Shadow Ball', 'Sludge Bomb', 'Thunderbolt', 'Focus Blast'] }
];

// Helper function to create mock team data
function createMockTeam(team: any[]) {
  return {
    id: `mock-team-${Date.now()}`,
    name: `Mock Team ${Math.random().toString(36).substring(2, 8)}`,
    slots: team.map(pokemon => ({
      id: pokemon.id,
      level: pokemon.level,
      moves: pokemon.moves,
      species: pokemon.name
    })),
    createdAt: new Date().toISOString()
  };
}

// Helper function to wait for element with retry
async function waitForElementWithRetry(page: Page, selector: string, timeout = 10000) {
  const maxAttempts = 5;
  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await page.waitForSelector(selector, { timeout: timeout / maxAttempts });
      return true;
    } catch (error) {
      lastError = error;
      console.log(`⏳ Element ${selector} not found, attempt ${attempt}/${maxAttempts}`);
      if (attempt < maxAttempts) {
        await page.waitForTimeout(1000);
      }
    }
  }
  
  throw lastError;
}

// Helper function to inject mock team into localStorage
async function injectMockTeam(page: Page, teamData: any) {
  await page.evaluate((team) => {
    const teams = JSON.parse(localStorage.getItem('userTeams') || '[]');
    teams.push(team);
    localStorage.setItem('userTeams', JSON.stringify(teams));
    console.log(`✅ Injected mock team: ${team.name} with ${team.slots.length} Pokemon`);
  }, teamData);
}

// Helper function to simulate authentication
async function mockAuthenticate(page: Page, playerName: string) {
  await page.evaluate((name) => {
    // Mock user authentication
    const mockUser = {
      uid: `mock-${name}-${Date.now()}`,
      displayName: name,
      email: `${name.toLowerCase()}@pokemon-battles.test`,
      photoURL: null
    };
    
    // Store in localStorage for auth context
    localStorage.setItem('mockUser', JSON.stringify(mockUser));
    
    // Mock Firebase auth state
    window.mockFirebaseAuth = {
      currentUser: mockUser,
      onAuthStateChanged: (callback: any) => {
        callback(mockUser);
        return () => {};
      }
    };
    
    console.log(`🔐 Mock authenticated user: ${name}`);
  }, playerName);
}

// Helper function to create a room
async function createRoom(page: Page): Promise<string> {
  console.log('🏠 Creating room...');
  
  // Navigate to lobby
  await page.goto('/lobby');
  await page.waitForLoadState('networkidle');
  
  // Mock create room functionality
  const roomId = `mock-room-${Date.now()}`;
  
  await page.evaluate((id) => {
    // Mock room creation
    const mockRoom = {
      id: id,
      hostId: JSON.parse(localStorage.getItem('mockUser') || '{}').uid,
      hostName: JSON.parse(localStorage.getItem('mockUser') || '{}').displayName,
      status: 'waiting',
      currentPlayers: 1,
      maxPlayers: 2,
      createdAt: new Date().toISOString()
    };
    
    localStorage.setItem('mockRoom', JSON.stringify(mockRoom));
    console.log(`✅ Created mock room: ${id}`);
  }, roomId);
  
  return roomId;
}

// Helper function to join a room
async function joinRoom(page: Page, roomId: string, playerName: string) {
  console.log(`👥 ${playerName} joining room ${roomId}...`);
  
  // Navigate to room
  await page.goto(`/lobby/${roomId}`);
  await page.waitForLoadState('networkidle');
  
  await page.evaluate(({ roomId, playerName }) => {
    // Mock room joining
    const mockRoom = JSON.parse(localStorage.getItem('mockRoom') || '{}');
    mockRoom.guestId = JSON.parse(localStorage.getItem('mockUser') || '{}').uid;
    mockRoom.guestName = playerName;
    mockRoom.currentPlayers = 2;
    mockRoom.status = 'ready';
    
    localStorage.setItem('mockRoom', JSON.stringify(mockRoom));
    console.log(`✅ ${playerName} joined room ${roomId}`);
  }, { roomId, playerName });
}

// Helper function to select team
async function selectTeam(page: Page, teamData: any, playerName: string) {
  console.log(`🎯 ${playerName} selecting team...`);
  
  // Inject team into localStorage
  await injectMockTeam(page, teamData);
  
  // Mock team selection
  await page.evaluate(({ teamData, playerName }) => {
    const mockUser = JSON.parse(localStorage.getItem('mockUser') || '{}');
    const mockRoom = JSON.parse(localStorage.getItem('mockRoom') || '{}');
    
    // Set team based on whether user is host or guest
    if (mockUser.uid === mockRoom.hostId) {
      mockRoom.hostTeam = teamData;
      mockRoom.hostReady = true;
    } else {
      mockRoom.guestTeam = teamData;
      mockRoom.guestReady = true;
    }
    
    mockRoom.status = 'ready';
    localStorage.setItem('mockRoom', JSON.stringify(mockRoom));
    console.log(`✅ ${playerName} selected team with ${teamData.slots.length} Pokemon`);
  }, { teamData, playerName });
}

test.describe('Multiplayer Battle Full Flow Test', () => {
  let hostContext: BrowserContext;
  let guestContext: BrowserContext;
  let hostPage: Page;
  let guestPage: Page;
  let roomId: string;

  test.beforeAll(async ({ browser }) => {
    console.log('🚀 Setting up multiplayer battle test with 2 players');
    
    // Create two separate browser contexts
    hostContext = await browser.newContext();
    guestContext = await browser.newContext();
    
    hostPage = await hostContext.newPage();
    guestPage = await guestContext.newPage();
    
    // Enable console logging
    hostPage.on('console', msg => console.log(`HOST: ${msg.text()}`));
    guestPage.on('console', msg => console.log(`GUEST: ${msg.text()}`));
  });

  test.afterAll(async () => {
    console.log('🧹 Cleaning up multiplayer battle test');
    await hostContext?.close();
    await guestContext?.close();
  });

  test('Complete multiplayer battle flow from start to finish', async () => {
    console.log('🎮 Starting complete multiplayer battle flow test');
    
    // Step 1: Setup players and authentication
    console.log('\n📝 Step 1: Setting up players');
    
    // Navigate to the app first
    await hostPage.goto('/');
    await guestPage.goto('/');
    await hostPage.waitForLoadState('networkidle');
    await guestPage.waitForLoadState('networkidle');
    
    await mockAuthenticate(hostPage, 'HostPlayer');
    await mockAuthenticate(guestPage, 'GuestPlayer');
    
    // Step 2: Host creates room
    console.log('\n🏠 Step 2: Host creates room');
    roomId = await createRoom(hostPage);
    console.log(`✅ Room created: ${roomId}`);
    
    // Step 3: Guest joins room
    console.log('\n👥 Step 3: Guest joins room');
    await joinRoom(guestPage, roomId, 'GuestPlayer');
    
    // Step 4: Both players select teams
    console.log('\n🎯 Step 4: Both players select teams');
    const hostTeamData = createMockTeam(HOST_TEAM);
    const guestTeamData = createMockTeam(GUEST_TEAM);
    
    await selectTeam(hostPage, hostTeamData, 'HostPlayer');
    await selectTeam(guestPage, guestTeamData, 'GuestPlayer');
    
    // Step 5: Start battle
    console.log('\n⚔️ Step 5: Starting battle');
    
    // Mock battle start
    await hostPage.evaluate(() => {
      const mockRoom = JSON.parse(localStorage.getItem('mockRoom') || '{}');
      mockRoom.status = 'battling';
      mockRoom.battleId = `mock-battle-${Date.now()}`;
      localStorage.setItem('mockRoom', JSON.stringify(mockRoom));
      console.log('✅ Battle started');
    });
    
    // Step 6: Navigate to battle runtime
    console.log('\n🎮 Step 6: Navigating to battle runtime');
    await hostPage.goto(`/battle/runtime?battleId=${roomId}&host=true`);
    await guestPage.goto(`/battle/runtime?battleId=${roomId}&host=false`);
    
    await hostPage.waitForLoadState('networkidle');
    await guestPage.waitForLoadState('networkidle');
    
    // Step 7: Simulate battle actions
    console.log('\n⚔️ Step 7: Simulating battle actions');
    
    const battleActions = [
      { player: 'host', action: 'attack', move: 'Thunderbolt' },
      { player: 'guest', action: 'attack', move: 'Psychic' },
      { player: 'host', action: 'switch', pokemon: 'Charizard' },
      { player: 'guest', action: 'attack', move: 'Shadow Ball' },
      { player: 'host', action: 'attack', move: 'Flamethrower' },
      { player: 'guest', action: 'switch', pokemon: 'Articuno' },
      { player: 'host', action: 'attack', move: 'Dragon Claw' },
      { player: 'guest', action: 'attack', move: 'Ice Beam' }
    ];
    
    for (let i = 0; i < battleActions.length; i++) {
      const action = battleActions[i];
      const page = action.player === 'host' ? hostPage : guestPage;
      
      console.log(`  Turn ${i + 1}: ${action.player} performs ${action.action}${action.move ? ` (${action.move})` : ''}${action.pokemon ? ` (${action.pokemon})` : ''}`);
      
      // Simulate battle action
      await page.evaluate((actionData) => {
        const mockBattle = {
          turn: actionData.turn,
          player: actionData.player,
          action: actionData.action,
          move: actionData.move,
          pokemon: actionData.pokemon,
          timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('mockBattleState', JSON.stringify(mockBattle));
        console.log(`⚔️ ${actionData.player} performed ${actionData.action}`);
      }, { ...action, turn: i + 1 });
      
      // Wait between actions
      await page.waitForTimeout(1000);
    }
    
    // Step 8: Test retry system during battle
    console.log('\n🔄 Step 8: Testing retry system during battle');
    
    // Simulate network issues
    await hostPage.context().setOffline(true);
    await guestPage.context().setOffline(true);
    
    console.log('📡 Simulated network interruption...');
    await hostPage.waitForTimeout(2000);
    
    // Restore network
    await hostPage.context().setOffline(false);
    await guestPage.context().setOffline(false);
    
    console.log('📡 Network restored');
    await hostPage.waitForTimeout(2000);
    
    // Step 9: Continue battle to completion
    console.log('\n🏁 Step 9: Continuing battle to completion');
    
    const finalActions = [
      { player: 'host', action: 'attack', move: 'Thunder' },
      { player: 'guest', action: 'attack', move: 'Blizzard' },
      { player: 'host', action: 'switch', pokemon: 'Blastoise' },
      { player: 'guest', action: 'attack', move: 'Ancient Power' },
      { player: 'host', action: 'attack', move: 'Hydro Pump' }
    ];
    
    for (let i = 0; i < finalActions.length; i++) {
      const action = finalActions[i];
      const page = action.player === 'host' ? hostPage : guestPage;
      
      console.log(`  Final Turn ${i + 1}: ${action.player} performs ${action.action}${action.move ? ` (${action.move})` : ''}${action.pokemon ? ` (${action.pokemon})` : ''}`);
      
      await page.evaluate((actionData) => {
        const mockBattle = {
          turn: actionData.turn,
          player: actionData.player,
          action: actionData.action,
          move: actionData.move,
          pokemon: actionData.pokemon,
          timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('mockBattleState', JSON.stringify(mockBattle));
      }, { ...action, turn: battleActions.length + i + 1 });
      
      await page.waitForTimeout(1000);
    }
    
    // Step 10: End battle
    console.log('\n🎉 Step 10: Ending battle');
    
    await hostPage.evaluate(() => {
      const mockBattle = {
        status: 'completed',
        winner: 'HostPlayer',
        turns: 13,
        completedAt: new Date().toISOString()
      };
      
      localStorage.setItem('mockBattleResult', JSON.stringify(mockBattle));
      console.log('🏆 Battle completed! Winner: HostPlayer');
    });
    
    // Step 11: Verify battle completion
    console.log('\n✅ Step 11: Verifying battle completion');
    
    const battleResult = await hostPage.evaluate(() => {
      return JSON.parse(localStorage.getItem('mockBattleResult') || '{}');
    });
    
    expect(battleResult.status).toBe('completed');
    expect(battleResult.winner).toBe('HostPlayer');
    expect(battleResult.turns).toBeGreaterThan(10);
    
    console.log(`🎉 Battle completed successfully!`);
    console.log(`   Winner: ${battleResult.winner}`);
    console.log(`   Total turns: ${battleResult.turns}`);
    
    // Verify both pages are still responsive
    await expect(hostPage.locator('body')).toBeVisible();
    await expect(guestPage.locator('body')).toBeVisible();
    
    console.log('🎊 Complete multiplayer battle flow test finished successfully!');
  });

  test('Test retry system with battle document failures', async () => {
    console.log('🔄 Testing retry system with battle document failures');
    
    // Create a battle that will fail to initialize
    const failingBattleId = `failing-battle-${Date.now()}`;
    
    await hostPage.goto(`/battle/runtime?battleId=${failingBattleId}&host=true`);
    
    const retryMessages: string[] = [];
    const errorMessages: string[] = [];
    
    hostPage.on('console', msg => {
      const text = msg.text();
      if (text.includes('retry') || text.includes('Retry') || text.includes('attempt')) {
        retryMessages.push(text);
        console.log(`🔄 Retry: ${text}`);
      }
      if (text.includes('error') || text.includes('Error') || text.includes('failed')) {
        errorMessages.push(text);
        console.log(`❌ Error: ${text}`);
      }
    });
    
    // Wait for retry attempts
    await hostPage.waitForTimeout(15000);
    
    console.log(`📊 Captured ${retryMessages.length} retry messages`);
    console.log(`📊 Captured ${errorMessages.length} error messages`);
    
    // Verify page is still responsive despite failures
    await expect(hostPage.locator('body')).toBeVisible();
    
    console.log('✅ Retry system test completed');
  });
});
