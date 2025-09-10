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
import { db } from './firebase';
import { battleService } from './battleService';
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

  // Close all existing rooms for a user
  async closeExistingRoomsForUser(userId: string): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');
    
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
    if (!db) throw new Error('Firebase not initialized');
    
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
    if (!db) throw new Error('Firebase not initialized');
    
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
    if (!db) throw new Error('Firebase not initialized');
    
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
      hasSpace: roomData.currentPlayers < roomData.maxPlayers
    });
    
    // Temporarily allow joining even if room is not in waiting status for debugging
    if (roomData.currentPlayers >= roomData.maxPlayers) {
      throw new Error(`Room is full. Players: ${roomData.currentPlayers}/${roomData.maxPlayers}`);
    }
    
    // Allow joining if room is waiting or ready (for debugging)
    if (roomData.status !== 'waiting' && roomData.status !== 'ready') {
      throw new Error(`Room is not available. Status: ${roomData.status}`);
    }
    
    // Update room with guest information
    const activeUsers = roomData.activeUsers || [roomData.hostId];
    if (!activeUsers.includes(guestId)) {
      activeUsers.push(guestId);
    }
    
    const updateData: Record<string, unknown> = {
      guestId,
      guestName,
      guestPhotoURL: guestPhotoURL || null,
      guestReady: false,
      guestAnimatingBalls: [],
      guestReleasedBalls: [],
      currentPlayers: activeUsers.length,
      activeUsers,
      status: 'ready' // Both players are now in the room
    };
    
    // Ensure maxPlayers is set for older rooms
    if (!roomData.maxPlayers) {
      updateData.maxPlayers = 2;
    }

    // Only include guestTeam if it's provided and not undefined
    if (guestTeam !== undefined) {
      updateData.guestTeam = guestTeam;
    }

    console.log('Updating room with data:', updateData);
    try {
      await updateDoc(roomRef, updateData);
      console.log('Room updated successfully');
    } catch (updateError) {
      console.error('Failed to update room:', updateError);
      
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
          updateData
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
      
      throw new Error(`Failed to update room: ${updateError instanceof Error ? updateError.message : 'Unknown error'}`);
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
    if (!db) throw new Error('Firebase not initialized');
    
    const roomRef = doc(db, this.roomsCollection, roomId);
    const roomSnap = await getDoc(roomRef);
    
    if (!roomSnap.exists()) return;
    
    const roomData = roomSnap.data();
    
    const wasBattling = roomData.status === 'battling';

    // If room was in battle, mark as unresolved and remove it from lobby listings
    if (wasBattling) {
      try {
        if (roomData.battleId) {
          await battleService.deleteBattle(roomData.battleId);
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
      // Host is leaving (not battling) - delete the room
      await deleteDoc(roomRef);
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
    if (!db) throw new Error('Firebase not initialized');
    
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
    if (!db) throw new Error('Firebase not initialized');
    
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
    if (!db) throw new Error('Firebase not initialized');
    
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
    if (!db) throw new Error('Firebase not initialized');
    
    console.log('roomService.updateBallAnimation called with:', { roomId, playerType, animatingBalls: Array.from(animatingBalls), releasedBalls: Array.from(releasedBalls) });
    
    // Check authentication state
    const { auth } = await import('@/lib/firebase');
    if (!auth || !auth.currentUser) {
      throw new Error('User not authenticated');
    }
    console.log('User authenticated:', auth.currentUser?.uid);
    
    // Ensure animation fields are initialized
    await this.initializeAnimationFields(roomId);
    
    const updates: RoomUpdate = {};
    
    if (playerType === 'host') {
      updates.hostAnimatingBalls = Array.from(animatingBalls);
      updates.hostReleasedBalls = Array.from(releasedBalls);
    } else {
      updates.guestAnimatingBalls = Array.from(animatingBalls);
      updates.guestReleasedBalls = Array.from(releasedBalls);
    }
    
    await this.updateRoom(roomId, updates);
    console.log('roomService.updateBallAnimation completed successfully');
  }

  // Update ready status for a player
  async updateReadyStatus(roomId: string, userId: string, isReady: boolean): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');
    
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
    
    if (roomData.guestId && newHostReady && newGuestReady && roomData.status === 'waiting') {
      updates.status = 'ready';
    }
    
    await this.updateRoom(roomId, updates);
  }

  // Start battle
  async startBattle(roomId: string, _battleId: string): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');
    
    const roomRef = doc(db, this.roomsCollection, roomId);
    const roomSnap = await getDoc(roomRef);
    
    if (!roomSnap.exists()) {
      throw new Error('Room not found');
    }
    
    const roomData = roomSnap.data();
    
    // Check if both players are ready
    if (!roomData.hostReady || !roomData.guestReady) {
      throw new Error('Both players must be ready before starting the battle');
    }
    
    // Check if both players have teams
    if (!roomData.hostTeam || !roomData.guestTeam) {
      throw new Error('Both players must select teams before starting the battle');
    }
    
    // Create battle in Firestore
    console.log('=== BATTLE CREATION DEBUG ===');
    console.log('Host team being passed to battle:', roomData.hostTeam);
    console.log('Guest team being passed to battle:', roomData.guestTeam);
    console.log('Teams are identical:', JSON.stringify(roomData.hostTeam) === JSON.stringify(roomData.guestTeam));
    
    const actualBattleId = await battleService.createBattle(
      roomId,
      roomData.hostId,
      roomData.hostName,
      roomData.hostTeam,
      roomData.guestId,
      roomData.guestName,
      roomData.guestTeam
    );
    
    await updateDoc(roomRef, {
      status: 'battling',
      battleId: actualBattleId,
      // Mark start time so clients can show a short countdown
      startedAt: serverTimestamp()
    });
  }

  // Listen to room changes
  onRoomChange(roomId: string, callback: (room: RoomData | null) => void): Unsubscribe {
    if (!db) {
      callback(null);
      return () => {};
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

  // Track user presence in a room
  async trackUserPresence(roomId: string, userId: string, isActive: boolean): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');
    
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
    
    // Update current players count based on active users
    const currentPlayers = activeUsers.length;
    
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

    await updateDoc(roomRef, updates);
  }

  // Listen to all rooms
  onRoomsChange(callback: (rooms: RoomData[]) => void): Unsubscribe {
    if (!db) {
      callback([]);
      return () => {};
    }
    
    // Show only 'waiting' and 'ready' rooms in lobby listings
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
