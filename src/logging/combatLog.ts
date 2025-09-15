import type { TurnResult } from "../lib/executor";
import type { BattlePokemon } from "../lib/team-battle-engine";

/** Minimal ANSI toggles (no deps). */
const ANSI = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};
type Color = keyof typeof ANSI;

/** Basic colorizer; no color when useAnsi=false. */
function c(s: string, color?: Color, useAnsi=true, bold=false) {
  if (!useAnsi || !color) return bold ? `**${s}**` : s;
  const b = bold ? ANSI.bold : "";
  return `${b}${ANSI[color]}${s}${ANSI.reset}`;
}

function effText(mult: number): string {
  if (mult === 0) return "no effect";
  if (mult >= 4) return "devastatingly effective";
  if (mult >= 2) return "super effective";
  if (mult === 1) return "effective";
  if (mult <= 0.25) return "barely tickles";
  return "not very effective";
}

function hpBar(current: number, max: number, width=20): string {
  const filled = Math.max(0, Math.min(width, Math.round((current/max)*width)));
  return "█".repeat(filled) + "░".repeat(width - filled);
}

export type PrintOptions = {
  useAnsi?: boolean;
  showBars?: boolean;
  emojis?: boolean;
  banner?: boolean;
  prefix?: string; // e.g. timestamp
};

/**
 * Formats a single turn into a readable combat chant.
 */
export function formatTurnLog(
  attacker: BattlePokemon,
  defender: BattlePokemon,
  beforeAHP: number,
  beforeBHP: number,
  res: TurnResult,
  opts: PrintOptions = {}
): string {
  const { useAnsi=true, showBars=true, emojis=true, banner=true, prefix="" } = opts;
  const lines: string[] = [];

  const fx = (s:string, col?:Color, b=false) => c(s, col, useAnsi, b);
  const pre = prefix ? `${prefix} ` : "";

  if (banner) {
    lines.push(pre + fx("⎯⎯⎯⎯⎯ Battle Chronicle ⎯⎯⎯⎯⎯", "cyan", true));
  }
  lines.push(pre + `${fx(attacker.pokemon.name, "yellow", true)} invoked ${fx(res.move, "magenta", true)}!`);

  if (res.missed) {
    lines.push(pre + fx(`${emojis ? "💨 " : ""}But it missed!`, "gray"));
    return lines.join("\n");
  }

  if (res.typeEffectiveness !== undefined) {
    const eff = effText(res.typeEffectiveness);
    const effCol: Color =
      res.typeEffectiveness===0 ? "gray" :
      res.typeEffectiveness>1 ? "green" :
      res.typeEffectiveness<1 ? "yellow" : "blue";
    lines.push(pre + `${fx("•", "gray")} Type effectiveness: ${fx(eff, effCol)}` +
      ` ${fx(`(x${res.typeEffectiveness.toFixed(2)})`, "gray")}`);
  }

  if (res.hits > 1) {
    lines.push(pre + `${fx("•", "gray")} Hits: ${fx(String(res.hits), "blue")} ` +
      `${fx(`[${res.perHitDamage.join(", ")}] dmg`, "gray")}`);
  } else {
    lines.push(pre + `${fx("•", "gray")} Damage: ${fx(String(res.totalDamage), "red", true)}`);
  }

  if (res.crits?.some(Boolean)) {
    const idx = res.crits.map((v,i)=>v?i+1:null).filter(Boolean).join(",");
    lines.push(pre + `${emojis ? "⚡ " : ""}${fx("Critical hit!", "red", true)} on hit(s): ${fx(idx, "red")}`);
  }

  if (res.drained && res.drained>0) {
    lines.push(pre + `${emojis ? "🩸 " : ""}${fx(`Drain restored ${res.drained} HP to ${attacker.pokemon.name}`, "green")}`);
  }
  if (res.recoil && res.recoil>0) {
    lines.push(pre + `${emojis ? "💥 " : ""}${fx(`Recoil dealt ${res.recoil} HP to ${attacker.pokemon.name}`, "yellow")}`);
  }

  if (res.appliedAilment) {
    lines.push(pre + `${emojis ? "☣️ " : ""}${fx(`Ailment inflicted: ${res.appliedAilment}`, "magenta")}`);
  }

  if (res.statChanges && res.statChanges.length) {
    lines.push(pre + `${fx("•", "gray")} Stat shifts: ${fx(res.statChanges.join(", "), "cyan")}`);
  }

  // HP bars (after)
  const afterA = attacker.currentHp, afterB = defender.currentHp;
  if (showBars) {
    lines.push(pre + fx(`\nStatus Rites`, "cyan", true));
    lines.push(pre + `${fx(attacker.pokemon.name, "yellow", true)}  HP ${fx(`${afterA}/${attacker.maxHp}`, "green")}  ${hpBar(afterA, attacker.maxHp)}`);
    lines.push(pre + `${fx(defender.pokemon.name, "yellow", true)}  HP ${fx(`${afterB}/${defender.maxHp}`, "green")}  ${hpBar(afterB, defender.maxHp)}`);
  } else {
    lines.push(pre + `${fx(attacker.pokemon.name, "yellow", true)} HP: ${fx(`${beforeAHP} → ${afterA}`, "green")}`);
    lines.push(pre + `${fx(defender.pokemon.name, "yellow", true)} HP: ${fx(`${beforeBHP} → ${afterB}`, "green")}`);
  }

  if (banner) {
    lines.push(pre + fx("⎯⎯⎯⎯⎯ End of Chronicle ⎯⎯⎯⎯⎯", "cyan", true));
  }
  return lines.join("\n");
}

/** Print to console. */
export function printTurnLog(
  attacker: BattlePokemon,
  defender: BattlePokemon,
  beforeAHP: number,
  beforeBHP: number,
  res: TurnResult,
  opts?: PrintOptions
) {
  console.log(formatTurnLog(attacker, defender, beforeAHP, beforeBHP, res, opts));
}

/** Build a plain object summary suitable for JSON storage. */
export function buildChronicleRecord(
  attacker: BattlePokemon,
  defender: BattlePokemon,
  beforeAHP: number,
  beforeBHP: number,
  res: TurnResult
) {
  return {
    attacker: attacker.pokemon.name,
    defender: defender.pokemon.name,
    move: res.move,
    missed: res.missed,
    hits: res.hits,
    crits: res.crits,
    typeMultiplier: res.typeEffectiveness,
    perHitDamage: res.perHitDamage,
    totalDamage: res.totalDamage,
    drained: res.drained ?? 0,
    recoil: res.recoil ?? 0,
    ailment: res.appliedAilment ?? null,
    statChanges: res.statChanges ?? [],
    hpAfter: {
      [attacker.pokemon.name]: attacker.currentHp,
      [defender.pokemon.name]: defender.currentHp
    }
  };
}
