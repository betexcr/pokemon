import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { createHash } from "crypto";
import { v4 as uuidv4 } from "uuid";

admin.initializeApp();
const db = admin.database();

/** ---------- Types (trimmed) ---------- */
type Move = { id: string; pp: number };
type Pokemon = {
  species: string;
  level: number;
  types: string[];
  stats: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
  item?: string;
  ability?: string;
  moves: Move[];
  status?: "PAR" | "PSN" | "BRN" | "SLP" | "FRZ" | null;
  fainted?: boolean;
};
type Team = Pokemon[];

const TURN_MS = 45_000;

/** ------------------- House Rules ------------------- */
const HOUSE_RULES = { infiltratorBypassesSafeguard: false };

/** ------------------- Move DB (PokéAPI integration) ------------------- */
type MoveData = {
  id: string;
  name: string;
  type: keyof typeof TYPE_CHART;
  category: "physical" | "special" | "status";
  power?: number;
  accuracy?: number | null;  // 0..1, null = always hits
  priority?: number;
  highCrit?: boolean;
  recharge?: boolean;
  recoilFrac?: number;       // 0.25 for Head Smash style
  drainFrac?: number;        // 0.5 for Giga Drain
  missRecoilFrac?: number;   // e.g., Hi Jump Kick 0.5 of max HP
  statusChance?: number;     // 0..1
  inflict?: Pokemon["status"];
  pp?: number;
  description?: string;
  specialEffect?: string;    // For advanced battle mechanics
  hits?: number | "2-5";     // multi-hit support
  bypassProtect?: boolean;   // Feint-like behavior
  createsSub?: boolean;      // For substitute
  isSound?: boolean;         // hits through Substitute
  makesContact?: boolean;    // triggers Rough Skin / Rocky Helmet
};

// Cache for move data to avoid repeated API calls
const moveCache = new Map<string, MoveData>();

/** Fetch move data from PokéAPI */
async function fetchMoveData(moveId: string): Promise<MoveData | null> {
  // Check cache first
  if (moveCache.has(moveId)) {
    return moveCache.get(moveId)!;
  }

  try {
    const response = await fetch(`https://pokeapi.co/api/v2/move/${moveId}`);
    if (!response.ok) {
      console.warn(`Failed to fetch move ${moveId}: ${response.status}`);
      return null;
    }

    const data = await response.json() as any;
    
    // Convert PokéAPI data to our format
    const moveData: MoveData = {
      id: data.name,
      name: data.names?.find((n: any) => n.language.name === 'en')?.name || data.name,
      type: data.type.name.charAt(0).toUpperCase() + data.type.name.slice(1),
      category: data.damage_class.name === 'physical' ? 'physical' : 
                data.damage_class.name === 'special' ? 'special' : 'status',
      power: data.power || undefined,
      accuracy: data.accuracy ? data.accuracy / 100 : null,
      priority: data.priority || 0,
      pp: data.pp,
      description: data.flavor_text_entries?.find((f: any) => f.language.name === 'en')?.flavor_text || ''
    };

    // Add special move effects based on move name/ID
    addSpecialMoveEffects(moveData);

    // Cache the result
    moveCache.set(moveId, moveData);
    return moveData;
  } catch (error) {
    console.error(`Error fetching move ${moveId}:`, error);
    return null;
  }
}

/** Add special move effects based on known move patterns */
function addSpecialMoveEffects(move: MoveData) {
  const id = move.id.toLowerCase();
  
  // High crit moves
  if (['slash', 'razor-leaf', 'karate-chop', 'crabhammer', 'cross-chop'].includes(id)) {
    move.highCrit = true;
  }
  
  // Recharge moves
  if (['hyper-beam', 'giga-impact', 'blast-burn', 'hydro-cannon', 'frenzy-plant'].includes(id)) {
    move.recharge = true;
  }
  
  // Recoil moves
  if (id.includes('head-smash')) move.recoilFrac = 0.5;
  else if (id.includes('double-edge') || id.includes('brave-bird')) move.recoilFrac = 0.33;
  else if (id.includes('take-down') || id.includes('volt-tackle')) move.recoilFrac = 0.25;
  
  // Drain moves
  if (id.includes('drain') || id.includes('leech')) move.drainFrac = 0.5;
  else if (id.includes('mega-drain')) move.drainFrac = 0.5;
  
  // Miss recoil moves
  if (id.includes('jump-kick') || id.includes('high-jump-kick')) move.missRecoilFrac = 0.5;
  
  // Status moves with specific effects
  if (id === 'toxic') {
    move.inflict = 'PSN';
    move.statusChance = 1.0;
  } else if (id === 'will-o-wisp') {
    move.inflict = 'BRN';
    move.statusChance = 1.0;
  } else if (id === 'thunder-wave') {
    move.inflict = 'PAR';
    move.statusChance = 1.0;
  } else if (id === 'sleep-powder' || id === 'hypnosis') {
    move.inflict = 'SLP';
    move.statusChance = 1.0;
  } else if (id === 'ice-beam' || id === 'blizzard') {
    move.inflict = 'FRZ';
    move.statusChance = 0.1;
  } else if (id === 'thunderbolt' || id === 'thunder') {
    move.inflict = 'PAR';
    move.statusChance = 0.1;
  } else if (id === 'flamethrower' || id === 'fire-blast') {
    move.inflict = 'BRN';
    move.statusChance = 0.1;
  }
  
  // Advanced battle mechanics moves
  if (id === 'reflect') {
    move.specialEffect = 'set-reflect';
  } else if (id === 'light-screen') {
    move.specialEffect = 'set-light-screen';
  } else if (id === 'stealth-rock') {
    move.specialEffect = 'set-stealth-rock';
  } else if (id === 'spikes') {
    move.specialEffect = 'set-spikes';
  } else if (id === 'toxic-spikes') {
    move.specialEffect = 'set-toxic-spikes';
  } else if (id === 'sticky-web') {
    move.specialEffect = 'set-sticky-web';
  } else if (id === 'taunt') {
    move.specialEffect = 'taunt';
  } else if (id === 'encore') {
    move.specialEffect = 'encore';
  } else if (id === 'disable') {
    move.specialEffect = 'disable';
  } else if (id === 'pursuit') {
    move.specialEffect = 'pursuit';
  } else if (id === 'feint') {
    move.bypassProtect = true;
  } else if (id === 'bullet-seed' || id === 'rock-blast') {
    move.hits = '2-5';
  } else if (id === 'struggle') {
    move.accuracy = null; // always hits
    move.recoilFrac = 0; // special recoil handling
  } else if (id === 'substitute') {
    move.createsSub = true;
  } else if (id === 'tackle' || id === 'quick-attack' || id === 'slash' || id === 'feint' || id === 'hi-jump-kick') {
    move.makesContact = true;
  } else if (id === 'hyper-voice' || id === 'bug-buzz') {
    move.isSound = true;
  } else if (id === 'rock-blast' || id === 'bullet-seed') {
    move.makesContact = false; // Projectile moves don't make contact
  } else if (id === 'safeguard') {
    move.specialEffect = 'safeguard';
  } else if (id === 'mist') {
    move.specialEffect = 'mist';
  } else if (id === 'knock-off') {
    move.makesContact = true;
  } else if (id === 'perish-song') {
    move.isSound = true;
  } else if (id === 'leer' || id === 'screech' || id === 'tail-whip' || id === 'growl') {
    move.specialEffect = 'stat-drop';
  }
}

/** Get move data (with caching) */
async function getMoveData(moveId: string): Promise<MoveData | null> {
  return await fetchMoveData(moveId);
}

/** ------------------- Multi-hit & Struggle utilities ------------------- */
function rollMultiHitCount(ctx: BattleCtx): number {
  // Gen-like distribution: 2:3/8, 3:3/8, 4:1/8, 5:1/8
  const r = nextRand(ctx.rng).float;
  if (r < 3/8) return 2;
  if (r < 6/8) return 3;
  if (r < 7/8) return 4;
  return 5;
}

async function hasAnyUsableMove(side: SideState, ctx: BattleCtx): Promise<boolean> {
  const active = side.team[0];
  if (!active?.moves?.length) return false;
  for (const m of active.moves) {
    if (await hasUsableMove(side, m.id, ctx)) return true;
  }
  return false;
}

function coerceIllegalToStruggle(ctx: BattleCtx, act: Action): Action {
  if (act.kind !== "move") return act;
  // We'll check legality in the resolver, but if no moves are usable, force Struggle
  return act;
}

function hasHealthyBench(side: SideState): boolean {
  const t = side.team;
  for (let i=0; i<t.length; i++) {
    if (!t[i].fainted && t[i].stats.hp > 0) return true;
  }
  return false;
}

function isSafeguarded(ctx: BattleCtx, uid: string): boolean {
  const sg = ctx.pub.field?.safeguard?.[uid] || 0;
  return sg > 0;
}

// Use this for *status application* gates (knows attacker ability + house rule)
function statusBlockedBySafeguard(ctx: BattleCtx, attacker: SideState, defenderUid: string): boolean {
  if (!isSafeguarded(ctx, defenderUid)) return false;
  const aAbility = (attacker.team[0]?.ability || "").toLowerCase();
  if (HOUSE_RULES.infiltratorBypassesSafeguard && aAbility === "infiltrator") return false; // house-rule
  return true;
}

/** ------------------- Stat System ------------------- */
type StatKey = "atk" | "def" | "spa" | "spd" | "spe";
// Clamp −6..+6
function clampStage(n: number) { return Math.max(-6, Math.min(6, n)); }

function ensureBoosts(ctx: BattleCtx, uid: string) {
  const p = ctx.pub[uid];
  if (!p.active.boosts) p.active.boosts = { atk:0, def:0, spa:0, spd:0, spe:0 };
  return p.active.boosts as Record<StatKey, number>;
}

function raiseStat(ctx: BattleCtx, uid: string, stat: StatKey, stages: number) {
  const b = ensureBoosts(ctx, uid);
  b[stat] = clampStage((b[stat] || 0) + Math.abs(stages));
  ctx.logs.push(`${uid === ctx.a.uid ? "P1" : "P2"}'s ${stat.toUpperCase()} rose${stages>=2?" sharply":""}!`);
  return true;
}

function isMisted(ctx: BattleCtx, uid: string) {
  return (ctx.pub.field?.mist?.[uid] || 0) > 0;
}

// Drop blockers on target
function blocksDrop(uidSide: SideState, stat: StatKey): {blocked:boolean, reason?:string} {
  const ab = (uidSide.team[0]?.ability || "").toLowerCase();
  if (["clear body","white smoke","full metal body"].includes(ab)) return { blocked:true, reason: "It doesn't go any lower!" };
  if (stat === "atk" && ab === "hyper cutter") return { blocked:true, reason: "Attack won't go lower!" };
  return { blocked:false };
}

// Lower with Mist + blockers + Defiant/Competitive trigger
function lowerStatWithMist(ctx: BattleCtx, targetUid: string, stat: StatKey, stages: number, attacker?: SideState): boolean {
  const target = (targetUid === ctx.a.uid) ? ctx.a : ctx.b;

  if (isMisted(ctx, targetUid)) {
    ctx.logs.push(`Mist protected ${targetUid === ctx.a.uid ? "P1" : "P2"} from stat drop!`);
    return false;
  }
  const bl = blocksDrop(target, stat);
  if (bl.blocked) { ctx.logs.push(bl.reason || `The stat drop was prevented!`); return false; }

  const boosts = ensureBoosts(ctx, targetUid);
  const before = boosts[stat] || 0;
  boosts[stat] = clampStage(before - Math.abs(stages));
  ctx.logs.push(`${targetUid === ctx.a.uid ? "P1" : "P2"}'s ${stat.toUpperCase()} fell${stages>=2?" harshly":""}!`);

  // **Defiant/Competitive**: trigger only if a drop actually happened and it was caused by opponent
  if (attacker) triggerDefiantCompetitive(ctx, targetUid);

  return true;
}

function triggerDefiantCompetitive(ctx: BattleCtx, targetUid: string) {
  const side = (targetUid === ctx.a.uid) ? ctx.a : ctx.b;
  const ab = (side.team[0]?.ability || "").toLowerCase();
  if (ab === "defiant") {
    raiseStat(ctx, targetUid, "atk", 2);
  } else if (ab === "competitive") {
    raiseStat(ctx, targetUid, "spa", 2);
  }
}

// Convenience
function getAbility(side: SideState) { return (side.team[0]?.ability || "").toLowerCase(); }

/** ------------------- Type chart (compact) ------------------- */
const TYPE_CHART: Record<string, Record<string, number>> = {
  Normal:   { Rock:0.5, Ghost:0, Steel:0.5 },
  Fire:     { Fire:0.5, Water:0.5, Grass:2, Ice:2, Bug:2, Rock:0.5, Dragon:0.5, Steel:2 },
  Water:    { Fire:2, Water:0.5, Grass:0.5, Ground:2, Rock:2, Dragon:0.5 },
  Electric: { Water:2, Electric:0.5, Grass:0.5, Ground:0, Flying:2, Dragon:0.5 },
  Grass:    { Fire:0.5, Water:2, Grass:0.5, Poison:0.5, Ground:2, Flying:0.5, Bug:0.5, Rock:2, Dragon:0.5, Steel:0.5 },
  Ice:      { Fire:0.5, Water:0.5, Grass:2, Ice:0.5, Ground:2, Flying:2, Dragon:2, Steel:0.5 },
  Fighting: { Normal:2, Ice:2, Rock:2, Dark:2, Steel:2, Poison:0.5, Flying:0.5, Psychic:0.5, Bug:0.5, Ghost:0, Fairy:0.5 },
  Poison:   { Grass:2, Poison:0.5, Ground:0.5, Rock:0.5, Ghost:0.5, Steel:0, Fairy:2 },
  Ground:   { Fire:2, Electric:2, Grass:0.5, Poison:2, Flying:0, Bug:0.5, Rock:2, Steel:2 },
  Flying:   { Electric:0.5, Grass:2, Fighting:2, Bug:2, Rock:0.5, Steel:0.5 },
  Psychic:  { Fighting:2, Poison:2, Psychic:0.5, Steel:0.5, Dark:0 },
  Bug:      { Fire:0.5, Grass:2, Fighting:0.5, Poison:0.5, Flying:0.5, Psychic:2, Ghost:0.5, Dark:2, Steel:0.5, Fairy:0.5 },
  Rock:     { Fire:2, Ice:2, Fighting:0.5, Ground:0.5, Flying:2, Bug:2, Steel:0.5 },
  Ghost:    { Normal:0, Psychic:2, Ghost:2, Dark:0.5 },
  Dragon:   { Dragon:2, Steel:0.5, Fairy:0 },
  Dark:     { Fighting:0.5, Psychic:2, Ghost:2, Dark:0.5, Fairy:0.5 },
  Steel:    { Fire:0.5, Water:0.5, Electric:0.5, Ice:2, Rock:2, Fairy:2, Steel:0.5 },
  Fairy:    { Fire:0.5, Fighting:2, Poison:0.5, Dragon:2, Dark:2, Steel:0.5 }
};

function typeEffect(attacking: keyof typeof TYPE_CHART, defending: string[]) {
  let mult = 1;
  for (const t of defending) {
    const row = TYPE_CHART[attacking] || {};
    mult *= (row[t] ?? 1);
  }
  return mult;
}

/** ---------- Helpers ---------- */
function maskPublicView(p: Pokemon) {
  return {
    species: p.species,
    level: p.level,
    types: p.types,
    hp: { cur: p.stats.hp, max: p.stats.hp },
    status: null as Pokemon["status"],
    boosts: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 },
    volatiles: {}
  };
}
function validateTeam(team: any): asserts team is Team {
  if (!Array.isArray(team) || team.length < 1 || team.length > 6) {
    throw new functions.https.HttpsError("invalid-argument", "Team must have 1–6 Pokémon.");
  }
  for (const mon of team) {
    if (typeof mon?.species !== "string" || !Array.isArray(mon?.moves)) {
      throw new functions.https.HttpsError("invalid-argument", "Invalid Pokémon entry.");
    }
  }
}

/** RNG: deterministic per battle (xorshift32) */
function xorshift32(x: number) {
  x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  return x >>> 0;
}
function nextRand(rng: { seed: number; cursor: number }) {
  const v = xorshift32(rng.seed ^ rng.cursor);
  rng.cursor++;
  return { u32: v, float: (v % 0xFFFF) / 0xFFFF };
}

/** Stable stringify for hashing (order keys) */
function stableStringify(obj: any): string {
  const allKeys = new Set<string>();
  JSON.stringify(obj, (k, v) => { allKeys.add(k); return v; });
  return JSON.stringify(obj, Array.from(allKeys).sort());
}

/** Redact private state for hash (keep PP & locks; no unrevealed move names if you prefer) */
function redactPrivate(priv: any) {
  if (!priv) return null;
  const out: any = {};
  for (const uid of Object.keys(priv)) {
    const p = priv[uid];
    out[uid] = {
      team: (p.team ?? []).map((mon: Pokemon) => ({
        species: mon.species,
        moves: (mon.moves ?? []).map(m => ({ id: m.id, pp: m.pp }))
      })),
      choiceLock: p.choiceLock ?? null,
      disable: p.disable ?? null,
      encoreMoveId: p.encoreMoveId ?? null
    };
  }
  return out;
}
function hashState(pub: any, privA: any, privB: any) {
  const h = createHash("sha256");
  h.update(stableStringify(pub));
  h.update(stableStringify({ a: privA, b: privB }));
  return "sha256:" + h.digest("hex");
}

/** ------------------- Core battle types ------------------- */
type SideKey = "A" | "B";
type Action =
  | { kind: "switch"; user: SideKey; toIndex: number }
  | { kind: "move"; user: SideKey; moveId: string; target: "p1" | "p2" }
  | { kind: "pursuitInterrupt"; user: SideKey };

type SideState = {
  uid: string;
  // public
  active: { species: string; hp: number; maxHp: number; status: Pokemon["status"] | null };
  pubVolatiles: any; // { recharge?: boolean, taunt?: {turnsLeft}, encore?: {turnsLeft}, protectUsedLastTurn?: boolean, subHp?: number }
  publicVolatilesChanged: boolean;

  // private
  priv: any; // entire /private subtree we loaded and will rewrite (team[].moves[].pp etc.)
  team: Pokemon[];
};

type BattleCtx = {
  bid: string;
  turn: number;
  meta: any;
  pub: any;
  p1: string; p2: string;
  a: SideState; b: SideState;
  rng: { seed: number; cursor: number };
  logs: string[];
  lastResultSummary?: string;
};

/** ------------------- Builders ------------------- */
function buildSideState(uid: string, pub: any, priv: any): SideState {
  const p = pub[uid];
  const act = p.active;
  const team: Pokemon[] = (priv?.team ?? []);
  return {
    uid,
    active: { species: act.species, hp: act.hp.cur, maxHp: act.hp.max, status: act.status ?? null },
    pubVolatiles: { ...(act.volatiles ?? {}) },
    publicVolatilesChanged: false,
    priv: priv ?? { team: [], choiceLock: {}, disable: null, encoreMoveId: null },
    team
  };
}

/** ------------------- Action building & ordering ------------------- */
function normalizeChoice(ch: any, user: SideKey): Action {
  if (ch.action === "switch") return { kind: "switch", user, toIndex: ch.payload?.switchToIndex ?? 1 };
  return { kind: "move", user, moveId: String(ch.payload?.moveId || ""), target: ch.payload?.target === "p1" ? "p1" : "p2" };
}

function stageMultiplier(stage: number) {
  // Gen-like stage multipliers for simplicity: -6..+6
  if (stage >= 0) return (2 + stage) / 2;        // 0:1.0, +1:1.5, etc.
  return 2 / (2 - stage);                         // -1:2/3 ≈ 0.667, -2:0.5, etc.
}

function effectiveSpeed(mon: Pokemon, status: Pokemon["status"], pubVolatiles?: any) {
  let sp = mon.stats.spe;
  if (status === "PAR") sp = Math.floor(sp * 0.5);
  // Sticky Web: we model as public speedStage -1 on entry if grounded
  const sStage = pubVolatiles?.speedStage ?? 0;
  sp = Math.max(1, Math.floor(sp * stageMultiplier(sStage)));
  return sp;
}

async function orderActions(ctx: BattleCtx, a: Action, b: Action): Promise<Action[]> {
  // Coerce illegal moves to Struggle
  const a2 = coerceIllegalToStruggle(ctx, a);
  const b2 = coerceIllegalToStruggle(ctx, b);
  const acts = [a2, b2];

  // 1) Build pursuit interrupts
  const interrupts: Action[] = [];
  const isSwitchA = a2.kind === "switch";
  const isSwitchB = b2.kind === "switch";
  if (isSwitchA && b2.kind === "move" && (b2 as any).moveId === "pursuit") {
    interrupts.push({ kind: "pursuitInterrupt", user: "B" });
  }
  if (isSwitchB && a2.kind === "move" && (a2 as any).moveId === "pursuit") {
    interrupts.push({ kind: "pursuitInterrupt", user: "A" });
  }

  // 2) Separate switches and moves (moves will be sorted)
  const switches: Action[] = acts.filter(x => x.kind === "switch");
  const moves: Action[] = acts.filter(x => x.kind === "move");

  // 3) Sort moves by priority → speed (tie: random)
  if (moves.length === 2) {
    const [m1, m2] = moves as [any, any];
    const pr1 = await getPriority(ctx, m1.user, m1.moveId);
    const pr2 = await getPriority(ctx, m2.user, m2.moveId);
    if (pr1 !== pr2) moves.sort((x:any,y:any)=>pr2-pr1);
    else {
      const monA = (ctx.a.team[0] ?? null);
      const monB = (ctx.b.team[0] ?? null);
      const spA = effectiveSpeed(monA!, ctx.a.active.status, ctx.a.pubVolatiles);
      const spB = effectiveSpeed(monB!, ctx.b.active.status, ctx.b.pubVolatiles);
      if (spA !== spB) moves.sort((x:any,y:any)=> (y.user==="A"?spA:spB) - (x.user==="A"?spA:spB));
      else {
        if (nextRand(ctx.rng).float < 0.5) moves.reverse();
      }
    }
  }

  // 4) Final queue: interrupts → switches → moves
  return [...interrupts, ...switches, ...moves];
}

async function getPriority(ctx: BattleCtx, user: SideKey, moveId: string): Promise<number> {
  const data = await getMoveData(moveId);
  return data?.priority ?? 0;
}

/** ------------------- Hazard helpers ------------------- */
function isFlyingOrLevitating(mon: Pokemon): boolean {
  // Minimal: treat Flying type as not grounded (no abilities/items modeled here)
  return (mon.types || []).includes("Flying");
}

function applyEntryHazards(ctx: BattleCtx, side: SideState, opp: SideState) {
  const hz = ctx.pub.field?.hazards?.[side.uid] || { sr:false, spikes:0, tSpikes:0, web:false };
  const mon = side.team[0];

  // Stealth Rock: damage scales with Rock effectiveness vs defender's types
  if (hz.sr) {
    const eff = typeEffect("Rock", mon.types || ["Normal"]);
    const frac = eff * (1/8); // 12.5% × effectiveness
    const dmg = Math.max(1, Math.floor(side.active.maxHp * frac));
    side.active.hp = Math.max(0, side.active.hp - dmg);
    ctx.logs.push(`${sideLabel(side, ctx)} is hurt by Stealth Rock!`);
  }

  const grounded = !isFlyingOrLevitating(mon);
  if (grounded) {
    // Spikes: 1 layer 1/8, 2 layers 1/6, 3 layers 1/4
    if (hz.spikes && hz.spikes > 0) {
      const table = {1: 1/8, 2: 1/6, 3: 1/4} as any;
      const frac = table[Math.min(3, hz.spikes)] || 0;
      const dmg = Math.max(1, Math.floor(side.active.maxHp * frac));
      side.active.hp = Math.max(0, side.active.hp - dmg);
      ctx.logs.push(`${sideLabel(side, ctx)} is hurt by Spikes!`);
    }

    // Toxic Spikes
    if (hz.tSpikes && hz.tSpikes > 0 && side.active.hp > 0) {
      const isPoison = (mon.types || []).includes("Poison");
      const isSteel  = (mon.types || []).includes("Steel");
      if (isPoison) {
        // Poison-type clears opponent's Toxic Spikes on entry
        ctx.pub.field.hazards[side.uid].tSpikes = 0;
        ctx.logs.push(`${sideLabel(side, ctx)} absorbed the Toxic Spikes!`);
      } else if (!isSteel && !mon.types?.includes("Flying") && !side.active.status) {
        // We'll apply regular poison (badly poisoned requires tracking a counter)
        if (!statusBlockedBySafeguard(ctx, { team: [mon] } as any, side.uid)) {
          side.active.status = "PSN";
          ctx.logs.push(`${sideLabel(side, ctx)} was poisoned by Toxic Spikes!`);
        } else {
          ctx.logs.push(`Safeguard protected ${sideLabel(side, ctx)} from Toxic Spikes!`);
        }
      }
    }

    // Sticky Web: lower Speed one stage once (don't stack past -1)
    if (hz.web) {
      const cur = side.pubVolatiles?.speedStage ?? 0;
      if (cur > -1) {
        side.pubVolatiles = { ...(side.pubVolatiles||{}), speedStage: -1 };
        side.publicVolatilesChanged = true;
        ctx.logs.push(`${sideLabel(side, ctx)} was caught in a Sticky Web!`);
      }
    }
  }
}

/** ------------------- Resolution: switch ------------------- */
function performSwitch(ctx: BattleCtx, user: SideKey) {
  const s = user === "A" ? ctx.a : ctx.b;
  const opp = user === "A" ? ctx.b : ctx.a;

  // pick first healthy bench (or specific index if you're already passing it)
  let idx = 1;
  for (let i=1;i<s.team.length;i++) if (!s.team[i].fainted && s.team[i].stats.hp>0) { idx = i; break; }
  const tmp = s.team[0]; s.team[0] = s.team[idx]; s.team[idx] = tmp;

  // Update public active
  s.active.species = s.team[0].species;
  s.active.maxHp = s.team[0].stats.hp;
  s.active.hp = s.team[0].stats.hp;
  s.active.status = null;
  s.pubVolatiles = {}; // reset per-entry volatiles (Sub/Protect/etc.)
  s.publicVolatilesChanged = true;

  // Reset visible boosts on entry (optional—mainline games keep boosts; switch resets them)
  ctx.pub[s.uid].active.boosts = { atk:0, def:0, spa:0, spd:0, spe:0 };

  ctx.logs.push(`${label(user, ctx)} switched to ${s.team[0].species}!`);

  // ENTRY HAZARDS
  applyEntryHazards(ctx, s, opp);
  if (s.active.hp <= 0) return; // fainted on entry; don't trigger abilities

  // **INTIMIDATE** (on entry): lower foe's Attack by 1 → may trigger Defiant/Competitive
  if (getAbility(s) === "intimidate") {
    const lowered = lowerStatWithMist(ctx, opp.uid, "atk", 1, s /* attacker */);
    if (lowered) {
      // Defiant/Competitive already triggered inside lowerStatWithMist
      ctx.logs.push(`${label(user, ctx)} intimidated the foe!`);
    } else {
      // blocked by Mist or blocker ability — already logged in lowerStatWithMist
    }
  }
}

/** ------------------- Resolution: Pursuit interrupt ------------------- */
async function resolvePursuitInterrupt(ctx: BattleCtx, user: SideKey) {
  const atk = user === "A" ? ctx.a : ctx.b;
  const def = user === "A" ? ctx.b : ctx.a;
  const move = await getMoveData("pursuit");
  if (!move) return;
  
  // If attacker can't act (PP 0, disable, recharge), just skip
  if (!await hasUsableMove(atk, "pursuit", ctx)) return;

  decrementPP(atk, "pursuit");
  ctx.logs.push(`${label(user, ctx)} used Pursuit!`);

  const crit = rollCrit(ctx, move);
  const rand = 0.85 + 0.15 * nextRand(ctx.rng).float;

  // Gen behavior: double power on switching target; we'll implement 2× power here
  const boosted: MoveData = { ...move, power: (move.power || 40) * 2 };
  const dmg = computeDamage(ctx, atk, def, boosted, crit, rand);
  applyDamage(def, dmg);
  applyOnHit(ctx, atk, def, boosted, dmg);

  ctx.lastResultSummary = `${label(user, ctx)} hit with Pursuit before the switch — ${dmg} damage${crit ? " (CRIT!)" : ""}.`;
}

/** ------------------- Resolution: move ------------------- */
async function resolveMove(ctx: BattleCtx, user: SideKey, moveId: string, targetSideLabel: "p1" | "p2") {
  const atk = user === "A" ? ctx.a : ctx.b;
  const def = user === "A" ? ctx.b : ctx.a;

  const move = await getMoveData(moveId);
  if (!move) { ctx.logs.push(`${label(user, ctx)}'s move failed.`); return; }

  // Soundproof immunity to sound moves
  const defAbility = (def.team[0]?.ability || "").toLowerCase();
  if (move.isSound && defAbility === "soundproof") {
    ctx.logs.push(`${sideLabel(def, ctx)} is immune to sound-based moves!`);
    return;
  }

  // Check if we need to force Struggle
  const isStruggle = moveId === "struggle";
  if (isStruggle) {
    // Override properties to match Struggle's special behavior
    move.accuracy = null;              // always hits
    move.recoilFrac = 0;               // we'll apply special recoil below
  }

  // Legality re-check (PP, status like recharge, disable, choice-lock etc.)
  if (!await hasUsableMove(atk, moveId, ctx)) {
    // If no legal moves at all, force Struggle
    if (!await hasAnyUsableMove(atk, ctx)) {
      ctx.logs.push(`${label(user, ctx)} has no moves left and must Struggle!`);
      // Continue with Struggle logic below
    } else {
      ctx.logs.push(`${label(user, ctx)} couldn't move!`);
      return;
    }
  }

  // Consume PP (status moves also consume PP, but not Struggle)
  if (!isStruggle) {
    decrementPP(atk, moveId);
  }

  // Protect logic:
  const defHasProtect = !!def.pubVolatiles?.protectActive;
  if (defHasProtect && move.category !== "status") {
    if (move.bypassProtect) {
      // Feint-like: bypass and break the shield
      def.pubVolatiles.protectActive = false;
      def.pubVolatiles.protectChain = 0;            // RESET CHAIN HERE
      def.publicVolatilesChanged = true;
      ctx.logs.push(`${sideLabel(def, ctx)}'s protection was pierced!`);
      // proceed to damage as normal
    } else {
      ctx.logs.push(`${sideLabel(def, ctx)} protected itself!`);
      return;
    }
  }

  // Accuracy check
  if (move.accuracy != null) {
    const hitRoll = nextRand(ctx.rng).float;
    if (hitRoll > move.accuracy) {
      ctx.logs.push(`${label(user, ctx)} used ${move.name} but it missed!`);
      onMissRecoil(atk, move);
      return;
    }
  }

  ctx.logs.push(`${label(user, ctx)} used ${move.name}!`);

  // Damage or status application (by category)
  if (move.category === "status") {
    applyStatusMove(ctx, atk, def, move);
  } else {
    const attackerAbility = (atk.team[0]?.ability || "").toLowerCase();
    const totalHits =
      typeof move.hits === "number" ? move.hits :
      move.hits === "2-5"
        ? (attackerAbility === "skill link" ? 5 : rollMultiHitCount(ctx))
        : 1;

    const atkAbility = (atk.team[0]?.ability || "").toLowerCase();
    const bypassSub = move.isSound || atkAbility === "infiltrator";

    let totalDamage = 0;
    let anyHitThroughSub = false;

    for (let i = 1; i <= totalHits; i++) {
      if (def.active.hp <= 0) break;
      const crit = rollCrit(ctx, move);
      const rand = 0.85 + 0.15 * nextRand(ctx.rng).float;
      let dmg = computeDamage(ctx, atk, def, move, crit, rand);

      const subRemaining = def.pubVolatiles?.subHp ?? 0;
      if (subRemaining > 0 && !bypassSub) {
        // damage the substitute
        const dealt = Math.min(subRemaining, dmg);
        const newSub = Math.max(0, subRemaining - dealt);
        def.pubVolatiles = { ...(def.pubVolatiles||{}), subHp: newSub };
        def.publicVolatilesChanged = true;
        ctx.logs.push(`${move.name} hit the Substitute for ${dealt}.`);
        if (newSub <= 0) ctx.logs.push(`${sideLabel(def, ctx)}'s Substitute faded!`);
      } else {
        // hit the Pokémon directly (either no sub or we bypass it)
        anyHitThroughSub = true;
        applyDamage(def, dmg);
        if (totalHits > 1) {
          const ordinal = i === 1 ? 'st' : i === 2 ? 'nd' : i === 3 ? 'rd' : 'th';
          ctx.logs.push(`${move.name} hit ${i}${ordinal} time for ${dmg}.`);
        }
      }

      totalDamage += dmg;
    }

    // After total damage, apply on-hit side effects (drain/recoil scale on total dealt)
    if (totalDamage > 0) applyOnHit(ctx, atk, def, move, totalDamage, !anyHitThroughSub);

    // Struggle special recoil
    if (isStruggle) {
      const recoil = Math.max(1, Math.floor(atk.active.maxHp * 0.25));
      atk.active.hp = Math.max(0, atk.active.hp - recoil);
      ctx.logs.push(`${label(user, ctx)} is damaged by recoil from Struggle!`);
    }

    ctx.lastResultSummary = `${label(user, ctx)} used ${move.name} — ${totalDamage} total damage${totalHits>1?` (${totalHits} hits)`:''}.`;
  }

  // Recharge handling
  if (move.recharge) {
    atk.pubVolatiles = { ...(atk.pubVolatiles||{}), recharge: true };
    atk.publicVolatilesChanged = true;
    ctx.logs.push(`${label(user, ctx)} must recharge!`);
  }
}

/** ------------------- Legality & PP ------------------- */
async function hasUsableMove(side: SideState, moveId: string, ctx: BattleCtx) {
  // Recharge check (public volatile)
  if (side.pubVolatiles?.recharge) {
    // Clear recharge for next turn at end-of-turn; for now we block usage
    return false;
  }
  const active = side.team[0];
  const move = active?.moves?.find(m => m.id === moveId);
  if (!move || move.pp <= 0) return false;

  // Choice-lock (private)
  if (side.priv?.choiceLock?.locked && side.priv?.choiceLock?.moveId && side.priv.choiceLock.moveId !== moveId) {
    return false;
  }
  // Disable (private)
  if (side.priv?.disable?.moveId && side.priv.disable.moveId === moveId) return false;

  // Taunt (public) blocks typical status moves (heuristic; prefer tagging DB)
  const moveData = await getMoveData(moveId);
  if (side.pubVolatiles?.taunt && moveData?.category === "status") return false;

  return true;
}
function decrementPP(side: SideState, moveId: string) {
  const m = side.team[0].moves.find(mm => mm.id === moveId);
  if (m) m.pp = Math.max(0, (m.pp|0) - 1);
  side.priv.team = side.team; // persist back
}
function onMissRecoil(side: SideState, move: MoveData) {
  if (move.missRecoilFrac) {
    const dmg = Math.floor(side.active.maxHp * move.missRecoilFrac);
    side.active.hp = Math.max(0, side.active.hp - dmg);
  }
}

/** ------------------- Damage & effects ------------------- */
function rollCrit(ctx: BattleCtx, move: MoveData) {
  // simple: 1/24 unless highCrit (1/8)
  const p = move.highCrit ? 1/8 : 1/24;
  return nextRand(ctx.rng).float < p;
}

function computeDamage(ctx: BattleCtx, atk: SideState, def: SideState, move: MoveData, crit: boolean, rand: number) {
  const aMon = atk.team[0], dMon = def.team[0];
  const L = aMon.level || 50;

  // --- Base raw stats
  let atkStat = move.category === "physical" ? aMon.stats.atk : aMon.stats.spa;
  let defStat = move.category === "physical" ? dMon.stats.def : dMon.stats.spd;

  // --- ***NEW: apply public boost stages (−6..+6)***
  const aBoosts = (ctx.pub[atk.uid]?.active?.boosts) || { atk:0, def:0, spa:0, spd:0, spe:0 };
  const dBoosts = (ctx.pub[def.uid]?.active?.boosts) || { atk:0, def:0, spa:0, spd:0, spe:0 };
  const stageMul = (s:number)=> s>=0 ? (2+s)/2 : 2/(2-s);
  if (move.category === "physical") {
    atkStat = Math.max(1, Math.floor(atkStat * stageMul(aBoosts.atk || 0)));
    defStat = Math.max(1, Math.floor(defStat * stageMul(dBoosts.def || 0)));
  } else if (move.category === "special") {
    atkStat = Math.max(1, Math.floor(atkStat * stageMul(aBoosts.spa || 0)));
    defStat = Math.max(1, Math.floor(defStat * stageMul(dBoosts.spd || 0)));
  }

  // --- Base formula
  let base = Math.floor(Math.floor((2*L/5+2) * (move.power || 0) * atkStat / Math.max(1,defStat)) / 50) + 2;

  let mod = rand;

  // Attacker item/ability pre-mods (you already had these)
  const ability = (aMon.ability || "").toLowerCase();
  const item    = (aMon.item || "").toLowerCase();

  // Technician (≤60 BP)
  const techEligible = move.category !== "status" && (move.power || 0) <= 60;
  if (ability === "technician" && techEligible) mod *= 1.5;

  // STAB
  if (aMon.types?.includes(move.type)) mod *= 1.5;

  // Type effectiveness (+ Tinted Lens)
  let typeMul = move.id === "struggle" ? 1 : typeEffect(move.type, dMon.types ?? ["Normal"]);
  if (ability === "tinted lens" && typeMul > 0 && typeMul < 1) typeMul *= 2;
  mod *= typeMul;

  // Crit
  if (crit) mod *= 1.5;

  // Screens (skip if crit; Infiltrator bypass already in your code)
  if (!crit && move.category !== "status") {
    const atkAbility = (atk.team[0]?.ability || "").toLowerCase();
    const infiltrates = atkAbility === "infiltrator";
    if (!infiltrates) {
      const scr = ctx.pub.field?.screens?.[def.uid] || { reflect:0, lightScreen:0 };
      if (move.category === "physical" && (scr.reflect|0) > 0) mod *= 0.5;
      if (move.category === "special"  && (scr.lightScreen|0) > 0) mod *= 0.5;
    }
  }

  // Life Orb 1.3×
  if (item === "life orb" && move.category !== "status") mod *= 1.3;

  // Knock Off boost if target has item
  const defItemNow = (dMon.item || "");
  if (move.id === "knock-off" && defItemNow) {
    mod *= 1.5; // simplified KO boost
  }

  const dmg = Math.max(1, Math.floor(base * mod));
  return dmg;
}

function applyDamage(def: SideState, dmg: number) {
  def.active.hp = Math.max(0, def.active.hp - dmg);
}

function applyOnHit(ctx: BattleCtx, atk: SideState, def: SideState, move: MoveData, dmgTotal: number, hitSubstitute?: boolean) {
  // Drain doesn't heal if all hits struck a Substitute (simplified)
  if (move.drainFrac && !hitSubstitute) {
    const heal = Math.max(1, Math.floor(dmgTotal * move.drainFrac));
    atk.active.hp = Math.min(atk.active.maxHp, atk.active.hp + heal);
  }
  if (move.recoilFrac) {
    const recoil = Math.max(1, Math.floor(dmgTotal * move.recoilFrac));
    atk.active.hp = Math.max(0, atk.active.hp - recoil);
  }
  // Secondary status blocked by sub
  if (!hitSubstitute && move.statusChance && move.inflict && !def.active.status) {
    const roll = nextRand(ctx.rng).float;
    if (roll < move.statusChance) {
      if (!statusBlockedBySafeguard(ctx, atk, def.uid)) {
        if (move.inflict === "BRN" || move.inflict === "PAR" || move.inflict === "PSN" || move.inflict === "SLP" || move.inflict === "FRZ") {
          def.active.status = move.inflict;
          ctx.logs.push(`${sideLabel(def, ctx)} is ${statusText(move.inflict)}!`);
        }
      } else {
        ctx.logs.push(`Safeguard protected ${sideLabel(def, ctx)} from status!`);
      }
    }
  }
  // Life Orb recoil (after dealing damage)
  const item = (atk.team[0]?.item || "").toLowerCase();
  if (item === "life orb" && dmgTotal > 0) {
    const lo = Math.max(1, Math.floor(atk.active.maxHp * 0.10));
    atk.active.hp = Math.max(0, atk.active.hp - lo);
    ctx.logs.push(`${label(atk === ctx.a ? "A":"B", ctx)} is hurt by Life Orb!`);
  }

  // Contact chip (Rough Skin / Rocky Helmet) — defender-based
  if (move.makesContact) {
    const defAbility = (def.team[0]?.ability || "").toLowerCase();
    const defItem    = (def.team[0]?.item || "").toLowerCase();
    let hits = 0;
    if (defAbility === "rough skin") hits++;
    if (defItem === "rocky helmet") hits++;
    if (hits > 0) {
      const chip = Math.max(1, Math.floor(atk.active.maxHp * (hits * (1/6))));
      atk.active.hp = Math.max(0, atk.active.hp - chip);
      ctx.logs.push(`${label(atk===ctx.a?"A":"B", ctx)} is hurt by ${hits===2 ? "Rough Skin and Rocky Helmet" : (defAbility==="rough skin"?"Rough Skin":"Rocky Helmet")}!`);
    }
  }

  // Knock Off item removal
  if (move.id === "knock-off") {
    if (def.team[0].item) {
      const removed = def.team[0].item;
      def.team[0].item = "";               // strip item
      def.priv.team = def.team;            // persist change
      ctx.logs.push(`${sideLabel(def, ctx)} lost its ${removed}!`);
    }
  }
}

function applyStatusMove(ctx: BattleCtx, atk: SideState, def: SideState, move: MoveData) {
  // Generic block: if defender has a Substitute, most status moves fail.
  // (You can whitelist exceptions later.)
  if ((def.pubVolatiles?.subHp ?? 0) > 0) {
    ctx.logs.push(`${sideLabel(def, ctx)} is protected by its Substitute!`);
    return;
  }

  // Very small sampler: Taunt, Swords Dance, Toxic, Recover, Protect, etc. (extend as needed)
  switch (move.id) {
    case "toxic":
      if (statusBlockedBySafeguard(ctx, atk, def.uid)) { 
        ctx.logs.push(`Safeguard protected ${sideLabel(def, ctx)}!`); 
        break; 
      }
      if (!def.active.status) {
        def.active.status = "PSN"; // For simplicity; track Toxic counter in volatiles if you want true badly-poisoned
        ctx.logs.push(`${sideLabel(def, ctx)} was badly poisoned!`);
      }
      break;
    case "will-o-wisp":
      if (statusBlockedBySafeguard(ctx, atk, def.uid)) { 
        ctx.logs.push(`Safeguard protected ${sideLabel(def, ctx)}!`); 
        break; 
      }
      if (!def.active.status) { def.active.status = "BRN"; ctx.logs.push(`${sideLabel(def, ctx)} was burned!`); }
      break;
    case "thunder-wave":
      if (statusBlockedBySafeguard(ctx, atk, def.uid)) { 
        ctx.logs.push(`Safeguard protected ${sideLabel(def, ctx)}!`); 
        break; 
      }
      if (!def.active.status) { def.active.status = "PAR"; ctx.logs.push(`${sideLabel(def, ctx)} was paralyzed!`); }
      break;
    case "swords-dance":
      // You can track boosts; here we only log
      ctx.logs.push(`${label(atk === ctx.a ? "A":"B", ctx)}'s Attack rose sharply!`);
      break;
    case "protect": {
      const chain = atk.pubVolatiles?.protectChain ?? 0;
      const successP = 1 / Math.pow(3, chain); // 1, 1/3, 1/9, ...
      const roll = nextRand(ctx.rng).float;
      if (roll <= successP) {
        atk.pubVolatiles = { ...(atk.pubVolatiles||{}), protectActive: true, protectChain: chain + 1 };
        atk.publicVolatilesChanged = true;
        ctx.logs.push(`${label(atk === ctx.a ? "A":"B", ctx)} protected itself!`);
      } else {
        // failed: reset chain
        if (!atk.pubVolatiles) atk.pubVolatiles = {};
        atk.pubVolatiles.protectChain = 0;
        atk.publicVolatilesChanged = true;
        ctx.logs.push(`${label(atk === ctx.a ? "A":"B", ctx)}'s Protect failed!`);
      }
      break;
    }
    case "roost":
    case "recover":
      atk.active.hp = Math.min(atk.active.maxHp, atk.active.hp + Math.floor(atk.active.maxHp/2));
      ctx.logs.push(`${label(atk === ctx.a ? "A":"B", ctx)} restored health!`);
      break;
    case "substitute": {
      // Consume 1/4 max HP (floor), fail if not enough HP
      const cost = Math.floor(atk.active.maxHp / 4);
      if (atk.active.hp <= cost || cost <= 0) {
        ctx.logs.push(`${label(atk===ctx.a?"A":"B", ctx)} doesn't have enough HP to make a substitute!`);
        break;
      }
      atk.active.hp -= cost;
      atk.pubVolatiles = { ...(atk.pubVolatiles||{}), subHp: cost };
      atk.publicVolatilesChanged = true;
      ctx.logs.push(`${label(atk===ctx.a?"A":"B", ctx)} put up a Substitute!`);
      break;
    }
    case "safeguard": {
      ctx.pub.field.safeguard = ctx.pub.field.safeguard || {};
      ctx.pub.field.safeguard[atk.uid] = 5; // 5 turns
      ctx.logs.push(`${label(atk===ctx.a?"A":"B", ctx)} is protected by Safeguard!`);
      break;
    }
    case "mist": {
      ctx.pub.field.mist = ctx.pub.field.mist || {};
      ctx.pub.field.mist[atk.uid] = 5; // 5 turns
      ctx.logs.push(`${label(atk===ctx.a?"A":"B", ctx)} is shrouded in Mist!`);
      break;
    }
    case "perish-song": {
      // Attacker always gets a counter unless Soundproof
      const atkAbility = (atk.team[0]?.ability || "").toLowerCase();
      if (atkAbility !== "soundproof") {
        atk.pubVolatiles = { ...(atk.pubVolatiles||{}), perishTurns: 3 };
        atk.publicVolatilesChanged = true;
      } else {
        ctx.logs.push(`${label(atk===ctx.a?"A":"B", ctx)} is immune (Soundproof)!`);
      }

      // Defender gets a counter unless Soundproof
      const defAbility = (def.team[0]?.ability || "").toLowerCase();
      if (defAbility !== "soundproof") {
        def.pubVolatiles = { ...(def.pubVolatiles||{}), perishTurns: 3 };
        def.publicVolatilesChanged = true;
      } else {
        ctx.logs.push(`${sideLabel(def, ctx)} is immune (Soundproof)!`);
      }

      ctx.logs.push(`All hearing Pokémon will faint in 3 turns!`);
      break;
    }
    case "leer":
    case "tail-whip":
      if (statusBlockedBySafeguard(ctx, atk, def.uid)) { ctx.logs.push(`Safeguard protected ${sideLabel(def, ctx)}!`); break; }
      lowerStatWithMist(ctx, def.uid, "def", 1, atk);
      break;

    case "screech":
      if (statusBlockedBySafeguard(ctx, atk, def.uid)) { ctx.logs.push(`Safeguard protected ${sideLabel(def, ctx)}!`); break; }
      lowerStatWithMist(ctx, def.uid, "def", 2, atk);
      break;

    case "growl":
      if (statusBlockedBySafeguard(ctx, atk, def.uid)) { ctx.logs.push(`Safeguard protected ${sideLabel(def, ctx)}!`); break; }
      lowerStatWithMist(ctx, def.uid, "atk", 1, atk);
      break;
    default:
      ctx.logs.push(`${label(atk === ctx.a ? "A":"B", ctx)} used ${move.name}.`);
  }
}

/** ------------------- End of turn residuals ------------------- */
function endOfTurn(ctx: BattleCtx) {
  for (const s of [ctx.a, ctx.b]) {
    if (s.active.hp <= 0) continue;

    // Poison/Burn
    if (s.active.status === "PSN") {
      const dmg = Math.max(1, Math.floor(s.active.maxHp / 8));
      s.active.hp = Math.max(0, s.active.hp - dmg);
      ctx.logs.push(`${label(s===ctx.a?"A":"B", ctx)} is hurt by poison.`);
    }
    if (s.active.status === "BRN") {
      const dmg = Math.max(1, Math.floor(s.active.maxHp / 16));
      s.active.hp = Math.max(0, s.active.hp - dmg);
      ctx.logs.push(`${label(s===ctx.a?"A":"B", ctx)} is hurt by its burn.`);
    }

    // Recharge clears after one turn
    if (s.pubVolatiles?.recharge) {
      s.pubVolatiles.recharge = false;
      s.publicVolatilesChanged = true;
    }

    // Clear per-turn shield; chain persists (affects next use)
    if (s.pubVolatiles?.protectActive) {
      s.pubVolatiles.protectActive = false;
      s.publicVolatilesChanged = true;
    } else if ((s.pubVolatiles?.protectChain ?? 0) > 0) {
      s.pubVolatiles.protectChain = 0;
      s.publicVolatilesChanged = true;
    }
  }

  // Team barriers timers
  for (const uid of [ctx.a.uid, ctx.b.uid]) {
    const field = ctx.pub.field || (ctx.pub.field = {});
    field.safeguard = field.safeguard || {};
    field.mist      = field.mist      || {};
    if ((field.safeguard[uid]||0) > 0) field.safeguard[uid]--;
    if ((field.mist[uid]||0) > 0)      field.mist[uid]--;
  }

  // Perish Song countdown
  for (const s of [ctx.a, ctx.b]) {
    if (s.pubVolatiles?.perishTurns != null) {
      s.pubVolatiles.perishTurns = Math.max(0, (s.pubVolatiles.perishTurns|0) - 1);
      s.publicVolatilesChanged = true;
      if (s.pubVolatiles.perishTurns === 0) {
        s.active.hp = 0;
        ctx.logs.push(`${label(s===ctx.a?"A":"B", ctx)} perished!`);
      } else {
        ctx.logs.push(`${label(s===ctx.a?"A":"B", ctx)}'s perish count fell to ${s.pubVolatiles.perishTurns}.`);
      }
    }
  }
}

/** ------------------- Labels & small helpers ------------------- */
function label(user: SideKey, ctx: BattleCtx) {
  const s = user === "A" ? ctx.a : ctx.b;
  return s.active.species || (user === "A" ? "P1" : "P2");
}
function sideLabel(s: SideState, ctx: BattleCtx) {
  return s === ctx.a ? ctx.a.active.species : ctx.b.active.species;
}
function statusText(x: Pokemon["status"]) {
  switch (x) {
    case "PAR": return "paralyzed";
    case "BRN": return "burned";
    case "PSN": return "poisoned";
    case "SLP": return "asleep";
    case "FRZ": return "frozen";
    default: return "statused";
  }
}

/** ---------- Replacement phase resolver ---------- */
export const onReplacementCreate = functions.database
  .ref("/battles/{bid}/turns/{turn}/replacements/{uid}")
  .onCreate(async (snap, ctx) => {
    const { bid, turn } = ctx.params;
    await tryResolveReplacements(bid, Number(turn));
  });

/** ---------- Callable: create battle with absolute deadline + RNG ---------- */
export const createBattleWithTeams = functions.https.onCall(async (data, context) => {
  const caller = context.auth?.uid;
  if (!caller) throw new functions.https.HttpsError("unauthenticated", "Sign in first.");

  const { p1Uid, p2Uid, p1Team, p2Team } = data || {};
  
  if (!p1Uid || !p2Uid || p1Uid === p2Uid) {
    throw new functions.https.HttpsError("invalid-argument", "Need two distinct players.");
  }
  if (caller !== p1Uid && caller !== p2Uid) {
    throw new functions.https.HttpsError("permission-denied", "Caller must be one of the players.");
  }
  
  if (!p1Team || !p2Team) {
    throw new functions.https.HttpsError("invalid-argument", "Both teams are required.");
  }
  
  // Convert team data to proper Pokemon format
  const convertTeamToPokemon = async (team: any[]): Promise<Pokemon[]> => {
    const convertedTeam: Pokemon[] = [];
    
    for (const slot of team) {
      if (!slot.species) continue;
      
      // Extract Pokemon ID from species name (e.g., "pokemon-25" -> 25)
      const pokemonId = slot.species.replace('pokemon-', '');
      
      try {
        // Fetch Pokemon data from PokéAPI
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
        if (!response.ok) continue;
        
        const pokemonData = await response.json() as any;
        
        // Calculate stats based on level (simplified formula)
        const level = slot.level || 50;
        const baseStats = pokemonData.stats.reduce((acc: any, stat: any) => {
          acc[stat.stat.name] = stat.base_stat;
          return acc;
        }, {});
        
        // Calculate HP: ((2 * base + 31 + (252/4)) * level / 100) + level + 10
        const hp = Math.floor(((2 * baseStats.hp + 31 + 63) * level / 100) + level + 10);
        
        // Calculate other stats: ((2 * base + 31 + (252/4)) * level / 100) + 5
        const calcStat = (base: number) => Math.floor(((2 * base + 31 + 63) * level / 100) + 5);
        
        // Normalize and enrich moves (accepts strings or objects with id/name)
        const normalizeMoveId = (m: any): string => {
          try {
            const raw = typeof m === 'string' ? m : (m?.id || m?.name || '');
            const id = String(raw)
              .trim()
              .toLowerCase()
              .replace(/\s+/g, '-')
              .replace(/[^a-z0-9-]/g, '');
            return id || 'tackle';
          } catch {
            return 'tackle';
          }
        };

        const moves: Move[] = await Promise.all(
          (Array.isArray(slot.moves) ? slot.moves : [])
            .slice(0, 4)
            .map(async (m: any) => {
              const id = normalizeMoveId(m);
              const data = await getMoveData(id);
              const ppFromInput = (typeof m === 'object' && m && 'pp' in m) ? Number(m.pp) : NaN;
              const pp = Number.isFinite(ppFromInput) && ppFromInput > 0
                ? ppFromInput
                : (data?.pp ?? 35);
              return { id, pp } as Move;
            })
        );

        const pokemon: Pokemon = {
          species: pokemonData.name,
          level: level,
          types: pokemonData.types.map((t: any) => t.type.name.charAt(0).toUpperCase() + t.type.name.slice(1)),
          stats: {
            hp: hp,
            atk: calcStat(baseStats.attack),
            def: calcStat(baseStats.defense),
            spa: calcStat(baseStats['special-attack']),
            spd: calcStat(baseStats['special-defense']),
            spe: calcStat(baseStats.speed)
          },
          item: slot.item || '',
          ability: slot.ability || (pokemonData.abilities.find((a: any) => a.is_default)?.ability?.name || ''),
          moves: moves.length ? moves : [{ id: 'tackle', pp: 35 }],
          status: null,
          fainted: false
        };
        
        convertedTeam.push(pokemon);
      } catch (error) {
        console.error(`Failed to fetch Pokemon ${pokemonId}:`, error);
        // Add a fallback Pokemon
        convertedTeam.push({
          species: 'pikachu',
          level: slot.level || 50,
          types: ['Electric'],
          stats: { hp: 100, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 },
          item: '',
          ability: 'static',
          moves: [{ id: 'tackle', pp: 35 }],
          status: null,
          fainted: false
        });
      }
    }
    
    return convertedTeam;
  };

  const teamA = await convertTeamToPokemon(p1Team);
  const teamB = await convertTeamToPokemon(p2Team);
  
  validateTeam(teamA);
  validateTeam(teamB);

  const battleRef = db.ref("/battles").push();
  const battleId = battleRef.key!;
  const now = Date.now();

  // Deterministic RNG seed (could combine with crypto random or hash of ids + now)
  const seed = Math.floor(Math.random() * 0x7fffffff);
  const rng = { seed, cursor: 0 };

  const meta = {
    createdAt: admin.database.ServerValue.TIMESTAMP,
    format: "singles",
    ruleSet: "gen9-no-weather",
    players: { p1: { uid: p1Uid }, p2: { uid: p2Uid } },
    phase: "choosing" as const,
    turn: 1,
    version: 1,
    deadlineAt: now + TURN_MS,     // ABSOLUTE DEADLINE (ms)
    winnerUid: null as string | null,
    endedReason: null as null | "forfeit" | "timeout",
    rng
  };

  const publicState = {
    field: {
      hazards: {
        [p1Uid]: { sr: false, spikes: 0, tSpikes: 0, web: false },
        [p2Uid]: { sr: false, spikes: 0, tSpikes: 0, web: false }
      },
      screens: {
        [p1Uid]: { reflect: 0, lightScreen: 0 },
        [p2Uid]: { reflect: 0, lightScreen: 0 }
      }
    },
    [p1Uid]: { 
      active: { 
        ...maskPublicView(teamA[0]), 
        boosts: { atk:0, def:0, spa:0, spd:0, spe:0 } 
      }, 
      benchPublic: teamA.slice(1).map(m => ({ species: m.species, fainted: false, revealedMoves: [] })) 
    },
    [p2Uid]: { 
      active: { 
        ...maskPublicView(teamB[0]), 
        boosts: { atk:0, def:0, spa:0, spd:0, spe:0 } 
      }, 
      benchPublic: teamB.slice(1).map(m => ({ species: m.species, fainted: false, revealedMoves: [] })) 
    },
    lastResultSummary: "Battle started."
  };

  const privateA = { team: teamA, choiceLock: {}, disable: null, encoreMoveId: null };
  const privateB = { team: teamB, choiceLock: {}, disable: null, encoreMoveId: null };

  const updates: Record<string, any> = {};
  updates[`/battles/${battleId}/meta`] = meta;
  updates[`/battles/${battleId}/public`] = publicState;
  updates[`/battles/${battleId}/private/${p1Uid}`] = privateA;
  updates[`/battles/${battleId}/private/${p2Uid}`] = privateB;
  updates[`/battles/${battleId}/turns/1`] = { choices: {}, resolution: null };

  await db.ref().update(updates);

  // Trigger Intimidate at battle start for both leads
  const battleCtx: BattleCtx = {
    bid: battleId,
    turn: 1,
    meta,
    pub: publicState,
    p1: p1Uid,
    p2: p2Uid,
    a: buildSideState(p1Uid, publicState, privateA),
    b: buildSideState(p2Uid, publicState, privateB),
    rng: { seed: meta.rng.seed, cursor: meta.rng.cursor },
    logs: []
  };

  // P1 Intimidate vs P2
  if (getAbility(battleCtx.a) === "intimidate") {
    const lowered = lowerStatWithMist(battleCtx, p2Uid, "atk", 1, battleCtx.a);
    if (lowered) {
      battleCtx.logs.push(`${battleCtx.a.active.species} intimidated the foe!`);
    }
  }

  // P2 Intimidate vs P1
  if (getAbility(battleCtx.b) === "intimidate") {
    const lowered = lowerStatWithMist(battleCtx, p1Uid, "atk", 1, battleCtx.b);
    if (lowered) {
      battleCtx.logs.push(`${battleCtx.b.active.species} intimidated the foe!`);
    }
  }

  // Update the battle with any stat changes from Intimidate
  if (battleCtx.logs.length > 0) {
    const intimidateUpdates: Record<string, any> = {};
    intimidateUpdates[`/battles/${battleId}/public/${p1Uid}/active/boosts`] = battleCtx.pub[p1Uid].active.boosts;
    intimidateUpdates[`/battles/${battleId}/public/${p2Uid}/active/boosts`] = battleCtx.pub[p2Uid].active.boosts;
    intimidateUpdates[`/battles/${battleId}/public/lastResultSummary`] = battleCtx.logs.join(" ");
    await db.ref().update(intimidateUpdates);
  }

  return { battleId };
});

/** ---------- Trigger: when a choice is created, resolve if both present (idempotent) ---------- */
export const onChoiceCreate = functions.database
  .ref("/battles/{bid}/turns/{turn}/choices/{uid}")
  .onCreate(async (snap, ctx) => {
    const { bid, turn } = ctx.params;
    await tryResolveTurn(bid, Number(turn));
  });

/** Core resolve with idempotency, phase flip, version check, absolute deadline use */
async function tryResolveTurn(bid: string, turn: number) {
  const metaRef = db.ref(`/battles/${bid}/meta`);
  const choicesRef = db.ref(`/battles/${bid}/turns/${turn}/choices`);

  // 1) Read meta + choices
  const [metaSnap, choicesSnap] = await Promise.all([metaRef.get(), choicesRef.get()]);
  const meta = metaSnap.val();
  const choices = choicesSnap.val() || {};
  if (!meta || meta.phase !== "choosing") return;
  const p1 = meta.players.p1.uid;
  const p2 = meta.players.p2.uid;
  if (!choices[p1] || !choices[p2]) return;

  // 2) Idempotency reserve
  const opId = uuidv4();
  const opRef = db.ref(`/battles/${bid}/turns/${turn}/resolution/opId`);
  const reserve = await opRef.transaction(v => v ?? opId);
  if (!reserve.committed || reserve.snapshot.val() !== opId) return;

  // 3) Flip to resolving
  const flip = await metaRef.transaction((m) => {
    if (!m || m.phase !== "choosing") return;
    m.phase = "resolving";
    return m;
  });
  if (!flip.committed || flip.snapshot.val()?.phase !== "resolving") return;

  // 4) Load authoritative state
  const [pubSnap, privASnap, privBSnap] = await Promise.all([
    db.ref(`/battles/${bid}/public`).get(),
    db.ref(`/battles/${bid}/private/${p1}`).get(),
    db.ref(`/battles/${bid}/private/${p2}`).get()
  ]);
  const pub: any = pubSnap.val();
  const privA: any = privASnap.val();
  const privB: any = privBSnap.val();

  // 5) Version guard
  const cvA = choices[p1]?.clientVersion;
  const cvB = choices[p2]?.clientVersion;
  if (cvA !== meta.version || cvB !== meta.version) {
    await db.ref(`/battles/${bid}/turns/${turn}/resolution`).update({
      opId,
      error: "clientVersion-mismatch",
      committedAt: admin.database.ServerValue.TIMESTAMP
    });
    await metaRef.update({ phase: "choosing" });
    return;
  }

  // 6) Build battle context
  const ctx: BattleCtx = {
    bid,
    turn,
    meta,
    pub,
    p1, p2,
    a: buildSideState(p1, pub, privA),
    b: buildSideState(p2, pub, privB),
    rng: { seed: meta.rng?.seed ?? 1, cursor: meta.rng?.cursor ?? 0 },
    logs: []
  };

  // 7) Compile action queue (switches first, then moves by priority→speed)
  const actionA = normalizeChoice(choices[p1], "A");
  const actionB = normalizeChoice(choices[p2], "B");
  const queue = await orderActions(ctx, actionA, actionB);

  // 8) Resolve queue
  for (const act of queue) {
    if (ctx.a.active.hp <= 0 || ctx.b.active.hp <= 0) break; // active fainted; stop executing more actions
    if (act.kind === "pursuitInterrupt") {
      await resolvePursuitInterrupt(ctx, act.user);
      continue;
    }
    if (act.kind === "switch") {
      performSwitch(ctx, act.user);
      continue;
    }
    if (act.kind === "move") {
      await resolveMove(ctx, act.user, act.moveId, act.target);
    }
  }

  // 9) End-of-turn residuals (PSN/Toxic, BRN, Leech Seed, Bind, etc.)
  endOfTurn(ctx);

  // 10) Double-KO check
  const aOut = ctx.a.active.hp <= 0;
  const bOut = ctx.b.active.hp <= 0;
  const aHasBench = hasHealthyBench(ctx.a);
  const bHasBench = hasHealthyBench(ctx.b);

  // If both out and neither has bench → draw
  if (aOut && bOut && !aHasBench && !bHasBench) {
    const update: Record<string, any> = {};
    update[`/battles/${bid}/public/${ctx.p1}/active/hp`] = { cur: 0, max: ctx.a.active.maxHp };
    update[`/battles/${bid}/public/${ctx.p2}/active/hp`] = { cur: 0, max: ctx.b.active.maxHp };
    update[`/battles/${bid}/meta/phase`] = "ended";
    update[`/battles/${bid}/meta/winnerUid`] = null;
    update[`/battles/${bid}/meta/endedReason`] = "doubleKO";
    update[`/battles/${bid}/turns/${turn}/resolution`] = {
      opId,
      committedAt: admin.database.ServerValue.TIMESTAMP,
      logs: ctx.logs.concat(["Both Pokémon fainted! The battle ends in a draw."]),
      stateHashAfter: hashState(ctx.pub, redactPrivate({ [ctx.p1]: ctx.a.priv }), redactPrivate({ [ctx.p2]: ctx.b.priv }))
    };
    await db.ref().update(update);
    return; // stop normal turn advancement
  }

  // 11) Mark replacements if needed
  const needsReplace: any = {};
  if (ctx.a.active.hp <= 0) needsReplace[p1] = true;
  if (ctx.b.active.hp <= 0) needsReplace[p2] = true;

  // 12) Update RNG, turn/version/deadline
  const next = {
    phase: "choosing",
    version: meta.version + 1,
    turn: meta.turn + 1,
    rng: { seed: ctx.rng.seed, cursor: ctx.rng.cursor },
    deadlineAt: Date.now() + TURN_MS
  };

  // 13) Compute state hash AFTER applying changes
  const stateHashAfter = hashState(ctx.pub, redactPrivate({ [p1]: ctx.a.priv }), redactPrivate({ [p2]: ctx.b.priv }));

  // 14) Build atomic update
  const update: Record<string, any> = {};
  // Public (both sides)
  update[`/battles/${bid}/public/${p1}/active/hp`] = { cur: Math.max(0, ctx.a.active.hp), max: ctx.a.active.maxHp };
  update[`/battles/${bid}/public/${p1}/active/status`] = ctx.a.active.status ?? null;
  if (ctx.a.publicVolatilesChanged) update[`/battles/${bid}/public/${p1}/active/volatiles`] = ctx.a.pubVolatiles;
  update[`/battles/${bid}/public/${p2}/active/hp`] = { cur: Math.max(0, ctx.b.active.hp), max: ctx.b.active.maxHp };
  update[`/battles/${bid}/public/${p2}/active/status`] = ctx.b.active.status ?? null;
  if (ctx.b.publicVolatilesChanged) update[`/battles/${bid}/public/${p2}/active/volatiles`] = ctx.b.pubVolatiles;
  if (ctx.lastResultSummary) update[`/battles/${bid}/public/lastResultSummary`] = ctx.lastResultSummary;

  // Private (PP and private volatiles)
  update[`/battles/${bid}/private/${p1}`] = ctx.a.priv;
  update[`/battles/${bid}/private/${p2}`] = ctx.b.priv;

  // Public/Screens/Hazards writes
  update[`/battles/${bid}/public/field/screens`] = ctx.pub.field.screens;
  update[`/battles/${bid}/public/field/hazards`] = ctx.pub.field.hazards;
  update[`/battles/${bid}/public/field/safeguard`] = ctx.pub.field.safeguard || {};
  update[`/battles/${bid}/public/field/mist`] = ctx.pub.field.mist || {};

  // Needs replacement flag in meta (optional but useful for UI)
  if (Object.keys(needsReplace).length) update[`/battles/${bid}/meta/needsReplace`] = needsReplace; else update[`/battles/${bid}/meta/needsReplace`] = null;

  // Meta
  update[`/battles/${bid}/meta/phase`] = next.phase;
  update[`/battles/${bid}/meta/version`] = next.version;
  update[`/battles/${bid}/meta/turn`] = next.turn;
  update[`/battles/${bid}/meta/rng`] = next.rng;
  update[`/battles/${bid}/meta/deadlineAt`] = next.deadlineAt;

  // Logs + hash
  update[`/battles/${bid}/turns/${turn}/resolution`] = {
    opId,
    committedAt: admin.database.ServerValue.TIMESTAMP,
    logs: ctx.logs,
    stateHashAfter
  };

  // 15) Commit
  await db.ref().update(update);
}

/** ------------------- Replacement phase resolver ------------------- */
async function tryResolveReplacements(bid: string, turn: number) {
  const metaRef = db.ref(`/battles/${bid}/meta`);
  const [metaSnap, repSnap, pubSnap, p1PrivSnap, p2PrivSnap] = await Promise.all([
    metaRef.get(),
    db.ref(`/battles/${bid}/turns/${turn}/replacements`).get(),
    db.ref(`/battles/${bid}/public`).get(),
    db.ref(`/battles/${bid}/private/${(await db.ref(`/battles/${bid}/meta/players/p1/uid`).get()).val()}`).get(),
    db.ref(`/battles/${bid}/private/${(await db.ref(`/battles/${bid}/meta/players/p2/uid`).get()).val()}`).get(),
  ]);
  const meta = metaSnap.val();
  if (!meta || meta.phase !== "replacing") return;

  const p1 = meta.players.p1.uid, p2 = meta.players.p2.uid;
  const reps = repSnap.val() || {};
  const need = meta.needsReplace || {};

  // Wait until all sides that need replacement have submitted
  const waiting: string[] = Object.keys(need).filter(uid => !reps[uid]);
  if (waiting.length) return;

  // Build ctx to reuse switch + hazards
  const pub = pubSnap.val();
  const ctx: BattleCtx = {
    bid, turn, meta, pub,
    p1, p2,
    a: buildSideState(p1, pub, p1PrivSnap.val()),
    b: buildSideState(p2, pub, p2PrivSnap.val()),
    rng: meta.rng || { seed: 1, cursor: 0 },
    logs: []
  };

  // Perform each submitted replacement
  for (const uid of Object.keys(need)) {
    const who: SideKey = uid === p1 ? "A" : "B";
    const s = who === "A" ? ctx.a : ctx.b;
    const opp = who === "A" ? ctx.b : ctx.a;
    const idx = Math.max(1, Math.min((reps[uid]?.switchToIndex|0), s.team.length - 1));

    // Swap bench idx with 0
    const tmp = s.team[0]; s.team[0] = s.team[idx]; s.team[idx] = tmp;

    // Update public
    s.active.species = s.team[0].species;
    s.active.maxHp = s.team[0].stats.hp;
    s.active.hp = s.team[0].stats.hp;
    s.active.status = null;
    s.pubVolatiles = {}; s.publicVolatilesChanged = true;

    ctx.logs.push(`${uid===p1?"P1":"P2"} sent out ${s.team[0].species}!`);

    // Hazards
    applyEntryHazards(ctx, s, opp);
  }

  // Build atomic update: public/priv, meta flip back to choosing, turn++
  const updates: Record<string, any> = {};
  updates[`/battles/${bid}/public/${p1}/active/hp`] = { cur: Math.max(0, ctx.a.active.hp), max: ctx.a.active.maxHp };
  updates[`/battles/${bid}/public/${p1}/active/species`] = ctx.a.active.species;
  if (ctx.a.publicVolatilesChanged) updates[`/battles/${bid}/public/${p1}/active/volatiles`] = ctx.a.pubVolatiles;

  updates[`/battles/${bid}/public/${p2}/active/hp`] = { cur: Math.max(0, ctx.b.active.hp), max: ctx.b.active.maxHp };
  updates[`/battles/${bid}/public/${p2}/active/species`] = ctx.b.active.species;
  if (ctx.b.publicVolatilesChanged) updates[`/battles/${bid}/public/${p2}/active/volatiles`] = ctx.b.pubVolatiles;

  // Hazards/screens may have changed (toxic spikes absorbed) — write them
  updates[`/battles/${bid}/public/field/hazards`] = ctx.pub.field.hazards;
  updates[`/battles/${bid}/public/field/screens`] = ctx.pub.field.screens;
  updates[`/battles/${bid}/public/field/safeguard`] = ctx.pub.field.safeguard || {};
  updates[`/battles/${bid}/public/field/mist`] = ctx.pub.field.mist || {};

  updates[`/battles/${bid}/private/${p1}`] = ctx.a.priv;
  updates[`/battles/${bid}/private/${p2}`] = ctx.b.priv;

  updates[`/battles/${bid}/meta/phase`] = "choosing";
  updates[`/battles/${bid}/meta/needsReplace`] = null;
  updates[`/battles/${bid}/meta/version`] = (meta.version|0) + 1;
  updates[`/battles/${bid}/meta/turn`] = (meta.turn|0) + 1;
  updates[`/battles/${bid}/meta/deadlineAt`] = Date.now() + TURN_MS;

  updates[`/battles/${bid}/turns/${turn}/replacementsResolution`] = {
    committedAt: admin.database.ServerValue.TIMESTAMP,
    logs: ctx.logs
  };

  await db.ref().update(updates);
}

/** ---------- Replay exporter ---------- */
export const exportReplay = functions.https.onCall(async (data, context) => {
  const uid = context.auth?.uid;
  if (!uid) throw new functions.https.HttpsError("unauthenticated", "Sign in first.");

  const { battleId } = data || {};
  if (!battleId) throw new functions.https.HttpsError("invalid-argument", "battleId required");

  const battleRef = db.ref(`/battles/${battleId}`);
  const [metaSnap, publicSnap, turnsSnap] = await Promise.all([
    battleRef.child("meta").get(),
    battleRef.child("public").get(),
    battleRef.child("turns").get()
  ]);

  const meta = metaSnap.val();
  if (!meta) throw new functions.https.HttpsError("not-found", "Battle not found");

  // Access check: only participants can export
  const p1 = meta.players?.p1?.uid, p2 = meta.players?.p2?.uid;
  if (uid !== p1 && uid !== p2) {
    throw new functions.https.HttpsError("permission-denied", "Only participants can export this replay.");
  }

  const turns: any[] = [];
  turnsSnap.forEach(t => {
    const tnum = Number(t.key);
    const res = t.child("resolution").val();
    if (res) {
      turns.push({
        turn: tnum,
        logs: res.logs || [],
        stateHashAfter: res.stateHashAfter || null,
        opId: res.opId || null,
        committedAt: res.committedAt || null
      });
    }
    const reps = t.child("replacementsResolution").val();
    if (reps) {
      turns.push({
        turn: tnum,
        replacements: true,
        logs: reps.logs || [],
        committedAt: reps.committedAt || null
      });
    }
  });

  // Minimal, redacted initial public (no private teams)
  const initialPublic = publicSnap.val() || {};
  // Optional: strip HP current values to make viewer recompute from logs; we'll keep them here.

  const replay = {
    version: 1,
    battleId,
    meta: {
      createdAt: meta.createdAt,
      players: meta.players,
      ruleSet: meta.ruleSet,
      format: meta.format,
      rng: meta.rng
    },
    initialPublic,
    turns,
    finalMeta: {
      phase: meta.phase,
      turn: meta.turn,
      winnerUid: meta.winnerUid ?? null,
      endedReason: meta.endedReason ?? null
    }
  };

  return replay; // returned as JSON payload to client
});

/** ---------- (Optional) Timeout sweeper using absolute deadline ---------- */
export const sweepTurnTimeouts = functions.pubsub
  .schedule("every 1 minutes")
  .onRun(async () => {
    const now = Date.now();
    const battlesSnap = await db.ref("/battles").get();
    const updates: Record<string, any> = {};
    battlesSnap.forEach(b => {
      const bid = b.key!;
      const meta = b.child("meta").val() || {};
      if (meta.phase === "choosing" && typeof meta.deadlineAt === "number" && meta.deadlineAt < now) {
        // Mark timeout and (optionally) auto-forfeit the idle side; for now, just extend deadline to avoid stall.
        updates[`/battles/${bid}/meta/deadlineAt`] = now + TURN_MS;
      }
    });
    if (Object.keys(updates).length) await db.ref().update(updates);
    return null;
  });
