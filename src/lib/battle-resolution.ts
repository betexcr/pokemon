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
import { runBattleTurnFromQueue } from './team-battle-engine-additional';
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
        ops.get(`battles/${battleId}/server`) as Promise<{ battleRng?: RTDBBattleMeta['battleRng'] } | null>,
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
        sideConditions: {
            screens: mapScreens(publicState?.field?.screens?.p1),
            hazards: mapHazards(publicState?.field?.hazards?.p1),
        }
    };

    const p2Team: BattleTeam = {
        pokemon: p2HydratedTeam,
        currentIndex: p2Private.currentIndex ?? 0,
        faintedCount: p2HydratedTeam.filter(p => p.currentHp <= 0).length,
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

    return {
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
}

function privateUpdatesFromTeam(team: BattleTeam) {
    const active = getCurrentPokemon(team);
    const volatileProj = projectPrivateVolatiles(active);
    return {
        team: team.pokemon,
        currentIndex: team.currentIndex,
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
    const p1Ready = !!choices?.[p1Id];
    const p2Ready = !!choices?.[p2Id];

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
    if (!choices || !choices[metaEarly.players.p1.uid] || !choices[metaEarly.players.p2.uid]) {
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

        const p1Choice = choices[meta.players.p1.uid];
        const p2Choice = choices[meta.players.p2.uid];

        const p1ActionRaw: BattleAction = {
            type: p1Choice.action as 'move' | 'switch',
            moveId: p1Choice.payload?.moveId,
            switchIndex: p1Choice.payload?.switchToIndex,
            target: 'opponent'
        };

        const p2ActionRaw: BattleAction = {
            type: p2Choice.action as 'move' | 'switch',
            moveId: p2Choice.payload?.moveId,
            switchIndex: p2Choice.payload?.switchToIndex,
            target: 'player'
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

        const p1Action = n1.action;
        const p2Action = n2.action;

        const queue = buildActionQueue(battleState, p1Action, p2Action);
        const currentState = battleState;
        const rngBefore = cloneBattleRng(currentState.rng);

        await runBattleTurnFromQueue(currentState, queue, { clearBattleLog: true });

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
            species: mon.pokemon.name,
            level: mon.level,
            types: (mon.pokemon.types || []).map((t: any) => typeof t === 'string' ? t : t.type?.name || t.name || 'normal'),
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
            }
        });

        const makeBenchPublic = (team: typeof currentState.player) =>
            team.pokemon
                .filter((_, i) => i !== team.currentIndex)
                .map((mon) => ({
                    species: mon.pokemon.name,
                    fainted: mon.currentHp <= 0,
                    revealedMoves: mon.moves.map(m => m.id).slice(0, 4)
                }));

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
                p1Action: { type: p1Action.type, moveId: p1Action.moveId, switchIndex: p1Action.switchIndex, target: p1Action.target },
                p2Action: { type: p2Action.type, moveId: p2Action.moveId, switchIndex: p2Action.switchIndex, target: p2Action.target },
                // Live RNG state stays Admin-only under battles/.../server — do not expose in client-readable resolution
            },
            validation: {
                p1: n1.reasonCode,
                p2: n2.reasonCode,
                normalized: !!(n1.normalized || n2.normalized),
            },
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
                p1: n1.reasonCode ?? null,
                p2: n2.reasonCode ?? null,
                normalized: !!(n1.normalized || n2.normalized),
            },
        };

        const rngStored = battleRngToStored(currentState.rng);
        const nextVersion = (meta.version ?? 1) + 1;
        const nextDeadline = Date.now() + TURN_DEADLINE_MS;

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
                    [`battles/${battleId}/meta/resolvingStartedAt`]: null,
                    [`battles/${battleId}/meta/phase`]: 'ended',
                    [`battles/${battleId}/meta/winnerUid`]: winnerUid,
                    [`battles/${battleId}/meta/endedReason`]: 'victory',
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
                    }),
                    ops.set(`battles/${battleId}/server/battleRng`, rngStored),
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
            };
            if (ops.updateMulti) {
                await ops.updateMulti({
                    [`battles/${battleId}/meta/turn`]: metaUpdates.turn,
                    [`battles/${battleId}/meta/phase`]: metaUpdates.phase,
                    [`battles/${battleId}/meta/version`]: metaUpdates.version,
                    [`battles/${battleId}/meta/deadlineAt`]: metaUpdates.deadlineAt,
                    [`battles/${battleId}/meta/resolvingStartedAt`]: null,
                    [`battles/${battleId}/meta/battleRng`]: null,
                    [`battles/${battleId}/server/battleRng`]: rngStored,
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
