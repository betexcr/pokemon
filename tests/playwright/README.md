# Multiplayer Battle E2E Tests

This directory contains end-to-end tests for the Pokemon battle application, specifically testing the complete multiplayer battle flow.

## Test Overview

### `complete-multiplayer-flow.spec.ts`

This comprehensive test validates the entire user journey from login to battle completion:

1. **Authentication**: Two users login with credentials
2. **Team Building**: Each user creates a 3-Pokemon team with 4 moves each
   - Player 1: Charizard, Blastoise, Venusaur
   - Player 2: Charizard, Blastoise, Venusaur
3. **Room Creation**: Player 1 creates a battle room
4. **Room Join**: Player 2 joins the room
5. **Battle Start**: Both players ready up and start the battle
6. **Battle Execution**: Players exchange moves turn-by-turn until one wins
7. **Completion Verification**: Confirms battle ended with a winner

## Prerequisites

### 1. Firebase Setup

Ensure Firebase is configured with:
- **Authentication**: Email/password enabled
- **Firestore**: Security rules allow authenticated reads/writes
- **Realtime Database**: Battle state storage configured

### 2. Test Users

Create two test users in Firebase Authentication:

```bash
# Default test accounts (or set via environment variables)
Player 1: player1@pokemon-test.local / TestPlayer1!
Player 2: player2@pokemon-test.local / TestPlayer2!
```

**Option A**: Create via Firebase Console
- Go to Firebase Console → Authentication
- Add users manually

**Option B**: Create via Firebase CLI
```bash
firebase auth:import test-users.json
```

### 3. Development Server

The dev server must be running on port 3002:

```bash
npm run dev
# Runs on http://127.0.0.1:3002
```

## Running Tests

### Run All Playwright Tests

```bash
npx playwright test
```

### Run Only Multiplayer Flow Test

```bash
npx playwright test complete-multiplayer-flow
```

### Run with UI Mode (Interactive)

```bash
npx playwright test --ui
```

### Run in Debug Mode

```bash
npx playwright test --debug
```

### Generate Test Report

```bash
npx playwright show-report test-results/playwright-report
```

## Environment Variables

Override default test configuration with environment variables:

```bash
# Base URL
BASE_URL=http://localhost:3002

# Player 1 credentials
TEST_PLAYER1_EMAIL=player1@pokemon-test.local
TEST_PLAYER1_PASSWORD=TestPlayer1!

# Player 2 credentials
TEST_PLAYER2_EMAIL=player2@pokemon-test.local
TEST_PLAYER2_PASSWORD=TestPlayer2!
```

**Example**:
```bash
BASE_URL=http://localhost:3000 npx playwright test complete-multiplayer-flow
```

## Test Configuration

The test suite configuration is defined in `playwright.config.ts`:

- **Test Directory**: `./tests/playwright`
- **Timeout**: 5 minutes per test
- **Retries**: 0 (local), 2 (CI)
- **Workers**: 1 (no parallelization for multiplayer tests)
- **Reporters**: HTML, JSON, List
- **Web Server**: Auto-starts dev server if not running

## Test Helpers

The test includes several helper functions:

- `login(page, email, password)`: Authenticates user via UI
- `buildTeam(page, playerName)`: Creates 3-Pokemon team with moves
- `createRoom(page)`: Creates battle room and returns room ID
- `joinRoom(page, roomId)`: Joins existing room
- `startBattle(hostPage, guestPage)`: Ready up and start battle
- `executeTurn(page, moveName, playerName)`: Select and use move
- `waitForTurnResolution(page, expectedTurn)`: Wait for turn to complete
- `isBattleEnded(page)`: Check if battle has concluded
- `getCurrentHP(page, side)`: Extract current HP value

## Debugging

### View Screenshots

Failed tests automatically capture screenshots:
```
test-results/player1-failure.png
test-results/player2-failure.png
```

Successful tests also capture end state:
```
test-results/player1-battle-end.png
test-results/player2-battle-end.png
```

### View Console Logs

Browser console logs are piped to test output:
```
P1 LOG: Turn resolved
P2 LOG: Move selected: flamethrower
```

### Interactive Debugging

Use `--debug` flag to step through test execution:
```bash
npx playwright test complete-multiplayer-flow --debug
```

Or add `await page.pause()` in test code to set breakpoints.

## Common Issues

### 1. Authentication Failed

**Problem**: "Authentication service unavailable"

**Solution**: 
- Verify Firebase config in `.env` or environment
- Check Firebase Authentication is enabled
- Ensure test users exist

### 2. Team Building Timeout

**Problem**: Pokemon selector not found

**Solution**:
- Verify team builder at `/team` is accessible
- Check API rate limits (PokeAPI)
- Increase timeout in test config

### 3. Battle Not Starting

**Problem**: Room created but battle doesn't start

**Solution**:
- Verify RTDB security rules allow writes
- Check both players have complete teams (3+ Pokemon with 4 moves each)
- Ensure room service is working

### 4. Turn Not Resolving

**Problem**: Turn counter stuck

**Solution**:
- Verify turn resolution logic in `src/lib/multiplayer/resolveTurn.ts`
- Check RTDB listeners are active
- Ensure both players submitted moves

### 5. Battle Never Ends

**Problem**: Test times out without winner

**Solution**:
- Check battle end detection logic
- Verify Pokemon can faint (HP reaches 0)
- Increase `maxTurns` safety limit in test

## Test Data

### Team Composition

Both players use identical teams for deterministic testing:

**Charizard** (Fire/Flying)
- Moves: Flamethrower, Air Slash, Dragon Claw, Fire Blast

**Blastoise** (Water)
- Moves: Hydro Pump, Ice Beam, Skull Bash, Aqua Tail

**Venusaur** (Grass/Poison)
- Moves: Solar Beam, Sludge Bomb, Earthquake, Giga Drain

## Extending Tests

### Add More Pokemon

Modify the `team` array in `buildTeam()`:

```typescript
const team = [
  { name: 'Pikachu', moves: ['thunderbolt', 'quick-attack', 'iron-tail', 'thunder'] },
  // ... more Pokemon
];
```

### Test Different Scenarios

Create new test cases:

```typescript
test('battle with type advantage', async ({ browser }) => {
  // Player 1: Water types
  // Player 2: Fire types
  // Expect Player 1 to win
});
```

### Test Error Handling

```typescript
test('forfeit during battle', async ({ browser }) => {
  // Start battle
  // Player 1 clicks forfeit button
  // Verify Player 2 wins
});
```

## CI/CD Integration

To run tests in CI:

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        env:
          CI: true
          FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
          FIREBASE_AUTH_DOMAIN: ${{ secrets.FIREBASE_AUTH_DOMAIN }}
          # ... other Firebase config
          TEST_PLAYER1_EMAIL: ${{ secrets.TEST_PLAYER1_EMAIL }}
          TEST_PLAYER1_PASSWORD: ${{ secrets.TEST_PLAYER1_PASSWORD }}
          TEST_PLAYER2_EMAIL: ${{ secrets.TEST_PLAYER2_EMAIL }}
          TEST_PLAYER2_PASSWORD: ${{ secrets.TEST_PLAYER2_PASSWORD }}
        run: npx playwright test
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: test-results/
```

## Performance Benchmarks

Expected test duration:
- Login (both users): ~5-10 seconds
- Team building (both users): ~30-60 seconds
- Room setup: ~5 seconds
- Battle execution: ~30-120 seconds (depends on # of turns)
- **Total**: ~1-3 minutes

## License

This test suite is part of the Pokemon Battles project.
