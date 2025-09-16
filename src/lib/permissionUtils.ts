/**
 * Permission utility functions for battle system
 * Provides centralized permission checking and error handling
 */

import { User } from 'firebase/auth';

export interface PermissionCheckResult {
  hasPermission: boolean;
  error?: string;
  code?: string;
}

export interface BattleParticipant {
  hostId: string;
  guestId?: string;
  currentTurn?: 'host' | 'guest';
  phase?: string;
}

/**
 * Check if user is authenticated
 */
export function checkAuthentication(user: User | null): PermissionCheckResult {
  if (!user) {
    return {
      hasPermission: false,
      error: 'User not authenticated. Please sign in to access battle features.',
      code: 'unauthenticated'
    };
  }

  if (!user.uid) {
    return {
      hasPermission: false,
      error: 'Invalid user session. Please sign in again.',
      code: 'invalid-user'
    };
  }

  return { hasPermission: true };
}

/**
 * Check if user is a participant in a battle
 */
export function checkBattleParticipation(
  user: User | null,
  battle: BattleParticipant | null
): PermissionCheckResult {
  const authCheck = checkAuthentication(user);
  if (!authCheck.hasPermission) {
    return authCheck;
  }

  if (!battle) {
    return {
      hasPermission: false,
      error: 'Battle data not available.',
      code: 'no-battle-data'
    };
  }

  const isParticipant = battle.hostId === user!.uid || battle.guestId === user!.uid;
  if (!isParticipant) {
    return {
      hasPermission: false,
      error: 'You are not a participant in this battle.',
      code: 'not-participant'
    };
  }

  return { hasPermission: true };
}

/**
 * Check if user can perform battle actions (moves/switches)
 */
export function checkBattleActionPermission(
  user: User | null,
  battle: BattleParticipant | null,
  isCurrentTurn: boolean = false
): PermissionCheckResult {
  const participationCheck = checkBattleParticipation(user, battle);
  if (!participationCheck.hasPermission) {
    return participationCheck;
  }

  if (!isCurrentTurn) {
    return {
      hasPermission: false,
      error: 'It is not your turn to make a move.',
      code: 'not-current-turn'
    };
  }

  if (battle!.phase !== 'choice') {
    return {
      hasPermission: false,
      error: 'Cannot submit actions outside of choice phase.',
      code: 'invalid-phase'
    };
  }

  return { hasPermission: true };
}

/**
 * Check if user can create a room
 */
export function checkRoomCreationPermission(user: User | null): PermissionCheckResult {
  return checkAuthentication(user);
}

/**
 * Check if user can join a room
 */
export function checkRoomJoinPermission(
  user: User | null,
  roomHostId: string,
  roomGuestId?: string,
  roomCurrentPlayers: number = 0,
  roomMaxPlayers: number = 2
): PermissionCheckResult {
  const authCheck = checkAuthentication(user);
  if (!authCheck.hasPermission) {
    return authCheck;
  }

  // Check if user is already in the room
  if (roomHostId === user!.uid || roomGuestId === user!.uid) {
    return { hasPermission: true };
  }

  // Check if room has space
  if (roomCurrentPlayers >= roomMaxPlayers) {
    return {
      hasPermission: false,
      error: 'Room is full. Cannot join.',
      code: 'room-full'
    };
  }

  return { hasPermission: true };
}

/**
 * Check if user can start a battle
 */
export function checkBattleStartPermission(
  user: User | null,
  battle: BattleParticipant | null
): PermissionCheckResult {
  const authCheck = checkAuthentication(user);
  if (!authCheck.hasPermission) {
    return authCheck;
  }

  if (!battle) {
    return {
      hasPermission: false,
      error: 'Battle data not available.',
      code: 'no-battle-data'
    };
  }

  // Only the host can start the battle
  if (battle.hostId !== user!.uid) {
    return {
      hasPermission: false,
      error: 'Only the host can start the battle.',
      code: 'not-host'
    };
  }

  return { hasPermission: true };
}

/**
 * Handle permission errors with user-friendly messages
 */
export function handlePermissionError(
  error: any,
  fallbackMessage: string = 'An error occurred'
): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error?.code) {
    switch (error.code) {
      case 'permission-denied':
        return 'You do not have permission to perform this action. Please ensure you are logged in and have the correct permissions.';
      case 'unauthenticated':
        return 'Please sign in to access this feature.';
      case 'not-participant':
        return 'You are not a participant in this battle.';
      case 'not-current-turn':
        return 'It is not your turn to make a move.';
      case 'invalid-phase':
        return 'Cannot perform this action in the current battle phase.';
      case 'room-full':
        return 'This room is full. Please try joining another room.';
      case 'not-host':
        return 'Only the host can perform this action.';
      default:
        return error.message || fallbackMessage;
    }
  }

  return error?.message || fallbackMessage;
}

/**
 * Log permission errors for debugging
 */
export function logPermissionError(
  operation: string,
  error: any,
  context: Record<string, any> = {}
): void {
  console.error(`Permission error in ${operation}:`, {
    error: error?.code || error?.message || error,
    context,
    timestamp: new Date().toISOString()
  });
}
