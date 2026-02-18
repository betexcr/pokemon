import { getDatabase } from 'firebase-admin/database';
import {
    BattleState,
    BattleAction,
    BattleTeam,
    BattlePokemon,
    buildActionQueue,
    executeAction,
    processEndOfTurnStatus,
    isTeamDefeated,
    getNextAvailablePokemon,
    switchToPokemon,
    getCurrentPokemon,
    calculateDamageDetailed
} from './team-battle-engine';
import { processStartOfTurn, processEndOfTurn } from './team-battle-engine-additional';
import { createBattleRng, normalizeBattleRng } from './battle-rng';
import { RTDBBattleMeta, RTDBBattlePrivate, RTDBBattlePublic, RTDBChoice } from './firebase-rtdb-service';

// Helper to hydrate team with full Pokemon data (stats, types) from PokeAPI
async function hydrateTeam(team: BattlePokemon[]): Promise<BattlePokemon[]> {
    const hydratedTeam = await Promise.all(team.map(async (p) => {
        // If we already have stats and types, no need to fetch
        if (p.pokemon.stats?.length && p.pokemon.types?.length) {
            return p;
        }
        // Otherwise return as-is (hydration would happen here if needed)
        return p;
    }));
    return hydratedTeam;
}

async function fetchBattleState(battleId: string): Promise<BattleState | null> {
    const db = getDatabase();

    const metaRef = db.ref(`battles/${battleId}/meta`);
    const metaSnap = await metaRef.once('value');
    const meta = metaSnap.val() as RTDBBattleMeta;

    if (!meta) return null;

    const p1PrivateRef = db.ref(`battles/${battleId}/private/${meta.players.p1.uid}`);
    const p2PrivateRef = db.ref(`battles/${battleId}/private/${meta.players.p2.uid}`);
    const publicRef = db.ref(`battles/${battleId}/public`);

    const [p1Snap, p2Snap, publicSnap] = await Promise.all([
        p1PrivateRef.once('value'),
        p2PrivateRef.once('value'),
        publicRef.once('value')
    ]);

    if (!p1Snap.exists() || !p2Snap.exists() || !publicSnap.exists()) {
        console.error('fetchBattleState: Missing data snapshots');
        console.error('P1 Private exists:', p1Snap.exists());
        console.error('P2 Private exists:', p2Snap.exists());
        console.error('Public exists:', publicSnap.exists());
        return null;
    }

    const p1Private = p1Snap.val() as RTDBBattlePrivate;
    const p2Private = p2Snap.val() as RTDBBattlePrivate;
    const publicState = publicSnap.val() as RTDBBattlePublic;

    // Hydrate teams with missing data (stats, types, etc.)
    const [p1HydratedTeam, p2HydratedTeam] = await Promise.all([
        hydrateTeam(p1Private.team),
        hydrateTeam(p2Private.team)
    ]);

    // Reconstruct BattleState
    // Note: This is a simplified reconstruction. In a real app, you'd need a robust mapper.
    // We assume the private state holds the authoritative "current" state for simplicity here,
    // but ideally we should merge with any public volatile state if that's separate.

    // We need to ensure the teams are in the correct format for BattleState
    const p1Team: BattleTeam = {
        pokemon: p1HydratedTeam, // Use hydrated team
        // Use saved currentIndex if available, otherwise default to 0
        currentIndex: p1Private.currentIndex ?? 0,
        faintedCount: p1Private.team.filter((p: any) => p.currentHp <= 0).length,
        sideConditions: {
            screens: publicState.field.screens.p1,
            hazards: publicState.field.hazards.p1
        }
    };

    const p2Team: BattleTeam = {
        pokemon: p2HydratedTeam, // Use hydrated team
        currentIndex: p2Private.currentIndex ?? 0,
        faintedCount: p2Private.team.filter((p: any) => p.currentHp <= 0).length,
        sideConditions: {
            screens: publicState.field.screens.p2,
            hazards: publicState.field.hazards.p2
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

export async function resolveTurn(battleId: string): Promise<void> {
    console.log('=== RESOLVE TURN CALLED ===', battleId);
    console.log('Getting database reference...');
    const db = getDatabase();
    const metaRef = db.ref(`battles/${battleId}/meta`);
    console.log('Database reference obtained');

    // 1. Fetch Meta to get turn and players
    const metaSnap = await metaRef.once('value');
    if (!metaSnap.exists()) throw new Error('Battle not found');

    const meta = metaSnap.val() as RTDBBattleMeta;

    if (meta.phase !== 'choosing') {
        console.warn('Battle not in choosing phase, skipping resolution');
        return;
    }

    // 2. Fetch Choices
    const choicesRef = db.ref(`battles/${battleId}/turns/${meta.turn}/choices`);
    const choicesSnap = await choicesRef.once('value');
    const choices = choicesSnap.val() as Record<string, RTDBChoice>;

    if (!choices || !choices[meta.players.p1.uid] || !choices[meta.players.p2.uid]) {
        console.log('Not all players have submitted choices yet.');
        console.log('P1 submitted:', !!(choices && choices[meta.players.p1.uid]));
        console.log('P2 submitted:', !!(choices && choices[meta.players.p2.uid]));
        return;
    }

    console.log('✅ Both players submitted choices. Starting resolution...');
    console.log('Current meta:', JSON.stringify(meta, null, 2));

    // 3. Attempt to transition to 'resolving' phase atomically
    // This prevents race conditions where multiple requests try to resolve the same turn
    const { committed, snapshot } = await metaRef.transaction((currentMeta) => {
        console.log('🔄 Transaction callback - currentMeta:', currentMeta);
        console.log('🔄 Expected turn:', meta.turn);
        
        // Firebase Admin SDK may pass null on first read - use our fetched meta as baseline
        const metaToCheck = currentMeta || meta;
        
        if (metaToCheck.phase === 'choosing' && metaToCheck.turn === meta.turn) {
            console.log('✅ Transaction conditions met - updating phase to resolving');
            return { ...metaToCheck, phase: 'resolving' };
        }
        
        console.log('❌ Transaction conditions NOT met:', {
            hasCurrentMeta: !!currentMeta,
            currentPhase: metaToCheck?.phase,
            currentTurn: metaToCheck?.turn,
            expectedTurn: meta.turn
        });
        return undefined; // Abort if not in choosing phase or turn changed
    });

    if (!committed) {
        console.warn('❌ Battle resolution aborted: Phase already changed or concurrent resolution.');
        console.warn('Committed:', committed);
        return;
    }
    console.log('✅ Transaction committed successfully');

    // Update local meta with the committed snapshot
    const lockedMeta = snapshot.val() as RTDBBattleMeta;
    console.log('Phase locked to resolving. Proceeding with calculation...');

    // 4. Fetch Current State
    const battleState = await fetchBattleState(battleId);
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
            const userTeam = action.user === 'player' ? currentState.player : currentState.opponent;
            const targetTeam = action.user === 'player' ? currentState.opponent : currentState.player;
            const userPokemon = getCurrentPokemon(userTeam);
            const targetPokemon = getCurrentPokemon(targetTeam);

            if (action.type === 'move' && action.moveId) {
                const move = userPokemon.moves.find(m => m.id === action.moveId); // Match by ID

                if (move) {
                    currentState.battleLog.push({
                        type: 'move_used',
                        message: `${userPokemon.pokemon.name} used ${move.id}!`, // Use ID or name
                        pokemon: userPokemon.pokemon.name,
                        move: move.id
                    });

                    // Calculate damage
                    console.log('Calculating damage for:', move.id);
                    const result = await calculateDamageDetailed(userPokemon, targetPokemon, { name: move.id } as any, currentState);
                    console.log('Damage result:', result);

                    // Apply damage
                    targetPokemon.currentHp = Math.max(0, targetPokemon.currentHp - result.damage);

                    currentState.battleLog.push({
                        type: 'damage_dealt',
                        message: `It dealt ${result.damage} damage!`,
                        damage: result.damage,
                        effectiveness: result.effectiveness > 1 ? 'super_effective' : result.effectiveness < 1 ? 'not_very_effective' : 'normal'
                    });

                    // Check if Pokemon fainted
                    if (targetPokemon.currentHp <= 0) {
                        currentState.battleLog.push({
                            type: 'pokemon_fainted',
                            message: `${targetPokemon.pokemon.name} fainted!`,
                            pokemon: targetPokemon.pokemon.name
                        });
                        // Update fainted count
                        targetTeam.faintedCount = targetTeam.pokemon.filter(p => p.currentHp <= 0).length;
                        console.log(`Pokemon fainted! Updated fainted count to ${targetTeam.faintedCount}`);
                    }
                } else {
                    console.warn('Move not found for action:', action);
                }
            } else if (action.type === 'switch' && action.switchIndex !== undefined) {
                 // Handle switch
                 currentState.battleLog.push({
                    type: 'switch',
                    message: `${userPokemon.pokemon.name} switched out!`,
                    pokemon: userPokemon.pokemon.name
                 });

                 // Update active index
                 userTeam.currentIndex = action.switchIndex;
                 const newPokemon = getCurrentPokemon(userTeam);

                 currentState.battleLog.push({
                    type: 'switch',
                    message: `Go! ${newPokemon.pokemon.name}!`,
                    pokemon: newPokemon.pokemon.name
                 });
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

        // Update Meta
        const metaUpdates: any = {
        console.log('Public updates:', publicUpdates);

        await Promise.all([
            metaRef.update(metaUpdates),
            db.ref(`battles/${battleId}/private/${meta.players.p1.uid}`).update(p1Updates),
            db.ref(`battles/${battleId}/private/${meta.players.p2.uid}`).update(p2Updates),
            db.ref(`battles/${battleId}/public`).update(publicUpdates),
            // Clear choices for next turn
            db.ref(`battles/${battleId}/turns/${meta.turn}/choices`).remove()
        ]);
        console.log('✅ RTDB updates completed successfully.');

    } catch (error: any) {
        console.error('❌ Error during turn resolution:', error);
        
        // Attempt to set battle to ended state with error
        try {
            await metaRef.update({
                phase: 'ended',
                endedReason: `Server Error: ${error.message}`
            });
            console.log('⚠️ Battle terminated due to error.');
        } catch (cleanupError) {
            console.error('❌ Failed to terminate battle:', cleanupError);
        }
        throw error;
    }

    console.log(`Turn ${meta.turn} resolved. New phase: ${currentState.isComplete ? 'ended' : 'choosing'}`);
}

