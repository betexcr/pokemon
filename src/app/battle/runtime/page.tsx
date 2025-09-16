"use client";

import { useEffect, useState, useCallback, useRef, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, MessageCircle, Swords } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ToastContainer, useToast } from "@/components/Toast";
import FirestoreBattleComponent from '@/components/FirestoreBattleComponent';
import { AIBattleScene } from '@/components/battle/AIBattleScene';
import { GYM_CHAMPIONS } from '@/lib/gym_champions';

function BattleRuntimePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { toasts, removeToast, addToast } = useToast();

  // Bridge: allow classic components to fire toasts via window events
  useEffect(() => {
    if (typeof window === 'undefined') return;
    (window as any).__battle_toast = (opts: { title?: string; message?: string; type?: 'info'|'success'|'warning'|'error'; duration?: number }) => {
      window.dispatchEvent(new CustomEvent('battle-toast', { detail: opts }));
    };
    const handler = (e: any) => {
      const d = e.detail || {};
      addToast({ type: d.type || 'info', title: d.title || 'Move used', message: d.message || '', duration: d.duration ?? 3500 });
    };
    window.addEventListener('battle-toast', handler);
    return () => { window.removeEventListener('battle-toast', handler); };
  }, [addToast]);
  
  // Get battle ID from URL
  const urlBattleId = searchParams.get("battleId");
  
  const [showChat, setShowChat] = useState(false);
  const [showBattleResults, setShowBattleResults] = useState(false);
  const [useNewBattleView, setUseNewBattleView] = useState(true); // Toggle for new battle view
  const [playerTeam, setPlayerTeam] = useState<Array<{ id: number; level: number; moves?: string[] }>>([]);
  const [opponentChampionId, setOpponentChampionId] = useState<string>('');
  const [isAIBattle, setIsAIBattle] = useState(false);
  const [battleTypeDetermined, setBattleTypeDetermined] = useState(false);

  // Load AI battle data from URL parameters
  useEffect(() => {
    const playerTeamId = searchParams.get("player");
    const opponentKind = searchParams.get("opponentKind");
    const opponentId = searchParams.get("opponentId");

    if (opponentKind === "champion" && opponentId) {
      setIsAIBattle(true);
      setOpponentChampionId(opponentId);
      setBattleTypeDetermined(true);
      
      // Load player team from localStorage
      if (playerTeamId) {
        try {
          // Try to load from current team first
          const currentTeam = localStorage.getItem('pokemon-current-team');
          if (currentTeam) {
            const team = JSON.parse(currentTeam);
            const teamData = team
              .filter((slot: any) => slot.id !== null)
              .map((slot: any) => ({ 
                id: slot.id, 
                level: slot.level,
                moves: Array.isArray(slot.moves) ? slot.moves.slice(0,4).map((m: any) => m?.name).filter(Boolean) : undefined
              }));
            if (teamData.length > 0) {
              setPlayerTeam(teamData);
              return;
            }
          }

          // Fallback to saved teams
          const savedTeams = localStorage.getItem('pokemon-team-builder');
          if (savedTeams) {
            const teams = JSON.parse(savedTeams);
            const team = teams.find((t: any) => t.id === playerTeamId);
            if (team) {
              const teamData = team.slots
                .filter((slot: any) => slot.id !== null)
                .map((slot: any) => ({ 
                  id: slot.id, 
                  level: slot.level,
                  moves: Array.isArray(slot.moves) ? slot.moves.slice(0,4).map((m: any) => m?.name).filter(Boolean) : undefined
                }));
              setPlayerTeam(teamData);
            }
          }
        } catch (error) {
          console.error('Failed to load player team:', error);
        }
      }
    } else {
      // Not an AI battle, set as determined
      setBattleTypeDetermined(true);
    }
  }, [searchParams]);

  // Handle back navigation
  const handleBackFromBattle = useCallback(() => {
    if (isAIBattle) {
      router.push("/battle");
    } else if (urlBattleId) {
      router.push(`/lobby/${searchParams.get("roomId") || ""}`);
    } else {
      router.push("/battle");
    }
  }, [router, urlBattleId, searchParams, isAIBattle]);

  // Show loading state
  if (authLoading || !battleTypeDetermined) {
    return (
      <div className="min-h-screen bg-bg text-text flex items-center justify-center">
        <div className="text-center">
          <img src="/loading.gif" alt="Loading battle" width={128} height={128} className="mx-auto mb-4" />
          <p className="text-muted">Loading battle...</p>
        </div>
      </div>
    );
  }

  // Show error if no user
  if (!user) {
    return (
      <div className="min-h-screen bg-bg text-text flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">You must be logged in to view battles</p>
          <button
            onClick={() => router.push("/auth")}
            className="px-4 py-2 bg-poke-blue text-white rounded-lg hover:bg-poke-blue/90"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Show error if no battle ID
  if (!urlBattleId) {
    return (
      <div className="min-h-screen bg-bg text-text flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">No battle ID provided</p>
          <button
            onClick={() => router.push("/battle")}
            className="px-4 py-2 bg-poke-blue text-white rounded-lg hover:bg-poke-blue/90"
          >
            Back to Battle
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="sticky top-0 z-50 border-b border-border bg-surface">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackFromBattle}
                className="flex items-center space-x-2 text-muted hover:text-text transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Back to Lobby</span>
              </button>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-red-100 text-red-600">
                  <Swords className="h-5 w-5" />
                </div>
                <h1 className="text-xl font-bold text-text">Battle</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setUseNewBattleView(!useNewBattleView)}
                className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                {useNewBattleView ? 'Classic View' : 'Animated View'}
              </button>
              <button
                onClick={() => setShowChat(!showChat)}
                className="flex items-center gap-2 text-muted hover:text-text transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
                Chat
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-4 py-6">
        {/* Toast bridge handled via useEffect above */}
        {/* AI Battle */}
        {isAIBattle ? (
          <AIBattleScene
            playerTeam={playerTeam}
            opponentChampionId={opponentChampionId}
            viewMode={useNewBattleView ? 'animated' : 'classic'}
          />
        ) : (
          /* Regular Battle */
          <FirestoreBattleComponent 
            battleId={urlBattleId}
            onBattleComplete={(winner) => {
              console.log('Battle completed, winner:', winner);
              setShowBattleResults(true);
            }}
            viewMode={useNewBattleView ? 'animated' : 'classic'}
          />
        )}
      </main>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

// Wrapper component with Suspense boundary
export default function BattleRuntimePageWrapper() {
  return (
    <Suspense fallback={<div>Loading battle...</div>}>
      <BattleRuntimePage />
    </Suspense>
  );
}
