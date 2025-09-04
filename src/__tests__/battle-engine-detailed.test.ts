/**
 * @jest-environment jsdom
 */

import {
  initializeBattle,
  executeAction,
  calculateDamage,
  calculateDamageDetailed,
  calculateHp,
  calculateStat,
  getTypeEffectiveness,
  canUseMove,
  processEndOfTurnStatus,
  applyStatusEffect,
  canCauseStatusEffect,
  canCauseFlinch,
  getEffectivenessText,
  calculateDamagePercentage,
} from '@/lib/battle-engine';
import { Pokemon, Move } from '@/types/pokemon';

describe('Battle Engine - Detailed Tests', () => {
  const mockPikachu: Pokemon = {
    id: 25,
    name: 'pikachu',
    base_experience: 112,
    height: 4,
    weight: 60,
    is_default: true,
    order: 25,
    abilities: [],
    forms: [],
    game_indices: [],
    held_items: [],
    location_area_encounters: '',
    moves: [],
    sprites: {
      front_default: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
      back_default: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/25.png',
      front_shiny: null,
      back_shiny: null,
      front_female: null,
      back_female: null,
      front_shiny_female: null,
      back_shiny_female: null,
      other: {
        dream_world: { front_default: null, front_female: null },
        home: { front_default: null, front_female: null, front_shiny: null, front_shiny_female: null },
        'official-artwork': { front_default: null, front_shiny: null },
      },
    },
    types: [{ slot: 1, type: { name: 'electric', url: '' } }],
    stats: [
      { stat: { name: 'hp', url: '' }, base_stat: 35, effort: 0 },
      { stat: { name: 'attack', url: '' }, base_stat: 55, effort: 0 },
      { stat: { name: 'defense', url: '' }, base_stat: 40, effort: 0 },
      { stat: { name: 'special-attack', url: '' }, base_stat: 50, effort: 0 },
      { stat: { name: 'special-defense', url: '' }, base_stat: 50, effort: 0 },
      { stat: { name: 'speed', url: '' }, base_stat: 90, effort: 0 },
    ],
  };

  const mockGeodude: Pokemon = {
    id: 74,
    name: 'geodude',
    base_experience: 60,
    height: 4,
    weight: 200,
    is_default: true,
    order: 74,
    abilities: [],
    forms: [],
    game_indices: [],
    held_items: [],
    location_area_encounters: '',
    moves: [],
    sprites: {
      front_default: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/74.png',
      back_default: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/74.png',
      front_shiny: null,
      back_shiny: null,
      front_female: null,
      back_female: null,
      front_shiny_female: null,
      back_shiny_female: null,
      other: {
        dream_world: { front_default: null, front_female: null },
        home: { front_default: null, front_female: null, front_shiny: null, front_shiny_female: null },
        'official-artwork': { front_default: null, front_shiny: null },
      },
    },
    types: [
      { slot: 1, type: { name: 'rock', url: '' } },
      { slot: 2, type: { name: 'ground', url: '' } },
    ],
    stats: [
      { stat: { name: 'hp', url: '' }, base_stat: 40, effort: 0 },
      { stat: { name: 'attack', url: '' }, base_stat: 80, effort: 0 },
      { stat: { name: 'defense', url: '' }, base_stat: 100, effort: 0 },
      { stat: { name: 'special-attack', url: '' }, base_stat: 30, effort: 0 },
      { stat: { name: 'special-defense', url: '' }, base_stat: 30, effort: 0 },
      { stat: { name: 'speed', url: '' }, base_stat: 20, effort: 0 },
    ],
  };

  const mockThunderbolt: Move = {
    name: 'thunderbolt',
    type: 'electric',
    power: 90,
    accuracy: 100,
    pp: 15,
    effect: 'Deals damage',
    damage_class: 'special',
    priority: 0,
  };

  const mockTackle: Move = {
    name: 'tackle',
    type: 'normal',
    power: 40,
    accuracy: 100,
    pp: 35,
    effect: 'Deals damage',
    damage_class: 'physical',
    priority: 0,
  };

  describe('Battle Initialization', () => {
    it('should initialize battle with correct HP calculations', () => {
      const battle = initializeBattle(
        mockPikachu,
        15,
        [mockThunderbolt],
        mockGeodude,
        12,
        [mockTackle]
      );

      expect(battle.player.pokemon).toBe(mockPikachu);
      expect(battle.player.level).toBe(15);
      expect(battle.opponent.pokemon).toBe(mockGeodude);
      expect(battle.opponent.level).toBe(12);
      expect(battle.turnNumber).toBe(1);
      expect(battle.isComplete).toBe(false);
      expect(battle.battleLog).toHaveLength(1);
      expect(battle.battleLog[0].type).toBe('battle_start');
    });

    it('should determine turn order based on speed', () => {
      const battle = initializeBattle(
        mockPikachu, // Speed: 90
        15,
        [mockThunderbolt],
        mockGeodude, // Speed: 20
        12,
        [mockTackle]
      );

      // Pikachu should go first due to higher speed
      expect(battle.turn).toBe('player');
    });

    it('should handle equal speed by giving player priority', () => {
      const battle = initializeBattle(
        mockPikachu,
        15,
        [mockThunderbolt],
        mockPikachu, // Same Pokemon, same speed
        15,
        [mockThunderbolt]
      );

      expect(battle.turn).toBe('player');
    });
  });

  describe('Damage Calculation', () => {
    it('should calculate HP correctly', () => {
      const hp = calculateHp(35, 15); // Pikachu's base HP at level 15
      expect(hp).toBeGreaterThan(0);
      expect(typeof hp).toBe('number');
    });

    it('should calculate stats correctly', () => {
      const attack = calculateStat(55, 15); // Pikachu's base attack at level 15
      expect(attack).toBeGreaterThan(0);
      expect(typeof attack).toBe('number');
    });

    it('should calculate type effectiveness correctly', () => {
      // Electric vs Rock/Ground (Geodude) - should be 0 (Ground immunity overrides Rock weakness)
      const effectiveness = getTypeEffectiveness('electric', ['rock', 'ground']);
      expect(effectiveness).toBe(0);

      // Electric vs Rock only - should be normal effectiveness
      const electricVsRock = getTypeEffectiveness('electric', ['rock']);
      expect(electricVsRock).toBe(1);

      // Normal vs Rock - should be not very effective
      const normalEffectiveness = getTypeEffectiveness('normal', ['rock']);
      expect(normalEffectiveness).toBeLessThan(1);
    });

    it('should calculate damage with detailed information', () => {
      const battle = initializeBattle(
        mockPikachu,
        15,
        [mockThunderbolt],
        mockGeodude,
        12,
        [mockTackle]
      );

      const damageResult = calculateDamageDetailed(
        battle.player,
        battle.opponent,
        mockThunderbolt
      );

      expect(damageResult.damage).toBeGreaterThan(0);
      expect(damageResult.effectiveness).toBe(0); // Electric vs Rock/Ground is 0 effectiveness
      expect(typeof damageResult.critical).toBe('boolean');
      expect(damageResult.statusEffect).toBe('paralyzed'); // Thunderbolt can cause paralysis
    });

    it('should calculate damage percentage correctly', () => {
      const percentage = calculateDamagePercentage(20, 100);
      expect(percentage).toBe(20);
    });

    it('should get effectiveness text correctly', () => {
      expect(getEffectivenessText(2)).toBe('super_effective');
      expect(getEffectivenessText(0.5)).toBe('not_very_effective');
      expect(getEffectivenessText(0)).toBe('no_effect');
      expect(getEffectivenessText(1)).toBe('normal');
    });
  });

  describe('Status Effects', () => {
    it('should detect status effect moves', () => {
      const thunderWave: Move = {
        name: 'thunder-wave',
        type: 'electric',
        power: 0,
        accuracy: 100,
        pp: 20,
        effect: 'Paralyzes target',
        damage_class: 'status',
        priority: 0,
      };

      const statusEffect = canCauseStatusEffect(thunderWave);
      expect(statusEffect).toBe('paralyzed');
    });

    it('should detect flinch moves', () => {
      const airSlash: Move = {
        name: 'air-slash',
        type: 'flying',
        power: 75,
        accuracy: 95,
        pp: 15,
        effect: 'Deals damage',
        damage_class: 'special',
        priority: 0,
      };

      const canFlinch = canCauseFlinch(airSlash);
      expect(canFlinch).toBe(true);
    });

    it('should apply status effects correctly', () => {
      const battle = initializeBattle(
        mockPikachu,
        15,
        [mockThunderbolt],
        mockGeodude,
        12,
        [mockTackle]
      );

      applyStatusEffect(battle.opponent, 'paralyzed');
      expect(battle.opponent.status).toBe('paralyzed');
    });

    it('should process end of turn status effects', () => {
      const battle = initializeBattle(
        mockPikachu,
        15,
        [mockThunderbolt],
        mockGeodude,
        12,
        [mockTackle]
      );

      battle.opponent.status = 'burned';
      const damage = processEndOfTurnStatus(battle.opponent);
      expect(damage).toBeGreaterThan(0);
      expect(battle.opponent.currentHp).toBeLessThan(battle.opponent.maxHp);
    });

    it('should handle move usage with status effects', () => {
      const battle = initializeBattle(
        mockPikachu,
        15,
        [mockThunderbolt],
        mockGeodude,
        12,
        [mockTackle]
      );

      battle.opponent.status = 'asleep';
      const canUse = canUseMove(battle.opponent, 0);
      // Sleep has a 25% chance to wake up, so we can't guarantee the result
      expect(typeof canUse.canUse).toBe('boolean');
      if (!canUse.canUse) {
        expect(canUse.reason).toBe('fast asleep');
      }
    });
  });

  describe('Battle Execution', () => {
    it('should execute player moves correctly', () => {
      const battle = initializeBattle(
        mockPikachu,
        15,
        [mockThunderbolt],
        mockGeodude,
        12,
        [mockTackle]
      );

      const newBattle = executeAction(battle, { type: 'move', moveIndex: 0 });

      expect(newBattle.turnNumber).toBe(2);
      expect(newBattle.turn).toBe('opponent');
      expect(newBattle.battleLog.length).toBeGreaterThan(battle.battleLog.length);
      // With 0 effectiveness, damage might be minimal, so we just check it's not greater
      expect(newBattle.opponent.currentHp).toBeLessThanOrEqual(battle.opponent.currentHp);
    });

    it('should handle move execution with status effects', () => {
      const thunderWave: Move = {
        name: 'thunder-wave',
        type: 'electric',
        power: 0,
        accuracy: 100,
        pp: 20,
        effect: 'Paralyzes target',
        damage_class: 'status',
        priority: 0,
      };

      const battle = initializeBattle(
        mockPikachu,
        15,
        [thunderWave],
        mockGeodude,
        12,
        [mockTackle]
      );

      const newBattle = executeAction(battle, { type: 'move', moveIndex: 0 });

      expect(newBattle.opponent.status).toBe('paralyzed');
      expect(newBattle.battleLog.some(entry => 
        entry.type === 'status_applied' && entry.message.includes('paralyzed')
      )).toBe(true);
    });

    it('should handle battle completion when Pokemon faints', () => {
      const battle = initializeBattle(
        mockPikachu,
        15,
        [mockThunderbolt],
        mockGeodude,
        12,
        [mockTackle]
      );

      // Set opponent HP to 1 so it will faint
      battle.opponent.currentHp = 1;

      const newBattle = executeAction(battle, { type: 'move', moveIndex: 0 });

      expect(newBattle.isComplete).toBe(true);
      expect(newBattle.winner).toBe('player');
      expect(newBattle.battleLog.some(entry => 
        entry.type === 'pokemon_fainted'
      )).toBe(true);
    });

    it('should handle turn progression correctly', () => {
      const battle = initializeBattle(
        mockPikachu,
        15,
        [mockThunderbolt],
        mockGeodude,
        12,
        [mockTackle]
      );

      const newBattle = executeAction(battle, { type: 'move', moveIndex: 0 });

      expect(newBattle.turnNumber).toBe(2);
      expect(newBattle.turn).toBe('opponent');
      expect(newBattle.battleLog.some(entry => 
        entry.type === 'turn_start' && entry.message.includes('Turn 2:')
      )).toBe(true);
    });

    it('should handle status damage at end of turn', () => {
      const battle = initializeBattle(
        mockPikachu,
        15,
        [mockThunderbolt],
        mockGeodude,
        12,
        [mockTackle]
      );

      battle.player.status = 'poisoned';
      const initialHp = battle.player.currentHp;

      const newBattle = executeAction(battle, { type: 'move', moveIndex: 0 });

      expect(newBattle.player.currentHp).toBeLessThan(initialHp);
      expect(newBattle.battleLog.some(entry => 
        entry.type === 'status_damage'
      )).toBe(true);
    });
  });

  describe('Battle Log Format', () => {
    it('should create properly formatted battle log entries', () => {
      const battle = initializeBattle(
        mockPikachu,
        15,
        [mockThunderbolt],
        mockGeodude,
        12,
        [mockTackle]
      );

      expect(battle.battleLog[0]).toHaveProperty('type');
      expect(battle.battleLog[0]).toHaveProperty('message');
      expect(battle.battleLog[0]).toHaveProperty('pokemon');
      expect(typeof battle.battleLog[0].message).toBe('string');
    });

    it('should handle move usage logging', () => {
      const battle = initializeBattle(
        mockPikachu,
        15,
        [mockThunderbolt],
        mockGeodude,
        12,
        [mockTackle]
      );

      const newBattle = executeAction(battle, { type: 'move', moveIndex: 0 });

      const moveUsedEntry = newBattle.battleLog.find(entry => entry.type === 'move_used');
      expect(moveUsedEntry).toBeDefined();
      expect(moveUsedEntry?.message).toContain('pikachu used thunderbolt!');
    });

    it('should handle damage logging with effectiveness', () => {
      const battle = initializeBattle(
        mockPikachu,
        15,
        [mockThunderbolt],
        mockGeodude,
        12,
        [mockTackle]
      );

      const newBattle = executeAction(battle, { type: 'move', moveIndex: 0 });

      const damageEntry = newBattle.battleLog.find(entry => entry.type === 'damage_dealt');
      expect(damageEntry).toBeDefined();
      expect(damageEntry?.message).toContain('no effect'); // Electric vs Rock/Ground has no effect
      expect(damageEntry?.effectiveness).toBe('no_effect');
    });
  });
});
