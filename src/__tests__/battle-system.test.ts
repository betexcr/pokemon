/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import BattleRuntimePage from '@/app/battle/runtime/page';

// Mock Next.js router and search params
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock the API functions
jest.mock('@/lib/api', () => ({
  getPokemon: jest.fn(),
  getMove: jest.fn(),
}));

// Mock the battle engine
jest.mock('@/lib/battle-engine', () => ({
  initializeBattle: jest.fn(),
  executeAction: jest.fn(),
  calculateHp: jest.fn(),
  calculateStat: jest.fn(),
}));

// Mock the AI battle
jest.mock('@/lib/ai-battle', () => ({
  getAIMove: jest.fn(),
}));

// Mock gym champions
jest.mock('@/lib/gym_champions', () => ({
  GYM_CHAMPIONS: {
    'brock-kanto': {
      name: 'Brock',
      pokemon: [
        {
          id: 74,
          name: 'geodude',
          level: 12,
          moves: [
            { name: 'tackle', type: 'normal', power: 40, accuracy: 100, pp: 35, effect: 'Deals damage', damage_class: 'physical', priority: 0 },
            { name: 'rock-throw', type: 'rock', power: 50, accuracy: 90, pp: 15, effect: 'Deals damage', damage_class: 'physical', priority: 0 },
          ]
        }
      ]
    }
  }
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Battle System', () => {
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  };

  const mockSearchParams = {
    get: jest.fn(),
  };

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    
    // Set up default search params
    mockSearchParams.get.mockImplementation((key: string) => {
      switch (key) {
        case 'player': return 'test-team-id';
        case 'opponentKind': return 'champion';
        case 'opponentId': return 'brock-kanto';
        case 'difficulty': return 'normal';
        default: return null;
      }
    });

    localStorageMock.getItem.mockReturnValue(JSON.stringify({
      id: 'test-team-id',
      name: 'Test Team',
      slots: [
        {
          id: 25,
          level: 15,
          moves: [
            { name: 'thunderbolt', type: 'electric', power: 90, accuracy: 100, pp: 15, effect: 'Deals damage', damage_class: 'special', priority: 0 },
            { name: 'quick-attack', type: 'normal', power: 40, accuracy: 100, pp: 30, effect: 'Deals damage', damage_class: 'physical', priority: 1 },
            { name: 'iron-tail', type: 'steel', power: 100, accuracy: 75, pp: 15, effect: 'Deals damage', damage_class: 'physical', priority: 0 },
            { name: 'thunder', type: 'electric', power: 110, accuracy: 70, pp: 10, effect: 'Deals damage', damage_class: 'special', priority: 0 },
          ]
        },
        { id: null, level: 15, moves: [] },
        { id: null, level: 15, moves: [] },
        { id: null, level: 15, moves: [] },
        { id: null, level: 15, moves: [] },
        { id: null, level: 15, moves: [] },
      ]
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize battle with correct parameters', async () => {
    const { getPokemon } = require('@/lib/api');
    const { initializeBattle } = require('@/lib/battle-engine');

    // Mock Pokemon data
    const mockPikachu = {
      id: 25,
      name: 'pikachu',
      sprites: {
        front_default: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
        back_default: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/25.png',
      },
      types: [{ type: { name: 'electric' } }],
      stats: [
        { stat: { name: 'hp' }, base_stat: 35 },
        { stat: { name: 'attack' }, base_stat: 55 },
        { stat: { name: 'defense' }, base_stat: 40 },
        { stat: { name: 'special-attack' }, base_stat: 50 },
        { stat: { name: 'special-defense' }, base_stat: 50 },
        { stat: { name: 'speed' }, base_stat: 90 },
      ],
    };

    const mockGeodude = {
      id: 74,
      name: 'geodude',
      sprites: {
        front_default: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/74.png',
        back_default: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/74.png',
      },
      types: [{ type: { name: 'rock' } }, { type: { name: 'ground' } }],
      stats: [
        { stat: { name: 'hp' }, base_stat: 40 },
        { stat: { name: 'attack' }, base_stat: 80 },
        { stat: { name: 'defense' }, base_stat: 100 },
        { stat: { name: 'special-attack' }, base_stat: 30 },
        { stat: { name: 'special-defense' }, base_stat: 30 },
        { stat: { name: 'speed' }, base_stat: 20 },
      ],
    };

    getPokemon.mockImplementation((id: number) => {
      if (id === 25) return Promise.resolve(mockPikachu);
      if (id === 74) return Promise.resolve(mockGeodude);
      return Promise.reject(new Error('Pokemon not found'));
    });

    // Mock battle initialization
    const mockBattleState = {
      player: {
        pokemon: mockPikachu,
        level: 15,
        currentHp: 100,
        maxHp: 100,
        moves: [
          { name: 'thunderbolt', type: 'electric', power: 90, accuracy: 100, pp: 15, effect: 'Deals damage', damage_class: 'special', priority: 0 },
          { name: 'quick-attack', type: 'normal', power: 40, accuracy: 100, pp: 30, effect: 'Deals damage', damage_class: 'physical', priority: 1 },
          { name: 'iron-tail', type: 'steel', power: 100, accuracy: 75, pp: 15, effect: 'Deals damage', damage_class: 'physical', priority: 0 },
          { name: 'thunder', type: 'electric', power: 110, accuracy: 70, pp: 10, effect: 'Deals damage', damage_class: 'special', priority: 0 },
        ],
        statModifiers: {
          attack: 0,
          defense: 0,
          specialAttack: 0,
          specialDefense: 0,
          speed: 0,
          accuracy: 0,
          evasion: 0,
        },
      },
      opponent: {
        pokemon: mockGeodude,
        level: 12,
        currentHp: 80,
        maxHp: 80,
        moves: [
          { name: 'tackle', type: 'normal', power: 40, accuracy: 100, pp: 35, effect: 'Deals damage', damage_class: 'physical', priority: 0 },
          { name: 'rock-throw', type: 'rock', power: 50, accuracy: 90, pp: 15, effect: 'Deals damage', damage_class: 'physical', priority: 0 },
        ],
        statModifiers: {
          attack: 0,
          defense: 0,
          specialAttack: 0,
          specialDefense: 0,
          speed: 0,
          accuracy: 0,
          evasion: 0,
        },
      },
      turn: 'player',
      turnNumber: 1,
      battleLog: [
        {
          type: 'battle_start',
          message: 'Battle Start!\nTrainer Red sends out pikachu!\nTrainer Blue sends out geodude!',
          pokemon: 'pikachu'
        }
      ],
      isComplete: false,
    };

    initializeBattle.mockReturnValue(mockBattleState);

    render(<BattleRuntimePage />);

    await waitFor(() => {
      expect(screen.getByText('Battle Start!')).toBeInTheDocument();
    });

    // Verify battle initialization was called with correct parameters
    expect(initializeBattle).toHaveBeenCalledWith(
      mockPikachu,
      15,
      expect.arrayContaining([
        expect.objectContaining({ name: 'thunderbolt' }),
        expect.objectContaining({ name: 'quick-attack' }),
        expect.objectContaining({ name: 'iron-tail' }),
        expect.objectContaining({ name: 'thunder' }),
      ]),
      mockGeodude,
      12,
      expect.arrayContaining([
        expect.objectContaining({ name: 'tackle' }),
        expect.objectContaining({ name: 'rock-throw' }),
      ])
    );
  });

  it('should display battle information correctly', async () => {
    const { getPokemon } = require('@/lib/api');
    const { initializeBattle } = require('@/lib/battle-engine');

    const mockPikachu = {
      id: 25,
      name: 'pikachu',
      sprites: {
        front_default: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
        back_default: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/25.png',
      },
      types: [{ type: { name: 'electric' } }],
      stats: [
        { stat: { name: 'hp' }, base_stat: 35 },
        { stat: { name: 'attack' }, base_stat: 55 },
        { stat: { name: 'defense' }, base_stat: 40 },
        { stat: { name: 'special-attack' }, base_stat: 50 },
        { stat: { name: 'special-defense' }, base_stat: 50 },
        { stat: { name: 'speed' }, base_stat: 90 },
      ],
    };

    const mockGeodude = {
      id: 74,
      name: 'geodude',
      sprites: {
        front_default: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/74.png',
        back_default: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/74.png',
      },
      types: [{ type: { name: 'rock' } }, { type: { name: 'ground' } }],
      stats: [
        { stat: { name: 'hp' }, base_stat: 40 },
        { stat: { name: 'attack' }, base_stat: 80 },
        { stat: { name: 'defense' }, base_stat: 100 },
        { stat: { name: 'special-attack' }, base_stat: 30 },
        { stat: { name: 'special-defense' }, base_stat: 30 },
        { stat: { name: 'speed' }, base_stat: 20 },
      ],
    };

    getPokemon.mockImplementation((id: number) => {
      if (id === 25) return Promise.resolve(mockPikachu);
      if (id === 74) return Promise.resolve(mockGeodude);
      return Promise.reject(new Error('Pokemon not found'));
    });

    const mockBattleState = {
      player: {
        pokemon: mockPikachu,
        level: 15,
        currentHp: 100,
        maxHp: 100,
        moves: [
          { name: 'thunderbolt', type: 'electric', power: 90, accuracy: 100, pp: 15, effect: 'Deals damage', damage_class: 'special', priority: 0 },
          { name: 'quick-attack', type: 'normal', power: 40, accuracy: 100, pp: 30, effect: 'Deals damage', damage_class: 'physical', priority: 1 },
          { name: 'iron-tail', type: 'steel', power: 100, accuracy: 75, pp: 15, effect: 'Deals damage', damage_class: 'physical', priority: 0 },
          { name: 'thunder', type: 'electric', power: 110, accuracy: 70, pp: 10, effect: 'Deals damage', damage_class: 'special', priority: 0 },
        ],
        statModifiers: {
          attack: 0,
          defense: 0,
          specialAttack: 0,
          specialDefense: 0,
          speed: 0,
          accuracy: 0,
          evasion: 0,
        },
      },
      opponent: {
        pokemon: mockGeodude,
        level: 12,
        currentHp: 80,
        maxHp: 80,
        moves: [
          { name: 'tackle', type: 'normal', power: 40, accuracy: 100, pp: 35, effect: 'Deals damage', damage_class: 'physical', priority: 0 },
          { name: 'rock-throw', type: 'rock', power: 50, accuracy: 90, pp: 15, effect: 'Deals damage', damage_class: 'physical', priority: 0 },
        ],
        statModifiers: {
          attack: 0,
          defense: 0,
          specialAttack: 0,
          specialDefense: 0,
          speed: 0,
          accuracy: 0,
          evasion: 0,
        },
      },
      turn: 'player',
      turnNumber: 1,
      battleLog: [
        {
          type: 'battle_start',
          message: 'Battle Start!\nTrainer Red sends out pikachu!\nTrainer Blue sends out geodude!',
          pokemon: 'pikachu'
        }
      ],
      isComplete: false,
    };

    initializeBattle.mockReturnValue(mockBattleState);

    render(<BattleRuntimePage />);

    await waitFor(() => {
      expect(screen.getByText('Your Turn')).toBeInTheDocument();
    });

    // Verify Pokemon names are displayed
    expect(screen.getByText('pikachu')).toBeInTheDocument();
    expect(screen.getByText('geodude')).toBeInTheDocument();

    // Verify levels are displayed
    expect(screen.getByText('Lv. 15')).toBeInTheDocument();
    expect(screen.getByText('Lv. 12')).toBeInTheDocument();

    // Verify HP is displayed
    expect(screen.getByText('100 / 100')).toBeInTheDocument();
    expect(screen.getByText('80 / 80')).toBeInTheDocument();

    // Verify move selection is available
    expect(screen.getByText('Select a Move')).toBeInTheDocument();
    expect(screen.getByText('thunderbolt')).toBeInTheDocument();
    expect(screen.getByText('quick-attack')).toBeInTheDocument();
    expect(screen.getByText('iron-tail')).toBeInTheDocument();
    expect(screen.getByText('thunder')).toBeInTheDocument();
  });

  it('should handle move selection and execution', async () => {
    const { getPokemon } = require('@/lib/api');
    const { initializeBattle, executeAction } = require('@/lib/battle-engine');
    const { getAIMove } = require('@/lib/ai-battle');

    const mockPikachu = {
      id: 25,
      name: 'pikachu',
      sprites: {
        front_default: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
        back_default: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/25.png',
      },
      types: [{ type: { name: 'electric' } }],
      stats: [
        { stat: { name: 'hp' }, base_stat: 35 },
        { stat: { name: 'attack' }, base_stat: 55 },
        { stat: { name: 'defense' }, base_stat: 40 },
        { stat: { name: 'special-attack' }, base_stat: 50 },
        { stat: { name: 'special-defense' }, base_stat: 50 },
        { stat: { name: 'speed' }, base_stat: 90 },
      ],
    };

    const mockGeodude = {
      id: 74,
      name: 'geodude',
      sprites: {
        front_default: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/74.png',
        back_default: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/74.png',
      },
      types: [{ type: { name: 'rock' } }, { type: { name: 'ground' } }],
      stats: [
        { stat: { name: 'hp' }, base_stat: 40 },
        { stat: { name: 'attack' }, base_stat: 80 },
        { stat: { name: 'defense' }, base_stat: 100 },
        { stat: { name: 'special-attack' }, base_stat: 30 },
        { stat: { name: 'special-defense' }, base_stat: 30 },
        { stat: { name: 'speed' }, base_stat: 20 },
      ],
    };

    getPokemon.mockImplementation((id: number) => {
      if (id === 25) return Promise.resolve(mockPikachu);
      if (id === 74) return Promise.resolve(mockGeodude);
      return Promise.reject(new Error('Pokemon not found'));
    });

    const initialBattleState = {
      player: {
        pokemon: mockPikachu,
        level: 15,
        currentHp: 100,
        maxHp: 100,
        moves: [
          { name: 'thunderbolt', type: 'electric', power: 90, accuracy: 100, pp: 15, effect: 'Deals damage', damage_class: 'special', priority: 0 },
          { name: 'quick-attack', type: 'normal', power: 40, accuracy: 100, pp: 30, effect: 'Deals damage', damage_class: 'physical', priority: 1 },
          { name: 'iron-tail', type: 'steel', power: 100, accuracy: 75, pp: 15, effect: 'Deals damage', damage_class: 'physical', priority: 0 },
          { name: 'thunder', type: 'electric', power: 110, accuracy: 70, pp: 10, effect: 'Deals damage', damage_class: 'special', priority: 0 },
        ],
        statModifiers: {
          attack: 0,
          defense: 0,
          specialAttack: 0,
          specialDefense: 0,
          speed: 0,
          accuracy: 0,
          evasion: 0,
        },
      },
      opponent: {
        pokemon: mockGeodude,
        level: 12,
        currentHp: 80,
        maxHp: 80,
        moves: [
          { name: 'tackle', type: 'normal', power: 40, accuracy: 100, pp: 35, effect: 'Deals damage', damage_class: 'physical', priority: 0 },
          { name: 'rock-throw', type: 'rock', power: 50, accuracy: 90, pp: 15, effect: 'Deals damage', damage_class: 'physical', priority: 0 },
        ],
        statModifiers: {
          attack: 0,
          defense: 0,
          specialAttack: 0,
          specialDefense: 0,
          speed: 0,
          accuracy: 0,
          evasion: 0,
        },
      },
      turn: 'player',
      turnNumber: 1,
      battleLog: [
        {
          type: 'battle_start',
          message: 'Battle Start!\nTrainer Red sends out pikachu!\nTrainer Blue sends out geodude!',
          pokemon: 'pikachu'
        }
      ],
      isComplete: false,
    };

    const afterPlayerMoveState = {
      ...initialBattleState,
      turn: 'opponent',
      turnNumber: 2,
      battleLog: [
        ...initialBattleState.battleLog,
        {
          type: 'turn_start',
          message: 'Turn 2:',
          turn: 2
        },
        {
          type: 'move_used',
          message: 'pikachu used thunderbolt!',
          pokemon: 'pikachu',
          move: 'thunderbolt'
        },
        {
          type: 'damage_dealt',
          message: 'It\'s super effective! geodude took 45% damage (55% HP left).',
          pokemon: 'geodude',
          damage: 45,
          effectiveness: 'super_effective'
        }
      ],
    };

    const afterAIMoveState = {
      ...afterPlayerMoveState,
      turn: 'player',
      turnNumber: 3,
      battleLog: [
        ...afterPlayerMoveState.battleLog,
        {
          type: 'turn_start',
          message: 'Turn 3:',
          turn: 3
        },
        {
          type: 'move_used',
          message: 'geodude used tackle!',
          pokemon: 'geodude',
          move: 'tackle'
        },
        {
          type: 'damage_dealt',
          message: 'pikachu took 20% damage (80% HP left).',
          pokemon: 'pikachu',
          damage: 20,
          effectiveness: 'normal'
        }
      ],
    };

    initializeBattle.mockReturnValue(initialBattleState);
    executeAction
      .mockReturnValueOnce(afterPlayerMoveState)
      .mockReturnValueOnce(afterAIMoveState);
    getAIMove.mockResolvedValue({ type: 'move', moveIndex: 0 });

    render(<BattleRuntimePage />);

    await waitFor(() => {
      expect(screen.getByText('Your Turn')).toBeInTheDocument();
    });

    // Click on thunderbolt move
    const thunderboltButton = screen.getByText('thunderbolt');
    fireEvent.click(thunderboltButton);

    // Wait for AI turn
    await waitFor(() => {
      expect(screen.getByText('Opponent\'s Turn')).toBeInTheDocument();
    });

    // Verify move execution was called
    expect(executeAction).toHaveBeenCalledWith(initialBattleState, { type: 'move', moveIndex: 0 });
    expect(getAIMove).toHaveBeenCalledWith(afterPlayerMoveState, 'normal', 1500);
    expect(executeAction).toHaveBeenCalledWith(afterPlayerMoveState, { type: 'move', moveIndex: 0 });
  });

  it('should handle battle completion', async () => {
    const { getPokemon } = require('@/lib/api');
    const { initializeBattle } = require('@/lib/battle-engine');

    const mockPikachu = {
      id: 25,
      name: 'pikachu',
      sprites: {
        front_default: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
        back_default: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/25.png',
      },
      types: [{ type: { name: 'electric' } }],
      stats: [
        { stat: { name: 'hp' }, base_stat: 35 },
        { stat: { name: 'attack' }, base_stat: 55 },
        { stat: { name: 'defense' }, base_stat: 40 },
        { stat: { name: 'special-attack' }, base_stat: 50 },
        { stat: { name: 'special-defense' }, base_stat: 50 },
        { stat: { name: 'speed' }, base_stat: 90 },
      ],
    };

    const mockGeodude = {
      id: 74,
      name: 'geodude',
      sprites: {
        front_default: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/74.png',
        back_default: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/74.png',
      },
      types: [{ type: { name: 'rock' } }, { type: { name: 'ground' } }],
      stats: [
        { stat: { name: 'hp' }, base_stat: 40 },
        { stat: { name: 'attack' }, base_stat: 80 },
        { stat: { name: 'defense' }, base_stat: 100 },
        { stat: { name: 'special-attack' }, base_stat: 30 },
        { stat: { name: 'special-defense' }, base_stat: 30 },
        { stat: { name: 'speed' }, base_stat: 20 },
      ],
    };

    getPokemon.mockImplementation((id: number) => {
      if (id === 25) return Promise.resolve(mockPikachu);
      if (id === 74) return Promise.resolve(mockGeodude);
      return Promise.reject(new Error('Pokemon not found'));
    });

    const completedBattleState = {
      player: {
        pokemon: mockPikachu,
        level: 15,
        currentHp: 100,
        maxHp: 100,
        moves: [
          { name: 'thunderbolt', type: 'electric', power: 90, accuracy: 100, pp: 15, effect: 'Deals damage', damage_class: 'special', priority: 0 },
          { name: 'quick-attack', type: 'normal', power: 40, accuracy: 100, pp: 30, effect: 'Deals damage', damage_class: 'physical', priority: 1 },
          { name: 'iron-tail', type: 'steel', power: 100, accuracy: 75, pp: 15, effect: 'Deals damage', damage_class: 'physical', priority: 0 },
          { name: 'thunder', type: 'electric', power: 110, accuracy: 70, pp: 10, effect: 'Deals damage', damage_class: 'special', priority: 0 },
        ],
        statModifiers: {
          attack: 0,
          defense: 0,
          specialAttack: 0,
          specialDefense: 0,
          speed: 0,
          accuracy: 0,
          evasion: 0,
        },
      },
      opponent: {
        pokemon: mockGeodude,
        level: 12,
        currentHp: 0,
        maxHp: 80,
        moves: [
          { name: 'tackle', type: 'normal', power: 40, accuracy: 100, pp: 35, effect: 'Deals damage', damage_class: 'physical', priority: 0 },
          { name: 'rock-throw', type: 'rock', power: 50, accuracy: 90, pp: 15, effect: 'Deals damage', damage_class: 'physical', priority: 0 },
        ],
        statModifiers: {
          attack: 0,
          defense: 0,
          specialAttack: 0,
          specialDefense: 0,
          speed: 0,
          accuracy: 0,
          evasion: 0,
        },
      },
      turn: 'player',
      turnNumber: 5,
      battleLog: [
        {
          type: 'battle_start',
          message: 'Battle Start!\nTrainer Red sends out pikachu!\nTrainer Blue sends out geodude!',
          pokemon: 'pikachu'
        },
        {
          type: 'pokemon_fainted',
          message: 'geodude fainted!',
          pokemon: 'geodude'
        }
      ],
      isComplete: true,
      winner: 'player',
    };

    initializeBattle.mockReturnValue(completedBattleState);

    render(<BattleRuntimePage />);

    await waitFor(() => {
      expect(screen.getByText('Victory!')).toBeInTheDocument();
    });

    // Verify victory message
    expect(screen.getByText('Victory!')).toBeInTheDocument();
    
    // Verify move selection is not available
    expect(screen.queryByText('Select a Move')).not.toBeInTheDocument();
  });

  it('should handle battle errors gracefully', async () => {
    const { getPokemon } = require('@/lib/api');

    // Mock API error
    getPokemon.mockRejectedValue(new Error('Failed to fetch'));

    render(<BattleRuntimePage />);

    await waitFor(() => {
      expect(screen.getByText('Network error: Unable to connect to Pokemon API. Please check your internet connection.')).toBeInTheDocument();
    });

    // Verify error message is displayed
    expect(screen.getByText('Network error: Unable to connect to Pokemon API. Please check your internet connection.')).toBeInTheDocument();
  });

  it('should handle missing battle parameters', async () => {
    // Mock missing search params
    mockSearchParams.get.mockReturnValue(null);

    render(<BattleRuntimePage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to initialize battle')).toBeInTheDocument();
    });

    // Verify error message is displayed
    expect(screen.getByText('Failed to initialize battle')).toBeInTheDocument();
  });
});
