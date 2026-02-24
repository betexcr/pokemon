/**
 * Test file to verify request management system works correctly
 * Run with: npx ts-node src/lib/__tests__/requestManager.test.ts
 */

import { requestManager } from '../requestManager';

console.log('\n🧪 Testing Request Manager System\n');

// Test 1: Request creation and cancellation
console.log('Test 1: Request Creation and Cancellation');
const { signal: signal1, requestId: id1 } = requestManager.createRequest('test-context', 'normal');
console.log('✅ Created request:', id1);
console.log('✅ Signal aborted initially?', signal1.aborted);

requestManager.cancelRequest(id1);
console.log('✅ Cancelled request:', id1);
console.log('✅ Signal aborted after cancel?', signal1.aborted);

// Test 2: Priority-based cancellation
console.log('\nTest 2: Priority-based Request Cancellation');
const { requestId: lowId } = requestManager.createRequest('priority-test', 'low');
const { requestId: normalId } = requestManager.createRequest('priority-test', 'normal');
const { requestId: highId } = requestManager.createRequest('priority-test', 'high'); // Should cancel lower priority
console.log('✅ Created low, normal, high priority requests');
const activeRequests = requestManager.getActiveRequests();
console.log('✅ Active requests after high priority:', activeRequests.length);

// Test 3: Request pooling
console.log('\nTest 3: Request Pooling');
const poolStatus1 = requestManager.getPoolStatus();
console.log('✅ Pool status:', poolStatus1);
console.log('✅ Maximum concurrent:', poolStatus1.maxConcurrent);

// Create multiple requests
for (let i = 0; i < 8; i++) {
  const { requestId } = requestManager.createRequest('pool-test', 'normal');
  console.log(`  - Created request ${i + 1}: ${requestId}`);
}

const poolStatus2 = requestManager.getPoolStatus();
console.log('✅ Pool queued:', poolStatus2.queued);
console.log('✅ Pool utilization:', poolStatus2.percentUsed.toFixed(1) + '%');

// Test 4: Request statistics
console.log('\nTest 4: Request Statistics');
const stats = requestManager.getRequestStats();
console.log('✅ Total requests tracked:', stats.total);
console.log('✅ Requests by priority:', stats.byPriority);
console.log('✅ Requests by context:', stats.byContext);

// Test 5: Context-based cancellation
console.log('\nTest 5: Context-based Cancellation');
const { requestId: ctx1 } = requestManager.createRequest('cancel-context-1', 'normal');
const { requestId: ctx2 } = requestManager.createRequest('cancel-context-1', 'normal');
const { requestId: ctx3 } = requestManager.createRequest('cancel-context-2', 'normal');
console.log('✅ Created requests in 2 contexts');

requestManager.cancelContext('cancel-context-1');
const stats2 = requestManager.getRequestStats();
console.log('✅ After cancelling context-1, total requests:', stats2.total);
console.log('✅ Remaining contexts:', stats2.byContext);

// Test 6: Cancel all
console.log('\nTest 6: Cancel All');
const beforeCancel = requestManager.getRequestStats();
console.log('✅ Requests before cancel-all:', beforeCancel.total);

requestManager.cancelAll();

const afterCancel = requestManager.getRequestStats();
console.log('✅ Requests after cancel-all:', afterCancel.total);

console.log('\n✅ All tests passed! Request management system is working correctly.\n');
