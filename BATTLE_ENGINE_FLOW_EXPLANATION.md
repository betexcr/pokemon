Here’s a clean, code-ready battle flow for Singles only, no weather. It’s Gen-8/9 style ordering, trimmed to just what you need.

Data you’ll want
	•	Battle: turn, rng, sideA, sideB, field(hazards, screens, terrains? if you use them), actionQueue.
	•	Side: active (Pokémon), bench[], sideConditions (Reflect/Light Screen/Safeguard, Spikes, etc.).
	•	Pokémon: stats (current/max HP, Atk/Def/SpA/SpD/Spe), level, types, ability, item, status (PAR/PSN/BRN/SLP/FRZ), volatile (confusion, substitute, leechSeed, choiceLock, encore, taunt, disable, protect counter, etc.), moves[ {id, pp, disabled?, lastUsed?} ].

⸻

0) Pre-battle (once)
	1.	Init battle state (turn=0, queues empty, no field effects).
	2.	Send out each side’s lead:
	•	On-entry sequence for the new active:
	1.	Entry hazards on defender’s side (Stealth Rock, Spikes, Toxic Spikes, Sticky Web).
	2.	On-entry abilities/items (e.g., Intimidate, Download, Frisk, Neutralizing Gas announcement, etc.).
	3.	Check form/stance if you implement any (not Dynamax; you can ignore if not needed).

⸻

1) Turn loop (repeat until a side loses)

turn += 1
A) Choice phase
B) Build & order action queue
C) Resolve actions (one by one)
D) End-of-turn
E) Force replacements (if needed)

A) Choice phase

Each side picks one action:
	•	Move (with target & options) OR Switch (to a healthy bench mon).
	•	(Items/Run only in non-link battles; usually omit.)

Locks/constraints to enforce when presenting choices:
	•	Taunt (no status moves), Encore (must repeat), Disable/Imprison, Torment (no repeat), Choice-lock (locked to last move until switch), Recharge turn, Truant skip, etc.

Special check: Pursuit
	•	If an attacker chose Pursuit and the target attempts to switch, Pursuit hits before the switch (even outside normal priority). Handle this as a pre-switch interrupt when ordering.

B) Build & order action queue
	1.	Class ordering (highest → lowest):
	•	Pursuit interrupts (triggered by a target choosing switch).
	•	Switches.
	•	Moves.
	2.	For moves, compute:
	•	Priority bracket (e.g., +4 Quick Guard; +1 Quick Attack; 0; −6 Trick Room, etc.). Higher goes first.
	•	Within the same bracket, order by Speed (Gen-8+ dynamic: if Speed changes mid-turn, later ordering uses updated Speeds).
	•	Ties: random.
	•	Per-turn “go-first” procs (e.g., Quick Claw/Custap) are checked before that user acts in its bracket and can bump it ahead within the bracket.

C) Resolve each action

Process one action fully before the next. Faints can happen mid-turn; don’t end the turn—continue the queue, but skip invalidated actions.

If action is Switch
	1.	Remove the outgoing active (clear some volatiles like Protect, Endure, etc., but keep side conditions).
	2.	Bring in the chosen Pokémon; run on-entry sequence (hazards → on-entry abilities/items).
	3.	If it faints on entry (e.g., hazards), immediately go to E) Force replacements for that side; return to the queue afterward.

If action is Move

Implement the move pipeline:
	1.	Usability gates
	•	Has PP (or Struggle)? User able to act this tick? (Flinch, Sleep, Freeze, PAR 25% stop, Recharge, Confusion check happens later in damage step).
	•	Choice/Encore/Taunt/Disable/Torment legality.
	•	If illegal or no PP → Struggle (if allowed) or Fail.
	2.	Target validation / immunity
	•	Semi-invuln states (Fly/Dig/Dive), Substitute, type immunities, ability immunities (Flash Fire/Volt Absorb/Lightning Rod/etc.), Protect/Detect/Spiky Shield/King’s Shield, etc.
	•	If fully blocked, apply “no effect” and any on-fail hooks the move may have, then exit.
	3.	Accuracy check (unless move can’t miss/bypasses accuracy). On miss, apply on-miss effects (e.g., recoil for Hi Jump Kick), then exit.
	4.	Critical check (consider crit stage). Mark crit=true/false.
	5.	Base power & modifiers snapshot
	•	Determine base power (weight-based, momentum, conditional BP, multi-hit count).
	•	Snapshot current Atk/Def (or SpA/SpD) after all then-current boosts/drops, burn attack halving (unless Guts), screens (Reflect/Light Screen), Friend Guard, etc.
	6.	Damage formula (summary)
	•	Compute base → apply: crit, random factor (0.85–1.00), STAB (1.5 or 2.0 with Adaptability), type effectiveness (0×/¼×/½×/1×/2×/4×), other multipliers (screens, items like Life Orb/Choice Band/Specs, abilities like Technician/Tinted Lens, spread penalty not applicable in Singles).
	•	Subtract HP; handle Substitute first if present.
	7.	Post-hit effects
	•	Recoil (Wild Charge, Head Smash), Drain (Giga Drain), Contact effects (Static, Flame Body, Rough Skin/Iron Barbs), item/ability triggers (Berries, Weakness Policy, Eject Button/Pack, Red Card, Emergency Exit, Sturdy if at full HP).
	•	Secondary effects (chance to inflict status, stat drops/raises, flinch if user moved first, etc.).
	•	Multi-hit moves loop steps 2–7 for each hit (accuracy once unless you mimic per-hit; most gens roll once then continue hits).
	8.	Faint checks & on-faint
	•	If target or user faints, trigger on-faint hooks (Aftermath, Destiny Bond, Grudge, etc.).
	•	Remove fainted mon from field; do not force immediate replacement yet unless both sides are out of actions and you want mid-turn replacement (see E).

Notes:
	•	Dynamic Speed: if a move changes Speeds (Icy Wind, Drum Beating), it affects ordering for any later yet-to-act moves this turn.
	•	Protect success penalty: track consecutive uses to reduce success chances.

D) End-of-turn (global residuals & timers)

In this order (keep it deterministic):
	1.	Residual damage/heal: Poison/Toxic, Burn, Leech Seed, Binding (Wrap/Fire Spin/etc.), Curse(ghost), Aqua Ring/Ingrain, Nightmare, Future Sight/Doom Desire landing, Wish heal.
	2.	Item residuals: Leftovers/Black Sludge, Sticky Barb transfer, Poison/Flame Orb activation, White Herb.
	3.	End-of-turn abilities: Speed Boost, Moody, Harvest, etc.
	4.	Volatile decrements: Confusion turns −1, Encore −1 (end when reaches 0), Taunt −1, Disable −1, Perish Song −1 (faint at 0), Substitute stays until HP=0, Protect counter decays (or reset per your model).
	5.	Screens & side timers: Reflect/Light Screen/Safeguard/Aurora Veil/Spikes layers don’t decay except via turns for the timed ones (Reflect/LS/Safeguard).
	6.	Check faints from residuals and mark for replacement.

E) Force replacements (if any side has no active)
	•	If one side needs a replacement: that side chooses first (no move this turn); run on-entry sequence; if it faints on entry, choose again until legal or lose.
	•	If both need replacements: generally the faster side (by last known active Speeds; or defined tie-break rule) selects first. After both enter, run each on-entry sequence in Speed order.
	•	After replacements, if both sides still have actives → next turn.

⸻

Practical implementation notes
	•	RNG: centralize; seed per battle for reproducibility (log rolls).
	•	Event bus: drive “hooks” (onEntry, onBeforeMove, onAfterMove, onDamage, onFaint, onEndTurn, etc.). Abilities/items/moves subscribe to hooks.
	•	Durations: store absolute expireAtTurn for timers; decrement in D) and compare turn >= expireAtTurn.
	•	Priority: annotate each move with a static priority; add transient modifiers (e.g., Prankster for status in other modes; if not using, ignore).
	•	Dynamic speed: always compute effective Speed on demand from current stat stage, item, paralysis, Tailwind (if you later add it), etc.
	•	Choice-lock: set on first successful move; clear on switch or when move becomes illegal (e.g., out of PP).
	•	Target invalidation: if target faints/vanishes before your action, many moves fail gracefully; ensure you re-validate target when the action starts.

⸻

Minimal pseudocode (Singles, no weather)

while (!battle.isOver()) {
  turn++;

  // A) Choices
  for (side of [A,B]) side.action = getAction(side);

  // Pursuit interrupts
  if (A.action.isSwitch && B.action.isPursuitChosenAgainst(A)) queue.push(B.pursuitInterrupt());
  if (B.action.isSwitch && A.action.isPursuitChosenAgainst(B)) queue.push(A.pursuitInterrupt());

  // B) Build queue
  queue.push(...[A.action, B.action]);
  queue = orderByClassThenPriorityThenSpeed(queue);

  // C) Resolve
  for (act of queue) {
    if (!act.user.isActive() || act.user.isFainted) continue;
    if (act.type === 'switch') {
      performSwitch(act.user.side, act.targetSlot);
      runEntrySequence(opponentOf(act.user).side, act.user); // hazards then abilities
      continue;
    }
    if (act.type === 'move') {
      resolveMove(act.user, act.move, act.target);
    }
  }

  // D) End-of-turn
  runResidualsAndTimersInOrder();

  // E) Replacements
  for (side of [A,B]) {
    while (!side.active && side.hasHealthyBench()) {
      performSwitch(side, chooseReplacement(side));
      runEntrySequence(opponentOf(side).side, side.active);
    }
  }

  battle.updateGameOver();
}


⸻

If you want, I can tailor this to your current codebase (TS/React state machine, Node service, etc.) and hand you drop-in modules for: action queue, move pipeline, residual engine, and a hook system.