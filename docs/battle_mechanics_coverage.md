# Battle mechanics: spec vs implementation

This document maps the long-form Gen 9 reference ([battle_mechanics.md](./battle_mechanics.md)) to the codebase and records **Full / Partial / Missing** coverage. It is maintained by hand when behavior changes.

## Engine map

| Area | Primary implementation |
|------|------------------------|
| Turn order, Pursuit, switches | [`src/lib/team-battle-engine.ts`](src/lib/team-battle-engine.ts) (`buildActionQueue`, `getEffectiveSpeed`, …) |
| Canonical turn slice | [`src/lib/team-battle-engine-additional.ts`](src/lib/team-battle-engine-additional.ts) (`runBattleTurnFromQueue`, `resolveMove`, `resolveSwitch`) |
| PP, move usability | [`src/lib/team-battle-engine.ts`](src/lib/team-battle-engine.ts) (`canUseMove`, `consumePpForMove`, `allMovesOutOfPp`) |
| Move execution, multi-hit, many move scripts | [`src/lib/team-battle-engine-additional.ts`](src/lib/team-battle-engine-additional.ts) (`executeMoveAction`, `applyStatusMoveEffects`) |
| Damage formula, STAB, weather, items | [`src/lib/damage-calculator.ts`](src/lib/damage-calculator.ts), live prep in [`src/lib/battle-damage-modifiers.ts`](src/lib/battle-damage-modifiers.ts) + `executeMoveAction` |
| Status, volatiles, terrain status blocks | [`src/lib/team-battle-status.ts`](src/lib/team-battle-status.ts), setters in [`src/lib/team-battle-scripts.ts`](src/lib/team-battle-scripts.ts) |
| Hazards, switch-in | [`src/lib/team-battle-hazards.ts`](src/lib/team-battle-hazards.ts), `runEntrySequence` in additional |
| Weather / terrain timers, screens | [`src/lib/team-battle-field.ts`](src/lib/team-battle-field.ts), [`src/lib/team-battle-types.ts`](src/lib/team-battle-types.ts) |
| Abilities (subset) | [`src/lib/team-battle-abilities.ts`](src/lib/team-battle-abilities.ts), end-of-turn in additional |
| Items (subset) | [`src/lib/team-battle-items.ts`](src/lib/team-battle-items.ts) |
| Move metadata | [`src/lib/moveCache.ts`](src/lib/moveCache.ts), [`src/lib/adapters/pokeapiMoveAdapter.ts`](src/lib/adapters/pokeapiMoveAdapter.ts) |
| Multiplayer persistence | [`src/lib/battle-resolution.ts`](src/lib/battle-resolution.ts) (`resolveTurn`, `fetchBattleState`) |

## Coverage status

| Topic | Status | Notes |
|-------|--------|--------|
| Turn structure (start, queue, end, auto-switch) | **Full** | Shared `runBattleTurnFromQueue`; see also [`MULTIPLAYER_STATUS.md`](./MULTIPLAYER_STATUS.md) |
| Priority, speed, Trick Room | **Partial** | Core ordering + **Prankster / Gale Wings / Triage**; Psychic Terrain blocks priority vs grounded; Choice Scarf / Iron Ball / Unburden / weather speed abilities (Chlorophyll, Swift Swim, Sand Rush, Slush Rush, Surge Surfer) |
| Damage (formula, crit, STAB, weather, screens) | **Partial** | Live `executeMoveAction` → `calculateComprehensiveDamage`: stages, burn/Guts, Technician, Unaware, crit stage ignore −Atk/+Def, Choice Band/Specs, Assault Vest/Eviolite, type-boost items, Life Orb dmg; Snow Ice Def ×1.5; Sand Rock SpD ×1.5; Knock Off ×1.5 with item; **type-resist berries** on hit (+ Unnerve) |
| Accuracy / evasion | **Partial** | Stage multipliers; not every ability |
| Status conditions | **Partial** | Sleep: random 1–3 turns (Rest = 2), 30% early wake at turn start, counter decrement at end; freeze 20% thaw at turn start; Heal Bell / Aromatherapy cure full team; confusion snap-out logged; para/burn/poison/toxic residual; **Poison Heal** heals instead of poison residual; **Safeguard** blocks status application |
| Volatiles (confusion, substitute, etc.) | **Partial** | Confusion 2–5 turns, self-hit 33%, snap-out message; **Encore / Taunt / Disable / Substitute / Leech Seed / Yawn / Perish Song / binding / Wish** setters + timers; Substitute absorbs damage; **Encore:** if encored move has 0 PP, only **Struggle** is legal (Showdown-style); **choiceLock** from Choice items, cleared on Knock Off / Trick; Tailwind on `screens.tailwind` |
| Field (weather, terrain, rooms) | **Partial** | Weather rocks / Terrain Extender / Light Clay → 8 turns; common weather/terrain moves + surge abilities |
| Hazards | **Partial** | SR, Spikes, Toxic Spikes, Sticky Web; **Heavy-Duty Boots** skip entry; Defog / Rapid Spin / Mortal Spin / Court Change clear/swap |
| Switching, Pursuit | **Partial** | Pursuit interrupt; **Regenerator** / **Natural Cure** on switch-out; U-turn / Volt Switch / Flip Turn / Parting Shot auto-pivot |
| Multi-hit | **Partial** | Loop + Skill Link; item interactions subset |
| PP consumption | **Full** | Per successful use (hit or miss after selection); Struggle does not consume slot PP |
| Struggle | **Full** | When all moves 0 PP; uses move data + recoil |
| Abilities | **Partial** | Entry: Intimidate (blocks + Defiant/Competitive), weather/terrain setters, Cloud Nine / Air Lock, **Download**, **Frisk**, **Unnerve**; absorbs (Flash Fire, Volt/Water Absorb, Storm Drain, Lightning Rod, Sap Sipper, Motor Drive, Levitate, Wonder Guard); end-of-turn subset (Speed Boost, Shed Skin, Poison Heal, …); Beast Boost highest contest stat |
| Items | **Partial** | Sitrus, Lum, pinch berries, type-resist berries, Harvest, Focus Sash/Band, Rocky Helmet, Shell Bell, Leftovers, Black Sludge, **Oran Berry**; **Unnerve** blocks berries; Light Clay / weather rocks / Terrain Extender; Knock Off / Trick / Switcheroo |
| Terastallization | **Missing** | **Product-deferred** — not started; implement only after explicit scope approval |
| Double battles | **Missing** | **Product-deferred** — singles-only architecture until approved |

## Known deltas (implementation vs cart)

- **RNG + replay artifacts:** Battle RNG is stored under RTDB **`server/battleRng`** (`seed`, `state`, `calls`), initialized in [`create-rtdb-battle.ts`](../src/lib/server/create-rtdb-battle.ts) / Admin battle create. [`resolveTurn`](../src/lib/battle-resolution.ts) reads `server/battleRng` first and falls back to legacy **`meta.battleRng`** during migration, then writes the advanced seed back to `server/battleRng` (and clears `meta.battleRng`). Each resolved turn writes replay metadata (`p1Action`, `p2Action`, `rngBefore`, `rngAfter`, `stateHashAfter`) to `turns/{turn}/resolution`.
- **Server validation/normalization:** `resolveTurn` uses [`normalizeServerBattleAction`](../src/lib/team-battle-engine.ts) with `meta.ruleProfile` (`simplified` default) to coerce safe edge cases (e.g. Struggle) and reject unsafe ones with explicit reason codes persisted to `public.lastValidation`.
- **Move data:** Moves load from PokeAPI via [`getMove`](../src/lib/moveCache.ts); failures log `engine_warning` and skip the move. A built-in fallback exists for **Struggle** if the network fails. Priority abilities prefer **cached** move metadata (`getCachedMove`) when available.
- **Hydration:** [`hydrateTeam`](../src/lib/battle-resolution.ts) uses embedded `pokemon.stats` on private team snapshots when present; otherwise it fetches PokeAPI with an in-process dedupe cache per species key. If fetch fails or returns no stats, hydration **throws** (`Missing base stats…`) and resolution treats the turn as a recoverable error — it does **not** silently substitute placeholder base-50 stats. HP still uses `maxHp` / `currentHp` from the snapshot when set. Submitted teams should include stats (Admin create deep-clones payloads so client-provided stats are preserved in RTDB).
- **Client reconstruction:** [`FirebaseRTDBBattleEngine`](../src/lib/battle-engine-rtdb.ts) builds the opponent team from **public** RTDB only (active + bench); full opponent sets are not read from the other player’s private node.
- **Sleep wake (intentional blend):** Cart Gen 9 uses a sleep counter decremented at end of turn only. The engine adds a **30% early-wake roll at start of turn** for livelier battles, plus end-of-turn counter decrement. Both paths log `"[Name] woke up!"`.
- **Freeze thaw timing:** Spec text places thaw at end of turn; the engine rolls **20% at start of turn** in `applyStartOfTurnStatus` (same message: `"[Name] thawed out!"`).
- **Status cure battle log:** Team cures via **Heal Bell** / **Aromatherapy**; ability/item cures (Lum Berry, Shed Skin, Hydration) also write to `battleLog` for display in offline and RTDB battles via `battleLogToDisplayLines`.
- **Pivot UX:** U-turn / Volt Switch / Flip Turn / Parting Shot **auto-switch** to the next non-fainted bench Pokémon (no mid-turn UI selection / `needsPokemonSelection` for these yet).

## Phased backlog (post–Tier 1)

Completed in-repo waves include: `engine_warning` styling in multiplayer/offline battle text boxes, committed move JSON fixtures (`src/lib/__tests__/fixtures/moves/`), optional HTTP smoke test with `RUN_POKEAPI_TESTS=1` ([`pokeapi-http.integration.test.ts`](../src/lib/__tests__/pokeapi-http.integration.test.ts)), hydration cache (throws when stats missing), ability coverage (**Download**, **Frisk**, **Unnerve**, Intimidate interactions, absorbs, Regenerator / Natural Cure / Poison Heal / Beast Boost), item additions (**Oran Berry**, Unnerve vs berries, **type-resist berries wired on hit**, Light Clay / weather rocks / Terrain Extender, Heavy-Duty Boots), volatile/hazard scripts (Encore/Taunt/Disable/Sub/Leech Seed/Yawn/Perish/Wish/Safeguard/Tailwind, Defog/Rapid Spin/Court Change), Choice lock + Band/Specs damage, pivot moves, and **server/battleRng** RNG persistence.

**Product-deferred (do not implement without approval):** Terastallization and double battles remain **Missing** above.

## Maintenance

When adding or changing mechanics:

1. Implement in the module listed in the engine map.
2. Update the **Coverage status** table (and this section if behavior is intentionally non-cart).
3. Add or extend tests under `src/lib/__tests__/`.

Optional future work: a small script that counts handlers (e.g. keys in `HEALING_FRACTIONS`) for regression snapshots—not required for day-to-day development.
