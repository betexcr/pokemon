"use client";
import { motion } from "framer-motion";
import { MoveCommonProps } from "./MoveFX.types";
import { toCssPos } from "./MoveFX.utils";

export default function FireFlicker({ from, to, onDone, power = 1 }: MoveCommonProps) {
  const flames = Math.round(8 * power);

  return (
    <div className="pointer-events-none absolute inset-0 z-[40]">
      {/* projectile ember */}
      <motion.div
        className="absolute h-2 w-2 rounded-full"
        style={{ ...toCssPos(from), transform: "translate(-50%,-50%)" }}
        initial={{ backgroundColor: "rgb(255,180,80)", opacity: 0.95, scale: 1 }}
        animate={{ left: `${to.x * 100}%`, top: `${to.y * 100}%` }}
        transition={{ duration: 0.28, ease: "easeOut" }}
      />
      {/* impact burst */}
      <motion.div
        className="absolute"
        style={{ ...toCssPos(to), transform: "translate(-50%,-50%)" }}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: [0.9, 0.6, 0], scale: [0.6, 1.3, 1.6] }}
        transition={{ duration: 0.35 }}
      >
        <div className="h-12 w-12 rounded-full bg-[radial-gradient(circle,rgba(255,210,100,1)_0%,rgba(255,120,40,.9)_45%,rgba(200,40,10,.7)_70%,transparent_80%)] shadow-[0_0_24px_rgba(255,120,40,.8)]" />
      </motion.div>

      {/* flickering tongues */}
      {Array.from({ length: flames }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute origin-bottom"
          style={{
            ...toCssPos(to),
            transform: `translate(-50%,-50%) rotate(${(i / flames) * 360}deg)`,
          }}
          initial={{ opacity: 0.9, scaleY: 0.4 }}
          animate={{ opacity: 0, scaleY: 1.2, y: -18 - Math.random() * 12 }}
          transition={{ duration: 0.45 + Math.random() * 0.2, delay: 0.05 + i * 0.015, ease: "easeOut" }}
          onAnimationComplete={i === flames - 1 ? onDone : undefined}
        >
          <div className="h-8 w-2 rounded-full bg-gradient-to-t from-[rgba(240,80,20,.9)] via-[rgba(255,160,40,.9)] to-[rgba(255,240,150,.9)] blur-[1px]" />
        </motion.div>
      ))}
    </div>
  );
}

