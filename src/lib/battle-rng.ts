export type BattleRng = {
  seed: number;
  state: number;
  calls: number;
};

const RNG_MOD = 0x7fffffff; // 2^31 - 1, Lehmer RNG modulus
const RNG_MULT = 48271; // Lehmer multiplier (MINSTD)

export function createBattleRng(seed?: number): BattleRng {
  let base = seed ?? Date.now();
  if (!Number.isFinite(base)) {
    base = Date.now();
  }
  base = Math.floor(Math.abs(base)) % RNG_MOD;
  if (base === 0) {
    base = 1;
  }

  return {
    seed: base,
    state: base,
    calls: 0,
  };
}

export function normalizeBattleRng(value?: BattleRng | number | null): BattleRng {
  if (!value && value !== 0) {
    return createBattleRng();
  }

  if (typeof value === 'number') {
    return createBattleRng(value);
  }

  if (typeof value.seed !== 'number' || typeof value.state !== 'number') {
    return createBattleRng();
  }

  return {
    seed: value.seed,
    state: value.state || value.seed,
    calls: value.calls ?? 0,
  };
}

export function advance(rng: BattleRng): number {
  const next = (rng.state * RNG_MULT) % RNG_MOD;
  rng.state = next;
  rng.calls += 1;
  return next;
}

export function advanceSteps(rng: BattleRng, steps: number): void {
  if (steps <= 0) return;
  for (let i = 0; i < steps; i++) {
    advance(rng);
  }
}

export function rngNextFloat(rng: BattleRng): number {
  return advance(rng) / RNG_MOD;
}

export function rngNextInt(rng: BattleRng, maxExclusive: number): number {
  if (maxExclusive <= 0) return 0;
  return Math.floor(rngNextFloat(rng) * maxExclusive);
}

export function rngRollChance(rng: BattleRng, probability: number): boolean {
  if (probability <= 0) return false;
  if (probability >= 1) return true;
  return rngNextFloat(rng) < probability;
}

export function rngWeighted<T>(rng: BattleRng, weights: Array<{ weight: number; value: T }>): T {
  const total = weights.reduce((sum, item) => sum + Math.max(0, item.weight), 0);
  if (total <= 0) {
    return weights[0]?.value as T;
  }
  const roll = rngNextFloat(rng) * total;
  let cumulative = 0;
  for (const item of weights) {
    const w = Math.max(0, item.weight);
    cumulative += w;
    if (roll < cumulative) {
      return item.value;
    }
  }
  return weights[weights.length - 1]!.value;
}

export function cloneBattleRng(rng: BattleRng): BattleRng {
  return { seed: rng.seed, state: rng.state, calls: rng.calls };
}

