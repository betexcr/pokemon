import { BattleState, BattleAction, BattleTeam, BattlePokemon } from './team-battle-engine';
import { createFirebaseBattleSyncManager, FirebaseBattleSyncManager } from './firebase-battle-sync';

export interface BattleSyncConfig {
  battleId: string;
  playerId: string;
  isHost: boolean;
  serverUrl?: string;
}

export interface SyncStatus {
  isConnected: boolean;
  lastSync: number;
  pendingActions: number;
  conflicts: number;
  latency: number;
}

export class BattleSyncManager {
  private config: BattleSyncConfig;
  private firebaseSync: FirebaseBattleSyncManager;

  constructor(config: BattleSyncConfig) {
    this.config = config;
    this.firebaseSync = createFirebaseBattleSyncManager({
      battleId: config.battleId,
      playerId: config.playerId,
      isHost: config.isHost
    });
  }

  async initialize(): Promise<void> {
    console.log('🔥 Initializing Firebase Battle Sync Manager');
    try {
      await this.firebaseSync.initialize();
      console.log('✅ Battle sync manager initialized with Firebase');
    } catch (error) {
      console.error('❌ Failed to initialize Firebase battle sync:', error);
      throw error;
    }
  }

  setBattleState(state: BattleState): void {
    this.firebaseSync.setBattleState(state);
  }

  async selectMove(moveId: string, moveName: string): Promise<void> {
    return this.firebaseSync.selectMove(moveId, moveName);
  }

  async switchPokemon(pokemonIndex: number): Promise<void> {
    return this.firebaseSync.switchPokemon(pokemonIndex);
  }

  // Public API methods - delegate to Firebase sync
  onStateChange(callback: (state: BattleState) => void): () => void {
    return this.firebaseSync.onStateChange(callback);
  }

  onSyncStatusChange(callback: (status: SyncStatus) => void): () => void {
    return this.firebaseSync.onSyncStatusChange(callback);
  }

  getCurrentState(): BattleState | null {
    return this.firebaseSync.getCurrentState();
  }

  getSyncStatus(): SyncStatus {
    return this.firebaseSync.getSyncStatus();
  }

  setConflictResolutionStrategy(strategy: 'client' | 'server' | 'merge'): void {
    this.firebaseSync.setConflictResolutionStrategy(strategy);
  }

  async disconnect(): Promise<void> {
    return this.firebaseSync.disconnect();
  }
}

// Export factory function
export function createBattleSyncManager(config: BattleSyncConfig): BattleSyncManager {
  return new BattleSyncManager(config);
}