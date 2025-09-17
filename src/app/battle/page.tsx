"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Swords } from "lucide-react";
import { GYM_CHAMPIONS } from "@/lib/gym_champions";
import { generateBattleId } from "@/lib/utils";
import AppHeader from "@/components/AppHeader";
import TrainerRoster from "@/components/battle/TrainerRoster";
import TeamSelector from "@/components/TeamSelector";
import BattleStartFlash from "@/components/battle/BattleStartFlash";

// Saved teams storage key reused from team builder
// const STORAGE_KEY = "pokemon-team-builder";

type SavedTeam = { id: string; name: string; slots: Array<{ id: number | null; level: number }>; };

function BattlePage() {
  const router = useRouter();
  // const [savedTeams, setSavedTeams] = useState<SavedTeam[]>([]);
  const [selectedPlayerTeam, setSelectedPlayerTeam] = useState<SavedTeam | null>(null);
  const [selectedOpponentTeam, setSelectedOpponentTeam] = useState<SavedTeam | null>(null);
  const [opponentType, setOpponentType] = useState<"champion" | "team">("champion");
  const [opponentChampionId, setOpponentChampionId] = useState<string>("");
  const [generationFilter, setGenerationFilter] = useState<string>("");
  const [isMobile, setIsMobile] = useState(false);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [lastTapTime, setLastTapTime] = useState<number>(0);
  const [introDone, setIntroDone] = useState(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);


  // useEffect(() => {
  //   try {
  //     const raw = localStorage.getItem(STORAGE_KEY);
  //     if (raw) setSavedTeams(JSON.parse(raw));
  //   } catch {}
  // }, []);

  // const playerTeamsOptions = useMemo(() => savedTeams.map(t => ({ id: t.id, name: t.name })), [savedTeams]);

  // Handle trainer selection with mobile/desktop interactions
  const handleTrainerClick = (championId: string) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTapTime;
    
    if (isMobile) {
      // Mobile: Single tap shows tooltip, double tap starts battle
      if (tapLength < 500 && lastTapTime !== 0) {
        // Double tap - start battle
        if (selectedPlayerTeam) {
          const champion = GYM_CHAMPIONS.find(c => c.id === championId);
          if (champion) {
            startBattleWithOpponent(selectedPlayerTeam, champion);
          }
        }
        setShowTooltip(null);
      } else {
        // Single tap - show/hide tooltip
        setShowTooltip(showTooltip === championId ? null : championId);
        setOpponentChampionId(championId);
      }
    } else {
      // Desktop: Single click starts battle
      if (selectedPlayerTeam) {
        const champion = GYM_CHAMPIONS.find(c => c.id === championId);
        if (champion) {
          startBattleWithOpponent(selectedPlayerTeam, champion);
        }
      }
    }
    
    setLastTapTime(currentTime);
  };

  // Handle hover for desktop tooltip
  const handleTrainerHover = (championId: string | null) => {
    if (!isMobile) {
      setShowTooltip(championId);
      if (championId) {
        setOpponentChampionId(championId);
      }
    }
  };

  const startBattleWithOpponent = (playerTeam: SavedTeam, champion: any) => {
    const opponent = champion.team;
    
    if (!playerTeam || !opponent) return;

    // Store the selected team in localStorage as current team for battle runtime
    try {
      const currentTeamData = playerTeam.slots.map(slot => ({
        id: slot.id,
        level: slot.level,
        moves: Array.isArray((slot as any).moves) ? (slot as any).moves : []
      }));
      localStorage.setItem('pokemon-current-team', JSON.stringify(currentTeamData));
    } catch (error) {
      console.error('Failed to store current team:', error);
    }

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
    <div className="h-screen bg-bg text-text flex flex-col overflow-hidden relative">
      {/* Battle Start Flash */}
      {!introDone && <BattleStartFlash onDone={() => setIntroDone(true)} />}
      
      <AppHeader
        title="AI Battle"
        backLink="/"
        backLabel="Back to PokéDex"
        showToolbar={false}
        showThemeToggle={false}
        iconKey="battle"
        showIcon={true}
        rightContent={
          <button
            onClick={() => router.push("/lobby")}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Swords className="w-4 h-4" />
            <span>Online Battles</span>
          </button>
        }
      />

      {/* Scrollable Content Area */}
      <main className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Player team selection */}
        <section className="border border-border rounded-xl bg-surface p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-text">Your Team</h2>
            <div className="flex gap-2">
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
          
          {selectedPlayerTeam ? (
            <div className="space-y-4">
              <div className="text-center py-2">
                <p className="text-sm text-muted mb-2">
                  {isMobile ? 'Tap once to see details, tap twice to battle' : 'Hover to see details, click to battle'}
                </p>
                {opponentChampionId && (
                  <p className="text-sm font-medium text-text">
                    Selected: {GYM_CHAMPIONS.find(c => c.id === opponentChampionId)?.name || 'Unknown Champion'}
                  </p>
                )}
              </div>
              
              <TrainerRoster
                champions={GYM_CHAMPIONS}
                selectedChampionId={opponentChampionId}
                onChampionSelect={handleTrainerClick}
                generationFilter={generationFilter}
                onGenerationFilterChange={setGenerationFilter}
                showTooltip={showTooltip}
                onTrainerHover={handleTrainerHover}
                isMobile={isMobile}
              />
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted">Select your team above to choose an AI opponent</p>
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
