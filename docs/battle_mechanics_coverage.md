# Battle mechanics: spec vs implementation

This document maps the long-form Gen 9 reference ([battle_mechanics.md](./battle_mechanics.md)) to the codebase and records **Full / Partial / Missing** coverage. It is maintained by hand when behavior changes.

## Engine map

| Area | Primary implementation |
|------|------------------------|
| Turn order, Pursuit, switches | [`src/lib/team-battle-engine.ts`](src/lib/team-battle-engine.ts) (`buildActionQueue`, `getEffectiveSpeed`, …) |
| Canonical turn slice | [`src/lib/team-battle-engine-additional.ts`](src/lib/team-battle-engine-additional.ts) (`runBattleTurnFromQueue`, `resolveMove`, `resolveSwitch`) |
| PP, move usability | [`src/lib/team-battle-engine.ts`](src/lib/team-battle-engine.ts) (`canUseMove`, `consumePpForMove`, `allMovesOutOfPp`) |
| Move execution, multi-hit, many move scripts | [`src/lib/team-battle-engine-additional.ts`](src/lib/team-battle-engine-additional.ts) (`executeMoveAction`, `applyStatusMoveEffects`) |
| Damage formula, STAB, weather, items | [`src/lib/damage-calculator.ts`](src/lib/damage-calculator.ts), `calculateDamageDetailed` in team-battle-engine |
| Status, volatiles, terrain status blocks | [`src/lib/team-battle-status.ts`](src/lib/team-battle-status.ts) |
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
| Priority, speed, Trick Room | **Partial** | Core ordering exists; not every priority ability |
| Damage (formula, crit, STAB, weather, screens) | **Partial** | Broad coverage in damage calculator; not every ability/item |
| Accuracy / evasion | **Partial** | Stage multipliers; not every ability |
| Status conditions | **Partial** | Sleep/freeze/para/burn/poison/toxic; sleep uses turn counter + 30% early wake; Heal Bell / Aromatherapy cure team; confusion snap-out logged |
| Volatiles (confusion, substitute, etc.) | **Partial** | Subset implemented; **Encore:** if the encored move has 0 PP, only **Struggle** is legal (Showdown-style), aligned in `canUseMove`, `validateServerBattleAction`, and battle hooks |
| Field (weather, terrain, rooms) | **Partial** | Common cases; not full move/ability matrix |
| Hazards | **Partial** | SR, Spikes, Toxic Spikes, Sticky Web |
| Switching, Pursuit | **Partial** | Pursuit interrupt path exists |
| Multi-hit | **Partial** | Loop + Skill Link; item interactions subset |
| PP consumption | **Full** | Per successful use (hit or miss after selection); Struggle does not consume slot PP |
| Struggle | **Full** | When all moves 0 PP; uses move data + recoil |
| Abilities | **Partial** | Entry: Intimidate, weather/terrain setters, Cloud Nine / Air Lock, **Download**, **Frisk**, **Unnerve** (see [`team-battle-abilities.ts`](../src/lib/team-battle-abilities.ts)); end-of-turn subset (e.g. Speed Boost, Shed Skin); many abilities still absent |
| Items | **Partial** | Sitrus, Lum, pinch stat berries, type-resist berries, Harvest, Focus Sash/Band, Rocky Helmet, Shell Bell, Leftovers, Black Sludge, **Oran Berry**; **Unnerve** blocks all berry triggers (see [`team-battle-items.ts`](../src/lib/team-battle-items.ts)) |
| Terastallization | **Missing** | **Product-deferred** — not started; implement only after explicit scope approval |
| Double battles | **Missing** | **Product-deferred** — singles-only architecture until approved |

## Known deltas (implementation vs cart)

- **RNG + replay artifacts:** Battle RNG is stored under RTDB `meta.battleRng` (`seed`, `state`, `calls`), initialized in [`createBattle`](src/lib/firebase-rtdb-service.ts) and advanced after each resolved turn in [`resolveTurn`](src/lib/battle-resolution.ts). Each resolved turn writes replay metadata (`p1Action`, `p2Action`, `rngBefore`, `rngAfter`, `stateHashAfter`) to `turns/{turn}/resolution` for deterministic audit/replay.
- **Server validation/normalization:** `resolveTurn` uses [`normalizeServerBattleAction`](src/lib/team-battle-engine.ts) with `meta.ruleProfile` (`simplified` default) to coerce safe edge cases (e.g. Struggle) and reject unsafe ones with explicit reason codes persisted to `public.lastValidation`.
- **Move data:** Moves load from PokeAPI via [`getMove`](src/lib/moveCache.ts); failures log `engine_warning` and skip the move. A built-in fallback exists for **Struggle** if the network fails.
- **Hydration:** [`hydrateTeam`](src/lib/battle-resolution.ts) uses embedded `pokemon.stats` on private team snapshots when present; otherwise it fetches PokeAPI with an in-process dedupe cache per species key. If fetch fails or returns no stats, **placeholder base stats (50 across)** are used so resolution can continue; HP still uses `maxHp` / `currentHp` from the snapshot when set. [`createBattle`](src/lib/firebase-rtdb-service.ts) deep-clones submitted teams so client payloads with stats are preserved verbatim in RTDB.
- **Client reconstruction:** [`FirebaseRTDBBattleEngine`](src/lib/battle-engine-rtdb.ts) builds the opponent team from **public** RTDB only (active + bench); full opponent sets are not read from the other player’s private node.

## Phased backlog (post–Tier 1)

Completed in-repo waves include: `engine_warning` styling in multiplayer/offline battle text boxes, committed move JSON fixtures (`src/lib/__tests__/fixtures/moves/`), optional HTTP smoke test with `RUN_POKEAPI_TESTS=1` ([`pokeapi-http.integration.test.ts`](../src/lib/__tests__/pokeapi-http.integration.test.ts)), hydration cache + placeholder stats, first ability trio (**Download**, **Frisk**, **Unnerve**), item additions (**Oran Berry**, Unnerve vs berries), and Encore + 0 PP **Struggle** alignment (Showdown-style).

**Product-deferred (do not implement without approval):** Terastallization and double battles remain **Missing** above.

## Maintenance

When adding or changing mechanics:

1. Implement in the module listed in the engine map.
2. Update the **Coverage status** table (and this section if behavior is intentionally non-cart).
3. Add or extend tests under `src/lib/__tests__/`.

Optional future work: a small script that counts handlers (e.g. keys in `HEALING_FRACTIONS`) for regression snapshots—not required for day-to-day development.
