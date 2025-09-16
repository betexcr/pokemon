"use client";
import { motion } from "framer-motion";
import { MoveCommonProps } from "./MoveFX.types";
import { toCssPos } from "./MoveFX.utils";

export default function PsychicRing({ from, to, onDone, power = 1 }: MoveCommonProps) {
  const rings = Math.round(3 * power);

  return (
    <div className="pointer-events-none absolute inset-0 z-[40]">
      {/* traveling psychic energy */}
      <motion.div
        className="absolute h-3 w-3 rounded-full bg-purple-400/80 shadow-[0_0_10px_rgba(147,51,234,.8)]"
        style={{ ...toCssPos(from), transform: "translate(-50%,-50%)" }}
        initial={{ scale: 0.8, opacity: 0.9 }}
        animate={{
          left: `${to.x * 100}%`,
          top: `${to.y * 100}%`,
          opacity: 0.9,
          scale: 1.2,
        }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      />
      
      {/* concentric rings */}
      {Array.from({ length: rings }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ ...toCssPos(to), transform: "translate(-50%,-50%)" }}
          initial={{ opacity: 0.7, scale: 0.2 }}
          animate={{ 
            opacity: 0, 
            scale: 2 + i * 0.5,
            rotate: 360
          }}
          transition={{ 
            duration: 0.8 + i * 0.2, 
            delay: 0.1 + i * 0.1, 
            ease: "easeOut" 
          }}
          onAnimationComplete={i === rings - 1 ? onDone : undefined}
        >
          <div className={`h-16 w-16 rounded-full border-2 border-purple-400/60 ${i % 2 === 0 ? 'border-dashed' : ''}`} />
        </motion.div>
      ))}
      
      {/* target wobble effect */}
      <motion.div
        className="absolute"
        style={{ ...toCssPos(to), transform: "translate(-50%,-50%)" }}
        initial={{ scale: 1 }}
        animate={{ 
          scale: [1, 1.1, 0.95, 1.05, 1],
          rotate: [0, 2, -2, 1, 0]
        }}
        transition={{ 
          duration: 0.6,
          times: [0, 0.2, 0.4, 0.7, 1]
        }}
      >
        <div className="h-8 w-8 rounded-full bg-purple-500/20 shadow-[0_0_12px_rgba(147,51,234,.6)]" />
      </motion.div>
    </div>
  );
}

