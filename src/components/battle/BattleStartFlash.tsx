"use client";
import { useEffect, useState } from "react";

export default function BattleStartFlash({ onDone }: { onDone?: () => void }) {
  const [phase, setPhase] = useState<"idle"|"flash"|"fade">("idle");

  useEffect(() => {
    // sequence: quick white flash (120ms) -> fade to scene (260ms)
    const t1 = setTimeout(() => setPhase("flash"), 10);
    const t2 = setTimeout(() => setPhase("fade"), 150);
    const t3 = setTimeout(() => { onDone?.(); }, 150 + 280);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[60]">
      {/* White flash layer */}
      <div
        className={[
          "absolute inset-0 bg-white transition-opacity",
          phase === "idle" ? "opacity-0" : "",
          phase === "flash" ? "opacity-100 duration-100" : "",
          phase === "fade" ? "opacity-0 duration-200" : "",
        ].join(" ")}
      />
      {/* Slight camera push (scale) */}
      <div
        className={[
          "absolute inset-0 bg-transparent transition-transform",
          phase === "fade" ? "scale-[1.02] duration-300" : "",
        ].join(" ")}
      />
    </div>
  );
}

