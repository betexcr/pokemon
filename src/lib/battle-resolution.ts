import { getRtdbOps, type RtdbOps } from './rtdb-access';
import {
    BattleState,
    BattleAction,
    BattleTeam,
    BattlePokemon,
    buildActionQueue,
    isTeamDefeated,
    getCurrentPokemon,
    validateServerBattleAction,
} from './team-battle-engine';
import { runBattleTurnFromQueue } from './team-battle-engine-additional';
import {
    battleRngFromStored,
    battleRngToStored,
    createBattleRngFromBattleKey,
} from './battle-rng';
import { RTDBBattleMeta, RTDBBattlePrivate, RTDBBattlePublic, RTDBChoice } from './firebase-rtdb-service';
import { handleBattleEnd } from './multiplayer/handleBattleEnd';

const POKEAPI_BASE = 'https://pokeapi.co/api/v2';

const _resolvingLocks = new Set<string>();

/** In-process dedupe for concurrent `hydrateTeam` fetches (same battle / species). */
const _pokemonApiInflight = new Map<string, Promise<any>>();

const PLACEHOLDER_BASE_STATS: { stat: { name: string }; base_stat: number }[] = [
    { stat: { name: 'hp' }, base_stat: 50 },
    { stat: { name: 'attack' }, base_stat: 50 },
    { stat: { name: 'defense' }, base_stat: 50 },
    { stat: { name: 'special-attack' }, base_stat: 50 },
    { stat: { name: 'special-defense' }, base_stat: 50 },
    { stat: { name: 'speed' }, base_stat: 50 },
];

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

async function hydrateTeam(team: any[]): Promise<BattlePokemon[]> {
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
            : (fullData?.stats?.length ? fullData.stats : PLACEHOLDER_BASE_STATS);

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

async function fetchBattleState(battleId: string, ops: RtdbOps): Promise<BattleState | null> {
    const meta = await ops.get(`battles/${battleId}/meta`) as RTDBBattleMeta;
    if (!meta) return null;

    const [p1Private, p2Private, publicState] = await Promise.all([
        ops.get(`battles/${battleId}/private/${meta.players.p1.uid}`) as Promise<RTDBBattlePrivate>,
        ops.get(`battles/${battleId}/private/${meta.players.p2.uid}`) as Promise<RTDBBattlePrivate>,
        ops.get(`battles/${battleId}/public`) as Promise<RTDBBattlePublic>,
    ]);

    if (!p1Private || !p2Private || !publicState) {
        console.error('fetchBattleState: Missing data', { p1: !!p1Private, p2: !!p2Private, pub: !!publicState });
        return null;
    }

    const p1RawTeam = Array.isArray(p1Private.team) ? p1Private.team : [];
    const p2RawTeam = Array.isArray(p2Private.team) ? p2Private.team : [];

    const [p1HydratedTeam, p2HydratedTeam] = await Promise.all([
        hydrateTeam(p1RawTeam),
        hydrateTeam(p2RawTeam)
    ]);

    const mapScreens = (raw: any) => ({
        reflect: raw?.reflect ? { turns: raw.reflect } : undefined,
        lightScreen: raw?.lightScreen ? { turns: raw.lightScreen } : undefined,
        auroraVeil: undefined,
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
        battleRngFromStored(meta.battleRng) ??
        createBattleRngFromBattleKey(battleId, typeof meta.turn === 'number' ? meta.turn : 1);

    return {
        player: p1Team, // p1 is "player" from perspective of engine for now, we'll handle perspective in execution
        opponent: p2Team, // p2 is "opponent"
        turn: meta.turn,
        rng,
        battleLog: [],
        isComplete: meta.phase === 'ended',
        winner: meta.winnerUid === meta.players.p1.uid ? 'player' : meta.winnerUid === meta.players.p2.uid ? 'opponent' : undefined,
        phase: 'selection', // We are resolving, so we start from selection state effectively
        actionQueue: [],
        field: {
            weather: publicState?.field?.weather ?? undefined,
            terrain: publicState?.field?.terrain ?? undefined,
            rooms: {}
        }
    };
}

export async function resolveTurn(battleId: string, authToken?: string): Promise<void> {
    const ops = getRtdbOps(authToken);

    const meta = await ops.get(`battles/${battleId}/meta`) as RTDBBattleMeta;
    if (!meta) throw new Error('Battle not found');

    if (meta.phase !== 'choosing') {
        return;
    }

    const lockKey = `${battleId}:${meta.turn}`;
    if (_resolvingLocks.has(lockKey)) {
        return;
    }
    _resolvingLocks.add(lockKey);

    const choices = await ops.get(`battles/${battleId}/turns/${meta.turn}/choices`) as Record<string, RTDBChoice>;
    if (!choices || !choices[meta.players.p1.uid] || !choices[meta.players.p2.uid]) {
        _resolvingLocks.delete(lockKey);
        return;
    }

    try {
    await ops.update(`battles/${battleId}/meta`, { phase: 'resolving' });

    // 4. Fetch Current State
    const battleState = await fetchBattleState(battleId, ops);
    if (!battleState) {
        console.error('Failed to reconstruct battle state. One or more paths missing.');
        throw new Error('Failed to reconstruct battle state');
    }
    // 4. Map Choices to BattleActions
    const p1Choice = choices[meta.players.p1.uid];
    const p2Choice = choices[meta.players.p2.uid];

    const p1Action: BattleAction = {
        type: p1Choice.action as 'move' | 'switch',
        moveId: p1Choice.payload?.moveId,
        switchIndex: p1Choice.payload?.switchToIndex,
        target: 'opponent'
    };

    const p2Action: BattleAction = {
        type: p2Choice.action as 'move' | 'switch',
        moveId: p2Choice.payload?.moveId,
        switchIndex: p2Choice.payload?.switchToIndex,
        target: 'player'
    };

    const v1 = validateServerBattleAction(battleState.player, p1Action);
    const v2 = validateServerBattleAction(battleState.opponent, p2Action);
    if (v1 || v2) {
        console.error('resolveTurn: illegal choices', { battleId, v1, v2, p1Action, p2Action });
        await handleBattleEnd(battleId, undefined, 'resolution_failed', meta, ops);
        return;
    }

    // 6. Build Action Queue
    const queue = buildActionQueue(battleState, p1Action, p2Action);
    const currentState = battleState;

        await runBattleTurnFromQueue(currentState, queue, { clearBattleLog: true });

        // 9. Check Win Condition
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

        // 10. Save Updated State to RTDB
        // We need to map BattleState back to RTDB structure
        // This is the reverse of fetchBattleState

        // Prepare updates for private nodes (team state)
        const p1Updates = {
            team: currentState.player.pokemon,
            currentIndex: currentState.player.currentIndex
        };

        const p2Updates = {
            team: currentState.opponent.pokemon,
            currentIndex: currentState.opponent.currentIndex
        };

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

        const publicUpdates: any = {
            battleLog: currentState.battleLog,
            field: {
                weather: currentState.field?.weather ?? null,
                terrain: currentState.field?.terrain ?? null,
                screens: {
                    p1: {
                        reflect: currentState.player.sideConditions.screens.reflect?.turns ?? 0,
                        lightScreen: currentState.player.sideConditions.screens.lightScreen?.turns ?? 0,
                    },
                    p2: {
                        reflect: currentState.opponent.sideConditions.screens.reflect?.turns ?? 0,
                        lightScreen: currentState.opponent.sideConditions.screens.lightScreen?.turns ?? 0,
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
                : ''
        };

        const rngStored = battleRngToStored(currentState.rng);

        if (currentState.isComplete) {
            // Write state updates (private, public, clear choices) but let
            // handleBattleEnd own the meta + Firestore + room transition.
            await Promise.all([
                ops.update(`battles/${battleId}/private/${meta.players.p1.uid}`, p1Updates),
                ops.update(`battles/${battleId}/private/${meta.players.p2.uid}`, p2Updates),
                ops.update(`battles/${battleId}/public`, publicUpdates),
                ops.update(`battles/${battleId}/meta`, { battleRng: rngStored }),
                ops.set(`battles/${battleId}/turns/${meta.turn}/choices`, null),
            ]);

            await handleBattleEnd(battleId, currentState.winner, 'victory', undefined, ops);
        } else {
            const metaUpdates: any = {
                turn: meta.turn + 1,
                phase: 'choosing',
                battleRng: rngStored,
            };

            await Promise.all([
                ops.update(`battles/${battleId}/meta`, metaUpdates),
                ops.update(`battles/${battleId}/private/${meta.players.p1.uid}`, p1Updates),
                ops.update(`battles/${battleId}/private/${meta.players.p2.uid}`, p2Updates),
                ops.update(`battles/${battleId}/public`, publicUpdates),
                ops.set(`battles/${battleId}/turns/${meta.turn}/choices`, null),
            ]);
        }

    } catch (error: unknown) {
        console.error('Error during turn resolution:', error);
        
        try {
            await handleBattleEnd(battleId, undefined, 'resolution_failed', undefined, ops);
        } catch (cleanupError) {
            console.error('Failed to terminate battle:', cleanupError);
        }
        throw error;
    } finally {
        _resolvingLocks.delete(lockKey);
    }

}

