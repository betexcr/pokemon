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

export interface BattleAction {
  playerId: string;
  playerName: string;
  type: 'move' | 'switch';
  moveId?: string;
  moveName?: string;
  moveIndex?: number; // Index of the move in the Pokemon's moves array
  switchIndex?: number;
  turnNumber?: number;
  timestamp?: number;
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
  turnNumber: number; // Primary turn tracking for battle synchronization
  actions: BattleAction[]; // Changed from moves to actions
  battleData: unknown; // The actual battle state from the game engine
  status: 'waiting' | 'active' | 'completed';
  winner?: string;
  phase: 'choice' | 'resolution' | 'end_of_turn' | 'replacement' | 'selection' | 'execution';
  createdAt: Date;
  updatedAt: Date;
}

export interface BattleUpdate {
  currentTurn?: 'host' | 'guest';
  turnNumber?: number;
  actions?: BattleAction[];
  battleData?: unknown;
  status?: 'waiting' | 'active' | 'completed';
  winner?: string;
  phase?: 'choice' | 'resolution' | 'end_of_turn' | 'replacement';
  updatedAt?: unknown;
}

class BattleService {
  private battlesCollection = 'battles';
  
  private ensureAuthenticated(): void {
    if (!auth?.currentUser?.uid) {
      console.error('❌ Authentication check failed: No current user');
      throw new Error('User not authenticated');
    }
    
    // Check if the user's token is still valid
    if (auth.currentUser) {
      auth.currentUser.getIdToken().then(token => {
        console.log('🔑 User token is valid, length:', token.length);
      }).catch(error => {
        console.error('❌ User token validation failed:', error);
      });
    }
  }

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
    this.ensureAuthenticated();
    
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
      actions: [],
      battleData: null, // Will be set when battle starts
      status: 'waiting' as const,
      phase: 'choice' as const,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, this.battlesCollection), battleData);
    console.log('✅ Battle document created with ID:', docRef.id);
    console.log('📊 Battle data structure:', {
      hostId: battleData.hostId,
      guestId: battleData.guestId,
      roomId: battleData.roomId,
      status: battleData.status,
      hasHostTeam: !!battleData.hostTeam,
      hasGuestTeam: !!battleData.guestTeam
    });
    return docRef.id;
  }

  // Get battle by ID
  async getBattle(battleId: string): Promise<MultiplayerBattleState | null> {
    if (!db) throw new Error('Firebase not initialized');
    this.ensureAuthenticated();
    
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
    this.ensureAuthenticated();
    
    console.log('🔄 Updating battle:', { battleId, updates });
    console.log('🔑 Current user UID:', this.auth?.currentUser?.uid);
    console.log('🔑 User authenticated:', this.auth?.currentUser ? 'Yes' : 'No');
    console.log('🔑 Auth token valid:', this.auth?.currentUser?.uid ? 'Yes' : 'No');
    
    const battleRef = doc(db, this.battlesCollection, battleId);
    const snap = await getDoc(battleRef);
    if (snap.exists()) {
      const current = snap.data();
      console.log('📊 Current battle data:', current);
      console.log('🔍 Battle document structure check:');
      console.log('  - Host ID:', current.hostId);
      console.log('  - Guest ID:', current.guestId);
      console.log('  - Room ID:', current.roomId);
      console.log('  - Status:', current.status);
      console.log('  - Current user matches host:', this.auth?.currentUser?.uid === current.hostId);
      console.log('  - Current user matches guest:', this.auth?.currentUser?.uid === current.guestId);
      
      // Build a comparable subset without updatedAt
      const keys = Object.keys(updates).filter(k => k !== 'updatedAt');
      const nextSubset: Record<string, unknown> = {};
      const currSubset: Record<string, unknown> = {};
      keys.forEach(k => {
        nextSubset[k] = (updates as Record<string, unknown>)[k];
        currSubset[k] = current[k];
      });
      if (this.isEqual(currSubset, nextSubset)) {
        console.log('⏭️ Skipping update - no changes detected');
        return; // No-op update; skip write to avoid loop
      }
    }
    const payload: BattleUpdate = { ...updates };
    
    // Remove undefined values to prevent Firebase errors
    Object.keys(payload).forEach(key => {
      if (payload[key as keyof BattleUpdate] === undefined) {
        delete payload[key as keyof BattleUpdate];
      }
    });
    
    if (payload.battleData !== undefined) {
      payload.battleData = this.sanitizeForFirestore(payload.battleData);
    }
    
    console.log('📤 Sending payload to Firebase:', payload);
    
    try {
      const updateData = {
        ...payload,
        updatedAt: serverTimestamp()
      };
      
      console.log('📤 Final update data being sent to Firebase:', updateData);
      console.log('🔑 Current user UID:', this.auth?.currentUser?.uid);
      console.log('🏠 Battle host ID:', snap.data()?.hostId);
      console.log('👥 Battle guest ID:', snap.data()?.guestId);
      console.log('🔍 Update fields being sent:', Object.keys(updateData));
      console.log('🔍 User has permission to update:', 
        this.auth?.currentUser?.uid === snap.data()?.hostId || 
        this.auth?.currentUser?.uid === snap.data()?.guestId
      );
      
      await updateDoc(battleRef, updateData);
      console.log('✅ Battle updated successfully');
    } catch (error) {
      console.error('❌ Failed to update battle:', error);
      
      // Safe error details extraction
      const errorDetails: any = {};
      try {
        if (error && typeof error === 'object') {
          errorDetails.code = (error as any).code || 'unknown';
          errorDetails.message = (error as any).message || String(error);
          errorDetails.details = (error as any).details || 'no details available';
        } else {
          errorDetails.message = String(error);
          errorDetails.code = 'unknown';
          errorDetails.details = 'no details available';
        }
      } catch (detailError) {
        errorDetails.message = 'Error extracting details';
        errorDetails.code = 'unknown';
        errorDetails.details = String(detailError);
      }
      
      console.error('❌ Error details:', errorDetails);
      
      // Check if it's a permissions error
      if (errorDetails.code === 'permission-denied') {
        console.error('🔒 Permission denied - checking user authentication and battle access');
        console.error('Current user UID:', this.auth?.currentUser?.uid);
        console.error('Battle host ID:', snap.data()?.hostId);
        console.error('Battle guest ID:', snap.data()?.guestId);
        console.error('Battle room ID:', snap.data()?.roomId);
        
        // Try to get room data to check permissions
        if (snap.data()?.roomId) {
          try {
            const roomRef = doc(db, 'battle_rooms', snap.data().roomId);
            const roomSnap = await getDoc(roomRef);
            if (roomSnap.exists()) {
              const roomData = roomSnap.data();
              console.error('Room data:', roomData);
              console.error('Room active users:', roomData.activeUsers);
            }
          } catch (roomError) {
            console.error('Failed to fetch room data:', roomError);
          }
        }
        
        throw new Error(`Permission denied: You don't have permission to update this battle. Please ensure you're properly authenticated and participating in this battle.`);
      }
      
      throw error;
    }
  }

  // Add an action to the battle (move or switch)
  async addAction(battleId: string, action: BattleAction): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');
    this.ensureAuthenticated();
    
    console.log('📤 === BATTLE SERVICE ADD ACTION ===');
    console.log('🆔 Battle ID:', battleId);
    console.log('👤 Player ID:', action.playerId);
    console.log('👤 Player Name:', action.playerName);
    console.log('🎯 Action Type:', action.type);
    console.log('⚡ Action Details:', action);
    console.log('🔑 Current user UID:', this.auth?.currentUser?.uid);
    
    const battleRef = doc(db, this.battlesCollection, battleId);
    const battleSnap = await getDoc(battleRef);
    
    if (!battleSnap.exists()) {
      throw new Error('Battle not found');
    }
    
    const battleData = battleSnap.data();
    console.log('📊 Current battle data:', {
      turnNumber: battleData.turnNumber,
      currentTurn: battleData.currentTurn,
      actionsCount: (battleData.actions || []).length,
      hostId: battleData.hostId,
      guestId: battleData.guestId
    });
    
    // Check if this player has already made an action for the current turn
    const currentTurnNumber = battleData.turnNumber || 1;
    const existingActionForTurn = (battleData.actions || []).find((existingAction: { playerId?: string; turnNumber?: number }) => 
      existingAction.playerId === action.playerId && existingAction.turnNumber === currentTurnNumber
    );
    
    if (existingActionForTurn) {
      console.log('⚠️ Player has already made an action for this turn, skipping duplicate');
      return;
    }
    
    const newAction = {
      ...action,
      turnNumber: currentTurnNumber,
      timestamp: Date.now()
    };
    
    console.log('📝 Adding new action:', newAction);
    
    // Add the action to the actions array
    const updatedActions = [...(battleData.actions || []), newAction];
    
    console.log('📊 Updated actions array length:', updatedActions.length);
    
    // Update the battle document (single write to reduce contention)
    const updateData = {
      actions: updatedActions,
      lastActionAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    console.log('📤 Final addAction update data:', updateData);
    
    try {
      await updateDoc(battleRef, updateData);
      console.log('✅ Action added successfully');
    } catch (error) {
      console.error('❌ Failed to add action:', error);
      console.error('❌ Error details:', {
        code: (error as any)?.code || 'unknown',
        message: (error as any)?.message || String(error),
        details: (error as any)?.details || 'no details available'
      });
      throw error;
    }
    
    console.log('✅ Action added to Firebase successfully');
    console.log('📡 Other players should now receive this action via Firebase listener');
  }

  // Legacy method for backward compatibility
  async addMove(battleId: string, playerId: string, playerName: string, moveIndex: number, moveName: string): Promise<void> {
    const action: BattleAction = {
      playerId,
      playerName,
      type: 'move',
      moveId: moveName, // Use moveName as moveId for now
      moveName,
      timestamp: Date.now()
    };
    
    return this.addAction(battleId, action);
  }

  // Start the battle (initialize battle data)
  async startBattle(battleId: string, initialBattleData: unknown): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');
    this.ensureAuthenticated();
    
    console.log('🚀 Starting battle:', { battleId, initialBattleData });
    
    const battleRef = doc(db, this.battlesCollection, battleId);
    
    // Retry mechanism for race conditions
    let retries = 3;
    let snap;
    
    while (retries > 0) {
      snap = await getDoc(battleRef);
      
      if (snap.exists()) {
        break;
      }
      
      console.log(`⏳ Battle document not found, retrying... (${retries} attempts left)`);
      retries--;
      
      if (retries > 0) {
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    if (!snap || !snap.exists()) {
      console.log('❌ Battle document does not exist after retries! Cannot start battle.');
      throw new Error(`Battle document ${battleId} does not exist`);
    }
    
    const data = snap.data();
    console.log('📊 Existing battle data:', data);
    
    if (data.status === 'active' && this.isEqual(data.battleData, initialBattleData)) {
      console.log('⏭️ Battle already active with same data, skipping');
      return; // Already active with same data
    }
    
    console.log('🔄 Updating existing battle document');
    await updateDoc(battleRef, {
      battleData: this.sanitizeForFirestore(initialBattleData),
      status: 'active',
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Battle started successfully');
  }

  // End the battle
  async endBattle(battleId: string, winner: string, finalBattleData: unknown): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');
    this.ensureAuthenticated();
    
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
    
    // Additional check: ensure the user is fully authenticated
    if (!auth.currentUser.uid) {
      console.warn('onBattleChange called with invalid user; skipping subscription to avoid permission error');
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
      console.error('Error details:', {
        code: (error as any)?.code || 'unknown',
        message: (error as any)?.message || String(error)
      });
      // Don't call callback with null on error, let the user handle it
    });
  }

  // Leave battle (cleanup when user leaves)
  async leaveBattle(battleId: string, userId: string): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');
    this.ensureAuthenticated();
    
    console.log('🧹 Leaving battle:', battleId, 'for user:', userId);
    console.log('🔑 Current user UID:', this.auth?.currentUser?.uid);
    console.log('🔑 User matches provided userId:', this.auth?.currentUser?.uid === userId);
    
    // Check if user is the host before attempting to delete
    try {
      const battleRef = doc(db, this.battlesCollection, battleId);
      const battleSnap = await getDoc(battleRef);
      
      if (battleSnap.exists()) {
        const battleData = battleSnap.data();
        console.log('📊 Battle data:', {
          hostId: battleData.hostId,
          guestId: battleData.guestId,
          status: battleData.status
        });
        console.log('🔍 User is host:', battleData.hostId === userId);
        console.log('🔍 User is guest:', battleData.guestId === userId);
        
        if (battleData.hostId === userId) {
          // Only host can delete the battle
          console.log('🗑️ Host leaving - deleting battle');
          await this.deleteBattle(battleId);
          console.log('✅ Successfully left battle (host deleted):', battleId);
        } else {
          // Non-host just logs out, doesn't delete battle
          console.log('👋 Non-host leaving - not deleting battle');
          console.log('✅ Successfully left battle (non-host):', battleId);
        }
      } else {
        console.log('✅ Battle already deleted:', battleId);
      }
    } catch (error) {
      console.error('❌ Error leaving battle:', error);
      
      // More robust error details extraction
      const errorDetails = {
        battleId,
        userId,
        currentUser: this.auth?.currentUser?.uid,
        errorType: error?.constructor?.name || 'Unknown',
        errorString: String(error),
        errorMessage: (error as any)?.message || 'No message available',
        errorCode: (error as any)?.code || 'No code available',
        errorStack: (error as any)?.stack || 'No stack available',
        errorName: (error as any)?.name || 'No name available'
      };
      
      console.error('❌ Error details:', errorDetails);
      
      // Log the raw error object structure for debugging
      console.error('❌ Raw error object:', {
        keys: Object.keys(error || {}),
        type: typeof error,
        isError: error instanceof Error,
        valueOf: error?.valueOf?.(),
        toString: error?.toString?.()
      });
      
      // Don't throw error for leave operations to avoid breaking navigation
      console.log('⚠️ Continuing despite leave error');
    }
  }

  // Delete battle
  async deleteBattle(battleId: string): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');
    this.ensureAuthenticated();
    
    console.log('🗑️ Deleting battle:', battleId);
    console.log('🔑 Current user UID:', this.auth?.currentUser?.uid);
    
    const battleRef = doc(db, this.battlesCollection, battleId);
    
    // First check if the user has permission to delete this battle
    const battleSnap = await getDoc(battleRef);
    if (battleSnap.exists()) {
      const battleData = battleSnap.data();
      console.log('📊 Battle data for deletion check:', {
        hostId: battleData.hostId,
        guestId: battleData.guestId,
        status: battleData.status
      });
      console.log('🔍 User is host (can delete):', battleData.hostId === this.auth?.currentUser?.uid);
    }
    
    await deleteDoc(battleRef);
    console.log('✅ Battle deleted successfully:', battleId);
  }
}

export const battleService = new BattleService();
