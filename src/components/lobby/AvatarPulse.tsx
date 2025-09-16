"use client";
import { motion } from "framer-motion";
import { useReducedMotionPref } from "@/hooks/useReducedMotionPref";

interface AvatarPulseProps {
  children: React.ReactNode;
  isReady: boolean;
  isWaiting: boolean;
}

export default function AvatarPulse({ 
  children, 
  isReady, 
  isWaiting 
}: AvatarPulseProps) {
  const reduce = useReducedMotionPref();

  if (reduce) {
    return <>{children}</>;
  }

  // Only animate if ready or waiting
  if (!isReady && !isWaiting) {
    return <>{children}</>;
  }

  return (
    <motion.div
      animate={{ 
        scale: [1, 1.06, 1],
        opacity: isReady ? [1, 0.8, 1] : [1, 0.9, 1]
      }}
      transition={{ 
        duration: 0.24, 
        repeat: Infinity,
        ease: "easeInOut" 
      }}
      className="relative"
    >
      {/* Status indicator */}
      {isReady && (
        <motion.div
          className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}
      {isWaiting && (
        <motion.div
          className="absolute -top-1 -right-1 h-3 w-3 bg-yellow-500 rounded-full"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}
      {children}
    </motion.div>
  );
}

