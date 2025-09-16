"use client";
import { motion } from "framer-motion";
import { useReducedMotionPref } from "@/hooks/useReducedMotionPref";

interface EvolutionChainTransitionProps {
  children: React.ReactNode;
  isExpanded: boolean;
}

export default function EvolutionChainTransition({ 
  children, 
  isExpanded 
}: EvolutionChainTransitionProps) {
  const reduce = useReducedMotionPref();

  if (reduce) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ 
        opacity: isExpanded ? 1 : 0,
        x: isExpanded ? 0 : -20
      }}
      transition={{ 
        duration: 0.18, 
        ease: "easeOut" 
      }}
      className="w-full"
    >
      {/* Link glow effect */}
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ 
          scaleX: isExpanded ? 1 : 0,
          opacity: isExpanded ? 0.3 : 0
        }}
        transition={{ 
          duration: 0.18, 
          delay: 0.05,
          ease: "easeOut" 
        }}
        className="absolute top-1/2 left-0 h-0.5 bg-poke-blue transform -translate-y-1/2 origin-left"
        style={{ width: "100%" }}
      />
      {children}
    </motion.div>
  );
}

