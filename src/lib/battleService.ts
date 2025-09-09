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
  // Firestore server timestamp at write time
  timestamp: unknown;
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
    await updateDoc(battleRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  }

  // Add a move to the battle
  async addMove(battleId: string, playerId: string, playerName: string, moveIndex: number, moveName: string): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');
    
    const battleRef = doc(db, this.battlesCollection, battleId);
    const battleSnap = await getDoc(battleRef);
    
    if (!battleSnap.exists()) {
      throw new Error('Battle not found');
    }
    
    const battleData = battleSnap.data();
    // Prevent duplicate move append if last move matches same player/turn
    const last = (battleData.moves || []).slice(-1)[0];
    if (last && last.playerId === playerId && last.moveIndex === moveIndex && playerName === last.playerName) {
      return;
    }
    const newMove: BattleMove = {
      playerId,
      playerName,
      moveIndex,
      moveName,
      timestamp: serverTimestamp()
    };
    
    const updatedMoves = [...(battleData.moves || []), newMove];
    const nextTurn = battleData.currentTurn === 'host' ? 'guest' : 'host';
    const nextTurnNumber = battleData.turnNumber + 1;
    
    await updateDoc(battleRef, {
      moves: updatedMoves,
      currentTurn: nextTurn,
      turnNumber: nextTurnNumber,
      updatedAt: serverTimestamp()
    });
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
      battleData: initialBattleData,
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
