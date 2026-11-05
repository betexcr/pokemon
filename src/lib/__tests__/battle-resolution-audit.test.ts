import { describe, it, expect } from 'vitest';
import { auditAppliedAction } from '../battle-resolution-audit';

describe('auditAppliedAction', () => {
  const res = (p1Action: Record<string, unknown>, validation: Record<string, unknown> = { p1: null, p2: null, normalized: false }) =>
    ({ replay: { turn: 3, p1Action, p2Action: { type: 'move', moveId: 'tackle' } }, validation });

  it('accepts the applied action, including forced replacements of a move', () => {
    expect(auditAppliedAction({ type: 'move', moveId: 'surf' }, res({ type: 'move', moveId: 'surf' }), 'p1')).toEqual({ ok: true });
    expect(auditAppliedAction({ type: 'move', moveId: 'surf' }, res({ type: 'move', moveId: 'outrage' }), 'p1')).toEqual({ ok: true });
    expect(auditAppliedAction({ type: 'switch', switchIndex: 2 }, res({ type: 'switch', switchIndex: 2 }), 'p1')).toEqual({ ok: true });
  });

  it('flags a different action the server did not explain', () => {
    expect(auditAppliedAction({ type: 'switch', switchIndex: 2 }, res({ type: 'switch', switchIndex: 4 }), 'p1').ok).toBe(false);
    expect(auditAppliedAction({ type: 'switch', switchIndex: 2 }, res({ type: 'move', moveId: 'surf' }), 'p1').ok).toBe(false);
    expect(auditAppliedAction({ type: 'move', moveId: 'surf' }, res({ type: 'switch', switchIndex: 1 }), 'p1').ok).toBe(false);
  });

  it('trusts reported normalizations and rejections, and skips old resolutions', () => {
    expect(auditAppliedAction({ type: 'switch', switchIndex: 2 }, res({ type: 'move', moveId: 'struggle' }, { normalized: true }), 'p1')).toEqual({ ok: true });
    expect(auditAppliedAction({ type: 'switch', switchIndex: 2 }, res({ type: 'move' }, { p1: 'switch_trapped' }), 'p1')).toEqual({ ok: true });
    expect(auditAppliedAction({ type: 'move', moveId: 'surf' }, null, 'p1')).toEqual({ ok: true });
  });
});
