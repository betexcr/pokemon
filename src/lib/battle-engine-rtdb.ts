import { rtdbService, type RTDBBattleMeta, type RTDBBattlePublic, type RTDBBattlePrivate, type RTDBChoice } from './firebase-rtdb-service';
import { BattlePokemon, BattleTeam, BattleState, BattleAction } from './team-battle-engine';
import { battleRngFromStored, createBattleRng } from './battle-rng';
import type { FieldState } from './team-battle-types';
export class FirebaseRTDBBattleEngine {
  public readonly battleId: string;
  private meta: RTDBBattleMeta | null = null;
  private publicState: RTDBBattlePublic | null = null;
  private privateState: RTDBBattlePrivate | null = null;
  private unsubscribe: (() => void)[] = [];
  public isInitialized = false;
  private onStateChange?: (state: BattleState) => void;
  private onPhaseChange?: (phase: string) => void;
  private currentUserUid: string | null = null;

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

    const { auth } = await import('./firebase');
    this.currentUserUid = auth?.currentUser?.uid ?? null;

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

    if (this.currentUserUid) {
      this.unsubscribe.push(
        rtdbService.onBattlePrivate(this.battleId, this.currentUserUid, (privateState) => {
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
    if (!this.currentUserUid) {
      throw new Error('Battle state not fully initialized');
    }

    const isP1 = this.meta.players.p1.uid === this.currentUserUid;
    const isP2 = this.meta.players.p2.uid === this.currentUserUid;
    if (!isP1 && !isP2) {
      throw new Error('Current user is not a participant in this battle');
    }

    const myPublic = isP1 ? this.publicState.p1 : this.publicState.p2;
    const oppPublic = isP1 ? this.publicState.p2 : this.publicState.p1;
    const currentIndex = this.privateState.currentIndex ?? 0;

    const playerTeam = this.convertToBattleTeam(
      Array.isArray(this.privateState.team) ? this.privateState.team : [],
      myPublic,
      currentIndex
    );
    const opponentTeam = this.convertToBattleTeam(
      this.buildOpponentTeamFromPublic(oppPublic),
      oppPublic,
      0
    );

    const rng =
      battleRngFromStored(this.meta.battleRng) ?? createBattleRng(this.meta.turn || 1);

    const rawField = this.publicState.field as Record<string, unknown> | undefined;
    const field: FieldState = {
      weather: (rawField?.weather as FieldState['weather']) ?? undefined,
      terrain: (rawField?.terrain as FieldState['terrain']) ?? undefined,
      rooms: {},
    };

    let phase: BattleState['phase'] = 'choice';
    if (this.meta.phase === 'resolving') phase = 'resolution';
    else if (this.meta.phase === 'ended') phase = 'execution';

    return {
      player: playerTeam,
      opponent: opponentTeam,
      turn: this.meta.turn,
      rng,
      battleLog: [],
      isComplete: this.meta.phase === 'ended',
      winner: this.meta.winnerUid
        ? this.meta.winnerUid === this.currentUserUid
          ? 'player'
          : 'opponent'
        : undefined,
      phase,
      actionQueue: [],
      field,
    };
  }

  private convertToBattleTeam(teamData: any[], publicData: any, currentIndex: number): BattleTeam {
    if (!teamData.length || !publicData?.active) {
      return { pokemon: [], currentIndex: 0, faintedCount: 0, sideConditions: {} };
    }

    const benchSlotIndices = teamData.map((_, i) => i).filter((i) => i !== currentIndex);

    const pokemon: BattlePokemon[] = teamData.map((pokemonData: any, index: number) => {
      const isActive = index === currentIndex;
      let publicPokemon: any;
      if (isActive) {
        publicPokemon = publicData.active;
      } else {
        const benchIdx = benchSlotIndices.indexOf(index);
        publicPokemon = publicData.benchPublic?.[benchIdx];
      }

      if (!publicPokemon) {
        publicPokemon = {
          hp: { cur: pokemonData.currentHp ?? 0, max: pokemonData.maxHp ?? 1 },
          status: pokemonData.status ?? null,
          boosts: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 },
        };
      }

      const boosts = publicPokemon.boosts || {};

      return {
        pokemon: pokemonData.pokemon,
        level: pokemonData.level,
        currentHp: isActive ? publicPokemon.hp.cur : pokemonData.currentHp,
        maxHp: isActive ? publicPokemon.hp.max : pokemonData.maxHp,
        moves: pokemonData.moves || [],
        status: publicPokemon.status ?? pokemonData.status,
        statusTurns: pokemonData.statusTurns,
        volatile: pokemonData.volatile || {},
        heldItem: pokemonData.heldItem,
        currentAbility: pokemonData.currentAbility,
        originalAbility: pokemonData.originalAbility,
        abilityChanged: pokemonData.abilityChanged,
        statModifiers: {
          attack: boosts.atk ?? 0,
          defense: boosts.def ?? 0,
          specialAttack: boosts.spa ?? 0,
          specialDefense: boosts.spd ?? 0,
          speed: boosts.spe ?? 0,
          accuracy: boosts.acc ?? 0,
          evasion: boosts.eva ?? 0,
        },
      };
    });

    return {
      pokemon,
      currentIndex,
      faintedCount: pokemon.filter((p) => p.currentHp <= 0).length,
      sideConditions: {},
    };
  }

  /** Opponent team is unknown privately; reconstruct visible slots from public RTDB only. */
  private buildOpponentTeamFromPublic(oppPublic: RTDBBattlePublic['p1']): any[] {
    if (!oppPublic?.active) return [];
    const activeRow = this.minimalSlotFromPublicActive(oppPublic.active);
    const bench = (oppPublic.benchPublic || []).map((b) => this.minimalSlotFromPublicBench(b));
    return [activeRow, ...bench];
  }

  private minimalSlotFromPublicActive(active: RTDBBattlePublic['p1']['active']): any {
    const types = (active.types || []).map((t: string) => ({ type: { name: t } }));
    return {
      pokemon: {
        id: 0,
        name: active.species,
        types: types.length ? types : [{ type: { name: 'normal' } }],
        stats: [],
        weight: 500,
        abilities: [],
      },
      level: active.level ?? 50,
      currentHp: active.hp?.cur ?? 0,
      maxHp: active.hp?.max ?? 1,
      moves: [{ id: 'tackle', pp: 35, maxPp: 35 }],
      volatile: {},
      statModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 },
    };
  }

  private minimalSlotFromPublicBench(bench: { species: string; fainted: boolean; revealedMoves: string[] }): any {
    const moveSlots =
      bench.revealedMoves?.length > 0
        ? bench.revealedMoves.map((id) => ({ id, pp: 10, maxPp: 10 }))
        : [{ id: 'tackle', pp: 35, maxPp: 35 }];
    return {
      pokemon: {
        id: 0,
        name: bench.species,
        types: [{ type: { name: 'normal' } }],
        stats: [],
        weight: 500,
        abilities: [],
      },
      level: 50,
      currentHp: bench.fainted ? 0 : 1,
      maxHp: 1,
      moves: moveSlots,
      volatile: {},
      statModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 },
    };
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

    const uid = this.currentUserUid;
    if (!uid) {
      throw new Error('Not authenticated');
    }

    await rtdbService.submitChoice(this.battleId, this.meta.turn, uid, choice);
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
    this.currentUserUid = null;
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
  private lastState: BattleState | null = null;

  constructor(battleId: string) {
    this.battleId = battleId;
    this.engine = new FirebaseRTDBBattleEngine(battleId);
  }

  async initialize(): Promise<void> {
    this.lastState = null;
    await this.engine.initialize(
      (state) => this.handleBattleStateChange(state),
      (phase) => this.handlePhaseChange(phase)
    );
  }

  private handleBattleStateChange(state: BattleState | null | undefined): void {
    this.lastState = state ?? null;
  }

  private handlePhaseChange(_phase: string): void {
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
    if (this.lastState !== null) {
      return this.lastState;
    }
    if (!this.engine.isInitialized) {
      return null;
    }
    try {
      return this.engine.convertToBattleState();
    } catch {
      return null;
    }
  }

  // Cleanup
  destroy(): void {
    this.lastState = null;
    this.engine.destroy();
  }
}
