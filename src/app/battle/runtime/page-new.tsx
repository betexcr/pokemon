"use client";

import { useEffect, useState, useCallback, useRef, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useBattleState } from '@/hooks/useBattleState';
import { ToastContainer, useToast } from "@/components/Toast";
import RTDBBattleComponent from '@/components/RTDBBattleComponent';

function BattleRuntimePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { toasts, removeToast } = useToast();
  
  // Use RTDB-based battle state hook
  const urlBattleId = searchParams.get("battleId");
  const rtdbBattleState = useBattleState(urlBattleId || "");
  
  const [showChat, setShowChat] = useState(false);
  const [showBattleResults, setShowBattleResults] = useState(false);

  // Handle back navigation
  const handleBackFromBattle = useCallback(() => {
    if (urlBattleId) {
      router.push(`/lobby/${searchParams.get("roomId") || ""}`);
    } else {
      router.push("/battle");
    }
  }, [router, urlBattleId, searchParams]);

  // Get back URL for href attribute
  const getBackUrl = useCallback(() => {
    if (urlBattleId) {
      return `/lobby/${searchParams.get("roomId") || ""}`;
    } else {
      return "/battle";
    }
  }, [urlBattleId, searchParams]);

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

  // Show loading state
  if (authLoading) {
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

  // Show loading state while battle data is loading
  if (rtdbBattleState.loading) {
    return (
      <div className="min-h-screen bg-bg text-text flex items-center justify-center">
        <div className="text-center">
          <img src="/loading.gif" alt="Loading battle data" width={128} height={128} className="mx-auto mb-4" />
          <p className="text-muted">Loading battle data...</p>
        </div>
      </div>
    );
  }

  // Show error if battle failed to load
  if (rtdbBattleState.error) {
    return (
      <div className="min-h-screen bg-bg text-text flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to load battle: {rtdbBattleState.error}</p>
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

  // Show error if no battle data
  if (!rtdbBattleState.meta || !rtdbBattleState.pub) {
    return (
      <div className="min-h-screen bg-bg text-text flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Battle not found or not ready</p>
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
            <a
              href={getBackUrl()}
              onClick={handleBackClick}
              onMouseDown={(e) => {
                // Handle middle click
                if (e.button === 1) {
                  e.preventDefault()
                  window.open(getBackUrl(), '_blank')
                }
              }}
              className="flex items-center space-x-2 text-muted hover:text-text transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Back to Lobby</span>
            </a>
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted">
                Turn {rtdbBattleState.meta.turn}
              </div>
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
        {/* Use RTDB Battle Component */}
        <RTDBBattleComponent 
          battleId={urlBattleId}
        />
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
