# RTDB Battle System Test Suite

This directory contains comprehensive unit tests for the Firebase Realtime Database (RTDB) battle system implementation.

## Test Structure

### Core Test Files

- **`firebase-rtdb-service.test.ts`** - Unit tests for the RTDB service layer
- **`battle-engine-rtdb.test.ts`** - Unit tests for the RTDB battle engine
- **`battle-state-conversion.test.ts`** - Tests for state conversion between RTDB and battle state
- **`RTDBBattleComponent.test.tsx`** - React component tests for the battle UI
- **`battle-flow-integration.test.ts`** - Integration tests for the battle flow
- **`rtdb-integration.test.ts`** - End-to-end integration tests
- **`rtdb-performance.test.ts`** - Performance and scalability tests
- **`rtdb-security-rules.test.ts`** - Security and access control tests
- **`rtdb-error-handling.test.ts`** - Error handling and recovery tests
- **`rtdb-migration.test.ts`** - Migration from Firestore to RTDB tests

### Test Utilities

- **`rtdb-test-utils.ts`** - Utility functions and mock helpers for tests
- **`rtdb-test-runner.ts`** - Comprehensive test runner with all test categories
- **`rtdb-test-config.ts`** - Vitest configuration for RTDB tests
- **`rtdb-test-setup.ts`** - Global test setup and mocks
- **`rtdb-test-scripts.ts`** - Command-line test execution scripts

## Running Tests

### Individual Test Categories

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
```

### All Tests

```bash
# Run all tests
npm run test:all

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run with UI
npm run test:ui
```

### Using Test Scripts

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

## Test Coverage

The test suite covers:

### Unit Tests (80%+ coverage)
- RTDB service operations
- Battle engine initialization and state management
- State conversion between RTDB and battle state
- Component rendering and user interactions
- Error handling and validation

### Integration Tests
- Complete battle flow from lobby to completion
- Real-time synchronization between clients
- Concurrent battle handling
- Data consistency across operations

### Performance Tests
- Connection performance
- Data transfer efficiency
- Memory usage and leak detection
- Scalability under load
- Network resilience

### Security Tests
- Authentication requirements
- Data validation
- Access control
- Permission enforcement
- Input sanitization

### Error Handling Tests
- Connection failures
- Network timeouts
- Data corruption
- Partial system failures
- Recovery mechanisms

### Migration Tests
- Firestore to RTDB data conversion
- Component migration
- State format conversion
- Rollback capabilities
- Data integrity validation

## Test Data

### Mock Data Generation

The test suite includes utilities for generating mock data:

```typescript
import { RTDBTestUtils } from './rtdb-test-utils';

// Create mock Pokemon
const pokemon = RTDBTestUtils.createMockPokemon({
  pokemon: { name: 'Pikachu', types: [{ type: { name: 'electric' } }] },
  level: 50,
  currentHp: 100,
  maxHp: 100
});

// Create mock team
const team = RTDBTestUtils.createMockTeam({
  pokemon: [pokemon],
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

### Test Scenarios

The test suite includes comprehensive scenarios:

- **Basic Operations**: Create, read, update, delete operations
- **Battle Flow**: Complete battle lifecycle from start to finish
- **Concurrent Access**: Multiple clients accessing the same battle
- **Error Recovery**: Handling and recovering from various error conditions
- **Performance**: High-frequency operations and large data sets
- **Security**: Authentication, authorization, and data validation
- **Migration**: Converting from Firestore to RTDB format

## Configuration

### Vitest Configuration

The test suite uses Vitest with the following configuration:

- **Environment**: jsdom for React component testing
- **Coverage**: V8 provider with 80%+ threshold requirements
- **Timeout**: 10 seconds for individual tests
- **Concurrency**: Up to 4 parallel test threads
- **Retry**: 2 retries for flaky tests
- **Mocking**: Automatic mock reset and restoration

### Test Environment

- **Node.js**: 18+ required
- **TypeScript**: Full type checking enabled
- **ESLint**: Code quality enforcement
- **Prettier**: Code formatting
- **Firebase**: Mocked for testing

## Continuous Integration

### GitHub Actions

The test suite is designed to run in CI environments:

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
- **JUnit**: XML format for CI systems

## Debugging

### Debug Mode

Run tests in debug mode for detailed output:

```bash
npm run test:debug
```

### Test UI

Use the Vitest UI for interactive testing:

```bash
npm run test:ui
```

### Watch Mode

Run tests in watch mode for development:

```bash
npm run test:watch
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

## Contributing

When adding new tests:

1. **Follow existing patterns** and naming conventions
2. **Add appropriate test categories** (unit, integration, performance, etc.)
3. **Update test utilities** if new mock data is needed
4. **Ensure test coverage** meets the 80% threshold
5. **Document new test scenarios** in this README

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Firebase Testing](https://firebase.google.com/docs/emulator-suite)
- [Jest Mock Functions](https://jestjs.io/docs/mock-functions)
- [React Testing](https://reactjs.org/docs/testing.html)
