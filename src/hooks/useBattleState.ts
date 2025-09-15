import { useEffect, useMemo, useState, useCallback } from "react";
import { onValue, ref as dbRef, serverTimestamp, set } from "firebase/database";
import { onAuthStateChanged, User } from "firebase/auth";
import { rtdb, auth } from "@/lib/firebase";

type IdMap<T> = Record<string, T>;

type Meta = {
  createdAt: number | { ".sv": "timestamp" };
  format: "singles";
  ruleSet: "gen9-no-weather";
  players: { p1: { uid: string }; p2: { uid: string } };
  phase: "choosing" | "resolving" | "ended";
  turn: number;
  version: number;
  deadlineAt: number;
  winnerUid: string | null;
  endedReason: null | "forfeit" | "timeout";
};

type PublicVolatiles = {
  taunt?: { turnsLeft: number };
  encore?: { turnsLeft: number };
  recharge?: boolean;
  protectUsedLastTurn?: boolean;
  subHp?: number;
};

type PublicMon = {
  species: string; level: number; types: string[];
  hp: { cur: number; max: number };
  status: null | "PAR" | "PSN" | "BRN" | "SLP" | "FRZ";
  boosts: IdMap<number>;
  volatiles?: PublicVolatiles;
};

type PublicState = {
  field: {
    hazards: IdMap<{ sr: boolean; spikes: number; tSpikes: number; web: boolean }>;
    screens: IdMap<{ reflect: number; lightScreen: number }>;
  };
  lastResultSummary?: string;
} & IdMap<{ active: PublicMon; benchPublic: Array<{ species: string; fainted: boolean; revealedMoves: string[] }> }>;

export type Move = { id: string; pp: number };
export type Pokemon = {
  species: string;
  level: number;
  types: string[];
  stats: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
  item?: string;
  ability?: string;
  moves: Move[];                 // exact PP here (private)
  status?: PublicMon["status"];
  fainted?: boolean;
};

type PrivateState = {
  team: Pokemon[];
  choiceLock?: { moveId?: string; locked?: boolean };
  disable?: { moveId?: string; turnsLeft?: number };
  encoreMoveId?: string;
};

type ChoicePayload =
  | { action: "move"; payload: { moveId: string; target: "p1" | "p2" }; clientVersion: number }
  | { action: "switch"; payload: { switchToIndex: number }; clientVersion: number }
  | { action: "forfeit"; payload: Record<string, never>; clientVersion: number };

type UseBattleState = {
  loading: boolean;
  error: string | null;
  meta: Meta | null;
  pub: PublicState | null;
  me: PrivateState | null;
  meUid: string | null;
  oppUid: string | null;

  timeLeftSec: number;

  legalMoves: Array<Move & { disabled?: boolean; reason?: string }>;
  legalSwitchIndexes: number[];

  chooseMove: (moveId: string, target?: "p1" | "p2") => Promise<void>;
  chooseSwitch: (idx: number) => Promise<void>;
  forfeit: () => Promise<void>;
};

const TURN_SECONDS = 45;

function isChoosing(meta: Meta | null) {
  return !!meta && meta.phase === "choosing";
}

function activePrivate(me: PrivateState | null): Pokemon | null {
  if (!me?.team?.length) return null;
  return me.team[0] ?? null; // Singles: index 0 is active in private mirror
}

export function useBattleState(battleId: string): UseBattleState {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [pub, setPub] = useState<PublicState | null>(null);
  const [me, setMe] = useState<PrivateState | null>(null);
  const [serverOffsetMs, setServerOffsetMs] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const meUid = user?.uid ?? null;
  const oppUid = useMemo(() => {
    if (!meta || !meUid) return null;
    return meUid === meta.players.p1.uid ? meta.players.p2.uid : meta.players.p1.uid;
  }, [meta, meUid]);

  // Listen to authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('useBattleState: Auth state changed:', user ? 'authenticated' : 'not authenticated');
      setUser(user);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!battleId) {
      console.log('useBattleState: No battleId provided');
      return;
    }
    
    if (authLoading) {
      console.log('useBattleState: Authentication still loading...');
      return;
    }
    
    if (!meUid) {
      console.log('useBattleState: No authenticated user, waiting...');
      setError('User not authenticated');
      return;
    }
    
    console.log('useBattleState: Setting up listeners for battle:', battleId, 'user:', meUid);
    setLoading(true);
    setError(null);

    const unsubs: Array<() => void> = [];
    
    // Add error handling for each listener
    unsubs.push(onValue(
      dbRef(rtdb, `/battles/${battleId}/meta`), 
      s => {
        console.log('useBattleState: Meta data received:', s.val());
        setMeta(s.val() ?? null);
      }, 
      e => {
        console.error('useBattleState: Meta listener error:', e);
        setError(e.message);
      }
    ));
    
    unsubs.push(onValue(
      dbRef(rtdb, `/battles/${battleId}/public`), 
      s => {
        console.log('useBattleState: Public data received:', s.val());
        setPub(s.val() ?? null);
      }, 
      e => {
        console.error('useBattleState: Public listener error:', e);
        setError(e.message);
      }
    ));
    
    unsubs.push(onValue(
      dbRef(rtdb, `/battles/${battleId}/private/${meUid}`), 
      s => {
        console.log('useBattleState: Private data received:', s.val());
        setMe(s.val() ?? null);
      }, 
      e => {
        console.error('useBattleState: Private listener error:', e);
        setError(e.message);
      }
    ));
    
    unsubs.push(onValue(
      dbRef(rtdb, "/.info/serverTimeOffset"), 
      s => setServerOffsetMs(s.val() ?? 0),
      e => console.error('useBattleState: Server offset error:', e)
    ));

    return () => { 
      console.log('useBattleState: Cleaning up listeners');
      unsubs.forEach(u => u()); 
    };
  }, [battleId, meUid, authLoading]);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
    } else if (meta && pub && me) {
      setLoading(false);
    }
  }, [meta, pub, me, authLoading]);

  const timeLeftSec = useMemo(() => {
    if (!meta || meta.phase !== "choosing" || !meta.deadlineAt) return 0;
    const now = Date.now() + serverOffsetMs;
    const assumedDeadline = typeof meta.deadlineAt === "number" ? meta.deadlineAt : Date.now();
    return Math.max(0, Math.ceil((assumedDeadline - now) / 1000));
  }, [meta, serverOffsetMs]);

  // Pull public volatiles for my active (for UI) and private secrets (for exact legality).
  const myPublicActive = useMemo(() => (meUid && pub ? pub[meUid]?.active ?? null : null), [pub, meUid]);
  const myPublicV = myPublicActive?.volatiles ?? {};
  const myPrivateActive = useMemo(() => activePrivate(me), [me]);

  // UI legality (server still authoritative)
  const legalMoves = useMemo(() => {
    if (!myPrivateActive) return [];
    const list = myPrivateActive.moves ?? [];
    const choiceLockMoveId = me?.choiceLock?.locked ? me?.choiceLock?.moveId : undefined;
    const disableMoveId = me?.disable?.moveId;
    const encoreMoveId = me?.encoreMoveId;
    const taunted = !!myPublicV.taunt;
    const recharging = !!myPublicV.recharge;

    return list.map(m => {
      let disabled = false;
      let reason = "";
      if (m.pp <= 0) { disabled = true; reason = "No PP"; }
      if (!disabled && recharging) { disabled = true; reason = "Recharge"; }
      if (!disabled && choiceLockMoveId && m.id !== choiceLockMoveId) { disabled = true; reason = "Choice-lock"; }
      if (!disabled && encoreMoveId && m.id !== encoreMoveId) { disabled = true; reason = "Encore"; }
      if (!disabled && disableMoveId && m.id === disableMoveId) { disabled = true; reason = "Disabled"; }
      if (!disabled && taunted) {
        // optional: you can tag moves with meta; here we do a simple heuristic
        const looksStatus = /protect|substitute|swords-dance|toxic|roost|recover|will-o-wisp|calm-mind|nasty-plot|spikes|stealth-rock|taunt|defog/i.test(m.id);
        if (looksStatus) { disabled = true; reason = "Taunt"; }
      }
      return { ...m, disabled, reason: disabled ? reason : undefined };
    });
  }, [myPrivateActive, me?.choiceLock, me?.disable, me?.encoreMoveId, myPublicV.taunt, myPublicV.recharge]);

  const legalSwitchIndexes = useMemo(() => {
    const team = me?.team ?? [];
    const res: number[] = [];
    for (let i = 1; i < team.length; i++) {
      if (!team[i].fainted && team[i].stats.hp > 0) res.push(i);
    }
    return res;
  }, [me?.team]);

  const writeChoice = useCallback(async (choice: ChoicePayload) => {
    if (!meUid || !meta) throw new Error("No auth or meta");
    if (!isChoosing(meta)) throw new Error("Not in choosing phase");
    const path = `/battles/${battleId}/turns/${meta.turn}/choices/${meUid}`;
    await set(dbRef(rtdb, path), { ...choice, committedAt: serverTimestamp() });
  }, [battleId, meUid, meta]);

  const chooseMove = useCallback(async (moveId: string, target: "p1" | "p2" = "p2") => {
    if (!meta) throw new Error("No meta");
    await writeChoice({ action: "move", payload: { moveId, target }, clientVersion: meta.version });
  }, [writeChoice, meta]);

  const chooseSwitch = useCallback(async (idx: number) => {
    if (!meta) throw new Error("No meta");
    if (!legalSwitchIndexes.includes(idx)) throw new Error("Illegal switch");
    await writeChoice({ action: "switch", payload: { switchToIndex: idx }, clientVersion: meta.version });
  }, [writeChoice, meta, legalSwitchIndexes]);

  const forfeit = useCallback(async () => {
    if (!meta) throw new Error("No meta");
    await writeChoice({ action: "forfeit", payload: {}, clientVersion: meta.version });
  }, [writeChoice, meta]);

  return {
    loading, error, meta, pub, me, meUid, oppUid,
    timeLeftSec,
    legalMoves,
    legalSwitchIndexes,
    chooseMove,
    chooseSwitch,
    forfeit
  };
}
