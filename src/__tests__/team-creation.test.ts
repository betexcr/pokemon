/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import TeamPage from '@/app/team/page';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock the API functions
jest.mock('@/lib/api', () => ({
  getPokemonList: jest.fn(),
  getPokemon: jest.fn(),
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

describe('Team Creation and Management', () => {
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  };

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
    localStorageMock.getItem.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render team builder page', async () => {
    const { getPokemonList } = require('@/lib/api');
    getPokemonList.mockResolvedValue({
      results: [
        { name: 'pikachu', url: 'https://pokeapi.co/api/v2/pokemon/25/' },
        { name: 'charizard', url: 'https://pokeapi.co/api/v2/pokemon/6/' },
        { name: 'blastoise', url: 'https://pokeapi.co/api/v2/pokemon/9/' },
      ]
    });

    render(<TeamPage />);

    await waitFor(() => {
      expect(screen.getByText('Team Builder')).toBeInTheDocument();
    });

    expect(screen.getByText('Your Team')).toBeInTheDocument();
    expect(screen.getByText('Save Team')).toBeInTheDocument();
  });

  it('should allow adding Pokemon to team slots', async () => {
    const { getPokemonList, getPokemon } = require('@/lib/api');
    
    getPokemonList.mockResolvedValue({
      results: [
        { name: 'pikachu', url: 'https://pokeapi.co/api/v2/pokemon/25/' },
        { name: 'charizard', url: 'https://pokeapi.co/api/v2/pokemon/6/' },
      ]
    });

    getPokemon.mockResolvedValue({
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
      moves: [
        { move: { name: 'thunderbolt' } },
        { move: { name: 'quick-attack' } },
        { move: { name: 'iron-tail' } },
        { move: { name: 'thunder' } },
      ],
    });

    render(<TeamPage />);

    await waitFor(() => {
      expect(screen.getByText('Team Builder')).toBeInTheDocument();
    });

    // Find the first team slot and click to add Pokemon
    const teamSlots = screen.getAllByText('Empty Slot');
    expect(teamSlots).toHaveLength(6);

    // Click on the first slot
    fireEvent.click(teamSlots[0]);

    // Wait for the search input to appear
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search Pokémon...')).toBeInTheDocument();
    });

    // Type in the search input
    const searchInput = screen.getByPlaceholderText('Search Pokémon...');
    fireEvent.change(searchInput, { target: { value: 'pikachu' } });

    // Wait for the dropdown to appear and select Pikachu
    await waitFor(() => {
      expect(screen.getByText('pikachu')).toBeInTheDocument();
    });

    const pikachuOption = screen.getByText('pikachu');
    fireEvent.click(pikachuOption);

    // Verify Pikachu was added to the team
    await waitFor(() => {
      expect(screen.getByText('pikachu')).toBeInTheDocument();
    });

    // Verify the slot is no longer empty
    expect(screen.queryByText('Empty Slot')).toHaveLength(5);
  });

  it('should allow removing Pokemon from team slots', async () => {
    const { getPokemonList, getPokemon } = require('@/lib/api');
    
    getPokemonList.mockResolvedValue({
      results: [
        { name: 'pikachu', url: 'https://pokeapi.co/api/v2/pokemon/25/' },
      ]
    });

    getPokemon.mockResolvedValue({
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
      moves: [
        { move: { name: 'thunderbolt' } },
        { move: { name: 'quick-attack' } },
        { move: { name: 'iron-tail' } },
        { move: { name: 'thunder' } },
      ],
    });

    render(<TeamPage />);

    await waitFor(() => {
      expect(screen.getByText('Team Builder')).toBeInTheDocument();
    });

    // Add Pikachu to the first slot
    const teamSlots = screen.getAllByText('Empty Slot');
    fireEvent.click(teamSlots[0]);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search Pokémon...')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search Pokémon...');
    fireEvent.change(searchInput, { target: { value: 'pikachu' } });

    await waitFor(() => {
      expect(screen.getByText('pikachu')).toBeInTheDocument();
    });

    const pikachuOption = screen.getByText('pikachu');
    fireEvent.click(pikachuOption);

    await waitFor(() => {
      expect(screen.getByText('pikachu')).toBeInTheDocument();
    });

    // Find and click the remove button
    const removeButton = screen.getByLabelText('Remove Pokémon');
    fireEvent.click(removeButton);

    // Verify the slot is empty again
    await waitFor(() => {
      expect(screen.getAllByText('Empty Slot')).toHaveLength(6);
    });
  });

  it('should save and load teams from localStorage', async () => {
    const { getPokemonList, getPokemon } = require('@/lib/api');
    
    getPokemonList.mockResolvedValue({
      results: [
        { name: 'pikachu', url: 'https://pokeapi.co/api/v2/pokemon/25/' },
        { name: 'charizard', url: 'https://pokeapi.co/api/v2/pokemon/6/' },
      ]
    });

    getPokemon.mockResolvedValue({
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
      moves: [
        { move: { name: 'thunderbolt' } },
        { move: { name: 'quick-attack' } },
        { move: { name: 'iron-tail' } },
        { move: { name: 'thunder' } },
      ],
    });

    render(<TeamPage />);

    await waitFor(() => {
      expect(screen.getByText('Team Builder')).toBeInTheDocument();
    });

    // Add Pikachu to the first slot
    const teamSlots = screen.getAllByText('Empty Slot');
    fireEvent.click(teamSlots[0]);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search Pokémon...')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search Pokémon...');
    fireEvent.change(searchInput, { target: { value: 'pikachu' } });

    await waitFor(() => {
      expect(screen.getByText('pikachu')).toBeInTheDocument();
    });

    const pikachuOption = screen.getByText('pikachu');
    fireEvent.click(pikachuOption);

    await waitFor(() => {
      expect(screen.getByText('pikachu')).toBeInTheDocument();
    });

    // Save the team
    const saveButton = screen.getByText('Save Team');
    fireEvent.click(saveButton);

    // Verify localStorage was called
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'pokemon-team-builder',
      expect.stringContaining('pikachu')
    );
  });

  it('should handle search functionality correctly', async () => {
    const { getPokemonList } = require('@/lib/api');
    
    getPokemonList.mockResolvedValue({
      results: [
        { name: 'pikachu', url: 'https://pokeapi.co/api/v2/pokemon/25/' },
        { name: 'charizard', url: 'https://pokeapi.co/api/v2/pokemon/6/' },
        { name: 'blastoise', url: 'https://pokeapi.co/api/v2/pokemon/9/' },
        { name: 'venusaur', url: 'https://pokeapi.co/api/v2/pokemon/3/' },
      ]
    });

    render(<TeamPage />);

    await waitFor(() => {
      expect(screen.getByText('Team Builder')).toBeInTheDocument();
    });

    // Click on a team slot to open search
    const teamSlots = screen.getAllByText('Empty Slot');
    fireEvent.click(teamSlots[0]);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search Pokémon...')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search Pokémon...');

    // Test searching by name
    fireEvent.change(searchInput, { target: { value: 'char' } });

    await waitFor(() => {
      expect(screen.getByText('charizard')).toBeInTheDocument();
      expect(screen.queryByText('pikachu')).not.toBeInTheDocument();
    });

    // Test searching by ID
    fireEvent.change(searchInput, { target: { value: '25' } });

    await waitFor(() => {
      expect(screen.getByText('pikachu')).toBeInTheDocument();
      expect(screen.queryByText('charizard')).not.toBeInTheDocument();
    });

    // Test searching with spaces (Ho-Oh case)
    fireEvent.change(searchInput, { target: { value: 'ho oh' } });

    // Should show no results for this test case
    await waitFor(() => {
      expect(screen.queryByText('ho-oh')).not.toBeInTheDocument();
    });
  });
});
