# Multiplayer Battle E2E Test - Quick Start

## What Was Created

1. **Test File**: [tests/playwright/complete-multiplayer-flow.spec.ts](tests/playwright/complete-multiplayer-flow.spec.ts)
   - Complete end-to-end test validating multiplayer battles
   - Tests: Login → Team Building → Room Creation → Battle → Victory

2. **Configuration**: [playwright.config.ts](playwright.config.ts)
   - Playwright test configuration
   - Auto-starts dev server
   - Captures screenshots and videos on failure

3. **Documentation**: [tests/playwright/README.md](tests/playwright/README.md)
   - Comprehensive guide on running tests
   - Troubleshooting tips
   - Extension examples

4. **NPM Scripts**: Updated [package.json](package.json)
   - `npm run test:e2e` - Run all E2E tests
   - `npm run test:e2e:multiplayer` - Run multiplayer test only
   - `npm run test:e2e:ui` - Run with interactive UI
   - `npm run test:e2e:debug` - Debug mode
   - `npm run test:e2e:report` - View test report

## Prerequisites Checklist

- [ ] Dev server running on port 3002 (`npm run dev`)
- [ ] Firebase Authentication enabled (email/password)
- [ ] Two test users created in Firebase Auth:
  - `player1@pokemon-test.local` / `TestPlayer1!`
  - `player2@pokemon-test.local` / `TestPlayer2!`
- [ ] Firestore security rules allow authenticated access
- [ ] RTDB configured for battle state storage

## Quick Start

### 1. Install Playwright (if not already installed)

```bash
npm install -D @playwright/test
npx playwright install chromium
```

### 2. Create Test Users in Firebase

**Option A: Firebase Console**
1. Go to Firebase Console → Authentication → Users
2. Click "Add user"
3. Create both test users with the credentials above

**Option B: Firebase CLI**
```bash
# Create a test-users.json file
echo '[
  {
    "email": "player1@pokemon-test.local",
    "emailVerified": true,
    "password": "TestPlayer1!",
    "displayName": "Test Player 1",
    "disabled": false
  },
  {
    "email": "player2@pokemon-test.local",
    "emailVerified": true,
    "password": "TestPlayer2!",
    "displayName": "Test Player 2",
    "disabled": false
  }
]' > test-users.json

# Import users
firebase auth:import test-users.json
```

### 3. Start Dev Server

```bash
npm run dev
# Server starts at http://127.0.0.1:3002
```

### 4. Run the Test

**In a new terminal:**

```bash
# Run the multiplayer test
npm run test:e2e:multiplayer

# OR with UI mode (recommended for first run)
npm run test:e2e:ui
```

## Test Flow

The test executes the following steps:

```
┌─────────────────────────────────────────────┐
│ 1. LOGIN                                    │
│    - Player 1 logs in                       │
│    - Player 2 logs in                       │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 2. BUILD TEAMS                              │
│    - Player 1: Charizard, Blastoise,        │
│                Venusaur (4 moves each)      │
│    - Player 2: Same team                    │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 3. ROOM SETUP                               │
│    - Player 1 creates room                  │
│    - Player 2 joins room                    │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 4. START BATTLE                             │
│    - Both players click "Ready"             │
│    - Player 1 clicks "Start Battle"         │
│    - Battle UI loads                        │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 5. BATTLE EXECUTION                         │
│    Loop until battle ends:                  │
│    - Both players select moves              │
│    - Turn resolves                          │
│    - Verify damage dealt                    │
│    - Check for winner                       │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 6. VERIFY COMPLETION                        │
│    - Check battle end screen                │
│    - Verify winner declared                 │
│    - Capture screenshots                    │
└─────────────────────────────────────────────┘
```

## Expected Output

```bash
Running 1 test using 1 worker

=== STEP 1: LOGIN ===
✅ Logged in as player1@pokemon-test.local
✅ Logged in as player2@pokemon-test.local

=== STEP 2: BUILD TEAMS ===
Player 1: Building team...
Player 1: Adding Charizard to slot 1...
Player 1: Charizard added
Player 1: Selecting moves for Charizard...
Player 1: Added flamethrower
Player 1: Added air-slash
Player 1: Added dragon-claw
Player 1: Added fire-blast
... (similar for other Pokemon)
✅ Player 1: Team built successfully
✅ Player 2: Team built successfully

=== STEP 3: ROOM SETUP ===
✅ Room created: abc123
✅ Joined room: abc123

=== STEP 4: START BATTLE ===
Host marked ready
Guest marked ready
Battle start clicked
✅ Battle started
✅ Battle UI loaded

=== STEP 5: BATTLE EXECUTION ===

--- Turn 1 ---
P1 HP: 150, P2 HP: 150
Player 1 selected flamethrower
Player 2 selected flamethrower
Waiting for turn 2...
✅ Turn 1 resolved
✅ Damage dealt: P1: 150 → 137, P2: 150 → 137

--- Turn 2 ---
... (continues until winner)

=== STEP 6: VERIFY BATTLE COMPLETION ===
✅ Battle completed after 8 turns
✅ Battle end screen displayed

=== TEST COMPLETED SUCCESSFULLY ===

  1 passed (2m 15s)
```

## Viewing Results

### Screenshots

Generated in `test-results/`:
- `player1-battle-end.png` - Player 1 final state
- `player2-battle-end.png` - Player 2 final state
- `player1-failure.png` - If test fails
- `player2-failure.png` - If test fails

### HTML Report

```bash
npm run test:e2e:report
```

Opens interactive HTML report with:
- Test results
- Screenshots
- Videos (if recorded)
- Console logs
- Network activity

## Troubleshooting

### Test users don't exist

**Error**: "Authentication failed"

**Fix**: Create test users in Firebase Authentication

### Team builder not working

**Error**: "Pokemon selector not found"

**Fix**: 
1. Verify `/team` route is accessible
2. Check if Pokemon search is working manually
3. May need to adjust selectors in test

### Battle doesn't start

**Error**: "Start battle button not found"

**Fix**:
1. Ensure both players have complete teams (3+ Pokemon, 4 moves each)
2. Check if both players clicked "Ready"
3. Verify room service is working

### Turns not resolving

**Error**: "Turn counter stuck"

**Fix**:
1. Check RTDB is accessible
2. Verify `resolveTurn` function works
3. Ensure both players submitted moves

## Custom Configuration

### Change Test Credentials

Create a `.env.test` file:

```env
TEST_PLAYER1_EMAIL=myplayer1@test.com
TEST_PLAYER1_PASSWORD=MyPassword1!
TEST_PLAYER2_EMAIL=myplayer2@test.com
TEST_PLAYER2_PASSWORD=MyPassword2!
```

### Change Test Duration

Edit `playwright.config.ts`:

```typescript
timeout: 180_000, // 3 minutes instead of 5
```

### Change Team Composition

Edit the `team` array in `buildTeam()` function in the test file.

## Next Steps

1. **Run the test**: `npm run test:e2e:multiplayer`
2. **Review results**: Check console output and screenshots
3. **Debug issues**: Use `npm run test:e2e:ui` for interactive mode
4. **Extend tests**: Add more scenarios (forfeits, timeouts, etc.)

## Support

For issues or questions:
1. Check [tests/playwright/README.md](tests/playwright/README.md) for detailed docs
2. Review console logs and screenshots in `test-results/`
3. Use `--debug` flag for step-by-step debugging

---

**Test created**: Complete multiplayer battle flow validation  
**Test file**: `tests/playwright/complete-multiplayer-flow.spec.ts`  
**Estimated duration**: 1-3 minutes  
**Firebase required**: Yes (Auth + Firestore + RTDB)
