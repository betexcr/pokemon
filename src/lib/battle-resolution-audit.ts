// Client-side audit of server resolutions. Turns are resolved only by the server (Admin), so the old
// "guest verifies the host's resolution" problem no longer exists; what a player can still check is that
// the server applied the action they chose. Each resolution carries `replay.p1Action / p2Action`, so a
// client compares its own submission with what was applied and reports a mismatch that the server did
// not explain (normalizations and rejections are reported in `validation`).

export type SubmittedAction =
  | { type: 'move'; moveId: string; terastallize?: boolean }
  | { type: 'switch'; switchIndex: number };

type AppliedAction = { type?: string; moveId?: string; switchIndex?: number; terastallize?: boolean };

export type ResolutionLike = {
  replay?: { turn?: number; p1Action?: AppliedAction; p2Action?: AppliedAction };
  validation?: { p1?: string | null; p2?: string | null; normalized?: boolean };
};

export type AuditResult = { ok: true } | { ok: false; reason: string };

export function auditAppliedAction(
  submitted: SubmittedAction,
  resolution: ResolutionLike | null | undefined,
  side: 'p1' | 'p2',
): AuditResult {
  if (!resolution?.replay) return { ok: true }; // nothing to compare (older battles)
  // The server said it normalized (e.g. to Struggle) or rejected this side's action
  if (resolution.validation?.[side] || resolution.validation?.normalized) return { ok: true };
  const applied = side === 'p1' ? resolution.replay.p1Action : resolution.replay.p2Action;
  if (!applied) return { ok: false, reason: 'no action recorded for your side' };
  if (submitted.type === 'move') {
    if (applied.type !== 'move' && applied.type !== 'pursuit') {
      return { ok: false, reason: `you chose ${submitted.moveId}, the server applied a ${applied.type ?? 'nothing'}` };
    }
    // A different move id is legitimate: forced moves (Outrage lock, recharge, Encore) replace the pick
    return { ok: true };
  }
  if (applied.type !== 'switch') return { ok: false, reason: `you chose a switch, the server applied a ${applied.type ?? 'nothing'}` };
  if (applied.switchIndex !== submitted.switchIndex) {
    return { ok: false, reason: `you switched to slot ${submitted.switchIndex + 1}, the server sent in slot ${(applied.switchIndex ?? -1) + 1}` };
  }
  return { ok: true };
}
