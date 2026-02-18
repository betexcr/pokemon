import { executeTurn } from '@/server/executeTurn';
import { rtdbService, RTDBChoice, RTDBResolution } from '@/lib/firebase-rtdb-service';
import { BattleState, BattlePokemon } from '@/lib/team-battle-engine';
import { BattleAction } from '@/lib/battleService';
import { handleBattleEnd } from './handleBattleEnd';
import { createBattleRng } from '@/lib/battle-rng';
import { EMPTY_HAZARDS, FieldSideScreens } from '@/lib/team-battle-types';

/**
 * Resolve a battle turn by executing turn logic and updating RTDB
 */
export async function resolveTurn(
  battleId: string,
  turn: number,
  choices: Record<string, RTDBChoice>
): Promise<void> {
  console.log(`🎮 Resolving turn ${turn} for battle ${battleId}`);
  
  try {
    // 1. Get current battle state from RTDB
    const battleState = await getBattleStateFromRTDB(battleId);
    
    // 2. Convert choices to actions and add to battle state
    // Note: executeTurn will build the action queue from these actions
    // For now we'll process them directly in executeTurn
    // battleState.actionQueue = convertChoicesToActions(choices, battleState);
    
    // 3. Execute turn using server logic
    const updatedState = await executeTurn(battleState);
    
    // 4. Calculate state differences for logging
    const diffs = calculateStateDiffs(battleState, updatedState);
    
    // 5. Create resolution record
    const resolution: RTDBResolution = {
      by: 'function',
      committedAt: Date.now(),
      rngSeedUsed: battleState.rng.seed,
      diffs: diffs,
      logs: updatedState.battleLog.slice(-10).map(log => 
        typeof log === 'string' ? log : log.message || ''
      ),
      stateHashAfter: hashBattleState(updatedState)
    };
    
    // 6. Write resolution to RTDB
    await rtdbService.writeResolution(battleId, turn, resolution);
    
    // 7. Update public state with new HP, status, etc
    await updatePublicStateFromBattle(battleId, updatedState);
    
    // 8. Update private states for both players
    await updatePrivateStatesFromBattle(battleId, updatedState);
    
    // 9. Check if battle is complete
    if (updatedState.isComplete) {
      console.log(`🏁 Battle ${battleId} is complete!`);
      await handleBattleEnd(battleId, updatedState);
    } else {
      // Increment turn and reset phase to 'choosing'
      await rtdbService.updateBattleMeta(battleId, {
        turn: turn + 1,
        phase: 'choosing',
        deadlineAt: Date.now() + 30000, // 30 second deadline
        version: (await rtdbService.getBattleMeta(battleId))?.version || 0 + 1
      });
    }
    
    console.log(`✅ Turn ${turn} resolved successfully`);
  } catch (error) {
    console.error(`❌ Failed to resolve turn ${turn}:`, error);
    throw error;
  }
}

/**
 * Get battle state from RTDB
 */
async function getBattleStateFromRTDB(battleId: string): Promise<BattleState> {
  const meta = await rtdbService.getBattleMeta(battleId);
  const publicState = await rtdbService.getPublicState(battleId);
  
  if (!meta || !publicState) {
    throw new Error('Battle state not found in RTDB');
  }
  
  // Get private states for both players
  const p1Private = await rtdbService.getPrivateState(battleId, meta.players.p1.uid);
  const p2Private = await rtdbService.getPrivateState(battleId, meta.players.p2.uid);
  
  if (!p1Private || !p2Private) {
    throw new Error('Private battle states not found');
  }
  
  // Convert RTDB state to BattleState format
  const emptyScreens: FieldSideScreens = {
    reflect: { turns: 0 },
    lightScreen: { turns: 0 }
  };
  
  const battleState: BattleState = {
    player: {
      pokemon: p1Private.team || [],
      currentIndex: 0,
      faintedCount: (p1Private.team || []).filter((p: any) => p.currentHp <= 0).length,
      sideConditions: {
        screens: emptyScreens,
        hazards: EMPTY_HAZARDS
      }
    },
    opponent: {
      pokemon: p2Private.team || [],
      currentIndex: 0,
      faintedCount: (p2Private.team || []).filter((p: any) => p.currentHp <= 0).length,
      sideConditions: {
        screens: emptyScreens,
        hazards: EMPTY_HAZARDS
      }
    },
    turn: meta.turn,
    rng: createBattleRng(Date.now()),
    battleLog: [],
    isComplete: false,
    phase: 'choice',
    actionQueue: [],
    field: {}
  };
  
  return battleState;
}

/**
 * Convert RTDB choices to battle actions
 */
function convertChoicesToActions(
  choices: Record<string, RTDBChoice>,
  state: BattleState
): BattleAction[] {
  const actions: BattleAction[] = [];
  
  Object.entries(choices).forEach(([uid, choice]) => {
    // Determine if this is player or opponent based on UID
    // For now, we'll use a simple mapping
    const playerId = uid;
    const playerName = `Player ${Object.keys(choices).indexOf(uid) + 1}`;
    
    if (choice.action === 'move' && choice.payload.moveId) {
      actions.push({
        type: 'move',
        playerId,
        playerName,
        moveId: choice.payload.moveId
      });
    } else if (choice.action === 'switch' && choice.payload.switchToIndex !== undefined) {
      actions.push({
        type: 'switch',
        playerId,
        playerName,
        switchIndex: choice.payload.switchToIndex
      });
    }
  });
  
  return actions;
}

/**
 * Calculate differences between battle states
 */
function calculateStateDiffs(before: BattleState, after: BattleState): any[] {
  const diffs: any[] = [];
  
  // Track HP changes
  const beforePlayerHp = before.player.pokemon[before.player.currentIndex]?.currentHp || 0;
  const afterPlayerHp = after.player.pokemon[after.player.currentIndex]?.currentHp || 0;
  
  if (beforePlayerHp !== afterPlayerHp) {
    diffs.push({
      type: 'hp_change',
      side: 'player',
      before: beforePlayerHp,
      after: afterPlayerHp,
      delta: afterPlayerHp - beforePlayerHp
    });
  }
  
  const beforeOpponentHp = before.opponent.pokemon[before.opponent.currentIndex]?.currentHp || 0;
  const afterOpponentHp = after.opponent.pokemon[after.opponent.currentIndex]?.currentHp || 0;
  
  if (beforeOpponentHp !== afterOpponentHp) {
    diffs.push({
      type: 'hp_change',
      side: 'opponent',
      before: beforeOpponentHp,
      after: afterOpponentHp,
      delta: afterOpponentHp - beforeOpponentHp
    });
  }
  
  return diffs;
}

/**
 * Create a hash of battle state for validation
 */
function hashBattleState(state: BattleState): string {
  // Create a consistent string representation of critical state
  const stateString = JSON.stringify({
    playerHp: state.player.pokemon.map(p => p.currentHp),
    opponentHp: state.opponent.pokemon.map(p => p.currentHp),
    turn: state.turn,
    isComplete: state.isComplete
  });
  
  // Simple hash function (FNV-1a)
  let hash = 2166136261;
  for (let i = 0; i < stateString.length; i++) {
    hash ^= stateString.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

/**
 * Update public state from battle state
 */
async function updatePublicStateFromBattle(battleId: string, state: BattleState): Promise<void> {
  const playerActive = state.player.pokemon[state.player.currentIndex];
  const opponentActive = state.opponent.pokemon[state.opponent.currentIndex];
  
  const updates: any = {
    p1: {
      active: {
        species: playerActive?.pokemon?.name || 'Unknown',
        level: playerActive?.level || 50,
        types: playerActive?.pokemon?.types?.map((t: any) => t.type?.name || t) || [],
        hp: {
          cur: playerActive?.currentHp || 0,
          max: playerActive?.maxHp || 100
        },
        status: playerActive?.status || null,
        boosts: {
          atk: playerActive?.statModifiers?.attack || 0,
          def: playerActive?.statModifiers?.defense || 0,
          spa: playerActive?.statModifiers?.specialAttack || 0,
          spd: playerActive?.statModifiers?.specialDefense || 0,
          spe: playerActive?.statModifiers?.speed || 0,
          acc: playerActive?.statModifiers?.accuracy || 0,
          eva: playerActive?.statModifiers?.evasion || 0
        }
      },
      benchPublic: state.player.pokemon.slice(1).map(p => ({
        species: p?.pokemon?.name || 'Unknown',
        fainted: (p?.currentHp || 0) <= 0,
        revealedMoves: []
      }))
    },
    p2: {
      active: {
        species: opponentActive?.pokemon?.name || 'Unknown',
        level: opponentActive?.level || 50,
        types: opponentActive?.pokemon?.types?.map((t: any) => t.type?.name || t) || [],
        hp: {
          cur: opponentActive?.currentHp || 0,
          max: opponentActive?.maxHp || 100
        },
        status: opponentActive?.status || null,
        boosts: {
          atk: opponentActive?.statModifiers?.attack || 0,
          def: opponentActive?.statModifiers?.defense || 0,
          spa: opponentActive?.statModifiers?.specialAttack || 0,
          spd: opponentActive?.statModifiers?.specialDefense || 0,
          spe: opponentActive?.statModifiers?.speed || 0,
          acc: opponentActive?.statModifiers?.accuracy || 0,
          eva: opponentActive?.statModifiers?.evasion || 0
        }
      },
      benchPublic: state.opponent.pokemon.slice(1).map(p => ({
        species: p?.pokemon?.name || 'Unknown',
        fainted: (p?.currentHp || 0) <= 0,
        revealedMoves: []
      }))
    },
    lastResultSummary: getLastMoveResult(state.battleLog)
  };
  
  await rtdbService.updatePublicState(battleId, updates);
}

/**
 * Update private states from battle state
 */
async function updatePrivateStatesFromBattle(battleId: string, state: BattleState): Promise<void> {
  const meta = await rtdbService.getBattleMeta(battleId);
  if (!meta) return;
  
  // Update player 1 private state
  await rtdbService.updatePrivateState(battleId, meta.players.p1.uid, {
    team: state.player.pokemon
  });
  
  // Update player 2 private state
  await rtdbService.updatePrivateState(battleId, meta.players.p2.uid, {
    team: state.opponent.pokemon
  });
}

/**
 * Get summary of last move from battle log
 */
function getLastMoveResult(battleLog: any[]): string {
  if (!battleLog || battleLog.length === 0) return '';
  
  const lastEntry = battleLog[battleLog.length - 1];
  if (typeof lastEntry === 'string') return lastEntry;
  if (lastEntry && typeof lastEntry === 'object' && 'message' in lastEntry) {
    return lastEntry.message || '';
  }
  
  return '';
}
