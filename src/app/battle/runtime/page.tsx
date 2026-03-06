"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, MessageCircle, Swords } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ToastContainer, useToast } from "@/components/Toast";
import RTDBBattleComponent from '@/components/RTDBBattleComponent';
import OfflineBattleComponent from '@/components/OfflineBattleComponent';
import { GYM_CHAMPIONS, type Champion } from '@/lib/gym_champions';

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
  const [opponentChampion, setOpponentChampion] = useState<Champion | null>(null);
  const [isAIBattle, setIsAIBattle] = useState(false);
  const [battleTypeDetermined, setBattleTypeDetermined] = useState(false);

  // Load AI battle data from URL parameters
  useEffect(() => {
    const playerTeamId = searchParams.get("player");
    const opponentKind = searchParams.get("opponentKind");
    const opponentId = searchParams.get("opponentId");

    if (opponentKind === "champion" && opponentId) {
      setIsAIBattle(true);
      const champion = GYM_CHAMPIONS.find(c => c.id === opponentId) || null;
      setOpponentChampion(champion);
      setBattleTypeDetermined(true);
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

  // Get back URL for href attribute
  const getBackUrl = useCallback(() => {
    if (isAIBattle) {
      return "/battle";
    } else if (urlBattleId) {
      return `/lobby/${searchParams.get("roomId") || ""}`;
    } else {
      return "/battle";
    }
  }, [urlBattleId, searchParams, isAIBattle]);

  // Handle click events for back button
  const handleBackClick = useCallback((event: React.MouseEvent) => {
    // Handle middle click (button 1) or Ctrl+click for new tab
    if (event.button === 1 || event.ctrlKey || event.metaKey) {
      // Let the browser handle the middle click or Ctrl+click to open in new tab
      return;
    }

    // Prevent default for left click to handle programmatic navigation
    event.preventDefault();
    handleBackFromBattle();
  }, [handleBackFromBattle]);

  // Show loading state (AI battles skip auth check)
  if ((!isAIBattle && authLoading) || !battleTypeDetermined || (isAIBattle && !opponentChampion)) {
    return (
      <div className="fixed inset-0 bg-bg text-text flex items-center justify-center">
        <div className="text-center px-4">
          <img src="/loading.gif" alt="Loading battle" width={128} height={128} className="mx-auto mb-4" />
          <p className="text-muted">Loading battle...</p>
        </div>
      </div>
    );
  }

  // Show error if no user (only for multiplayer battles)
  if (!user && !isAIBattle) {
    return (
      <div className="fixed inset-0 bg-bg text-text flex items-center justify-center">
        <div className="text-center px-4">
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

  // Show error if no battle ID (only for multiplayer battles)
  if (!urlBattleId && !isAIBattle) {
    return (
      <div className="fixed inset-0 bg-bg text-text flex items-center justify-center">
        <div className="text-center px-4">
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
    <div className="fixed inset-0 flex flex-col bg-bg text-text overflow-hidden">
      <header className="flex-shrink-0 z-50 border-b border-border bg-surface">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <a
                href={getBackUrl()}
                onClick={handleBackClick}
                onMouseDown={(e) => {
                  if (e.button === 1) {
                    e.preventDefault()
                    window.open(getBackUrl(), '_blank')
                  }
                }}
                className="flex items-center space-x-1 sm:space-x-2 text-muted hover:text-text transition-colors cursor-pointer flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="font-medium text-sm sm:text-base hidden sm:inline">Back to Lobby</span>
              </a>
              <div className="flex items-center gap-2">
                <div className="p-1.5 sm:p-2 rounded-lg bg-red-100 text-red-600">
                  <Swords className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <h1 className="text-lg sm:text-xl font-bold text-text">Battle</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowChat(!showChat)}
                className="flex items-center gap-1 sm:gap-2 text-muted hover:text-text transition-colors text-sm"
              >
                <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Chat</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto px-4 py-4 sm:py-6">
        {/* Toast bridge handled via useEffect above */}
        {/* AI Battle (offline, uses same engine as multiplayer) */}
        {isAIBattle && opponentChampion ? (
          <OfflineBattleComponent
            config={{ opponentChampion }}
            onBattleComplete={(winner) => {
              console.log('AI Battle completed, winner:', winner);
              setShowBattleResults(true);
            }}
            viewMode="animated"
          />
        ) : (
          /* Regular Battle (Multiplayer over RTDB) */
          <RTDBBattleComponent 
            battleId={urlBattleId}
            onBattleComplete={(winner) => {
              console.log('Battle completed, winner:', winner);
              setShowBattleResults(true);
            }}
            viewMode="animated"
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
