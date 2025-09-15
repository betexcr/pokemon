import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import RTDBBattleComponent from '../RTDBBattleComponent';
import { BattleFlowEngine } from '@/lib/battle-engine-rtdb';
import { BattleState, BattlePokemon, BattleTeam } from '@/lib/team-battle-engine';

// Mock the BattleFlowEngine
vi.mock('@/lib/battle-engine-rtdb', () => ({
  BattleFlowEngine: vi.fn()
}));

// Mock Firebase
vi.mock('@/lib/firebase', () => ({
  auth: {
    currentUser: {
      uid: 'test-user-uid'
    }
  }
}));

describe('RTDBBattleComponent', () => {
  let mockBattleEngine: {
    initialize: Mock;
    destroy: Mock;
    submitMove: Mock;
    submitSwitch: Mock;
  };
  let mockOnBattleComplete: Mock;

  const mockBattleId = 'test-battle-123';

  const createMockBattleState = (overrides: Partial<BattleState> = {}): BattleState => {
    const mockPokemon: BattlePokemon = {
      pokemon: {
        name: 'Pikachu',
        id: 25,
        types: [{ type: { name: 'electric' } }],
        stats: [
          { stat: { name: 'hp' }, base_stat: 35 },
          { stat: { name: 'attack' }, base_stat: 55 },
          { stat: { name: 'defense' }, base_stat: 40 },
          { stat: { name: 'special-attack' }, base_stat: 50 },
          { stat: { name: 'special-defense' }, base_stat: 50 },
          { stat: { name: 'speed' }, base_stat: 90 }
        ],
        weight: 60,
        height: 4,
        abilities: [{ ability: { name: 'static' }, is_hidden: false }],
        sprites: { front_default: 'pikachu.png' }
      },
      level: 50,
      currentHp: 100,
      maxHp: 100,
      moves: [
        { id: 'thunderbolt', pp: 15, maxPp: 15, disabled: false },
        { id: 'quick-attack', pp: 30, maxPp: 30, disabled: false }
      ],
      volatile: {},
      statModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 }
    };

    const mockTeam: BattleTeam = {
      pokemon: [mockPokemon],
      currentIndex: 0,
      faintedCount: 0,
      sideConditions: {}
    };

    return {
      player: mockTeam,
      opponent: mockTeam,
      turn: 1,
      rng: 12345,
      battleLog: [],
      isComplete: false,
      phase: 'choice',
      actionQueue: [],
      field: {},
      ...overrides
    };
  };

  beforeEach(() => {
    mockOnBattleComplete = vi.fn();
    
    mockBattleEngine = {
      initialize: vi.fn().mockResolvedValue(undefined),
      destroy: vi.fn(),
      submitMove: vi.fn().mockResolvedValue(undefined),
      submitSwitch: vi.fn().mockResolvedValue(undefined)
    };

    (BattleFlowEngine as Mock).mockImplementation(() => mockBattleEngine);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize battle engine on mount', async () => {
      render(<RTDBBattleComponent battleId={mockBattleId} onBattleComplete={mockOnBattleComplete} />);

      expect(BattleFlowEngine).toHaveBeenCalledWith(mockBattleId);
      expect(mockBattleEngine.initialize).toHaveBeenCalled();
    });

    it('should show loading state initially', () => {
      render(<RTDBBattleComponent battleId={mockBattleId} onBattleComplete={mockOnBattleComplete} />);

      expect(screen.getByText('Initializing battle...')).toBeInTheDocument();
    });

    it('should show error state if initialization fails', async () => {
      mockBattleEngine.initialize.mockRejectedValue(new Error('Initialization failed'));

      render(<RTDBBattleComponent battleId={mockBattleId} onBattleComplete={mockOnBattleComplete} />);

      await waitFor(() => {
        expect(screen.getByText('Error: Initialization failed')).toBeInTheDocument();
      });
    });
  });

  describe('battle display', () => {
    beforeEach(async () => {
      // Mock successful initialization with battle state
      mockBattleEngine.initialize.mockImplementation((onStateChange, onPhaseChange) => {
        // Simulate state change
        setTimeout(() => {
          onStateChange(createMockBattleState());
          onPhaseChange('choosing');
        }, 0);
        return Promise.resolve();
      });

      render(<RTDBBattleComponent battleId={mockBattleId} onBattleComplete={mockOnBattleComplete} />);

      await waitFor(() => {
        expect(screen.getByText('Battle Phase: choosing')).toBeInTheDocument();
      });
    });

    it('should display battle phase and turn', () => {
      expect(screen.getByText('Battle Phase: choosing')).toBeInTheDocument();
      expect(screen.getByText('Turn: 1')).toBeInTheDocument();
    });

    it('should display player and opponent Pokemon', () => {
      expect(screen.getByText('Your Pokemon')).toBeInTheDocument();
      expect(screen.getByText('Opponent Pokemon')).toBeInTheDocument();
      expect(screen.getByText('Pikachu')).toBeInTheDocument();
    });

    it('should display Pokemon HP and level', () => {
      expect(screen.getByText('HP: 100/100')).toBeInTheDocument();
      expect(screen.getByText('Level: 50')).toBeInTheDocument();
    });

    it('should highlight current Pokemon', () => {
      const playerPokemon = screen.getByText('Pikachu').closest('.pokemon-card');
      expect(playerPokemon).toHaveClass('border-blue-500', 'bg-blue-50');
    });
  });

  describe('move selection', () => {
    beforeEach(async () => {
      mockBattleEngine.initialize.mockImplementation((onStateChange, onPhaseChange) => {
        setTimeout(() => {
          onStateChange(createMockBattleState());
          onPhaseChange('choosing');
        }, 0);
        return Promise.resolve();
      });

      render(<RTDBBattleComponent battleId={mockBattleId} onBattleComplete={mockOnBattleComplete} />);

      await waitFor(() => {
        expect(screen.getByText('Choose Your Action')).toBeInTheDocument();
      });
    });

    it('should display available moves', () => {
      expect(screen.getByText('thunderbolt (PP: 15)')).toBeInTheDocument();
      expect(screen.getByText('quick-attack (PP: 30)')).toBeInTheDocument();
    });

    it('should submit move when clicked', async () => {
      const thunderboltButton = screen.getByText('thunderbolt (PP: 15)');
      fireEvent.click(thunderboltButton);

      expect(mockBattleEngine.submitMove).toHaveBeenCalledWith('thunderbolt', undefined);
    });

    it('should disable moves with no PP', () => {
      const mockBattleState = createMockBattleState();
      mockBattleState.player.pokemon[0].moves[0].pp = 0;

      mockBattleEngine.initialize.mockImplementation((onStateChange, onPhaseChange) => {
        setTimeout(() => {
          onStateChange(mockBattleState);
          onPhaseChange('choosing');
        }, 0);
        return Promise.resolve();
      });

      render(<RTDBBattleComponent battleId={mockBattleId} onBattleComplete={mockOnBattleComplete} />);

      waitFor(() => {
        const thunderboltButton = screen.getByText('thunderbolt (PP: 0)');
        expect(thunderboltButton).toBeDisabled();
      });
    });
  });

  describe('Pokemon switching', () => {
    beforeEach(async () => {
      const mockBattleState = createMockBattleState();
      // Add a second Pokemon for switching
      mockBattleState.player.pokemon.push({
        ...mockBattleState.player.pokemon[0],
        pokemon: { ...mockBattleState.player.pokemon[0].pokemon, name: 'Charmander' },
        currentHp: 80,
        maxHp: 80
      });

      mockBattleEngine.initialize.mockImplementation((onStateChange, onPhaseChange) => {
        setTimeout(() => {
          onStateChange(mockBattleState);
          onPhaseChange('choosing');
        }, 0);
        return Promise.resolve();
      });

      render(<RTDBBattleComponent battleId={mockBattleId} onBattleComplete={mockOnBattleComplete} />);

      await waitFor(() => {
        expect(screen.getByText('Switch Pokemon')).toBeInTheDocument();
      });
    });

    it('should display available Pokemon for switching', () => {
      expect(screen.getByText('Pikachu (HP: 100)')).toBeInTheDocument();
      expect(screen.getByText('Charmander (HP: 80)')).toBeInTheDocument();
    });

    it('should submit switch when clicked', async () => {
      const charmanderButton = screen.getByText('Charmander (HP: 80)');
      fireEvent.click(charmanderButton);

      expect(mockBattleEngine.submitSwitch).toHaveBeenCalledWith(1);
    });

    it('should disable current Pokemon and fainted Pokemon', () => {
      const pikachuButton = screen.getByText('Pikachu (HP: 100)');
      expect(pikachuButton).toBeDisabled(); // Current Pokemon
    });
  });

  describe('battle completion', () => {
    it('should show victory message when player wins', async () => {
      const mockBattleState = createMockBattleState({
        isComplete: true,
        winner: 'player'
      });

      mockBattleEngine.initialize.mockImplementation((onStateChange, onPhaseChange) => {
        setTimeout(() => {
          onStateChange(mockBattleState);
          onPhaseChange('ended');
        }, 0);
        return Promise.resolve();
      });

      render(<RTDBBattleComponent battleId={mockBattleId} onBattleComplete={mockOnBattleComplete} />);

      await waitFor(() => {
        expect(screen.getByText('Victory!')).toBeInTheDocument();
        expect(screen.getByText('You won the battle!')).toBeInTheDocument();
      });
    });

    it('should show defeat message when player loses', async () => {
      const mockBattleState = createMockBattleState({
        isComplete: true,
        winner: 'opponent'
      });

      mockBattleEngine.initialize.mockImplementation((onStateChange, onPhaseChange) => {
        setTimeout(() => {
          onStateChange(mockBattleState);
          onPhaseChange('ended');
        }, 0);
        return Promise.resolve();
      });

      render(<RTDBBattleComponent battleId={mockBattleId} onBattleComplete={mockOnBattleComplete} />);

      await waitFor(() => {
        expect(screen.getByText('Defeat!')).toBeInTheDocument();
        expect(screen.getByText('You lost the battle!')).toBeInTheDocument();
      });
    });

    it('should call onBattleComplete when battle ends', async () => {
      const mockBattleState = createMockBattleState({
        isComplete: true,
        winner: 'player'
      });

      mockBattleEngine.initialize.mockImplementation((onStateChange, onPhaseChange) => {
        setTimeout(() => {
          onStateChange(mockBattleState);
          onPhaseChange('ended');
        }, 0);
        return Promise.resolve();
      });

      render(<RTDBBattleComponent battleId={mockBattleId} onBattleComplete={mockOnBattleComplete} />);

      await waitFor(() => {
        expect(mockOnBattleComplete).toHaveBeenCalledWith('player');
      });
    });
  });

  describe('battle log', () => {
    beforeEach(async () => {
      const mockBattleState = createMockBattleState({
        battleLog: [
          { type: 'battle_start', message: 'Battle Start!', pokemon: 'Pikachu' },
          { type: 'move_used', message: 'Pikachu used Thunderbolt!', pokemon: 'Pikachu', move: 'thunderbolt' },
          { type: 'damage_dealt', message: 'Charmander took 25% damage', pokemon: 'Charmander', damage: 25 }
        ]
      });

      mockBattleEngine.initialize.mockImplementation((onStateChange, onPhaseChange) => {
        setTimeout(() => {
          onStateChange(mockBattleState);
          onPhaseChange('choosing');
        }, 0);
        return Promise.resolve();
      });

      render(<RTDBBattleComponent battleId={mockBattleId} onBattleComplete={mockOnBattleComplete} />);

      await waitFor(() => {
        expect(screen.getByText('Battle Log')).toBeInTheDocument();
      });
    });

    it('should display battle log entries', () => {
      expect(screen.getByText('Battle Start!')).toBeInTheDocument();
      expect(screen.getByText('Pikachu used Thunderbolt!')).toBeInTheDocument();
      expect(screen.getByText('Charmander took 25% damage')).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('should show error message when move submission fails', async () => {
      mockBattleEngine.initialize.mockImplementation((onStateChange, onPhaseChange) => {
        setTimeout(() => {
          onStateChange(createMockBattleState());
          onPhaseChange('choosing');
        }, 0);
        return Promise.resolve();
      });

      mockBattleEngine.submitMove.mockRejectedValue(new Error('Move submission failed'));

      render(<RTDBBattleComponent battleId={mockBattleId} onBattleComplete={mockOnBattleComplete} />);

      await waitFor(() => {
        expect(screen.getByText('Choose Your Action')).toBeInTheDocument();
      });

      const thunderboltButton = screen.getByText('thunderbolt (PP: 15)');
      fireEvent.click(thunderboltButton);

      await waitFor(() => {
        expect(screen.getByText('Error: Move submission failed')).toBeInTheDocument();
      });
    });

    it('should show error message when switch submission fails', async () => {
      const mockBattleState = createMockBattleState();
      mockBattleState.player.pokemon.push({
        ...mockBattleState.player.pokemon[0],
        pokemon: { ...mockBattleState.player.pokemon[0].pokemon, name: 'Charmander' }
      });

      mockBattleEngine.initialize.mockImplementation((onStateChange, onPhaseChange) => {
        setTimeout(() => {
          onStateChange(mockBattleState);
          onPhaseChange('choosing');
        }, 0);
        return Promise.resolve();
      });

      mockBattleEngine.submitSwitch.mockRejectedValue(new Error('Switch submission failed'));

      render(<RTDBBattleComponent battleId={mockBattleId} onBattleComplete={mockOnBattleComplete} />);

      await waitFor(() => {
        expect(screen.getByText('Switch Pokemon')).toBeInTheDocument();
      });

      const charmanderButton = screen.getByText('Charmander (HP: 100)');
      fireEvent.click(charmanderButton);

      await waitFor(() => {
        expect(screen.getByText('Error: Switch submission failed')).toBeInTheDocument();
      });
    });
  });

  describe('cleanup', () => {
    it('should destroy battle engine on unmount', () => {
      const { unmount } = render(
        <RTDBBattleComponent battleId={mockBattleId} onBattleComplete={mockOnBattleComplete} />
      );

      unmount();

      expect(mockBattleEngine.destroy).toHaveBeenCalled();
    });
  });
});
