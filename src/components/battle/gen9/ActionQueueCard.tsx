import { Clock, Zap, Shuffle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BattleState } from '@/lib/team-battle-engine';

const PRIORITY_BADGES: Record<number, string> = {
  6: 'Switch',
  5: '+5',
  4: '+4',
  3: '+3',
  2: '+2',
  1: '+1',
  0: '0',
  '-1': '-1',
  '-2': '-2',
  '-3': '-3',
  '-6': 'Trick Room',
};

interface ActionQueueCardProps {
  queue?: BattleState['actionQueue'];
  trickRoomActive?: boolean;
}

export function ActionQueueCard({ queue, trickRoomActive }: ActionQueueCardProps) {
  if (!queue || queue.length === 0) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-3 shadow-lg backdrop-blur">
      <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-200">
        <Clock className="h-4 w-4" />
        Action Queue
        {trickRoomActive && (
          <span className="inline-flex items-center gap-1 rounded-full border border-purple-400/50 bg-purple-500/20 px-2 py-0.5 text-[10px] font-semibold text-purple-100">
            <Shuffle className="h-3 w-3" /> Trick Room
          </span>
        )}
      </div>
      <ol className="space-y-2 text-sm">
        {queue.map((action, index) => (
          <li
            key={`${action.user}-${index}-${action.type}-${action.moveId ?? action.switchIndex ?? ''}`}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-800/60 px-3 py-2 shadow-sm"
          >
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-wide text-slate-300">{action.user}</span>
              <span className="text-sm font-semibold text-slate-100">
                {action.type === 'switch'
                  ? `Switch → #${(action.switchIndex ?? 0) + 1}`
                  : action.moveId ?? 'Move'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              {typeof action.priority === 'number' && (
                <span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-100">
                  <Zap className="h-3 w-3" />
                  {PRIORITY_BADGES[action.priority] ?? action.priority}
                </span>
              )}
              <span className="rounded-full border border-slate-500/40 bg-slate-700/60 px-2 py-0.5 text-[10px] text-slate-200">
                {Math.round(action.speed)} Spe
              </span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}


