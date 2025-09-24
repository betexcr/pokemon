"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Swords } from "lucide-react";
import { GYM_CHAMPIONS } from "@/lib/gym_champions";
import { generateBattleId } from "@/lib/utils";
import { getTrainerSpriteUrl } from "@/lib/trainerSprites";
import AppHeader from "@/components/AppHeader";
import TrainerRoster from "@/components/battle/TrainerRoster";
import TeamSelector from "@/components/TeamSelector";
// Removed LoadingSprite in favor of static /loading.gif
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
  const [isStartingBattle, setIsStartingBattle] = useState(false);
  const [showStartOverlay, setShowStartOverlay] = useState(false);
  const [teamSelectorReady, setTeamSelectorReady] = useState(false);

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
    
    // Check if a team is selected first
    if (!selectedPlayerTeam) {
      alert("Please select your team first before choosing an opponent!");
      return;
    }
    
    if (isMobile) {
      // Mobile: Single tap shows tooltip, double tap starts battle
      if (tapLength < 500 && lastTapTime !== 0) {
        // Double tap - start battle
        const champion = GYM_CHAMPIONS.find(c => c.id === championId);
        if (champion) {
          console.log('Starting battle with champion:', champion.name);
          startBattleWithOpponent(selectedPlayerTeam, champion);
        } else {
          console.error('Champion not found:', championId);
          alert("Opponent not found. Please try again.");
        }
        setShowTooltip(null);
      } else {
        // Single tap - show/hide tooltip
        setShowTooltip(showTooltip === championId ? null : championId);
        setOpponentChampionId(championId);
      }
    } else {
      // Desktop: Single click starts battle
      const champion = GYM_CHAMPIONS.find(c => c.id === championId);
      if (champion) {
        console.log('Starting battle with champion:', champion.name);
        startBattleWithOpponent(selectedPlayerTeam, champion);
      } else {
        console.error('Champion not found:', championId);
        alert("Opponent not found. Please try again.");
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
    console.log('Starting battle with opponent:', {
      playerTeam: playerTeam.name,
      champion: champion.name,
      championId: champion.id
    });

    setIsStartingBattle(true);
    setShowStartOverlay(true);

    const opponent = champion.team;
    
    if (!playerTeam || !opponent) {
      console.error('Missing team data:', { playerTeam, opponent });
      alert("Error: Missing team data. Please try again.");
      setIsStartingBattle(false);
      return;
    }

    // Validate player team has Pokemon
    const validSlots = playerTeam.slots.filter(slot => slot.id !== null);
    if (validSlots.length === 0) {
      alert("Your team has no Pokemon! Please add Pokemon to your team first.");
      setIsStartingBattle(false);
      return;
    }

    // Store the selected team in localStorage as current team for battle runtime
    try {
      const currentTeamData = playerTeam.slots.map(slot => ({
        id: slot.id,
        level: slot.level,
        moves: Array.isArray((slot as any).moves) ? (slot as any).moves : [],
        nature: (slot as any).nature || 'hardy'
      }));
      localStorage.setItem('pokemon-current-team', JSON.stringify(currentTeamData));
      console.log('Stored current team data:', currentTeamData);
    } catch (error) {
      console.error('Failed to store current team:', error);
      alert("Error saving team data. Please try again.");
      setIsStartingBattle(false);
      return;
    }

    // Generate a battle ID for AI battles
    const battleId = generateBattleId();
    console.log('Generated battle ID:', battleId);

    // Navigate to battle runtime with battle ID and encoded settings
    const params = new URLSearchParams({
      battleId: battleId,
      player: playerTeam.id,
      opponentKind: "champion",
      opponentId: champion.id,
    });
    
    const battleUrl = `/battle/runtime?${params.toString()}`;
    console.log('Navigating to battle URL:', battleUrl);
    
    try {
      router.push(battleUrl);
    } catch (error) {
      console.error('Failed to navigate to battle:', error);
      alert("Error starting battle. Please try again.");
      setIsStartingBattle(false);
      setShowStartOverlay(false);
    }
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
        showToolbar={true}
        showThemeToggle={false}
        iconKey="battle"
        showIcon={true}
      />

      {/* Scrollable Content Area */}
      <main className="flex-1 min-h-0 overflow-y-auto relative">
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Player team selection */}
        <section className="border border-border rounded-xl bg-surface p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-text">Your Team</h2>
            <div className="flex gap-2">
              <button
                onClick={() => router.push("/team")}
                className="flex items-center space-x-2 bg-poke-blue hover:bg-poke-blue/90 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg border border-poke-blue/20"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Go to Team Builder</span>
              </button>
            </div>
          </div>
          <TeamSelector
            selectedTeamId={selectedPlayerTeam?.id}
            onTeamSelect={setSelectedPlayerTeam}
            label="Select Your Team"
            showStorageIndicator={true}
            onReady={(ready) => setTeamSelectorReady(ready)}
          />
        </section>

        {/* Opponent selection */}
        <section className="border border-border rounded-xl bg-surface p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-text">AI Opponent</h2>
            <button
              onClick={() => router.push("/lobby")}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Swords className="w-4 h-4" />
              <span>Online Battles</span>
            </button>
          </div>
          
          {teamSelectorReady && selectedPlayerTeam ? (
            <div className="space-y-4">
              <div className="text-center py-2">
                <div className="mb-2 p-2 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    ✓ Team "{selectedPlayerTeam.name}" selected
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    {selectedPlayerTeam.slots.filter(slot => slot.id !== null).length}/6 Pokémon
                  </p>
                </div>
                <p className="text-sm text-muted mb-2">
                  {isStartingBattle 
                    ? 'Starting battle...' 
                    : isMobile 
                      ? 'Tap once to see details, tap twice to battle' 
                      : 'Hover to see details, click to battle'
                  }
                </p>
                {opponentChampionId && (
                  <p className="text-sm font-medium text-text">
                    Selected: {GYM_CHAMPIONS.find(c => c.id === opponentChampionId)?.name || 'Unknown Champion'}
                  </p>
                )}
              </div>
              
              <div className={isStartingBattle ? 'opacity-50 pointer-events-none' : ''}>
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

              {/* Selected Champion Info */}
              {opponentChampionId && (
                <div className="mt-4 p-4 bg-surface dark:bg-gray-800/50 border border-border dark:border-gray-700 rounded-lg">
                  {(() => {
                    const selectedChampion = GYM_CHAMPIONS.find(c => c.id === opponentChampionId);
                    if (!selectedChampion) return null;
                    
                    return (
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 flex items-center justify-center">
                          <img
                            src={getTrainerSpriteUrl(selectedChampion)}
                            alt={selectedChampion.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover rounded-lg border-2 border-white/20 shadow-lg"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/placeholder-pokemon.png';
                              target.className = 'w-full h-full object-contain rounded-lg bg-gray-200 border-2 border-white/20 shadow-lg';
                            }}
                          />
                        </div>
                        <div>
                          <h4 className="font-bold text-black dark:text-gray-100">{selectedChampion.name}</h4>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-300">{selectedChampion.team.name}</p>
                          <p className="text-xs font-medium text-gray-800 dark:text-gray-400">{selectedChampion.generation}</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          ) : teamSelectorReady ? (
            <div className="text-center py-8">
              <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg">
                <p className="text-yellow-800 dark:text-yellow-200 font-medium mb-2">
                  ⚠️ No team selected
                </p>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  Please select your team above to choose an AI opponent
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <img src="/loading.gif" alt="Loading" width={80} height={80} className="mx-auto" />
            </div>
          )}
        </section>

        {!selectedPlayerTeam && (
          <div className="text-center py-8">
            <p className="text-lg text-muted">Select your team above to start an AI battle!</p>
          </div>
        )}
        </div>
        {showStartOverlay && (
          <div className="absolute inset-0 bg-bg/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="text-center">
              <div className="mx-auto mb-3">
                <img src="/loading.gif" alt="Starting battle" width={128} height={128} className="mx-auto" />
              </div>
              <div className="text-sm text-muted">Starting battle…</div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function BattlePageWrapper() {
  return <BattlePage />;
}
