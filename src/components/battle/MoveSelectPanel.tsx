"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotionPref } from "@/hooks/useReducedMotionPref";

interface MoveSelectPanelProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
}

export default function MoveSelectPanel({ 
  children, 
  isOpen, 
  onClose 
}: MoveSelectPanelProps) {
  const reduce = useReducedMotionPref();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ 
            duration: reduce ? 0.1 : 0.2, 
            ease: "easeOut" 
          }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border p-4 shadow-lg"
        >
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-text">Select Move</h3>
              <button
                onClick={onClose}
                className="text-muted hover:text-text transition-colors"
                aria-label="Close move selection"
              >
                ✕
              </button>
            </div>
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

