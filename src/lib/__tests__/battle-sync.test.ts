import { describe, it, expect, vi } from 'vitest';
import { syncBattle } from '../battle-sync';
import { RESOLVING_STALE_MS } from '../battle-resolution-claim';

const NOW = 1_700_000_000_000;

function makeDeps(data: Record<string, unknown>) {
  const ops = {
    get: vi.fn(async (path: string) => data[path] ?? null),
    set: vi.fn(),
    update: vi.fn(),
  };
  return {
    ops,
    enforceTurnDeadline: vi.fn(async () => true),
    resolveTurn: vi.fn(async () => {}),
    finalizeEnded: vi.fn(async () => {}),
    now: () => NOW,
  };
}

const players = { p1: { uid: 'a' }, p2: { uid: 'b' } };

describe('syncBattle', () => {
  it('rejects non-participants', async () => {
    const deps = makeDeps({ 'battles/x/meta': { players, phase: 'choosing', turn: 1 } });
    await expect(syncBattle('x', 'intruder', deps as never)).rejects.toThrow(/participant/);
  });

  it('enforces a passed deadline', async () => {
    const deps = makeDeps({ 'battles/x/meta': { players, phase: 'choosing', turn: 3, deadlineAt: NOW - 1 } });
    expect((await syncBattle('x', 'a', deps as never)).outcome).toBe('timed-out');
    expect(deps.enforceTurnDeadline).toHaveBeenCalledWith('x');
  });

  it('resolves a turn whose choices are all in (the submit request died)', async () => {
    const deps = makeDeps({
      'battles/x/meta': { players, phase: 'choosing', turn: 3, deadlineAt: NOW + 10_000 },
      'battles/x/turns/3/choices': { a: { action: 'move' }, b: { action: 'move' } },
    });
    expect((await syncBattle('x', 'b', deps as never)).outcome).toBe('resolved');
    expect(deps.resolveTurn).toHaveBeenCalledWith('x');
  });

  it('does nothing while the opponent is still choosing', async () => {
    const deps = makeDeps({
      'battles/x/meta': { players, phase: 'choosing', turn: 3, deadlineAt: NOW + 10_000 },
      'battles/x/turns/3/choices': { a: { action: 'move' } },
    });
    expect((await syncBattle('x', 'a', deps as never)).outcome).toBe('none');
    expect(deps.resolveTurn).not.toHaveBeenCalled();
  });

  it('recovers a stale resolution and leaves a fresh one alone', async () => {
    const stale = makeDeps({ 'battles/x/meta': { players, phase: 'resolving', turn: 3, resolvingStartedAt: Date.now() - RESOLVING_STALE_MS - 1 } });
    expect((await syncBattle('x', 'a', stale as never)).outcome).toBe('recovered');
    const fresh = makeDeps({ 'battles/x/meta': { players, phase: 'resolving', turn: 3, resolvingStartedAt: Date.now() } });
    expect((await syncBattle('x', 'a', fresh as never)).outcome).toBe('none');
    expect(fresh.resolveTurn).not.toHaveBeenCalled();
  });

  it('finishes a battle whose final turn was written but never closed', async () => {
    const deps = makeDeps({
      'battles/x/meta': { players, phase: 'resolving', turn: 9, resolvingStartedAt: Date.now() },
      'battles/x/turns/9/resolution': { stateHash: 'h' },
    });
    expect((await syncBattle('x', 'a', deps as never)).outcome).toBe('finalized');
    expect(deps.finalizeEnded).toHaveBeenCalled();
  });

  it('is a no-op for ended battles', async () => {
    const deps = makeDeps({ 'battles/x/meta': { players, phase: 'ended', turn: 9 } });
    expect((await syncBattle('x', 'a', deps as never)).outcome).toBe('ended');
  });
});
