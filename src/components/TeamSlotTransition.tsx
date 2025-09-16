"use client";
import { motion } from "framer-motion";
import { useReducedMotionPref } from "@/hooks/useReducedMotionPref";

interface TeamSlotTransitionProps {
  children: React.ReactNode;
  slotIndex: number;
  hasPokemon: boolean;
  action: 'add' | 'remove' | 'idle';
}

export default function TeamSlotTransition({ 
  children, 
  slotIndex, 
  hasPokemon, 
  action 
}: TeamSlotTransitionProps) {
  const reduce = useReducedMotionPref();

  if (reduce) {
    return <>{children}</>;
  }

  const getAnimationProps = () => {
    switch (action) {
      case 'add':
        return {
          initial: { scale: 0.9, y: -4 },
          animate: { scale: 1, y: 0 },
          transition: { duration: 0.14 }
        };
      case 'remove':
        return {
          initial: { scale: 1, opacity: 1 },
          animate: { scale: 0.8, opacity: 0 },
          transition: { duration: 0.28 }
        };
      default:
        return {
          initial: { scale: 1 },
          animate: { scale: 1 }
        };
    }
  };

  return (
    <motion.div
      key={`slot-${slotIndex}`}
      style={{ viewTransitionName: `slot-${slotIndex}` }}
      {...getAnimationProps()}
    >
      {children}
    </motion.div>
  );
}

