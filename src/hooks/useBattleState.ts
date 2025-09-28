import { useEffect, useMemo, useState, useCallback } from "react";
import { onValue, ref as dbRef, serverTimestamp, set } from "firebase/database";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, updateDoc, getDoc, serverTimestamp as firestoreServerTimestamp } from "firebase/firestore";
import { rtdb, auth, db } from "@/lib/firebase";

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

  writeChoice: (choice: ChoicePayload) => Promise<void>;
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
    if (!auth) {
      console.warn('useBattleState: Firebase auth unavailable; skipping auth listener.');
      setAuthLoading(false);
      setError(prev => prev ?? 'Authentication service unavailable.');
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log('useBattleState: Auth state changed:', currentUser ? 'authenticated' : 'not authenticated');
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to meta and public state early; defer private until we confirm auth + membership
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

    const database = rtdb;
    if (!database) {
      console.warn('useBattleState: Realtime Database unavailable; cannot subscribe to battle.');
      setLoading(false);
      setError('Realtime battle service unavailable.');
      return;
    }
    
    console.log('useBattleState: Setting up listeners for battle:', battleId, 'user:', meUid);
    console.log('useBattleState: Auth state details:', {
      hasUser: !!user,
      uid: user?.uid,
      email: user?.email,
      isAnonymous: user?.isAnonymous,
      authLoading,
      meUid
    });
    
    setLoading(true);
    setError(null);

    const unsubs: Array<() => void> = [];
    
    // Add error handling for each listener
    unsubs.push(onValue(
      dbRef(database, `/battles/${battleId}/meta`), 
      s => {
        console.log('useBattleState: Meta data received:', s.val());
        setMeta(s.val() ?? null);
      }, 
      e => {
        console.error('useBattleState: Meta listener error:', e);
        console.error('useBattleState: Meta listener error details:', {
          code: (e as any).code,
          message: e.message,
          battleId,
          userUid: meUid,
          authState: {
            hasUser: !!user,
            uid: user?.uid,
            email: user?.email,
            isAnonymous: user?.isAnonymous
          }
        });
        setError(e.message);
      }
    ));
    
    unsubs.push(onValue(
      dbRef(database, `/battles/${battleId}/public`), 
      s => {
        console.log('useBattleState: Public data received:', s.val());
        setPub(s.val() ?? null);
      }, 
      e => {
        console.error('useBattleState: Public listener error:', e);
        setError(e.message);
      }
    ));
    
    // IMPORTANT: Do not subscribe to private path yet; it requires correct uid membership.
    
    unsubs.push(onValue(
      dbRef(database, "/.info/serverTimeOffset"), 
      s => setServerOffsetMs(s.val() ?? 0),
      e => console.error('useBattleState: Server offset error:', e)
    ));

    return () => { 
      console.log('useBattleState: Cleaning up listeners');
      unsubs.forEach(u => u()); 
    };
  }, [battleId, meUid, authLoading]);

  // Late-bind private subscription only after we know meta and user membership
  useEffect(() => {
    if (!battleId) return;
    if (authLoading) return;
    if (!meUid) return; // wait for auth
    if (!meta) return;  // wait for meta so we can verify membership

    const database = rtdb;
    if (!database) {
      console.warn('useBattleState: Realtime Database unavailable for private subscription.');
      return;
    }

    const isParticipant = meta.players?.p1?.uid === meUid || meta.players?.p2?.uid === meUid;
    if (!isParticipant) {
      console.warn('useBattleState: current user is not a participant of this battle; skipping private subscription');
      // Show a gentle message but do not throw hard error during warmup
      setError('You are not a participant in this battle.');
      return;
    }

    console.log('useBattleState: Subscribing to private state for user:', meUid);
    const unsub = onValue(
      dbRef(database, `/battles/${battleId}/private/${meUid}`),
      s => {
        console.log('useBattleState: Private data received:', s.val());
        setMe(s.val() ?? null);
        // Clear any prior permission error once we successfully subscribe
        setError(prev => (prev === 'You are not a participant in this battle.' ? null : prev));
      },
      e => {
        console.error('useBattleState: Private listener error:', e);
        setError(e.message);
      }
    );

    return () => unsub();
  }, [battleId, meUid, authLoading, meta]);

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
  const parseNumeric = (value: unknown): number | undefined => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
  };

  const normalizeMoveEntry = (entry: unknown) => {
    if (!entry) return null;

    if (typeof entry === 'string') {
      const id = entry.trim();
      if (!id) return null;
      return { id, pp: 20, maxPp: 20 };
    }

    if (typeof entry === 'object') {
      const moveObj = entry as { id?: string; name?: string; pp?: number | string; maxPp?: number | string; remainingPp?: number | string; disabled?: boolean; reason?: string };
      const id = (moveObj.id || moveObj.name || '').toString().trim();
      if (!id) return null;
      const maxPp = parseNumeric(moveObj.maxPp);
      const remaining = parseNumeric(moveObj.pp) ?? parseNumeric(moveObj.remainingPp) ?? maxPp ?? 20;
      return {
        id,
        pp: remaining,
        maxPp: maxPp ?? remaining ?? 20,
        disabled: moveObj.disabled,
        reason: moveObj.reason
      };
    }

    return null;
  };

  const legalMoves = useMemo(() => {
    if (!myPrivateActive) return [];
    let list = (myPrivateActive.moves ?? [])
      .map(normalizeMoveEntry)
      .filter((m): m is ReturnType<typeof normalizeMoveEntry> & { id: string; pp: number; maxPp: number } => Boolean(m));

    // Multiplayer fallback: If moves look uninitialized (e.g., all 'tackle' or empty),
    // try to hydrate from local current team so the UI shows correct moves without
    // altering server logic.
    const looksUninitialized = list.length === 0 || (list.length > 0 && list.every(m => (m.id || '').toLowerCase() === 'tackle'));
    if (looksUninitialized) {
      try {
        const raw = typeof window !== 'undefined' ? window.localStorage.getItem('pokemon-current-team') : null;
        if (raw) {
          const saved = JSON.parse(raw) as Array<{ id: number; moves?: Array<{ name: string }> }>;
          // Find matching by species id
          const getId = (name: string) => {
            try {
              // lazy import to avoid cycles
              // eslint-disable-next-line @typescript-eslint/no-var-requires
              const utils = require('@/lib/utils') as { getPokemonIdFromSpecies: (s?: string | null)=>number|null };
              return utils.getPokemonIdFromSpecies(name) || null;
            } catch { return null; }
          };
          const activeId = getId(myPrivateActive.species || '');
          const candidate = activeId ? saved.find(s => s.id === activeId) : saved[0];
          if (candidate?.moves?.length) {
            list = candidate.moves.slice(0, 4).map(normalizeMoveEntry).filter(Boolean) as typeof list;
          }
        }
        // Secondary fallback: first saved team in team-builder storage
        if ((!list || list.length === 0 || list.every(m => (m.id || '').toLowerCase() === 'tackle'))) {
          const savedTeamsRaw = typeof window !== 'undefined' ? window.localStorage.getItem('pokemon-team-builder') : null;
          if (savedTeamsRaw) {
            const teams = JSON.parse(savedTeamsRaw) as Array<{ slots: Array<{ id: number; moves?: Array<{ name: string }> }> }>;
            const activeId = (() => {
              try {
                const utils = require('@/lib/utils') as { getPokemonIdFromSpecies: (s?: string | null)=>number|null };
                return utils.getPokemonIdFromSpecies(myPrivateActive.species || '') || null;
              } catch { return null; }
            })();
            const firstTeam = teams?.[0];
            const slot = activeId && firstTeam ? firstTeam.slots.find(s => s.id === activeId) : undefined;
            if (slot?.moves?.length) {
              list = slot.moves.slice(0, 4).map(normalizeMoveEntry).filter(Boolean) as typeof list;
            }
          }
        }
      } catch {
        // ignore fallback errors silently
      }
    }
    const choiceLockMoveId = me?.choiceLock?.locked ? me?.choiceLock?.moveId : undefined;
    const disableMoveId = me?.disable?.moveId;
    const encoreMoveId = me?.encoreMoveId;
    const taunted = !!myPublicV.taunt;
    const recharging = !!myPublicV.recharge;

    return list.map(m => {
      let disabled = !!m.disabled;
      let reason = m.reason || "";
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
      const slot = team[i];
      if (!slot) continue;
      const hasHp = typeof slot.stats?.hp === 'number' ? slot.stats.hp > 0 : true;
      if (!slot.fainted && hasHp) res.push(i);
    }
    return res;
  }, [me?.team]);

  const writeChoice = useCallback(async (choice: ChoicePayload) => {
    if (!meUid || !meta) throw new Error("No auth or meta");
    if (!isChoosing(meta)) throw new Error("Not in choosing phase");

    // Enhanced permission check: Verify user is a participant in this battle
    const isParticipant = meta.players?.p1?.uid === meUid || meta.players?.p2?.uid === meUid;
    if (!isParticipant) {
      throw new Error("You are not a participant in this battle");
    }

    // Submit choice directly to RTDB so server can resolve the turn
    const { rtdbService } = await import('@/lib/firebase-rtdb-service');
    const cleanedPayload: any = {
      action: choice.action,
      payload: {
        moveId: choice.action === 'move' ? choice.payload.moveId : undefined,
        target: choice.action === 'move' ? choice.payload.target : undefined,
        switchToIndex: choice.action === 'switch' ? choice.payload.switchToIndex : undefined
      }
    };
    cleanedPayload.payload = Object.fromEntries(Object.entries(cleanedPayload.payload).filter(([, v]) => v !== undefined));
    await rtdbService.submitChoice(battleId, meta.turn, meUid, cleanedPayload);
  }, [battleId, meUid, meta]);

  // Expose writeChoice to global scope for E2E testing
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_E2E === 'true') {
      (window as any).writeChoice = writeChoice;
      console.log('🎮 Exposed writeChoice to global scope from useBattleState hook');
    }
    return () => {
      if (process.env.NEXT_PUBLIC_E2E === 'true') {
        delete (window as any).writeChoice;
      }
    };
  }, [writeChoice]);

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
    writeChoice,
    chooseMove,
    chooseSwitch,
    forfeit
  };
}
