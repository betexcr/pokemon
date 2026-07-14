import type { TeamSlot } from '@/lib/userTeams';

/** Cumulative National Dex maximum at the end of each generation (inclusive cap for "through Gen N"). */
export const NATIONAL_DEX_MAX_BY_GENERATION: Record<number, number> = {
  1: 151,
  2: 251,
  3: 386,
  4: 493,
  5: 649,
  6: 721,
  7: 809,
  8: 905,
  9: 1025,
};

const MIN_GEN = 1;
const MAX_GEN = 9;

export function getMaxNationalDexForGeneration(gen: number): number {
  if (!Number.isInteger(gen) || gen < MIN_GEN || gen > MAX_GEN) {
    throw new Error(`Invalid generation: ${gen}`);
  }
  return NATIONAL_DEX_MAX_BY_GENERATION[gen];
}

/** Dex ID range for species introduced in exactly `gen` (used e.g. by grouped generation fetches). */
export function getGenerationExclusiveDexRange(gen: number): { start: number; end: number } {
  const end = getMaxNationalDexForGeneration(gen);
  const start = gen <= 1 ? 1 : getMaxNationalDexForGeneration(gen - 1) + 1;
  return { start, end };
}

export function teamWithinMaxGeneration(
  slots: TeamSlot[] | undefined,
  maxGen: number | undefined
): boolean {
  if (maxGen == null) return true;
  const maxDex = getMaxNationalDexForGeneration(maxGen);
  for (const slot of slots ?? []) {
    const id = slot?.id;
    if (id == null) continue;
    if (id < 1 || id > maxDex) return false;
  }
  return true;
}

export function validateTeamMaxGeneration(
  slots: TeamSlot[] | undefined,
  maxGen: number | undefined
): { ok: true } | { ok: false; message: string } {
  if (maxGen == null) return { ok: true };
  const maxDex = getMaxNationalDexForGeneration(maxGen);
  let index = 0;
  for (const slot of slots ?? []) {
    const id = slot?.id;
    if (id == null) {
      index++;
      continue;
    }
    if (id < 1 || id > maxDex) {
      return {
        ok: false,
        message: `Slot ${index + 1} uses a Pokémon not allowed when play is capped through Gen ${maxGen} (National Dex must be ≤ ${maxDex}).`,
      };
    }
    index++;
  }
  return { ok: true };
}

/** User-facing sentence for championship details; null if no limit or invalid stored value. */
export function formatChampionshipGenerationRule(maxGen: number | undefined): string | null {
  if (maxGen == null) return null;
  if (!Number.isInteger(maxGen) || maxGen < MIN_GEN || maxGen > MAX_GEN) return null;
  const maxDex = NATIONAL_DEX_MAX_BY_GENERATION[maxGen];
  return `Teams may only include Pokémon through Gen ${maxGen} (National Dex #1–${maxDex}).`;
}
