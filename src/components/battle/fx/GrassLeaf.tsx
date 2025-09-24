"use client";
import { motion } from "framer-motion";
import { MoveCommonProps } from "./MoveFX.types";
import { toCssPos } from "./MoveFX.utils";

export default function GrassLeaf({ from, to, onDone, power = 1 }: MoveCommonProps) {
  const leaves = Math.round(6 * power);

  return (
    <div className="pointer-events-none absolute inset-0 z-[40]">
      {/* traveling leaf */}
      <motion.div
        className="absolute h-4 w-6 rounded-full bg-green-400/80 shadow-[0_0_8px_rgba(34,197,94,.6)]"
        style={{ ...toCssPos(from), transform: "translate(-50%,-50%)" }}
        initial={{ scale: 0.8, opacity: 0.9, rotate: 0 }}
        animate={{
          left: `${to.x * 100}%`,
          top: `${to.y * 100}%`,
          opacity: 0.9,
          rotate: 360,
        }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />
      
      {/* impact leaves */}
      {Array.from({ length: leaves }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ ...toCssPos(to), transform: "translate(-50%,-50%)" }}
          initial={{ opacity: 0.8, scale: 0.3, y: 0, rotate: 0 }}
          animate={{ 
            opacity: 0, 
            scale: 1.2 + i * 0.1, 
            y: -20 - i * 5,
            rotate: 180 + i * 30
          }}
          transition={{ 
            duration: 0.8 + i * 0.1, 
            delay: 0.1 + i * 0.05, 
            ease: "easeOut" 
          }}
          onAnimationComplete={i === leaves - 1 ? onDone : undefined}
        >
          <div className="h-6 w-4 rounded-full bg-gradient-to-b from-green-300 to-green-600 shadow-[0_0_6px_rgba(34,197,94,.5)]" />
        </motion.div>
      ))}
      
      {/* green glow aura */}
      <motion.div
        className="absolute h-16 w-16 rounded-full"
        style={{ ...toCssPos(to), transform: "translate(-50%,-50%)" }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: [0.3, 0], scale: 2 }}
        transition={{ duration: 0.6 }}
      >
        <div className="h-full w-full bg-[radial-gradient(circle,rgba(34,197,94,.4)_0%,transparent_70%)]" />
      </motion.div>
    </div>
  );
}

