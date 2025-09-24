"use client";
import { motion } from "framer-motion";
import { useReducedMotionPref } from "@/hooks/useReducedMotionPref";

interface ChartTransitionProps {
  children: React.ReactNode;
  playKey: string | number;
}

export default function ChartTransition({ 
  children, 
  playKey 
}: ChartTransitionProps) {
  const reduce = useReducedMotionPref();

  if (reduce) {
    return <>{children}</>;
  }

  return (
    <motion.div
      key={playKey}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ 
        duration: 0.12, 
        ease: "easeOut" 
      }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}

