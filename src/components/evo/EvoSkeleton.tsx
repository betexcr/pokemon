"use client";

import { motion } from 'framer-motion';

export default function EvoSkeleton() {
  return (
    <div className="flex flex-col gap-4" role="list" aria-label="Loading evolution families">
      {/* Loading header with animated Pokemon icon */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-center py-8"
      >
        <motion.div
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            rotate: { duration: 2, repeat: Infinity, ease: "linear" },
            scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
          }}
          className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center"
        >
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
            className="text-white text-xl"
          >
            ⚡
          </motion.div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="ml-3"
        >
          <div className="h-6 w-32 bg-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-800 dark:to-purple-800 rounded animate-pulse" />
        </motion.div>
      </motion.div>

      {/* Evolution family skeletons */}
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.section
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.3 }}
          className="rounded-md border bg-white/60 dark:bg-gray-900/40 overflow-hidden"
        >
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                className="h-8 w-8 rounded border bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600"
              />
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ 
                    scale: [1, 1.05, 1],
                    opacity: [0.6, 1, 0.6]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    delay: i * 0.3,
                    ease: "easeInOut"
                  }}
                  className="w-14 h-14 rounded bg-gradient-to-br from-blue-200 to-purple-200 dark:from-blue-800 dark:to-purple-800"
                />
                <motion.div
                  animate={{ opacity: [0.4, 0.8, 0.4] }}
                  transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.1 }}
                  className="h-6 w-24 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded"
                />
              </div>
            </div>
            <motion.div
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
              className="h-4 w-16 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded"
            />
          </div>
          
          {/* Evolution chain skeleton */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            className="px-3 pb-3"
          >
            <div className="flex items-center gap-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <motion.div
                  key={j}
                  animate={{ 
                    opacity: [0.3, 0.7, 0.3],
                    scale: [0.95, 1, 0.95]
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity, 
                    delay: j * 0.2 + i * 0.1,
                    ease: "easeInOut"
                  }}
                  className="flex items-center gap-2"
                >
                  <div className="w-8 h-8 rounded bg-gradient-to-br from-yellow-200 to-orange-200 dark:from-yellow-800 dark:to-orange-800" />
                  {j < 2 && (
                    <motion.div
                      animate={{ 
                        scaleX: [0.5, 1, 0.5],
                        opacity: [0.3, 0.8, 0.3]
                      }}
                      transition={{ 
                        duration: 1.2, 
                        repeat: Infinity, 
                        delay: j * 0.3 + i * 0.1
                      }}
                      className="w-6 h-0.5 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500"
                    />
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.section>
      ))}
      
      {/* Loading indicator at bottom */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="flex items-center justify-center py-4"
      >
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            rotate: { duration: 1.5, repeat: Infinity, ease: "linear" },
            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }}
          className="w-6 h-6 rounded-full border-2 border-blue-400 border-t-transparent"
        />
        <motion.span
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="ml-2 text-sm text-gray-600 dark:text-gray-400"
        >
          Loading evolution data...
        </motion.span>
      </motion.div>
    </div>
  );
}
