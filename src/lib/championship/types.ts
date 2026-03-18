import type { TeamSlot } from '@/lib/userTeams';
import type { Timestamp } from 'firebase/firestore';

export type ChampionshipSize = 4 | 8 | 16 | 32;
export type SeatMode = 'pick' | 'random';
export type ChampionshipStatus = 'open' | 'seeding' | 'in_progress' | 'completed' | 'cancelled';
export type MatchStatus = 'pending' | 'ready' | 'in_progress' | 'completed';

export interface ChampionshipParticipant {
  uid: string;
  name: string;
  photoURL?: string;
  teamId?: string;
  team?: TeamSlot[];
  seed: number;
  eliminatedInRound?: number;
}

export interface ChampionshipMatch {
  id: string;
  round: number;
  position: number;
  player1Uid?: string;
  player2Uid?: string;
  player1Seed?: number;
  player2Seed?: number;
  winnerUid?: string;
  roomId?: string;
  battleId?: string;
  status: MatchStatus;
}

export interface Championship {
  id: string;
  name: string;
  hostUid: string;
  hostName: string;
  size: ChampionshipSize;
  seatMode: SeatMode;
  status: ChampionshipStatus;
  participants: ChampionshipParticipant[];
  bracket: ChampionshipMatch[];
  currentRound: number;
  totalRounds: number;
  winnerUid?: string;
  winnerName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChampionshipDocument {
  name: string;
  hostUid: string;
  hostName: string;
  size: ChampionshipSize;
  seatMode: SeatMode;
  status: ChampionshipStatus;
  participants: ChampionshipParticipant[];
  bracket: ChampionshipMatch[];
  currentRound: number;
  totalRounds: number;
  winnerUid?: string;
  winnerName?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
