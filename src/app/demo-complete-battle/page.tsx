"use client";
import { useState } from "react";
import AppHeader from "@/components/AppHeader";
import BattleScene from "@/components/battle/BattleScene";
import AttackAnimator from "@/components/battle/AttackAnimator";
import HitShake from "@/components/battle/HitShake";
import HPBar from "@/components/battle/HPBar";
import StatusPopups, { StatusEvent } from "@/components/battle/StatusPopups";
import { FxKind } from "@/components/battle/fx/MoveFX.types";

export default function DemoCompleteBattlePage() {
  const [fx, setFx] = useState<{ kind: FxKind; key: number } | null>(null);
  const [selectedPower, setSelectedPower] = useState(1);
  const [selectedPosition, setSelectedPosition] = useState(0);

  // Battle state
  const [allyHP, setAllyHP] = useState({ cur: 200, max: 200 });
  const [foeHP, setFoeHP] = useState({ cur: 250, max: 250 });
  const [allyShakeKey, setAllyShakeKey] = useState(0);
  const [foeShakeKey, setFoeShakeKey] = useState(0);
  const [statusEvents, setStatusEvents] = useState<StatusEvent[]>([]);

  // Different battle positions for variety
  const positions = [
    { name: "Close Range", from: { x: 0.3, y: 0.7 }, to: { x: 0.7, y: 0.3 } },
    { name: "Long Range", from: { x: 0.1, y: 0.8 }, to: { x: 0.9, y: 0.2 } },
    { name: "Side Attack", from: { x: 0.2, y: 0.5 }, to: { x: 0.8, y: 0.5 } },
  ];

  const availableEffects: FxKind[] = [
    "electric", "water", "fire", "grass", "ice", "psychic", "fairy"
  ];

  const currentPosition = positions[selectedPosition];

  const triggerAttack = (kind: FxKind) => {
    setFx({ kind, key: Date.now() });
    
    // Calculate damage based on move type and power
    const baseDamage = kind === "fire" ? 46 : kind === "electric" ? 54 : kind === "water" ? 38 : 30;
    const damage = Math.round(baseDamage * selectedPower);
    
    // Apply damage and shake
    setFoeHP((s) => ({ ...s, cur: Math.max(0, s.cur - damage) }));
    setFoeShakeKey(Date.now());
    
    // Add status effects based on move type
    const statusEffects: StatusEvent[] = [];
    if (kind === "electric") statusEffects.push({ code: "PAR", side: "foe" });
    if (kind === "fire") statusEffects.push({ code: "BRN", side: "foe" });
    if (kind === "ice") statusEffects.push({ code: "FRZ", side: "foe" });
    if (kind === "psychic") statusEffects.push({ code: "CONF", side: "foe" });
    if (kind === "water") statusEffects.push({ code: "ATK⬆", side: "ally" });
    if (kind === "grass") statusEffects.push({ code: "PSN", side: "foe" });
    if (kind === "fairy") statusEffects.push({ code: "DEF⬇", side: "foe" });
    
    setStatusEvents((q) => [...q, ...statusEffects]);
  };

  const triggerAllyHit = () => {
    setAllyHP((s) => ({ ...s, cur: Math.max(0, s.cur - 35) }));
    setAllyShakeKey(Date.now());
    setStatusEvents((q) => [...q, { code: "PSN", side: "ally" }]);
  };

  const resetBattle = () => {
    setAllyHP({ cur: 200, max: 200 });
    setFoeHP({ cur: 250, max: 250 });
    setStatusEvents([]);
    setFx(null);
  };

  return (
    <div className="min-h-screen bg-bg">
      <AppHeader
        title="Complete Battle Demo"
        backLink="/"
        backLabel="Back to PokéDex"
        showToolbar={false}
        showThemeToggle={false}
        iconKey="battle"
        showIcon={true}
      />

      <main className="mx-auto max-w-6xl px-4 py-8 space-y-8">
        {/* Battle Scene */}
        <div className="bg-surface rounded-2xl border border-border p-6">
          <h2 className="text-xl font-semibold mb-4 text-text">Interactive Battle Arena</h2>
          <div className="relative">
            <BattleScene />
            
            {/* Custom FX Overlay for demo controls */}
            {fx && (
              <AttackAnimator
                kind={fx.kind}
                from={currentPosition.from}
                to={currentPosition.to}
                playKey={fx.key}
                power={selectedPower}
                onDone={() => {}}
              />
            )}
          </div>
        </div>

        {/* Advanced Controls */}
        <div className="bg-surface rounded-2xl border border-border p-6">
          <h2 className="text-xl font-semibold mb-4 text-text">Advanced Battle Controls</h2>
          
          {/* Move Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3 text-text">Move Effects</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {availableEffects.map((effect) => (
                <button
                  key={effect}
                  onClick={() => triggerAttack(effect)}
                  className="rounded-lg border border-border bg-surface px-3 py-2 hover:translate-y-[-1px] hover:shadow transition-colors capitalize text-sm"
                >
                  {effect}
                </button>
              ))}
            </div>
          </div>

          {/* Power Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3 text-text">Power Level</h3>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={selectedPower}
                onChange={(e) => setSelectedPower(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm text-muted font-mono">{selectedPower}x</span>
            </div>
          </div>

          {/* Position Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3 text-text">Attack Positions</h3>
            <div className="flex gap-2">
              {positions.map((pos, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedPosition(index)}
                  className={`rounded-lg border px-3 py-2 transition-colors text-sm ${
                    selectedPosition === index
                      ? "bg-poke-blue text-white border-poke-blue"
                      : "bg-surface text-text border-border hover:bg-gray-50"
                  }`}
                >
                  {pos.name}
                </button>
              ))}
            </div>
          </div>

          {/* Battle Actions */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3 text-text">Battle Actions</h3>
            <div className="flex gap-2">
              <button
                onClick={triggerAllyHit}
                className="rounded-lg border border-border bg-surface px-4 py-2 hover:translate-y-[-1px] hover:shadow transition-colors text-sm"
              >
                Ally Takes Hit
              </button>
              <button
                onClick={resetBattle}
                className="rounded-lg border border-border bg-red-100 text-red-700 px-4 py-2 hover:translate-y-[-1px] hover:shadow transition-colors text-sm"
              >
                Reset Battle
              </button>
            </div>
          </div>
        </div>

        {/* HP Bar Demo */}
        <div className="bg-surface rounded-2xl border border-border p-6">
          <h2 className="text-xl font-semibold mb-4 text-text">HP Bar Animations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-3 text-text">Ally HP</h3>
              <HPBar max={allyHP.max} value={allyHP.cur} />
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => setAllyHP(s => ({ ...s, cur: Math.max(0, s.cur - 25) }))}
                  className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded"
                >
                  -25 HP
                </button>
                <button
                  onClick={() => setAllyHP(s => ({ ...s, cur: Math.min(s.max, s.cur + 20) }))}
                  className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded"
                >
                  +20 HP
                </button>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-3 text-text">Foe HP</h3>
              <HPBar max={foeHP.max} value={foeHP.cur} />
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => setFoeHP(s => ({ ...s, cur: Math.max(0, s.cur - 30) }))}
                  className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded"
                >
                  -30 HP
                </button>
                <button
                  onClick={() => setFoeHP(s => ({ ...s, cur: Math.min(s.max, s.cur + 25) }))}
                  className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded"
                >
                  +25 HP
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Status Effects Demo */}
        <div className="bg-surface rounded-2xl border border-border p-6">
          <h2 className="text-xl font-semibold mb-4 text-text">Status Effects</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {["PAR", "BRN", "PSN", "SLP", "FRZ", "CONF", "ATK⬆", "DEF⬇"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusEvents(q => [...q, { 
                  code: status as any, 
                  side: Math.random() > 0.5 ? "ally" : "foe" 
                }])}
                className="rounded-lg border border-border bg-surface px-3 py-2 hover:translate-y-[-1px] hover:shadow transition-colors text-sm"
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-surface rounded-2xl border border-border p-6">
          <h2 className="text-xl font-semibold mb-4 text-text">Complete Battle System Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2 text-text">Visual Effects</h3>
              <ul className="space-y-1 text-sm text-muted">
                <li>• GPU-accelerated move animations</li>
                <li>• Screen shake on hit impact</li>
                <li>• Smooth HP bar tick-down</li>
                <li>• Color-aware HP zones (green/yellow/red)</li>
                <li>• Status effect popups with queuing</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2 text-text">Technical Features</h3>
              <ul className="space-y-1 text-sm text-muted">
                <li>• Reduced motion accessibility support</li>
                <li>• Deterministic animations for replays</li>
                <li>• Power scaling (0.5x to 2x)</li>
                <li>• Flexible positioning system</li>
                <li>• TypeScript type safety</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

