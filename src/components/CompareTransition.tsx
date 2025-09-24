"use client";
import { motion } from "framer-motion";
import { useReducedMotionPref } from "@/hooks/useReducedMotionPref";

interface CompareTransitionProps {
  children: React.ReactNode;
  pokemonId: number;
  action: 'add' | 'remove' | 'idle';
}

export default function CompareTransition({ 
  children, 
  pokemonId, 
  action 
}: CompareTransitionProps) {
  const reduce = useReducedMotionPref();

  if (reduce) {
    return <>{children}</>;
  }

  const getAnimationProps = () => {
    switch (action) {
      case 'add':
        return {
          initial: { x: -20, opacity: 0, scale: 0.9 },
          animate: { x: 0, opacity: 1, scale: 1 },
          transition: { 
            duration: 0.24, 
            delay: 0.12 // Delay for chart animation
          }
        };
      case 'remove':
        return {
          initial: { x: 0, opacity: 1, scale: 1 },
          animate: { x: 20, opacity: 0, scale: 0.9 },
          transition: { duration: 0.2 }
        };
      default:
        return {
          initial: { x: 0, opacity: 1, scale: 1 },
          animate: { x: 0, opacity: 1, scale: 1 }
        };
    }
  };

  return (
    <motion.div
      key={`compare-${pokemonId}`}
      style={{ viewTransitionName: `compare-${pokemonId}` }}
      {...getAnimationProps()}
    >
      {children}
    </motion.div>
  );
}

