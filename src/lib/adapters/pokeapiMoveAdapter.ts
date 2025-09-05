import type { MoveCategory, RuntimeMove, DynamicPowerContext } from "@/types/move";
import type { TypeName } from "@/lib/damage-calculator";
import { fetchMove } from "@/lib/pokeapi";

// Map PokeAPI type string -> engine TypeName
function mapType(t: string): TypeName {
  const m = { normal:"Normal", fire:"Fire", water:"Water", electric:"Electric", grass:"Grass", ice:"Ice",
              fighting:"Fighting", poison:"Poison", ground:"Ground", flying:"Flying", psychic:"Psychic",
              bug:"Bug", rock:"Rock", ghost:"Ghost", dragon:"Dragon", dark:"Dark", steel:"Steel", fairy:"Fairy" } as const;
  const v = (m as Record<string, TypeName>)[t];
  if (!v) throw new Error(`Unknown type ${t}`);
  return v;
}

const STAT_MAP: Record<string, "atk"|"def"|"spa"|"spd"|"spe"|"acc"|"eva" | undefined> = {
  attack:"atk", defense:"def", "special-attack":"spa", "special-defense":"spd", speed:"spe", accuracy:"acc", evasion:"eva"
};

function mapCategory(s: string): MoveCategory {
  if (s==="status") return "Status";
  if (s==="physical") return "Physical";
  if (s==="special") return "Special";
  throw new Error(`Unknown damage_class: ${s}`);
}

function extractShortEffect(effect_entries: unknown[]): string | undefined {
  const en = effect_entries.find((e: unknown) => (e as { language?: { name?: string } }).language?.name === "en");
  if (!en) return undefined;
  // Replace placeholders like $effect_chance
  const effect = en as { short_effect?: string; effect_chance?: number };
  return effect.short_effect?.replace("$effect_chance", (effect.effect_chance ?? "").toString());
}

function critStageFromMeta(meta: unknown): number {
  // PokeAPI meta.crit_rate is +stages to crit ratio (0..3)
  const metaObj = meta as { crit_rate?: number };
  return Math.max(0, Math.min(3, metaObj?.crit_rate ?? 0));
}

function parseSecondary(meta: unknown): { ailment?: RuntimeMove["ailment"]; statChanges?: RuntimeMove["statChanges"] } {
  const out: { ailment?: RuntimeMove["ailment"]; statChanges?: RuntimeMove["statChanges"] } = {};
  const metaObj = meta as { ailment?: { name?: string }; ailment_chance?: number };
  if (metaObj?.ailment && metaObj.ailment?.name && metaObj.ailment.name !== "none") {
    out.ailment = { kind: metaObj.ailment.name, chance: metaObj.ailment_chance ?? 0 };
  }
  // PokeAPI also exposes "stat_changes" at the top-level; chance is effect_chance on the move
  return out;
}

function parseTopLevelStatChanges(move: unknown): RuntimeMove["statChanges"] {
  const moveObj = move as { effect_chance?: number; stat_changes?: unknown[] };
  const chance = moveObj.effect_chance ?? 100; // many moves set effect chance here
  if (!Array.isArray(moveObj.stat_changes) || moveObj.stat_changes.length===0) return undefined;
  const list = moveObj.stat_changes
    .map((sc: unknown) => {
      const scObj = sc as { stat?: { name?: string }; change?: number };
      const stat = STAT_MAP[scObj.stat?.name || ''];
      if (!stat) return undefined;
      return { stat, stages: scObj.change as number, chance };
    })
    .filter(Boolean) as NonNullable<RuntimeMove["statChanges"]>;
  return list.length ? list : undefined;
}

function parseRecoilDrain(meta: unknown): { recoil?: RuntimeMove["recoil"], drain?: RuntimeMove["drain"] } {
  const out: { recoil?: RuntimeMove["recoil"], drain?: RuntimeMove["drain"] } = {};
  const metaObj = meta as { recoil?: number; drain?: number };
  if (metaObj?.recoil && metaObj.recoil>0) out.recoil = { fraction: metaObj.recoil/100 }; // e.g., 33 -> 0.33
  if (metaObj?.drain && metaObj.drain>0) out.drain = { fraction: metaObj.drain/100 };     // e.g., 50 -> 0.5
  return out;
}

function parseHits(move: unknown): RuntimeMove["hits"] {
  const moveObj = move as { min_hits?: number; max_hits?: number };
  if (moveObj.min_hits && moveObj.max_hits) return { min: moveObj.min_hits, max: moveObj.max_hits };
  return null;
}

/** Known variable-power moves you likely care about (expand as needed). */
function dynamicPowerResolver(name: string): ((ctx: DynamicPowerContext)=>number) | undefined {
  const n = name.toLowerCase();
  if (n==="low-kick" || n==="grass-knot") {
    // Based on defender weight (kg). Thresholds per main series.
    return ({ defender }) => {
      const w = defender.weightKg ?? 0;
      if (w >= 200) return 120;
      if (w >= 100) return 100;
      if (w >= 50) return 80;
      if (w >= 25) return 60;
      if (w >= 10) return 40;
      return 20;
    };
  }
  if (n==="heavy-slam" || n==="heat-crash") {
    // Attacker heavier than defender => larger BP.
    return ({ attacker, defender }) => {
      const a = attacker.weightKg ?? 1, d = defender.weightKg ?? 1;
      const ratio = a / d;
      if (ratio >= 5) return 120;
      if (ratio >= 4) return 100;
      if (ratio >= 3) return 80;
      if (ratio >= 2) return 60;
      return 40;
    };
  }
  if (n==="electro-ball") {
    return ({ attacker, defender }) => {
      const as = Math.max(1, attacker.speed ?? 1), ds = Math.max(1, defender.speed ?? 1);
      const r = as / ds;
      if (r >= 4) return 150;
      if (r >= 3) return 120;
      if (r >= 2) return 80;
      if (r >= 1) return 60;
      return 40;
    };
  }
  if (n==="gyro-ball") {
    // Approximation: 25 * (target_speed / user_speed) capped 150
    return ({ attacker, defender }) => {
      const as = Math.max(1, attacker.speed ?? 1), ds = Math.max(1, defender.speed ?? 1);
      return Math.max(1, Math.min(150, Math.floor(25 * (ds / as))));
    };
  }
  if (n==="reversal" || n==="flail") {
    return ({ attacker }) => {
      const hp = attacker.curHP ?? 1, max = Math.max(1, attacker.maxHP ?? 1);
      const p = hp / max;
      if (p <= 1/48) return 200; if (p <= 1/6) return 150; if (p <= 1/5) return 100;
      if (p <= 1/3) return 80; if (p <= 1/2) return 40; return 20;
    };
  }
  if (n==="eruption" || n==="water-spout") {
    return ({ attacker }) => {
      const hp = attacker.curHP ?? 1, max = Math.max(1, attacker.maxHP ?? 1);
      return Math.floor(150 * (hp / max));
    };
  }
  // Add more as needed (Punishment, Stored Power, etc.)
  return undefined;
}

export interface CompiledMove extends RuntimeMove {
  getPower?: (ctx: DynamicPowerContext) => number; // returns concrete BP for this use
}

export async function loadMoveFromPokeAPI(idOrName: number | string): Promise<CompiledMove> {
  const mv = await fetchMove(idOrName) as {
    id: number;
    name: string;
    type: { name: string };
    damage_class: { name: string };
    power: number | null;
    accuracy: number | null;
    pp: number | null;
    priority: number;
    meta: unknown;
    effect_entries: unknown[];
    stat_changes?: unknown[];
    effect_chance?: number;
    min_hits?: number;
    max_hits?: number;
  };

  const rm: RuntimeMove = {
    id: mv.id,
    name: mv.name, // keep API name ("thunderbolt"); you can display with toTitleName
    type: mapType(mv.type.name),
    category: mapCategory(mv.damage_class.name),
    power: mv.power ?? null,
    accuracy: mv.accuracy ?? null,
    pp: mv.pp ?? null,
    priority: mv.priority ?? 0,
    critRateStage: critStageFromMeta(mv.meta),
    ...parseRecoilDrain(mv.meta),
    hits: parseHits(mv),
    makesContact: !!(mv.meta as { makes_contact?: boolean })?.makes_contact,
    bypassAccuracyCheck: mv.accuracy === null, // per PokeAPI: null -> no accuracy check
    shortEffect: extractShortEffect(mv.effect_entries),
    ...parseSecondary(mv.meta),
    statChanges: parseTopLevelStatChanges(mv)
  };

  const dyn = dynamicPowerResolver(mv.name);
  const compiled: CompiledMove = { ...rm, getPower: dyn };
  return compiled;
}
