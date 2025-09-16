"use client";
import { motion } from "framer-motion";
import { useReducedMotionPref } from "@/hooks/useReducedMotionPref";

interface BattleEndTransitionProps {
  result: 'victory' | 'defeat';
  onComplete?: () => void;
}

export default function BattleEndTransition({ 
  result, 
  onComplete 
}: BattleEndTransitionProps) {
  const reduce = useReducedMotionPref();

  if (reduce) {
    onComplete?.();
    return null;
  }

  const isVictory = result === 'victory';

  return (
    <motion.div
      className="fixed inset-0 z-[70] pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.38 }}
      onAnimationComplete={onComplete}
    >
      {/* Victory: subtle tilt forward + fade to white */}
      {isVictory && (
        <motion.div
          className="absolute inset-0 bg-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ duration: 0.38, ease: "easeOut" }}
        />
      )}
      
      {/* Defeat: fade to dark */}
      {!isVictory && (
        <motion.div
          className="absolute inset-0 bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.9 }}
          transition={{ duration: 0.38, ease: "easeOut" }}
        />
      )}
      
      {/* Battle arena tilt effect */}
      <motion.div
        className="absolute inset-0"
        style={{
          transform: isVictory ? "perspective(1000px) rotateX(2deg)" : "perspective(1000px) rotateX(-1deg)"
        }}
        initial={{ transform: "perspective(1000px) rotateX(0deg)" }}
        animate={{
          transform: isVictory 
            ? "perspective(1000px) rotateX(2deg)" 
            : "perspective(1000px) rotateX(-1deg)"
        }}
        transition={{ duration: 0.38, ease: "easeOut" }}
      />
    </motion.div>
  );
}

