"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Swords } from "lucide-react";
import { GYM_CHAMPIONS } from "@/lib/gym_champions";
import UserProfile from "@/components/auth/UserProfile";
import TrainerRoster from "@/components/battle/TrainerRoster";
import TeamSelector from "@/components/TeamSelector";

// Saved teams storage key reused from team builder
const STORAGE_KEY = "pokemon-team-builder";

type SavedTeam = { id: string; name: string; slots: Array<{ id: number | null; level: number }>; };

function BattlePage() {
  const router = useRouter();
  const [savedTeams, setSavedTeams] = useState<SavedTeam[]>([]);
  const [selectedPlayerTeam, setSelectedPlayerTeam] = useState<SavedTeam | null>(null);
  const [selectedOpponentTeam, setSelectedOpponentTeam] = useState<SavedTeam | null>(null);
  const [opponentType, setOpponentType] = useState<"champion" | "team">("champion");
  const [opponentChampionId, setOpponentChampionId] = useState<string>(GYM_CHAMPIONS[0]?.id ?? "");
  const [generationFilter, setGenerationFilter] = useState<string>("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSavedTeams(JSON.parse(raw));
    } catch {}
  }, []);

  // const playerTeamsOptions = useMemo(() => savedTeams.map(t => ({ id: t.id, name: t.name })), [savedTeams]);

  const startBattle = () => {
    if (!selectedPlayerTeam) return alert("Select your team");

    let opponent: { name: string; slots: Array<{ id: number; level: number }> } | undefined;

    if (opponentType === "champion") {
      const champ = GYM_CHAMPIONS.find(c => c.id === opponentChampionId);
      if (!champ) return alert("Select a champion");
      opponent = champ.team;
    } else {
      if (!selectedOpponentTeam) return alert("Select opponent team");
      opponent = {
        name: selectedOpponentTeam.name,
        slots: selectedOpponentTeam.slots.filter(s => s.id != null).map(s => ({ id: s.id as number, level: s.level }))
      };
    }

    if (!selectedPlayerTeam || !opponent) return;

    // Navigate to a future battle runtime route with encoded settings
    const params = new URLSearchParams({
      player: selectedPlayerTeam.id,
      opponentKind: opponentType,
      opponentId: opponentType === "champion" ? opponentChampionId : (selectedOpponentTeam?.id || ""),
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
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Swords className="h-5 w-5 text-poke-blue" />
                <h1 className="text-lg font-semibold">AI Battle</h1>
              </div>
              
              <button
                onClick={() => router.push("/lobby")}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Swords className="w-4 h-4" />
                <span>Online Battles</span>
              </button>
              
              {/* User Profile */}
              <UserProfile />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Player team selection */}
        <section className="border border-border rounded-xl bg-surface p-4">
          <h2 className="text-lg font-semibold mb-3">Your Team</h2>
          <TeamSelector
            selectedTeamId={selectedPlayerTeam?.id}
            onTeamSelect={setSelectedPlayerTeam}
            label="Select Your Team"
            showStorageIndicator={true}
          />
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
              <input type="radio" checked={opponentType === "team"} onChange={()=> {
                setOpponentType("team");
                setGenerationFilter(""); // Reset generation filter when switching to saved team
              }} />
              Saved Team
            </label>
          </div>

          {opponentType === "champion" ? (
            <TrainerRoster
              champions={GYM_CHAMPIONS}
              selectedChampionId={opponentChampionId}
              onChampionSelect={setOpponentChampionId}
              generationFilter={generationFilter}
              onGenerationFilterChange={setGenerationFilter}
            />
          ) : (
            <TeamSelector
              selectedTeamId={selectedOpponentTeam?.id}
              onTeamSelect={setSelectedOpponentTeam}
              label="Select Opponent Team"
              showStorageIndicator={true}
            />
          )}
        </section>

        <div className="flex justify-end">
          <button
            onClick={startBattle}
            disabled={!selectedPlayerTeam || (opponentType === "champion" && !opponentChampionId) || (opponentType === "team" && !selectedOpponentTeam)}
            className="px-4 py-2 rounded-lg bg-poke-blue text-white hover:bg-poke-blue/90 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {!selectedPlayerTeam ? "Select Your Team" : 
             opponentType === "champion" && !opponentChampionId ? "Select Champion" :
             opponentType === "team" && !selectedOpponentTeam ? "Select Opponent Team" :
             "Start Battle"}
          </button>
        </div>
      </main>
    </div>
  );
}

export default function BattlePageWrapper() {
  return <BattlePage />;
}
