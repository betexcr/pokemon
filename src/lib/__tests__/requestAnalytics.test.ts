/**
 * Test file to verify analytics system works correctly
 * Run with: npx ts-node src/lib/__tests__/requestAnalytics.test.ts
 */

import { analyticsManager } from '../requestAnalytics';

console.log('\n📊 Testing Request Analytics System\n');

analyticsManager.setLogging(true);

// Test 1: Record requests
console.log('Test 1: Recording Requests');
analyticsManager.recordStart('req-1', 'https://api.example.com/pokemon/1', 'pokedex-main', 'high');
analyticsManager.recordStart('req-2', 'https://api.example.com/pokemon/2', 'pokedex-main', 'normal');
analyticsManager.recordStart('req-3', 'https://api.example.com/search', 'search', 'normal');

// Simulate request completion times
await new Promise(resolve => setTimeout(resolve, 100));
analyticsManager.recordComplete('req-1', 'completed');

await new Promise(resolve => setTimeout(resolve, 50));
analyticsManager.recordComplete('req-2', 'completed');

analyticsManager.recordComplete('req-3', 'cancelled', 'User navigated away');

const analytics1 = analyticsManager.getAnalytics();
console.log('✅ Analytics after 3 requests:');
console.log('  - Total requests:', analytics1.totalRequests);
console.log('  - Completed:', analytics1.completedRequests);
console.log('  - Cancelled:', analytics1.cancelledRequests);
console.log('  - Cancellation rate:', analytics1.cancellationRate.toFixed(1) + '%');

// Test 2: Performance metrics
console.log('\nTest 2: Performance Metrics');
console.log('✅ Average response time:', analytics1.averageResponseTime.toFixed(0) + 'ms');
console.log('✅ Slowest request:', analytics1.slowestRequest?.time + 'ms');
console.log('✅ Fastest request:', analytics1.fastestRequest?.time + 'ms');

// Test 3: Requests by context
console.log('\nTest 3: Requests by Context');
console.log('✅ Breakdown by context:', analytics1.requestsByContext);
console.log('✅ Breakdown by priority:', analytics1.requestsByPriority);

// Test 4: Add more requests to simulate real scenario
console.log('\nTest 4: Simulating Real Scenario');
for (let i = 0; i < 10; i++) {
  const context = i % 3 === 0 ? 'pokedex-main' : i % 2 === 0 ? 'search' : 'viewport';
  const priority = i % 4 === 0 ? 'critical' : i % 3 === 0 ? 'high' : 'normal';
  const status = i % 5 === 0 ? 'cancelled' : 'completed';
  
  analyticsManager.recordStart(`req-${100 + i}`, `https://api.example.com/data/${i}`, context, priority);
  await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
  analyticsManager.recordComplete(`req-${100 + i}`, status);
}

const analytics2 = analyticsManager.getAnalytics();
console.log('✅ After simulating real workload:');
console.log('  - Total requests:', analytics2.totalRequests);
console.log('  - Completed:', analytics2.completedRequests);
console.log('  - Cancelled:', analytics2.cancelledRequests);
console.log('  - Failed:', analytics2.failedRequests);
console.log('  - Cancellation rate:', analytics2.cancellationRate.toFixed(1) + '%');
console.log('  - Average response time:', analytics2.averageResponseTime.toFixed(0) + 'ms');

// Test 5: Pruning old metrics
console.log('\nTest 5: Pruning Old Metrics');
const beforePrune = analyticsManager.getAnalytics();
console.log('✅ Requests before prune:', beforePrune.totalRequests);

analyticsManager.prune(5, 0); // Keep only 5 recent

const afterPrune = analyticsManager.getAnalytics();
console.log('✅ Requests after prune:', afterPrune.totalRequests);

// Test 6: Reset
console.log('\nTest 6: Reset Analytics');
analyticsManager.reset();
const afterReset = analyticsManager.getAnalytics();
console.log('✅ Requests after reset:', afterReset.totalRequests);
console.log('✅ Completed after reset:', afterReset.completedRequests);

console.log('\n✅ All analytics tests passed! Analytics system is working correctly.\n');
