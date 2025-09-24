"use client";
import { useCallback } from "react";
import { useRouter } from "next/navigation";

export function useLobbyTransition() {
  const router = useRouter();

  return useCallback((roomId: string) => {
    // Trigger lobby wipe transition
    const nav = () => router.push(`/lobby/${roomId}`);
    
    // Use native view transition if available
    if (document.startViewTransition) {
      document.startViewTransition(nav);
    } else {
      nav();
    }
  }, [router]);
}
