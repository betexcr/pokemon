"use client";
import { motion } from "framer-motion";
import { MoveCommonProps } from "./MoveFX.types";
import { toCssPos } from "./MoveFX.utils";

export default function IceShard({ from, to, onDone, power = 1 }: MoveCommonProps) {
  const shards = Math.round(5 * power);

  return (
    <div className="pointer-events-none absolute inset-0 z-[40]">
      {/* traveling ice shard */}
      <motion.div
        className="absolute h-3 w-3 bg-cyan-200/90 shadow-[0_0_8px_rgba(34,211,238,.7)]"
        style={{ ...toCssPos(from), transform: "translate(-50%,-50%) rotate(45deg)" }}
        initial={{ scale: 0.8, opacity: 0.9 }}
        animate={{
          left: `${to.x * 100}%`,
          top: `${to.y * 100}%`,
          opacity: 0.9,
          rotate: 45 + 180,
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      />
      
      {/* shattering shards */}
      {Array.from({ length: shards }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ ...toCssPos(to), transform: "translate(-50%,-50%)" }}
          initial={{ opacity: 0.9, scale: 0.8, rotate: 0 }}
          animate={{ 
            opacity: 0, 
            scale: 0.2,
            x: (Math.random() - 0.5) * 40,
            y: (Math.random() - 0.5) * 40,
            rotate: 360 + Math.random() * 180
          }}
          transition={{ 
            duration: 0.5 + i * 0.05, 
            delay: 0.1 + i * 0.03, 
            ease: "easeOut" 
          }}
          onAnimationComplete={i === shards - 1 ? onDone : undefined}
        >
          <div className="h-4 w-3 bg-gradient-to-b from-cyan-100 to-cyan-300 shadow-[0_0_4px_rgba(34,211,238,.6)]" />
        </motion.div>
      ))}
      
      {/* frost burst */}
      <motion.div
        className="absolute h-12 w-12 rounded-full"
        style={{ ...toCssPos(to), transform: "translate(-50%,-50%)" }}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: [0.6, 0], scale: 1.8 }}
        transition={{ duration: 0.4 }}
      >
        <div className="h-full w-full bg-[radial-gradient(circle,rgba(34,211,238,.3)_0%,transparent_70%)]" />
      </motion.div>
    </div>
  );
}

