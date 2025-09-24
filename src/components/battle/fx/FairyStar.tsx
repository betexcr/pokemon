"use client";
import { motion } from "framer-motion";
import { MoveCommonProps } from "./MoveFX.types";
import { toCssPos } from "./MoveFX.utils";

export default function FairyStar({ from, to, onDone, power = 1 }: MoveCommonProps) {
  const stars = Math.round(4 * power);

  return (
    <div className="pointer-events-none absolute inset-0 z-[40]">
      {/* traveling fairy sparkle */}
      <motion.div
        className="absolute h-2 w-2 rounded-full bg-pink-300/90 shadow-[0_0_8px_rgba(236,72,153,.8)]"
        style={{ ...toCssPos(from), transform: "translate(-50%,-50%)" }}
        initial={{ scale: 0.8, opacity: 0.9 }}
        animate={{
          left: `${to.x * 100}%`,
          top: `${to.y * 100}%`,
          opacity: 0.9,
          scale: [0.8, 1.2, 0.8],
        }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />
      
      {/* star particles */}
      {Array.from({ length: stars }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ ...toCssPos(to), transform: "translate(-50%,-50%)" }}
          initial={{ opacity: 0.9, scale: 0.3, rotate: 0 }}
          animate={{ 
            opacity: 0, 
            scale: 1.5 + i * 0.2,
            x: (Math.random() - 0.5) * 60,
            y: (Math.random() - 0.5) * 60,
            rotate: 720 + Math.random() * 180
          }}
          transition={{ 
            duration: 0.8 + i * 0.1, 
            delay: 0.1 + i * 0.08, 
            ease: "easeOut" 
          }}
          onAnimationComplete={i === stars - 1 ? onDone : undefined}
        >
          {/* Star shape using clip-path */}
          <div 
            className="h-6 w-6 bg-gradient-to-b from-pink-200 to-pink-400 shadow-[0_0_8px_rgba(236,72,153,.6)]"
            style={{
              clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
            }}
          />
        </motion.div>
      ))}
      
      {/* soft pink glow */}
      <motion.div
        className="absolute h-20 w-20 rounded-full"
        style={{ ...toCssPos(to), transform: "translate(-50%,-50%)" }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: [0.4, 0], scale: 2.5 }}
        transition={{ duration: 0.7 }}
      >
        <div className="h-full w-full bg-[radial-gradient(circle,rgba(236,72,153,.3)_0%,rgba(251,207,232,.2)_50%,transparent_70%)]" />
      </motion.div>
    </div>
  );
}

