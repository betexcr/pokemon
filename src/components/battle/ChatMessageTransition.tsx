"use client";
import { motion } from "framer-motion";
import { useReducedMotionPref } from "@/hooks/useReducedMotionPref";

interface ChatMessageTransitionProps {
  children: React.ReactNode;
  playKey: string | number;
}

export default function ChatMessageTransition({ 
  children, 
  playKey 
}: ChatMessageTransitionProps) {
  const reduce = useReducedMotionPref();

  if (reduce) {
    return <>{children}</>;
  }

  return (
    <motion.div
      key={playKey}
      initial={{ scale: 0.96, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
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

