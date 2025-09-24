import type { TypeName } from "@/lib/damage-calculator";

export type MoveCategory = "Physical" | "Special" | "Status";

export interface RuntimeMove {
  id: number;
  name: string;                 // e.g., "thunderbolt"
  type: TypeName;               // "Electric"
  category: MoveCategory;       // "Special" | "Physical" | "Status"
  power: number | null;         // can be null for status or dynamic-power moves
  accuracy: number | null;      // null ⇒ no accuracy check (PokeAPI semantics)
  pp: number | null;
  priority: number;
  critRateStage: number;        // +0..+3 (affects odds table you already have)
  // Secondary effects
  ailment?: { kind: string; chance: number }; // e.g., {kind:"paralysis", chance:10}
  statChanges?: Array<{ stat: "atk"|"def"|"spa"|"spd"|"spe"|"acc"|"eva"; stages: number; chance: number }>;
  hits?: { min: number; max: number } | null; // multihit like Fury Swipes
  recoil?: { fraction: number } | null;        // e.g., 1/3 for Take Down (positive = recoil)
  drain?: { fraction: number } | null;         // e.g., 0.5 for Giga Drain (healing = positive)
  // Flags / behavior
  makesContact: boolean;
  bypassAccuracyCheck: boolean;                // true if accuracy is null in PokeAPI
  // Raw effect text (optional for UI/tooltip)
  shortEffect?: string;
}

/**
 * Some moves have variable power (weight/speed/hp). Use this before damage calc.
 */
export type DynamicPowerContext = {
  attacker: { level: number; weightKg?: number; speed?: number; curHP?: number; maxHP?: number };
  defender: { weightKg?: number; speed?: number; curHP?: number; maxHP?: number; types?: TypeName[] };
};

