import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  serverTimestamp,
  type DocumentData,
  type Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';

export interface BattleMove {
  playerId: string;
  playerName: string;
  moveIndex: number;
  moveName: string;
  timestamp: Date;
}

export interface MultiplayerBattleState {
  id: string;
  roomId: string;
  hostId: string;
  hostName: string;
  hostTeam: any;
  guestId: string;
  guestName: string;
  guestTeam: any;
  currentTurn: 'host' | 'guest';
  turnNumber: number;
  moves: BattleMove[];
  battleData: any; // The actual battle state from the game engine
  status: 'waiting' | 'active' | 'completed';
  winner?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BattleUpdate {
  currentTurn?: 'host' | 'guest';
  turnNumber?: number;
  moves?: BattleMove[];
  battleData?: any;
  status?: 'waiting' | 'active' | 'completed';
  winner?: string;
  updatedAt?: any;
}

class BattleService {
  private battlesCollection = 'battles';

  // Create a new battle
  async createBattle(roomId: string, hostId: string, hostName: string, hostTeam: any, guestId: string, guestName: string, guestTeam: any): Promise<string> {
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
    const newMove: BattleMove = {
      playerId,
      playerName,
      moveIndex,
      moveName,
      timestamp: new Date()
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
  async startBattle(battleId: string, initialBattleData: any): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');
    
    const battleRef = doc(db, this.battlesCollection, battleId);
    await updateDoc(battleRef, {
      battleData: initialBattleData,
      status: 'active',
      updatedAt: serverTimestamp()
    });
  }

  // End the battle
  async endBattle(battleId: string, winner: string, finalBattleData: any): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');
    
    const battleRef = doc(db, this.battlesCollection, battleId);
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
