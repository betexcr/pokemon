import { BattleState } from './team-battle-engine';
import { FieldState, FieldSideScreens } from './team-battle-types';

interface SerializerContext {
  playerId: string;
  isHost: boolean;
}

export interface SerializedBattleStatePayload {
  state: BattleState;
  serialized: Record<string, unknown>;
  turn: number;
  phase: BattleState['phase'];
}

export function serializeBattleStateForFirestore(state: BattleState, context: SerializerContext): SerializedBattleStatePayload {
  // Note: structuredClone requires modern environment; ensure polyfill if necessary
  const cloned = structuredClone(state) as BattleState;

  const serializedField = serializeFieldState(cloned.field ?? {});
  const playerScreens = serializeScreens(cloned.player.sideConditions?.screens ?? {});
  const opponentScreens = serializeScreens(cloned.opponent.sideConditions?.screens ?? {});

  const serialized = {
    ...cloned,
    field: serializedField,
    player: {
      ...cloned.player,
      sideConditions: {
        ...cloned.player.sideConditions,
        screens: playerScreens,
      },
    },
    opponent: {
      ...cloned.opponent,
      sideConditions: {
        ...cloned.opponent.sideConditions,
        screens: opponentScreens,
      },
    },
    rng: cloned.rng ?? null,
    lastSyncedBy: context.playerId,
    lastSyncedRole: context.isHost ? 'host' : 'guest',
  } as Record<string, unknown>;

  const turn = cloned.turnNumber ?? cloned.turn ?? 1;
  const phase = cloned.phase ?? 'choice';

  return {
    state: cloned,
    serialized,
    turn,
    phase,
  };
}

export function deserializeBattleStateFromFirestore(data: Record<string, unknown> | null | undefined): BattleState {
  if (!data) {
    throw new Error('Firebase battle document missing battleData');
  }

  const state = structuredClone(data) as BattleState;
  state.field = deserializeFieldState(data.field as Record<string, unknown> | undefined);
  state.player.sideConditions = {
    ...state.player.sideConditions,
    screens: deserializeScreens(data.player?.sideConditions?.screens as Record<string, unknown> | undefined),
  };
  state.opponent.sideConditions = {
    ...state.opponent.sideConditions,
    screens: deserializeScreens(data.opponent?.sideConditions?.screens as Record<string, unknown> | undefined),
  };
  state.rng = (data.rng as BattleState['rng']) ?? undefined;

  return state;
}

function serializeFieldState(field: FieldState): Record<string, unknown> {
  return {
    weather: field.weather ?? null,
    terrain: field.terrain ?? null,
    rooms: field.rooms ?? {},
  };
}

function serializeScreens(screens: FieldSideScreens): Record<string, unknown> {
  return {
    reflect: screens.reflect ?? null,
    lightScreen: screens.lightScreen ?? null,
    auroraVeil: screens.auroraVeil ?? null,
    safeguard: screens.safeguard ?? null,
    tailwind: screens.tailwind ?? null,
  };
}

function deserializeFieldState(raw?: Record<string, unknown>): FieldState {
  if (!raw) return {};
  return {
    weather: (raw.weather as FieldState['weather']) ?? undefined,
    terrain: (raw.terrain as FieldState['terrain']) ?? undefined,
    rooms: (raw.rooms as FieldState['rooms']) ?? {},
  };
}

function deserializeScreens(raw?: Record<string, unknown>): FieldSideScreens {
  if (!raw) return {};
  return {
    reflect: normalizeScreen(raw.reflect),
    lightScreen: normalizeScreen(raw.lightScreen),
    auroraVeil: normalizeScreen(raw.auroraVeil),
    safeguard: normalizeScreen(raw.safeguard),
    tailwind: normalizeScreen(raw.tailwind),
  };
}

function normalizeScreen(value: unknown): { turns: number } | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const turns = Number((value as any).turns ?? 0);
  return turns > 0 ? { turns } : undefined;
}
