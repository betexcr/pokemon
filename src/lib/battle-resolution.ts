import { displaySpecies, displayTypes, publicBenchEntries } from './team-battle-illusion';
import { canTerastallize, resolveTeraType } from './team-battle-tera';
import { resolveBattleAbility } from './battle-default-ability';
import { getRtdbOps, type RtdbOps } from './rtdb-access';
import {
    BattleState,
    BattleAction,
    BattleTeam,
    BattlePokemon,
    buildActionQueue,
    isTeamDefeated,
    getCurrentPokemon,
    normalizeServerBattleAction,
    type BattleRuleProfile,
} from './team-battle-engine';
import {
    applyFaintReplacements,
    getSwitchCandidates,
    resumeBattleTurnAfterSwitch,
    runBattleTurnFromQueue,
    type TurnOutcome,
} from './team-battle-engine-additional';
import {
    allRequiredChoicesPresent,
    requiredChoiceUids,
    toRtdbValue,
    type StoredPendingTurn,
} from './battle-pending-switch';
import {
    cloneBattleRng,
    battleRngFromStored,
    battleRngToStored,
    createBattleRngFromBattleKey,
} from './battle-rng';
import { RTDBBattleMeta, RTDBBattlePrivate, RTDBBattlePublic, RTDBChoice, type RTDBResolution } from './firebase-rtdb-service';
import { handleBattleEnd } from './multiplayer/handleBattleEnd';
import { hashBattleState } from './battle-replay';
import { recordResolutionDurationMs, recordHydrationFallback, recordNormalizedAction, recordIllegalActionRejected } from './battle-engine-metrics';
import { TURN_DEADLINE_MS } from './server/create-rtdb-battle';
import { claimTurn } from './battle-resolution-claim';
import {
  projectPrivateVolatiles,
  RecoverableResolutionError,
  isRecoverableResolutionFailure,
  illegalRejectMetaFields,
  softFailChoosingFields,
} from './battle-private-volatiles';
import { applyEngineExtras, captureEngineExtras, type EngineExtras } from './battle-engine-extras';

export { RecoverableResolutionError, isRecoverableResolutionFailure };

const POKEAPI_BASE = 'https://pokeapi.co/api/v2';

const _resolvingLocks = new Set<string>();

/** In-process dedupe for concurrent `hydrateTeam` fetches (same battle / species). */
const _pokemonApiInflight = new Map<string, Promise<any>>();

async function fetchPokemonData(idOrName: number | string): Promise<any> {
    const key = String(idOrName).toLowerCase();
    let inflight = _pokemonApiInflight.get(key);
    if (!inflight) {
        inflight = (async () => {
            const res = await fetch(`${POKEAPI_BASE}/pokemon/${idOrName}`);
            if (!res.ok) throw new Error(`PokeAPI ${res.status} for pokemon/${idOrName}`);
            return res.json();
        })();
        _pokemonApiInflight.set(key, inflight);
    }
    return inflight;
}

function ensureVolatile(p: any): BattlePokemon['volatile'] {
    return {
        confusion: undefined,
        substitute: undefined,
        leechSeed: false,
        choiceLock: undefined,
        encore: undefined,
        taunt: undefined,
        disable: undefined,
        protect: undefined,
        perishSong: undefined,
        flinched: false,
        binding: undefined,
        justSwitchedIn: false,
        toxicCounter: 0,
        yawn: undefined,
        aquaRing: false,
        wish: undefined,
        ...(p?.volatile || {})
    };
}

function ensureStatModifiers(p: any): BattlePokemon['statModifiers'] {
    return {
        attack: 0,
        defense: 0,
        specialAttack: 0,
        specialDefense: 0,
        speed: 0,
        accuracy: 0,
        evasion: 0,
        ...(p?.statModifiers || {})
    };
}

type HydrationStats = { placeholderStatsUsed: number; missingStats: boolean };

async function hydrateTeam(team: any[], stats?: HydrationStats): Promise<BattlePokemon[]> {
    const hydratedTeam = await Promise.all(team.map(async (p) => {
        const pokemonObj = p.pokemon || p;
        const pokemonId = pokemonObj.id || pokemonObj.name;
        const hasStats = Array.isArray(pokemonObj.stats) && pokemonObj.stats.length > 0;

        let fullData: any = null;
        if (!hasStats && pokemonId) {
            try {
                fullData = await fetchPokemonData(pokemonId);
            } catch (e) {
                console.warn(`Failed to hydrate pokemon ${pokemonId}:`, e);
            }
        }

        const resolvedStats = hasStats
            ? pokemonObj.stats
            : (fullData?.stats?.length ? fullData.stats : null);

        if (!resolvedStats?.length) {
            stats && (stats.placeholderStatsUsed += 1);
            stats && (stats.missingStats = true);
            recordHydrationFallback();
            throw new Error(`Missing base stats for pokemon ${pokemonId || 'unknown'}`);
        }

        const pokemon = {
            id: pokemonObj.id || fullData?.id || 0,
            name: pokemonObj.name || fullData?.name || 'unknown',
            types: (pokemonObj.types?.length ? pokemonObj.types : fullData?.types?.map((t: any) => t.type) || [{ name: 'normal' }]),
            stats: resolvedStats,
            weight: pokemonObj.weight || fullData?.weight || 500,
            abilities: pokemonObj.abilities || fullData?.abilities || [],
        };

        const moves = Array.isArray(p.moves) ? p.moves.map((m: any) => {
            if (typeof m === 'string') return { id: m, pp: 20, maxPp: 20 };
            return {
                id: m.id || m.name || 'tackle',
                pp: typeof m.pp === 'number' ? m.pp : 20,
                maxPp: typeof m.maxPp === 'number' ? m.maxPp : (typeof m.pp === 'number' ? m.pp : 20),
                disabled: m.disabled || false,
            };
        }) : [{ id: 'tackle', pp: 35, maxPp: 35 }];

        const hpStat = pokemon.stats.find((s: any) => (s.stat?.name || s.name) === 'hp');
        const baseHp = hpStat?.base_stat ?? 50;
        const level = typeof p.level === 'number' ? p.level : 50;
        const calculatedMaxHp = Math.floor(((2 * baseHp + 31) * level) / 100) + level + 10;
        const maxHp = typeof p.maxHp === 'number' && p.maxHp > 0 ? p.maxHp : calculatedMaxHp;
        const currentHp = typeof p.currentHp === 'number' && p.currentHp >= 0
            ? Math.min(p.currentHp, maxHp)
            : maxHp;

        return {
            pokemon,
            level,
            nature: p.nature || 'hardy',
            currentHp,
            maxHp,
            moves,
            status: p.status || undefined,
            statusTurns: p.statusTurns || 0,
            volatile: ensureVolatile(p),
            statModifiers: ensureStatModifiers(p),
            heldItem: p.heldItem || undefined,
            currentAbility: resolveBattleAbility(p, pokemon.abilities),
            // Tera state persists in the private team snapshot between turns
            teraType: resolveTeraType(p.teraType, p.originalTypes ?? pokemon.types),
            disguiseBusted: p.disguiseBusted === true || undefined,
            itemForm: typeof p.itemForm === 'string' ? p.itemForm : undefined,
            iceFaceBroken: p.iceFaceBroken === true || undefined,
            terastallized: p.terastallized === true || undefined,
            originalTypes: Array.isArray(p.originalTypes) ? p.originalTypes : undefined,
            originalAbility: p.originalAbility || resolveBattleAbility({ ability: p.ability }, pokemon.abilities),
            gender: p.gender === 'male' || p.gender === 'female' || p.gender === 'genderless' ? p.gender : undefined,
            ateBerry: p.ateBerry === true || undefined,
            consumedItem: typeof p.consumedItem === 'string' ? p.consumedItem : undefined,
            abilityChanged: p.abilityChanged === true || undefined,
        } as BattlePokemon;
    }));
    return hydratedTeam;
}

async function fetchBattleState(battleId: string, ops: RtdbOps, hydrationStats?: HydrationStats): Promise<BattleState | null> {
    const meta = await ops.get(`battles/${battleId}/meta`) as RTDBBattleMeta;
    if (!meta) return null;

    const [p1Private, p2Private, publicState, serverState] = await Promise.all([
        ops.get(`battles/${battleId}/private/${meta.players.p1.uid}`) as Promise<RTDBBattlePrivate>,
        ops.get(`battles/${battleId}/private/${meta.players.p2.uid}`) as Promise<RTDBBattlePrivate>,
        ops.get(`battles/${battleId}/public`) as Promise<RTDBBattlePublic>,
        ops.get(`battles/${battleId}/server`) as Promise<{ battleRng?: RTDBBattleMeta['battleRng']; engineExtras?: EngineExtras } | null>,
    ]);

    if (!p1Private || !p2Private || !publicState) {
        console.error('fetchBattleState: Missing data', { p1: !!p1Private, p2: !!p2Private, pub: !!publicState });
        return null;
    }

    const p1RawTeam = Array.isArray(p1Private.team) ? p1Private.team : [];
    const p2RawTeam = Array.isArray(p2Private.team) ? p2Private.team : [];

    const [p1HydratedTeam, p2HydratedTeam] = await Promise.all([
        hydrateTeam(p1RawTeam, hydrationStats),
        hydrateTeam(p2RawTeam, hydrationStats)
    ]);

    const mapScreens = (raw: any) => ({
        reflect: raw?.reflect ? { turns: raw.reflect } : undefined,
        lightScreen: raw?.lightScreen ? { turns: raw.lightScreen } : undefined,
        auroraVeil: raw?.auroraVeil ? { turns: raw.auroraVeil } : undefined,
        safeguard: undefined,
        tailwind: undefined,
    });
    const mapHazards = (raw: any) => ({
        stealthRock: raw?.sr ?? false,
        spikes: raw?.spikes ?? 0,
        toxicSpikes: raw?.tSpikes ?? 0,
        stickyWeb: raw?.web ?? false,
    });

    const p1Team: BattleTeam = {
        pokemon: p1HydratedTeam,
        currentIndex: p1Private.currentIndex ?? 0,
        faintedCount: p1HydratedTeam.filter(p => p.currentHp <= 0).length,
        teraUsed: p1Private.teraUsed === true,
        sideConditions: {
            screens: mapScreens(publicState?.field?.screens?.p1),
            hazards: mapHazards(publicState?.field?.hazards?.p1),
        }
    };

    const p2Team: BattleTeam = {
        pokemon: p2HydratedTeam,
        currentIndex: p2Private.currentIndex ?? 0,
        faintedCount: p2HydratedTeam.filter(p => p.currentHp <= 0).length,
        teraUsed: p2Private.teraUsed === true,
        sideConditions: {
            screens: mapScreens(publicState?.field?.screens?.p2),
            hazards: mapHazards(publicState?.field?.hazards?.p2),
        }
    };

    const rng =
        battleRngFromStored(serverState?.battleRng) ??
        battleRngFromStored(meta.battleRng) ?? // legacy fallback during migration
        createBattleRngFromBattleKey(battleId, typeof meta.turn === 'number' ? meta.turn : 1);

    const roomsRaw = (publicState as any)?.field?.rooms ?? {};
    const rooms: BattleState['field']['rooms'] = {};
    if (roomsRaw.trickRoom?.turns || roomsRaw.trickRoom) {
        rooms.trickRoom = { turns: typeof roomsRaw.trickRoom === 'number' ? roomsRaw.trickRoom : roomsRaw.trickRoom.turns };
    }
    if (roomsRaw.magicRoom?.turns || roomsRaw.magicRoom) {
        rooms.magicRoom = { turns: typeof roomsRaw.magicRoom === 'number' ? roomsRaw.magicRoom : roomsRaw.magicRoom.turns };
    }
    if (roomsRaw.wonderRoom?.turns || roomsRaw.wonderRoom) {
        rooms.wonderRoom = { turns: typeof roomsRaw.wonderRoom === 'number' ? roomsRaw.wonderRoom : roomsRaw.wonderRoom.turns };
    }
    if (roomsRaw.gravity?.turns || roomsRaw.gravity) {
        rooms.gravity = { turns: typeof roomsRaw.gravity === 'number' ? roomsRaw.gravity : roomsRaw.gravity.turns };
    }

    const restored: BattleState = {
        player: p1Team,
        opponent: p2Team,
        turn: meta.turn,
        rng,
        battleLog: [],
        isComplete: meta.phase === 'ended',
        winner: meta.winnerUid === meta.players.p1.uid ? 'player' : meta.winnerUid === meta.players.p2.uid ? 'opponent' : undefined,
        phase: 'selection',
        actionQueue: [],
        field: {
            weather: publicState?.field?.weather ?? undefined,
            terrain: publicState?.field?.terrain ?? undefined,
            rooms,
        }
    };
    // Tailwind, Safeguard, Mist, Healing Wish, Future Sight, Fairy Lock, ... (Admin-only)
    applyEngineExtras(restored, serverState?.engineExtras);
    return restored;
}

function privateUpdatesFromTeam(team: BattleTeam) {
    const active = getCurrentPokemon(team);
    const volatileProj = projectPrivateVolatiles(active);
    return {
        team: team.pokemon,
        currentIndex: team.currentIndex,
        teraUsed: !!team.teraUsed,
        ...volatileProj,
    };
}

function isProdLike() {
    return process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';
}

/**
 * Enforce turn timeout: if past deadline while choosing, forfeit the idle player(s).
 */
export async function enforceTurnDeadline(battleId: string, authToken?: string): Promise<boolean> {
    const ops = getRtdbOps(authToken, { requireAdmin: isProdLike() });
    const meta = await ops.get(`battles/${battleId}/meta`) as RTDBBattleMeta | null;
    if (!meta || meta.phase !== 'choosing' || !meta.deadlineAt) return false;
    if (Date.now() < meta.deadlineAt) return false;

    const choices = (await ops.get(`battles/${battleId}/turns/${meta.turn}/choices`)) as Record<string, RTDBChoice> | null;
    const p1Id = meta.players.p1.uid;
    const p2Id = meta.players.p2.uid;
    // While a pivot pick is pending only that player owes a choice; the other is never "idle"
    const required = requiredChoiceUids(meta);
    const p1Ready = !required.includes(p1Id) || !!choices?.[p1Id];
    const p2Ready = !required.includes(p2Id) || !!choices?.[p2Id];

    if (p1Ready && p2Ready) return false;

    if (!p1Ready && !p2Ready) {
        await handleBattleEnd(battleId, undefined, 'timeout', meta, ops);
        return true;
    }
    const winner = p1Ready ? 'player' : 'opponent';
    await handleBattleEnd(battleId, winner, 'timeout', meta, ops);
    return true;
}

export async function resolveTurn(battleId: string, authToken?: string): Promise<void> {
    const startedAt = Date.now();
    const ops = getRtdbOps(authToken, { requireAdmin: isProdLike() });

    const metaEarly = await ops.get(`battles/${battleId}/meta`) as RTDBBattleMeta;
    if (!metaEarly) throw new Error('Battle not found');

    if (metaEarly.phase === 'ended') return;

    if (metaEarly.phase === 'choosing' && metaEarly.deadlineAt && Date.now() > metaEarly.deadlineAt) {
        const timedOut = await enforceTurnDeadline(battleId, authToken);
        if (timedOut) return;
    }

    const choices = await ops.get(`battles/${battleId}/turns/${metaEarly.turn}/choices`) as Record<string, RTDBChoice>;
    if (!allRequiredChoicesPresent(metaEarly, choices)) {
        return;
    }

    const lockKey = `${battleId}:${metaEarly.turn}`;
    if (_resolvingLocks.has(lockKey)) {
        return;
    }
    _resolvingLocks.add(lockKey);

    try {
        const resolutionExists = !!(await ops.get(`battles/${battleId}/turns/${metaEarly.turn}/resolution`));
        if (resolutionExists) {
            return;
        }

        const claim = await claimTurn(ops, battleId, metaEarly.turn, { resolutionExists });
        if (!claim.committed) {
            return;
        }
        const meta = (claim.meta || metaEarly) as RTDBBattleMeta;

        const hydrationStats: HydrationStats = { placeholderStatsUsed: 0, missingStats: false };
        let battleState: BattleState | null;
        try {
            battleState = await fetchBattleState(battleId, ops, hydrationStats);
        } catch (hydrateErr) {
            console.error('Hydration failed (recoverable):', hydrateErr);
            const soft = softFailChoosingFields(metaEarly, TURN_DEADLINE_MS);
            if (ops.updateMulti) {
                await ops.updateMulti({
                    [`battles/${battleId}/turns/${metaEarly.turn}/choices`]: null,
                    [`battles/${battleId}/meta/phase`]: soft.phase,
                    [`battles/${battleId}/meta/resolvingStartedAt`]: soft.resolvingStartedAt,
                    [`battles/${battleId}/meta/version`]: soft.version,
                    [`battles/${battleId}/meta/deadlineAt`]: soft.deadlineAt,
                });
            } else {
                await ops.set(`battles/${battleId}/turns/${metaEarly.turn}/choices`, null);
                await ops.update(`battles/${battleId}/meta`, soft);
            }
            throw new RecoverableResolutionError(
                hydrateErr instanceof Error ? hydrateErr.message : 'Hydration failed'
            );
        }
        if (!battleState) {
            const soft = softFailChoosingFields(metaEarly, TURN_DEADLINE_MS);
            if (ops.updateMulti) {
                await ops.updateMulti({
                    [`battles/${battleId}/turns/${metaEarly.turn}/choices`]: null,
                    [`battles/${battleId}/meta/phase`]: soft.phase,
                    [`battles/${battleId}/meta/resolvingStartedAt`]: soft.resolvingStartedAt,
                    [`battles/${battleId}/meta/version`]: soft.version,
                    [`battles/${battleId}/meta/deadlineAt`]: soft.deadlineAt,
                });
            } else {
                await ops.set(`battles/${battleId}/turns/${metaEarly.turn}/choices`, null);
                await ops.update(`battles/${battleId}/meta`, soft);
            }
            throw new RecoverableResolutionError('Failed to reconstruct battle state');
        }

        const BOTH_SIDES: Array<'player' | 'opponent'> = ['player', 'opponent'];
        const currentState = battleState;
        const rngBefore = cloneBattleRng(currentState.rng);
        let p1Action: BattleAction;
        let p2Action: BattleAction;
        let validationInfo: { p1: string | null; p2: string | null; normalized: boolean };
        let outcome: TurnOutcome;
        /** 'replacement': only faint replacements are applied; the turn number does not change. */
        let segment: 'turn' | 'replacement' = 'turn';

        if (meta.pendingReplacement?.uids?.length) {
            // Picks for fainted actives at the end of the previous turn (both players may pick at once)
            segment = 'replacement';
            const sides = meta.pendingReplacement.uids.map((uid) => ({
                uid,
                side: (uid === meta.players.p1.uid ? 'player' : 'opponent') as 'player' | 'opponent',
            }));
            const requests = sides.map(({ side }) => ({
                side,
                options: getSwitchCandidates(side === 'player' ? currentState.player : currentState.opponent),
            }));
            const picks: Partial<Record<'player' | 'opponent', number>> = {};
            const illegal: Record<'p1' | 'p2', string | null> = { p1: null, p2: null };
            for (const { uid, side } of sides) {
                const choice = choices[uid];
                const idx = choice?.action === 'switch' ? choice.payload?.switchToIndex : undefined;
                const req = requests.find((r) => r.side === side)!;
                if (typeof idx === 'number' && req.options.includes(idx)) picks[side] = idx;
                else illegal[side === 'player' ? 'p1' : 'p2'] = 'illegal_replacement';
            }
            if (illegal.p1 || illegal.p2) {
                recordIllegalActionRejected();
                const rejectMeta = illegalRejectMetaFields(meta, TURN_DEADLINE_MS);
                const multi: Record<string, unknown> = {
                    [`battles/${battleId}/public/lastValidation`]: { turn: meta.turn, ...illegal, normalized: false },
                    [`battles/${battleId}/turns/${meta.turn}/choices`]: null,
                    [`battles/${battleId}/meta/phase`]: rejectMeta.phase,
                    [`battles/${battleId}/meta/resolvingStartedAt`]: rejectMeta.resolvingStartedAt,
                    [`battles/${battleId}/meta/version`]: rejectMeta.version,
                    [`battles/${battleId}/meta/deadlineAt`]: rejectMeta.deadlineAt,
                };
                if (ops.updateMulti) {
                    await ops.updateMulti(multi);
                } else {
                    await ops.set(`battles/${battleId}/turns/${meta.turn}/choices`, null);
                    await ops.update(`battles/${battleId}/public`, {
                        lastValidation: multi[`battles/${battleId}/public/lastValidation`],
                    } as any);
                    await ops.update(`battles/${battleId}/meta`, rejectMeta);
                }
                return;
            }
            currentState.pendingReplacements = requests;
            currentState.manualSwitchSides = BOTH_SIDES;
            currentState.battleLog = [];
            p1Action = { type: 'switch', switchIndex: picks.player };
            p2Action = { type: 'switch', switchIndex: picks.opponent };
            validationInfo = { p1: null, p2: null, normalized: false };
            outcome = await applyFaintReplacements(currentState, picks);
        } else if (meta.pendingSwitch) {
            // Second half of a turn paused for a pivot pick: only the pivoting player's switch counts
            const pendingUid = meta.pendingSwitch.uid;
            const side: 'player' | 'opponent' = pendingUid === meta.players.p1.uid ? 'player' : 'opponent';
            const stored = (await ops.get(`battles/${battleId}/server/pendingTurn`)) as StoredPendingTurn | null;
            const usable = stored && stored.turn === meta.turn && stored.side === side ? stored : null;
            const team = side === 'player' ? currentState.player : currentState.opponent;
            const options = usable?.options ?? getSwitchCandidates(team);
            const pick = choices[pendingUid];
            const switchIndex = pick?.action === 'switch' ? pick.payload?.switchToIndex : undefined;

            if (typeof switchIndex !== 'number' || !options.includes(switchIndex)) {
                recordIllegalActionRejected();
                const rejectMeta = illegalRejectMetaFields(meta, TURN_DEADLINE_MS);
                const sideKey = side === 'player' ? 'p1' : 'p2';
                const multi: Record<string, unknown> = {
                    [`battles/${battleId}/public/lastValidation`]: {
                        turn: meta.turn,
                        p1: sideKey === 'p1' ? 'illegal_pivot_switch' : null,
                        p2: sideKey === 'p2' ? 'illegal_pivot_switch' : null,
                        normalized: false,
                    },
                    [`battles/${battleId}/turns/${meta.turn}/choices`]: null,
                    [`battles/${battleId}/meta/phase`]: rejectMeta.phase,
                    [`battles/${battleId}/meta/resolvingStartedAt`]: rejectMeta.resolvingStartedAt,
                    [`battles/${battleId}/meta/version`]: rejectMeta.version,
                    [`battles/${battleId}/meta/deadlineAt`]: rejectMeta.deadlineAt,
                };
                if (ops.updateMulti) {
                    await ops.updateMulti(multi);
                } else {
                    await ops.set(`battles/${battleId}/turns/${meta.turn}/choices`, null);
                    await ops.update(`battles/${battleId}/public`, {
                        lastValidation: multi[`battles/${battleId}/public/lastValidation`],
                    } as any);
                    await ops.update(`battles/${battleId}/meta`, rejectMeta);
                }
                return;
            }

            if (!usable) {
                // Snapshot missing (e.g. manual cleanup): finish the turn without the rest of the queue
                console.error('resolveTurn: pending turn snapshot missing; resuming with an empty queue', { battleId, turn: meta.turn });
            }
            currentState.pendingSwitch = {
                side,
                reason: meta.pendingSwitch.reason,
                options,
                remainingQueue: usable?.remainingQueue ?? [],
                activeAtTurnStart: usable?.activeAtTurnStart,
            };
            currentState.battleLog = Array.isArray(usable?.battleLog) ? usable!.battleLog : [];
            const pivotPick: BattleAction = { type: 'switch', switchIndex, target: side === 'player' ? 'opponent' : 'player' };
            p1Action = usable?.p1Action ?? (side === 'player' ? pivotPick : { type: 'move' });
            p2Action = usable?.p2Action ?? (side === 'opponent' ? pivotPick : { type: 'move' });
            validationInfo = usable?.validation ?? { p1: null, p2: null, normalized: false };
            outcome = await resumeBattleTurnAfterSwitch(currentState, switchIndex, { manualSwitchSides: BOTH_SIDES });
        } else {
            const p1Choice = choices[meta.players.p1.uid];
            const p2Choice = choices[meta.players.p2.uid];

            const p1ActionRaw: BattleAction = {
                type: p1Choice.action as 'move' | 'switch',
                moveId: p1Choice.payload?.moveId,
                switchIndex: p1Choice.payload?.switchToIndex,
                target: 'opponent',
                terastallize: p1Choice.payload?.terastallize === true,
            };

            const p2ActionRaw: BattleAction = {
                type: p2Choice.action as 'move' | 'switch',
                moveId: p2Choice.payload?.moveId,
                switchIndex: p2Choice.payload?.switchToIndex,
                target: 'player',
                terastallize: p2Choice.payload?.terastallize === true,
            };

            const profile: BattleRuleProfile = meta.ruleProfile ?? 'simplified';
            const n1 = normalizeServerBattleAction(battleState.player, p1ActionRaw, profile);
            const n2 = normalizeServerBattleAction(battleState.opponent, p2ActionRaw, profile);
            if (n1.normalized) recordNormalizedAction();
            if (n2.normalized) recordNormalizedAction();

            if (n1.errorCode || n2.errorCode) {
                recordIllegalActionRejected();
                console.error('resolveTurn: illegal choices — rejecting and returning to choosing', {
                    battleId,
                    v1: n1.errorCode,
                    v2: n2.errorCode,
                });
                const rejectMeta = illegalRejectMetaFields(meta, TURN_DEADLINE_MS);
                const multi: Record<string, unknown> = {
                    [`battles/${battleId}/public/lastValidation`]: {
                        turn: meta.turn,
                        p1: n1.errorCode ?? null,
                        p2: n2.errorCode ?? null,
                        normalized: false,
                    },
                    [`battles/${battleId}/turns/${meta.turn}/choices`]: null,
                    [`battles/${battleId}/meta/phase`]: rejectMeta.phase,
                    [`battles/${battleId}/meta/resolvingStartedAt`]: rejectMeta.resolvingStartedAt,
                    [`battles/${battleId}/meta/version`]: rejectMeta.version,
                    [`battles/${battleId}/meta/deadlineAt`]: rejectMeta.deadlineAt,
                };
                if (ops.updateMulti) {
                    await ops.updateMulti(multi);
                } else {
                    await ops.set(`battles/${battleId}/turns/${meta.turn}/choices`, null);
                    await ops.update(`battles/${battleId}/public`, {
                        lastValidation: multi[`battles/${battleId}/public/lastValidation`],
                    } as any);
                    await ops.update(`battles/${battleId}/meta`, rejectMeta);
                }
                return;
            }

            // Terastallize only with a move, once per battle, and only with a Tera Type; otherwise drop it
            const withTera = (raw: BattleAction, action: BattleAction, team: BattleTeam) => {
                if (!raw.terastallize) return { action: { ...action, terastallize: undefined }, dropped: false };
                const ok = action.type === 'move' && canTerastallize(battleState!, team);
                return { action: { ...action, terastallize: ok ? true : undefined }, dropped: !ok };
            };
            const t1 = withTera(p1ActionRaw, n1.action, battleState.player);
            const t2 = withTera(p2ActionRaw, n2.action, battleState.opponent);
            p1Action = t1.action;
            p2Action = t2.action;
            validationInfo = {
                p1: n1.reasonCode ?? (t1.dropped ? 'tera_unavailable' : null),
                p2: n2.reasonCode ?? (t2.dropped ? 'tera_unavailable' : null),
                normalized: !!(n1.normalized || n2.normalized || t1.dropped || t2.dropped),
            };

            const queue = buildActionQueue(battleState, p1Action, p2Action);
            // Both players pick their own pivot replacements (the turn pauses; see battle-pending-switch.ts)
            outcome = await runBattleTurnFromQueue(currentState, queue, { clearBattleLog: true, manualSwitchSides: BOTH_SIDES });
        }

        const playerDefeated = isTeamDefeated(currentState.player);
        const opponentDefeated = isTeamDefeated(currentState.opponent);
        if (playerDefeated && opponentDefeated) {
            currentState.isComplete = true;
            currentState.winner = undefined;
            currentState.battleLog.push({ type: 'battle_end', message: 'Both teams fainted! The battle is a draw!' });
        } else if (playerDefeated) {
            currentState.isComplete = true;
            currentState.winner = 'opponent';
            currentState.battleLog.push({ type: 'battle_end', message: `${meta.players.p2.name} won!` });
        } else if (opponentDefeated) {
            currentState.isComplete = true;
            currentState.winner = 'player';
            currentState.battleLog.push({ type: 'battle_end', message: `${meta.players.p1.name} won!` });
        }

        const p1Updates = privateUpdatesFromTeam(currentState.player);
        const p2Updates = privateUpdatesFromTeam(currentState.opponent);

        const p1ActiveNow = getCurrentPokemon(currentState.player);
        const p2ActiveNow = getCurrentPokemon(currentState.opponent);

        const makePublicActive = (mon: typeof p1ActiveNow) => ({
            // Illusion shows the disguise to the opponent
            species: displaySpecies(mon),
            level: mon.level,
            types: displayTypes(mon),
            hp: { cur: Math.max(0, mon.currentHp), max: mon.maxHp },
            status: mon.status || null,
            boosts: {
                atk: mon.statModifiers?.attack || 0,
                def: mon.statModifiers?.defense || 0,
                spa: mon.statModifiers?.specialAttack || 0,
                spd: mon.statModifiers?.specialDefense || 0,
                spe: mon.statModifiers?.speed || 0,
                acc: mon.statModifiers?.accuracy || 0,
                eva: mon.statModifiers?.evasion || 0
            },
            // Tera is public once it happens (types above already show the Tera Type)
            ...(mon.terastallized && mon.teraType ? { terastallized: true, teraType: mon.teraType } : {}),
        });

        // Illusion-aware: the disguised slot shows the real user
        const makeBenchPublic = (team: typeof currentState.player) => publicBenchEntries(team);

        const stateHashAfter = hashBattleState(currentState);
        const replayResolution: RTDBResolution = {
            by: 'function',
            committedAt: Date.now(),
            rngSeedUsed: rngBefore.seed,
            diffs: [],
            logs: currentState.battleLog.map((l) => l.message),
            stateHashAfter,
            replay: {
                turn: meta.turn,
                p1Action: { type: p1Action.type, moveId: p1Action.moveId, switchIndex: p1Action.switchIndex, target: p1Action.target, ...(p1Action.terastallize ? { terastallize: true } : {}) },
                p2Action: { type: p2Action.type, moveId: p2Action.moveId, switchIndex: p2Action.switchIndex, target: p2Action.target, ...(p2Action.terastallize ? { terastallize: true } : {}) },
                // Live RNG state stays Admin-only under battles/.../server — do not expose in client-readable resolution
            },
            validation: validationInfo,
            metrics: {
                resolveDurationMs: Date.now() - startedAt,
                hydrationFallbackCount: hydrationStats.placeholderStatsUsed,
            }
        };

        const roomsOut: Record<string, unknown> = {};
        if (currentState.field?.rooms?.trickRoom) {
            roomsOut.trickRoom = { turns: currentState.field.rooms.trickRoom.turns };
        }
        if (currentState.field?.rooms?.magicRoom) {
            roomsOut.magicRoom = { turns: currentState.field.rooms.magicRoom.turns };
        }
        if (currentState.field?.rooms?.wonderRoom) {
            roomsOut.wonderRoom = { turns: currentState.field.rooms.wonderRoom.turns };
        }
        if (currentState.field?.rooms?.gravity) {
            roomsOut.gravity = { turns: currentState.field.rooms.gravity.turns };
        }

        const publicUpdates: any = {
            battleLog: currentState.battleLog,
            field: {
                weather: currentState.field?.weather ?? null,
                terrain: currentState.field?.terrain ?? null,
                rooms: roomsOut,
                screens: {
                    p1: {
                        reflect: currentState.player.sideConditions.screens.reflect?.turns ?? 0,
                        lightScreen: currentState.player.sideConditions.screens.lightScreen?.turns ?? 0,
                        auroraVeil: currentState.player.sideConditions.screens.auroraVeil?.turns ?? 0,
                    },
                    p2: {
                        reflect: currentState.opponent.sideConditions.screens.reflect?.turns ?? 0,
                        lightScreen: currentState.opponent.sideConditions.screens.lightScreen?.turns ?? 0,
                        auroraVeil: currentState.opponent.sideConditions.screens.auroraVeil?.turns ?? 0,
                    }
                },
                hazards: {
                    p1: {
                        sr: !!currentState.player.sideConditions.hazards.stealthRock,
                        spikes: currentState.player.sideConditions.hazards.spikes ?? 0,
                        tSpikes: currentState.player.sideConditions.hazards.toxicSpikes ?? 0,
                        web: !!currentState.player.sideConditions.hazards.stickyWeb,
                    },
                    p2: {
                        sr: !!currentState.opponent.sideConditions.hazards.stealthRock,
                        spikes: currentState.opponent.sideConditions.hazards.spikes ?? 0,
                        tSpikes: currentState.opponent.sideConditions.hazards.toxicSpikes ?? 0,
                        web: !!currentState.opponent.sideConditions.hazards.stickyWeb,
                    }
                }
            },
            p1: {
                active: makePublicActive(p1ActiveNow),
                benchPublic: makeBenchPublic(currentState.player)
            },
            p2: {
                active: makePublicActive(p2ActiveNow),
                benchPublic: makeBenchPublic(currentState.opponent)
            },
            lastResultSummary: currentState.battleLog.length > 0
                ? currentState.battleLog.map(l => l.message).join(' ')
                : '',
            lastValidation: {
                turn: meta.turn,
                ...validationInfo,
            },
        };

        const rngStored = battleRngToStored(currentState.rng);
        const engineExtras = captureEngineExtras(currentState);
        const nextVersion = (meta.version ?? 1) + 1;
        const nextDeadline = Date.now() + TURN_DEADLINE_MS;

        const replacementUids = (currentState.pendingReplacements ?? []).map((r) =>
            r.side === 'player' ? meta.players.p1.uid : meta.players.p2.uid
        );
        const pendingReplacementMeta = outcome === 'awaiting-replacement' && replacementUids.length
            ? { uids: replacementUids }
            : null;

        if (segment === 'replacement' && !currentState.isComplete) {
            // Replacements only: same turn number, players now choose this turn's actions
            // (or pick again if entry hazards knocked out a newcomer)
            const replacementMeta = {
                phase: 'choosing',
                version: nextVersion,
                deadlineAt: nextDeadline,
                resolvingStartedAt: null,
                battleRng: null,
                pendingReplacement: pendingReplacementMeta,
            };
            if (ops.updateMulti) {
                await ops.updateMulti({
                    [`battles/${battleId}/private/${meta.players.p1.uid}`]: p1Updates,
                    [`battles/${battleId}/private/${meta.players.p2.uid}`]: p2Updates,
                    [`battles/${battleId}/public`]: publicUpdates,
                    [`battles/${battleId}/server/battleRng`]: rngStored,
                    [`battles/${battleId}/server/engineExtras`]: engineExtras,
                    [`battles/${battleId}/meta/battleRng`]: null,
                    [`battles/${battleId}/meta/phase`]: 'choosing',
                    [`battles/${battleId}/meta/version`]: nextVersion,
                    [`battles/${battleId}/meta/deadlineAt`]: nextDeadline,
                    [`battles/${battleId}/meta/resolvingStartedAt`]: null,
                    [`battles/${battleId}/meta/pendingReplacement`]: pendingReplacementMeta,
                    [`battles/${battleId}/turns/${meta.turn}/choices`]: null,
                });
            } else {
                await Promise.all([
                    ops.update(`battles/${battleId}/private/${meta.players.p1.uid}`, p1Updates),
                    ops.update(`battles/${battleId}/private/${meta.players.p2.uid}`, p2Updates),
                    ops.update(`battles/${battleId}/public`, publicUpdates),
                    ops.set(`battles/${battleId}/server/battleRng`, rngStored),
                    ops.set(`battles/${battleId}/server/engineExtras`, engineExtras),
                    ops.update(`battles/${battleId}/meta`, replacementMeta),
                    ops.set(`battles/${battleId}/turns/${meta.turn}/choices`, null),
                ]);
            }
            return;
        }

        if (outcome === 'awaiting-switch' && currentState.pendingSwitch && !currentState.isComplete) {
            // Pause mid-turn: persist the state so far, keep the same turn number, and ask the pivoting
            // player for a switch. The rest of the queue stays server-side.
            const pending = currentState.pendingSwitch;
            const pendingUid = pending.side === 'player' ? meta.players.p1.uid : meta.players.p2.uid;
            const stored: StoredPendingTurn = toRtdbValue({
                turn: meta.turn,
                side: pending.side,
                reason: pending.reason,
                options: pending.options,
                remainingQueue: pending.remainingQueue ?? [],
                activeAtTurnStart: pending.activeAtTurnStart,
                battleLog: currentState.battleLog,
                p1Action,
                p2Action,
                validation: validationInfo,
            });
            const pendingMeta = { uid: pendingUid, reason: pending.reason, options: pending.options };
            if (ops.updateMulti) {
                await ops.updateMulti({
                    [`battles/${battleId}/private/${meta.players.p1.uid}`]: p1Updates,
                    [`battles/${battleId}/private/${meta.players.p2.uid}`]: p2Updates,
                    [`battles/${battleId}/public`]: publicUpdates,
                    [`battles/${battleId}/meta/battleRng`]: null,
                    [`battles/${battleId}/server/battleRng`]: rngStored,
                    [`battles/${battleId}/server/engineExtras`]: engineExtras,
                    [`battles/${battleId}/server/pendingTurn`]: stored,
                    [`battles/${battleId}/meta/phase`]: 'choosing',
                    [`battles/${battleId}/meta/version`]: nextVersion,
                    [`battles/${battleId}/meta/deadlineAt`]: nextDeadline,
                    [`battles/${battleId}/meta/resolvingStartedAt`]: null,
                    [`battles/${battleId}/meta/pendingSwitch`]: pendingMeta,
                    [`battles/${battleId}/turns/${meta.turn}/choices`]: null,
                });
            } else {
                await Promise.all([
                    ops.update(`battles/${battleId}/private/${meta.players.p1.uid}`, p1Updates),
                    ops.update(`battles/${battleId}/private/${meta.players.p2.uid}`, p2Updates),
                    ops.update(`battles/${battleId}/public`, publicUpdates),
                    ops.set(`battles/${battleId}/server/battleRng`, rngStored),
                    ops.set(`battles/${battleId}/server/engineExtras`, engineExtras),
                    ops.set(`battles/${battleId}/server/pendingTurn`, stored),
                    ops.update(`battles/${battleId}/meta`, {
                        battleRng: null,
                        phase: 'choosing',
                        version: nextVersion,
                        deadlineAt: nextDeadline,
                        resolvingStartedAt: null,
                        pendingSwitch: pendingMeta,
                    }),
                    ops.set(`battles/${battleId}/turns/${meta.turn}/choices`, null),
                ]);
            }
            return;
        }

        if (currentState.isComplete) {
            let winnerUid: string | null = null;
            if (currentState.winner === 'player') winnerUid = meta.players.p1.uid;
            else if (currentState.winner === 'opponent') winnerUid = meta.players.p2.uid;

            if (ops.updateMulti) {
                await ops.updateMulti({
                    [`battles/${battleId}/private/${meta.players.p1.uid}`]: p1Updates,
                    [`battles/${battleId}/private/${meta.players.p2.uid}`]: p2Updates,
                    [`battles/${battleId}/public`]: publicUpdates,
                    [`battles/${battleId}/meta/battleRng`]: null,
                    [`battles/${battleId}/server/battleRng`]: rngStored,
                    [`battles/${battleId}/server/engineExtras`]: engineExtras,
                    [`battles/${battleId}/meta/resolvingStartedAt`]: null,
                    [`battles/${battleId}/meta/phase`]: 'ended',
                    [`battles/${battleId}/meta/winnerUid`]: winnerUid,
                    [`battles/${battleId}/meta/endedReason`]: 'victory',
                    [`battles/${battleId}/meta/pendingSwitch`]: null,
                    [`battles/${battleId}/meta/pendingReplacement`]: null,
                    [`battles/${battleId}/server/pendingTurn`]: null,
                    [`battles/${battleId}/turns/${meta.turn}/resolution`]: replayResolution,
                    [`battles/${battleId}/turns/${meta.turn}/choices`]: null,
                });
            } else {
                await Promise.all([
                    ops.update(`battles/${battleId}/private/${meta.players.p1.uid}`, p1Updates),
                    ops.update(`battles/${battleId}/private/${meta.players.p2.uid}`, p2Updates),
                    ops.update(`battles/${battleId}/public`, publicUpdates),
                    ops.update(`battles/${battleId}/meta`, {
                        battleRng: null,
                        resolvingStartedAt: null,
                        phase: 'ended',
                        winnerUid,
                        endedReason: 'victory',
                        pendingSwitch: null,
                        pendingReplacement: null,
                    }),
                    ops.set(`battles/${battleId}/server/battleRng`, rngStored),
                    ops.set(`battles/${battleId}/server/engineExtras`, engineExtras),
                    ops.set(`battles/${battleId}/server/pendingTurn`, null),
                    ops.set(`battles/${battleId}/turns/${meta.turn}/resolution`, replayResolution),
                    ops.set(`battles/${battleId}/turns/${meta.turn}/choices`, null),
                ]);
            }
            // Firestore room + battle doc; RTDB phase already ended (idempotent)
            await handleBattleEnd(battleId, currentState.winner, 'victory', {
                ...meta,
                phase: 'ended',
                winnerUid: winnerUid ?? undefined,
                endedReason: 'victory',
            } as RTDBBattleMeta, ops);
        } else {
            const metaUpdates = {
                turn: meta.turn + 1,
                phase: 'choosing',
                version: nextVersion,
                deadlineAt: nextDeadline,
                resolvingStartedAt: null,
                battleRng: null,
                pendingSwitch: null,
                pendingReplacement: pendingReplacementMeta,
            };
            if (ops.updateMulti) {
                await ops.updateMulti({
                    [`battles/${battleId}/meta/turn`]: metaUpdates.turn,
                    [`battles/${battleId}/meta/phase`]: metaUpdates.phase,
                    [`battles/${battleId}/meta/version`]: metaUpdates.version,
                    [`battles/${battleId}/meta/deadlineAt`]: metaUpdates.deadlineAt,
                    [`battles/${battleId}/meta/resolvingStartedAt`]: null,
                    [`battles/${battleId}/meta/battleRng`]: null,
                    [`battles/${battleId}/meta/pendingSwitch`]: null,
                    [`battles/${battleId}/meta/pendingReplacement`]: pendingReplacementMeta,
                    [`battles/${battleId}/server/battleRng`]: rngStored,
                    [`battles/${battleId}/server/engineExtras`]: engineExtras,
                    [`battles/${battleId}/server/pendingTurn`]: null,
                    [`battles/${battleId}/private/${meta.players.p1.uid}`]: p1Updates,
                    [`battles/${battleId}/private/${meta.players.p2.uid}`]: p2Updates,
                    [`battles/${battleId}/public`]: publicUpdates,
                    [`battles/${battleId}/turns/${meta.turn}/resolution`]: replayResolution,
                    [`battles/${battleId}/turns/${meta.turn}/choices`]: null,
                });
            } else {
                await Promise.all([
                    ops.update(`battles/${battleId}/meta`, metaUpdates),
                    ops.set(`battles/${battleId}/server/battleRng`, rngStored),
                    ops.set(`battles/${battleId}/server/engineExtras`, engineExtras),
                    ops.set(`battles/${battleId}/server/pendingTurn`, null),
                    ops.update(`battles/${battleId}/private/${meta.players.p1.uid}`, p1Updates),
                    ops.update(`battles/${battleId}/private/${meta.players.p2.uid}`, p2Updates),
                    ops.update(`battles/${battleId}/public`, publicUpdates),
                    ops.set(`battles/${battleId}/turns/${meta.turn}/resolution`, replayResolution),
                    ops.set(`battles/${battleId}/turns/${meta.turn}/choices`, null),
                ]);
            }
        }
    } catch (error: unknown) {
        console.error('Error during turn resolution:', error);
        const turn = metaEarly?.turn;
        let resolutionExists = false;
        try {
            if (typeof turn === 'number') {
                resolutionExists = !!(await ops.get(`battles/${battleId}/turns/${turn}/resolution`));
            }
        } catch {
            /* ignore */
        }

        // Never soft-reset to choosing after an authoritative resolution was written
        if (resolutionExists) {
            try {
                await handleBattleEnd(battleId, undefined, 'victory', undefined, ops);
            } catch (cleanupError) {
                console.error('Failed to finalize ended battle after resolution:', cleanupError);
            }
            throw error;
        }

        const recoverable = isRecoverableResolutionFailure(error);

        if (recoverable) {
            // Soft-fail writes already happened in hydrate path; ensure choosing if needed
            try {
                const soft = softFailChoosingFields(metaEarly || { version: 1 }, TURN_DEADLINE_MS);
                if (ops.updateMulti && typeof turn === 'number') {
                    await ops.updateMulti({
                        [`battles/${battleId}/turns/${turn}/choices`]: null,
                        [`battles/${battleId}/meta/phase`]: soft.phase,
                        [`battles/${battleId}/meta/resolvingStartedAt`]: soft.resolvingStartedAt,
                        [`battles/${battleId}/meta/version`]: soft.version,
                        [`battles/${battleId}/meta/deadlineAt`]: soft.deadlineAt,
                    });
                } else {
                    if (typeof turn === 'number') {
                        await ops.set(`battles/${battleId}/turns/${turn}/choices`, null);
                    }
                    await ops.update(`battles/${battleId}/meta`, soft);
                }
            } catch {
                /* ignore */
            }
            throw error;
        }

        // Hard-fail: end without bouncing through choosing
        try {
            await handleBattleEnd(battleId, undefined, 'resolution_failed', undefined, ops);
        } catch (cleanupError) {
            console.error('Failed to terminate battle:', cleanupError);
        }
        throw error;
    } finally {
        recordResolutionDurationMs(Date.now() - startedAt);
        _resolvingLocks.delete(lockKey);
    }
}

/** @internal exported for unit tests */
export const __test__ = {
    hydrateTeam,
    projectPrivateVolatiles,
    fetchBattleState,
};
