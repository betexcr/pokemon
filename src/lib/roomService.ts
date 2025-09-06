import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  deleteField,
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  type Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';
import { battleService } from './battleService';

export interface RoomData {
  id: string;
  hostId: string;
  hostName: string;
  hostTeam?: unknown; // Team data
  hostReady?: boolean; // Host ready status
  guestId?: string;
  guestName?: string;
  guestTeam?: unknown; // Team data
  guestReady?: boolean; // Guest ready status
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
  guestId?: string;
  guestName?: string;
  guestTeam?: unknown;
  guestReady?: boolean;
  status?: 'waiting' | 'ready' | 'battling' | 'finished';
  currentPlayers?: number;
  battleId?: string;
}

class RoomService {
  private roomsCollection = 'battle_rooms';

  // Create a new room
  async createRoom(hostId: string, hostName: string, hostTeam?: unknown): Promise<string> {
    if (!db) throw new Error('Firebase not initialized');
    
    const roomData: Record<string, unknown> = {
      hostId,
      hostName,
      hostReady: false,
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
        hostTeam: data.hostTeam,
        hostReady: data.hostReady || false,
        guestId: data.guestId,
        guestName: data.guestName,
        guestTeam: data.guestTeam,
        guestReady: data.guestReady || false,
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
  async joinRoom(roomId: string, guestId: string, guestName: string, guestTeam?: unknown): Promise<boolean> {
    if (!db) throw new Error('Firebase not initialized');
    
    const roomRef = doc(db, this.roomsCollection, roomId);
    const roomSnap = await getDoc(roomRef);
    
    if (!roomSnap.exists()) {
      throw new Error('Room not found');
    }
    
    const roomData = roomSnap.data();
    
    // Check if room is available
    if (roomData.status !== 'waiting' || roomData.currentPlayers >= roomData.maxPlayers) {
      throw new Error('Room is not available');
    }
    
    // Check if user is already in the room
    if (roomData.hostId === guestId || roomData.guestId === guestId) {
      throw new Error('User is already in this room');
    }
    
    // Update room with guest information
    const activeUsers = roomData.activeUsers || [roomData.hostId];
    if (!activeUsers.includes(guestId)) {
      activeUsers.push(guestId);
    }
    
    const updateData: Record<string, unknown> = {
      guestId,
      guestName,
      guestReady: false,
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

    await updateDoc(roomRef, updateData);
    
    return true;
  }

  // Leave a room
  async leaveRoom(roomId: string, userId: string): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');
    
    const roomRef = doc(db, this.roomsCollection, roomId);
    const roomSnap = await getDoc(roomRef);
    
    if (!roomSnap.exists()) return;
    
    const roomData = roomSnap.data();
    
    if (roomData.hostId === userId) {
      // Host is leaving - delete the room
      await deleteDoc(roomRef);
    } else if (roomData.guestId === userId) {
      // Guest is leaving - remove guest and reset room
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
    
    const roomRef = doc(db, this.roomsCollection, roomId);
    
    try {
      await updateDoc(roomRef, updates as Record<string, unknown>);
      console.log('roomService.updateRoom completed successfully');
    } catch (error) {
      console.error('roomService.updateRoom failed:', error);
      throw error;
    }
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
      battleId: actualBattleId
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
          hostTeam: data.hostTeam,
          hostReady: data.hostReady || false,
          guestId: data.guestId,
          guestName: data.guestName,
          guestTeam: data.guestTeam,
          guestReady: data.guestReady || false,
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
    
    await updateDoc(roomRef, {
      activeUsers,
      currentPlayers
    });
  }

  // Listen to all rooms
  onRoomsChange(callback: (rooms: RoomData[]) => void): Unsubscribe {
    if (!db) {
      callback([]);
      return () => {};
    }
    
    const roomsQuery = query(
      collection(db, this.roomsCollection),
      where('status', '==', 'waiting'),
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
          hostTeam: data.hostTeam,
          hostReady: data.hostReady || false,
          guestId: data.guestId,
          guestName: data.guestName,
          guestTeam: data.guestTeam,
          guestReady: data.guestReady || false,
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
