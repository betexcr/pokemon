import React, { useMemo, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { onValue, ref as dbRef } from "firebase/database";
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

  const disabled = useMemo(() => {
    return loading || !auth.currentUser || !myTeam?.length || !opponentUid || !opponentTeam?.length;
  }, [loading, myTeam, opponentUid, opponentTeam]);

  async function startBattle() {
    setBattleError(null);
    setLoading(true);
    try {
      const user = auth.currentUser!;
      const createBattle = httpsCallable(functions, "createBattleWithTeams");
      const res: any = await createBattle({
        p1Uid: user.uid,
        p2Uid: opponentUid,
        p1Team: myTeam,
        p2Team: opponentTeam
      });
      const battleId: string = res.data.battleId;

      // Optional: attach listeners immediately so UI reacts live
      const metaRef = dbRef(rtdb, `/battles/${battleId}/meta`);
      const publicRef = dbRef(rtdb, `/battles/${battleId}/public`);
      const privateRef = dbRef(rtdb, `/battles/${battleId}/private/${user.uid}`);

      const unsubscribers: Array<() => void> = [];
      unsubscribers.push(onValue(metaRef, () => {}, { onlyOnce: false }));
      unsubscribers.push(onValue(publicRef, () => {}, { onlyOnce: false }));
      unsubscribers.push(onValue(privateRef, () => {}, { onlyOnce: false }));

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
    </div>
  );
}
