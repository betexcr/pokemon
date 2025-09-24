# RTDB Battle System Testing Guide

This guide provides comprehensive instructions for testing the Firebase Realtime Database (RTDB) battle system implementation.

## Overview

The RTDB battle system includes a complete test suite covering:
- Unit tests for individual components
- Integration tests for system interactions
- Performance tests for scalability
- Security tests for access control
- Error handling tests for robustness
- Migration tests for Firestore to RTDB transition

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase project with RTDB enabled
- Blaze plan for Cloud Functions

### Installation

```bash
# Install dependencies
npm install

# Install test dependencies
npm install --save-dev vitest @vitest/ui @vitest/coverage-v8 jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

### Running Tests

```bash
# Run all tests
npm run test:all

# Run specific test categories
npm run test:unit
npm run test:component
npm run test:integration
npm run test:performance
npm run test:security
npm run test:error-handling
npm run test:migration

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run with UI
npm run test:ui
```

## Test Categories

### 1. Unit Tests

Test individual components in isolation:

```bash
npm run test:unit
```

**Coverage:**
- RTDB service operations
- Battle engine initialization
- State conversion functions
- Component rendering
- Error handling

**Files:**
- `firebase-rtdb-service.test.ts`
- `battle-engine-rtdb.test.ts`
- `battle-state-conversion.test.ts`
- `RTDBBattleComponent.test.tsx`

### 2. Integration Tests

Test component interactions and data flow:

```bash
npm run test:integration
```

**Coverage:**
- Complete battle flow
- Real-time synchronization
- Concurrent operations
- Data consistency
- Error recovery

**Files:**
- `battle-flow-integration.test.ts`
- `rtdb-integration.test.ts`

### 3. Performance Tests

Test system performance and scalability:

```bash
npm run test:performance
```

**Coverage:**
- Connection performance
- Data transfer efficiency
- Memory usage
- Concurrent load handling
- Network resilience

**Files:**
- `rtdb-performance.test.ts`

### 4. Security Tests

Test security and access control:

```bash
npm run test:security
```

**Coverage:**
- Authentication requirements
- Data validation
- Access control
- Permission enforcement
- Input sanitization

**Files:**
- `rtdb-security-rules.test.ts`

### 5. Error Handling Tests

Test error scenarios and recovery:

```bash
npm run test:error-handling
```

**Coverage:**
- Connection failures
- Network timeouts
- Data corruption
- Partial system failures
- Recovery mechanisms

**Files:**
- `rtdb-error-handling.test.ts`

### 6. Migration Tests

Test Firestore to RTDB migration:

```bash
npm run test:migration
```

**Coverage:**
- Data format conversion
- Component migration
- State synchronization
- Rollback capabilities
- Data integrity

**Files:**
- `rtdb-migration.test.ts`

## Test Configuration

### Vitest Configuration

The test suite uses Vitest with the following configuration:

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/lib/__tests__/rtdb-test-setup.ts'],
    coverage: {
      provider: 'v8',
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    testTimeout: 10000,
    maxConcurrency: 5
  }
});
```

### Test Setup

Global test setup includes:

```typescript
// src/lib/__tests__/rtdb-test-setup.ts
import { vi, beforeEach, afterEach } from 'vitest';

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});
```

## Test Utilities

### RTDBTestUtils

The test suite includes comprehensive utilities:

```typescript
import { RTDBTestUtils } from './rtdb-test-utils';

// Create mock data
const pokemon = RTDBTestUtils.createMockPokemon();
const team = RTDBTestUtils.createMockTeam();
const battleState = RTDBTestUtils.createMockBattleState();

// Setup mocks
const { mockUnsubscribe } = RTDBTestUtils.setupMockRTDBService();
const { engine } = await RTDBTestUtils.createMockBattleEngine();

// Simulate scenarios
await RTDBTestUtils.simulateBattleFlow(battleId, p1Choices, p2Choices);
await RTDBTestUtils.simulateConcurrentBattles(10);
await RTDBTestUtils.simulateHighFrequencyOperations(100);
```

### Mock Data Generation

```typescript
// Create mock Pokemon
const pikachu = RTDBTestUtils.createMockPokemon({
  pokemon: { name: 'Pikachu', types: [{ type: { name: 'electric' } }] },
  level: 50,
  currentHp: 100,
  maxHp: 100
});

// Create mock team
const team = RTDBTestUtils.createMockTeam({
  pokemon: [pikachu],
  currentIndex: 0,
  faintedCount: 0
});

// Create mock battle state
const battleState = RTDBTestUtils.createMockBattleState({
  player: team,
  opponent: team,
  turn: 1,
  phase: 'choice'
});
```

## Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { rtdbService } from '../firebase-rtdb-service';

describe('RTDB Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update presence', async () => {
    const mockRef = { path: 'presence/test-uid' };
    (rtdbService as any).rtdb = { ref: vi.fn().mockReturnValue(mockRef) };

    await rtdbService.updatePresence('test-uid', true);

    expect(rtdbService.updatePresence).toHaveBeenCalledWith('test-uid', true);
  });
});
```

### Integration Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { RTDBTestUtils } from './rtdb-test-utils';

describe('Battle Flow Integration', () => {
  it('should handle complete battle flow', async () => {
    const battleId = 'test-battle-123';
    const p1Choices = [
      { type: 'move', moveId: 'thunderbolt', target: 'opponent' }
    ];
    const p2Choices = [
      { type: 'move', moveId: 'flamethrower', target: 'opponent' }
    ];

    const result = await RTDBTestUtils.simulateBattleFlow(
      battleId,
      p1Choices,
      p2Choices
    );

    expect(result.p1Choices).toHaveLength(1);
    expect(result.p2Choices).toHaveLength(1);
  });
});
```

### Performance Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { RTDBTestUtils } from './rtdb-test-utils';

describe('Performance Tests', () => {
  it('should handle high-frequency operations', async () => {
    const result = await RTDBTestUtils.simulateHighFrequencyOperations(100);

    expect(result.operationCount).toBe(100);
    expect(result.totalTime).toBeLessThan(1000);
  });
});
```

## Test Scripts

### Command Line Scripts

```bash
# Run specific test category
node src/lib/__tests__/rtdb-test-scripts.ts test:unit

# Run all tests
node src/lib/__tests__/rtdb-test-scripts.ts test:all

# Generate test report
node src/lib/__tests__/rtdb-test-scripts.ts report

# Clean test results
node src/lib/__tests__/rtdb-test-scripts.ts clean
```

### NPM Scripts

```bash
# Unit tests
npm run test:unit

# Component tests
npm run test:component

# Integration tests
npm run test:integration

# Performance tests
npm run test:performance

# Security tests
npm run test:security

# Error handling tests
npm run test:error-handling

# Migration tests
npm run test:migration

# All tests
npm run test:all

# Coverage
npm run test:coverage

# Watch mode
npm run test:watch

# UI mode
npm run test:ui

# Debug mode
npm run test:debug

# CI mode
npm run test:ci
```

## Continuous Integration

### GitHub Actions

```yaml
name: RTDB Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:ci
      - uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results/
```

### Test Reports

Test results are generated in multiple formats:

- **JSON**: Machine-readable results for CI integration
- **HTML**: Human-readable coverage and test reports
- **Console**: Real-time test execution output

## Debugging

### Debug Mode

```bash
npm run test:debug
```

### Test UI

```bash
npm run test:ui
```

### Watch Mode

```bash
npm run test:watch
```

### Specific Test Files

```bash
npx vitest run src/lib/__tests__/firebase-rtdb-service.test.ts
```

## Coverage Requirements

The test suite enforces the following coverage thresholds:

- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View coverage in browser
open test-results/coverage.html
```

## Best Practices

### Writing Tests

1. **Use descriptive test names** that explain what is being tested
2. **Follow AAA pattern** (Arrange, Act, Assert)
3. **Mock external dependencies** to isolate units under test
4. **Test both success and failure scenarios**
5. **Use test utilities** for consistent mock data generation
6. **Clean up resources** in afterEach hooks

### Test Organization

1. **Group related tests** using describe blocks
2. **Use beforeEach/afterEach** for setup and cleanup
3. **Keep tests independent** and avoid test interdependencies
4. **Use meaningful assertions** with clear error messages
5. **Test edge cases** and error conditions

### Performance Considerations

1. **Use parallel execution** for independent tests
2. **Mock expensive operations** to reduce test execution time
3. **Clean up resources** to prevent memory leaks
4. **Use appropriate timeouts** for async operations
5. **Profile test execution** to identify bottlenecks

## Troubleshooting

### Common Issues

1. **Test timeouts**: Increase timeout values for slow operations
2. **Mock failures**: Ensure mocks are properly configured
3. **Memory leaks**: Check for proper cleanup in afterEach hooks
4. **Flaky tests**: Use retry mechanisms and stable test data
5. **Coverage gaps**: Add tests for uncovered code paths

### Debug Commands

```bash
# Run specific test file
npx vitest run src/lib/__tests__/firebase-rtdb-service.test.ts

# Run tests with verbose output
npx vitest run --reporter=verbose

# Run tests with coverage
npx vitest run --coverage

# Run tests in debug mode
npx vitest run --inspect-brk
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Firebase Testing](https://firebase.google.com/docs/emulator-suite)
- [Jest Mock Functions](https://jestjs.io/docs/mock-functions)
- [React Testing](https://reactjs.org/docs/testing.html)

## Contributing

When adding new tests:

1. **Follow existing patterns** and naming conventions
2. **Add appropriate test categories** (unit, integration, performance, etc.)
3. **Update test utilities** if new mock data is needed
4. **Ensure test coverage** meets the 80% threshold
5. **Document new test scenarios** in this guide
