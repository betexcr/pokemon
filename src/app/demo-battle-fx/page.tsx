"use client";
import { useState } from "react";
import AppHeader from "@/components/AppHeader";
import BattleScene from "@/components/battle/BattleScene";
import AttackAnimator from "@/components/battle/AttackAnimator";
import { FxKind } from "@/components/battle/fx/MoveFX.types";

export default function DemoBattleFXPage() {
  const [fx, setFx] = useState<{ kind: FxKind; key: number } | null>(null);
  const [selectedPower, setSelectedPower] = useState(1);

  // Different battle positions for variety
  const positions = [
    { name: "Close Range", from: { x: 0.3, y: 0.7 }, to: { x: 0.7, y: 0.3 } },
    { name: "Long Range", from: { x: 0.1, y: 0.8 }, to: { x: 0.9, y: 0.2 } },
    { name: "Side Attack", from: { x: 0.2, y: 0.5 }, to: { x: 0.8, y: 0.5 } },
  ];
  const [selectedPosition, setSelectedPosition] = useState(0);

  const availableEffects: FxKind[] = [
    "electric", "water", "fire", "grass", "ice", "psychic", "fairy"
  ];

  const currentPosition = positions[selectedPosition];

  return (
    <div className="min-h-screen bg-bg">
      <AppHeader
        title="Battle FX Demo"
        backLink="/"
        backLabel="Back to PokéDex"
        showToolbar={false}
        showThemeToggle={false}
        iconKey="battle"
        showIcon={true}
      />

      <main className="mx-auto max-w-6xl px-4 py-8 space-y-8">
        {/* Controls */}
        <div className="bg-surface rounded-2xl border border-border p-6">
          <h2 className="text-xl font-semibold mb-4 text-text">Move Effect Controls</h2>
          
          {/* Effect Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3 text-text">Move Types</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {availableEffects.map((effect) => (
                <button
                  key={effect}
                  onClick={() => setFx({ kind: effect, key: Date.now() })}
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
        </div>

        {/* Battle Scene */}
        <div className="bg-surface rounded-2xl border border-border p-6">
          <h2 className="text-xl font-semibold mb-4 text-text">Battle Arena</h2>
          <div className="relative">
            <BattleScene />
            
            {/* Custom FX Overlay */}
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

        {/* Instructions */}
        <div className="bg-surface rounded-2xl border border-border p-6">
          <h2 className="text-xl font-semibold mb-4 text-text">Instructions</h2>
          <div className="space-y-2 text-sm text-muted">
            <p>• Click any move type button to trigger the effect</p>
            <p>• Adjust power level to see intensity differences</p>
            <p>• Try different attack positions for varied trajectories</p>
            <p>• All effects are GPU-accelerated and respect reduced motion preferences</p>
            <p>• Effects are deterministic and can be replayed with the same parameters</p>
          </div>
        </div>
      </main>
    </div>
  );
}

