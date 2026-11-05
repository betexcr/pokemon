// Scheduled cleanup of abandoned multiplayer data (run daily by /api/maintenance/cleanup).
//   RTDB battles: unfinished battles whose turn deadline passed long ago are ended as timeouts (which
//   also closes their Firestore battle / room); ended battles are deleted after a week; battles that
//   could not be ended are deleted after a few days.
//   Firestore rooms: waiting / ready lobbies are deleted after a day; finished / unresolved / battling
//   rooms after a week.
// Storage access is injected so the policy can be tested without Firebase.

export type CleanupPolicy = {
  /** End unfinished battles this long after their deadline passed. */
  endStaleAfterMs: number;
  /** Delete ended battles this long after they were created. */
  deleteEndedAfterMs: number;
  /** Delete battles that are still not ended this long after they were created. */
  deleteAbandonedAfterMs: number;
  /** Delete waiting / ready rooms this long after they were created. */
  deleteOpenRoomsAfterMs: number;
  /** Delete finished / battling / unresolved rooms this long after they were created. */
  deleteClosedRoomsAfterMs: number;
  /** Most battles / rooms handled per run (keeps each run cheap). */
  batchSize: number;
};

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export const DEFAULT_CLEANUP_POLICY: CleanupPolicy = {
  endStaleAfterMs: 15 * 60 * 1000,
  deleteEndedAfterMs: 7 * DAY,
  deleteAbandonedAfterMs: 3 * DAY,
  deleteOpenRoomsAfterMs: DAY,
  deleteClosedRoomsAfterMs: 7 * DAY,
  batchSize: 200,
};

export type BattleMetaLite = { phase?: string; createdAt?: number; deadlineAt?: number };

export type CleanupDeps = {
  now: () => number;
  /** Battles created before `cutoff` (oldest first), at most `limit`. */
  listBattlesCreatedBefore: (cutoff: number, limit: number) => Promise<Array<{ id: string; meta: BattleMetaLite | null }>>;
  /** End a battle whose deadline passed (timeout). Returns true when it ended. */
  endStaleBattle: (battleId: string) => Promise<boolean>;
  deleteBattle: (battleId: string) => Promise<void>;
  /** Rooms with one of `statuses` created before `cutoff`, at most `limit`. */
  listRoomsCreatedBefore: (statuses: string[], cutoff: number, limit: number) => Promise<string[]>;
  deleteRoom: (roomId: string) => Promise<void>;
};

export type CleanupReport = {
  battlesEnded: number;
  battlesDeleted: number;
  roomsDeleted: number;
  errors: number;
};

export async function runBattleCleanup(deps: CleanupDeps, policy: CleanupPolicy = DEFAULT_CLEANUP_POLICY): Promise<CleanupReport> {
  const now = deps.now();
  const report: CleanupReport = { battlesEnded: 0, battlesDeleted: 0, roomsDeleted: 0, errors: 0 };

  // Battles: anything older than the shortest window is a candidate
  const battles = await deps.listBattlesCreatedBefore(now - policy.endStaleAfterMs, policy.batchSize);
  for (const { id, meta } of battles) {
    try {
      const created = typeof meta?.createdAt === 'number' ? meta.createdAt : 0;
      const ended = meta?.phase === 'ended';
      const age = now - created;
      if (!meta || (ended && age > policy.deleteEndedAfterMs) || (!ended && age > policy.deleteAbandonedAfterMs)) {
        await deps.deleteBattle(id);
        report.battlesDeleted += 1;
        continue;
      }
      if (!ended && typeof meta.deadlineAt === 'number' && now - meta.deadlineAt > policy.endStaleAfterMs) {
        if (await deps.endStaleBattle(id)) report.battlesEnded += 1;
      }
    } catch (err) {
      report.errors += 1;
      console.warn(`battle cleanup: ${id} failed`, err);
    }
  }

  // Rooms
  const roomSets: Array<{ statuses: string[]; after: number }> = [
    { statuses: ['waiting', 'ready'], after: policy.deleteOpenRoomsAfterMs },
    { statuses: ['finished', 'battling', 'unresolved'], after: policy.deleteClosedRoomsAfterMs },
  ];
  for (const { statuses, after } of roomSets) {
    const rooms = await deps.listRoomsCreatedBefore(statuses, now - after, policy.batchSize);
    for (const roomId of rooms) {
      try {
        await deps.deleteRoom(roomId);
        report.roomsDeleted += 1;
      } catch (err) {
        report.errors += 1;
        console.warn(`room cleanup: ${roomId} failed`, err);
      }
    }
  }
  return report;
}
