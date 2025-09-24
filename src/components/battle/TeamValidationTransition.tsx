"use client";
import { motion } from "framer-motion";
import { useReducedMotionPref } from "@/hooks/useReducedMotionPref";

interface TeamValidationTransitionProps {
  children: React.ReactNode;
  isValid: boolean | null; // null = not validated yet
  playKey: string | number;
}

export default function TeamValidationTransition({ 
  children, 
  isValid, 
  playKey 
}: TeamValidationTransitionProps) {
  const reduce = useReducedMotionPref();

  if (reduce || isValid === null) {
    return <>{children}</>;
  }

  const getAnimationProps = () => {
    if (isValid) {
      // Valid: green tick pulse
      return {
        initial: { scale: 1, opacity: 1 },
        animate: { 
          scale: [1, 1.06, 1], 
          opacity: [1, 0.8, 1] 
        },
        transition: { 
          duration: 0.18
        },
        className: "ring-2 ring-green-500 ring-opacity-50"
      };
    } else {
      // Invalid: red glow pulse x2
      return {
        initial: { scale: 1, opacity: 1 },
        animate: { 
          scale: [1, 1.04, 1, 1.04, 1], 
          opacity: [1, 0.7, 1, 0.7, 1] 
        },
        transition: { 
          duration: 0.24 // 120ms each pulse
        },
        className: "ring-2 ring-red-500 ring-opacity-50"
      };
    }
  };

  const animationProps = getAnimationProps();

  return (
    <motion.div
      key={playKey}
      {...animationProps}
      className={`${animationProps.className} transition-colors`}
    >
      {children}
    </motion.div>
  );
}

