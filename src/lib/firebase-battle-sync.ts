import { BattleState, BattleAction, BattleTeam, BattlePokemon, processBattleTurn } from './team-battle-engine';
import { battleService, MultiplayerBattleState } from './battleService';
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  serverTimestamp,
  type Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';

export interface FirebaseBattleSyncConfig {
  battleId: string;
  playerId: string;
  isHost: boolean;
}

export interface SyncStatus {
  isConnected: boolean;
  lastSync: number;
  pendingActions: number;
  conflicts: number;
  latency: number;
}

export interface BattleStateUpdate {
  battleId: string;
  playerId: string;
  state: BattleState;
  turn: number;
  phase: 'choice' | 'resolution' | 'end_of_turn' | 'replacement';
  timestamp: number;
}

export interface ActionSelectionUpdate {
  battleId: string;
  playerId: string;
  action: BattleAction;
  turn: number;
  timestamp: number;
}

export class FirebaseBattleSyncManager {
  private config: FirebaseBattleSyncConfig;
  private currentState: BattleState | null = null;
  private lastServerState: BattleState | null = null;
  private pendingActions: Map<string, BattleAction> = new Map();
  private syncStatus: SyncStatus = {
    isConnected: false,
    lastSync: 0,
    pendingActions: 0,
    conflicts: 0,
    latency: 0
  };
  private stateChangeCallbacks: Set<(state: BattleState) => void> = new Set();
  private syncStatusCallbacks: Set<(status: SyncStatus) => void> = new Set();
  private battleUnsubscribe: Unsubscribe | null = null;
  private conflictResolutionStrategy: 'client' | 'server' | 'merge' = 'server';

  constructor(config: FirebaseBattleSyncConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    console.log('🔥 Initializing Firebase Battle Sync Manager');
    
    try {
      // Set up Firebase real-time listeners
      this.setupFirebaseListeners();
      this.updateSyncStatus({ isConnected: true });
      console.log('✅ Firebase Battle Sync Manager initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Firebase battle sync:', error);
      this.updateSyncStatus({ isConnected: false });
      throw error;
    }
  }

  private setupFirebaseListeners(): void {
    // Listen to battle changes
    this.battleUnsubscribe = battleService.onBattleChange(
      this.config.battleId,
      (battle: MultiplayerBattleState | null) => {
        if (battle) {
          this.handleBattleUpdate(battle);
        }
      }
    );
  }

  private handleBattleUpdate(battle: MultiplayerBattleState): void {
    console.log('📥 Received battle update from Firebase:', {
      turnNumber: battle.turnNumber,
      status: battle.status,
      phase: battle.phase,
      actionsCount: battle.actions?.length || 0
    });

    // Extract battle state from battle data
    if (battle.battleData) {
      const battleState = battle.battleData as BattleState;
      this.handleBattleStateUpdate(battleState);
    }

    // Handle action updates
    if (battle.actions && battle.actions.length > 0) {
      this.handleActionsUpdate(battle.actions);
    }

    this.updateSyncStatus({ lastSync: Date.now() });
  }

  private handleBattleStateUpdate(state: BattleState): void {
    console.log('🔄 Processing battle state update:', {
      turn: state.turn,
      phase: state.phase,
      isComplete: state.isComplete
    });

    // Check for conflicts
    if (this.currentState && this.hasStateConflict(this.currentState, state)) {
      console.warn('⚠️ State conflict detected, resolving...');
      this.resolveStateConflict(this.currentState, state);
    } else {
      this.currentState = state;
      this.notifyStateChange(state);
    }
  }

  private handleActionsUpdate(actions: any[]): void {
    console.log('🎯 Processing actions update:', actions.length, 'actions');
    
    // Find actions for current turn
    const currentTurnActions = actions.filter(action => 
      action.turn === this.currentState?.turn
    );

    if (currentTurnActions.length >= 2) {
      // Both players have made actions, trigger resolution
      this.notifyActionsReady(currentTurnActions);
    }
  }

  private hasStateConflict(localState: BattleState, serverState: BattleState): boolean {
    // Compare critical state properties
    return (
      localState.turn !== serverState.turn ||
      localState.phase !== serverState.phase ||
      localState.isComplete !== serverState.isComplete ||
      this.hasTeamConflict(localState.player, serverState.player) ||
      this.hasTeamConflict(localState.opponent, serverState.opponent)
    );
  }

  private hasTeamConflict(localTeam: BattleTeam, serverTeam: BattleTeam): boolean {
    if (localTeam.currentIndex !== serverTeam.currentIndex) return true;
    if (localTeam.faintedCount !== serverTeam.faintedCount) return true;

    // Check Pokemon states
    for (let i = 0; i < localTeam.pokemon.length; i++) {
      const localPokemon = localTeam.pokemon[i];
      const serverPokemon = serverTeam.pokemon[i];
      
      if (localPokemon.currentHp !== serverPokemon.currentHp) return true;
      if (localPokemon.status !== serverPokemon.status) return true;
    }

    return false;
  }

  private resolveStateConflict(localState: BattleState, serverState: BattleState): void {
    this.syncStatus.conflicts++;

    switch (this.conflictResolutionStrategy) {
      case 'server':
        console.log('🔄 Resolving conflict: using server state');
        this.currentState = serverState;
        this.notifyStateChange(serverState);
        break;

      case 'client':
        console.log('🔄 Resolving conflict: using client state');
        this.syncStateToFirebase(localState);
        break;

      case 'merge':
        console.log('🔄 Resolving conflict: merging states');
        this.mergeStates(localState, serverState);
        break;
    }

    this.updateSyncStatus({ conflicts: this.syncStatus.conflicts });
  }

  private mergeStates(localState: BattleState, serverState: BattleState): BattleState {
    // Implement intelligent state merging
    const mergedState: BattleState = {
      ...serverState,
      battleLog: [...serverState.battleLog, ...localState.battleLog.filter(log => 
        !serverState.battleLog.some(serverLog => 
          serverLog.message === log.message && serverLog.turn === log.turn
        )
      )]
    };

    this.currentState = mergedState;
    this.notifyStateChange(mergedState);
    return mergedState;
  }

  setBattleState(state: BattleState): void {
    const previousState = this.currentState;
    this.currentState = state;

    // Notify callbacks
    this.stateChangeCallbacks.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('❌ Error in state change callback:', error);
      }
    });

    // Sync to Firebase if we're the host or if this is a local action
    if (this.config.isHost || this.isLocalAction(previousState, state)) {
      this.syncStateToFirebase(state);
    }
  }

  private isLocalAction(previousState: BattleState | null, currentState: BattleState): boolean {
    if (!previousState) return false;

    // Check if this is a move selection or pokemon switch
    return (
      currentState.phase === 'selection' && previousState.phase === 'execution' ||
      currentState.needsPokemonSelection !== previousState.needsPokemonSelection
    );
  }

  private async syncStateToFirebase(state: BattleState): Promise<void> {
    try {
      console.log('📤 Syncing battle state to Firebase');
      
      // Update the battle with the new state
      const updateData: any = {
        battleData: state,
        status: state.isComplete ? 'completed' : 'active'
      };
      
      // Only include turnNumber if it's defined
      if (state.turnNumber !== undefined) {
        updateData.turnNumber = state.turnNumber;
      }
      
      await battleService.updateBattle(this.config.battleId, updateData);

      this.updateSyncStatus({ lastSync: Date.now() });
    } catch (error) {
      console.error('❌ Failed to sync state to Firebase:', error);
    }
  }

  async selectMove(moveId: string, moveName: string): Promise<void> {
    if (!this.currentState) {
      throw new Error('No battle state available');
    }

    console.log('🎯 Selecting move:', moveName, 'for turn', this.currentState.turn);

    const action: BattleAction = {
      type: 'move',
      moveId,
      target: 'opponent'
    };

    // Store as pending action
    const actionId = `${Date.now()}-${moveId}`;
    this.pendingActions.set(actionId, action);
    this.updateSyncStatus({ pendingActions: this.pendingActions.size });

    try {
      // Add action to Firebase
      await battleService.addAction(this.config.battleId, {
        playerId: this.config.playerId,
        playerName: 'Player', // You might want to get the actual player name
        type: 'move',
        moveId,
        moveName
      });

      console.log('✅ Move selection sent to Firebase');
    } catch (error) {
      console.error('❌ Failed to send move selection:', error);
      this.pendingActions.delete(actionId);
      this.updateSyncStatus({ pendingActions: this.pendingActions.size });
      throw error;
    }
  }

  async switchPokemon(pokemonIndex: number): Promise<void> {
    if (!this.currentState) {
      throw new Error('No battle state available');
    }

    console.log('🔄 Switching to Pokemon:', pokemonIndex);

    const action: BattleAction = {
      type: 'switch',
      switchIndex: pokemonIndex,
      target: 'player'
    };

    // Store as pending action
    const actionId = `${Date.now()}-switch-${pokemonIndex}`;
    this.pendingActions.set(actionId, action);
    this.updateSyncStatus({ pendingActions: this.pendingActions.size });

    try {
      // Add action to Firebase
      await battleService.addAction(this.config.battleId, {
        playerId: this.config.playerId,
        playerName: 'Player', // You might want to get the actual player name
        type: 'switch',
        switchIndex: pokemonIndex
      });

      console.log('✅ Pokemon switch action sent to Firebase');
    } catch (error) {
      console.error('❌ Failed to send pokemon switch:', error);
      this.pendingActions.delete(actionId);
      this.updateSyncStatus({ pendingActions: this.pendingActions.size });
      throw error;
    }
  }

  private notifyStateChange(state: BattleState): void {
    this.stateChangeCallbacks.forEach(handler => {
      try {
        handler(state);
      } catch (error) {
        console.error('❌ Error in state change handler:', error);
      }
    });
  }

  private async notifyActionsReady(actions: any[]): Promise<void> {
    console.log('⚡ Both actions ready - triggering resolution:', actions);
    
    if (this.currentState) {
      // Convert Firebase actions to BattleActions
      const playerAction = actions.find(action => action.playerId === this.config.playerId);
      const opponentAction = actions.find(action => action.playerId !== this.config.playerId);
      
      if (playerAction && opponentAction) {
        const playerBattleAction: BattleAction = {
          type: playerAction.type,
          moveId: playerAction.moveId,
          switchIndex: playerAction.switchIndex,
          target: playerAction.type === 'move' ? 'opponent' : 'player'
        };
        
        const opponentBattleAction: BattleAction = {
          type: opponentAction.type,
          moveId: opponentAction.moveId,
          switchIndex: opponentAction.switchIndex,
          target: opponentAction.type === 'move' ? 'player' : 'opponent'
        };
        
        console.log('🔄 Processing battle turn with actions:', { playerAction: playerBattleAction, opponentAction: opponentBattleAction });
        
        try {
          // Process the battle turn using the new Gen-8/9 battle flow
          const newState = await processBattleTurn(this.currentState, playerBattleAction, opponentBattleAction);
          
          // Update current state and notify
          this.currentState = newState;
          this.notifyStateChange(newState);
          
          // Sync the new state to Firebase
          await this.syncStateToFirebase(newState);
          
        } catch (error) {
          console.error('❌ Failed to process battle turn:', error);
        }
      }
    }
  }

  private updateSyncStatus(updates: Partial<SyncStatus>): void {
    this.syncStatus = { ...this.syncStatus, ...updates };
    this.syncStatusCallbacks.forEach(callback => {
      try {
        callback(this.syncStatus);
      } catch (error) {
        console.error('❌ Error in sync status callback:', error);
      }
    });
  }

  // Public API methods
  onStateChange(callback: (state: BattleState) => void): () => void {
    this.stateChangeCallbacks.add(callback);
    return () => this.stateChangeCallbacks.delete(callback);
  }

  onSyncStatusChange(callback: (status: SyncStatus) => void): () => void {
    this.syncStatusCallbacks.add(callback);
    return () => this.syncStatusCallbacks.delete(callback);
  }

  getCurrentState(): BattleState | null {
    return this.currentState;
  }

  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  setConflictResolutionStrategy(strategy: 'client' | 'server' | 'merge'): void {
    this.conflictResolutionStrategy = strategy;
  }

  async disconnect(): Promise<void> {
    if (this.battleUnsubscribe) {
      this.battleUnsubscribe();
      this.battleUnsubscribe = null;
    }
    this.updateSyncStatus({ isConnected: false });
    console.log('🔥 Disconnected from Firebase Battle Sync');
  }
}

// Export factory function
export function createFirebaseBattleSyncManager(config: FirebaseBattleSyncConfig): FirebaseBattleSyncManager {
  return new FirebaseBattleSyncManager(config);
}
