import React, { useMemo, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { auth, functions, rtdb } from "../lib/firebase";
import type { Team } from "../types/battle";

type Props = {
  opponentUid: string;
  myTeam: Team;           // full team with PP/items/abilities
  opponentTeam: Team;     // provide if you host both; otherwise omit and use a separate accept flow
  onStarted: (battleId: string) => void; // navigate to battle screen
};

export default function StartBattleButton({ opponentUid, myTeam, opponentTeam, onStarted }: Props) {
  const [loading, setLoading] = useState(false);
  const [battleError, setBattleError] = useState<string | null>(null);
  const firebaseReady = Boolean(auth && functions && rtdb);

  const disabled = useMemo(() => {
    if (!firebaseReady) {
      return true;
    }
    return loading || !auth?.currentUser || !myTeam?.length || !opponentUid || !opponentTeam?.length;
  }, [loading, firebaseReady, myTeam, opponentUid, opponentTeam]);

  async function startBattle() {
    setBattleError(null);
    setLoading(true);
    try {
      if (!firebaseReady || !auth || !functions || !rtdb) {
        throw new Error("Battle services are unavailable. Firebase configuration is missing.");
      }

      const user = auth.currentUser;
      if (!user) {
        throw new Error("You must be signed in to start a battle.");
      }

      const createBattle = httpsCallable(functions, "createBattleWithTeams");
      const res: any = await createBattle({
        p1Uid: user.uid,
        p2Uid: opponentUid,
        p1Team: myTeam,
        p2Team: opponentTeam
      });
      const battleId: string = res.data.battleId;
      onStarted(battleId);
    } catch (e: any) {
      setBattleError(e.message ?? "Failed to start battle");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={startBattle}
        disabled={disabled}
        className={`px-4 py-2 rounded-xl font-medium shadow ${
          disabled 
            ? "bg-gray-300 cursor-not-allowed" 
            : "bg-indigo-600 hover:bg-indigo-700 text-white"
        }`}
      >
        {loading ? "Starting…" : "Start Battle"}
      </button>
      {battleError && <span className="text-red-600 text-sm">{battleError}</span>}
      {!battleError && !firebaseReady && (
        <span className="text-sm text-muted-foreground">Battle services unavailable.</span>
      )}
    </div>
  );
}
