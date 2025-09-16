"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotionPref } from "@/hooks/useReducedMotionPref";

type Props = {
  max: number;
  value: number;     // current HP the engine says we should display
  /** animate from previous value to `value` */
  animate?: boolean; // default true
  /** total duration of tickdown; long values are split into chunks */
  durationMs?: number; // default 600
  /** optional callback on each tick (for SFX sync) */
  onTick?: (hp: number) => void;
  /** show numeric text */
  showText?: boolean;
};

export default function HPBar({
  max, value, animate = true, durationMs = 600, onTick, showText = true,
}: Props) {
  const reduce = useReducedMotionPref();
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    const prev = prevRef.current;
    if (!animate || reduce || value === prev) {
      prevRef.current = value;
      setDisplay(value);
      return;
    }

    const start = performance.now();
    const diff = value - prev; // usually negative when losing HP
    const abs = Math.abs(diff);

    // Chunking rule: ~50–80ms per 1/20th of bar, capped for very big HP
    const base = Math.min(durationMs, Math.max(280, Math.min(800, abs * 16)));
    const dur = base;
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    let raf = 0;
    const loop = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = easeOutCubic(t);
      const next = Math.round(prev + diff * eased);
      setDisplay(next);
      onTick?.(next);
      if (t < 1) raf = requestAnimationFrame(loop);
      else {
        setDisplay(value);
        prevRef.current = value;
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, animate, durationMs, reduce]);

  const pct = Math.max(0, Math.min(1, display / max));
  // Color zones (like the games): >50% green, 20–50% yellow, <20% red
  const zone =
    pct > 0.5 ? "from-emerald-500 to-emerald-400"
    : pct > 0.2 ? "from-yellow-500 to-amber-400"
    : "from-rose-600 to-red-500";

  return (
    <div className="w-full select-none">
      <div className="relative h-3 w-full overflow-hidden rounded-full border border-black/10 bg-black/10 dark:bg-white/10">
        <div
          className={`h-full bg-gradient-to-r ${zone} transition-[width]`}
          style={{ width: `${pct * 100}%`, transitionDuration: "120ms" }}
        />
      </div>
      {showText && (
        <div className="mt-1 text-[10px] font-medium tabular-nums text-zinc-600 dark:text-zinc-300">
          {display} / {max}
        </div>
      )}
    </div>
  );
}

