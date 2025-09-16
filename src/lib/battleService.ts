import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs,
  updateDoc, 
  deleteDoc, 
  setDoc,
  onSnapshot, 
  query,
  where,
  serverTimestamp,
  type Unsubscribe,
  type DocumentSnapshot
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
  private auth = auth;
  
  private ensureAuthenticated(): void {
    console.log('🔍 Authentication state check:', {
      authObjectExists: !!this.auth,
      currentUserExists: !!this.auth?.currentUser,
      currentUserUid: this.auth?.currentUser?.uid,
      currentUserEmail: this.auth?.currentUser?.email,
      currentUserEmailVerified: this.auth?.currentUser?.emailVerified,
      currentUserDisplayName: this.auth?.currentUser?.displayName
    });
    
    if (!this.auth?.currentUser?.uid) {
      console.error('❌ Authentication check failed: No current user');
      console.error('❌ Auth object exists:', !!this.auth);
      console.error('❌ Current user exists:', !!this.auth?.currentUser);
      console.error('❌ Current user UID exists:', !!this.auth?.currentUser?.uid);
      throw new Error('User not authenticated. Please sign in to access battle features.');
    }
    
    // Check if the user's token is still valid
    if (this.auth.currentUser) {
      this.auth.currentUser.getIdToken().then(token => {
        console.log('🔑 User token is valid, length:', token.length);
      }).catch(error => {
        console.error('❌ User token validation failed:', error);
        throw new Error('Authentication token expired. Please sign in again.');
      });
    }
  }

  private getCurrentUserId(): string {
    const uid = this.auth?.currentUser?.uid;
    if (!uid) {
      console.error('❌ Cannot get current user ID - user not authenticated');
      console.error('❌ Auth state:', {
        authExists: !!this.auth,
        currentUserExists: !!this.auth?.currentUser,
        uidExists: !!this.auth?.currentUser?.uid
      });
      throw new Error('User not authenticated');
    }
    return uid;
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

    console.log('📝 Creating battle document with data:', {
      roomId,
      hostId,
      hostName,
      guestId,
      guestName,
      hasHostTeam: !!hostTeam,
      hasGuestTeam: !!guestTeam
    });

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
    
    // Verify the document was created successfully by immediately reading it back
    try {
      const verificationDoc = await getDoc(doc(db, this.battlesCollection, docRef.id));
      if (verificationDoc.exists()) {
        console.log('✅ Battle document verification successful');
      } else {
        console.error('❌ Battle document verification failed - document does not exist after creation');
        throw new Error('Battle document was not created properly');
      }
    } catch (verificationError) {
      console.error('❌ Battle document verification error:', verificationError);
      throw new Error(`Battle document creation verification failed: ${verificationError instanceof Error ? verificationError.message : 'Unknown error'}`);
    }
    
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
    const currentUserId = this.getCurrentUserId();
    console.log('🔑 Current user UID:', currentUserId);
    console.log('🔑 User authenticated:', this.auth?.currentUser ? 'Yes' : 'No');
    console.log('🔑 Auth token valid:', currentUserId ? 'Yes' : 'No');
    
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
      console.log('  - Current user matches host:', currentUserId === current.hostId);
      console.log('  - Current user matches guest:', currentUserId === current.guestId);
      console.log('  - Document ID:', snap.id);
      console.log('  - All document fields:', Object.keys(current));
      console.log('  - Field types:', {
        hostId: typeof current.hostId,
        guestId: typeof current.guestId,
        roomId: typeof current.roomId
      });
      
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
      console.log('🔑 Current user UID:', currentUserId);
      console.log('🏠 Battle host ID:', snap.data()?.hostId);
      console.log('👥 Battle guest ID:', snap.data()?.guestId);
      console.log('🔍 Update fields being sent:', Object.keys(updateData));
      console.log('🔍 User has permission to update:', 
        currentUserId === snap.data()?.hostId || 
        currentUserId === snap.data()?.guestId
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
        console.error('Current user UID:', currentUserId);
        console.error('Battle host ID:', snap.data()?.hostId);
        console.error('Battle guest ID:', snap.data()?.guestId);
        console.error('Battle room ID:', snap.data()?.roomId);
        
        // Check if the battle document has missing required fields
        const battleData = snap.data();
        if (battleData && (battleData.hostId === undefined || battleData.guestId === undefined || battleData.roomId === undefined)) {
          console.error('❌ Battle document has missing required fields - this is likely a data corruption issue');
          console.error('❌ Missing fields:', {
            hostId: battleData.hostId === undefined ? 'MISSING' : 'PRESENT',
            guestId: battleData.guestId === undefined ? 'MISSING' : 'PRESENT', 
            roomId: battleData.roomId === undefined ? 'MISSING' : 'PRESENT'
          });
          throw new Error('Battle document is corrupted - missing required fields (hostId, guestId, or roomId). Please create a new battle.');
        }
        
        // Try to get room data to check permissions
        if (battleData?.roomId) {
          try {
            const roomRef = doc(db, 'battle_rooms', battleData.roomId);
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
    const currentUserId = this.getCurrentUserId();
    console.log('🔑 Current user UID:', currentUserId);
    
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
      
      const errorDetails = {
        errorType: error?.constructor?.name || 'Unknown',
        errorMessage: (error as any)?.message || String(error),
        errorCode: (error as any)?.code || 'unknown',
        errorDetails: (error as any)?.details || 'no details available',
        actionType: action.type,
        battleId,
        currentUser: currentUserId
      };
      
      console.error('❌ Error details:', errorDetails);
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
    
    // Add initial delay to account for Firestore eventual consistency
    console.log('⏳ Waiting for Firestore consistency...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Use dynamic retry system for battle document retrieval
    const { DynamicRetry, BATTLE_RETRY_CONFIG } = await import('@/lib/retryUtils');
    
    let snap: DocumentSnapshot | undefined;
    
    try {
      await DynamicRetry.retry(
        async () => {
          snap = await getDoc(battleRef);
          
          if (!snap.exists()) {
            throw new Error(`Battle document ${battleId} not found`);
          }
          
          console.log('✅ Battle document found');
          return snap;
        },
        BATTLE_RETRY_CONFIG,
        (attempt, delay, error) => {
          console.log(`⏳ Battle document retrieval attempt ${attempt} failed:`, {
            error: error?.message || error,
            nextRetryIn: `${delay}ms`,
            battleId
          });
        }
      );
    } catch (error) {
      console.error('❌ Battle document retrieval failed after all retries:', error);
      throw error;
    }
    
    // At this point, we should have a valid snap from the retry system
    if (!snap || !snap.exists()) {
      throw new Error(`Battle document ${battleId} does not exist - this should not happen after successful retry`);
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
      
      const errorDetails = {
        errorType: error?.constructor?.name || 'Unknown',
        errorMessage: (error as any)?.message || String(error),
        errorCode: (error as any)?.code || 'unknown',
        battleId,
        currentUser: this.auth?.currentUser?.uid
      };
      
      console.error('Error details:', errorDetails);
      // Don't call callback with null on error, let the user handle it
    });
  }

  // Leave battle (cleanup when user leaves)
  async leaveBattle(battleId: string, userId: string): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');
    this.ensureAuthenticated();
    
    console.log('🧹 Leaving battle:', battleId, 'for user:', userId);
    const currentUserId = this.getCurrentUserId();
    console.log('🔑 Current user UID:', currentUserId);
    console.log('🔑 User matches provided userId:', currentUserId === userId);
    
    // Check if user is the host before attempting to delete
    try {
      console.log('🔍 Step 1: Getting battle document reference');
      const battleRef = doc(db, this.battlesCollection, battleId);
      console.log('🔍 Step 2: Attempting to fetch battle document');
      
      let battleSnap;
      try {
        battleSnap = await getDoc(battleRef);
        console.log('🔍 Step 3: Battle document fetch result:', {
          exists: battleSnap.exists(),
          id: battleSnap.id
        });
      } catch (fetchError) {
        console.error('❌ Error fetching battle document:', fetchError);
        console.error('❌ Fetch error details:', {
          errorType: fetchError?.constructor?.name,
          errorCode: (fetchError as any)?.code,
          errorMessage: (fetchError as any)?.message,
          errorDetails: (fetchError as any)?.details,
          battleId,
          currentUser: this.auth?.currentUser?.uid,
          authState: {
            isAuthenticated: !!this.auth?.currentUser,
            uid: this.auth?.currentUser?.uid,
            email: this.auth?.currentUser?.email
          }
        });
        throw fetchError;
      }
      
      if (battleSnap.exists()) {
        const battleData = battleSnap.data();
        console.log('📊 Battle data:', {
          hostId: battleData.hostId,
          guestId: battleData.guestId,
          status: battleData.status
        });
        console.log('🔍 User is host:', battleData.hostId === currentUserId);
        console.log('🔍 User is guest:', battleData.guestId === currentUserId);
        
        if (battleData.hostId === currentUserId) {
          // Only host can delete the battle
          console.log('🗑️ Step 4: Host leaving - attempting to delete battle');
          await this.deleteBattle(battleId);
          console.log('✅ Successfully left battle (host deleted):', battleId);
        } else {
          // Non-host just logs out, doesn't delete battle
          console.log('👋 Step 4: Non-host leaving - not deleting battle');
          console.log('✅ Successfully left battle (non-host):', battleId);
        }
      } else {
        console.log('✅ Battle already deleted:', battleId);
      }
    } catch (error) {
      console.error('❌ Error leaving battle:', error);
      
      // More comprehensive error analysis
      const errorInfo = {
        battleId,
        userId,
        currentUser: currentUserId,
        timestamp: new Date().toISOString(),
        authState: {
          isAuthenticated: !!this.auth?.currentUser,
          uid: this.auth?.currentUser?.uid,
          email: this.auth?.currentUser?.email,
          emailVerified: this.auth?.currentUser?.emailVerified
        },
        errorType: 'unknown' as string,
        errorMessage: '',
        errorCode: '',
        errorStack: '',
        errorName: '',
        firebaseError: undefined as any,
        errorProperties: [] as string[],
        enumerableProperties: [] as string[],
        firebaseSpecific: undefined as any
      };
      
      // Try to extract error information in multiple ways
      if (error === null || error === undefined) {
        errorInfo.errorType = 'null/undefined';
        errorInfo.errorMessage = 'Error is null or undefined';
      } else if (typeof error === 'string') {
        errorInfo.errorType = 'string';
        errorInfo.errorMessage = error;
      } else if (typeof error === 'object') {
        errorInfo.errorType = error?.constructor?.name || 'Object';
        errorInfo.errorMessage = (error as any)?.message || String(error);
        errorInfo.errorCode = (error as any)?.code;
        errorInfo.errorStack = (error as any)?.stack;
        errorInfo.errorName = (error as any)?.name;
        
        // Firebase-specific error properties
        if ((error as any)?.code) {
          errorInfo.firebaseError = {
            code: (error as any).code,
            message: (error as any).message,
            customData: (error as any).customData,
            details: (error as any).details,
            stack: (error as any).stack
          };
        }
        
        // Try to get all enumerable properties
        try {
          errorInfo.errorProperties = Object.getOwnPropertyNames(error);
          errorInfo.enumerableProperties = Object.keys(error);
        } catch (e) {
          errorInfo.errorProperties = ['Could not enumerate properties'];
          errorInfo.enumerableProperties = ['Could not get enumerable properties'];
        }
        
        // Try to access common Firebase error properties
        try {
          errorInfo.firebaseSpecific = {
            code: (error as any)?.code,
            message: (error as any)?.message,
            serverResponse: (error as any)?.serverResponse,
            customData: (error as any)?.customData,
            details: (error as any)?.details
          };
        } catch (e) {
          errorInfo.firebaseSpecific = 'Could not access Firebase properties';
        }
      } else {
        errorInfo.errorType = typeof error;
        errorInfo.errorMessage = String(error);
      }
      
      console.error('❌ Error details:', errorInfo);
      
      // Additional debugging for completely empty objects
      if (error && typeof error === 'object' && Object.keys(error).length === 0) {
        console.error('❌ Empty error object detected - possible serialization issue');
        console.error('❌ Error prototype chain:', {
          constructor: error.constructor?.name,
          prototype: Object.getPrototypeOf(error)?.constructor?.name,
          hasOwnProperty: error.hasOwnProperty?.toString(),
          toString: error.toString?.toString()
        });
        
        // Try to access the error as if it's a Firebase error
        console.error('❌ Attempting Firebase error property access:', {
          'error.code': (error as any)?.code,
          'error.message': (error as any)?.message,
          'error.details': (error as any)?.details,
          'error.customData': (error as any)?.customData,
          'error.serverResponse': (error as any)?.serverResponse,
          'error.toJSON': (error as any)?.toJSON?.()
        });
      }
      
      // Don't throw error for leave operations to avoid breaking navigation
      console.log('⚠️ Continuing despite leave error');
    }
  }

  // Recover corrupted battle by recreating it with proper data
  async recoverBattle(battleId: string, roomId: string, hostId: string, hostName: string, hostTeam: unknown, guestId: string, guestName: string, guestTeam: unknown): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');
    this.ensureAuthenticated();
    
    console.log('🔧 Attempting to recover corrupted battle:', battleId);
    
    const currentUserId = this.getCurrentUserId();
    if (currentUserId !== hostId) {
      throw new Error('Only the battle host can recover a corrupted battle');
    }
    
    const battleRef = doc(db, this.battlesCollection, battleId);
    
    // Delete the corrupted battle
    try {
      await deleteDoc(battleRef);
      console.log('🗑️ Deleted corrupted battle document');
    } catch (error) {
      console.error('❌ Failed to delete corrupted battle:', error);
      throw error;
    }
    
    // Recreate the battle with proper data
    try {
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
        battleData: null,
        status: 'waiting' as const,
        phase: 'choice' as const,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Create a new document with the same ID
      await setDoc(battleRef, battleData);
      console.log('✅ Successfully recovered battle with proper data structure');
    } catch (error) {
      console.error('❌ Failed to recreate battle:', error);
      throw error;
    }
  }

  // Delete battle
  async deleteBattle(battleId: string): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');
    this.ensureAuthenticated();
    
    console.log('🗑️ Deleting battle:', battleId);
    const currentUserId = this.getCurrentUserId();
    console.log('🔑 Current user UID:', currentUserId);
    
    const battleRef = doc(db, this.battlesCollection, battleId);
    
    // First check if the user has permission to delete this battle
    console.log('🔍 Step 1: Checking battle permissions before deletion');
    const battleSnap = await getDoc(battleRef);
    
    if (!battleSnap.exists()) {
      console.log('⚠️ Battle document does not exist, skipping deletion');
      return;
    }
    
    const battleData = battleSnap.data();
    console.log('📊 Battle data for deletion check:', {
      hostId: battleData.hostId,
      guestId: battleData.guestId,
      status: battleData.status,
      hasHostId: !!battleData.hostId,
      hostIdType: typeof battleData.hostId
    });
    
    const isHost = battleData.hostId === currentUserId;
    console.log('🔍 User is host (can delete):', isHost);
    console.log('🔍 Permission check details:', {
      currentUserId,
      battleHostId: battleData.hostId,
      areEqual: battleData.hostId === currentUserId,
      currentUserType: typeof currentUserId,
      battleHostIdType: typeof battleData.hostId
    });
    
    if (!isHost) {
      throw new Error(`User ${currentUserId} is not the host (${battleData.hostId}) and cannot delete battle ${battleId}`);
    }
    
    console.log('🔍 Step 2: Attempting to delete battle document');
    console.log('🔍 Firebase context for deletion:', {
      auth: {
        uid: currentUserId,
        email: this.auth?.currentUser?.email,
        emailVerified: this.auth?.currentUser?.emailVerified
      },
      documentPath: `${this.battlesCollection}/${battleId}`,
      documentData: {
        hostId: battleData.hostId,
        status: battleData.status
      }
    });
    
    // Re-fetch the document right before deletion to ensure we have the latest state
    console.log('🔍 Step 2.1: Re-fetching document before deletion');
    let finalBattleSnap;
    try {
      finalBattleSnap = await getDoc(battleRef);
      if (finalBattleSnap.exists()) {
        const finalBattleData = finalBattleSnap.data();
        console.log('🔍 Final document state before deletion:', {
          exists: finalBattleSnap.exists(),
          hostId: finalBattleData.hostId,
          guestId: finalBattleData.guestId,
          status: finalBattleData.status,
          currentUserMatchesHost: finalBattleData.hostId === currentUserId,
          documentId: finalBattleSnap.id,
          hostIdType: typeof finalBattleData.hostId,
          hostIdValue: finalBattleData.hostId,
          currentUserIdValue: currentUserId,
          areEqual: finalBattleData.hostId === currentUserId,
          documentKeys: Object.keys(finalBattleData),
          fullDocumentData: finalBattleData
        });
      } else {
        console.log('⚠️ Document no longer exists before deletion attempt');
        return;
      }
    } catch (fetchError) {
      console.error('❌ Error fetching document before deletion:', fetchError);
      throw fetchError;
    }
    
    // Verify authentication state one more time before deletion
    console.log('🔍 Step 2.2: Final authentication verification');
    const finalAuthState = {
      currentUser: this.auth?.currentUser?.uid,
      email: this.auth?.currentUser?.email,
      emailVerified: this.auth?.currentUser?.emailVerified,
      tokenValid: false
    };
    
    try {
      if (this.auth?.currentUser) {
        const token = await this.auth.currentUser.getIdToken();
        finalAuthState.tokenValid = !!token;
        console.log('🔍 Auth token check result:', { tokenLength: token?.length });
      }
    } catch (tokenError) {
      console.error('❌ Token validation failed:', tokenError);
      finalAuthState.tokenValid = false;
    }
    
    console.log('🔍 Final auth state before deletion:', finalAuthState);
    
    try {
      console.log('🔍 About to call deleteDoc with:', {
        documentPath: `${this.battlesCollection}/${battleId}`,
        auth: {
          uid: this.auth?.currentUser?.uid,
          email: this.auth?.currentUser?.email
        },
        documentExists: finalBattleSnap?.exists(),
        documentData: finalBattleSnap?.exists() ? finalBattleSnap.data() : null
      });
      
      await deleteDoc(battleRef);
      console.log('✅ Battle deleted successfully:', battleId);
    } catch (deleteError) {
      console.error('❌ Firebase deleteDoc error:', deleteError);
      
      // More robust error details extraction
      const errorDetails = {
        battleId,
        currentUser: currentUserId,
        battleHostId: battleData.hostId,
        isHost: battleData.hostId === currentUserId,
        finalAuthState,
        finalDocumentState: finalBattleSnap?.exists() ? {
          hostId: finalBattleSnap.data()?.hostId,
          guestId: finalBattleSnap.data()?.guestId,
          status: finalBattleSnap.data()?.status
        } : 'Document does not exist',
        timestamp: new Date().toISOString(),
        errorType: '',
        errorMessage: '',
        errorCode: '',
        errorDetails: undefined as any,
        errorCustomData: undefined as any,
        errorStack: '',
        errorName: '',
        errorProperties: [] as string[],
        enumerableProperties: [] as string[],
        firebaseError: undefined as any
      };
      
      // Try to extract error information in multiple ways
      if (deleteError === null || deleteError === undefined) {
        errorDetails.errorType = 'null/undefined';
        errorDetails.errorMessage = 'Error is null or undefined';
      } else if (typeof deleteError === 'string') {
        errorDetails.errorType = 'string';
        errorDetails.errorMessage = deleteError;
      } else if (typeof deleteError === 'object') {
        errorDetails.errorType = deleteError?.constructor?.name || 'Object';
        errorDetails.errorMessage = (deleteError as any)?.message || String(deleteError);
        errorDetails.errorCode = (deleteError as any)?.code;
        errorDetails.errorDetails = (deleteError as any)?.details;
        errorDetails.errorCustomData = (deleteError as any)?.customData;
        errorDetails.errorStack = (deleteError as any)?.stack;
        errorDetails.errorName = (deleteError as any)?.name;
        
        // Try to get all enumerable properties
        try {
          errorDetails.errorProperties = Object.getOwnPropertyNames(deleteError);
          errorDetails.enumerableProperties = Object.keys(deleteError);
        } catch (e) {
          errorDetails.errorProperties = ['Could not enumerate properties'];
          errorDetails.enumerableProperties = ['Could not get enumerable properties'];
        }
        
        // Firebase-specific error properties
        if ((deleteError as any)?.code) {
          errorDetails.firebaseError = {
            code: (deleteError as any).code,
            message: (deleteError as any).message,
            customData: (deleteError as any).customData,
            details: (deleteError as any).details,
            stack: (deleteError as any).stack
          };
        }
      } else {
        errorDetails.errorType = typeof deleteError;
        errorDetails.errorMessage = String(deleteError);
      }
      
      console.error('❌ Delete error details:', errorDetails);
      
      // Additional debugging for completely empty objects
      if (deleteError && typeof deleteError === 'object' && Object.keys(deleteError).length === 0) {
        console.error('❌ Empty error object detected - possible serialization issue');
        console.error('❌ Error prototype chain:', {
          constructor: deleteError.constructor?.name,
          prototype: Object.getPrototypeOf(deleteError)?.constructor?.name,
          hasOwnProperty: deleteError.hasOwnProperty?.toString(),
          toString: deleteError.toString?.toString()
        });
        
        // Try to access the error as if it's a Firebase error
        console.error('❌ Attempting Firebase error property access:', {
          'error.code': (deleteError as any)?.code,
          'error.message': (deleteError as any)?.message,
          'error.details': (deleteError as any)?.details,
          'error.customData': (deleteError as any)?.customData,
          'error.serverResponse': (deleteError as any)?.serverResponse,
          'error.toJSON': (deleteError as any)?.toJSON?.()
        });
      }
      
      throw deleteError;
    }
  }
}

export const battleService = new BattleService();
