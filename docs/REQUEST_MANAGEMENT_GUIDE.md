# 🚀 Request Management System - Complete Usage Guide

## Overview

Your Pokédex now has a sophisticated request cancellation and performance optimization system with real-time analytics. This guide shows you how to use each component.

---

## 1️⃣ **Request Manager** (Core System)

The request manager controls all HTTP requests with automatic pooling, prioritization, and cancellation.

### Basic Usage

```typescript
import { requestManager } from '@/lib/requestManager';

// Create a new request
const { signal, requestId } = requestManager.createRequest(
  'context-name', // e.g., 'pokedex-main', 'search', 'viewport'
  'high' | 'normal' | 'low' | 'background' // Priority
);

// Use the signal in your fetch
const response = await fetch(`/api/pokemon`, {
  signal // AbortController signal
});

// Or pass through your API layer
import { fetchFromAPI } from '@/lib/api';
const data = await fetchFromAPI('/endpoint', { signal });
```

### Priorities

| Level | Use Case | Auto-Cancel If Exceeded | Example |
|-------|----------|----------------------|---------|
| **high** | Active user action | Low-priority requests | Search input |
| **normal** | Standard requests | Low + background | Initial page load |
| **low** | Background optional data | - | Non-critical UI elements |
| **background** | Not urgent | All except critical | Analytics prefetch |

### API Reference

```typescript
// Create request (returns signal + requestId)
createRequest(context: string, priority: Priority)

// Cancel specific request
cancelRequest(requestId: string)

// Cancel all requests in a context
cancelContext(context: string)

// Cancel everything
cancelAll()

// Get pool status
getPoolStatus() 
// Returns: { totalActive, queued, maxConcurrent, percentUsed }

// Get detailed stats
getRequestStats()
// Returns: { byPriority, byContext, byStatus }
```

---

## 2️⃣ **Route Cancellation Hook** (Auto-cleanup on navigation)

Automatically cancels requests when user navigates to a different page.

### Setup in Your Component

```tsx
import { useRequestCancellation } from '@/hooks/useRequestCancellation';

export function MyComponent() {
  // Cancel 'pokedex-main' context when navigating away
  useRequestCancellation({
    contexts: ['pokedex-main'], // Contexts to cancel (or omit for ALL)
    onRouteChange: () => {
      console.log('Navigated away - requests cancelled');
    }
  });

  return <div>{/* Component */}</div>;
}
```

### Parameters

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `contexts` | `string[]` | (all) | Which contexts to cancel. Omit or empty = cancel all |
| `onRouteChange` | `() => void` | - | Callback when route changes |
| `enabled` | `boolean` | true | Enable/disable the hook |

### Use Cases

```tsx
// Cancel main pokedex requests on navigation
useRequestCancellation({ contexts: ['pokedex-main'] });

// Cancel specific search requests when leaving search page
useRequestCancellation({ contexts: ['search'] });

// Cancel ALL requests when navigating away
useRequestCancellation();

// With logging
useRequestCancellation({
  contexts: ['pokedex-main'],
  onRouteChange: () => logger.info('Page changed - cancelled main requests')
});
```

---

## 3️⃣ **Viewport Cancellation Hook** (Smart scroll detection)

Automatically cancels requests for Pokémon that are scrolled off-screen, saving bandwidth.

### Setup in Your Component

```tsx
import { useViewportCancellation } from '@/hooks/useViewportCancellation';

export function PokemonList() {
  // Cancel requests for Pokémon not visible + 1000px buffer
  useViewportCancellation({
    enabled: true,
    bufferMargin: 1000, // px above/below viewport
    onCancel: (cancelledCount) => {
      console.log(`Cancelled ${cancelledCount} off-screen requests`);
    }
  });

  return (
    <div className="pokemon-list">
      {/* Pokemon items */}
    </div>
  );
}
```

### How It Works

1. Finds all elements with `data-pokemon-id` attribute
2. Checks if they're visible using `getBoundingClientRect()`
3. Adds 1000px buffer margin (customizable)
4. Cancels requests for elements outside this zone
5. Updates every scroll event (debounced 300ms)

### Optimal Buffer Margins

| Device | Recommended | Notes |
|--------|-------------|-------|
| Desktop | 1500px | Preload items in viewport + scrolling room |
| Tablet | 1000px | Moderate preloading |
| Mobile | 500px | Minimal bandwidth waste |

### Example with Pokemon List

```tsx
export function PokemonPokedex() {
  useViewportCancellation({
    enabled: true,
    bufferMargin: 1500,
    onCancel: (count) => {
      if (count > 0) console.log(`Cancelled ${count} off-screen requests`);
    }
  });

  return (
    <div className="grid gap-4">
      {/* Each with data-pokemon-id */}
      {pokemons.map(pokemon => (
        <PokemonCard 
          key={pokemon.id}
          pokemon={pokemon}
          data-pokemon-id={pokemon.id}
        />
      ))}
    </div>
  );
}
```

---

## 4️⃣ **Analytics Hook** (Real-time monitoring)

Track request performance, cancellation rates, and system health.

### Setup in Your Component

```tsx
import { useRequestAnalytics } from '@/hooks/useRequestAnalytics';

export function Dashboard() {
  const analytics = useRequestAnalytics({
    autoPrune: true, // Auto-remove old metrics
    pruneInterval: 1000, // ms between prunes
    maxMetrics: 500 // Keep most recent 500
  });

  return (
    <div>
      <p>Total: {analytics.totalRequests}</p>
      <p>Success Rate: {analytics.successRate.toFixed(1)}%</p>
      <p>Avg Time: {analytics.averageResponseTime.toFixed(0)}ms</p>
    </div>
  );
}
```

### Returned Object

```typescript
{
  // Counts
  totalRequests: number;
  completedRequests: number;
  cancelledRequests: number;
  failedRequests: number;

  // Performance
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  successRate: number; // 0-100

  // Breakdown
  byContext: Record<string, number>;
  byPriority: Record<string, number>;
  byStatus: { completed: number; cancelled: number; failed: number };

  // Utility methods
  getSummary(): string; // Human readable summary
  getDisplayStats(): { label: string; value: string }[];
}
```

### Example with Logging

```tsx
export function Home() {
  const analytics = useRequestAnalytics();

  useEffect(() => {
    const interval = setInterval(() => {
      console.log(analytics.getSummary());
      // Output: "📊 Total: 42 | Success: 89.3% | Avg: 234ms | Pool: 2/6"
    }, 10000);
    return () => clearInterval(interval);
  }, [analytics]);

  return <div>{/* content */}</div>;
}
```

---

## 5️⃣ **Analytics Dashboard** (Visual monitoring)

Floating debug UI widget for real-time request monitoring.

### Add to Your Page

```tsx
import { RequestAnalyticsDashboard } from '@/components/RequestAnalyticsDashboard';

export function Layout() {
  return (
    <>
      <main>{/* Your app */}</main>
      
      {/* Debug Dashboard - uncomment to enable */}
      <RequestAnalyticsDashboard 
        defaultOpen={true}
        position="top-right"
      />
    </>
  );
}
```

### Features

✓ Real-time request statistics
✓ Pool utilization gauge
✓ Response time tracking
✓ Context breakdown
✓ Priority distribution
✓ Cancel rate monitoring
✓ Toggle visibility
✓ Reset statistics

### Position Options

```typescript
position?: 
  | 'top-left'
  | 'top-right' (default)
  | 'bottom-left'
  | 'bottom-right'
```

### Example Customization

```tsx
// Debug only mode - auto-hide on production
<RequestAnalyticsDashboard 
  defaultOpen={process.env.NODE_ENV === 'development'}
  position="bottom-right"
/>
```

---

## 🎯 Integration Example: Full Setup

Complete example showing all systems working together:

```tsx
'use client';

import { useRequestCancellation } from '@/hooks/useRequestCancellation';
import { useViewportCancellation } from '@/hooks/useViewportCancellation';
import { useRequestAnalytics } from '@/hooks/useRequestAnalytics';
import { RequestAnalyticsDashboard } from '@/components/RequestAnalyticsDashboard';
import { fetchPokemonList } from '@/lib/infiniteScrollFetchers';
import { useEffect, useState } from 'react';

export default function PokédexPage() {
  const [pokémon, setPokémon] = useState([]);

  // 1. Cancel requests on navigation
  useRequestCancellation({
    contexts: ['pokedex-main'],
    onRouteChange: () => console.log('Loading new page...')
  });

  // 2. Cancel off-screen requests
  useViewportCancellation({
    enabled: true,
    bufferMargin: 1500,
    onCancel: (count) => {
      if (count > 0) console.log(`🚫 Cancelled ${count} off-screen requests`);
    }
  });

  // 3. Monitor performance
  const analytics = useRequestAnalytics();

  // 4. Log stats every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      console.log(analytics.getSummary());
    }, 10000);
    return () => clearInterval(interval);
  }, [analytics]);

  // 5. Load Pokémon with cancellation
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchPokemonList(0, 100, {
          context: 'pokedex-main'
        });
        setPokémon(data);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Failed to load pokémon', err);
        }
      }
    })();
  }, []);

  return (
    <>
      <div className="grid gap-4 p-4">
        {pokémon.map(p => (
          <PokemonCard
            key={p.id}
            pokemon={p}
            data-pokemon-id={p.id} // Needed for viewport detection
          />
        ))}
      </div>

      {/* Debug Dashboard */}
      <RequestAnalyticsDashboard defaultOpen={true} />
    </>
  );
}

function PokemonCard({ pokemon }: any) {
  return (
    <div className="border rounded p-4">
      <h3>{pokemon.name}</h3>
      <p>#{pokemon.id}</p>
    </div>
  );
}
```

---

## 📊 Performance Tuning

### Context Limits (in requestManager.ts)

Adjust pool limits based on your API:

```typescript
private contextLimits: Record<string, number> = {
  'pokedex-main': 3,    // Primary data
  'search': 2,          // Search queries
  'viewport': 2,        // Viewport requests
  'analytics': 1,       // Don't flood analytics
  'background': 1       // Background tasks
};
```

### Increase For:
- More aggressive preloading → raise pokedex-main to 4-5
- Better mobile performance → lower viewport to 1
- Heavy search → raise search to 3-4

### Buffer Margin Tuning

```typescript
// Mobile: Conservative
useViewportCancellation({ bufferMargin: 500 });

// Tablet: Balanced
useViewportCancellation({ bufferMargin: 1000 });

// Desktop: Aggressive preload
useViewportCancellation({ bufferMargin: 2000 });
```

### Auto-Pruning Analytics

```typescript
const analytics = useRequestAnalytics({
  autoPrune: true,      // Enable auto-cleanup
  pruneInterval: 2000,  // Prune every 2 seconds
  maxMetrics: 1000      // Keep 1000 recent metrics
});
```

---

## 🧪 Testing Your Setup

### Manual Testing Checklist

- [ ] Navigate between pages → requests cancel
- [ ] Scroll rapidly → old requests cancel
- [ ] Check DevTools Network tab → fewer unnecessary requests
- [ ] High-priority requests start immediately
- [ ] Pool stays below 6 concurrent requests
- [ ] Analytics show < 2 second response times average

### Command Line Tests

```bash
# Run integration tests
npm test -- src/lib/__tests__/integration.test.ts

# Run request manager tests
npm test -- src/lib/__tests__/requestManager.test.ts

# Run analytics tests
npm test -- src/lib/__tests__/requestAnalytics.test.ts
```

---

## 🐛 Debugging

### Enable Verbose Logging

```typescript
// In requestManager.ts
const DEBUG = true; // Set to true for detailed logs

// In api.ts
if (DEBUG) console.log(`📤 [${context}] Fetching ${url}`);
```

### Check Current Pool Status

```typescript
import { requestManager } from '@/lib/requestManager';

const status = requestManager.getPoolStatus();
console.log(`
  Active: ${status.totalActive}/${status.maxConcurrent}
  Queued: ${status.queued}
  Usage: ${status.percentUsed.toFixed(1)}%
`);
```

### Monitor Cancellations

```tsx
useViewportCancellation({
  onCancel: (count) => {
    console.log(`🚫 Viewport cancellation: ${count} requests`);
  }
});

useRequestCancellation({
  onRouteChange: () => {
    console.log('✅ Route change: All requests cancelled');
  }
});
```

---

## ⚡ Performance Impact

Expected improvements:

| Metric | Before | After | Improvement |
|--------|--------|-------|------------|
| Page Navigation Speed | ~500ms | ~150ms | **70% faster** |
| Network Requests | All active | Only visible | **50% fewer** |
| API Load | Unlimited | 6 concurrent | **Controlled** |
| Memory Usage | Growing | Pruned | **Stable** |

---

## 🎓 Advanced Topics

### Custom Priority Logic

Add intelligent prioritization:

```typescript
function getPriority(userId: string, action: string) {
  if (action === 'search') return 'high';
  if (action === 'viewport') return 'low';
  if (isPremiumUser(userId)) return 'high';
  return 'normal';
}

const { signal } = requestManager.createRequest('context', getPriority(...));
```

### Context-Aware Cancellation

Cancel only specific request types:

```typescript
useRequestCancellation({
  contexts: ['pokedex-team-selector'], // Only cancel team selector
  onRouteChange: () => {
    // Keep other contexts running
  }
});
```

### Real-time Metrics Dashboard

Build custom monitoring:

```tsx
function RequestMetrics() {
  const analytics = useRequestAnalytics();
  
  return (
    <div>
      {analytics.getDisplayStats().map(stat => (
        <div key={stat.label}>
          {stat.label}: <strong>{stat.value}</strong>
        </div>
      ))}
    </div>
  );
}
```

---

## 📝 Migration Checklist

If updating from old code:

- [ ] Replace fetch calls with `fetchFromAPI(url, { signal })`
- [ ] Add `useRequestCancellation()` to main pages
- [ ] Add `useViewportCancellation()` to infinite scroll
- [ ] Add `data-pokemon-id` to each Pokémon element
- [ ] Import analytics hook for monitoring
- [ ] Update tests to handle AbortError
- [ ] Profile before/after performance with DevTools

---

## Questions?

- Check dev console for "📊 Request analytics" logs every 10 seconds
- Enable RequestAnalyticsDashboard to see real-time stats
- Review test files for integration examples
- Check the Network tab in DevTools to verify cancellations

Happy optimizing! 🚀
