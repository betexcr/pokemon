import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  runTransaction,
  type Unsubscribe,
} from 'firebase/firestore';
import { getDb as getClientDb, hasFirebaseClientConfig } from './firebase/client';
import {
  generateBracket,
  seedBracket,
  advanceWinner as advanceBracketWinner,
  isRoundComplete,
  getTotalRounds,
} from './championship/bracket';
import type {
  Championship,
  ChampionshipDocument,
  ChampionshipSize,
  SeatMode,
  ChampionshipParticipant,
  ChampionshipMatch,
} from './championship/types';
import type { TeamSlot } from './userTeams';

function docToChampionship(id: string, data: ChampionshipDocument): Championship {
  return {
    ...data,
    id,
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
    updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
  };
}

class ChampionshipService {
  private collectionName = 'championships';

  private getDb() {
    try {
      const db = getClientDb();
      if (!db) throw new Error('Firestore not available');
      return db;
    } catch (error) {
      const message = hasFirebaseClientConfig
        ? (error instanceof Error ? error.message : 'Failed to initialize Firestore client')
        : 'Firestore configuration missing';
      throw new Error(message);
    }
  }

  async createChampionship(
    hostUid: string,
    hostName: string,
    name: string,
    size: ChampionshipSize,
    seatMode: SeatMode,
    hostPhotoURL?: string
  ): Promise<string> {
    const db = this.getDb();
    const totalRounds = getTotalRounds(size);

    const hostParticipant: ChampionshipParticipant = {
      uid: hostUid,
      name: hostName,
      photoURL: hostPhotoURL,
      seed: 1,
    };

    const docData = {
      name,
      hostUid,
      hostName,
      size,
      seatMode,
      status: 'open' as const,
      participants: [hostParticipant],
      bracket: [],
      currentRound: 0,
      totalRounds,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, this.collectionName), docData);
    return docRef.id;
  }

  async getChampionship(id: string): Promise<Championship | null> {
    const db = this.getDb();
    const snap = await getDoc(doc(db, this.collectionName, id));
    if (!snap.exists()) return null;
    return docToChampionship(snap.id, snap.data() as ChampionshipDocument);
  }

  async joinChampionship(
    id: string,
    uid: string,
    name: string,
    photoURL?: string,
    teamId?: string,
    team?: TeamSlot[]
  ): Promise<void> {
    const db = this.getDb();
    const ref = doc(db, this.collectionName, id);

    await runTransaction(db, async (txn) => {
      const snap = await txn.get(ref);
      if (!snap.exists()) throw new Error('Championship not found');

      const data = snap.data() as ChampionshipDocument;
      if (data.status !== 'open') throw new Error('Championship is not open for joining');
      if (data.participants.length >= data.size) throw new Error('Championship is full');
      if (data.participants.some((p) => p.uid === uid)) throw new Error('Already joined');

      const takenSeeds = new Set(data.participants.map((p) => p.seed));
      let nextSeed = 1;
      while (takenSeeds.has(nextSeed)) nextSeed++;

      const participant: ChampionshipParticipant = {
        uid,
        name,
        photoURL,
        teamId,
        team,
        seed: nextSeed,
      };

      txn.update(ref, {
        participants: [...data.participants, participant],
        updatedAt: serverTimestamp(),
      });
    });
  }

  async leaveChampionship(id: string, uid: string): Promise<void> {
    const db = this.getDb();
    const ref = doc(db, this.collectionName, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Championship not found');

    const data = snap.data() as ChampionshipDocument;
    if (data.status !== 'open' && data.status !== 'seeding') {
      throw new Error('Cannot leave an in-progress championship');
    }
    if (data.hostUid === uid) throw new Error('Host cannot leave. Delete the championship instead.');

    await updateDoc(ref, {
      participants: data.participants.filter((p) => p.uid !== uid),
      updatedAt: serverTimestamp(),
    });
  }

  async pickSeat(id: string, uid: string, seed: number): Promise<void> {
    const db = this.getDb();
    const ref = doc(db, this.collectionName, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Championship not found');

    const data = snap.data() as ChampionshipDocument;
    if (data.seatMode !== 'pick') throw new Error('Seat picking is not enabled');
    if (data.status !== 'open' && data.status !== 'seeding') {
      throw new Error('Cannot pick seats right now');
    }
    if (seed < 1 || seed > data.size) throw new Error('Invalid seed number');

    const seatTaken = data.participants.some((p) => p.uid !== uid && p.seed === seed);
    if (seatTaken) throw new Error('That seat is already taken');

    const participants = data.participants.map((p) =>
      p.uid === uid ? { ...p, seed } : p
    );

    await updateDoc(ref, { participants, updatedAt: serverTimestamp() });
  }

  async updateParticipantTeam(
    id: string,
    uid: string,
    teamId: string,
    team: TeamSlot[]
  ): Promise<void> {
    const db = this.getDb();
    const ref = doc(db, this.collectionName, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Championship not found');

    const data = snap.data() as ChampionshipDocument;
    const participants = data.participants.map((p) =>
      p.uid === uid ? { ...p, teamId, team } : p
    );

    await updateDoc(ref, { participants, updatedAt: serverTimestamp() });
  }

  async randomizeSeeds(id: string, hostUid: string): Promise<void> {
    const db = this.getDb();
    const ref = doc(db, this.collectionName, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Championship not found');

    const data = snap.data() as ChampionshipDocument;
    if (data.hostUid !== hostUid) throw new Error('Only the host can randomize seeds');

    const shuffled = [...data.participants];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const participants = shuffled.map((p, idx) => ({ ...p, seed: idx + 1 }));
    await updateDoc(ref, { participants, updatedAt: serverTimestamp() });
  }

  async startChampionship(id: string, hostUid: string): Promise<void> {
    const db = this.getDb();
    const ref = doc(db, this.collectionName, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Championship not found');

    const data = snap.data() as ChampionshipDocument;
    if (data.hostUid !== hostUid) throw new Error('Only the host can start');
    if (data.participants.length !== data.size) {
      throw new Error(`Need exactly ${data.size} participants to start (have ${data.participants.length})`);
    }

    let bracket = generateBracket(data.size);
    bracket = seedBracket(bracket, data.participants);

    await updateDoc(ref, {
      bracket,
      status: 'in_progress',
      currentRound: 1,
      updatedAt: serverTimestamp(),
    });
  }

  async setMatchRoom(
    championshipId: string,
    matchId: string,
    roomId: string
  ): Promise<void> {
    const db = this.getDb();
    const ref = doc(db, this.collectionName, championshipId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Championship not found');

    const data = snap.data() as ChampionshipDocument;
    const bracket = data.bracket.map((m: ChampionshipMatch) =>
      m.id === matchId ? { ...m, roomId, status: 'in_progress' as const } : m
    );

    await updateDoc(ref, { bracket, updatedAt: serverTimestamp() });
  }

  async advanceWinner(
    championshipId: string,
    matchId: string,
    winnerUid: string
  ): Promise<void> {
    const db = this.getDb();
    const ref = doc(db, this.collectionName, championshipId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Championship not found');

    const data = snap.data() as ChampionshipDocument;
    const match = data.bracket.find((m: ChampionshipMatch) => m.id === matchId);
    if (!match) throw new Error('Match not found');

    const winnerParticipant = data.participants.find((p) => p.uid === winnerUid);
    const winnerSeed = winnerParticipant?.seed;

    let bracket = advanceBracketWinner(data.bracket, matchId, winnerUid, winnerSeed);

    const loserUid = match.player1Uid === winnerUid ? match.player2Uid : match.player1Uid;
    const participants = data.participants.map((p) =>
      p.uid === loserUid ? { ...p, eliminatedInRound: match.round } : p
    );

    const update: Record<string, unknown> = {
      bracket,
      participants,
      updatedAt: serverTimestamp(),
    };

    const roundDone = isRoundComplete(bracket, data.currentRound);
    if (roundDone) {
      const nextRound = data.currentRound + 1;
      if (nextRound > data.totalRounds) {
        update.status = 'completed';
        update.winnerUid = winnerUid;
        update.winnerName = winnerParticipant?.name ?? 'Unknown';
      } else {
        update.currentRound = nextRound;
      }
    }

    await updateDoc(ref, update);
  }

  onChampionshipChange(id: string, callback: (c: Championship | null) => void): Unsubscribe {
    const db = this.getDb();
    return onSnapshot(doc(db, this.collectionName, id), (snap) => {
      if (!snap.exists()) {
        callback(null);
        return;
      }
      callback(docToChampionship(snap.id, snap.data() as ChampionshipDocument));
    });
  }

  async getOpenChampionships(): Promise<Championship[]> {
    const db = this.getDb();

    try {
      const q = query(
        collection(db, this.collectionName),
        where('status', 'in', ['open', 'seeding']),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) =>
        docToChampionship(d.id, d.data() as ChampionshipDocument)
      );
    } catch {
      // Composite index may not exist yet; fall back to unordered query
      const q = query(
        collection(db, this.collectionName),
        where('status', 'in', ['open', 'seeding'])
      );
      const snap = await getDocs(q);
      return snap.docs
        .map((d) => docToChampionship(d.id, d.data() as ChampionshipDocument))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
  }

  async getUserChampionships(uid: string): Promise<Championship[]> {
    const db = this.getDb();

    // Firestore can't do array-contains on arrays of objects;
    // fetch all active championships and filter client-side
    try {
      const q = query(
        collection(db, this.collectionName),
        where('status', 'in', ['open', 'seeding', 'in_progress']),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs
        .map((d) => docToChampionship(d.id, d.data() as ChampionshipDocument))
        .filter((c) => c.participants.some((p) => p.uid === uid));
    } catch {
      // Composite index may not exist yet; fall back to unordered query
      const q = query(
        collection(db, this.collectionName),
        where('status', 'in', ['open', 'seeding', 'in_progress'])
      );
      const snap = await getDocs(q);
      return snap.docs
        .map((d) => docToChampionship(d.id, d.data() as ChampionshipDocument))
        .filter((c) => c.participants.some((p) => p.uid === uid))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
  }

  async forfeitMatch(
    championshipId: string,
    matchId: string,
    loserUid: string,
    hostUid: string
  ): Promise<void> {
    const db = this.getDb();
    const ref = doc(db, this.collectionName, championshipId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Championship not found');

    const data = snap.data() as ChampionshipDocument;
    if (data.hostUid !== hostUid) throw new Error('Only the host can forfeit a match');
    if (data.status !== 'in_progress') throw new Error('Championship is not in progress');

    const match = data.bracket.find((m: ChampionshipMatch) => m.id === matchId);
    if (!match) throw new Error('Match not found');
    if (match.status === 'completed') throw new Error('Match already completed');
    if (!match.player1Uid || !match.player2Uid) throw new Error('Match does not have both players');
    if (loserUid !== match.player1Uid && loserUid !== match.player2Uid) {
      throw new Error('Specified player is not in this match');
    }

    const winnerUid = match.player1Uid === loserUid ? match.player2Uid : match.player1Uid;
    await this.advanceWinner(championshipId, matchId, winnerUid);
  }

  async cancelChampionship(id: string, hostUid: string): Promise<void> {
    const db = this.getDb();
    const ref = doc(db, this.collectionName, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Championship not found');

    const data = snap.data() as ChampionshipDocument;
    if (data.hostUid !== hostUid) throw new Error('Only the host can cancel');
    if (data.status === 'completed') throw new Error('Championship already completed');

    await updateDoc(ref, { status: 'cancelled', updatedAt: serverTimestamp() });
  }

  async deleteChampionship(id: string, hostUid: string): Promise<void> {
    const db = this.getDb();
    const ref = doc(db, this.collectionName, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Championship not found');

    const data = snap.data() as ChampionshipDocument;
    if (data.hostUid !== hostUid) throw new Error('Only the host can delete');
    if (data.status === 'in_progress') throw new Error('Cancel the championship before deleting');

    const { deleteDoc: firestoreDeleteDoc } = await import('firebase/firestore');
    await firestoreDeleteDoc(ref);
  }
}

export const championshipService = new ChampionshipService();
