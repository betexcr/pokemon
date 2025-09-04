import {
  initializeTeamBattle,
  executeTeamAction,
  getCurrentPokemon,
  isTeamDefeated,
  getNextAvailablePokemon,
  switchToPokemon,
  calculateHp,
  calculateStat
} from '../team-battle-engine';

// Mock Pokémon data
const mockPokemon1 = {
  id: 1,
  name: 'bulbasaur',
  stats: [
    { stat: { name: 'hp' }, base_stat: 45 },
    { stat: { name: 'attack' }, base_stat: 49 },
    { stat: { name: 'defense' }, base_stat: 49 },
    { stat: { name: 'special-attack' }, base_stat: 65 },
    { stat: { name: 'special-defense' }, base_stat: 65 },
    { stat: { name: 'speed' }, base_stat: 45 }
  ],
  types: [{ type: { name: 'grass' } }, { type: { name: 'poison' } }],
  abilities: [
    { ability: { name: 'overgrow' }, is_hidden: false, slot: 1 },
    { ability: { name: 'chlorophyll' }, is_hidden: true, slot: 3 }
  ],
  sprites: {
    front_default: 'https://example.com/bulbasaur.png',
    back_default: 'https://example.com/bulbasaur-back.png'
  }
};

const mockPokemon2 = {
  id: 4,
  name: 'charmander',
  stats: [
    { stat: { name: 'hp' }, base_stat: 39 },
    { stat: { name: 'attack' }, base_stat: 52 },
    { stat: { name: 'defense' }, base_stat: 43 },
    { stat: { name: 'special-attack' }, base_stat: 60 },
    { stat: { name: 'special-defense' }, base_stat: 50 },
    { stat: { name: 'speed' }, base_stat: 65 }
  ],
  types: [{ type: { name: 'fire' } }],
  abilities: [
    { ability: { name: 'blaze' }, is_hidden: false, slot: 1 },
    { ability: { name: 'solar-power' }, is_hidden: true, slot: 3 }
  ],
  sprites: {
    front_default: 'https://example.com/charmander.png',
    back_default: 'https://example.com/charmander-back.png'
  }
};

const mockMove = {
  name: 'tackle',
  type: { name: 'normal' },
  power: 40,
  accuracy: 100,
  pp: 35,
  damage_class: { name: 'physical' }
};

describe('Team Battle Engine', () => {
  describe('Helper Functions', () => {
    test('should calculate HP correctly', () => {
      expect(calculateHp(45, 5)).toBe(21);
      expect(calculateHp(100, 50)).toBe(175);
    });

    test('should calculate stats correctly', () => {
      expect(calculateStat(49, 5)).toBe(11);
      expect(calculateStat(100, 50)).toBe(120);
    });

    test('should get current Pokémon from team', () => {
      const team = {
        pokemon: [
          { pokemon: mockPokemon1, level: 5, currentHp: 22, maxHp: 22, moves: [mockMove], statModifiers: {} },
          { pokemon: mockPokemon2, level: 5, currentHp: 19, maxHp: 19, moves: [mockMove], statModifiers: {} }
        ],
        currentIndex: 0,
        faintedCount: 0
      };

      const current = getCurrentPokemon(team);
      expect(current.pokemon.name).toBe('bulbasaur');
    });

    test('should check if team is defeated', () => {
      const team = {
        pokemon: [
          { pokemon: mockPokemon1, level: 5, currentHp: 0, maxHp: 22, moves: [mockMove], statModifiers: {} },
          { pokemon: mockPokemon2, level: 5, currentHp: 0, maxHp: 19, moves: [mockMove], statModifiers: {} }
        ],
        currentIndex: 0,
        faintedCount: 2
      };

      expect(isTeamDefeated(team)).toBe(true);
    });

    test('should find next available Pokémon', () => {
      const team = {
        pokemon: [
          { pokemon: mockPokemon1, level: 5, currentHp: 0, maxHp: 22, moves: [mockMove], statModifiers: {} },
          { pokemon: mockPokemon2, level: 5, currentHp: 19, maxHp: 19, moves: [mockMove], statModifiers: {} }
        ],
        currentIndex: 0,
        faintedCount: 1
      };

      const nextIndex = getNextAvailablePokemon(team);
      expect(nextIndex).toBe(1);
    });

    test('should switch to Pokémon', () => {
      const team = {
        pokemon: [
          { pokemon: mockPokemon1, level: 5, currentHp: 0, maxHp: 22, moves: [mockMove], statModifiers: {} },
          { pokemon: mockPokemon2, level: 5, currentHp: 19, maxHp: 19, moves: [mockMove], statModifiers: {} }
        ],
        currentIndex: 0,
        faintedCount: 1
      };

      switchToPokemon(team, 1);
      expect(team.currentIndex).toBe(1);
    });
  });

  describe('Battle Initialization', () => {
    test('should initialize team battle correctly', () => {
      const playerTeam = [
        { pokemon: mockPokemon1, level: 5, moves: [mockMove] }
      ];
      const opponentTeam = [
        { pokemon: mockPokemon2, level: 5, moves: [mockMove] }
      ];

      const battle = initializeTeamBattle(playerTeam, opponentTeam, "Player Team", "Opponent Team");

      expect(battle.player.pokemon).toHaveLength(1);
      expect(battle.opponent.pokemon).toHaveLength(1);
      expect(battle.player.currentIndex).toBe(0);
      expect(battle.opponent.currentIndex).toBe(0);
      expect(battle.turnNumber).toBe(1);
      expect(battle.isComplete).toBe(false);
      expect(battle.battleLog).toHaveLength(1);
      expect(battle.battleLog[0].type).toBe('battle_start');
    });

    test('should calculate HP correctly for team members', () => {
      const playerTeam = [
        { pokemon: mockPokemon1, level: 5, moves: [mockMove] }
      ];
      const opponentTeam = [
        { pokemon: mockPokemon2, level: 5, moves: [mockMove] }
      ];

      const battle = initializeTeamBattle(playerTeam, opponentTeam, "Player Team", "Opponent Team");

      const playerCurrent = getCurrentPokemon(battle.player);
      const opponentCurrent = getCurrentPokemon(battle.opponent);

      expect(playerCurrent.currentHp).toBe(21); // Bulbasaur HP at level 5
      expect(playerCurrent.maxHp).toBe(21);
      expect(opponentCurrent.currentHp).toBe(20); // Charmander HP at level 5
      expect(opponentCurrent.maxHp).toBe(20);
    });
  });

  describe('Battle Execution', () => {
    test('should execute move action', () => {
      const playerTeam = [
        { pokemon: mockPokemon1, level: 5, moves: [mockMove] }
      ];
      const opponentTeam = [
        { pokemon: mockPokemon2, level: 5, moves: [mockMove] }
      ];

      const battle = initializeTeamBattle(playerTeam, opponentTeam, "Player Team", "Opponent Team");
      const newBattle = executeTeamAction(battle, { type: 'move', moveIndex: 0 });

      expect(newBattle.turnNumber).toBe(2);
      // Turn should switch after move execution (Charmander has higher speed, so opponent goes first)
      expect(newBattle.turn).toBe('player');
      expect(newBattle.battleLog.length).toBeGreaterThan(battle.battleLog.length);
    });

    test('should handle Pokémon fainting and switching', () => {
      const playerTeam = [
        { pokemon: mockPokemon1, level: 5, moves: [mockMove] },
        { pokemon: mockPokemon2, level: 5, moves: [mockMove] }
      ];
      const opponentTeam = [
        { pokemon: mockPokemon1, level: 5, moves: [mockMove] }
      ];

      const battle = initializeTeamBattle(playerTeam, opponentTeam, "Player Team", "Opponent Team");
      
      // Set first Pokémon to 0 HP
      battle.player.pokemon[0].currentHp = 0;
      battle.player.faintedCount = 1;

      const newBattle = executeTeamAction(battle, { type: 'move', moveIndex: 0 });

      // Should switch to next Pokémon
      expect(newBattle.player.currentIndex).toBe(1);
      expect(newBattle.battleLog.some(log => log.type === 'pokemon_sent_out')).toBe(true);
    });

    test('should end battle when team is defeated', () => {
      const playerTeam = [
        { pokemon: mockPokemon1, level: 5, moves: [mockMove] }
      ];
      const opponentTeam = [
        { pokemon: mockPokemon2, level: 5, moves: [mockMove] }
      ];

      const battle = initializeTeamBattle(playerTeam, opponentTeam, "Player Team", "Opponent Team");
      
      // Set player team as defeated
      battle.player.pokemon[0].currentHp = 0;
      battle.player.faintedCount = 1;

      const newBattle = executeTeamAction(battle, { type: 'move', moveIndex: 0 });

      expect(newBattle.isComplete).toBe(true);
      expect(newBattle.winner).toBe('opponent');
      expect(newBattle.battleLog.some(log => log.type === 'battle_end')).toBe(true);
    });
  });
});
