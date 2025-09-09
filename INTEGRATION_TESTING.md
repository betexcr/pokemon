# Integration Testing with Live Firebase Services

This document explains how to set up and run integration tests that use **live users** and **actual Firebase services** for your Pokemon battle app.

## 🎯 What These Tests Do

These integration tests simulate real user interactions with your app:

1. **Two live users** (host and guest) sign in with real Firebase Auth
2. **Host creates a lobby** using actual Firestore database
3. **Guest joins the lobby** and both users select teams
4. **Real-time battle** with Firebase synchronization
5. **Complete battle flow** from start to finish

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Firebase Test Project

Create a separate Firebase project for testing:

```bash
# Install Firebase CLI if you haven't
npm install -g firebase-tools

# Login to Firebase
firebase login

# Create a test project
firebase projects:create your-pokemon-test-project --display-name "Pokemon Battles Test"
```

### 3. Configure Environment Variables

Create `.env.local` with your Firebase test project configuration:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_test_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-test-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-test-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-test-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Test Configuration
TEST_BASE_URL=http://localhost:3000
TEST_HOST_EMAIL=test-host@pokemon-battles.test
TEST_HOST_PASSWORD=TestHost123!
TEST_GUEST_EMAIL=test-guest@pokemon-battles.test
TEST_GUEST_PASSWORD=TestGuest123!
```

### 4. Set Up Test Users

```bash
# Create test user accounts
npm run test:setup-users
```

### 5. Run Integration Tests

```bash
# Start your development server
npm run dev

# In another terminal, run the tests
npm run test:integration
```

## 🧪 Test Types

### 1. Complete Battle Flow Test
- **File**: `src/__tests__/integration/complete-battle-flow.test.ts`
- **What it tests**: Full user journey from lobby creation to battle completion
- **Duration**: ~2-3 minutes
- **Browsers**: Chrome, Firefox, Safari, Mobile

### 2. Real-time Synchronization Test
- **File**: `src/__tests__/integration/live-firebase.test.ts`
- **What it tests**: Firebase real-time updates, room synchronization
- **Duration**: ~1-2 minutes

### 3. Data Persistence Test
- **File**: `src/__tests__/integration/live-firebase.test.ts`
- **What it tests**: Firebase data persistence across sessions
- **Duration**: ~30 seconds

## 🎮 Test Scenarios

### Scenario 1: Complete Multiplayer Battle
```
1. Host signs in → Creates room → Selects team → Marks ready
2. Guest signs in → Joins room → Selects team → Marks ready  
3. Host starts battle → Both users enter battle interface
4. Battle mechanics → Move execution → Real-time updates
5. Battle completion → Results display
```

### Scenario 2: Real-time Room Updates
```
1. Host changes ready status → Guest sees change immediately
2. Guest changes ready status → Host sees change immediately
3. Team selection synchronization
4. Chat message synchronization
```

### Scenario 3: Error Handling
```
1. Invalid room ID handling
2. Network disconnection recovery
3. Firebase permission errors
4. Battle timeout scenarios
```

## 🛠️ Test Commands

```bash
# Run all integration tests
npm run test:integration

# Run tests with UI (interactive)
npm run test:integration:ui

# Run tests in headed mode (see browser)
npm run test:integration:headed

# Debug tests step by step
npm run test:integration:debug

# Run specific test file
npx playwright test complete-battle-flow.test.ts

# Run tests on specific browser
npx playwright test --project=chromium

# Generate test report
npx playwright show-report
```

## 📊 Test Reports

After running tests, you'll get:

- **HTML Report**: `test-results/index.html` - Interactive test results
- **JSON Report**: `test-results/results.json` - Machine-readable results
- **JUnit Report**: `test-results/results.xml` - CI/CD integration
- **Screenshots**: Failed test screenshots
- **Videos**: Test execution recordings
- **Traces**: Step-by-step execution traces

## 🔧 Test Configuration

### Playwright Configuration
- **File**: `playwright.config.ts`
- **Browsers**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Parallel execution**: Multiple browsers simultaneously
- **Retry logic**: Automatic retry on failure
- **Timeouts**: 60 seconds per test, 10 seconds per action

### Firebase Test Utils
- **File**: `src/__tests__/integration/firebase-test-utils.ts`
- **Features**: User management, room creation, battle simulation
- **Cleanup**: Automatic test data cleanup
- **Helpers**: Wait conditions, data generation

## 🧹 Cleanup

### Automatic Cleanup
Tests automatically clean up:
- Test user accounts
- Test battle rooms
- Test battles
- Test teams
- Test chat messages

### Manual Cleanup
```bash
# Clean up test users
npm run test:cleanup-users

# Clean up all test data
npx playwright test --grep="cleanup"
```

## 🚨 Troubleshooting

### Common Issues

1. **Firebase not configured**
   ```
   Error: Firebase not configured
   Solution: Check .env.local file and Firebase project setup
   ```

2. **Test users not found**
   ```
   Error: User not found
   Solution: Run npm run test:setup-users
   ```

3. **Application not running**
   ```
   Error: Application not accessible
   Solution: Start dev server with npm run dev
   ```

4. **Permission denied**
   ```
   Error: Permission denied
   Solution: Check Firebase security rules
   ```

### Debug Mode

Run tests in debug mode to step through issues:

```bash
npm run test:integration:debug
```

This opens Playwright Inspector where you can:
- Step through tests line by line
- Inspect page state
- Modify test execution
- View network requests
- Check Firebase data

## 📈 CI/CD Integration

### GitHub Actions Example

```yaml
name: Integration Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install
      
      - name: Set up test users
        run: npm run test:setup-users
        env:
          NEXT_PUBLIC_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
          # ... other Firebase env vars
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## 🎯 Best Practices

### 1. Test Isolation
- Each test creates its own data
- Tests don't depend on each other
- Cleanup happens automatically

### 2. Realistic Scenarios
- Tests simulate real user behavior
- Include edge cases and error conditions
- Test both happy path and failure scenarios

### 3. Performance Monitoring
- Monitor test execution time
- Track Firebase usage and costs
- Optimize test data size

### 4. Security
- Use separate Firebase project for testing
- Don't commit test credentials
- Rotate test user passwords regularly

## 🔮 Future Enhancements

### Planned Features
- [ ] Load testing with multiple concurrent users
- [ ] Performance benchmarking
- [ ] Visual regression testing
- [ ] Accessibility testing
- [ ] Mobile device testing
- [ ] Cross-browser compatibility testing

### Advanced Scenarios
- [ ] Tournament bracket testing
- [ ] Leaderboard functionality
- [ ] Social features (friends, chat)
- [ ] Payment integration testing
- [ ] Push notification testing

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/)
- [Firebase Testing Guide](https://firebase.google.com/docs/emulator-suite)
- [Next.js Testing](https://nextjs.org/docs/testing)
- [Jest Testing Framework](https://jestjs.io/)

---

**Happy Testing! 🎮⚡**

These integration tests ensure your Pokemon battle app works perfectly with real users and live Firebase services. They catch issues that unit tests miss and give you confidence in your multiplayer functionality.
