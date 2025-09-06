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
  guestId?: string;
  guestName?: string;
  guestTeam?: unknown; // Team data
  status: 'waiting' | 'ready' | 'battling' | 'finished';
  createdAt: Date;
  maxPlayers: number;
  currentPlayers: number;
  battleId?: string; // Reference to battle document
}

export interface RoomUpdate {
  hostTeam?: unknown;
  guestId?: string;
  guestName?: string;
  guestTeam?: unknown;
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
      status: 'waiting' as const,
      createdAt: serverTimestamp(),
      maxPlayers: 2,
      currentPlayers: 1
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
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date()
      } as RoomData;
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
    const updateData: Record<string, unknown> = {
      guestId,
      guestName,
      currentPlayers: roomData.currentPlayers + 1,
      status: 'ready' // Both players are now in the room
    };

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
      await updateDoc(roomRef, {
        guestId: deleteField(),
        guestName: deleteField(),
        guestTeam: deleteField(),
        currentPlayers: 1,
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

  // Start battle
  async startBattle(roomId: string, _battleId: string): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');
    
    const roomRef = doc(db, this.roomsCollection, roomId);
    const roomSnap = await getDoc(roomRef);
    
    if (!roomSnap.exists()) {
      throw new Error('Room not found');
    }
    
    const roomData = roomSnap.data();
    
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
        const room: RoomData = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        } as RoomData;
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
        rooms.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        } as RoomData);
      });
      callback(rooms);
    });
  }
}

export const roomService = new RoomService();
