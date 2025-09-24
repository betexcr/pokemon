// Portable device heuristics core (Node/Browser/Next)
// - Adaptive network strategy (generic methods)
// - Frame budget / render-only hints
// - Retry policy
// - Connection/battery/CPU signals (best-effort, gracefully degrading)

import type { KVStorage } from './storage';

type MethodKey = string; // e.g., "rest", "graphql", "postgrest", "edge"
type Outcome = 'success' | 'timeout' | 'network_error' | 'http_error';

type MethodStats = {
  successes: number;
  failures: number;
  avgRttMs: number;         // EMA
  lastOutcome?: Outcome;
  lastAt?: number;
  openUntil?: number;       // circuit breaker epoch ms
};

export type HeuristicsState = {
  methods: Record<MethodKey, MethodStats>;
  lastChosen?: MethodKey;
  env: {
    isNode: boolean;
    isBrowser: boolean;
    isNextServer: boolean;
    isNextClient: boolean;
    ua?: string;
    platform?: string;
  };
  signals: {
    // Hints gathered from environment
    connectionType?: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
    downlinkMbps?: number;        // best-effort
    saveData?: boolean;
    lowPowerMode?: boolean;       // best-effort
    deviceMemoryGB?: number;      // browser hint
  };
};

export type CreateHeuristicsOpts = {
  storage?: KVStorage;
  storageKey?: string;
  methods?: MethodKey[];          // default: ['rest', 'graphql']
  emaAlpha?: number;              // default: 0.3
  breakerMs?: number;             // default: 60_000
  initialAvgRttMs?: number;       // default: 800
  clock?: () => number;           // default: Date.now
  envOverrides?: Partial<HeuristicsState['env']>;
  initialSignals?: Partial<HeuristicsState['signals']>;
};

const defaultMethods = ['rest', 'graphql'];

const detectEnv = (): HeuristicsState['env'] => {
  const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
  const isNode = typeof process !== 'undefined' && !!(process.versions?.node);
  const isNextServer = isNode && !isBrowser;
  const isNextClient = isBrowser && !!(window as { next?: unknown }).next;
  let ua: string | undefined;
  let platform: string | undefined;
  if (isBrowser) {
    ua = (navigator as { userAgent?: string })?.userAgent;
    platform = (navigator as { platform?: string })?.platform;
  } else if (isNode) {
    ua = `node/${process.versions.node} (${process.platform})`;
    platform = process.platform;
  }
  return { isNode, isBrowser, isNextServer, isNextClient, ua, platform };
};

async function gatherSignals(): Promise<HeuristicsState['signals']> {
  const signals: HeuristicsState['signals'] = {};
  try {
    if (typeof navigator !== 'undefined') {
      const anyNav = navigator as { connection?: { effectiveType?: string; downlink?: number } };

      // Network Information API (not on iOS Safari)
      if (anyNav.connection) {
        const c = anyNav.connection;
        if (typeof c.effectiveType === 'string') {
          const et = c.effectiveType as string; // 'slow-2g' | '2g' | '3g' | '4g'
          signals.connectionType =
            et.includes('2g') || et === '3g' ? 'cellular'
            : et === '4g' ? 'cellular'
            : 'unknown';
        }
        if (typeof c.downlink === 'number') signals.downlinkMbps = c.downlink;
        if ('saveData' in c && typeof (c as { saveData?: boolean }).saveData === 'boolean') signals.saveData = (c as { saveData: boolean }).saveData;
      }

      // Device Memory (Chrome-based)
      if (typeof (anyNav as { deviceMemory?: number }).deviceMemory === 'number') {
        signals.deviceMemoryGB = (anyNav as { deviceMemory: number }).deviceMemory;
      }
    }

    // Battery Status API is widely unsupported; best-effort
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      try {
        const bat = await (navigator as { getBattery: () => Promise<{ charging: boolean; level: number }> }).getBattery();
        signals.lowPowerMode = (bat.charging === false && bat.level <= 0.2);
      } catch { /* ignore */ }
    }
  } catch { /* ignore */ }
  return signals;
}

function ema(prev: number, sample: number, alpha: number) {
  return prev * (1 - alpha) + sample * alpha;
}

export function createHeuristics(opts: CreateHeuristicsOpts = {}) {
  const storage = opts.storage;
  const storageKey = opts.storageKey ?? 'heuristics_v1';
  const methods = (opts.methods?.length ? opts.methods : defaultMethods).slice(0, 6); // keep it small
  const emaAlpha = opts.emaAlpha ?? 0.3;
  const breakerMs = opts.breakerMs ?? 60_000;
  const initialAvgRttMs = opts.initialAvgRttMs ?? 800;
  const clock = opts.clock ?? Date.now;

  const defaultState = async (): Promise<HeuristicsState> => ({
    methods: Object.fromEntries(methods.map(m => [m, { successes: 0, failures: 0, avgRttMs: initialAvgRttMs }])) as Record<MethodKey, MethodStats>,
    env: { ...detectEnv(), ...(opts.envOverrides || {}) },
    signals: { ...(await gatherSignals()), ...(opts.initialSignals || {}) },
  });

  async function load(): Promise<HeuristicsState> {
    if (!storage) return await defaultState();
    try {
      const raw = await storage.getItem(storageKey);
      if (!raw) return await defaultState();
      const parsed = JSON.parse(raw) as HeuristicsState;
      // Merge new methods if caller changed set
      for (const m of methods) {
        if (!parsed.methods[m]) parsed.methods[m] = { successes: 0, failures: 0, avgRttMs: initialAvgRttMs };
      }
      parsed.env = { ...detectEnv(), ...(opts.envOverrides || {}), ...(parsed.env || {}) };
      parsed.signals = { ...(await gatherSignals()), ...(opts.initialSignals || {}), ...(parsed.signals || {}) };
      return parsed;
    } catch { return await defaultState(); }
  }

  async function save(state: HeuristicsState) {
    if (!storage) return;
    try { await storage.setItem(storageKey, JSON.stringify(state)); } catch {}
  }

  async function recordOutcome(method: MethodKey, outcome: Outcome, rttMs?: number) {
    const s = await load();
    if (!s.methods[method]) s.methods[method] = { successes: 0, failures: 0, avgRttMs: initialAvgRttMs };
    const m = s.methods[method];

    if (outcome === 'success') {
      m.successes += 1;
      if (typeof rttMs === 'number') m.avgRttMs = ema(m.avgRttMs, rttMs, emaAlpha);
      m.openUntil = undefined;
    } else {
      m.failures += 1;
      const failRate = m.failures / Math.max(1, m.successes + m.failures);
      if (failRate >= 0.5) m.openUntil = clock() + breakerMs;
    }
    m.lastOutcome = outcome;
    m.lastAt = clock();
    await save(s);
  }

  type ChooseOpts = {
    hardPreference?: MethodKey; // e.g., set by platform (like iOS Expo Go -> 'rest')
    clampTimeoutMs?: { min: number; max: number };
    timeoutMultiplier?: number;  // default 4x EMA
  };

  async function chooseMethod(opts2: ChooseOpts = {}) {
    const s = await load();
    const { hardPreference, clampTimeoutMs = { min: 4000, max: 20000 }, timeoutMultiplier = 4 } = opts2;

    const candidates = methods.filter(m => {
      const mm = s.methods[m];
      return !(mm?.openUntil && mm.openUntil > clock());
    });

    const score = (m: MethodKey) => {
      const mm = s.methods[m] || { successes: 0, failures: 0, avgRttMs: initialAvgRttMs };
      const rtt = Math.max(200, Math.min(5000, mm.avgRttMs));
      const succ = mm.successes;
      const tot = mm.successes + mm.failures || 1;
      const succRate = succ / tot;
      const hard = hardPreference === m ? 2 : 0;

      // Prefer methods with lower RTT and higher success rate
      return hard + (succRate * 1.5) + (1000 / rtt);
    };

    const chosen = (candidates.length ? candidates : methods).slice().sort((a, b) => score(b) - score(a))[0];
    const emaRtt = s.methods[chosen]?.avgRttMs || initialAvgRttMs;
    const timeoutMs = Math.round(
      Math.min(clampTimeoutMs.max, Math.max(clampTimeoutMs.min, emaRtt * timeoutMultiplier))
    );

    s.lastChosen = chosen;
    await save(s);

    return {
      method: chosen,
      timeoutMs,
      reason: `ema=${Math.round(emaRtt)}ms, hardPref=${hardPreference ?? 'none'}`,
      signals: s.signals,
      env: s.env,
    };
  }

  // --- Higher-level convenience heuristics ---

  function getFrameBudgetHz(): 60 | 120 {
    // crude: if deviceMemory hint high and downlink ok, allow 120hz
    // browsers with high refresh will still only render as supported
    return (typeof window !== 'undefined' && (window as { matchMedia?: (query: string) => { matches: boolean } }).matchMedia?.('(min-resolution: 2dppx)') && (window as { matchMedia: (query: string) => { matches: boolean } }).matchMedia('(prefers-reduced-motion: no-preference)').matches)
      ? 60 : 60; // keep conservative by default; adjust if you have device DB
  }

  async function shouldUseLowResMedia(): Promise<boolean> {
    const s = await load();
    const c = s.signals;
    return !!(
      c.saveData ||
      (c.downlinkMbps !== undefined && c.downlinkMbps < 1.5) ||
      c.connectionType === 'cellular'
    );
  }

  async function shouldVirtualize(estimatedItems: number): Promise<boolean> {
    const s = await load();
    const lowMem = (s.signals.deviceMemoryGB !== undefined && s.signals.deviceMemoryGB <= 2);
    return estimatedItems > 100 || lowMem;
  }

  function getRetryPolicy() {
    // Exponential backoff with jitter
    return {
      maxRetries: 3,
      computeDelayMs: (attempt: number) => {
        const base = Math.min(1000 * Math.pow(2, attempt), 15_000);
        const jitter = Math.floor(Math.random() * 250);
        return base + jitter;
      },
    };
  }

  function getRenderOnlyLimitMs() {
    // throttle UI re-render bursts (client)
    return 50; // safe default; tune per view
  }

  return {
    load,
    recordOutcome,
    chooseMethod,
    shouldUseLowResMedia,
    shouldVirtualize,
    getRetryPolicy,
    getFrameBudgetHz,
    getRenderOnlyLimitMs,
  };
}


