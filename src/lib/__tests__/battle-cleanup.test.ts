import { describe, it, expect, vi } from 'vitest';
import { DEFAULT_CLEANUP_POLICY, runBattleCleanup, type CleanupDeps } from '../server/battle-cleanup';

const NOW = 1_800_000_000_000;
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

function deps(battles: Array<{ id: string; meta: Record<string, unknown> | null }>, rooms: Record<string, Array<{ id: string; status: string; createdAt: number }>> = {}) {
  const allRooms = Object.values(rooms).flat();
  const d: CleanupDeps = {
    now: () => NOW,
    listBattlesCreatedBefore: vi.fn(async (cutoff: number) =>
      battles.filter((b) => ((b.meta?.createdAt as number) ?? 0) <= cutoff) as never),
    endStaleBattle: vi.fn(async () => true),
    deleteBattle: vi.fn(async () => {}),
    listRoomsCreatedBefore: vi.fn(async (statuses: string[], cutoff: number) =>
      allRooms.filter((r) => statuses.includes(r.status) && r.createdAt < cutoff).map((r) => r.id)),
    deleteRoom: vi.fn(async () => {}),
  };
  return d;
}

describe('runBattleCleanup', () => {
  it('ends stale unfinished battles and deletes old ones', async () => {
    const d = deps([
      { id: 'active', meta: { phase: 'choosing', createdAt: NOW - HOUR, deadlineAt: NOW + 10_000 } },
      { id: 'stale', meta: { phase: 'choosing', createdAt: NOW - 2 * HOUR, deadlineAt: NOW - HOUR } },
      { id: 'recent-ended', meta: { phase: 'ended', createdAt: NOW - 2 * DAY } },
      { id: 'old-ended', meta: { phase: 'ended', createdAt: NOW - 8 * DAY } },
      { id: 'abandoned', meta: { phase: 'resolving', createdAt: NOW - 4 * DAY, deadlineAt: NOW - 4 * DAY } },
      { id: 'broken', meta: null },
    ]);
    const report = await runBattleCleanup(d);
    expect(d.endStaleBattle).toHaveBeenCalledTimes(1);
    expect(d.endStaleBattle).toHaveBeenCalledWith('stale');
    expect((d.deleteBattle as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0]).sort()).toEqual(['abandoned', 'broken', 'old-ended']);
    expect(report).toMatchObject({ battlesEnded: 1, battlesDeleted: 3, errors: 0 });
  });

  it('deletes old open lobbies after a day and closed rooms after a week', async () => {
    const d = deps([], {
      rooms: [
        { id: 'fresh-lobby', status: 'waiting', createdAt: NOW - HOUR },
        { id: 'old-lobby', status: 'ready', createdAt: NOW - 2 * DAY },
        { id: 'recent-finished', status: 'finished', createdAt: NOW - 3 * DAY },
        { id: 'old-finished', status: 'finished', createdAt: NOW - 9 * DAY },
      ],
    });
    const report = await runBattleCleanup(d);
    expect((d.deleteRoom as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0]).sort()).toEqual(['old-finished', 'old-lobby']);
    expect(report.roomsDeleted).toBe(2);
  });

  it('keeps going when one item fails', async () => {
    const d = deps([
      { id: 'a', meta: { phase: 'ended', createdAt: NOW - 10 * DAY } },
      { id: 'b', meta: { phase: 'ended', createdAt: NOW - 10 * DAY } },
    ]);
    (d.deleteBattle as ReturnType<typeof vi.fn>).mockImplementationOnce(async () => { throw new Error('boom'); });
    const report = await runBattleCleanup(d);
    expect(report).toMatchObject({ battlesDeleted: 1, errors: 1 });
    expect(DEFAULT_CLEANUP_POLICY.batchSize).toBeGreaterThan(0);
  });
});
