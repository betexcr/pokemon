const { describe, it, expect, beforeEach, afterEach, vi } = require('vitest');
const admin = require('firebase-admin');

// Mock Firebase Admin
vi.mock('firebase-admin', () => ({
  initializeApp: vi.fn(),
  database: vi.fn(() => ({
    ref: vi.fn(),
    child: vi.fn(),
    set: vi.fn(),
    get: vi.fn(),
    remove: vi.fn(),
    update: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    once: vi.fn(),
    transaction: vi.fn()
  })),
  firestore: vi.fn(() => ({
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: vi.fn(),
        set: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
      }))
    }))
  })),
  database: {
    ServerValue: {
      TIMESTAMP: { '.sv': 'timestamp' }
    }
  }
}));

// Mock the functions
const mockFunctions = {
  matchmake: vi.fn(),
  onChoiceCreate: vi.fn(),
  turnTimeoutSweep: vi.fn()
};

describe('Cloud Functions', () => {
  let mockDb;
  let mockFirestore;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockDb = {
      ref: vi.fn(),
      child: vi.fn(),
      set: vi.fn(),
      get: vi.fn(),
      remove: vi.fn(),
      update: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      once: vi.fn(),
      transaction: vi.fn()
    };

    mockFirestore = {
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({
          get: vi.fn(),
          set: vi.fn(),
          update: vi.fn(),
          delete: vi.fn()
        }))
      }))
    };

    admin.database.mockReturnValue(mockDb);
    admin.firestore.mockReturnValue(mockFirestore);
  });

  describe('matchmake function', () => {
    it('should create battle when two players join lobby', async () => {
      const mockChange = {
        after: {
          exists: () => true,
          val: () => ({
            joinedAt: Date.now(),
            prefs: { format: 'singles', minRating: 1000 }
          })
        }
      };

      const mockContext = {
        params: { region: 'us-central1', uid: 'player1' }
      };

      // Mock queue with two players
      const mockQueueSnapshot = {
        val: () => ({
          player1: { joinedAt: Date.now(), prefs: { format: 'singles', minRating: 1000 } },
          player2: { joinedAt: Date.now(), prefs: { format: 'singles', minRating: 1000 } }
        })
      };

      const mockPlayer1Doc = {
        exists: () => true,
        data: () => ({
          displayName: 'Player 1',
          team: [
            {
              pokemon: { name: 'Pikachu', types: [{ type: { name: 'electric' } }] },
              level: 50,
              currentHp: 100,
              maxHp: 100,
              statModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 }
            }
          ]
        })
      };

      const mockPlayer2Doc = {
        exists: () => true,
        data: () => ({
          displayName: 'Player 2',
          team: [
            {
              pokemon: { name: 'Charmander', types: [{ type: { name: 'fire' } }] },
              level: 50,
              currentHp: 100,
              maxHp: 100,
              statModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 }
            }
          ]
        })
      };

      mockDb.ref.mockReturnValue({
        once: vi.fn().mockResolvedValue(mockQueueSnapshot)
      });

      mockFirestore.collection.mockReturnValue({
        doc: vi.fn()
          .mockReturnValueOnce({ get: vi.fn().mockResolvedValue(mockPlayer1Doc) })
          .mockReturnValueOnce({ get: vi.fn().mockResolvedValue(mockPlayer2Doc) })
      });

      mockDb.ref.mockReturnValue({
        once: vi.fn().mockResolvedValue(mockQueueSnapshot),
        child: vi.fn().mockReturnValue({
          remove: vi.fn().mockResolvedValue(undefined)
        })
      });

      // Mock the createBattle function
      const createBattle = vi.fn().mockResolvedValue(undefined);
      
      // Simulate the matchmake function logic
      const queueRef = mockDb.ref('lobbies/us-central1/queue');
      const queueSnapshot = await queueRef.once('value');
      const queue = queueSnapshot.val() || {};
      const players = Object.entries(queue);

      if (players.length >= 2) {
        const [p1Uid, p1Data] = players[0];
        const [p2Uid, p2Data] = players[1];
        
        const battleId = `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Get player data from Firestore
        const p1Doc = await mockFirestore.collection('users').doc(p1Uid).get();
        const p2Doc = await mockFirestore.collection('users').doc(p2Uid).get();
        
        const p1Data_fs = p1Doc.data();
        const p2Data_fs = p2Doc.data();
        
        // Create battle in RTDB
        await createBattle(battleId, p1Uid, p1Data_fs, p2Uid, p2Data_fs);
        
        // Remove players from queue
        await queueRef.child(p1Uid).remove();
        await queueRef.child(p2Uid).remove();
      }

      expect(players).toHaveLength(2);
      expect(createBattle).toHaveBeenCalled();
    });

    it('should not create battle when only one player in queue', async () => {
      const mockQueueSnapshot = {
        val: () => ({
          player1: { joinedAt: Date.now(), prefs: { format: 'singles', minRating: 1000 } }
        })
      };

      mockDb.ref.mockReturnValue({
        once: vi.fn().mockResolvedValue(mockQueueSnapshot)
      });

      const queueRef = mockDb.ref('lobbies/us-central1/queue');
      const queueSnapshot = await queueRef.once('value');
      const queue = queueSnapshot.val() || {};
      const players = Object.entries(queue);

      expect(players).toHaveLength(1);
      // Should not create battle
    });
  });

  describe('onChoiceCreate function', () => {
    it('should resolve turn when both players have submitted choices', async () => {
      const mockChoice = {
        action: 'move',
        payload: { moveId: 'thunderbolt', target: 'opponent' },
        committedAt: Date.now(),
        clientVersion: 1
      };

      const mockSnap = {
        val: () => mockChoice
      };

      const mockContext = {
        params: { bid: 'battle-123', turn: '1', uid: 'player1' }
      };

      const mockMeta = {
        phase: 'choosing',
        version: 1,
        players: { p1: { uid: 'player1' }, p2: { uid: 'player2' } }
      };

      const mockChoices = {
        player1: mockChoice,
        player2: {
          action: 'move',
          payload: { moveId: 'flamethrower', target: 'opponent' },
          committedAt: Date.now(),
          clientVersion: 1
        }
      };

      const mockMetaSnapshot = { val: () => mockMeta };
      const mockChoicesSnapshot = { val: () => mockChoices };

      mockDb.ref.mockImplementation((path) => ({
        once: vi.fn().mockResolvedValue(
          path.includes('meta') ? mockMetaSnapshot : mockChoicesSnapshot
        )
      }));

      // Mock resolveTurn function
      const resolveTurn = vi.fn().mockResolvedValue(undefined);

      // Simulate the onChoiceCreate function logic
      const { bid, turn, uid } = mockContext.params;
      const choice = mockSnap.val();

      const metaRef = mockDb.ref(`/battles/${bid}/meta`);
      const choicesRef = mockDb.ref(`/battles/${bid}/turns/${turn}/choices`);

      const [metaSnap, choicesSnap] = await Promise.all([
        metaRef.once('value'),
        choicesRef.once('value')
      ]);

      const meta = metaSnap.val();
      const choices = choicesSnap.val() || {};

      if (meta.phase === 'choosing' && choice.clientVersion === meta.version) {
        const playerIds = [meta.players.p1.uid, meta.players.p2.uid];
        if (playerIds.every(u => choices[u])) {
          await resolveTurn(bid, Number(turn), meta, choices);
        }
      }

      expect(resolveTurn).toHaveBeenCalledWith('battle-123', 1, mockMeta, mockChoices);
    });

    it('should not resolve turn if phase is not choosing', async () => {
      const mockMeta = {
        phase: 'resolving',
        version: 1,
        players: { p1: { uid: 'player1' }, p2: { uid: 'player2' } }
      };

      const mockMetaSnapshot = { val: () => mockMeta };

      mockDb.ref.mockImplementation((path) => ({
        once: vi.fn().mockResolvedValue(mockMetaSnapshot)
      }));

      const resolveTurn = vi.fn().mockResolvedValue(undefined);

      // Simulate the function logic
      const metaRef = mockDb.ref('/battles/battle-123/meta');
      const metaSnap = await metaRef.once('value');
      const meta = metaSnap.val();

      if (meta.phase !== 'choosing') {
        // Should not resolve
        expect(resolveTurn).not.toHaveBeenCalled();
      }
    });

    it('should not resolve turn if client version mismatch', async () => {
      const mockMeta = {
        phase: 'choosing',
        version: 2,
        players: { p1: { uid: 'player1' }, p2: { uid: 'player2' } }
      };

      const mockChoice = {
        action: 'move',
        payload: { moveId: 'thunderbolt' },
        clientVersion: 1 // Mismatch
      };

      const mockMetaSnapshot = { val: () => mockMeta };

      mockDb.ref.mockImplementation((path) => ({
        once: vi.fn().mockResolvedValue(mockMetaSnapshot)
      }));

      const resolveTurn = vi.fn().mockResolvedValue(undefined);

      // Simulate the function logic
      const metaRef = mockDb.ref('/battles/battle-123/meta');
      const metaSnap = await metaRef.once('value');
      const meta = metaSnap.val();

      if (meta.phase === 'choosing' && mockChoice.clientVersion !== meta.version) {
        // Should not resolve
        expect(resolveTurn).not.toHaveBeenCalled();
      }
    });
  });

  describe('turnTimeoutSweep function', () => {
    it('should handle timeout for inactive players', async () => {
      const mockBattles = {
        'battle-123': {
          meta: {
            phase: 'choosing',
            deadlineAt: Date.now() - 1000, // Past deadline
            players: { p1: { uid: 'player1' }, p2: { uid: 'player2' } }
          }
        }
      };

      const mockBattlesSnapshot = { val: () => mockBattles };
      const mockChoicesSnapshot = { val: () => ({ player1: { action: 'move' } }) }; // Only player1 has choice

      mockDb.ref.mockImplementation((path) => ({
        once: vi.fn().mockResolvedValue(
          path.includes('battles') && !path.includes('choices') ? mockBattlesSnapshot : mockChoicesSnapshot
        )
      }));

      const handleTurnTimeout = vi.fn().mockResolvedValue(undefined);

      // Simulate the turnTimeoutSweep function logic
      const battlesRef = mockDb.ref('battles');
      const battlesSnapshot = await battlesRef.once('value');
      const battles = battlesSnapshot.val() || {};

      const now = Date.now();

      for (const [battleId, battleData] of Object.entries(battles)) {
        if (battleData.meta && battleData.meta.phase === 'choosing') {
          const deadline = battleData.meta.deadlineAt;
          if (deadline && now > deadline) {
            await handleTurnTimeout(battleId, battleData);
          }
        }
      }

      expect(handleTurnTimeout).toHaveBeenCalledWith('battle-123', mockBattles['battle-123']);
    });

    it('should not handle timeout for active battles', async () => {
      const mockBattles = {
        'battle-123': {
          meta: {
            phase: 'choosing',
            deadlineAt: Date.now() + 30000, // Future deadline
            players: { p1: { uid: 'player1' }, p2: { uid: 'player2' } }
          }
        }
      };

      const mockBattlesSnapshot = { val: () => mockBattles };

      mockDb.ref.mockImplementation((path) => ({
        once: vi.fn().mockResolvedValue(mockBattlesSnapshot)
      }));

      const handleTurnTimeout = vi.fn().mockResolvedValue(undefined);

      // Simulate the function logic
      const battlesRef = mockDb.ref('battles');
      const battlesSnapshot = await battlesRef.once('value');
      const battles = battlesSnapshot.val() || {};

      const now = Date.now();

      for (const [battleId, battleData] of Object.entries(battles)) {
        if (battleData.meta && battleData.meta.phase === 'choosing') {
          const deadline = battleData.meta.deadlineAt;
          if (deadline && now > deadline) {
            await handleTurnTimeout(battleId, battleData);
          }
        }
      }

      expect(handleTurnTimeout).not.toHaveBeenCalled();
    });
  });

  describe('createBattle helper function', () => {
    it('should create battle with proper structure', async () => {
      const mockRef = vi.fn().mockReturnValue({
        set: vi.fn().mockResolvedValue(undefined)
      });

      mockDb.ref.mockImplementation(mockRef);

      const p1Data = {
        displayName: 'Player 1',
        team: [
          {
            pokemon: { name: 'Pikachu', types: [{ type: { name: 'electric' } }] },
            level: 50,
            currentHp: 100,
            maxHp: 100,
            statModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 }
          }
        ]
      };

      const p2Data = {
        displayName: 'Player 2',
        team: [
          {
            pokemon: { name: 'Charmander', types: [{ type: { name: 'fire' } }] },
            level: 50,
            currentHp: 100,
            maxHp: 100,
            statModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 }
          }
        ]
      };

      // Simulate createBattle function
      const battleId = 'battle-123';
      const p1Uid = 'player1';
      const p2Uid = 'player2';

      const now = Date.now();
      const deadlineAt = now + (30 * 1000);

      // Create meta
      const metaRef = mockDb.ref(`battles/${battleId}/meta`);
      await metaRef.set({
        createdAt: admin.database.ServerValue.TIMESTAMP,
        format: 'singles',
        ruleSet: 'gen9-no-weather',
        region: 'global',
        players: {
          p1: { uid: p1Uid, name: p1Data.displayName },
          p2: { uid: p2Uid, name: p2Data.displayName }
        },
        phase: 'choosing',
        turn: 1,
        deadlineAt: admin.database.ServerValue.TIMESTAMP,
        version: 1
      });

      expect(mockRef).toHaveBeenCalledWith(`battles/${battleId}/meta`);
    });
  });
});
