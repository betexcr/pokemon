"use client";
import { motion } from "framer-motion";
import { useReducedMotionPref } from "@/hooks/useReducedMotionPref";

interface LobbyTransitionProps {
  children: React.ReactNode;
  playKey: string | number;
}

export default function LobbyTransition({ children, playKey }: LobbyTransitionProps) {
  const reduce = useReducedMotionPref();

  if (reduce) {
    return <>{children}</>;
  }

  return (
    <motion.div
      key={playKey}
      initial={{ 
        clipPath: "polygon(0 0, 0 0, 0 100%, 0 100%)",
        opacity: 0
      }}
      animate={{ 
        clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
        opacity: 1
      }}
      transition={{ 
        duration: 0.26, 
        ease: "easeOut" 
      }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
}

