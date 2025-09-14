import { BattleState, BattleTeam, BattlePokemon, BattleAction } from './team-battle-engine';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface TeamIntegrityCheck {
  pokemonCount: number;
  currentIndex: number;
  faintedCount: number;
  pokemonStates: PokemonStateCheck[];
}

export interface PokemonStateCheck {
  index: number;
  name: string;
  hp: number;
  maxHp: number;
  status?: string;
  isFainted: boolean;
  movesCount: number;
  statModifiers: Record<string, number>;
}

export class BattleStateValidator {
  private static readonly MAX_STAT_MODIFIER = 6;
  private static readonly MIN_STAT_MODIFIER = -6;
  private static readonly MIN_HP = 0;
  private static readonly MAX_POKEMON_PER_TEAM = 6;

  static validateBattleState(state: BattleState): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate basic structure
    if (!state.player || !state.opponent) {
      errors.push('Battle state must have both player and opponent teams');
      return { isValid: false, errors, warnings };
    }

    // Validate teams
    const playerValidation = this.validateTeam(state.player, 'player');
    const opponentValidation = this.validateTeam(state.opponent, 'opponent');

    errors.push(...playerValidation.errors);
    errors.push(...opponentValidation.errors);
    warnings.push(...playerValidation.warnings);
    warnings.push(...opponentValidation.warnings);

    // Validate turn consistency
    const turnValidation = this.validateTurnConsistency(state);
    errors.push(...turnValidation.errors);
    warnings.push(...turnValidation.warnings);

    // Validate battle phase
    const phaseValidation = this.validateBattlePhase(state);
    errors.push(...phaseValidation.errors);
    warnings.push(...phaseValidation.warnings);

    // Validate move selection consistency
    const moveValidation = this.validateMoveSelection(state);
    errors.push(...moveValidation.errors);
    warnings.push(...moveValidation.warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  static validateTeam(team: BattleTeam, teamName: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check team size
    if (team.pokemon.length === 0) {
      errors.push(`${teamName} team has no Pokemon`);
    } else if (team.pokemon.length > this.MAX_POKEMON_PER_TEAM) {
      errors.push(`${teamName} team has too many Pokemon (${team.pokemon.length})`);
    }

    // Check current index validity
    if (team.currentIndex < 0 || team.currentIndex >= team.pokemon.length) {
      errors.push(`${teamName} team has invalid current index: ${team.currentIndex}`);
    }

    // Check fainted count consistency
    const actualFaintedCount = team.pokemon.filter(p => p.currentHp <= 0).length;
    if (team.faintedCount !== actualFaintedCount) {
      errors.push(`${teamName} team fainted count mismatch: expected ${actualFaintedCount}, got ${team.faintedCount}`);
    }

    // Validate each Pokemon
    team.pokemon.forEach((pokemon, index) => {
      const pokemonValidation = this.validatePokemon(pokemon, `${teamName}.pokemon[${index}]`);
      errors.push(...pokemonValidation.errors.map(e => `${teamName}: ${e}`));
      warnings.push(...pokemonValidation.warnings.map(w => `${teamName}: ${w}`));
    });

    // Check if current Pokemon is fainted
    if (team.pokemon.length > 0) {
      const currentPokemon = team.pokemon[team.currentIndex];
      if (currentPokemon && currentPokemon.currentHp <= 0) {
        warnings.push(`${teamName} current Pokemon is fainted`);
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  static validatePokemon(pokemon: BattlePokemon, context: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check HP values
    if (pokemon.currentHp < this.MIN_HP) {
      errors.push(`${context} has negative HP: ${pokemon.currentHp}`);
    }
    if (pokemon.maxHp <= 0) {
      errors.push(`${context} has invalid max HP: ${pokemon.maxHp}`);
    }
    if (pokemon.currentHp > pokemon.maxHp) {
      errors.push(`${context} current HP (${pokemon.currentHp}) exceeds max HP (${pokemon.maxHp})`);
    }

    // Check level
    if (pokemon.level < 1 || pokemon.level > 100) {
      errors.push(`${context} has invalid level: ${pokemon.level}`);
    }

    // Check moves
    if (pokemon.moves.length === 0) {
      warnings.push(`${context} has no moves`);
    } else if (pokemon.moves.length > 4) {
      errors.push(`${context} has too many moves: ${pokemon.moves.length}`);
    }

    // Check stat modifiers
    Object.entries(pokemon.statModifiers).forEach(([stat, value]) => {
      if (value < this.MIN_STAT_MODIFIER || value > this.MAX_STAT_MODIFIER) {
        errors.push(`${context} has invalid ${stat} modifier: ${value}`);
      }
    });

    // Check status consistency
    if (pokemon.status && pokemon.statusTurns === undefined) {
      warnings.push(`${context} has status but no statusTurns`);
    }

    // Check ability consistency
    if (pokemon.abilityChanged && !pokemon.currentAbility) {
      warnings.push(`${context} marked as ability changed but no current ability`);
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  static validateTurnConsistency(state: BattleState): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check turn number (now a number, not string)
    if (typeof state.turn !== 'number' || state.turn < 1) {
      errors.push(`Invalid turn value: ${state.turn}`);
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  static validateBattlePhase(state: BattleState): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check phase validity (new Gen-8/9 phases)
    const validPhases = ['choice', 'resolution', 'end_of_turn', 'replacement'];
    if (!validPhases.includes(state.phase)) {
      errors.push(`Invalid battle phase: ${state.phase}`);
    }

    // Check phase consistency with battle state
    if (state.isComplete && state.phase !== 'choice') {
      warnings.push(`Battle is complete but phase is not 'choice'`);
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  static validateMoveSelection(state: BattleState): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check action queue consistency
    if (state.phase === 'resolution' && state.actionQueue.length === 0) {
      warnings.push(`Resolution phase but no actions in action queue`);
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  static validateAction(action: BattleAction, state: BattleState, isPlayer: boolean): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check action type
    const validTypes = ['move', 'switch', 'item', 'execute'];
    if (!validTypes.includes(action.type)) {
      errors.push(`Invalid action type: ${action.type}`);
    }

    // Validate move action
    if (action.type === 'move') {
      const team = isPlayer ? state.player : state.opponent;
      const currentPokemon = team.pokemon[team.currentIndex];
      
      if (action.moveId === undefined) {
        errors.push('Move action missing moveId');
      } else if (!currentPokemon.moves.some(move => move.id === action.moveId)) {
        errors.push(`Invalid move ID: ${action.moveId}`);
      }
    }

    // Validate switch action
    if (action.type === 'switch') {
      const team = isPlayer ? state.player : state.opponent;
      
      if (action.switchIndex === undefined) {
        errors.push('Switch action missing switchIndex');
      } else if (action.switchIndex < 0 || action.switchIndex >= team.pokemon.length) {
        errors.push(`Invalid switch index: ${action.switchIndex}`);
      } else {
        const targetPokemon = team.pokemon[action.switchIndex];
        if (targetPokemon.currentHp <= 0) {
          errors.push(`Cannot switch to fainted Pokemon: ${targetPokemon.pokemon.name}`);
        }
        if (action.switchIndex === team.currentIndex) {
          errors.push(`Cannot switch to current Pokemon`);
        }
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  static checkTeamIntegrity(team: BattleTeam): TeamIntegrityCheck {
    const pokemonStates: PokemonStateCheck[] = team.pokemon.map((pokemon, index) => ({
      index,
      name: pokemon.pokemon.name,
      hp: pokemon.currentHp,
      maxHp: pokemon.maxHp,
      status: pokemon.status,
      isFainted: pokemon.currentHp <= 0,
      movesCount: pokemon.moves.length,
      statModifiers: { ...pokemon.statModifiers }
    }));

    return {
      pokemonCount: team.pokemon.length,
      currentIndex: team.currentIndex,
      faintedCount: team.faintedCount,
      pokemonStates
    };
  }

  static compareTeamStates(team1: TeamIntegrityCheck, team2: TeamIntegrityCheck): string[] {
    const differences: string[] = [];

    if (team1.pokemonCount !== team2.pokemonCount) {
      differences.push(`Pokemon count differs: ${team1.pokemonCount} vs ${team2.pokemonCount}`);
    }

    if (team1.currentIndex !== team2.currentIndex) {
      differences.push(`Current index differs: ${team1.currentIndex} vs ${team2.currentIndex}`);
    }

    if (team1.faintedCount !== team2.faintedCount) {
      differences.push(`Fainted count differs: ${team1.faintedCount} vs ${team2.faintedCount}`);
    }

    // Compare Pokemon states
    const maxLength = Math.max(team1.pokemonStates.length, team2.pokemonStates.length);
    for (let i = 0; i < maxLength; i++) {
      const pokemon1 = team1.pokemonStates[i];
      const pokemon2 = team2.pokemonStates[i];

      if (!pokemon1 || !pokemon2) {
        differences.push(`Pokemon at index ${i} missing in one team`);
        continue;
      }

      if (pokemon1.name !== pokemon2.name) {
        differences.push(`Pokemon name differs at index ${i}: ${pokemon1.name} vs ${pokemon2.name}`);
      }

      if (pokemon1.hp !== pokemon2.hp) {
        differences.push(`Pokemon HP differs at index ${i}: ${pokemon1.hp} vs ${pokemon2.hp}`);
      }

      if (pokemon1.maxHp !== pokemon2.maxHp) {
        differences.push(`Pokemon max HP differs at index ${i}: ${pokemon1.maxHp} vs ${pokemon2.maxHp}`);
      }

      if (pokemon1.status !== pokemon2.status) {
        differences.push(`Pokemon status differs at index ${i}: ${pokemon1.status} vs ${pokemon2.status}`);
      }

      if (pokemon1.isFainted !== pokemon2.isFainted) {
        differences.push(`Pokemon fainted state differs at index ${i}: ${pokemon1.isFainted} vs ${pokemon2.isFainted}`);
      }
    }

    return differences;
  }

  static sanitizeBattleState(state: BattleState): BattleState {
    // Create a deep copy and fix any inconsistencies
    const sanitized = JSON.parse(JSON.stringify(state)) as BattleState;

    // Fix HP values
    sanitized.player.pokemon.forEach(pokemon => {
      pokemon.currentHp = Math.max(0, Math.min(pokemon.currentHp, pokemon.maxHp));
    });
    sanitized.opponent.pokemon.forEach(pokemon => {
      pokemon.currentHp = Math.max(0, Math.min(pokemon.currentHp, pokemon.maxHp));
    });

    // Fix stat modifiers
    const clampStatModifier = (value: number) => Math.max(-6, Math.min(6, value));
    
    sanitized.player.pokemon.forEach(pokemon => {
      Object.keys(pokemon.statModifiers).forEach(stat => {
        pokemon.statModifiers[stat as keyof typeof pokemon.statModifiers] = 
          clampStatModifier(pokemon.statModifiers[stat as keyof typeof pokemon.statModifiers]);
      });
    });
    
    sanitized.opponent.pokemon.forEach(pokemon => {
      Object.keys(pokemon.statModifiers).forEach(stat => {
        pokemon.statModifiers[stat as keyof typeof pokemon.statModifiers] = 
          clampStatModifier(pokemon.statModifiers[stat as keyof typeof pokemon.statModifiers]);
      });
    });

    // Fix fainted counts
    sanitized.player.faintedCount = sanitized.player.pokemon.filter(p => p.currentHp <= 0).length;
    sanitized.opponent.faintedCount = sanitized.opponent.pokemon.filter(p => p.currentHp <= 0).length;

    // Fix current indices
    if (sanitized.player.currentIndex < 0 || sanitized.player.currentIndex >= sanitized.player.pokemon.length) {
      sanitized.player.currentIndex = 0;
    }
    if (sanitized.opponent.currentIndex < 0 || sanitized.opponent.currentIndex >= sanitized.opponent.pokemon.length) {
      sanitized.opponent.currentIndex = 0;
    }

    return sanitized;
  }
}
