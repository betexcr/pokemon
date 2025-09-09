/**
 * Firebase Test Utilities
 * 
 * Helper functions for testing Firebase services in integration tests
 */

import { 
  initializeApp, 
  getApps, 
  FirebaseApp 
} from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  User,
  Auth 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  addDoc,
  updateDoc,
  onSnapshot,
  Unsubscribe,
  Firestore 
} from 'firebase/firestore';

export interface TestUser {
  email: string;
  password: string;
  displayName: string;
  uid?: string;
}

export interface TestTeam {
  name: string;
  slots: Array<{
    id: number | null;
    level: number;
    moves: number[];
  }>;
}

export interface TestRoom {
  id: string;
  hostId: string;
  hostName: string;
  guestId?: string;
  guestName?: string;
  status: 'waiting' | 'ready' | 'battling' | 'finished';
  hostTeam?: TestTeam;
  guestTeam?: TestTeam;
}

export interface TestBattle {
  id: string;
  roomId: string;
  hostId: string;
  guestId: string;
  status: 'waiting' | 'active' | 'completed';
  currentTurn: 'host' | 'guest';
  moves: Array<{
    playerId: string;
    moveIndex: number;
    timestamp: any;
  }>;
}

export class FirebaseTestUtils {
  private app: FirebaseApp;
  private auth: Auth;
  private db: Firestore;
  private currentUser: User | null = null;

  constructor() {
    // Initialize Firebase app
    if (!getApps().length) {
      this.app = initializeApp({
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      });
    } else {
      this.app = getApps()[0];
    }
    
    this.auth = getAuth(this.app);
    this.db = getFirestore(this.app);
  }

  /**
   * Sign in a test user
   */
  async signInUser(user: TestUser): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(
      this.auth, 
      user.email, 
      user.password
    );
    this.currentUser = userCredential.user;
    return this.currentUser;
  }

  /**
   * Sign out current user
   */
  async signOutUser(): Promise<void> {
    await signOut(this.auth);
    this.currentUser = null;
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Create a test team for a user
   */
  async createTestTeam(userId: string, team: TestTeam): Promise<string> {
    const docRef = await addDoc(collection(this.db, 'user_teams'), {
      userId,
      ...team,
      createdAt: new Date(),
      isTestTeam: true
    });
    return docRef.id;
  }

  /**
   * Get user's teams
   */
  async getUserTeams(userId: string): Promise<TestTeam[]> {
    const teamsQuery = query(
      collection(this.db, 'user_teams'),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(teamsQuery);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as TestTeam & { id: string }));
  }

  /**
   * Create a test battle room
   */
  async createTestRoom(hostId: string, hostName: string, hostTeam?: TestTeam): Promise<string> {
    const roomData = {
      hostId,
      hostName,
      hostTeam,
      hostReady: false,
      status: 'waiting',
      createdAt: new Date(),
      maxPlayers: 2,
      currentPlayers: 1,
      activeUsers: [hostId],
      isTestRoom: true
    };

    const docRef = await addDoc(collection(this.db, 'battle_rooms'), roomData);
    return docRef.id;
  }

  /**
   * Join a test room
   */
  async joinTestRoom(roomId: string, guestId: string, guestName: string, guestTeam?: TestTeam): Promise<void> {
    const roomRef = doc(this.db, 'battle_rooms', roomId);
    
    await updateDoc(roomRef, {
      guestId,
      guestName,
      guestTeam,
      guestReady: false,
      currentPlayers: 2,
      status: 'ready',
      isTestRoom: true
    });
  }

  /**
   * Get room data
   */
  async getRoom(roomId: string): Promise<TestRoom | null> {
    const roomRef = doc(this.db, 'battle_rooms', roomId);
    const roomSnap = await getDoc(roomRef);
    
    if (roomSnap.exists()) {
      return {
        id: roomSnap.id,
        ...roomSnap.data()
      } as TestRoom;
    }
    
    return null;
  }

  /**
   * Listen to room changes
   */
  onRoomChange(roomId: string, callback: (room: TestRoom | null) => void): Unsubscribe {
    const roomRef = doc(this.db, 'battle_rooms', roomId);
    
    return onSnapshot(roomRef, (doc) => {
      if (doc.exists()) {
        const room: TestRoom = {
          id: doc.id,
          ...doc.data()
        } as TestRoom;
        callback(room);
      } else {
        callback(null);
      }
    });
  }

  /**
   * Create a test battle
   */
  async createTestBattle(
    roomId: string, 
    hostId: string, 
    hostName: string, 
    hostTeam: TestTeam,
    guestId: string, 
    guestName: string, 
    guestTeam: TestTeam
  ): Promise<string> {
    const battleData = {
      roomId,
      hostId,
      hostName,
      hostTeam,
      guestId,
      guestName,
      guestTeam,
      currentTurn: 'host',
      turnNumber: 1,
      moves: [],
      status: 'waiting',
      createdAt: new Date(),
      isTestBattle: true
    };

    const docRef = await addDoc(collection(this.db, 'battles'), battleData);
    return docRef.id;
  }

  /**
   * Get battle data
   */
  async getBattle(battleId: string): Promise<TestBattle | null> {
    const battleRef = doc(this.db, 'battles', battleId);
    const battleSnap = await getDoc(battleRef);
    
    if (battleSnap.exists()) {
      return {
        id: battleSnap.id,
        ...battleSnap.data()
      } as TestBattle;
    }
    
    return null;
  }

  /**
   * Add a move to a battle
   */
  async addBattleMove(battleId: string, playerId: string, moveIndex: number): Promise<void> {
    const battleRef = doc(this.db, 'battles', battleId);
    const battleSnap = await getDoc(battleRef);
    
    if (!battleSnap.exists()) {
      throw new Error('Battle not found');
    }
    
    const battleData = battleSnap.data();
    const newMove = {
      playerId,
      moveIndex,
      timestamp: new Date()
    };
    
    const updatedMoves = [...(battleData.moves || []), newMove];
    const nextTurn = battleData.currentTurn === 'host' ? 'guest' : 'host';
    const nextTurnNumber = battleData.turnNumber + 1;
    
    await updateDoc(battleRef, {
      moves: updatedMoves,
      currentTurn: nextTurn,
      turnNumber: nextTurnNumber
    });
  }

  /**
   * Clean up all test data
   */
  async cleanupTestData(): Promise<void> {
    console.log('🧹 Cleaning up test data...');
    
    // Clean up test rooms
    const roomsQuery = query(
      collection(this.db, 'battle_rooms'),
      where('isTestRoom', '==', true)
    );
    const roomsSnapshot = await getDocs(roomsQuery);
    
    const roomCleanupPromises = roomsSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(roomCleanupPromises);
    
    // Clean up test battles
    const battlesQuery = query(
      collection(this.db, 'battles'),
      where('isTestBattle', '==', true)
    );
    const battlesSnapshot = await getDocs(battlesQuery);
    
    const battleCleanupPromises = battlesSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(battleCleanupPromises);
    
    // Clean up test teams
    const teamsQuery = query(
      collection(this.db, 'user_teams'),
      where('isTestTeam', '==', true)
    );
    const teamsSnapshot = await getDocs(teamsQuery);
    
    const teamCleanupPromises = teamsSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(teamCleanupPromises);
    
    console.log('✅ Test data cleanup completed');
  }

  /**
   * Wait for a condition to be true
   */
  async waitForCondition(
    condition: () => Promise<boolean>, 
    timeout: number = 10000,
    interval: number = 100
  ): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error(`Condition not met within ${timeout}ms`);
  }

  /**
   * Wait for room status to change
   */
  async waitForRoomStatus(roomId: string, expectedStatus: string, timeout: number = 10000): Promise<void> {
    await this.waitForCondition(async () => {
      const room = await this.getRoom(roomId);
      return room?.status === expectedStatus;
    }, timeout);
  }

  /**
   * Wait for battle status to change
   */
  async waitForBattleStatus(battleId: string, expectedStatus: string, timeout: number = 10000): Promise<void> {
    await this.waitForCondition(async () => {
      const battle = await this.getBattle(battleId);
      return battle?.status === expectedStatus;
    }, timeout);
  }

  /**
   * Generate test data
   */
  generateTestData() {
    return {
      users: {
        host: {
          email: 'test-host@pokemon-battles.test',
          password: 'TestHost123!',
          displayName: 'Test Host Trainer'
        },
        guest: {
          email: 'test-guest@pokemon-battles.test',
          password: 'TestGuest123!',
          displayName: 'Test Guest Trainer'
        }
      },
      teams: {
        host: {
          name: 'Host Test Team',
          slots: [
            { id: 25, level: 50, moves: [33, 45, 85, 98] }, // Pikachu
            { id: 6, level: 50, moves: [17, 35, 43, 52] },  // Charizard
            { id: 9, level: 50, moves: [55, 56, 57, 58] },  // Blastoise
            { id: null, level: 1, moves: [] },
            { id: null, level: 1, moves: [] },
            { id: null, level: 1, moves: [] }
          ]
        },
        guest: {
          name: 'Guest Test Team',
          slots: [
            { id: 150, level: 50, moves: [105, 106, 107, 108] }, // Mewtwo
            { id: 144, level: 50, moves: [64, 65, 66, 67] },     // Articuno
            { id: 145, level: 50, moves: [85, 86, 87, 88] },     // Zapdos
            { id: null, level: 1, moves: [] },
            { id: null, level: 1, moves: [] },
            { id: null, level: 1, moves: [] }
          ]
        }
      }
    };
  }
}

// Export singleton instance
export const firebaseTestUtils = new FirebaseTestUtils();
