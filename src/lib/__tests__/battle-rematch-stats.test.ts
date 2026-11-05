import { describe, it, expect, vi } from 'vitest';
import { requestRematch } from '../battle-rematch';
import { accumulateBattleTotals, hpSnapshot, publicBattleStats } from '../battle-summary-stats';
import type { BattlePokemon, BattleState } from '../team-battle-engine';

function store(initial: Record<string, unknown>) {
  const data: Record<string, unknown> = { ...initial };
  return {
    data,
    ops: {
      get: vi.fn(async (path: string) => {
        if (path in data) return data[path];
        const prefix = `${path}/`;
        const entries = Object.entries(data).filter(([k]) => k.startsWith(prefix));
        return entries.length ? Object.fromEntries(entries.map(([k, v]) => [k.slice(prefix.length), v])) : null;
      }),
      set: vi.fn(async (path: string, value: unknown) => { data[path] = value; }),
      update: vi.fn(),
    },
  };
}

const meta = { players: { p1: { uid: 'a' }, p2: { uid: 'b' } }, phase: 'ended', turn: 12 };

describe('requestRematch', () => {
  it('waits for the second player, then resets the room once', async () => {
    const s = store({ 'battles/x/meta': meta });
    const resetRoom = vi.fn(async () => true);
    const deps = { ops: s.ops as never, findRoomId: async () => 'room-1', resetRoom };
    expect(await requestRematch('x', 'a', deps)).toEqual({ status: 'waiting' });
    expect(resetRoom).not.toHaveBeenCalled();
    expect(await requestRematch('x', 'b', deps)).toEqual({ status: 'ready', roomId: 'room-1' });
    expect(resetRoom).toHaveBeenCalledWith('room-1', 'x');
    // A late click gets the room without resetting it again
    expect(await requestRematch('x', 'a', deps)).toEqual({ status: 'ready', roomId: 'room-1' });
    expect(resetRoom).toHaveBeenCalledTimes(1);
  });

  it('refuses before the battle ends, for outsiders, and when the room moved on', async () => {
    const live = store({ 'battles/x/meta': { ...meta, phase: 'choosing' } });
    expect((await requestRematch('x', 'a', { ops: live.ops as never, findRoomId: async () => 'r', resetRoom: async () => true })).status).toBe('unavailable');
    await expect(requestRematch('x', 'z', { ops: live.ops as never, findRoomId: async () => 'r', resetRoom: async () => true })).rejects.toThrow(/participant/);
    const moved = store({ 'battles/x/meta': meta, 'battles/x/rematch/a': 1 });
    expect(await requestRematch('x', 'b', { ops: moved.ops as never, findRoomId: async () => 'r', resetRoom: async () => false }))
      .toEqual({ status: 'unavailable', reason: 'The room has moved on to another battle' });
  });
});

describe('battle summary stats', () => {
  const mon = (hp: number, max = 100) => ({ currentHp: hp, maxHp: max }) as BattlePokemon;
  it('accumulates HP lost (not offset by healing) and reports KOs and survivors', () => {
    const state = { player: { pokemon: [mon(100), mon(100)] }, opponent: { pokemon: [mon(100), mon(100)] } } as unknown as BattleState;
    let before = hpSnapshot(state);
    state.opponent.pokemon[0].currentHp = 0; // KO
    state.player.pokemon[0].currentHp = 70;
    accumulateBattleTotals(state, before);
    before = hpSnapshot(state);
    state.player.pokemon[0].currentHp = 90; // healed: does not reduce damage taken
    state.opponent.pokemon[1].currentHp = 50;
    accumulateBattleTotals(state, before);
    const stats = publicBattleStats(state);
    expect(stats.p1).toEqual({ kos: 1, remaining: 2, teamSize: 2, damageDealtPct: 75, damageTakenPct: 15 });
    expect(stats.p2).toEqual({ kos: 0, remaining: 1, teamSize: 2, damageDealtPct: 15, damageTakenPct: 75 });
  });
});
