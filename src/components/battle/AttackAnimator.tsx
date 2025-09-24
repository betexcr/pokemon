"use client";
import { useEffect, useState } from "react";
import MoveFX from "./fx/MoveFX";
import { FxKind, Point } from "./fx/MoveFX.types";

interface AttackAnimatorProps {
  kind: FxKind;
  from: Point;
  to: Point;
  playKey: string | number;
  onDone?: () => void;
  power?: number;
}

export default function AttackAnimator({
  kind, 
  from, 
  to, 
  playKey, 
  onDone, 
  power = 1
}: AttackAnimatorProps) {
  const [activeKey, setActiveKey] = useState(playKey);
  
  useEffect(() => setActiveKey(playKey), [playKey]); // retrigger on new key

  // Check for reduced motion preference
  const reduceMotion = typeof window !== "undefined" && 
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  // Bypass animation and call onDone immediately for reduced motion
  useEffect(() => {
    if (reduceMotion) {
      const timer = setTimeout(() => onDone?.(), 100);
      return () => clearTimeout(timer);
    }
  }, [reduceMotion, onDone]);

  if (reduceMotion) {
    return null;
  }

  return (
    <div key={activeKey} className="pointer-events-none absolute inset-0">
      <MoveFX kind={kind} from={from} to={to} power={power} onDone={onDone} />
    </div>
  );
}

