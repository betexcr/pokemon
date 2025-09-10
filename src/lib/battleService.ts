import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  serverTimestamp,
  type Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';
import { auth } from './firebase';

export interface BattleMove {
  playerId: string;
  playerName: string;
  moveIndex: number;
  moveName: string;
  turnNumber?: number;
}

export interface MultiplayerBattleState {
  id: string;
  roomId: string;
  hostId: string;
  hostName: string;
  hostTeam: unknown;
  guestId: string;
  guestName: string;
  guestTeam: unknown;
  currentTurn: 'host' | 'guest';
  turnNumber: number;
  moves: BattleMove[];
  battleData: unknown; // The actual battle state from the game engine
  status: 'waiting' | 'active' | 'completed';
  winner?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BattleUpdate {
  currentTurn?: 'host' | 'guest';
  turnNumber?: number;
  moves?: BattleMove[];
  battleData?: unknown;
  status?: 'waiting' | 'active' | 'completed';
  winner?: string;
  updatedAt?: unknown;
}

class BattleService {
  private battlesCollection = 'battles';

  // Recursively replace undefined with null so Firestore accepts the payload
  private sanitizeForFirestore<T>(value: T): T {
    if (value === undefined) {
      return null as unknown as T;
    }
    if (value === null) return value;
    if (Array.isArray(value)) {
      return value.map((item) => this.sanitizeForFirestore(item)) as unknown as T;
    }
    if (typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(obj)) {
        if (v === undefined) {
          out[k] = null; // Firestore disallows undefined in nested fields
        } else {
          out[k] = this.sanitizeForFirestore(v);
        }
      }
      return out as unknown as T;
    }
    return value;
  }

  private isEqual(a: unknown, b: unknown): boolean {
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return false;
    }
  }

  // Create a new battle
  async createBattle(roomId: string, hostId: string, hostName: string, hostTeam: unknown, guestId: string, guestName: string, guestTeam: unknown): Promise<string> {
    if (!db) throw new Error('Firebase not initialized');
    
    const battleData = {
      roomId,
      hostId,
      hostName,
      hostTeam,
      guestId,
      guestName,
      guestTeam,
      currentTurn: 'host' as const,
      turnNumber: 1,
      moves: [],
      battleData: null, // Will be set when battle starts
      status: 'waiting' as const,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, this.battlesCollection), battleData);
    return docRef.id;
  }

  // Get battle by ID
  async getBattle(battleId: string): Promise<MultiplayerBattleState | null> {
    if (!db) throw new Error('Firebase not initialized');
    
    const docRef = doc(db, this.battlesCollection, battleId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as MultiplayerBattleState;
    }
    
    return null;
  }

  // Update battle state
  async updateBattle(battleId: string, updates: BattleUpdate): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');
    
    const battleRef = doc(db, this.battlesCollection, battleId);
    const snap = await getDoc(battleRef);
    if (snap.exists()) {
      const current = snap.data();
      // Build a comparable subset without updatedAt
      const keys = Object.keys(updates).filter(k => k !== 'updatedAt');
      const nextSubset: Record<string, unknown> = {};
      const currSubset: Record<string, unknown> = {};
      keys.forEach(k => {
        nextSubset[k] = (updates as Record<string, unknown>)[k];
        currSubset[k] = current[k];
      });
      if (this.isEqual(currSubset, nextSubset)) {
        return; // No-op update; skip write to avoid loop
      }
    }
    const payload: BattleUpdate = { ...updates };
    if (payload.battleData !== undefined) {
      payload.battleData = this.sanitizeForFirestore(payload.battleData);
    }
    await updateDoc(battleRef, {
      ...payload,
      updatedAt: serverTimestamp()
    });
  }

  // Add a move to the battle
  async addMove(battleId: string, playerId: string, playerName: string, moveIndex: number, moveName: string): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');
    if (!auth?.currentUser) throw new Error('User not authenticated');
    
    console.log('📤 === BATTLE SERVICE ADD MOVE ===');
    console.log('🆔 Battle ID:', battleId);
    console.log('👤 Player ID:', playerId);
    console.log('👤 Player Name:', playerName);
    console.log('🎯 Move Index:', moveIndex);
    console.log('⚡ Move Name:', moveName);
    
    const battleRef = doc(db, this.battlesCollection, battleId);
    const battleSnap = await getDoc(battleRef);
    
    if (!battleSnap.exists()) {
      throw new Error('Battle not found');
    }
    
    const battleData = battleSnap.data();
    console.log('📊 Current battle data:', {
      turnNumber: battleData.turnNumber,
      currentTurn: battleData.currentTurn,
      movesCount: (battleData.moves || []).length
    });
    
    // Check if this player has already made a move for the current turn
    const currentTurnNumber = battleData.turnNumber || 1;
    const existingMoveForTurn = (battleData.moves || []).find((move: { playerId?: string; turnNumber?: number }) => 
      move.playerId === playerId && move.turnNumber === currentTurnNumber
    );
    
    if (existingMoveForTurn) {
      console.log('⚠️ Player has already made a move for this turn, skipping duplicate');
      return;
    }
    
    const newMove = {
      playerId,
      playerName,
      moveIndex,
      moveName,
      turnNumber: currentTurnNumber
    };
    
    console.log('📝 Adding new move:', newMove);
    
    // Add the move to the moves array (without serverTimestamp in the array)
    const updatedMoves = [...(battleData.moves || []), newMove];
    
    console.log('📊 Updated moves array length:', updatedMoves.length);
    
    // Update the battle document (single write to reduce contention)
    await updateDoc(battleRef, {
      moves: updatedMoves,
      lastMoveAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Move added to Firebase successfully');
    console.log('📡 Other players should now receive this move via Firebase listener');
  }

  // Start the battle (initialize battle data)
  async startBattle(battleId: string, initialBattleData: unknown): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');
    
    const battleRef = doc(db, this.battlesCollection, battleId);
    const snap = await getDoc(battleRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data.status === 'active' && this.isEqual(data.battleData, initialBattleData)) {
        return; // Already active with same data
      }
    }
    await updateDoc(battleRef, {
      battleData: this.sanitizeForFirestore(initialBattleData),
      status: 'active',
      updatedAt: serverTimestamp()
    });
  }

  // End the battle
  async endBattle(battleId: string, winner: string, finalBattleData: unknown): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');
    
    const battleRef = doc(db, this.battlesCollection, battleId);
    const snap = await getDoc(battleRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data.status === 'completed' && data.winner === winner && this.isEqual(data.battleData, finalBattleData)) {
        return; // No change
      }
    }
    await updateDoc(battleRef, {
      battleData: finalBattleData,
      status: 'completed',
      winner,
      updatedAt: serverTimestamp()
    });
  }

  // Listen to battle changes
  onBattleChange(battleId: string, callback: (battle: MultiplayerBattleState | null) => void): Unsubscribe {
    if (!db) {
      callback(null);
      return () => {};
    }
    
    // Guard: avoid subscribing before auth is available to prevent permission errors
    if (!auth?.currentUser) {
      console.warn('onBattleChange called before user is authenticated; skipping subscription to avoid permission error');
      callback(null);
      return () => {};
    }
    
    const battleRef = doc(db, this.battlesCollection, battleId);
    
    return onSnapshot(battleRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const battle: MultiplayerBattleState = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as MultiplayerBattleState;
        callback(battle);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Battle snapshot listener error:', error);
      console.error('Error details:', error.code, error.message);
      // Don't call callback with null on error, let the user handle it
    });
  }

  // Delete battle
  async deleteBattle(battleId: string): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');
    
    const battleRef = doc(db, this.battlesCollection, battleId);
    await deleteDoc(battleRef);
  }
}

export const battleService = new BattleService();
