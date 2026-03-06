import { getRtdbOps, type RtdbOps } from './rtdb-access';
import {
    BattleState,
    BattleAction,
    BattleTeam,
    BattlePokemon,
    buildActionQueue,
    isTeamDefeated,
    getNextAvailablePokemon,
    getCurrentPokemon,
} from './team-battle-engine';
import { processStartOfTurn, processEndOfTurn, resolveMove, resolveSwitch } from './team-battle-engine-additional';
import { createBattleRng } from './battle-rng';
import { RTDBBattleMeta, RTDBBattlePrivate, RTDBBattlePublic, RTDBChoice } from './firebase-rtdb-service';

const POKEAPI_BASE = 'https://pokeapi.co/api/v2';

const _resolvingLocks = new Set<string>();

async function fetchPokemonData(idOrName: number | string): Promise<any> {
    const res = await fetch(`${POKEAPI_BASE}/pokemon/${idOrName}`);
    if (!res.ok) throw new Error(`PokeAPI ${res.status} for pokemon/${idOrName}`);
    return res.json();
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

        const pokemon = {
            id: pokemonObj.id || fullData?.id || 0,
            name: pokemonObj.name || fullData?.name || 'unknown',
            types: (pokemonObj.types?.length ? pokemonObj.types : fullData?.types?.map((t: any) => t.type) || [{ name: 'normal' }]),
            stats: hasStats ? pokemonObj.stats : (fullData?.stats || []),
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
        const currentHp = typeof p.currentHp === 'number' && p.currentHp > 0 ? p.currentHp : maxHp;

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
        currentIndex: (p1Private as any).currentIndex ?? 0,
        faintedCount: p1HydratedTeam.filter(p => p.currentHp <= 0).length,
        sideConditions: {
            screens: mapScreens(publicState?.field?.screens?.p1),
            hazards: mapHazards(publicState?.field?.hazards?.p1),
        }
    };

    const p2Team: BattleTeam = {
        pokemon: p2HydratedTeam,
        currentIndex: (p2Private as any).currentIndex ?? 0,
        faintedCount: p2HydratedTeam.filter(p => p.currentHp <= 0).length,
        sideConditions: {
            screens: mapScreens(publicState?.field?.screens?.p2),
            hazards: mapHazards(publicState?.field?.hazards?.p2),
        }
    };

    return {
        player: p1Team, // p1 is "player" from perspective of engine for now, we'll handle perspective in execution
        opponent: p2Team, // p2 is "opponent"
        turn: meta.turn,
        rng: createBattleRng(Date.now()), // We should ideally store/retrieve RNG seed
        battleLog: [],
        isComplete: meta.phase === 'ended',
        winner: meta.winnerUid === meta.players.p1.uid ? 'player' : meta.winnerUid === meta.players.p2.uid ? 'opponent' : undefined,
        phase: 'selection', // We are resolving, so we start from selection state effectively
        actionQueue: [],
        field: {
            weather: undefined, // TODO: Map from publicState if needed
            terrain: undefined,
            rooms: {}
        }
    };
}

export async function resolveTurn(battleId: string, authToken?: string): Promise<void> {
    console.log('=== RESOLVE TURN CALLED ===', battleId);
    const ops = getRtdbOps(authToken);

    const meta = await ops.get(`battles/${battleId}/meta`) as RTDBBattleMeta;
    if (!meta) throw new Error('Battle not found');

    if (meta.phase !== 'choosing') {
        console.log(`Phase is "${meta.phase}", skipping resolution.`);
        return;
    }

    const lockKey = `${battleId}:${meta.turn}`;
    if (_resolvingLocks.has(lockKey)) {
        console.log(`In-memory lock held for ${lockKey}, skipping.`);
        return;
    }
    _resolvingLocks.add(lockKey);

    const choices = await ops.get(`battles/${battleId}/turns/${meta.turn}/choices`) as Record<string, RTDBChoice>;
    if (!choices || !choices[meta.players.p1.uid] || !choices[meta.players.p2.uid]) {
        console.log('Not all players have submitted choices yet.');
        _resolvingLocks.delete(lockKey);
        return;
    }

    console.log('Both players submitted. Resolving turn', meta.turn);
    await ops.update(`battles/${battleId}/meta`, { phase: 'resolving' });
    console.log('Phase locked to resolving.');

    // 4. Fetch Current State
    const battleState = await fetchBattleState(battleId, ops);
    if (!battleState) {
        console.error('Failed to reconstruct battle state. One or more paths missing.');
        throw new Error('Failed to reconstruct battle state');
    }
    console.log('Battle state reconstructed successfully.');

    // 4. Map Choices to BattleActions
    const p1Choice = choices[meta.players.p1.uid];
    const p2Choice = choices[meta.players.p2.uid];

    const p1Action: BattleAction = {
        type: p1Choice.action as 'move' | 'switch',
        moveId: p1Choice.payload.moveId,
        switchIndex: p1Choice.payload.switchToIndex,
        target: 'opponent' // Default target (relative to p1)
    };

    const p2Action: BattleAction = {
        type: p2Choice.action as 'move' | 'switch',
        moveId: p2Choice.payload.moveId,
        switchIndex: p2Choice.payload.switchToIndex,
        target: 'player' // Default target (relative to p2)
    };

    // 6. Build Action Queue
    // Note: buildActionQueue expects actions relative to the state's player/opponent
    // So p1Action is for state.player, p2Action is for state.opponent
    const queue = buildActionQueue(battleState, p1Action, p2Action);
    battleState.actionQueue = queue;

    // 7. Execute Actions
    let currentState = battleState;

    try {
        // Phase is already set to 'resolving' by the transaction above
        
        // Clear battle log for the new turn calculation to avoid duplicating old logs
        currentState.battleLog = [];

        // 0. Process start of turn effects
        await processStartOfTurn(currentState);

        for (const action of queue) {
            console.log('Processing action:', action);

            if (action.type === 'switch') {
                await resolveSwitch(currentState, action);
            } else if (action.type === 'move' && action.moveId) {
                await resolveMove(currentState, action);
            }

            currentState.player.faintedCount = currentState.player.pokemon.filter(p => p.currentHp <= 0).length;
            currentState.opponent.faintedCount = currentState.opponent.pokemon.filter(p => p.currentHp <= 0).length;

            if (isTeamDefeated(currentState.player) || isTeamDefeated(currentState.opponent)) {
                console.log('A team is fully defeated, stopping action queue.');
                break;
            }
        }

        // 8. End of Turn Processing
        console.log('Processing end of turn effects...');
        await processEndOfTurn(currentState);
        
        const p1Active = getCurrentPokemon(currentState.player);
        const p2Active = getCurrentPokemon(currentState.opponent);

        // 8.5. Auto-replace fainted Pokemon
        // If active Pokemon fainted, automatically send out next available Pokemon
        if (p1Active.currentHp <= 0) {
            const nextIndex = getNextAvailablePokemon(currentState.player);
            if (nextIndex !== null && nextIndex !== currentState.player.currentIndex) {
                currentState.player.currentIndex = nextIndex;
                const newPokemon = getCurrentPokemon(currentState.player);
                currentState.battleLog.push({
                    type: 'pokemon_sent_out',
                    message: `Go! ${newPokemon.pokemon.name}!`,
                    pokemon: newPokemon.pokemon.name
                });
                console.log(`Auto-replaced P1's fainted Pokemon with ${newPokemon.pokemon.name} at index ${nextIndex}`);
            }
        }

        if (p2Active.currentHp <= 0) {
            const nextIndex = getNextAvailablePokemon(currentState.opponent);
            if (nextIndex !== null && nextIndex !== currentState.opponent.currentIndex) {
                currentState.opponent.currentIndex = nextIndex;
                const newPokemon = getCurrentPokemon(currentState.opponent);
                currentState.battleLog.push({
                    type: 'pokemon_sent_out',
                    message: `Go! ${newPokemon.pokemon.name}!`,
                    pokemon: newPokemon.pokemon.name
                });
                console.log(`Auto-replaced P2's fainted Pokemon with ${newPokemon.pokemon.name} at index ${nextIndex}`);
            }
        }

        // 9. Check Win Condition
        if (isTeamDefeated(currentState.player)) {
            currentState.isComplete = true;
            currentState.winner = 'opponent';
            currentState.battleLog.push({ type: 'battle_end', message: `${meta.players.p2.name} won!` });
        } else if (isTeamDefeated(currentState.opponent)) {
            currentState.isComplete = true;
            currentState.winner = 'player';
            currentState.battleLog.push({ type: 'battle_end', message: `${meta.players.p1.name} won!` });
        }

        // 10. Save Updated State to RTDB
        // We need to map BattleState back to RTDB structure
        // This is the reverse of fetchBattleState

        // Prepare updates for meta
        const metaUpdates: any = {
            turn: meta.turn + 1,
            phase: currentState.isComplete ? 'ended' : 'choosing',
            ...(currentState.isComplete && currentState.winner && {
                winnerUid: currentState.winner === 'player' ? meta.players.p1.uid : meta.players.p2.uid
            })
        };

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
                screens: {
                    p1: currentState.player.sideConditions.screens,
                    p2: currentState.opponent.sideConditions.screens
                },
                hazards: {
                    p1: currentState.player.sideConditions.hazards,
                    p2: currentState.opponent.sideConditions.hazards
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

        console.log('Public updates:', JSON.stringify(publicUpdates, null, 2));

        await Promise.all([
            ops.update(`battles/${battleId}/meta`, metaUpdates),
            ops.update(`battles/${battleId}/private/${meta.players.p1.uid}`, p1Updates),
            ops.update(`battles/${battleId}/private/${meta.players.p2.uid}`, p2Updates),
            ops.update(`battles/${battleId}/public`, publicUpdates),
            ops.set(`battles/${battleId}/turns/${meta.turn}/choices`, null),
        ]);
        console.log('✅ RTDB updates completed successfully.');

    } catch (error: any) {
        console.error('Error during turn resolution:', error);
        
        try {
            await ops.update(`battles/${battleId}/meta`, {
                phase: 'ended',
                endedReason: `Server Error: ${error.message}`
            });
            console.log('Battle terminated due to error.');
        } catch (cleanupError) {
            console.error('Failed to terminate battle:', cleanupError);
        }
        throw error;
    } finally {
        _resolvingLocks.delete(lockKey);
    }

    console.log(`Turn ${meta.turn} resolved. New phase: ${currentState.isComplete ? 'ended' : 'choosing'}`);
}

