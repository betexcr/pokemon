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
  status: 'waiting' | 'ready' | 'battling' | 'finished';
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
        console.log(`Closing existing room ${doc.id} for user ${userId}`);
        await deleteDoc(doc.ref);
      });
      
      await Promise.all(closePromises);
      
      if (snapshot.docs.length > 0) {
        console.log(`Closed ${snapshot.docs.length} existing room(s) for user ${userId}`);
      }
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
      
      console.log('✅ Room created successfully:', docRef.id);
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
    
    console.log('RoomService.joinRoom called with:', { roomId, guestId, guestName, guestTeam });
    
    try {
    
    const roomRef = doc(db, this.roomsCollection, roomId);
    const roomSnap = await getDoc(roomRef);
    
    if (!roomSnap.exists()) {
      throw new Error('Room not found');
    }
    
    const roomData = roomSnap.data();
    console.log('Current room data:', roomData);
    
    // Check if user is already in the room BEFORE capacity checks
    if (roomData.hostId === guestId || roomData.guestId === guestId) {
      console.log('User already in room; skipping join and updating team if provided');
      // If already the guest and a team is provided, update guestTeam
      if (roomData.guestId === guestId && guestTeam !== undefined) {
        try {
          await updateDoc(roomRef, { guestTeam: guestTeam });
        } catch (e) {
          console.warn('Failed to update guest team for existing guest:', e);
        }
      }
      
      // Ensure currentPlayers is correct even for existing users
      const activeUsers = roomData.activeUsers || [roomData.hostId];
      const correctCurrentPlayers = activeUsers.length;
      if (roomData.currentPlayers !== correctCurrentPlayers) {
        console.log(`Fixing currentPlayers: ${roomData.currentPlayers} -> ${correctCurrentPlayers}`);
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
    console.log('Room availability check:', {
      status: roomData.status,
      currentPlayers: roomData.currentPlayers,
      maxPlayers: roomData.maxPlayers,
      isWaiting: roomData.status === 'waiting',
      hasSpace: roomData.currentPlayers < roomData.maxPlayers,
      hasGuest: !!roomData.guestId
    });
    
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

    console.log('JoinRoom ATOMIC claim+presence:', atomicData);
    try {
      await updateDoc(roomRef, atomicData);
      console.log('JoinRoom ATOMIC completed');
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
          console.log('🏠 Host leaving room, deleting battle:', roomData.battleId);
          await battleService.deleteBattle(roomData.battleId);
        } else if (roomData.battleId) {
          console.log('👋 Non-host leaving room, not deleting battle:', roomData.battleId);
          // Non-host leaving - battle should remain active for the host
        }
      } catch (e) {
        console.warn('Failed to delete battle during leave:', e);
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
    console.log('roomService.updateRoom called with:', { roomId, updates });
    
    // Special debugging for team updates
    if (updates.guestTeam) {
      console.log('=== GUEST TEAM UPDATE IN ROOM SERVICE ===');
      console.log('Guest team being saved:', updates.guestTeam);
    }
    if (updates.hostTeam) {
      console.log('=== HOST TEAM UPDATE IN ROOM SERVICE ===');
      console.log('Host team being saved:', updates.hostTeam);
    }
    
    const roomRef = doc(db, this.roomsCollection, roomId);
    
    try {
      await updateDoc(roomRef, updates as Record<string, unknown>);
      console.log('roomService.updateRoom completed successfully');
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
      console.log(`Fixing currentPlayers for room ${roomId}: ${roomData.currentPlayers} -> ${correctCurrentPlayers}`);
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
      console.log('Initializing animation fields for room:', roomId, updates);
      await updateDoc(roomRef, updates);
      console.log('Animation fields initialized successfully');
    }
  }

  // Update ball animation state
  async updateBallAnimation(roomId: string, playerType: 'host' | 'guest', animatingBalls: Set<number>, releasedBalls: Set<number>): Promise<void> {
    const db = this.getDb();
    console.log('roomService.updateBallAnimation called with:', { roomId, playerType, animatingBalls: Array.from(animatingBalls), releasedBalls: Array.from(releasedBalls) });
    
    // Check authentication state
    const { auth } = await import('@/lib/firebase');
    if (!auth || !auth.currentUser) {
      throw new Error('User not authenticated');
    }
    console.log('User authenticated:', auth.currentUser?.uid);
    
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
      console.log('roomService.updateBallAnimation skipped (no changes)');
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
    console.log('roomService.updateBallAnimation completed successfully');
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
      console.log('Room status updated to ready:', { roomId, userId, newHostReady, newGuestReady, currentStatus: roomData.status });
      
      // Do not pre-create battles here; host will create RTDB battle on start to avoid ID races
    } else if (roomData.guestId && (!newHostReady || !newGuestReady) && roomData.status === 'ready') {
      // If one player is not ready, set status back to 'waiting'
      updates.status = 'waiting';
      console.log('Room status updated to waiting:', { roomId, userId, newHostReady, newGuestReady, currentStatus: roomData.status });
    }
    
    await this.updateRoom(roomId, updates);
  }

  // Secure battle data by creating battle document when both players are ready
  async secureBattleData(roomId: string, roomData: any): Promise<void> {
    const db = this.getDb();
    try {
      // Check if battle document already exists
      if (roomData.battleId) {
        console.log('Battle document already exists:', roomData.battleId);
        return;
      }
      
      // Validate that both players have teams
      if (!roomData.hostTeam || !roomData.guestTeam) {
        console.log('Cannot secure battle data: missing teams');
        return;
      }
      
      // Validate team structures
      const hostTeamValid = this.validateTeamStructure(roomData.hostTeam);
      const guestTeamValid = this.validateTeamStructure(roomData.guestTeam);
      
      if (!hostTeamValid || !guestTeamValid) {
        console.log('Cannot secure battle data: invalid team structures');
        return;
      }
      
      console.log('🔒 Securing battle data - creating battle document early');
      
      // Create battle document with secured data
      const battleId = await battleService.createBattle(
        roomId,
        roomData.hostId,
        roomData.hostName,
        roomData.hostTeam,
        roomData.guestId,
        roomData.guestName,
        roomData.guestTeam
      );
      
      // Update room with battle ID
      await updateDoc(doc(db, this.roomsCollection, roomId), {
        battleId: battleId,
        securedAt: serverTimestamp()
      });
      
      console.log('✅ Battle data secured with ID:', battleId);
      
    } catch (error) {
      console.error('❌ Failed to secure battle data:', error);
      // Don't throw error - this is a non-critical operation
    }
  }
  
  // Helper method to validate team structure
  private validateTeamStructure(team: any): boolean {
    if (!team) return false;
    
    let pokemonArray: any[] = [];
    
    if (Array.isArray(team)) {
      pokemonArray = team;
    } else if (team.slots) {
      pokemonArray = team.slots;
    } else if (team.pokemon) {
      pokemonArray = team.pokemon;
    }
    
    // Check if team has at least one valid Pokemon
    const validPokemon = pokemonArray.filter((pokemon: any) => pokemon && pokemon.id && pokemon.level);
    return validPokemon.length > 0;
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
    
    console.log('🔍 === DETAILED TEAM STRUCTURE DEBUG ===');
    console.log('Host Team Type:', typeof roomData.hostTeam);
    console.log('Host Team Is Array:', Array.isArray(roomData.hostTeam));
    console.log('Host Team Length:', roomData.hostTeam?.length);
    console.log('Host Team Content:', JSON.stringify(roomData.hostTeam, null, 2));
    console.log('Guest Team Type:', typeof roomData.guestTeam);
    console.log('Guest Team Is Array:', Array.isArray(roomData.guestTeam));
    console.log('Guest Team Length:', roomData.guestTeam?.length);
    console.log('Guest Team Content:', JSON.stringify(roomData.guestTeam, null, 2));
    
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
      console.log('🔍 Host Team Debug:');
      console.log('Total slots:', hostPokemonArray.length);
      console.log('Valid Pokemon slots:', validHostPokemon.length);
      console.log('All slots:', hostPokemonArray);
      
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
      console.log('🔍 Guest Team Debug:');
      console.log('Total slots:', guestPokemonArray.length);
      console.log('Valid Pokemon slots:', validGuestPokemon.length);
      console.log('All slots:', guestPokemonArray);
      
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
    if (roomData.status === 'unresolved' && currentPlayers === 1) {
      console.log('⚠️ Room is in unresolved status with single player - allowing battle to proceed');
    } else if (!allowedStatuses.includes(roomData.status)) {
      validationErrors.push(`Room status must be ${allowedStatuses.join(' or ')}, got '${roomData.status}'`);
    }
    
    // Check player count - allow single player for unresolved status
    if (roomData.status === 'unresolved' && currentPlayers === 1) {
      console.log('⚠️ Single player in unresolved room - allowing battle to proceed');
    } else if (currentPlayers !== 2) {
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
    
    console.log('✅ All battle readiness validations passed');
    
    const roomRef = doc(db, this.roomsCollection, roomId);
    const roomSnap = await getDoc(roomRef);
    
    if (!roomSnap.exists()) {
      throw new Error('Room not found');
    }
    
    const roomData = roomSnap.data();
    
    console.log('🔍 === BATTLE START DETAILS ===');
    console.log('Room ID:', roomId);
    console.log('Room Status:', roomData.status);
    console.log('Host ID:', roomData.hostId);
    console.log('Guest ID:', roomData.guestId);
    console.log('Has Host Team:', !!roomData.hostTeam);
    console.log('Has Guest Team:', !!roomData.guestTeam);
    
    // Check if teams are identical (prevent same team battles)
    // More robust comparison that handles different property orders
    const normalizeTeam = (team: any) => {
      if (!team || !Array.isArray(team)) return team;
      return team.map(pokemon => ({
        id: pokemon.id,
        level: pokemon.level,
        // Cloud engine expects move IDs (names) array; extract from objects when present
        moves: Array.isArray(pokemon.moves)
          ? pokemon.moves
              .map((m: any) => (typeof m === 'string' ? m : (m?.id || m?.name)))
              .filter((m: any) => typeof m === 'string' && m)
              .slice(0, 4)
          : []
      })).sort((a, b) => a.id - b.id);
    };
    
    const normalizedHostTeam = normalizeTeam(roomData.hostTeam);
    const normalizedGuestTeam = normalizeTeam(roomData.guestTeam);
    const teamsAreIdentical = JSON.stringify(normalizedHostTeam) === JSON.stringify(normalizedGuestTeam);

    if (teamsAreIdentical) {
      console.error('🚨 PREVENTION: Both players selected identical teams');
      console.error('Host team:', normalizedHostTeam);
      console.error('Guest team:', normalizedGuestTeam);
      throw new Error('Both players cannot use the same team. Please select different teams.');
    }

    // Use existing battle document or create new one if needed
    let actualBattleId = roomData.battleId;
    
    if (actualBattleId) {
      console.log('✅ Using existing battle document:', actualBattleId);
    } else {
      console.log('=== BATTLE CREATION DEBUG (fallback) ===');
      console.log('Host team being passed to battle:', roomData.hostTeam);
      console.log('Guest team being passed to battle:', roomData.guestTeam);
      console.log('Teams are identical:', teamsAreIdentical);
      
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
      
      // Add a small delay to ensure Firestore consistency before updating room
      console.log('⏳ Waiting for battle document consistency...');
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Ensure RTDB mirrors the battle so realtime listeners can attach
    if (actualBattleId) {
      try {
        const hostRtdbTeam = this.normalizeTeamForRTDB(roomData.hostTeam);
        const guestRtdbTeam = this.normalizeTeamForRTDB(roomData.guestTeam);
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
        console.warn('⚠️ Failed to prime RTDB battle state:', rtdbError);
      }
    }

    await updateDoc(roomRef, {
      status: 'battling',
      battleId: actualBattleId,
      // Mark start time so clients can show a short countdown
      startedAt: serverTimestamp()
    });
    
    console.log('✅ Room updated with battle ID:', actualBattleId, 'for room:', roomId);
  }

  // Listen to room changes
  onRoomChange(roomId: string, callback: (room: RoomData | null) => void): Unsubscribe {
    let db
    try {
      db = this.getDb()
    } catch (error) {
      console.warn('roomService.onRoomChange missing Firestore instance', error)
      callback(null)
      return () => {}
    }
    
    console.log('roomService.onRoomChange setting up listener for room:', roomId);
    
    const roomRef = doc(db, this.roomsCollection, roomId);
    
    return onSnapshot(roomRef, (doc) => {
      console.log('roomService.onRoomChange snapshot received for room:', roomId, 'exists:', doc.exists());
      
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
        
        console.log('roomService.onRoomChange calling callback with room:', room);
        callback(room);
      } else {
        console.log('roomService.onRoomChange calling callback with null (room deleted)');
        console.log('roomService.onRoomChange - checking if this is due to a failed update...');
        callback(null);
      }
    }, (error) => {
      console.error('roomService.onRoomChange error:', error);
      console.error('roomService.onRoomChange error details:', error.code, error.message);
      
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
    });
  }

  private normalizeTeamForRTDB(teamData: unknown): Array<Record<string, unknown>> {
    if (!teamData) return [];
    const slots = Array.isArray(teamData)
      ? teamData
      : typeof teamData === 'object' && (teamData as any).slots
        ? (teamData as any).slots
        : [];

    if (!Array.isArray(slots)) return [];

    return slots
      .filter((slot: any) => slot && (slot.id ?? null) !== null)
      .map((slot: any, index: number) => {
        const id = typeof slot.id === 'number' ? slot.id : parseInt(String(slot.id ?? 0), 10) || index + 1;
        const species = typeof slot.species === 'string'
          ? slot.species
          : slot.name || `pokemon-${id}`;
        const level = typeof slot.level === 'number' ? slot.level : 50;
        const moveNames = Array.isArray(slot.moves)
          ? slot.moves
              .map((move: any) => {
                if (typeof move === 'string') return move;
                if (move && typeof move === 'object') {
                  return move.name || move.id || null;
                }
                return null;
              })
              .filter((name): name is string => Boolean(name))
              .slice(0, 4)
          : [];

        return {
          pokemon: {
            id,
            name: species,
            types: Array.isArray(slot.types)
              ? slot.types
                  .map((t: any) => (typeof t === 'string' ? t : t?.type?.name))
                  .filter(Boolean)
              : [],
          },
          level,
          moves: moveNames,
          currentHp: typeof slot.currentHp === 'number' ? slot.currentHp : 100,
          maxHp: typeof slot.maxHp === 'number' ? slot.maxHp : 100,
          nature: typeof slot.nature === 'string' ? slot.nature : 'hardy',
          statModifiers: slot.statModifiers || {},
          status: slot.status || null,
          originalIndex: index
        };
      });
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
      console.log('trackUserPresence skipped (no changes)');
      return;
    }

    await updateDoc(roomRef, updates);
  }

  // Listen to all rooms
  onRoomsChange(callback: (rooms: RoomData[]) => void): Unsubscribe {
    let db
    try {
      db = this.getDb()
    } catch (error) {
      console.warn('roomService.onRoomsChange missing Firestore instance', error)
      callback([])
      return () => {}
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
    });
  }
}

export const roomService = new RoomService();
