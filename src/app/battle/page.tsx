"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Swords } from "lucide-react";
import { GYM_CHAMPIONS, Champion } from "@/lib/gym_champions";

// Saved teams storage key reused from team builder
const STORAGE_KEY = "pokemon-team-builder";

type SavedTeam = { id: string; name: string; slots: Array<{ id: number | null; level: number }>; };

type Difficulty = "easy" | "normal" | "hard";

export default function BattlePage() {
  const router = useRouter();
  const [savedTeams, setSavedTeams] = useState<SavedTeam[]>([]);
  const [playerTeamId, setPlayerTeamId] = useState<string>("");
  const [opponentType, setOpponentType] = useState<"champion" | "team">("champion");
  const [opponentChampionId, setOpponentChampionId] = useState<string>(GYM_CHAMPIONS[0]?.id ?? "");
  const [opponentTeamId, setOpponentTeamId] = useState<string>("");
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSavedTeams(JSON.parse(raw));
    } catch {}
  }, []);

  const playerTeamsOptions = useMemo(() => savedTeams.map(t => ({ id: t.id, name: t.name })), [savedTeams]);

  const startBattle = () => {
    if (!playerTeamId) return alert("Select your team");

    const player = savedTeams.find(t => t.id === playerTeamId);
    let opponent: { name: string; slots: Array<{ id: number; level: number }> } | undefined;

    if (opponentType === "champion") {
      const champ = GYM_CHAMPIONS.find(c => c.id === opponentChampionId);
      if (!champ) return alert("Select a champion");
      opponent = champ.team;
    } else {
      const team = savedTeams.find(t => t.id === opponentTeamId);
      if (!team) return alert("Select opponent team");
      opponent = {
        name: team.name,
        slots: team.slots.filter(s => s.id != null).map(s => ({ id: s.id as number, level: s.level }))
      };
    }

    if (!player || !opponent) return;

    // Navigate to a future battle runtime route with encoded settings
    const params = new URLSearchParams({
      player: player.id,
      opponentKind: opponentType,
      opponentId: opponentType === "champion" ? opponentChampionId : (opponentTeamId || ""),
      difficulty,
    });
    router.push(`/battle/runtime?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="sticky top-0 z-50 border-b border-border bg-surface">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => router.push("/")}
              className="flex items-center space-x-2 text-muted hover:text-text transition-colors"
              title="Back to PokéDex"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Back to PokéDex</span>
            </button>
            <div className="flex items-center gap-2">
              <Swords className="h-5 w-5 text-poke-blue" />
              <h1 className="text-lg font-semibold">AI Battle</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Player team selection */}
        <section className="border border-border rounded-xl bg-surface p-4">
          <h2 className="text-lg font-semibold mb-3">Your Team</h2>
          {playerTeamsOptions.length === 0 ? (
            <div className="text-sm text-muted">No saved teams. Create one in Team Builder.</div>
          ) : (
            <select
              className="w-full px-3 py-2 border border-border rounded-lg bg-white"
              value={playerTeamId}
              onChange={(e)=> setPlayerTeamId(e.target.value)}
            >
              <option value="">Select a team…</option>
              {playerTeamsOptions.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}
        </section>

        {/* Opponent selection */}
        <section className="border border-border rounded-xl bg-surface p-4">
          <h2 className="text-lg font-semibold mb-3">Opponent</h2>
          <div className="flex items-center gap-3 mb-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" checked={opponentType === "champion"} onChange={()=> setOpponentType("champion")} />
              Gym Champion
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" checked={opponentType === "team"} onChange={()=> setOpponentType("team")} />
              Saved Team
            </label>
          </div>

          {opponentType === "champion" ? (
            <select
              className="w-full px-3 py-2 border border-border rounded-lg bg-white"
              value={opponentChampionId}
              onChange={(e)=> setOpponentChampionId(e.target.value)}
            >
              {GYM_CHAMPIONS.map((c: Champion) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          ) : (
            <select
              className="w-full px-3 py-2 border border-border rounded-lg bg-white"
              value={opponentTeamId}
              onChange={(e)=> setOpponentTeamId(e.target.value)}
            >
              <option value="">Select an opponent team…</option>
              {savedTeams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}
        </section>

        {/* Difficulty */}
        <section className="border border-border rounded-xl bg-surface p-4">
          <h2 className="text-lg font-semibold mb-3">Difficulty</h2>
          <div className="grid grid-cols-3 gap-2">
            {(["easy","normal","hard"] as Difficulty[]).map(d => (
              <button
                key={d}
                onClick={()=> setDifficulty(d)}
                className={`px-3 py-2 rounded-lg border ${difficulty===d ? 'bg-poke-blue text-white border-poke-blue' : 'bg-white text-text border-border'}`}
              >
                {d[0].toUpperCase()+d.slice(1)}
              </button>
            ))}
          </div>
        </section>

        <div className="flex justify-end">
          <button
            onClick={startBattle}
            className="px-4 py-2 rounded-lg bg-poke-blue text-white hover:bg-poke-blue/90"
          >
            Start Battle
          </button>
        </div>
      </main>
    </div>
  );
}
