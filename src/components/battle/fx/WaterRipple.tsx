"use client";
import { motion } from "framer-motion";
import { MoveCommonProps } from "./MoveFX.types";
import { toCssPos } from "./MoveFX.utils";

export default function WaterRipple({ from, to, onDone, power = 1 }: MoveCommonProps) {
  const drops = Math.round(3 * power) + 2;

  return (
    <div className="pointer-events-none absolute inset-0 z-[40]">
      {/* traveling droplet */}
      <motion.div
        className="absolute h-3 w-3 rounded-full bg-white/70 shadow-[0_0_12px_rgba(80,180,255,.8)]"
        style={{ ...toCssPos(from), transform: "translate(-50%,-50%)" }}
        initial={{ scale: 0.8, opacity: 0.9 }}
        animate={{
          left: `${to.x * 100}%`,
          top: `${to.y * 100}%`,
          opacity: 0.9,
        }}
        transition={{ duration: 0.32, ease: "easeOut" }}
      />
      {/* ripples at impact */}
      {Array.from({ length: drops }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ ...toCssPos(to), transform: "translate(-50%,-50%)" }}
          initial={{ opacity: 0.55, scale: 0.2 }}
          animate={{ opacity: 0, scale: 1.6 + i * 0.25 }}
          transition={{ duration: 0.6 + i * 0.05, delay: 0.1 + i * 0.04, ease: "easeOut" }}
          onAnimationComplete={i === drops - 1 ? onDone : undefined}
        >
          <div className="h-16 w-16 rounded-full border-2 border-white/70 ring-2 ring-[rgba(80,180,255,.45)]" />
        </motion.div>
      ))}
      {/* gentle splash mist */}
      <motion.div
        className="absolute h-12 w-24 rounded-full"
        style={{ ...toCssPos(to), transform: "translate(-50%,-60%)" }}
        initial={{ opacity: 0.0, filter: "blur(10px)" }}
        animate={{ opacity: [0.2, 0], filter: "blur(14px)" }}
        transition={{ duration: 0.35 }}
      >
        <div className="h-full w-full bg-[radial-gradient(ellipse_at_center,rgba(180,220,255,.7)_0%,transparent_70%)]" />
      </motion.div>
    </div>
  );
}

