import { isTrapped } from "@/lib/team-battle-held-items";
import { GRAVITY_BLOCKED_MOVES } from "@/lib/battle-move-constants";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { onValue, ref as dbRef } from "firebase/database";
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
  ruleProfile?: "simplified" | "cart_like";
  /** Turn paused for this player to pick a pivot replacement (U-turn, Baton Pass, ...). */
  pendingSwitch?: { uid: string; reason: "pivot" | "baton-pass" | "shed-tail" | "revival-blessing"; options?: number[] } | null;
  /** Players who must pick a replacement for a fainted active Pokémon before choosing moves. */
  pendingReplacement?: { uids: string[] } | null;
  /** Set while the server resolves a turn; a resolution older than ~60s is stale and recoverable. */
  resolvingStartedAt?: number | null;
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
  lastValidation?: {
    turn: number;
    p1?: string | null;
    p2?: string | null;
    normalized?: boolean;
  };
} & IdMap<{ active: PublicMon; benchPublic: Array<{ species: string; fainted: boolean; revealedMoves: string[] }> }>;

type Move = { id: string; pp: number };
type Pokemon = {
  species: string;
  level: number;
  types: string[];
  stats: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
  item?: string;
  ability?: string;
  moves: Move[];                 // exact PP here (private)
  status?: PublicMon["status"];
  fainted?: boolean;
  hp?: { cur: number; max: number };
  currentHp?: number;
  maxHp?: number;
  teraType?: string;
  terastallized?: boolean;
};

type PrivateState = {
  team: Pokemon[];
  currentIndex?: number;
  teraUsed?: boolean;
  choiceLock?: { moveId?: string; locked?: boolean };
  disable?: { moveId?: string; turnsLeft?: number };
  encoreMoveId?: string;
};

type ChoicePayload =
  | { action: "move"; payload: { moveId: string; target: "p1" | "p2"; terastallize?: boolean }; clientVersion: number }
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
  connectionStatus: "online" | "reconnecting" | "offline";

  timeLeftSec: number;

  legalMoves: Array<Move & { disabled?: boolean; reason?: string }>;
  legalSwitchIndexes: number[];

  writeChoice: (choice: ChoicePayload) => Promise<void>;
  chooseMove: (moveId: string, target?: "p1" | "p2", options?: { terastallize?: boolean }) => Promise<void>;
  chooseSwitch: (idx: number) => Promise<void>;
  forfeit: () => Promise<void>;
  /** Whether I can Terastallize this turn (UI hint; the server re-checks), and into what. */
  tera: { available: boolean; type: string | null };
  /** My choice for the current turn is stored (survives reloads): waiting for the opponent. */
  myChoiceSubmitted: boolean;
  /** When the connection last came back after a drop (null if it never dropped). */
  reconnectedAt: number | null;
  /** Ask the server to unstick the battle (deadline passed, stuck resolution). Throttled unless forced. */
  syncNow: (force?: boolean) => Promise<void>;
};

const SYNC_MIN_INTERVAL_MS = 10_000;
const WATCHDOG_INTERVAL_MS = 4_000;
const DEADLINE_GRACE_MS = 3_000;
const RESOLVING_STUCK_MS = 65_000;

function isChoosing(meta: Meta | null) {
  return !!meta && meta.phase === "choosing";
}

function activePrivate(me: PrivateState | null): Pokemon | null {
  if (!me?.team?.length) return null;
  // Use currentIndex if available, otherwise default to 0
  const activeIndex = typeof me.currentIndex === 'number' ? me.currentIndex : 0;
  return me.team[activeIndex] ?? me.team[0] ?? null;
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
  const [connectionStatus, setConnectionStatus] = useState<"online" | "reconnecting" | "offline">("online");

  const meUid = user?.uid ?? null;
  const oppUid = useMemo(() => {
    if (!meta || !meUid) return null;
    return meUid === meta.players.p1.uid ? meta.players.p2.uid : meta.players.p1.uid;
  }, [meta, meUid]);

  // Listen to authentication state changes
  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      setError(prev => prev ?? 'Authentication service unavailable.');
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to meta and public state early; defer private until we confirm auth + membership
  useEffect(() => {
    if (!battleId) return;
    if (authLoading) return;

    if (!meUid) {
      setError('User not authenticated');
      setMeta(null);
      setPub(null);
      setMe(null);
      setLoading(false);
      return;
    }

    const database = rtdb;
    if (!database) {
      setLoading(false);
      setError('Realtime battle service unavailable.');
      return;
    }
    
    setLoading(true);
    setError(null);

    const unsubs: Array<() => void> = [];
    
    // Add error handling for each listener
    unsubs.push(onValue(
      dbRef(database, `/battles/${battleId}/meta`), 
      s => {
        setMeta(s.val() ?? null);
      },
      e => {
        console.error('useBattleState: Meta listener error:', e);
        setError(e.message);
      }
    ));
    
    unsubs.push(onValue(
      dbRef(database, `/battles/${battleId}/public`), 
      s => {
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

    return () => { unsubs.forEach(u => u()); };
  }, [battleId, meUid, authLoading]);

  // Connection state from the Realtime Database itself (`.info/connected`), plus the browser's offline flag.
  // A drop followed by a reconnect bumps `reconnectedAt` so the UI can say it re-synced and the watchdog
  // below can ask the server to unstick the battle.
  const wasConnectedRef = useRef(false);
  const hasConnectedOnceRef = useRef(false);
  const [reconnectedAt, setReconnectedAt] = useState<number | null>(null);
  useEffect(() => {
    const database = rtdb;
    const browserOffline = () => typeof navigator !== "undefined" && !navigator.onLine;
    const onBrowserChange = () => {
      if (browserOffline()) setConnectionStatus("offline");
    };
    window.addEventListener("online", onBrowserChange);
    window.addEventListener("offline", onBrowserChange);
    let unsub: (() => void) | undefined;
    if (database) {
      unsub = onValue(dbRef(database, "/.info/connected"), (s) => {
        const connected = s.val() === true;
        if (connected) {
          if (wasConnectedRef.current === false && hasConnectedOnceRef.current) setReconnectedAt(Date.now());
          hasConnectedOnceRef.current = true;
          setConnectionStatus("online");
        } else {
          setConnectionStatus(browserOffline() ? "offline" : "reconnecting");
        }
        wasConnectedRef.current = connected;
      });
    }
    return () => {
      window.removeEventListener("online", onBrowserChange);
      window.removeEventListener("offline", onBrowserChange);
      unsub?.();
    };
  }, []);

  // My own stored choice for the current turn (readable only by me): after a reload or reconnect the UI
  // knows the move is in and shows "waiting for opponent" instead of asking again.
  const [myChoiceTurn, setMyChoiceTurn] = useState<number | null>(null);
  useEffect(() => {
    const database = rtdb;
    if (!database || !meUid || !meta || typeof meta.turn !== "number") return;
    const isParticipant = meta.players?.p1?.uid === meUid || meta.players?.p2?.uid === meUid;
    if (!isParticipant) return;
    const turn = meta.turn;
    const unsub = onValue(
      dbRef(database, `/battles/${battleId}/turns/${turn}/choices/${meUid}`),
      (s) => setMyChoiceTurn(s.exists() ? turn : null),
      () => setMyChoiceTurn(null),
    );
    return () => unsub();
    // Re-subscribe per turn and whenever the meta version changes (choices are cleared on soft fails)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battleId, meUid, meta?.turn, meta?.version]);
  const myChoiceSubmitted = !!meta && myChoiceTurn === meta.turn && meta.phase === "choosing";

  // Late-bind private subscription only after we know meta and user membership
  useEffect(() => {
    if (!battleId) return;
    if (authLoading) return;
    if (!meUid) return; // wait for auth
    if (!meta) return;  // wait for meta so we can verify membership

    const database = rtdb;
    if (!database) return;

    const isParticipant = meta.players?.p1?.uid === meUid || meta.players?.p2?.uid === meUid;
    if (!isParticipant) {
      setError('You are not a participant in this battle.');
      return;
    }

    const unsub = onValue(
      dbRef(database, `/battles/${battleId}/private/${meUid}`),
      s => {
        setMe(s.val() ?? null);
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
    } else if (error) {
      setLoading(false);
    } else if (meta && pub) {
      setLoading(false);
    }
  }, [meta, pub, authLoading, error]);

  const timeLeftSec = useMemo(() => {
    if (!meta || meta.phase !== "choosing" || !meta.deadlineAt) return 0;
    const now = Date.now() + serverOffsetMs;
    const assumedDeadline = typeof meta.deadlineAt === "number" ? meta.deadlineAt : Date.now();
    return Math.max(0, Math.ceil((assumedDeadline - now) / 1000));
  }, [meta, serverOffsetMs]);

  // Determine which side (p1/p2) the current user is on.
  const mySide = useMemo(() => {
    if (!meta || !meUid) return null;
    return meta.players.p1.uid === meUid ? 'p1' : meta.players.p2.uid === meUid ? 'p2' : null;
  }, [meta, meUid]);

  // Pull public volatiles for my active (for UI) and private secrets (for exact legality).
  const myPublicActive = useMemo(() => (mySide && pub ? (pub as any)[mySide]?.active ?? null : null), [pub, mySide]);
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
    // Mid-turn pivot pick (U-turn, Baton Pass, ...): only a switch is legal, and only for that player
    if (meta?.pendingSwitch || meta?.pendingReplacement?.uids?.length) return [];
    let list = (myPrivateActive.moves ?? [])
      .map(normalizeMoveEntry)
      .filter((m): m is ReturnType<typeof normalizeMoveEntry> & { id: string; pp: number; maxPp: number } => Boolean(m));

    const choiceLockMoveId = me?.choiceLock?.locked ? me?.choiceLock?.moveId : undefined;
    const disableMoveId = me?.disable?.moveId;
    const encoreMoveId = me?.encoreMoveId;
    const taunted = !!myPublicV.taunt;
    const gravityActive = !!(pub as { field?: { rooms?: { gravity?: unknown } } } | null)?.field?.rooms?.gravity;
    const recharging = !!myPublicV.recharge;

    const profile = meta?.ruleProfile ?? 'simplified';
    const encSlot = encoreMoveId ? list.find((m) => m.id === encoreMoveId) : undefined;
    const encoreForcesStruggle =
      profile === 'simplified' &&
      Boolean(encoreMoveId && encSlot && (parseNumeric(encSlot.pp) ?? 0) <= 0);
    const allNoPp = list.length > 0 && list.every((m) => (parseNumeric(m.pp) ?? 0) <= 0);
    if (allNoPp || encoreForcesStruggle) {
      return [{ id: "struggle", pp: 1, maxPp: 1, disabled: false, reason: undefined }];
    }

    const mapped = list.map(m => {
      let disabled = !!m.disabled;
      let reason = m.reason || "";
      if (m.pp <= 0) { disabled = true; reason = "No PP"; }
      if (!disabled && recharging) { disabled = true; reason = "Recharge"; }
      if (!disabled && choiceLockMoveId && m.id !== choiceLockMoveId) { disabled = true; reason = "Choice-lock"; }
      if (!disabled && encoreMoveId && m.id !== encoreMoveId) { disabled = true; reason = "Encore"; }
      if (!disabled && disableMoveId && m.id === disableMoveId) { disabled = true; reason = "Disabled"; }
      if (!disabled && gravityActive && GRAVITY_BLOCKED_MOVES.has(m.id)) { disabled = true; reason = "Gravity"; }
      if (!disabled && taunted) {
        // optional: you can tag moves with meta; here we do a simple heuristic
        const looksStatus = /protect|substitute|swords-dance|toxic|roost|recover|will-o-wisp|calm-mind|nasty-plot|spikes|stealth-rock|taunt|defog/i.test(m.id);
        if (looksStatus) { disabled = true; reason = "Taunt"; }
      }
      return { ...m, disabled, reason: disabled ? reason : undefined };
    });

    return mapped;
  }, [myPrivateActive, me?.choiceLock, me?.disable, me?.encoreMoveId, myPublicV.taunt, myPublicV.recharge, meta?.ruleProfile, meta?.pendingSwitch, meta?.pendingReplacement, pub]);

  const legalSwitchIndexes = useMemo(() => {
    if (meta?.pendingSwitch && meta.pendingSwitch.uid !== meUid) return [];
    // My pick: the server's options decide (Revival Blessing offers fainted Pokémon)
    if (meta?.pendingSwitch?.options) return meta.pendingSwitch.options;
    if (meta?.pendingReplacement?.uids?.length && (!meUid || !meta.pendingReplacement.uids.includes(meUid))) return [];
    const team = me?.team ?? [];
    // Bound by a binding move (the server rejects the switch too); faint replacements are always allowed
    const activeSlot = team[typeof me?.currentIndex === 'number' ? me.currentIndex : 0] as unknown as Parameters<typeof isTrapped>[0] | undefined;
    if (!meta?.pendingReplacement && activeSlot?.volatile && activeSlot.pokemon && isTrapped(activeSlot)) return [];
    const currentIndex = typeof me?.currentIndex === 'number' ? me.currentIndex : 0;
    const res: number[] = [];
    for (let i = 0; i < team.length; i++) {
      if (i === currentIndex) continue;
      const slot = team[i];
      if (!slot) continue;
      const currentHp =
        typeof slot.hp?.cur === 'number'
          ? slot.hp.cur
          : typeof (slot as { currentHp?: number }).currentHp === 'number'
            ? (slot as { currentHp: number }).currentHp
            : undefined;
      const fainted = Boolean(slot.fainted) || (typeof currentHp === 'number' && currentHp <= 0);
      if (!fainted) res.push(i);
    }
    return res;
  }, [me?.team, me?.currentIndex, meta?.pendingSwitch, meta?.pendingReplacement, meUid]);

  const getIdTokenHeader = useCallback(async (): Promise<string> => {
    if (auth?.currentUser) {
      const token = await auth.currentUser.getIdToken();
      return `Bearer ${token}`;
    }
    return '';
  }, []);

  const writeChoice = useCallback(async (choice: ChoicePayload) => {
    if (!meUid || !meta) throw new Error("No auth or meta");
    if (choice.action !== 'forfeit' && !isChoosing(meta)) throw new Error("Not in choosing phase");

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const tokenHeader = await getIdTokenHeader();
    if (!tokenHeader) {
      throw new Error('User not authenticated');
    }
    headers.Authorization = tokenHeader;

    const response = await fetch(`/api/battles/${battleId}/submit`, {
      method: 'POST',
      headers,
      body: JSON.stringify(
        choice.action === 'move'
          ? {
              action: 'move',
              moveId: choice.payload.moveId,
              target: choice.payload.target,
              clientVersion: choice.clientVersion,
              ...(choice.payload.terastallize ? { terastallize: true } : {}),
            }
          : choice.action === 'forfeit'
            ? { action: 'forfeit', clientVersion: choice.clientVersion }
            : { action: 'switch', switchToIndex: choice.payload.switchToIndex, clientVersion: choice.clientVersion }
      ),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to submit move';
      try {
        const errorData = await response.json();
        errorMessage = errorData?.error || errorMessage;
      } catch (e) {
        // If JSON parse fails, try to get text
        const text = await response.text().catch(() => '');
        console.error('API Error (Non-JSON):', text);
        // Extract error from Next.js error page if possible (simple regex)
        const match = text.match(/<pre>(.*?)<\/pre>/s);
        if (match && match[1]) {
             errorMessage = `Server Error: ${match[1].substring(0, 200)}...`;
        } else {
             errorMessage = `Server Error (${response.status}): Check console for details`;
        }
      }
      throw new Error(errorMessage);
    }
  }, [battleId, meUid, meta]);

  const tera = useMemo(() => {
    const active = myPrivateActive;
    const type = active?.teraType ?? null;
    const available = !!type && !me?.teraUsed && !active?.terastallized && !meta?.pendingSwitch && !meta?.pendingReplacement?.uids?.length;
    return { available, type };
  }, [myPrivateActive, me?.teraUsed, meta?.pendingSwitch, meta?.pendingReplacement]);

  const chooseMove = useCallback(async (moveId: string, target: "p1" | "p2" = "p2", options?: { terastallize?: boolean }) => {
    if (!meta) throw new Error("No meta");
    const terastallize = !!options?.terastallize && tera.available;
    await writeChoice({
      action: "move",
      payload: { moveId, target, ...(terastallize ? { terastallize: true } : {}) },
      clientVersion: meta.version,
    });
  }, [writeChoice, meta, tera.available]);

  const chooseSwitch = useCallback(async (idx: number) => {
    if (!meta) throw new Error("No meta");
    if (!legalSwitchIndexes.includes(idx)) throw new Error("Illegal switch");
    await writeChoice({ action: "switch", payload: { switchToIndex: idx }, clientVersion: meta.version });
  }, [writeChoice, meta, legalSwitchIndexes]);

  const forfeit = useCallback(async () => {
    if (!meta) throw new Error("No meta");
    await writeChoice({ action: "forfeit", payload: {}, clientVersion: meta.version });
  }, [writeChoice, meta]);

  // Watchdog: ask the server to unstick the battle when the deadline has passed, a resolution looks
  // stuck, after a reconnect, or when the tab becomes visible again. Throttled; the server is idempotent.
  const lastSyncAtRef = useRef(0);
  const syncNow = useCallback(async (force = false) => {
    if (!meUid || !battleId) return;
    const now = Date.now();
    if (!force && now - lastSyncAtRef.current < SYNC_MIN_INTERVAL_MS) return;
    lastSyncAtRef.current = now;
    try {
      const tokenHeader = await getIdTokenHeader();
      if (!tokenHeader) return;
      await fetch(`/api/battles/${battleId}/sync`, { method: 'POST', headers: { Authorization: tokenHeader } });
    } catch (err) {
      console.warn('useBattleState: sync failed', err);
    }
  }, [battleId, meUid, getIdTokenHeader]);

  const metaRef = useRef(meta);
  metaRef.current = meta;
  useEffect(() => {
    if (!meUid || !battleId) return;
    const tick = () => {
      const m = metaRef.current;
      if (!m || m.phase === 'ended') return;
      const now = Date.now() + serverOffsetMs;
      const pastDeadline = m.phase === 'choosing' && typeof m.deadlineAt === 'number' && now > m.deadlineAt + DEADLINE_GRACE_MS;
      const stuckResolving = m.phase === 'resolving' && (typeof m.resolvingStartedAt !== 'number' || now - m.resolvingStartedAt > RESOLVING_STUCK_MS);
      if (pastDeadline || stuckResolving) void syncNow();
    };
    const id = window.setInterval(tick, WATCHDOG_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void syncNow();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [battleId, meUid, serverOffsetMs, syncNow]);

  useEffect(() => {
    if (reconnectedAt) void syncNow(true);
  }, [reconnectedAt, syncNow]);

  return {
    loading, error, meta, pub, me, meUid, oppUid,
    connectionStatus,
    timeLeftSec,
    legalMoves,
    legalSwitchIndexes,
    writeChoice,
    chooseMove,
    chooseSwitch,
    forfeit,
    tera,
    myChoiceSubmitted,
    reconnectedAt,
    syncNow,
  };
}
