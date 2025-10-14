import { describe, expect, it } from 'vitest';
import { BattleState } from '@/lib/team-battle-engine';
import { serializeBattleStateForFirestore, deserializeBattleStateFromFirestore } from '@/lib/battle-state-serializer';
import { EMPTY_HAZARDS } from '@/lib/team-battle-types';

function createMockBattleState(): BattleState {
  return {
    player: {
      pokemon: [
        {
          pokemon: { name: 'Pikachu', id: 25, types: ['Electric'], stats: [], height: 4, weight: 60 },
          currentHp: 35,
          maxHp: 35,
          level: 50,
          moves: [],
          status: undefined,
          volatile: {},
          statModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 },
          currentAbility: 'Static',
        },
      ],
      currentIndex: 0,
      faintedCount: 0,
      sideConditions: {
        hazards: { ...EMPTY_HAZARDS },
        screens: {
          reflect: { turns: 3 },
          lightScreen: undefined,
          auroraVeil: undefined,
          safeguard: undefined,
          tailwind: { turns: 2 },
        },
      },
    },
    opponent: {
      pokemon: [
        {
          pokemon: { name: 'Charizard', id: 6, types: ['Fire'], stats: [], height: 17, weight: 905 },
          currentHp: 78,
          maxHp: 78,
          level: 50,
          moves: [],
          status: undefined,
          volatile: {},
          statModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 },
          currentAbility: 'Blaze',
        },
      ],
      currentIndex: 0,
      faintedCount: 0,
      sideConditions: {
        hazards: { ...EMPTY_HAZARDS },
        screens: {
          reflect: undefined,
          lightScreen: { turns: 2 },
          auroraVeil: undefined,
          safeguard: undefined,
          tailwind: undefined,
        },
      },
    },
    field: {
      weather: { kind: 'rain', turns: 4 },
      terrain: { kind: 'electric', turns: 3 },
      rooms: { trickRoom: { turns: 2 } },
    },
    rng: { seed: 12345, state: 67890 },
    turn: 1,
    phase: 'choice',
    actionQueue: [],
    battleLog: [],
    isComplete: false,
  } as BattleState;
}

describe('battle-state-serializer', () => {
  it('serializes and deserializes battle state for Firestore', () => {
    const state = createMockBattleState();

    const payload = serializeBattleStateForFirestore(state, { playerId: 'user-1', isHost: true });

    expect(payload.serialized).toBeDefined();
    expect(payload.serialized.field).toEqual({
      weather: state.field?.weather ?? null,
      terrain: state.field?.terrain ?? null,
      rooms: state.field?.rooms ?? {},
    });

    const roundTrip = deserializeBattleStateFromFirestore(payload.serialized);

    expect(roundTrip.field).toEqual(state.field);
    expect(roundTrip.player.sideConditions?.screens?.reflect?.turns).toBe(3);
    expect(roundTrip.opponent.sideConditions?.screens?.lightScreen?.turns).toBe(2);
    expect(roundTrip.turn).toBe(state.turn);
    expect(roundTrip.rng).toEqual(state.rng);
  });
});
