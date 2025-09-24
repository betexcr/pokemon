import { vi, beforeEach, afterEach } from 'vitest';

// Global test setup
beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  debug: vi.fn()
};

// Mock performance API
global.performance = {
  ...performance,
  now: vi.fn(() => Date.now())
};

// Mock process.memoryUsage
global.process = {
  ...process,
  memoryUsage: vi.fn(() => ({
    rss: 1024 * 1024 * 100,
    heapTotal: 1024 * 1024 * 50,
    heapUsed: 1024 * 1024 * 25,
    external: 1024 * 1024 * 10,
    arrayBuffers: 1024 * 1024 * 5
  }))
};
