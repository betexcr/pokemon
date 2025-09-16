"use client";

import { useMemo, useState } from "react";
import AttackAnimator from "./AttackAnimator";
import HitShake from "./HitShake";
import HPBar from "./HPBar";
import StatusPopups, { StatusEvent } from "./StatusPopups";
import { FxKind } from "./fx/MoveFX.types";

export default function BattleScene() {
  // positions (0..1 relative)
  const allyPos = useMemo(() => ({ x: 0.22, y: 0.72 }), []);
  const foePos  = useMemo(() => ({ x: 0.78, y: 0.28 }), []);

  // fx trigger
  const [fx, setFx] = useState<{ kind: FxKind; key: number } | null>(null);

  // HP state (demo values)
  const [allyHP, setAllyHP] = useState({ cur: 164, max: 200 });
  const [foeHP,  setFoeHP]  = useState({ cur: 180, max: 220 });

  // hit shake keys
  const [allyShakeKey, setAllyShakeKey] = useState(0);
  const [foeShakeKey, setFoeShakeKey]   = useState(0);

  // status events queue
  const [statusEvents, setStatusEvents] = useState<StatusEvent[]>([]);

  const fire = (kind: FxKind) => {
    setFx({ kind, key: Date.now() });
    // simulate foe taking damage + status
    const damage = kind === "fire" ? 46 : kind === "electric" ? 54 : kind === "water" ? 38 : 30;
    setFoeHP((s) => ({ ...s, cur: Math.max(0, s.cur - damage) }));
    setFoeShakeKey(Date.now());
    
    // Add status effects based on move type
    const statusEffects: StatusEvent[] = [];
    if (kind === "electric") statusEffects.push({ code: "PAR", side: "foe" });
    if (kind === "fire") statusEffects.push({ code: "BRN", side: "foe" });
    if (kind === "water") statusEffects.push({ code: "ATK⬆", side: "ally" }); // Water might boost ally
    
    setStatusEvents((q) => [...q, ...statusEffects]);
  };

  const availableEffects: FxKind[] = [
    "electric", "water", "fire", "grass", "ice", "psychic", "fairy"
  ];

  return (
    <section className="relative mx-auto h-[540px] max-w-5xl overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-emerald-50 to-sky-100 dark:from-zinc-900 dark:to-zinc-950">
      {/* arena ovals */}
      <div className="absolute left-[12%] top-[68%] h-28 w-44 rounded-full bg-black/10 blur-md" />
      <div className="absolute left-[64%] top-[22%] h-24 w-40 rounded-full bg-black/10 blur-md" />

      {/* status popups */}
      <StatusPopups
        anchorAlly={{ x: 0.20, y: 0.58 }}
        anchorFoe={{ x: 0.80, y: 0.18 }}
        events={statusEvents}
      />

      {/* FX layer */}
      {fx && (
        <AttackAnimator
          kind={fx.kind}
          from={allyPos}
          to={foePos}
          playKey={fx.key}
          power={1}
          onDone={() => {}}
        />
      )}

      {/* Ally side */}
      <div className="absolute left-[8%] top-[50%]">
        <HitShake playKey={allyShakeKey}>
          <div className="h-40 w-40 rounded-xl border border-border bg-white/70 p-2 text-center leading-[160px] dark:bg-zinc-900/60">
            Ally Sprite
          </div>
        </HitShake>
        <div className="mt-2 w-44">
          <HPBar max={allyHP.max} value={allyHP.cur} />
        </div>
      </div>

      {/* Foe side */}
      <div className="absolute right-[8%] top-[10%]">
        <HitShake playKey={foeShakeKey}>
          <div className="h-36 w-36 rounded-xl border border-border bg-white/70 p-2 text-center leading-[144px] dark:bg-zinc-900/60">
            Foe Sprite
          </div>
        </HitShake>
        <div className="mt-2 w-40">
          <HPBar max={foeHP.max} value={foeHP.cur} />
        </div>
      </div>

      {/* demo controls */}
      <div className="absolute bottom-3 left-1/2 z-[10] -translate-x-1/2 rounded-xl border border-border bg-white/80 p-2 backdrop-blur dark:bg-zinc-900/70">
        <div className="flex flex-wrap items-center gap-2">
          {availableEffects.slice(0, 3).map((effect) => (
                  <button
              key={effect}
              onClick={() => fire(effect)}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 hover:translate-y-[-1px] hover:shadow transition-colors capitalize"
            >
              Use {effect}
                  </button>
                ))}
                  <button
            onClick={() => {
              // simulate ally getting hit + poison
              setAllyHP((s) => ({ ...s, cur: Math.max(0, s.cur - 34) }));
              setAllyShakeKey(Date.now());
              setStatusEvents((q) => [...q, { code: "PSN", side: "ally" }]);
            }}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 hover:translate-y-[-1px] hover:shadow transition-colors"
          >
            Take hit (ally)
              </button>
            </div>
          </div>
    </section>
  );
}