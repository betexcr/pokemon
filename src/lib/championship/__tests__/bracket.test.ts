import { describe, it, expect } from 'vitest';
import {
  generateBracket,
  seedBracket,
  advanceWinner,
  getCurrentRoundMatches,
  isRoundComplete,
  getTotalRounds,
  getRoundName,
} from '../bracket';
import type { ChampionshipParticipant, ChampionshipSize } from '../types';

function makeParticipants(n: number): ChampionshipParticipant[] {
  return Array.from({ length: n }, (_, i) => ({
    uid: `uid-${i + 1}`,
    name: `Player ${i + 1}`,
    seed: i + 1,
  }));
}

describe('generateBracket', () => {
  const sizes: ChampionshipSize[] = [4, 8, 16, 32];

  sizes.forEach((size) => {
    it(`creates ${size - 1} matches for size ${size}`, () => {
      const bracket = generateBracket(size);
      expect(bracket).toHaveLength(size - 1);
    });

    it(`has ${Math.log2(size)} rounds for size ${size}`, () => {
      const bracket = generateBracket(size);
      const rounds = new Set(bracket.map((m) => m.round));
      expect(rounds.size).toBe(Math.log2(size));
    });

    it(`round 1 has ${size / 2} matches for size ${size}`, () => {
      const bracket = generateBracket(size);
      const r1 = bracket.filter((m) => m.round === 1);
      expect(r1).toHaveLength(size / 2);
    });

    it(`final round has 1 match for size ${size}`, () => {
      const bracket = generateBracket(size);
      const totalRounds = Math.log2(size);
      const final = bracket.filter((m) => m.round === totalRounds);
      expect(final).toHaveLength(1);
    });
  });

  it('all matches start as pending', () => {
    const bracket = generateBracket(8);
    bracket.forEach((m) => expect(m.status).toBe('pending'));
  });

  it('match IDs follow r{round}-m{position} pattern', () => {
    const bracket = generateBracket(4);
    expect(bracket.map((m) => m.id)).toEqual(['r1-m0', 'r1-m1', 'r2-m0']);
  });
});

describe('seedBracket', () => {
  it('places all participants into round 1', () => {
    const bracket = generateBracket(4);
    const participants = makeParticipants(4);
    const seeded = seedBracket(bracket, participants);

    const r1 = seeded.filter((m) => m.round === 1);
    const allPlayers = r1.flatMap((m) => [m.player1Uid, m.player2Uid]);
    expect(allPlayers.filter(Boolean)).toHaveLength(4);
  });

  it('pairs seed 1 vs seed N in standard seeding', () => {
    const bracket = generateBracket(4);
    const participants = makeParticipants(4);
    const seeded = seedBracket(bracket, participants);

    const r1 = seeded.filter((m) => m.round === 1);
    const match0 = r1.find((m) => m.position === 0)!;
    expect(match0.player1Seed).toBe(1);
    expect(match0.player2Seed).toBe(4);
  });

  it('sets round 1 matches to ready when both players present', () => {
    const bracket = generateBracket(8);
    const participants = makeParticipants(8);
    const seeded = seedBracket(bracket, participants);

    const r1 = seeded.filter((m) => m.round === 1);
    r1.forEach((m) => expect(m.status).toBe('ready'));
  });

  it('leaves later rounds as pending', () => {
    const bracket = generateBracket(8);
    const participants = makeParticipants(8);
    const seeded = seedBracket(bracket, participants);

    const later = seeded.filter((m) => m.round > 1);
    later.forEach((m) => expect(m.status).toBe('pending'));
  });
});

describe('advanceWinner', () => {
  it('marks the completed match and places winner into next round', () => {
    const bracket = generateBracket(4);
    const participants = makeParticipants(4);
    let seeded = seedBracket(bracket, participants);

    const updated = advanceWinner(seeded, 'r1-m0', 'uid-1', 1);

    const r1m0 = updated.find((m) => m.id === 'r1-m0')!;
    expect(r1m0.status).toBe('completed');
    expect(r1m0.winnerUid).toBe('uid-1');

    const final = updated.find((m) => m.id === 'r2-m0')!;
    expect(final.player1Uid).toBe('uid-1');
    expect(final.status).toBe('pending');
  });

  it('sets next match to ready when both slots filled', () => {
    const bracket = generateBracket(4);
    const participants = makeParticipants(4);
    let seeded = seedBracket(bracket, participants);

    seeded = advanceWinner(seeded, 'r1-m0', 'uid-1', 1);
    seeded = advanceWinner(seeded, 'r1-m1', 'uid-2', 2);

    const final = seeded.find((m) => m.id === 'r2-m0')!;
    expect(final.player1Uid).toBe('uid-1');
    expect(final.player2Uid).toBe('uid-2');
    expect(final.status).toBe('ready');
  });

  it('throws for unknown match ID', () => {
    const bracket = generateBracket(4);
    expect(() => advanceWinner(bracket, 'r99-m99', 'uid-1')).toThrow('not found');
  });
});

describe('getCurrentRoundMatches', () => {
  it('returns only matches for the given round', () => {
    const bracket = generateBracket(8);
    const r1 = getCurrentRoundMatches(bracket, 1);
    expect(r1).toHaveLength(4);
    r1.forEach((m) => expect(m.round).toBe(1));

    const r2 = getCurrentRoundMatches(bracket, 2);
    expect(r2).toHaveLength(2);
  });
});

describe('isRoundComplete', () => {
  it('returns false when matches are pending', () => {
    const bracket = generateBracket(4);
    expect(isRoundComplete(bracket, 1)).toBe(false);
  });

  it('returns true when all matches in round are completed', () => {
    const bracket = generateBracket(4);
    const participants = makeParticipants(4);
    let seeded = seedBracket(bracket, participants);

    seeded = advanceWinner(seeded, 'r1-m0', 'uid-1', 1);
    seeded = advanceWinner(seeded, 'r1-m1', 'uid-2', 2);

    expect(isRoundComplete(seeded, 1)).toBe(true);
  });

  it('returns false when only some matches are completed', () => {
    const bracket = generateBracket(4);
    const participants = makeParticipants(4);
    let seeded = seedBracket(bracket, participants);

    seeded = advanceWinner(seeded, 'r1-m0', 'uid-1', 1);

    expect(isRoundComplete(seeded, 1)).toBe(false);
  });
});

describe('getTotalRounds', () => {
  it.each([
    [4, 2],
    [8, 3],
    [16, 4],
    [32, 5],
  ] as [ChampionshipSize, number][])('size %d has %d rounds', (size, expected) => {
    expect(getTotalRounds(size)).toBe(expected);
  });
});

describe('getRoundName', () => {
  it('returns Final for the last round', () => {
    expect(getRoundName(3, 3)).toBe('Final');
  });

  it('returns Semifinals for the second-to-last round', () => {
    expect(getRoundName(2, 3)).toBe('Semifinals');
  });

  it('returns Quarterfinals for the third-to-last round', () => {
    expect(getRoundName(2, 4)).toBe('Quarterfinals');
  });

  it('returns Round N for earlier rounds', () => {
    expect(getRoundName(1, 5)).toBe('Round 1');
    expect(getRoundName(2, 5)).toBe('Round 2');
  });
});
