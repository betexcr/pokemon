import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { Pokemon, Move } from '@/types/pokemon';

export interface UserTeam {
  id: string;
  name: string;
  pokemon: {
    pokemon: Pokemon;
    level: number;
    moves: Move[];
  }[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  userId: string;
}

export interface CreateTeamData {
  name: string;
  pokemon: {
    pokemon: Pokemon;
    level: number;
    moves: Move[];
  }[];
}

// Create a new team for a user
export async function createUserTeam(userId: string, teamData: CreateTeamData): Promise<string> {
  if (!db) {
    throw new Error('Firebase not configured');
  }
  try {
    const teamsRef = collection(db, 'userTeams');
    const newTeamRef = doc(teamsRef);
    
    const team: Omit<UserTeam, 'id'> = {
      ...teamData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      userId,
    };

    await setDoc(newTeamRef, team);
    return newTeamRef.id;
  } catch (error) {
    console.error('Error creating team:', error);
    throw error;
  }
}

// Get all teams for a user
export async function getUserTeams(userId: string): Promise<UserTeam[]> {
  if (!db) {
    throw new Error('Firebase not configured');
  }
  try {
    const teamsRef = collection(db, 'userTeams');
    const q = query(
      teamsRef,
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const teams: UserTeam[] = [];
    
    querySnapshot.forEach((doc) => {
      teams.push({
        id: doc.id,
        ...doc.data(),
      } as UserTeam);
    });
    
    return teams;
  } catch (error) {
    console.error('Error getting user teams:', error);
    throw error;
  }
}

// Get a specific team by ID
export async function getUserTeam(teamId: string): Promise<UserTeam | null> {
  if (!db) {
    throw new Error('Firebase not configured');
  }
  try {
    const teamRef = doc(db, 'userTeams', teamId);
    const teamSnap = await getDoc(teamRef);
    
    if (teamSnap.exists()) {
      return {
        id: teamSnap.id,
        ...teamSnap.data(),
      } as UserTeam;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting team:', error);
    throw error;
  }
}

// Update a team
export async function updateUserTeam(teamId: string, teamData: Partial<CreateTeamData>): Promise<void> {
  if (!db) {
    throw new Error('Firebase not configured');
  }
  try {
    const teamRef = doc(db, 'userTeams', teamId);
    await updateDoc(teamRef, {
      ...teamData,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating team:', error);
    throw error;
  }
}

// Delete a team
export async function deleteUserTeam(teamId: string): Promise<void> {
  if (!db) {
    throw new Error('Firebase not configured');
  }
  try {
    const teamRef = doc(db, 'userTeams', teamId);
    await deleteDoc(teamRef);
  } catch (error) {
    console.error('Error deleting team:', error);
    throw error;
  }
}

// Check if user owns a team
export async function verifyTeamOwnership(teamId: string, userId: string): Promise<boolean> {
  try {
    const team = await getUserTeam(teamId);
    return team?.userId === userId;
  } catch (error) {
    console.error('Error verifying team ownership:', error);
    return false;
  }
}
