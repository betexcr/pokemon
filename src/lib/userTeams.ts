import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Timestamp,
  FirestoreError
} from 'firebase/firestore'
import { DEFAULT_NATURE, NatureName } from '@/data/natures'
import { getDb as getClientDb, hasFirebaseClientConfig } from './firebase/client'
import { firebaseErrorLogger } from './firebaseErrorLogger'
import { reportApiError } from './errorReporting'

export interface MoveData {
  name: string;
  type: string;
  damage_class: "physical" | "special" | "status";
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  level_learned_at: number | null;
  short_effect?: string | null;
}

export interface TeamSlot {
  id: number | null;
  level: number;
  moves: MoveData[];
  nature: NatureName;
}

export type StoredTeamSlot = Omit<TeamSlot, 'nature'> & { nature?: NatureName };

export interface SavedTeam {
  id: string;
  name: string;
  slots: TeamSlot[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  isPublic?: boolean;
  description?: string;
}

export interface TeamDocument {
  name: string;
  slots: StoredTeamSlot[];
  userId: string;
  createdAt: Timestamp | Date; // Firestore timestamp
  updatedAt: Timestamp | Date; // Firestore timestamp
  isPublic?: boolean;
  description?: string;
}

function normalizeSlot(slot: StoredTeamSlot | null | undefined): TeamSlot {
  const normalized = slot || { id: null, level: 50, moves: [] };
  return {
    id: normalized.id ?? null,
    level: normalized.level ?? 50,
    moves: Array.isArray(normalized.moves) ? normalized.moves : [],
    nature: normalized.nature ?? DEFAULT_NATURE,
  };
}

// Convert Firestore document to SavedTeam
function docToSavedTeam(doc: QueryDocumentSnapshot<DocumentData>): SavedTeam {
  const data = doc.data() as TeamDocument;
  return {
    id: doc.id,
    name: data.name,
    slots: Array.isArray(data.slots) ? data.slots.map(normalizeSlot) : [],
    userId: data.userId,
    createdAt: data.createdAt instanceof Date ? data.createdAt : (data.createdAt as Timestamp)?.toDate() || new Date(),
    updatedAt: data.updatedAt instanceof Date ? data.updatedAt : (data.updatedAt as Timestamp)?.toDate() || new Date(),
    isPublic: data.isPublic || false,
    description: data.description || '',
  };
}

// Save a team to Firestore
function tryGetDb() {
  if (!hasFirebaseClientConfig) {
    return null
  }

  try {
    return getClientDb()
  } catch (error) {
    console.warn('Failed to initialize Firestore client', error)
    return null
  }
}

function ensureDb() {
  const db = tryGetDb()
  if (!db) {
    throw new Error('Firebase not configured')
  }
  return db
}

export async function saveTeamToFirebase(
  userId: string, 
  team: Omit<SavedTeam, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const db = ensureDb()

  try {
    const teamData: Omit<TeamDocument, 'createdAt' | 'updatedAt'> = {
      name: team.name,
      slots: team.slots.map(normalizeSlot),
      userId,
      isPublic: team.isPublic || false,
      description: team.description || '',
    };

    const docRef = await addDoc(collection(db, 'userTeams'), {
      ...teamData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return docRef.id
  } catch (error) {
    console.error('Error saving team to Firebase:', error)
    throw new Error('Failed to save team')
  }
}

// Update an existing team in Firestore
export async function updateTeamInFirebase(
  teamId: string,
  userId: string,
  updates: Partial<Omit<SavedTeam, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const db = ensureDb()

  try {
    const teamRef = doc(db, 'userTeams', teamId)
    
    // Verify the team belongs to the user
    const teamDoc = await getDoc(teamRef);
    if (!teamDoc.exists()) {
      throw new Error('Team not found')
    }
    
    const teamData = teamDoc.data() as TeamDocument
    if (teamData.userId !== userId) {
      throw new Error('Unauthorized: Team does not belong to user')
    }

    await updateDoc(teamRef, {
      ...updates,
      ...(updates.slots ? { slots: updates.slots.map(normalizeSlot) } : {}),
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error updating team in Firebase:', error)
    throw new Error('Failed to update team')
  }
}

// Delete a team from Firestore
export async function deleteTeamFromFirebase(
  teamId: string,
  userId: string
): Promise<void> {
  const db = ensureDb()

  try {
    const teamRef = doc(db, 'userTeams', teamId)
    
    // Verify the team belongs to the user
    const teamDoc = await getDoc(teamRef);
    if (!teamDoc.exists()) {
      throw new Error('Team not found')
    }
    
    const teamData = teamDoc.data() as TeamDocument
    if (teamData.userId !== userId) {
      throw new Error('Unauthorized: Team does not belong to user')
    }

    await deleteDoc(teamRef)
  } catch (error) {
    console.error('Error deleting team from Firebase:', error)
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('permission')) {
        throw new Error('Permission denied. Please make sure you are logged in and own this team.');
      } else if (error.message.includes('not found')) {
        throw new Error('Team not found. It may have already been deleted.');
      } else if (error.message.includes('network') || error.message.includes('timeout')) {
        throw new Error('Network error. Please check your connection and try again.');
      }
    }
    
    throw new Error('Failed to delete team. Please try again.');
  }
}

// Get all teams for a user
export async function getUserTeams(userId: string): Promise<SavedTeam[]> {
  const db = ensureDb()

  try {
    console.log('getUserTeams: Fetching teams for userId:', userId)

    const collectionRef = collection(db, 'userTeams')
    const baseQuery = query(
      collectionRef,
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    )

    try {
      const snapshot = await getDocs(baseQuery)
      console.log('getUserTeams: Query snapshot size:', snapshot.docs.length)
      return snapshot.docs.map(docToSavedTeam)
    } catch (error) {
      const firestoreError = error as FirestoreError
      console.error('Error fetching user teams from Firebase:', firestoreError)

      firebaseErrorLogger.logError(firestoreError, 'get_user_teams', {
        collection: 'userTeams',
        userId,
        query: 'where(userId == uid) orderBy(updatedAt desc)'
      })

      if (firestoreError.code === 'failed-precondition') {
        console.warn('Falling back to unordered userTeams query due to missing index or field')
        const fallbackSnapshot = await getDocs(query(collectionRef, where('userId', '==', userId)))
        return fallbackSnapshot.docs.map(docToSavedTeam)
      }

      if (firestoreError.code === 'permission-denied') {
        const friendlyMessage = 'Permission denied while loading your saved teams. Please verify Firestore security rules and ensure you are signed in.'
        reportApiError(friendlyMessage, {
          component: 'TeamSelector',
          page: 'battle-firestore',
          firebaseCode: firestoreError.code
        })
        throw new Error(friendlyMessage)
      }

      reportApiError('Error fetching user teams from Firebase', {
        component: 'TeamSelector',
        page: 'battle-firestore',
        firebaseCode: firestoreError.code
      })

      throw new Error('Failed to load your saved teams from the cloud. Please try again.')
    }
  } catch (error) {
    console.error('Error fetching user teams from Firebase:', error)
    if (error instanceof Error) {
      throw error
    }

    throw new Error('Failed to load your saved teams from the cloud. Please try again.')
  }
}

// Get a specific team by ID
export async function getTeamById(teamId: string, userId: string): Promise<SavedTeam | null> {
  const db = ensureDb()

  try {
    const teamRef = doc(db, 'userTeams', teamId)
    const teamDoc = await getDoc(teamRef)

    if (!teamDoc.exists()) {
      return null
    }

    const teamData = teamDoc.data() as TeamDocument

    // Verify the team belongs to the user (or is public)
    if (teamData.userId !== userId && !teamData.isPublic) {
      throw new Error('Unauthorized: Team does not belong to user')
    }

    return docToSavedTeam(teamDoc as QueryDocumentSnapshot<DocumentData>)
  } catch (error) {
    console.error('Error fetching team from Firebase:', error)
    throw new Error('Failed to fetch team')
  }
}

// Get public teams (for sharing/community features)
export async function getPublicTeams(limit: number = 20): Promise<SavedTeam[]> {
  const db = ensureDb()

  try {
    const publicTeamsQuery = query(
      collection(db, 'userTeams'),
      where('isPublic', '==', true),
      orderBy('updatedAt', 'desc')
    )

    const querySnapshot = await getDocs(publicTeamsQuery)
    return querySnapshot.docs.slice(0, limit).map(docToSavedTeam)
  } catch (error) {
    console.error('Error fetching public teams from Firebase:', error)
    throw new Error('Failed to fetch public teams')
  }
}

// Sync teams between localStorage and Firebase
export async function syncTeamsWithFirebase(
  userId: string,
  localTeams: SavedTeam[]
): Promise<SavedTeam[]> {
  if (!tryGetDb()) {
    // If Firebase is not configured, return local teams
    return localTeams
  }

  try {
    // Get teams from Firebase
    const firebaseTeams = await getUserTeams(userId)

    // Merge local teams with Firebase teams
    // Local teams take precedence for conflicts
    const mergedTeams = new Map<string, SavedTeam>()

    // Add Firebase teams first
    firebaseTeams.forEach(team => {
      mergedTeams.set(team.name, team)
    })

    // Add/update with local teams
    localTeams.forEach(localTeam => {
      // Check if there's a Firebase team with the same name
      const existingTeam = mergedTeams.get(localTeam.name)
      if (existingTeam) {
        // Update Firebase team with local data if local is newer
        if (localTeam.updatedAt > existingTeam.updatedAt) {
          mergedTeams.set(localTeam.name, localTeam)
        }
      } else {
        // New team, add to Firebase
        mergedTeams.set(localTeam.name, localTeam)
      }
    })

    // Save any new/updated teams to Firebase
    const teamsToSave = Array.from(mergedTeams.values())
    for (const team of teamsToSave) {
      if (!team.id || team.id.startsWith('local_')) {
        // This is a local team, save to Firebase
        try {
          const firebaseId = await saveTeamToFirebase(userId, team)
          team.id = firebaseId
        } catch (error) {
          console.error('Failed to sync team to Firebase:', error)
        }
      }
    }

    return teamsToSave
  } catch (error) {
    console.error('Error syncing teams with Firebase:', error)
    // Return local teams if sync fails
    return localTeams
  }
}
