'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { formatPokemonName } from '@/lib/utils';
import { battleLogToDisplayLines, type BattleLogDisplayLine } from '@/lib/battle-log-display';

export type BattleTextBoxProps = {
  battleLog?: unknown[];
  myActiveSpecies?: string | null;
  waitingForResolution?: boolean;
  /** When provided, advances like multiplayer (parent-owned index). */
  displayedLogIndex?: number;
  onDisplayedLogIndexChange?: (idx: number) => void;
  /** Show Damage/Heal/Status chips (RTDB style). */
  classifyLines?: boolean;
};

function classifyLine(message: string) {
  const text = message.toLowerCase();
  if (text.includes('fainted') || text.includes('damage') || text.includes('hit')) {
    return { label: 'Damage', tone: 'text-red-700 dark:text-red-300 bg-red-500/10' };
  }
  if (text.includes('heal') || text.includes('restored')) {
    return { label: 'Heal', tone: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10' };
  }
  if (text.includes('status') || text.includes('burn') || text.includes('poison') || text.includes('paraly')) {
    return { label: 'Status', tone: 'text-amber-700 dark:text-amber-300 bg-amber-500/10' };
  }
  if (text.includes('miss')) {
    return { label: 'Miss', tone: 'text-slate-700 dark:text-slate-300 bg-slate-500/10' };
  }
  return { label: 'Event', tone: 'text-blue-700 dark:text-blue-300 bg-blue-500/10' };
}

export function BattleTextBox({
  battleLog,
  myActiveSpecies,
  waitingForResolution = false,
  displayedLogIndex,
  onDisplayedLogIndexChange,
  classifyLines = false,
}: BattleTextBoxProps) {
  const logRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(0);
  const prevAnnouncedLengthRef = useRef(0);

  const lines: BattleLogDisplayLine[] = useMemo(
    () => battleLogToDisplayLines(battleLog as unknown[] | undefined),
    [battleLog]
  );

  useEffect(() => {
    if (onDisplayedLogIndexChange && lines.length > prevLengthRef.current) {
      onDisplayedLogIndexChange(lines.length - 1);
    }
    prevLengthRef.current = lines.length;
  }, [lines.length, onDisplayedLogIndexChange]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [displayedLogIndex, lines.length]);

  useEffect(() => {
    prevAnnouncedLengthRef.current = lines.length;
  }, [lines.length]);

  const absoluteStart = Math.max(0, lines.length - 3);
  const visibleLines = lines.length > 0 ? lines.slice(absoluteStart) : [];
  const newestIndex = lines.length - 1;
  const isNewFaint =
    lines.length > prevAnnouncedLengthRef.current &&
    newestIndex >= 0 &&
    /fainted/i.test(lines[newestIndex]?.message ?? '');

  const idleText = waitingForResolution
    ? null
    : myActiveSpecies
      ? `What will ${formatPokemonName(myActiveSpecies)} do?`
      : null;

  if (visibleLines.length === 0 && !idleText) return null;

  return (
    <div className="relative z-20 mx-auto mt-4 w-full max-w-xl">
      <div className="relative rounded-xl border-[3px] border-text/20 bg-surface shadow-lg">
        <div className="absolute inset-[3px] rounded-lg border border-text/10 pointer-events-none" />
        <div
          ref={logRef}
          role="log"
          aria-live={isNewFaint ? 'assertive' : 'polite'}
          aria-relevant="additions"
          aria-label="Battle log"
          className="relative px-5 py-3 min-h-[3.5rem] max-h-28 overflow-y-auto"
        >
          {visibleLines.length > 0 ? (
            <div className="space-y-1">
              {visibleLines.map((line, i) => {
                const absoluteIndex = absoluteStart + i;
                return (
                  <p
                    key={`log-${absoluteIndex}`}
                    className={`text-sm leading-relaxed ${
                      line.isEngineWarning
                        ? 'rounded border-l-4 border-amber-500/80 bg-amber-500/10 pl-2 py-0.5 font-mono text-amber-900 dark:text-amber-100'
                        : `text-text ${
                            i === visibleLines.length - 1
                              ? 'font-medium animate-[typewriter_0.3s_ease-out]'
                              : 'text-text/60'
                          }`
                    }`}
                  >
                    {line.isEngineWarning ? (
                      <>
                        <span className="mr-1.5 align-middle text-[10px] font-sans font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                          Engine
                        </span>
                        {line.message}
                      </>
                    ) : classifyLines ? (
                      <span className="inline-flex items-center gap-2">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                            classifyLine(line.message).tone
                          }`}
                        >
                          {classifyLine(line.message).label}
                        </span>
                        <span>{line.message}</span>
                      </span>
                    ) : (
                      line.message
                    )}
                  </p>
                );
              })}
            </div>
          ) : idleText ? (
            <p className="text-sm leading-relaxed text-text font-medium">{idleText}</p>
          ) : null}
        </div>
        {visibleLines.length > 0 && (
          <div className="absolute bottom-2 right-3" aria-hidden="true">
            <span className="inline-block h-2 w-2 animate-bounce text-text/40">▼</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default BattleTextBox;
