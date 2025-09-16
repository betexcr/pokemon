"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useReducedMotionPref } from "@/hooks/useReducedMotionPref";

type Props = {
  /** Change this to retrigger shake (e.g., turn+eventId) */
  playKey: string | number;
  /** ms; 120–160 feels snappy */
  duration?: number;
  intensity?: number; // px, default 12
  children: React.ReactNode;
  onDone?: () => void;
};

export default function HitShake({
  playKey, duration = 140, intensity = 12, children, onDone,
}: Props) {
  const [k, setK] = useState(playKey);
  const reduce = useReducedMotionPref();

  useEffect(() => setK(playKey), [playKey]);

  if (reduce) return <>{children}</>;

  // 6-keyframe micro-shake
  const delta = intensity;
  const seq = [0, -delta, delta, -delta * 0.6, delta * 0.4, 0];

  return (
    <motion.div
      key={k}
      onAnimationComplete={onDone}
      animate={{ x: seq }}
      transition={{ duration: duration / 1000, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

