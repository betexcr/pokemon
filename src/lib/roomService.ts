import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  deleteField,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  type Unsubscribe,
  FirestoreError
} from 'firebase/firestore';
import { getDb as getClientDb, hasFirebaseClientConfig } from './firebase/client';
import { battleService } from './battleService';
import { rtdbService } from './firebase-rtdb-service';
import { firebaseErrorLogger, PermissionErrorDetails } from './firebaseErrorLogger';
import { getPokemon } from './api';

export interface RoomData {
  id: string;
  hostId: string;
  hostName: string;
  hostPhotoURL?: string;
  hostTeam?: unknown; // Team data
  hostReady?: boolean; // Host ready status
  hostReleasedTeam?: { name: string; sprites: string[] };
  hostAnimatingBalls?: number[]; // Host's animating ball indices
  hostReleasedBalls?: number[]; // Host's released ball indices
  guestId?: string;
  guestName?: string;
  guestPhotoURL?: string;
  guestTeam?: unknown; // Team data
  guestReady?: boolean; // Guest ready status
  guestReleasedTeam?: { name: string; sprites: string[] };
  guestAnimatingBalls?: number[]; // Guest's animating ball indices
  guestReleasedBalls?: number[]; // Guest's released ball indices
  status: 'waiting' | 'ready' | 'battling' | 'finished' | 'unresolved';
  createdAt: Date;
  maxPlayers: number;
  currentPlayers: number;
  activeUsers?: string[]; // Track active users in the room
  battleId?: string; // Reference to battle document
}

export interface RoomUpdate {
  hostTeam?: unknown;
  hostReady?: boolean;
  hostReleasedTeam?: { name: string; sprites: string[] };
  hostAnimatingBalls?: number[];
  hostReleasedBalls?: number[];
  guestId?: string;
  guestName?: string;
  hostPhotoURL?: string;
  guestPhotoURL?: string;
  guestTeam?: unknown;
  guestReady?: boolean;
  guestReleasedTeam?: { name: string; sprites: string[] };
  guestAnimatingBalls?: number[];
  guestReleasedBalls?: number[];
  status?: 'waiting' | 'ready' | 'battling' | 'finished';
  currentPlayers?: number;
  battleId?: string;
}

class RoomService {
  private roomsCollection = 'battle_rooms';

  private getDb() {
    try {
      return getClientDb();
    } catch (error) {
      const message = hasFirebaseClientConfig
        ? (error instanceof Error ? error.message : 'Failed to initialize Firestore client')
        : 'Firestore configuration missing';
      throw new Error(message);
    }
  }

  // Delete a room (host only)
  async deleteRoom(roomId: string): Promise<void> {
    const db = this.getDb();
    const roomRef = doc(db, this.roomsCollection, roomId);
    await deleteDoc(roomRef);
  }

  // Close all existing rooms for a user
  async closeExistingRoomsForUser(userId: string): Promise<void> {
    const db = this.getDb();

    try {
      // Find all rooms where the user is the host
      const roomsQuery = query(
        collection(db, this.roomsCollection),
        where('hostId', '==', userId),
        where('status', 'in', ['waiting', 'ready'])
      );

      const snapshot = await getDocs(roomsQuery);

      // Close each existing room
      const closePromises = snapshot.docs.map(async (doc) => {
        await deleteDoc(doc.ref);
      });

      await Promise.all(closePromises);
    } catch (error) {
      console.error('Error closing existing rooms for user:', error);
      // Don't throw here - we still want to allow room creation even if cleanup fails
    }
  }

  // Create a new room
  async createRoom(hostId: string, hostName: string, hostPhotoURL?: string | null, hostTeam?: unknown): Promise<string> {
    const db = this.getDb();

    try {
      // Close any existing rooms for this user first
      await this.closeExistingRoomsForUser(hostId);

      const roomData: Record<string, unknown> = {
        hostId,
        hostName,
        hostPhotoURL: hostPhotoURL || null,
        hostReady: false,
        hostAnimatingBalls: [],
        hostReleasedBalls: [],
        guestAnimatingBalls: [],
        guestReleasedBalls: [],
        status: 'waiting' as const,
        createdAt: serverTimestamp(),
        maxPlayers: 2,
        currentPlayers: 1,
        activeUsers: [hostId] // Track active users
      };

      // Only include hostTeam if it's provided and not undefined
      if (hostTeam !== undefined) {
        roomData.hostTeam = hostTeam;
      }

      const docRef = await addDoc(collection(db, this.roomsCollection), roomData);
      return docRef.id;
    } catch (error) {
      console.error('❌ Failed to create room:', error);

      // Log detailed error information
      firebaseErrorLogger.logError(
        error as Error,
        'create_room',
        {
          hostId,
          hostName,
          hostPhotoURL,
          hasHostTeam: !!hostTeam,
          collection: this.roomsCollection,
          operation: 'addDoc'
        }
      );

      // If it's a permission error, provide specific guidance
      if (error instanceof FirestoreError && error.code === 'permission-denied') {
        const permissionDetails: PermissionErrorDetails = {
          operation: 'write',
          collection: this.roomsCollection,
          userId: hostId,
          expectedPermissions: ['authenticated', 'hostId matches auth.uid'],
          actualPermissions: [],
          securityRuleViolations: ['battle_rooms create rule']
        };

        firebaseErrorLogger.logPermissionError(error, permissionDetails, {
          hostId,
          hostName,
          operation: 'create_room'
        });
      }

      throw error;
    }
  }

  // Get room by ID
  async getRoom(roomId: string): Promise<RoomData | null> {
    const db = this.getDb();
    const docRef = doc(db, this.roomsCollection, roomId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();

      // Handle older rooms that might not have all the new fields
      const roomData: RoomData = {
        id: docSnap.id,
        hostId: data.hostId || '',
        hostName: data.hostName || 'Unknown Host',
        hostPhotoURL: data.hostPhotoURL,
        hostTeam: data.hostTeam,
        hostReady: data.hostReady || false,
        hostReleasedTeam: data.hostReleasedTeam,
        hostAnimatingBalls: data.hostAnimatingBalls || [],
        hostReleasedBalls: data.hostReleasedBalls || [],
        guestId: data.guestId,
        guestName: data.guestName,
        guestPhotoURL: data.guestPhotoURL,
        guestTeam: data.guestTeam,
        guestReady: data.guestReady || false,
        guestReleasedTeam: data.guestReleasedTeam,
        guestAnimatingBalls: data.guestAnimatingBalls || [],
        guestReleasedBalls: data.guestReleasedBalls || [],
        status: data.status || 'waiting',
        createdAt: data.createdAt?.toDate() || new Date(),
        maxPlayers: data.maxPlayers || 2,
        currentPlayers: data.currentPlayers || (data.guestId ? 2 : 1),
        activeUsers: data.activeUsers || (data.hostId ? [data.hostId] : []),
        battleId: data.battleId
      };

      return roomData;
    }

    return null;
  }

  // Join a room
  async joinRoom(roomId: string, guestId: string, guestName: string, guestPhotoURL?: string | null, guestTeam?: unknown): Promise<boolean> {
    const db = this.getDb();

    // Enhanced authentication check
    const { auth } = await import('@/lib/firebase');
    if (!auth || !auth.currentUser || !auth.currentUser.uid) {
      throw new Error('User not authenticated. Please sign in to join rooms.');
    }

    if (auth.currentUser.uid !== guestId) {
      throw new Error('User ID mismatch. Cannot join room with different user ID.');
    }

    try {

      const roomRef = doc(db, this.roomsCollection, roomId);
      const roomSnap = await getDoc(roomRef);

      if (!roomSnap.exists()) {
        throw new Error('Room not found');
      }

      const roomData = roomSnap.data();

      // Check if user is already in the room BEFORE capacity checks
      if (roomData.hostId === guestId || roomData.guestId === guestId) {
        // If already the guest and a team is provided, update guestTeam
        if (roomData.guestId === guestId && guestTeam !== undefined) {
          try {
            await updateDoc(roomRef, { guestTeam: guestTeam });
          } catch {
            // Guest team update failed for existing guest
          }
        }

        // Ensure currentPlayers is correct even for existing users
        const activeUsers = roomData.activeUsers || [roomData.hostId];
        const correctCurrentPlayers = activeUsers.length;
        if (roomData.currentPlayers !== correctCurrentPlayers) {
          await updateDoc(roomRef, { currentPlayers: correctCurrentPlayers });
        }

        return true;
      }

      // If the user is already in activeUsers but not assigned as guest yet, allow assignment
      const existingActiveUsers: string[] = roomData.activeUsers || [roomData.hostId];
      const userIsActive = existingActiveUsers.includes(guestId);
      if (userIsActive && !roomData.guestId) {
        const updateData: Record<string, unknown> = {
          guestId,
          guestName,
          guestPhotoURL: guestPhotoURL || null,
          guestReady: false,
          guestTeam: guestTeam !== undefined ? guestTeam : roomData.guestTeam,
          // do not change activeUsers; keep currentPlayers based on active users
          status: 'ready'
        };
        try {
          await updateDoc(roomRef, updateData);
          return true;
        } catch (assignErr) {
          console.error('Failed to assign active user as guest:', assignErr);
          // continue to normal flow (capacity checks) to surface a meaningful error
        }
      }

      // Check if room is available
      // Check if room already has a guest (but allow if it's the same user)
      if (roomData.guestId && roomData.guestId !== guestId) {
        throw new Error(`Room already has a guest. Current guest: ${roomData.guestId}`);
      }

      // Check room capacity - only if there's no guest yet
      if (!roomData.guestId && roomData.currentPlayers >= roomData.maxPlayers) {
        throw new Error(`Room is full. Players: ${roomData.currentPlayers}/${roomData.maxPlayers}`);
      }

      // Allow joining if room is waiting or ready
      if (roomData.status !== 'waiting' && roomData.status !== 'ready') {
        throw new Error(`Room is not available. Status: ${roomData.status}`);
      }

      // Attempt a single ATOMIC claim + presence update to satisfy rules in one write
      const atomicActiveUsers = (roomData.activeUsers || [roomData.hostId]).slice();
      if (!atomicActiveUsers.includes(guestId)) {
        atomicActiveUsers.push(guestId);
      }
      const atomicData: Record<string, unknown> = {
        guestId,
        guestName,
        guestPhotoURL: guestPhotoURL || null,
        guestReady: false,
        status: 'ready',
        activeUsers: atomicActiveUsers,
        currentPlayers: atomicActiveUsers.length
      };
      if (guestTeam !== undefined) {
        atomicData.guestTeam = guestTeam;
      }
      if (!roomData.maxPlayers) {
        atomicData.maxPlayers = 2;
      }

      try {
        await updateDoc(roomRef, atomicData);
      } catch (updateError) {
        console.error('JoinRoom ATOMIC failed, no partial writes performed:', updateError);

        // Log detailed error information
        firebaseErrorLogger.logError(
          updateError as Error,
          'join_room_update',
          {
            roomId,
            guestId,
            guestName,
            guestPhotoURL,
            hasGuestTeam: !!guestTeam,
            collection: this.roomsCollection,
            operation: 'updateDoc',
            updateData: atomicData
          }
        );

        // If it's a permission error, provide specific guidance
        if (updateError instanceof FirestoreError && updateError.code === 'permission-denied') {
          const permissionDetails: PermissionErrorDetails = {
            operation: 'write',
            collection: this.roomsCollection,
            documentId: roomId,
            userId: guestId,
            expectedPermissions: ['authenticated', 'room participant'],
            actualPermissions: [],
            securityRuleViolations: ['battle_rooms update rule']
          };

          firebaseErrorLogger.logPermissionError(updateError, permissionDetails, {
            roomId,
            guestId,
            guestName,
            operation: 'join_room_update'
          });
        }

        throw new Error(`Failed to join room atomically: ${updateError instanceof Error ? updateError.message : 'Unknown error'}`);
      }

      return true;
    } catch (error) {
      console.error('❌ Failed to join room:', error);

      // Log detailed error information
      firebaseErrorLogger.logError(
        error as Error,
        'join_room',
        {
          roomId,
          guestId,
          guestName,
          guestPhotoURL,
          hasGuestTeam: !!guestTeam,
          collection: this.roomsCollection
        }
      );

      // If it's a permission error, provide specific guidance
      if (error instanceof FirestoreError && error.code === 'permission-denied') {
        const permissionDetails: PermissionErrorDetails = {
          operation: 'write',
          collection: this.roomsCollection,
          documentId: roomId,
          userId: guestId,
          expectedPermissions: ['authenticated', 'room participant'],
          actualPermissions: [],
          securityRuleViolations: ['battle_rooms update rule']
        };

        firebaseErrorLogger.logPermissionError(error, permissionDetails, {
          roomId,
          guestId,
          guestName,
          operation: 'join_room'
        });
      }

      throw error;
    }
  }

  // Leave a room
  async leaveRoom(roomId: string, userId: string): Promise<void> {
    const db = this.getDb();
    const roomRef = doc(db, this.roomsCollection, roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) return;

    const roomData = roomSnap.data();

    const wasBattling = roomData.status === 'battling';

    // If room was in battle, only the host can delete the battle
    if (wasBattling) {
      try {
        if (roomData.battleId && roomData.hostId === userId) {
          await battleService.deleteBattle(roomData.battleId);
        }
      } catch {
        // Battle cleanup failed; continue with room leave
      }

      const activeUsers = (roomData.activeUsers || []).filter((id: string) => id !== userId);
      await updateDoc(roomRef, {
        guestId: userId === roomData.guestId ? deleteField() : roomData.guestId,
        guestName: userId === roomData.guestId ? deleteField() : roomData.guestName,
        guestTeam: userId === roomData.guestId ? deleteField() : roomData.guestTeam,
        guestReady: userId === roomData.guestId ? deleteField() : roomData.guestReady,
        battleId: deleteField(),
        status: 'unresolved',
        currentPlayers: activeUsers.length,
        activeUsers
      } as Record<string, unknown>);
      return;
    }

    if (roomData.hostId === userId) {
      // Host is leaving (not battling) - mark room as finished instead of deleting
      const activeUsers = (roomData.activeUsers || []).filter((id: string) => id !== userId);
      await updateDoc(roomRef, {
        status: 'finished',
        currentPlayers: activeUsers.length,
        activeUsers
      });
    } else if (roomData.guestId === userId) {
      // Guest is leaving (not battling) - remove guest and reset room
      const activeUsers = (roomData.activeUsers || []).filter((id: string) => id !== userId);
      await updateDoc(roomRef, {
        guestId: deleteField(),
        guestName: deleteField(),
        guestTeam: deleteField(),
        guestReady: deleteField(),
        currentPlayers: activeUsers.length,
        activeUsers,
        status: 'waiting'
      });
    }
  }

  // Update room status
  async updateRoom(roomId: string, updates: RoomUpdate): Promise<void> {
    const db = this.getDb();
    const roomRef = doc(db, this.roomsCollection, roomId);

    try {
      await updateDoc(roomRef, updates as Record<string, unknown>);
    } catch (error) {
      console.error('roomService.updateRoom failed:', error);
      throw error;
    }
  }

  // Fix currentPlayers count for existing rooms
  async fixCurrentPlayersCount(roomId: string): Promise<void> {
    const db = this.getDb();
    // Check authentication state
    const { auth } = await import('@/lib/firebase');
    if (!auth || !auth.currentUser) {
      throw new Error('User not authenticated');
    }

    const roomRef = doc(db, this.roomsCollection, roomId);
    const roomDoc = await getDoc(roomRef);

    if (!roomDoc.exists()) {
      throw new Error('Room not found');
    }

    const roomData = roomDoc.data();
    const activeUsers = roomData.activeUsers || [roomData.hostId];
    const correctCurrentPlayers = activeUsers.length;

    if (roomData.currentPlayers !== correctCurrentPlayers) {
      await updateDoc(roomRef, { currentPlayers: correctCurrentPlayers });
    }
  }

  // Initialize animation fields for existing rooms that don't have them
  async initializeAnimationFields(roomId: string): Promise<void> {
    const db = this.getDb();
    const roomRef = doc(db, this.roomsCollection, roomId);
    const roomDoc = await getDoc(roomRef);

    if (!roomDoc.exists()) {
      throw new Error('Room not found');
    }

    const roomData = roomDoc.data();
    const updates: Record<string, unknown> = {};

    // Initialize animation fields if they don't exist
    if (roomData.hostAnimatingBalls === undefined) {
      updates.hostAnimatingBalls = [];
    }
    if (roomData.hostReleasedBalls === undefined) {
      updates.hostReleasedBalls = [];
    }
    if (roomData.guestAnimatingBalls === undefined) {
      updates.guestAnimatingBalls = [];
    }
    if (roomData.guestReleasedBalls === undefined) {
      updates.guestReleasedBalls = [];
    }

    // Only update if there are fields to initialize
    if (Object.keys(updates).length > 0) {
      await updateDoc(roomRef, updates);
    }
  }

  // Update ball animation state
  async updateBallAnimation(roomId: string, playerType: 'host' | 'guest', animatingBalls: Set<number>, releasedBalls: Set<number>): Promise<void> {
    const db = this.getDb();
    // Check authentication state
    const { auth } = await import('@/lib/firebase');
    if (!auth || !auth.currentUser) {
      throw new Error('User not authenticated');
    }
    // Ensure animation fields are initialized
    await this.initializeAnimationFields(roomId);

    // Read current values to avoid no-op writes
    const roomRef = doc(db, this.roomsCollection, roomId);
    const roomDoc = await getDoc(roomRef);
    if (!roomDoc.exists()) {
      throw new Error('Room not found');
    }
    const current = roomDoc.data();

    const desiredHostAnimating = playerType === 'host' ? Array.from(animatingBalls) : current.hostAnimatingBalls || [];
    const desiredHostReleased = playerType === 'host' ? Array.from(releasedBalls) : current.hostReleasedBalls || [];
    const desiredGuestAnimating = playerType === 'guest' ? Array.from(animatingBalls) : current.guestAnimatingBalls || [];
    const desiredGuestReleased = playerType === 'guest' ? Array.from(releasedBalls) : current.guestReleasedBalls || [];

    const arraysEqual = (a: number[] = [], b: number[] = []) => a.length === b.length && a.every((v, i) => v === b[i]);
    const noChange =
      arraysEqual(desiredHostAnimating, current.hostAnimatingBalls || []) &&
      arraysEqual(desiredHostReleased, current.hostReleasedBalls || []) &&
      arraysEqual(desiredGuestAnimating, current.guestAnimatingBalls || []) &&
      arraysEqual(desiredGuestReleased, current.guestReleasedBalls || []);

    if (noChange) {
      return;
    }

    const updates: RoomUpdate = {};
    if (playerType === 'host') {
      updates.hostAnimatingBalls = desiredHostAnimating;
      updates.hostReleasedBalls = desiredHostReleased;
    } else {
      updates.guestAnimatingBalls = desiredGuestAnimating;
      updates.guestReleasedBalls = desiredGuestReleased;
    }

    await this.updateRoom(roomId, updates);
  }

  // Update ready status for a player
  async updateReadyStatus(roomId: string, userId: string, isReady: boolean): Promise<void> {
    const db = this.getDb();
    const roomRef = doc(db, this.roomsCollection, roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
      throw new Error('Room not found');
    }

    const roomData = roomSnap.data();
    const updates: RoomUpdate = {};

    if (roomData.hostId === userId) {
      updates.hostReady = isReady;
    } else if (roomData.guestId === userId) {
      updates.guestReady = isReady;
    } else {
      throw new Error('User is not in this room');
    }

    // Update room status to 'ready' if both players are ready and room has both players
    const newHostReady = roomData.hostId === userId ? isReady : roomData.hostReady;
    const newGuestReady = roomData.guestId === userId ? isReady : roomData.guestReady;

    // Update status to 'ready' if both players are ready and we have both players
    if (roomData.guestId && newHostReady && newGuestReady && (roomData.status === 'waiting' || roomData.status === 'ready')) {
      updates.status = 'ready';
      // Do not pre-create battles here; host will create RTDB battle on start to avoid ID races
    } else if (roomData.guestId && (!newHostReady || !newGuestReady) && roomData.status === 'ready') {
      // If one player is not ready, set status back to 'waiting'
      updates.status = 'waiting';
    }

    await this.updateRoom(roomId, updates);
  }

  // Check if battle is ready to start (without actually starting it)
  async checkBattleReadiness(roomId: string, allowBattlingStatus: boolean = false): Promise<{ isReady: boolean; errors: string[] }> {
    const db = this.getDb();
    const roomRef = doc(db, this.roomsCollection, roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
      return { isReady: false, errors: ['Room not found'] };
    }

    const roomData = roomSnap.data();
    const validationErrors: string[] = [];

    // Check if room has both players
    if (!roomData.hostId || !roomData.guestId) {
      validationErrors.push('Room must have both host and guest players');
    }

    // Check if both players are ready
    if (!roomData.hostReady || !roomData.guestReady) {
      validationErrors.push('Both players must be ready before starting the battle');
    }

    // Check if both players have teams
    if (!roomData.hostTeam || !roomData.guestTeam) {
      validationErrors.push('Both players must select teams before starting the battle');
    }

    // Validate team structure - handle different team formats
    let hostTeamValid = false;
    let guestTeamValid = false;

    // Check host team structure
    if (roomData.hostTeam) {
      if (Array.isArray(roomData.hostTeam)) {
        hostTeamValid = roomData.hostTeam.length > 0;
      } else if (typeof roomData.hostTeam === 'object' && roomData.hostTeam.slots) {
        // Handle team object with slots property
        hostTeamValid = Array.isArray(roomData.hostTeam.slots) && roomData.hostTeam.slots.length > 0;
      } else if (typeof roomData.hostTeam === 'object' && roomData.hostTeam.pokemon) {
        // Handle team object with pokemon property
        hostTeamValid = Array.isArray(roomData.hostTeam.pokemon) && roomData.hostTeam.pokemon.length > 0;
      }
    }

    if (!hostTeamValid) {
      validationErrors.push('Host team must be a non-empty array or valid team object');
    }

    // Check guest team structure
    if (roomData.guestTeam) {
      if (Array.isArray(roomData.guestTeam)) {
        guestTeamValid = roomData.guestTeam.length > 0;
      } else if (typeof roomData.guestTeam === 'object' && roomData.guestTeam.slots) {
        // Handle team object with slots property
        guestTeamValid = Array.isArray(roomData.guestTeam.slots) && roomData.guestTeam.slots.length > 0;
      } else if (typeof roomData.guestTeam === 'object' && roomData.guestTeam.pokemon) {
        // Handle team object with pokemon property
        guestTeamValid = Array.isArray(roomData.guestTeam.pokemon) && roomData.guestTeam.pokemon.length > 0;
      }
    }

    if (!guestTeamValid) {
      validationErrors.push('Guest team must be a non-empty array or valid team object');
    }

    // Check if teams have valid Pokemon data - handle different team formats
    if (hostTeamValid && roomData.hostTeam) {
      let hostPokemonArray: any[] = [];

      if (Array.isArray(roomData.hostTeam)) {
        hostPokemonArray = roomData.hostTeam;
      } else if (roomData.hostTeam.slots) {
        hostPokemonArray = roomData.hostTeam.slots;
      } else if (roomData.hostTeam.pokemon) {
        hostPokemonArray = roomData.hostTeam.pokemon;
      }

      // Filter out empty slots (null IDs) and check for valid Pokemon
      const validHostPokemon = hostPokemonArray.filter((pokemon: any) => pokemon && pokemon.id && pokemon.level);

      if (validHostPokemon.length === 0) {
        validationErrors.push('Host team has no valid Pokemon selected');
      }
    }

    if (guestTeamValid && roomData.guestTeam) {
      let guestPokemonArray: any[] = [];

      if (Array.isArray(roomData.guestTeam)) {
        guestPokemonArray = roomData.guestTeam;
      } else if (roomData.guestTeam.slots) {
        guestPokemonArray = roomData.guestTeam.slots;
      } else if (roomData.guestTeam.pokemon) {
        guestPokemonArray = roomData.guestTeam.pokemon;
      }

      // Filter out empty slots (null IDs) and check for valid Pokemon
      const validGuestPokemon = guestPokemonArray.filter((pokemon: any) => pokemon && pokemon.id && pokemon.level);

      if (validGuestPokemon.length === 0) {
        validationErrors.push('Guest team has no valid Pokemon selected');
      }
    }

    // Compute reliable player count with fallbacks (ignore zero/stale values)
    const candidateCounts: number[] = [];
    if (typeof roomData.currentPlayers === 'number') {
      candidateCounts.push(roomData.currentPlayers);
    }
    if (Array.isArray(roomData.activeUsers)) {
      candidateCounts.push(roomData.activeUsers.length);
    }
    // Infer from host/guest assignment
    const inferredFromAssignments = roomData.hostId && roomData.guestId ? 2 : (roomData.hostId ? 1 : 0);
    candidateCounts.push(inferredFromAssignments);

    const sanitizedCounts = candidateCounts.filter((n) => Number.isFinite(n) && n > 0);
    const currentPlayers: number = sanitizedCounts.length > 0 ? Math.max(...sanitizedCounts) : 0;

    // Check room status - conditionally allow 'battling' and 'unresolved' status
    const allowedStatuses = ['ready', 'waiting'];
    if (allowBattlingStatus) {
      allowedStatuses.push('battling');
    }

    // Allow 'unresolved' status for single player scenarios (when guest leaves)
    if (!(roomData.status === 'unresolved' && currentPlayers === 1) && !allowedStatuses.includes(roomData.status)) {
      validationErrors.push(`Room status must be ${allowedStatuses.join(' or ')}, got '${roomData.status}'`);
    }

    // Check player count - allow single player for unresolved status
    if (!(roomData.status === 'unresolved' && currentPlayers === 1) && currentPlayers !== 2) {
      validationErrors.push(`Room must have exactly 2 players, got ${currentPlayers}`);
    }

    return {
      isReady: validationErrors.length === 0,
      errors: validationErrors
    };
  }

  // Start battle
  async startBattle(roomId: string, _battleId: string): Promise<void> {
    const db = this.getDb();
    // First check if battle is ready to start
    const readinessCheck = await this.checkBattleReadiness(roomId);
    if (!readinessCheck.isReady) {
      console.error('❌ Battle readiness validation failed:', readinessCheck.errors);
      throw new Error(`Battle cannot start: ${readinessCheck.errors.join(', ')}`);
    }

    const roomRef = doc(db, this.roomsCollection, roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
      throw new Error('Room not found');
    }

    const roomData = roomSnap.data();

    // Use existing battle document or create new one if needed
    let actualBattleId = roomData.battleId;

    if (!actualBattleId) {
      // Fallback: create battle document if it doesn't exist
      actualBattleId = await battleService.createBattle(
        roomId,
        roomData.hostId,
        roomData.hostName,
        roomData.hostTeam,
        roomData.guestId,
        roomData.guestName,
        roomData.guestTeam
      );

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Ensure RTDB mirrors the battle so realtime listeners can attach
    if (actualBattleId) {
      try {
        const hostRtdbTeam = await this.normalizeTeamForRTDB(roomData.hostTeam);
        const guestRtdbTeam = await this.normalizeTeamForRTDB(roomData.guestTeam);
        await rtdbService.createBattle(
          actualBattleId,
          roomData.hostId,
          roomData.hostName || 'Host Trainer',
          hostRtdbTeam,
          roomData.guestId,
          roomData.guestName || 'Guest Trainer',
          guestRtdbTeam
        );
      } catch (rtdbError) {
        console.error('Failed to prime RTDB battle state:', rtdbError);
        throw new Error('Failed to initialize battle. Please try again.');
      }
    }

    await updateDoc(roomRef, {
      status: 'battling',
      battleId: actualBattleId,
      // Mark start time so clients can show a short countdown
      startedAt: serverTimestamp()
    });

  }

  // Listen to room changes
  onRoomChange(roomId: string, callback: (room: RoomData | null) => void): Unsubscribe {
    let db
    try {
      db = this.getDb()
    } catch {
      callback(null)
      return () => { }
    }

    const roomRef = doc(db, this.roomsCollection, roomId);

    return onSnapshot(roomRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();

        // Handle older rooms that might not have all the new fields
        const room: RoomData = {
          id: doc.id,
          hostId: data.hostId || '',
          hostName: data.hostName || 'Unknown Host',
          hostPhotoURL: data.hostPhotoURL,
          hostTeam: data.hostTeam,
          hostReady: data.hostReady || false,
          hostReleasedTeam: data.hostReleasedTeam,
          hostAnimatingBalls: data.hostAnimatingBalls || [],
          hostReleasedBalls: data.hostReleasedBalls || [],
          guestId: data.guestId,
          guestName: data.guestName,
          guestPhotoURL: data.guestPhotoURL,
          guestTeam: data.guestTeam,
          guestReady: data.guestReady || false,
          guestReleasedTeam: data.guestReleasedTeam,
          guestAnimatingBalls: data.guestAnimatingBalls || [],
          guestReleasedBalls: data.guestReleasedBalls || [],
          status: data.status || 'waiting',
          createdAt: data.createdAt?.toDate() || new Date(),
          maxPlayers: data.maxPlayers || 2,
          currentPlayers: data.currentPlayers || (data.guestId ? 2 : 1),
          activeUsers: data.activeUsers || (data.hostId ? [data.hostId] : []),
          battleId: data.battleId
        };

        callback(room);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('roomService.onRoomChange error:', error);

      // Log detailed error information for room listener
      firebaseErrorLogger.logError(
        error,
        'listen_room',
        {
          roomId,
          collection: this.roomsCollection,
          operation: 'onSnapshot',
          errorCode: error.code,
          errorMessage: error.message
        }
      );

      // If it's a permission error, provide specific guidance
      if (error.code === 'permission-denied') {
        const permissionDetails: PermissionErrorDetails = {
          operation: 'listen',
          collection: this.roomsCollection,
          documentId: roomId,
          expectedPermissions: ['authenticated', 'room access'],
          actualPermissions: [],
          securityRuleViolations: ['battle_rooms read rule']
        };

        firebaseErrorLogger.logPermissionError(error, permissionDetails, {
          roomId,
          operation: 'listen_room'
        });
      }

      callback(null);
    });
  }

  private async normalizeTeamForRTDB(teamData: unknown): Promise<Array<Record<string, unknown>>> {
    if (!teamData) return [];
    const slots = Array.isArray(teamData)
      ? teamData
      : typeof teamData === 'object' && (teamData as any).slots
        ? (teamData as any).slots
        : typeof teamData === 'object' && Array.isArray((teamData as any).pokemon)
          ? (teamData as any).pokemon
          : [];

    if (!Array.isArray(slots)) return [];

    const validSlots = slots.filter((slot: any) => slot && (slot.id != null || slot.species || slot.name));

    return Promise.all(validSlots.map(async (slot: any, index: number) => {
        const id = typeof slot.id === 'number' ? slot.id : parseInt(String(slot.id ?? 0), 10) || index + 1;
        const species = typeof slot.species === 'string'
          ? slot.species
          : slot.name || `pokemon-${id}`;
        const level = typeof slot.level === 'number' ? slot.level : 50;

        const moves = Array.isArray(slot.moves)
          ? slot.moves
            .map((move: any) => {
              if (typeof move === 'string') return { id: move, name: move, pp: 20, maxPp: 20 };
              if (move && typeof move === 'object') {
                 return {
                    id: move.name || move.id,
                    name: move.name || move.id,
                    type: move.type,
                    category: move.damage_class === 'status' ? 'Status' : move.damage_class === 'physical' ? 'Physical' : 'Special',
                    power: move.power,
                    accuracy: move.accuracy,
                    pp: move.pp || 20,
                    maxPp: move.pp || 20
                 };
              }
              return null;
            })
            .filter((m: any) => m && m.id)
            .slice(0, 4)
          : [];

        // Try to get pokemon data from slot first, fall back to PokeAPI
        const srcPokemon = slot.pokemon || slot;
        let stats = Array.isArray(srcPokemon.stats) ? srcPokemon.stats : [];
        let rawTypes = Array.isArray(slot.types) ? slot.types
          : Array.isArray(srcPokemon.types) ? srcPokemon.types : [];
        let weight = srcPokemon.weight ?? null;
        let abilities = Array.isArray(srcPokemon.abilities) ? srcPokemon.abilities : [];
        let resolvedName = species;

        // Fetch from PokeAPI when essential data is missing
        if (stats.length === 0 && id > 0) {
          try {
            const apiData = await getPokemon(id);
            stats = apiData.stats || [];
            if (rawTypes.length === 0) rawTypes = apiData.types || [];
            if (weight === null) weight = apiData.weight ?? 500;
            if (abilities.length === 0) abilities = apiData.abilities || [];
            resolvedName = apiData.name || species;
          } catch (err) {
            // Pokemon data fetch failed; continue with partial data
          }
        }

        const types = rawTypes
          .map((t: any) => (typeof t === 'string' ? t : t?.type?.name || t?.name))
          .filter(Boolean);

        let maxHp: number;
        if (typeof slot.maxHp === 'number' && slot.maxHp > 0) {
          maxHp = slot.maxHp;
        } else if (stats.length > 0) {
          const hpStat = stats.find((s: any) => s.stat?.name === 'hp' || s.name === 'hp');
          const baseHp = typeof hpStat?.base_stat === 'number' ? hpStat.base_stat : 50;
          maxHp = Math.floor(((2 * baseHp + 31) * level) / 100) + level + 10;
        } else {
          maxHp = Math.floor(((2 * 50 + 31) * level) / 100) + level + 10;
        }
        const currentHp = typeof slot.currentHp === 'number' && slot.currentHp > 0 ? slot.currentHp : maxHp;

        return {
          pokemon: { id, name: resolvedName, types, stats, weight: weight ?? 500, abilities },
          level,
          moves,
          currentHp,
          maxHp,
          nature: typeof slot.nature === 'string' ? slot.nature : 'hardy',
          statModifiers: slot.statModifiers || {},
          status: slot.status || null,
          originalIndex: index
        };
      }));
  }

  // Track user presence in a room
  async trackUserPresence(roomId: string, userId: string, isActive: boolean): Promise<void> {
    const db = this.getDb();
    const roomRef = doc(db, this.roomsCollection, roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) return;

    const roomData = roomSnap.data();
    let activeUsers = roomData.activeUsers || [];

    if (isActive) {
      // Add user to active users if not already present
      if (!activeUsers.includes(userId)) {
        activeUsers.push(userId);
      }
    } else {
      // Remove user from active users
      activeUsers = activeUsers.filter((id: string) => id !== userId);
    }

    // Update current players count based on active users, clamped by assigned participants
    const assignedCount = (roomData.hostId ? 1 : 0) + (roomData.guestId ? 1 : 0);
    const currentPlayers = Math.max(activeUsers.length, assignedCount);

    const updates: Record<string, unknown> = {
      activeUsers,
      currentPlayers
    };
    const hostStillActive = activeUsers.includes(roomData.hostId);
    // Track last time we saw the host as active to avoid transient drops
    if (userId === roomData.hostId && isActive) {
      updates.lastSeenHostAt = serverTimestamp();
    }
    // Gracefully finish only if host has been inactive for a grace window
    if (!hostStillActive && roomData.status !== 'finished') {
      // Only act if we have a prior heartbeat from the host
      const lastSeen = roomData.lastSeenHostAt?.toDate ? roomData.lastSeenHostAt.toDate() : null;
      if (lastSeen) {
        const now = new Date();
        const msSinceSeen = now.getTime() - lastSeen.getTime();
        const GRACE_MS = 30000; // 30s grace to avoid premature finishing
        if (msSinceSeen > GRACE_MS) {
          updates.status = 'finished';
        }
      }
    }

    // Skip no-op writes
    const arraysEqual = (a: string[] = [], b: string[] = []) => a.length === b.length && a.every((v, i) => v === b[i]);
    const onlyPresenceChanged =
      arraysEqual(activeUsers, roomData.activeUsers || []) &&
      currentPlayers === (roomData.currentPlayers || 0) &&
      updates.status === undefined &&
      updates.lastSeenHostAt === undefined;
    if (onlyPresenceChanged) {
      return;
    }

    await updateDoc(roomRef, updates);
  }

  // Listen to all rooms
  onRoomsChange(callback: (rooms: RoomData[]) => void): Unsubscribe {
    let db
    try {
      db = this.getDb()
    } catch {
      callback([])
      return () => { }
    }

    // Show only 'waiting' and 'ready' rooms in lobby listings (exclude 'finished' and 'battling' rooms)
    const roomsQuery = query(
      collection(db, this.roomsCollection),
      where('status', 'in', ['waiting', 'ready']),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    return onSnapshot(roomsQuery, (snapshot) => {
      const rooms: RoomData[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();

        // Handle older rooms that might not have all the new fields
        const room: RoomData = {
          id: doc.id,
          hostId: data.hostId || '',
          hostName: data.hostName || 'Unknown Host',
          hostPhotoURL: data.hostPhotoURL,
          hostTeam: data.hostTeam,
          hostReady: data.hostReady || false,
          hostReleasedTeam: data.hostReleasedTeam,
          guestId: data.guestId,
          guestName: data.guestName,
          guestPhotoURL: data.guestPhotoURL,
          guestTeam: data.guestTeam,
          guestReady: data.guestReady || false,
          guestReleasedTeam: data.guestReleasedTeam,
          status: data.status || 'waiting',
          createdAt: data.createdAt?.toDate() || new Date(),
          maxPlayers: data.maxPlayers || 2,
          currentPlayers: data.currentPlayers || (data.guestId ? 2 : 1),
          activeUsers: data.activeUsers || (data.hostId ? [data.hostId] : []),
          battleId: data.battleId
        };

        rooms.push(room);
      });
      callback(rooms);
    }, (error) => {
      console.error('roomService.onRoomsChange error:', error);
      callback([]);
    });
  }
}

export const roomService = new RoomService();
