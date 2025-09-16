"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useReducedMotionPref } from "@/hooks/useReducedMotionPref";

export type StatusCode = "PAR" | "BRN" | "PSN" | "SLP" | "FRZ" | "CONF" | "ATK⬆" | "DEF⬇";
export type StatusEvent = {
  id?: string | number;
  code: StatusCode;
  text?: string;      // optional custom text; defaults to code
  side?: "ally" | "foe";
  /** ms to stay visible */
  ttl?: number;       // default 1400
};

type Props = {
  anchorAlly?: { x: number; y: number }; // 0..1 relative to arena
  anchorFoe?: { x: number; y: number };
  events: StatusEvent[];  // push new events by changing array identity (e.g., key by turn)
};

const colorFor: Record<StatusCode, string> = {
  PAR: "bg-yellow-300 text-yellow-950",
  BRN: "bg-orange-400 text-orange-950",
  PSN: "bg-violet-400 text-violet-950",
  SLP: "bg-blue-300 text-blue-950",
  FRZ: "bg-sky-300 text-sky-950",
  CONF: "bg-pink-300 text-pink-950",
  "ATK⬆": "bg-emerald-400 text-emerald-950",
  "DEF⬇": "bg-rose-400 text-rose-950",
};

export default function StatusPopups({
  anchorAlly = { x: 0.18, y: 0.62 },
  anchorFoe = { x: 0.82, y: 0.22 },
  events,
}: Props) {
  const reduce = useReducedMotionPref();
  const [queue, setQueue] = useState<Array<Required<StatusEvent>>>([]);
  const idCounter = useRef(0);

  // Normalize incoming events into timed queue entries
  useEffect(() => {
    const stamped = events.map((e) => ({
      id: e.id ?? ++idCounter.current,
      code: e.code,
      text: e.text ?? e.code,
      side: e.side ?? "ally",
      ttl: e.ttl ?? 1400,
    }));
    setQueue((prev) => [...prev, ...stamped]);
  }, [events]);

  // Auto-remove after TTL
  useEffect(() => {
    const timers = queue.map((evt) =>
      setTimeout(
        () => setQueue((q) => q.filter((x) => x.id !== evt.id)),
        evt.ttl
      )
    );
    return () => timers.forEach(clearTimeout);
  }, [queue]);

  const groupAlly = queue.filter((q) => q.side === "ally");
  const groupFoe  = queue.filter((q) => q.side === "foe");

  const anchorStyle = (a: { x: number; y: number }) => ({
    left: `${a.x * 100}%`,
    top: `${a.y * 100}%`,
    transform: "translate(-50%, -50%)",
  });

  const motionProps = reduce
    ? { initial: false, animate: { opacity: 1, y: 0 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, y: 8, scale: 0.96 },
        animate: { opacity: 1, y: -8, scale: 1 },
        exit: { opacity: 0, y: -16, scale: 0.98 },
        transition: { type: "spring" as const, stiffness: 420, damping: 24, mass: 0.4 },
      };

  return (
    <>
      {/* ARIA live region */}
      <div className="sr-only" aria-live="polite">
        {queue.map((e) => `${e.side} ${e.text}`).join(". ")}
      </div>

      {/* Ally popups */}
      <div className="pointer-events-none absolute z-[45]" style={anchorStyle(anchorAlly)}>
        <div className="relative -translate-y-2 space-y-1">
          <AnimatePresence initial={false}>
            {groupAlly.map((e) => (
              <motion.div key={e.id} {...motionProps} className={`rounded-full px-2 py-1 text-xs font-bold shadow ${colorFor[e.code]} bg-opacity-95`}>
                {e.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Foe popups */}
      <div className="pointer-events-none absolute z-[45]" style={anchorStyle(anchorFoe)}>
        <div className="relative -translate-y-2 space-y-1">
          <AnimatePresence initial={false}>
            {groupFoe.map((e) => (
              <motion.div key={e.id} {...motionProps} className={`rounded-full px-2 py-1 text-xs font-bold shadow ${colorFor[e.code]} bg-opacity-95`}>
                {e.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
