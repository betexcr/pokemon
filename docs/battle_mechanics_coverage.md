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
| Status conditions | **Partial** | Sleep/freeze/para/burn/poison/toxic; durations simplified |
| Volatiles (confusion, substitute, etc.) | **Partial** | Subset implemented |
| Field (weather, terrain, rooms) | **Partial** | Common cases; not full move/ability matrix |
| Hazards | **Partial** | SR, Spikes, Toxic Spikes, Sticky Web |
| Switching, Pursuit | **Partial** | Pursuit interrupt path exists |
| Multi-hit | **Partial** | Loop + Skill Link; item interactions subset |
| PP consumption | **Full** | Per successful use (hit or miss after selection); Struggle does not consume slot PP |
| Struggle | **Full** | When all moves 0 PP; uses move data + recoil |
| Abilities | **Partial** | Handlers scattered; many abilities absent |
| Items | **Partial** | Berries, common held items subset |
| Terastallization | **Missing** | Not modeled |
| Double battles | **Missing** | Singles-oriented |

## Known deltas (implementation vs cart)

- **RNG:** [`fetchBattleState`](src/lib/battle-resolution.ts) creates a new RNG seed each resolution; seed is not stored in RTDB, so battles are not bit-reproducible from stored state alone.
- **Move data:** Moves load from PokeAPI via [`getMove`](src/lib/moveCache.ts); failures log `engine_warning` and skip the move. A built-in fallback exists for **Struggle** if the network fails.
- **Hydration:** Battle reconstruction may call PokeAPI for Pokémon without full stats (see `hydrateTeam` in battle-resolution).
- **Server validation:** Move legality is primarily client-side; optional hardening on submit is a follow-up.

## Maintenance

When adding or changing mechanics:

1. Implement in the module listed in the engine map.
2. Update the **Coverage status** table (and this section if behavior is intentionally non-cart).
3. Add or extend tests under `src/lib/__tests__/`.

Optional future work: a small script that counts handlers (e.g. keys in `HEALING_FRACTIONS`) for regression snapshots—not required for day-to-day development.
