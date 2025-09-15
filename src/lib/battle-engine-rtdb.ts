import { rtdbService, type RTDBBattleMeta, type RTDBBattlePublic, type RTDBBattlePrivate, type RTDBChoice } from './firebase-rtdb-service';
import { BattlePokemon, BattleTeam, BattleState, BattleAction } from './team-battle-engine';
import { processBattleTurn } from './team-battle-engine';

export interface RTDBBattleEngine {
  battleId: string;
  meta: RTDBBattleMeta | null;
  publicState: RTDBBattlePublic | null;
  privateState: RTDBBattlePrivate | null;
  isInitialized: boolean;
  unsubscribe: (() => void)[];
}

export class FirebaseRTDBBattleEngine {
  private battleId: string;
  private meta: RTDBBattleMeta | null = null;
  private publicState: RTDBBattlePublic | null = null;
  private privateState: RTDBBattlePrivate | null = null;
  private unsubscribe: (() => void)[] = [];
  public isInitialized = false;
  private onStateChange?: (state: BattleState) => void;
  private onPhaseChange?: (phase: string) => void;

  constructor(battleId: string) {
    this.battleId = battleId;
  }

  // Initialize the battle engine with listeners
  async initialize(
    onStateChange?: (state: BattleState) => void,
    onPhaseChange?: (phase: string) => void
  ): Promise<void> {
    this.onStateChange = onStateChange;
    this.onPhaseChange = onPhaseChange;

    // Set up listeners
    this.unsubscribe.push(
      rtdbService.onBattleMeta(this.battleId, (meta) => {
        this.meta = meta;
        this.handleStateChange();
      })
    );

    this.unsubscribe.push(
      rtdbService.onBattlePublic(this.battleId, (publicState) => {
        this.publicState = publicState;
        this.handleStateChange();
      })
    );

    // Get current user UID for private state
    const { auth } = await import('./firebase');
    if (auth?.currentUser?.uid) {
      this.unsubscribe.push(
        rtdbService.onBattlePrivate(this.battleId, auth.currentUser.uid, (privateState) => {
          this.privateState = privateState;
          this.handleStateChange();
        })
      );
    }

    this.isInitialized = true;
  }

  private handleStateChange(): void {
    if (!this.meta || !this.publicState || !this.privateState) {
      return;
    }

    // Convert RTDB state to BattleState
    const battleState = this.convertToBattleState();
    this.onStateChange?.(battleState);
    this.onPhaseChange?.(this.meta.phase);
  }

  public convertToBattleState(): BattleState {
    if (!this.meta || !this.publicState || !this.privateState) {
      throw new Error('Battle state not fully initialized');
    }

    // Convert RTDB data to BattleState format
    const playerTeam = this.convertToBattleTeam(this.privateState.team, this.publicState.p1);
    const opponentTeam = this.convertToBattleTeam(
      this.getOpponentTeam(), 
      this.publicState.p2
    );

    return {
      player: playerTeam,
      opponent: opponentTeam,
      turn: this.meta.turn,
      rng: Math.floor(Math.random() * 1000000),
      battleLog: [], // Will be populated from resolution logs
      isComplete: this.meta.phase === 'ended',
      winner: this.meta.winnerUid ? 
        (this.meta.winnerUid === this.meta.players.p1.uid ? 'player' : 'opponent') : 
        undefined,
      phase: this.meta.phase === 'choosing' ? 'choice' : 
             this.meta.phase === 'resolving' ? 'resolution' : 'choice',
      actionQueue: [],
      field: {}
    };
  }

  private convertToBattleTeam(teamData: any, publicData: any): BattleTeam {
    const pokemon: BattlePokemon[] = teamData.map((pokemonData: any, index: number) => {
      const isActive = index === 0;
      const publicPokemon = isActive ? publicData.active : publicData.benchPublic[index - 1];
      
      return {
        pokemon: pokemonData.pokemon,
        level: pokemonData.level,
        currentHp: isActive ? publicPokemon.hp.cur : pokemonData.currentHp,
        maxHp: isActive ? publicPokemon.hp.max : pokemonData.maxHp,
        moves: pokemonData.moves || [],
        status: publicPokemon.status,
        statusTurns: pokemonData.statusTurns,
        volatile: pokemonData.volatile || {},
        currentAbility: pokemonData.currentAbility,
        originalAbility: pokemonData.originalAbility,
        abilityChanged: pokemonData.abilityChanged,
        statModifiers: {
          attack: publicPokemon.boosts.atk,
          defense: publicPokemon.boosts.def,
          specialAttack: publicPokemon.boosts.spa,
          specialDefense: publicPokemon.boosts.spd,
          speed: publicPokemon.boosts.spe,
          accuracy: publicPokemon.boosts.acc,
          evasion: publicPokemon.boosts.eva
        }
      };
    });

    return {
      pokemon,
      currentIndex: 0,
      faintedCount: pokemon.filter(p => p.currentHp <= 0).length,
      sideConditions: {}
    };
  }

  private getOpponentTeam(): any {
    // This would need to be implemented based on your team structure
    // For now, return empty array - this should be handled by the server
    return [];
  }

  // Submit a choice (move or switch)
  async submitChoice(action: BattleAction): Promise<void> {
    if (!this.meta) {
      throw new Error('Battle not initialized');
    }

    if (this.meta.phase !== 'choosing') {
      throw new Error('Not in choosing phase');
    }

    const choice: Omit<RTDBChoice, 'committedAt' | 'clientVersion'> = {
      action: action.type === 'move' ? 'move' : 'switch',
      payload: {
        moveId: action.moveId,
        target: action.target,
        switchToIndex: action.switchIndex
      }
    };

    await rtdbService.submitChoice(
      this.battleId,
      this.meta.turn,
      this.getCurrentUserId(),
      choice
    );
  }

  private getCurrentUserId(): string {
    // This should get the current user's UID
    // Implementation depends on your auth system
    return 'current-user-uid';
  }

  // Listen to turn resolution
  onTurnResolution(callback: (resolution: any) => void): () => void {
    if (!this.meta) {
      return () => {};
    }

    return rtdbService.onBattleResolution(
      this.battleId,
      this.meta.turn,
      callback
    );
  }

  // Cleanup
  destroy(): void {
    this.unsubscribe.forEach(unsub => unsub());
    this.unsubscribe = [];
    this.isInitialized = false;
  }

  // Getters
  get currentPhase(): string {
    return this.meta?.phase || 'waiting';
  }

  get currentTurn(): number {
    return this.meta?.turn || 0;
  }

  get isComplete(): boolean {
    return this.meta?.phase === 'ended' || false;
  }

  get winner(): string | undefined {
    return this.meta?.winnerUid;
  }
}

// Battle flow implementation following the documented flow
export class BattleFlowEngine {
  private battleId: string;
  private engine: FirebaseRTDBBattleEngine;

  constructor(battleId: string) {
    this.battleId = battleId;
    this.engine = new FirebaseRTDBBattleEngine(battleId);
  }

  async initialize(): Promise<void> {
    await this.engine.initialize(
      (state) => this.handleBattleStateChange(state),
      (phase) => this.handlePhaseChange(phase)
    );
  }

  private handleBattleStateChange(state: BattleState): void {
    // Handle battle state changes
    console.log('Battle state changed:', state);
  }

  private handlePhaseChange(phase: string): void {
    // Handle phase changes
    console.log('Phase changed to:', phase);
  }

  // Submit a move choice
  async submitMove(moveId: string, target?: 'player' | 'opponent'): Promise<void> {
    const action: BattleAction = {
      type: 'move',
      moveId,
      target
    };
    await this.engine.submitChoice(action);
  }

  // Submit a switch choice
  async submitSwitch(pokemonIndex: number): Promise<void> {
    const action: BattleAction = {
      type: 'switch',
      switchIndex: pokemonIndex
    };
    await this.engine.submitChoice(action);
  }

  // Get current battle state
  getBattleState(): BattleState | null {
    if (!this.engine.isInitialized) {
      return null;
    }
    return this.engine.convertToBattleState();
  }

  // Cleanup
  destroy(): void {
    this.engine.destroy();
  }
}
