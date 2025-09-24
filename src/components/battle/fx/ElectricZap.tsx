"use client";
import { motion } from "framer-motion";
import { MoveCommonProps } from "./MoveFX.types";
import { toCssPos, lerp } from "./MoveFX.utils";

export default function ElectricZap({ from, to, onDone, power = 1 }: MoveCommonProps) {
  const segs = Math.max(4, Math.round(6 * power));
  const bolts = Array.from({ length: 2 }, (_, k) => k);

  return (
    <div className="pointer-events-none absolute inset-0 z-[40]">
      {bolts.map((b) =>
        <motion.div
          key={b}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: 0.32 + b * 0.04, times: [0, .1, .8, 1] }}
          onAnimationComplete={b === bolts.length - 1 ? onDone : undefined}
          className="absolute inset-0"
        >
          {Array.from({ length: segs }).map((_, i) => {
            const t1 = i / segs, t2 = (i + 1) / segs;
            const x1 = lerp(from.x, to.x, t1), y1 = lerp(from.y, to.y, t1);
            const x2 = lerp(from.x, to.x, t2), y2 = lerp(from.y, to.y, t2);
            const midJitter = (Math.random() - 0.5) * 0.06 * power;
            const mx = lerp(x1, x2, 0.5) + midJitter;
            const my = lerp(y1, y2, 0.5) - midJitter;

            return (
              <motion.div
                key={i}
                className="absolute"
                style={{ ...toCssPos({ x: x1, y: y1 }) }}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 1, 0] }}
                transition={{ duration: 0.28, delay: i * 0.01 }}
              >
                {/* segment rendered as 2 thin triangles (bolt feel) */}
                <svg width="120" height="120" viewBox="0 0 120 120"
                     className="translate-x-[-60px] translate-y-[-60px]">
                  <polyline
                    points={`${x1*120},${y1*120} ${mx*120},${my*120} ${x2*120},${y2*120}`}
                    fill="none" stroke="currentColor" strokeWidth={3}
                    className="[color:#ffd700] drop-shadow-[0_0_6px_rgba(255,215,0,.9)]" />
                </svg>
              </motion.div>
            );
          })}
        </motion.div>
      )}
      {/* hit spark */}
      <motion.div
        className="absolute aspect-square w-16 rounded-full bg-white/90 mix-blend-screen"
        style={{ ...toCssPos(to), transform: "translate(-50%, -50%)" }}
        initial={{ scale: 0.3, opacity: 0.6 }}
        animate={{ scale: [0.3, 1.2, 0.8], opacity: [0.6, 0.2, 0] }}
        transition={{ duration: 0.28 }}
      />
    </div>
  );
}

