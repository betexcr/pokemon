"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Swords } from "lucide-react";
import { GYM_CHAMPIONS } from "@/lib/gym_champions";
import { generateBattleId } from "@/lib/utils";
import UserDropdown from "@/components/UserDropdown";
import TrainerRoster from "@/components/battle/TrainerRoster";
import TeamSelector from "@/components/TeamSelector";

// Saved teams storage key reused from team builder
// const STORAGE_KEY = "pokemon-team-builder";

type SavedTeam = { id: string; name: string; slots: Array<{ id: number | null; level: number }>; };

function BattlePage() {
  const router = useRouter();
  // const [savedTeams, setSavedTeams] = useState<SavedTeam[]>([]);
  const [selectedPlayerTeam, setSelectedPlayerTeam] = useState<SavedTeam | null>(null);
  const [selectedOpponentTeam, setSelectedOpponentTeam] = useState<SavedTeam | null>(null);
  const [opponentType, setOpponentType] = useState<"champion" | "team">("champion");
  const [opponentChampionId, setOpponentChampionId] = useState<string>(GYM_CHAMPIONS[0]?.id ?? "");
  const [generationFilter, setGenerationFilter] = useState<string>("");
  const [isAutoStarting, setIsAutoStarting] = useState(false);

  // Reset function to allow selecting a different team
  const resetSelection = () => {
    setSelectedPlayerTeam(null);
    setIsAutoStarting(false);
    setOpponentChampionId(GYM_CHAMPIONS[0]?.id ?? "");
  };

  // useEffect(() => {
  //   try {
  //     const raw = localStorage.getItem(STORAGE_KEY);
  //     if (raw) setSavedTeams(JSON.parse(raw));
  //   } catch {}
  // }, []);

  // const playerTeamsOptions = useMemo(() => savedTeams.map(t => ({ id: t.id, name: t.name })), [savedTeams]);

  // Auto-start battle when player team is selected
  useEffect(() => {
    if (selectedPlayerTeam && !isAutoStarting) {
      setIsAutoStarting(true);
      
      // Select a random AI opponent
      const randomChampion = GYM_CHAMPIONS[Math.floor(Math.random() * GYM_CHAMPIONS.length)];
      setOpponentChampionId(randomChampion.id);
      
      // Start battle after a short delay to show the selection
      setTimeout(() => {
        startBattleWithOpponent(selectedPlayerTeam, randomChampion);
      }, 1000);
    }
  }, [selectedPlayerTeam, isAutoStarting]);

  const startBattleWithOpponent = (playerTeam: SavedTeam, champion: any) => {
    const opponent = champion.team;
    
    if (!playerTeam || !opponent) return;

    // Generate a battle ID for AI battles
    const battleId = generateBattleId();

    // Navigate to battle runtime with battle ID and encoded settings
    const params = new URLSearchParams({
      battleId: battleId,
      player: playerTeam.id,
      opponentKind: "champion",
      opponentId: champion.id,
    });
    router.push(`/battle/runtime?${params.toString()}`);
  };

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

    // Generate a battle ID for AI battles
    const battleId = generateBattleId();

    // Navigate to a future battle runtime route with battle ID and encoded settings
    const params = new URLSearchParams({
      battleId: battleId,
      player: selectedPlayerTeam.id,
      opponentKind: opponentType,
      opponentId: opponentType === "champion" ? opponentChampionId : (selectedOpponentTeam?.id || ""),
    });
    router.push(`/battle/runtime?${params.toString()}`);
  };

  return (
    <div className="h-screen bg-bg text-text flex flex-col overflow-hidden">
      {/* Fixed Header */}
      <header className="flex-shrink-0 border-b border-border bg-surface">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => router.push("/")}
              className="flex items-center space-x-2 text-muted hover:text-text transition-colors"
              title="Back to PokéDex"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium text-text">Back to PokéDex</span>
            </button>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Swords className="h-5 w-5 text-poke-blue" />
                <h1 className="text-lg font-semibold text-text">AI Battle</h1>
              </div>
              
              <button
                onClick={() => router.push("/lobby")}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Swords className="w-4 h-4" />
                <span>Online Battles</span>
              </button>
              
              {/* User Profile */}
              <UserDropdown />
            </div>
          </div>
        </div>
      </header>

      {/* Scrollable Content Area */}
      <main className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Player team selection */}
        <section className="border border-border rounded-xl bg-surface p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-text">Your Team</h2>
            <div className="flex gap-2">
              {selectedPlayerTeam && (
                <button
                  onClick={resetSelection}
                  className="text-sm text-orange-600 hover:text-orange-700 hover:underline transition-colors"
                >
                  Select Different Team
                </button>
              )}
              <button
                onClick={() => router.push("/team")}
                className="text-sm text-poke-blue hover:text-poke-blue/80 hover:underline transition-colors"
              >
                Go to Team Builder
              </button>
            </div>
          </div>
          <TeamSelector
            selectedTeamId={selectedPlayerTeam?.id}
            onTeamSelect={setSelectedPlayerTeam}
            label="Select Your Team"
            showStorageIndicator={true}
          />
        </section>

        {/* Opponent selection */}
        <section className="border border-border rounded-xl bg-surface p-4">
          <h2 className="text-lg font-bold mb-3 text-text">AI Opponent</h2>
          
          {isAutoStarting ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-poke-blue mx-auto mb-4"></div>
              <p className="text-text mb-2">Selecting AI opponent...</p>
              <p className="text-sm text-muted">
                {opponentChampionId ? 
                  `Facing ${GYM_CHAMPIONS.find(c => c.id === opponentChampionId)?.name || 'Unknown Champion'}...` :
                  'Preparing battle...'
                }
              </p>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted">AI opponent will be selected automatically when you choose your team</p>
            </div>
          )}
        </section>

        {!selectedPlayerTeam && (
          <div className="text-center py-8">
            <p className="text-lg text-muted">Select your team above to start an AI battle!</p>
          </div>
        )}
        </div>
      </main>
    </div>
  );
}

export default function BattlePageWrapper() {
  return <BattlePage />;
}
