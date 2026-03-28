import type {
  ChampionshipSize,
  ChampionshipMatch,
  ChampionshipParticipant,
  MatchStatus,
} from './types';

/**
 * Generate the full match tree for a single-elimination bracket.
 * N players -> N-1 matches across log2(N) rounds.
 */
export function generateBracket(size: ChampionshipSize): ChampionshipMatch[] {
  const totalRounds = Math.log2(size);
  const matches: ChampionshipMatch[] = [];

  for (let round = 1; round <= totalRounds; round++) {
    const matchesInRound = size / Math.pow(2, round);
    for (let pos = 0; pos < matchesInRound; pos++) {
      matches.push({
        id: `r${round}-m${pos}`,
        round,
        position: pos,
        status: 'pending',
      });
    }
  }

  return matches;
}

/**
 * Standard tournament seeding: Seed 1 faces Seed N in the same half-bracket,
 * ensuring top seeds meet as late as possible.
 *
 * For round 1 match i (0-indexed): player1 = seed i+1, player2 = seed N-i
 */
export function seedBracket(
  bracket: ChampionshipMatch[],
  participants: ChampionshipParticipant[]
): ChampionshipMatch[] {
  const size = participants.length;
  const sorted = [...participants].sort((a, b) => a.seed - b.seed);

  const seedOrder = buildSeedOrder(size);

  return bracket.map((match) => {
    if (match.round !== 1) return match;

    const pairIndex = match.position;
    const s1Index = seedOrder[pairIndex * 2];
    const s2Index = seedOrder[pairIndex * 2 + 1];

    const p1 = sorted[s1Index];
    const p2 = sorted[s2Index];

    return {
      ...match,
      player1Uid: p1?.uid,
      player1Seed: p1?.seed,
      player2Uid: p2?.uid,
      player2Seed: p2?.seed,
      status: (p1 && p2 ? 'ready' : 'pending') as MatchStatus,
    };
  });
}

/**
 * Build the standard tournament seed ordering so that top seeds are placed
 * in opposite ends of the bracket and meet as late as possible.
 *
 * Uses the recursive doubling algorithm: start with [0,1] (seed 1 vs 2),
 * then at each step pair each existing slot with its complement to fill the
 * next bracket size. This ensures seed 1 and seed 2 are in opposite halves,
 * seed 1-4 are each in separate quarter-brackets, etc.
 *
 * Returns an array of participant indices (0-based) where consecutive pairs
 * form a match: [match0_p1, match0_p2, match1_p1, match1_p2, ...]
 */
function buildSeedOrder(size: number): number[] {
  let slots = [0, 1];
  while (slots.length < size) {
    const next: number[] = [];
    const max = slots.length * 2 - 1;
    for (const s of slots) {
      next.push(s, max - s);
    }
    slots = next;
  }
  return slots;
}

/**
 * After a match completes, place the winner into the next round's match.
 * Returns the updated bracket.
 */
export function advanceWinner(
  bracket: ChampionshipMatch[],
  matchId: string,
  winnerUid: string,
  winnerSeed?: number
): ChampionshipMatch[] {
  const matchIndex = bracket.findIndex((m) => m.id === matchId);
  if (matchIndex === -1) throw new Error(`Match ${matchId} not found`);

  const match = bracket[matchIndex];
  const nextRound = match.round + 1;
  const nextPosition = Math.floor(match.position / 2);
  const nextMatchId = `r${nextRound}-m${nextPosition}`;
  const isUpperSlot = match.position % 2 === 0;

  return bracket.map((m) => {
    if (m.id === matchId) {
      return { ...m, winnerUid, status: 'completed' as MatchStatus };
    }
    if (m.id === nextMatchId) {
      const updated = isUpperSlot
        ? { ...m, player1Uid: winnerUid, player1Seed: winnerSeed }
        : { ...m, player2Uid: winnerUid, player2Seed: winnerSeed };

      const ready = updated.player1Uid && updated.player2Uid;
      return { ...updated, status: (ready ? 'ready' : 'pending') as MatchStatus };
    }
    return m;
  });
}

export function getCurrentRoundMatches(
  bracket: ChampionshipMatch[],
  round: number
): ChampionshipMatch[] {
  return bracket.filter((m) => m.round === round);
}

export function isRoundComplete(
  bracket: ChampionshipMatch[],
  round: number
): boolean {
  return getCurrentRoundMatches(bracket, round).every(
    (m) => m.status === 'completed'
  );
}

export function getTotalRounds(size: ChampionshipSize): number {
  return Math.log2(size);
}

export function getRoundName(round: number, totalRounds: number): string {
  const remaining = totalRounds - round;
  if (remaining === 0) return 'Final';
  if (remaining === 1) return 'Semifinals';
  if (remaining === 2) return 'Quarterfinals';
  return `Round ${round}`;
}
