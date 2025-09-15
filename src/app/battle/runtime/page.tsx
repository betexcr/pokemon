"use client";

import { useEffect, useState, useCallback, useRef, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ToastContainer, useToast } from "@/components/Toast";
import RTDBBattleComponent from '@/components/RTDBBattleComponent';
import { BattleScene } from '@/components/battle/BattleScene';

function BattleRuntimePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { toasts, removeToast } = useToast();
  
  // Get battle ID from URL
  const urlBattleId = searchParams.get("battleId");
  
  const [showChat, setShowChat] = useState(false);
  const [showBattleResults, setShowBattleResults] = useState(false);
  const [useNewBattleView, setUseNewBattleView] = useState(true); // Toggle for new battle view

  // Handle back navigation
  const handleBackFromBattle = useCallback(() => {
    if (urlBattleId) {
      router.push(`/lobby/${searchParams.get("roomId") || ""}`);
    } else {
      router.push("/battle");
    }
  }, [router, urlBattleId, searchParams]);

  // Show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-bg text-text flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-poke-blue mx-auto mb-4"></div>
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
            <button
              onClick={handleBackFromBattle}
              className="flex items-center space-x-2 text-muted hover:text-text transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Back to Lobby</span>
            </button>
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
        {/* Toggle between battle views */}
        {useNewBattleView ? (
          <BattleScene 
            battleId={urlBattleId}
          />
        ) : (
          <RTDBBattleComponent 
            battleId={urlBattleId}
            onBattleComplete={(winner) => {
              console.log('Battle completed, winner:', winner);
              setShowBattleResults(true);
            }}
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
