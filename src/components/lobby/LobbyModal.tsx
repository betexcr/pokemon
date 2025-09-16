"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotionPref } from "@/hooks/useReducedMotionPref";

interface LobbyModalProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
}

export default function LobbyModal({ 
  children, 
  isOpen, 
  onClose 
}: LobbyModalProps) {
  const reduce = useReducedMotionPref();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0.1 : 0.16 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          
          {/* Modal content with Pokéball pop-open effect */}
          <motion.div
            className="relative bg-surface border border-border rounded-2xl p-6 max-w-md w-full shadow-lg"
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
            transition={{ 
              duration: reduce ? 0.1 : 0.16, 
              ease: "easeOut" 
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

