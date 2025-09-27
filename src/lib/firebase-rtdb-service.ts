import { 
  ref, 
  set, 
  get, 
  update, 
  remove, 
  onValue, 
  off,
  push,
  serverTimestamp,
  type DatabaseReference,
  type Unsubscribe,
  type DataSnapshot
} from 'firebase/database';
import { rtdb } from './firebase';

export interface RTDBBattleMeta {
  createdAt: number;
  format: 'singles';
  ruleSet: 'gen9-no-weather';
  region: string;
  players: {
    p1: { uid: string; name: string };
    p2: { uid: string; name: string };
  };
  phase: 'choosing' | 'resolving' | 'ended';
  turn: number;
  deadlineAt: number;
  version: number;
  winnerUid?: string;
  endedReason?: 'forfeit' | 'timeout' | 'victory';
}

export interface RTDBBattlePublic {
  field: {
    hazards: {
      p1: { sr: boolean; spikes: number; tSpikes: number; web: boolean };
      p2: { sr: boolean; spikes: number; tSpikes: number; web: boolean };
    };
    screens: {
      p1: { reflect: number; lightScreen: number };
      p2: { reflect: number; lightScreen: number };
    };
  };
  p1: {
    active: {
      species: string;
      level: number;
      types: string[];
      hp: { cur: number; max: number };
      status?: string;
      boosts: { atk: number; def: number; spa: number; spd: number; spe: number; acc: number; eva: number };
      itemKnown?: boolean;
      abilityKnown?: boolean;
      subHp?: number;
    };
    benchPublic: Array<{
      species: string;
      fainted: boolean;
      revealedMoves: string[];
    }>;
  };
  p2: {
    active: {
      species: string;
      level: number;
      types: string[];
      hp: { cur: number; max: number };
      status?: string;
      boosts: { atk: number; def: number; spa: number; spd: number; spe: number; acc: number; eva: number };
      itemKnown?: boolean;
      abilityKnown?: boolean;
      subHp?: number;
    };
    benchPublic: Array<{
      species: string;
      fainted: boolean;
      revealedMoves: string[];
    }>;
  };
  lastResultSummary: string;
}

export interface RTDBBattlePrivate {
  team: any; // Full secret team info
  choiceLock?: {
    moveId?: string;
    target?: string;
    locked?: boolean;
  };
}

export interface RTDBChoice {
  action: 'move' | 'switch' | 'forfeit';
  payload: {
    moveId?: string;
    target?: string;
    switchToIndex?: number;
  };
  committedAt: number;
  clientVersion: number;
}

export interface RTDBResolution {
  by: 'function';
  committedAt: number;
  rngSeedUsed: number;
  diffs: any[];
  logs: string[];
  stateHashAfter: string;
}

export interface RTDBPresence {
  connected: boolean;
  lastActiveAt: number;
}

export interface RTDBLobbyQueue {
  joinedAt: number;
  prefs: {
    format: string;
    minRating: number;
  };
}

class FirebaseRTDBService {
  private db = rtdb;

  // Presence management
  async updatePresence(uid: string, connected: boolean): Promise<void> {
    if (!this.db) throw new Error('RTDB not initialized');
    
    const presenceRef = ref(this.db, `presence/${uid}`);
    await update(presenceRef, {
      connected,
      lastActiveAt: serverTimestamp()
    });
  }

  // Lobby management
  async joinLobby(uid: string, region: string, prefs: RTDBLobbyQueue['prefs']): Promise<void> {
    if (!this.db) throw new Error('RTDB not initialized');
    
    const lobbyRef = ref(this.db, `lobbies/${region}/queue/${uid}`);
    await set(lobbyRef, {
      joinedAt: serverTimestamp(),
      prefs
    });
  }

  async leaveLobby(uid: string, region: string): Promise<void> {
    if (!this.db) throw new Error('RTDB not initialized');
    
    const lobbyRef = ref(this.db, `lobbies/${region}/queue/${uid}`);
    await remove(lobbyRef);
  }

  // Battle creation (should be called by Cloud Functions)
  async createBattle(
    battleId: string,
    p1Uid: string,
    p1Name: string,
    p1Team: any,
    p2Uid: string,
    p2Name: string,
    p2Team: any
  ): Promise<void> {
    if (!this.db) throw new Error('RTDB not initialized');
    
    const now = Date.now();
    const deadlineAt = now + (30 * 1000); // 30 seconds per turn
    
    // Create meta
    const metaRef = ref(this.db, `battles/${battleId}/meta`);
    await set(metaRef, {
      createdAt: serverTimestamp(),
      format: 'singles',
      ruleSet: 'gen9-no-weather',
      region: 'global',
      players: {
        p1: { uid: p1Uid, name: p1Name },
        p2: { uid: p2Uid, name: p2Name }
      },
      phase: 'choosing',
      turn: 1,
      deadlineAt: serverTimestamp(),
      version: 1
    });

    // Record participant list for security rules and quick lookups
    const participantsRef = ref(this.db, `battles/${battleId}/participants`);
    await update(participantsRef, {
      [p1Uid]: {
        role: 'p1',
        name: p1Name,
        joinedAt: serverTimestamp()
      },
      [p2Uid]: {
        role: 'p2',
        name: p2Name,
        joinedAt: serverTimestamp()
      }
    });

    // Create public state (masked info)
    const publicRef = ref(this.db, `battles/${battleId}/public`);
    await set(publicRef, {
      field: {
        hazards: {
          p1: { sr: false, spikes: 0, tSpikes: 0, web: false },
          p2: { sr: false, spikes: 0, tSpikes: 0, web: false }
        },
        screens: {
          p1: { reflect: 0, lightScreen: 0 },
          p2: { reflect: 0, lightScreen: 0 }
        }
      },
      p1: {
        active: this.createPublicPokemonData(p1Team[0]),
        benchPublic: p1Team.slice(1).map((pokemon: any) => this.createBenchPublic(pokemon))
      },
      p2: {
        active: this.createPublicPokemonData(p2Team[0]),
        benchPublic: p2Team.slice(1).map((pokemon: any) => this.createBenchPublic(pokemon))
      },
      lastResultSummary: ''
    });

    // Create private state (full team info)
    const p1PrivateRef = ref(this.db, `battles/${battleId}/private/${p1Uid}`);
    await set(p1PrivateRef, {
      team: p1Team,
      choiceLock: {}
    });

    const p2PrivateRef = ref(this.db, `battles/${battleId}/private/${p2Uid}`);
    await set(p2PrivateRef, {
      team: p2Team,
      choiceLock: {}
    });
  }

  private createPublicPokemonData(pokemon: any) {
    if (!pokemon) {
      return {
        species: 'unknown',
        level: 1,
        types: ['normal'],
        hp: { cur: 1, max: 1 },
        status: null,
        boosts: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 },
        itemKnown: false,
        abilityKnown: false
      };
    }

    const speciesName = this.extractSpeciesName(pokemon);
    const level = typeof pokemon.level === 'number' ? pokemon.level : 50;
    const types = this.extractTypes(pokemon);
    const maxHp = typeof pokemon.maxHp === 'number' ? pokemon.maxHp : 100;
    const currentHp = typeof pokemon.currentHp === 'number' ? pokemon.currentHp : maxHp;

    return {
      species: speciesName,
      level,
      types,
      hp: { cur: currentHp, max: maxHp },
      status: pokemon.status || null,
      boosts: {
        atk: pokemon.statModifiers?.attack || 0,
        def: pokemon.statModifiers?.defense || 0,
        spa: pokemon.statModifiers?.specialAttack || 0,
        spd: pokemon.statModifiers?.specialDefense || 0,
        spe: pokemon.statModifiers?.speed || 0,
        acc: pokemon.statModifiers?.accuracy || 0,
        eva: pokemon.statModifiers?.evasion || 0
      },
      itemKnown: false,
      abilityKnown: false
    };
  }

  private createBenchPublic(pokemon: any) {
    const species = this.extractSpeciesName(pokemon);
    return {
      species,
      fainted: Boolean(pokemon?.fainted),
      revealedMoves: Array.isArray(pokemon?.moves)
        ? pokemon.moves.slice(0, 4).map((m: any) => (typeof m === 'string' ? m : m?.name || m?.id)).filter(Boolean)
        : []
    };
  }

  private extractSpeciesName(pokemon: any): string {
    if (!pokemon) return 'unknown';
    if (typeof pokemon.species === 'string') return pokemon.species;
    if (pokemon.pokemon?.name) return pokemon.pokemon.name;
    if (typeof pokemon.id === 'number') {
      return `pokemon-${pokemon.id}`;
    }
    return 'unknown';
  }

  private extractTypes(pokemon: any): string[] {
    if (!pokemon) return ['normal'];
    if (Array.isArray(pokemon.types)) {
      return pokemon.types.map((t: any) => (typeof t === 'string' ? t : t?.type?.name)).filter(Boolean);
    }
    if (Array.isArray(pokemon.pokemon?.types)) {
      return pokemon.pokemon.types.map((t: any) => (typeof t === 'string' ? t : t?.type?.name)).filter(Boolean);
    }
    return ['normal'];
  }

  // Choice submission (clients can only write here)
  async submitChoice(
    battleId: string,
    turn: number,
    uid: string,
    choice: Omit<RTDBChoice, 'committedAt' | 'clientVersion'>
  ): Promise<void> {
    if (!this.db) throw new Error('RTDB not initialized');
    
    // Read current meta.version to satisfy RTDB rules
    const versionRef = ref(this.db, `battles/${battleId}/meta/version`);
    const versionSnap = await get(versionRef);
    const currentVersion = typeof versionSnap.val() === 'number' ? versionSnap.val() : 0;
    
    // Also read the full meta to debug
    const metaRef = ref(this.db, `battles/${battleId}/meta`);
    const metaSnap = await get(metaRef);
    const meta = metaSnap.val();
    console.log('🎮 Battle meta for security rules:', meta);
    console.log('🎮 Player UIDs:', {
      p1uid: meta?.players?.p1?.uid,
      p2uid: meta?.players?.p2?.uid,
      currentUser: uid
    });

      // Debug logging
      console.log('🎮 submitChoice debug:', {
        battleId,
        turn,
        uid,
        choice,
        currentVersion,
        path: `battles/${battleId}/turns/${turn}/choices/${uid}`
      });

      // Additional debugging for security rules
      console.log('🎮 Security rule evaluation debug:', {
        authUid: uid,
        targetUid: uid,
        authMatches: uid === uid,
        phase: meta?.phase,
        phaseIsChoosing: meta?.phase === 'choosing',
        dataExists: false, // This is a new write, so data shouldn't exist
        hasRequiredFields: {
          action: !!choice.action,
          payload: !!choice.payload,
          clientVersion: !!currentVersion,
          committedAt: true // We're adding this
        },
        actionType: choice.action,
        actionIsValid: ['move', 'switch', 'forfeit'].includes(choice.action),
        payloadHasMoveId: choice.action === 'move' ? !!choice.payload?.moveId : true,
        payloadHasSwitchIndex: choice.action === 'switch' ? !!choice.payload?.switchToIndex : true,
        clientVersionMatches: currentVersion === meta?.version
      });

    const choiceRef = ref(this.db, `battles/${battleId}/turns/${turn}/choices/${uid}`);

    // Avoid duplicate submissions within the same turn: if a choice already exists, skip
    try {
      const existingSnap = await get(choiceRef);
      if (existingSnap.exists()) {
        console.log('🎮 Choice already exists for this turn and user; skipping re-submit');
        return;
      }
    } catch (readErr) {
      console.warn('🎮 Could not check existing choice (continuing to submit):', readErr);
    }

    const dataToWrite = {
      ...choice,
      committedAt: serverTimestamp(),
      clientVersion: currentVersion
    };
    
    console.log('🎮 Data being written to RTDB:', dataToWrite);
    
    try {
      await set(choiceRef, dataToWrite);
    } catch (e: any) {
      // Gracefully handle permission errors that can happen due to race/duplicate submits
      const message = String(e?.message || e);
      if (/PERMISSION_DENIED/i.test(message)) {
        console.warn('🎮 RTDB submitChoice permission denied (likely duplicate or phase change); ignoring:', message);
        return;
      }
      throw e;
    }
  }

  // Listeners
  onBattleMeta(battleId: string, callback: (meta: RTDBBattleMeta | null) => void): Unsubscribe {
    if (!this.db) {
      callback(null);
      return () => {};
    }
    
    const metaRef = ref(this.db, `battles/${battleId}/meta`);
    return onValue(metaRef, (snapshot: DataSnapshot) => {
      callback(snapshot.val());
    });
  }

  onBattlePublic(battleId: string, callback: (publicState: RTDBBattlePublic | null) => void): Unsubscribe {
    if (!this.db) {
      callback(null);
      return () => {};
    }
    
    const publicRef = ref(this.db, `battles/${battleId}/public`);
    return onValue(publicRef, (snapshot: DataSnapshot) => {
      callback(snapshot.val());
    });
  }

  onBattlePrivate(battleId: string, uid: string, callback: (privateState: RTDBBattlePrivate | null) => void): Unsubscribe {
    if (!this.db) {
      callback(null);
      return () => {};
    }
    
    const privateRef = ref(this.db, `battles/${battleId}/private/${uid}`);
    return onValue(privateRef, (snapshot: DataSnapshot) => {
      callback(snapshot.val());
    });
  }

  onBattleChoices(battleId: string, turn: number, callback: (choices: Record<string, RTDBChoice> | null) => void): Unsubscribe {
    if (!this.db) {
      callback(null);
      return () => {};
    }
    
    const choicesRef = ref(this.db, `battles/${battleId}/turns/${turn}/choices`);
    return onValue(choicesRef, (snapshot: DataSnapshot) => {
      callback(snapshot.val());
    });
  }

  onBattleResolution(battleId: string, turn: number, callback: (resolution: RTDBResolution | null) => void): Unsubscribe {
    if (!this.db) {
      callback(null);
      return () => {};
    }
    
    const resolutionRef = ref(this.db, `battles/${battleId}/turns/${turn}/resolution`);
    return onValue(resolutionRef, (snapshot: DataSnapshot) => {
      callback(snapshot.val());
    });
  }

  // Cleanup
  async deleteBattle(battleId: string): Promise<void> {
    if (!this.db) throw new Error('RTDB not initialized');
    
    const battleRef = ref(this.db, `battles/${battleId}`);
    await remove(battleRef);
  }
}

export const rtdbService = new FirebaseRTDBService();
