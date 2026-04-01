'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Trophy,
  Users,
  Shuffle,
  Play,
  LogOut,
  Trash2,
  Crown,
  Loader2,
  XCircle,
  Flag,
} from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import OfflineBanner from '@/components/OfflineBanner';
import BracketView from '@/components/championship/BracketView';
import SeatPicker from '@/components/championship/SeatPicker';
import ParticipantList from '@/components/championship/ParticipantList';
import { championshipService } from '@/lib/championshipService';
import { getUserTeams, type SavedTeam } from '@/lib/userTeams';
import { roomService, type RoomData } from '@/lib/roomService';
import { rtdbService } from '@/lib/firebase-rtdb-service';
import type { Championship, ChampionshipMatch } from '@/lib/championship/types';
import {
  formatChampionshipGenerationRule,
  teamWithinMaxGeneration,
} from '@/lib/pokemon/nationalDexByGeneration';

interface Props {
  championshipId: string;
}

function ChampionshipDetailContent({ championshipId }: Props) {
  const { user } = useAuth();
  const router = useRouter();

  const [championship, setChampionship] = useState<Championship | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [userTeams, setUserTeams] = useState<SavedTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [teamsLoading, setTeamsLoading] = useState(true);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    try {
      unsub = championshipService.onChampionshipChange(
        championshipId,
        (c) => {
          setChampionship(c);
          setLoading(false);
        }
      );
    } catch {
      setChampionship(null);
      setLoading(false);
    }
    return () => unsub?.();
  }, [championshipId]);

  useEffect(() => {
    if (!user) { setTeamsLoading(false); return; }
    let cancelled = false;
    async function loadTeams() {
      try {
        const teams = await getUserTeams(user!.uid);
        if (cancelled) return;
        setUserTeams(teams);
        if (teams.length > 0) setSelectedTeamId(teams[0].id);
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load teams:', err);
      } finally {
        if (!cancelled) setTeamsLoading(false);
      }
    }
    loadTeams();
    return () => { cancelled = true; };
  }, [user]);

  const championshipId_ = championship?.id;
  const maxGeneration = championship?.maxGeneration;

  const generationRuleText = useMemo(
    () =>
      championship ? formatChampionshipGenerationRule(maxGeneration) : null,
    [maxGeneration, championship]
  );

  const teamChoices = useMemo(() => {
    if (!maxGeneration) return userTeams;
    return userTeams.filter((t) =>
      teamWithinMaxGeneration(t.slots, maxGeneration)
    );
  }, [userTeams, maxGeneration]);

  useEffect(() => {
    if (!championship || teamsLoading) return;
    if (teamChoices.length === 0) {
      setSelectedTeamId('');
      return;
    }
    setSelectedTeamId((prev) => {
      if (prev && teamChoices.some((t) => t.id === prev)) return prev;
      return teamChoices[0].id;
    });
  }, [championshipId_, maxGeneration, teamChoices, teamsLoading, championship]);

  // Watch active match rooms and auto-advance winners
  const advancingRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!championship || championship.status !== 'in_progress') return;

    const activeMatches = championship.bracket.filter(
      (m) => m.roomId && m.status === 'in_progress'
    );
    if (activeMatches.length === 0) return;

    let cancelled = false;

    const unsubs = activeMatches.map((match) =>
      roomService.onRoomChange(match.roomId!, async (room: RoomData | null) => {
        if (cancelled) return;
        if (!room || room.status !== 'finished' || !room.battleId) return;
        if (advancingRef.current.has(match.id)) return;
        advancingRef.current.add(match.id);

        try {
          const meta = await rtdbService.getBattleMeta(room.battleId);
          if (cancelled) return;
          if (meta?.winnerUid) {
            await championshipService.advanceWinner(
              championship.id,
              match.id,
              meta.winnerUid
            );
          }
        } catch (err) {
          console.error('Auto-advance failed for match', match.id, err);
        } finally {
          advancingRef.current.delete(match.id);
        }
      })
    );

    return () => {
      cancelled = true;
      unsubs.forEach((u) => u());
    };
  }, [championship?.id, championship?.status, championship?.bracket]);

  const c = championship;
  const isHost = c?.hostUid === user?.uid;
  const isJoined = c?.participants?.some((p) => p.uid === user?.uid) ?? false;
  const isFull = c ? c.participants.length >= c.size : false;

  const handleJoin = useCallback(async () => {
    if (!user || !c) return;
    const selectedTeam = userTeams.find((t) => t.id === selectedTeamId);
    setActionLoading(true);
    try {
      await championshipService.joinChampionship(
        c.id,
        user.uid,
        user.displayName || 'Anonymous Trainer',
        user.photoURL || undefined,
        selectedTeamId || undefined,
        selectedTeam?.slots
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to join');
    } finally {
      setActionLoading(false);
    }
  }, [user, c, userTeams, selectedTeamId]);

  const handleLeave = useCallback(async () => {
    if (!user || !c) return;
    if (!confirm('Leave this championship?')) return;
    setActionLoading(true);
    try {
      await championshipService.leaveChampionship(c.id, user.uid);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to leave');
    } finally {
      setActionLoading(false);
    }
  }, [user, c]);

  const handlePickSeat = useCallback(
    async (seed: number) => {
      if (!user || !c) return;
      try {
        await championshipService.pickSeat(c.id, user.uid, seed);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to pick seat');
      }
    },
    [user, c]
  );

  const handleRandomize = useCallback(async () => {
    if (!user || !c) return;
    setActionLoading(true);
    try {
      await championshipService.randomizeSeeds(c.id, user.uid);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to randomize');
    } finally {
      setActionLoading(false);
    }
  }, [user, c]);

  const handleStart = useCallback(async () => {
    if (!user || !c) return;
    if (!confirm(`Start the championship with ${c.participants.length} trainers?`))
      return;
    setActionLoading(true);
    try {
      await championshipService.startChampionship(c.id, user.uid);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to start');
    } finally {
      setActionLoading(false);
    }
  }, [user, c]);

  const handleDelete = useCallback(async () => {
    if (!user || !c) return;
    if (!confirm('Delete this championship? This cannot be undone.')) return;
    setActionLoading(true);
    try {
      await championshipService.deleteChampionship(c.id, user.uid);
      router.push('/championship');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setActionLoading(false);
    }
  }, [user, c, router]);

  const handleCancel = useCallback(async () => {
    if (!user || !c) return;
    if (!confirm('Cancel this championship? All progress will be lost.')) return;
    setActionLoading(true);
    try {
      await championshipService.cancelChampionship(c.id, user.uid);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to cancel');
    } finally {
      setActionLoading(false);
    }
  }, [user, c]);

  const handleForfeit = useCallback(
    async (match: ChampionshipMatch, loserUid: string) => {
      if (!user || !c) return;
      const loser = c.participants.find((p) => p.uid === loserUid);
      if (!confirm(`Forfeit ${loser?.name ?? 'this player'}? Their opponent will advance.`)) return;
      setActionLoading(true);
      try {
        await championshipService.forfeitMatch(c.id, match.id, loserUid, user.uid);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to forfeit');
      } finally {
        setActionLoading(false);
      }
    },
    [user, c]
  );

  const handleUpdateTeam = useCallback(async () => {
    if (!user || !c || !selectedTeamId) return;
    const selectedTeam = userTeams.find((t) => t.id === selectedTeamId);
    if (!selectedTeam) return;
    setActionLoading(true);
    try {
      await championshipService.updateParticipantTeam(
        c.id,
        user.uid,
        selectedTeamId,
        selectedTeam.slots
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update team');
    } finally {
      setActionLoading(false);
    }
  }, [user, c, userTeams, selectedTeamId]);

  const handleStartBattle = useCallback(
    async (match: ChampionshipMatch) => {
      if (!user || !c) return;

      setActionLoading(true);
      try {
        if (match.roomId) {
          router.push(`/lobby/${match.roomId}`);
          return;
        }

        const myParticipant = c.participants.find(
          (p) => p.uid === user.uid
        );
        const roomId = await roomService.createRoom(
          user.uid,
          user.displayName || 'Anonymous Trainer',
          user.photoURL || null,
          myParticipant?.team
        );

        await championshipService.setMatchRoom(c.id, match.id, roomId, user.uid);
        router.push(`/lobby/${roomId}`);
      } catch (err) {
        console.error('Failed to start battle:', err);
        alert('Failed to create battle room');
      } finally {
        setActionLoading(false);
      }
    },
    [user, c, router]
  );

  if (loading) {
    return (
      <div className="fixed inset-0 flex flex-col bg-bg text-text">
        <AppHeader title="Championship" backLink="/championship" showToolbar={false} />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
        </div>
      </div>
    );
  }

  if (!c) {
    return (
      <div className="fixed inset-0 flex flex-col bg-bg text-text">
        <AppHeader title="Championship" backLink="/championship" showToolbar={false} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-3">🏆</div>
            <h2 className="text-lg font-semibold text-text">Championship not found</h2>
            <p className="text-muted text-sm">It may have been deleted.</p>
          </div>
        </div>
      </div>
    );
  }

  const statusLabel =
    c.status === 'in_progress'
      ? 'In Progress'
      : c.status.charAt(0).toUpperCase() + c.status.slice(1);

  return (
    <div className="fixed inset-0 flex flex-col bg-bg text-text overflow-hidden">
      <OfflineBanner requiresNetwork blockedMessage="Championships require an internet connection." />
      <AppHeader
        title={c.name}
        subtitle={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
            <span>{statusLabel}</span>
            <span>·</span>
            <span>{c.participants.length}/{c.size} trainers</span>
            <span>·</span>
            <span>Host: {c.hostName}</span>
            {generationRuleText && (
              <>
                <span>·</span>
                <span className="text-purple-600 dark:text-violet-300">Through Gen {c.maxGeneration}</span>
              </>
            )}
          </span>
        }
        backLink="/championship"
        backLabel="Championships"
        showToolbar={false}
        iconKey="championship"
      />

      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-12">
          {/* Open / Seeding Phase: lobby */}
          {(c.status === 'open' || c.status === 'seeding') && (
            <div className="space-y-6">
              {/* Join / Team selector */}
              {!isJoined && (
                <div className="bg-surface rounded-xl shadow-lg p-4 sm:p-6 border border-border">
                  <h3 className="text-lg font-semibold text-text mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-400" />
                    Join Championship
                  </h3>
                  {generationRuleText && (
                    <p className="text-sm text-purple-700 dark:text-violet-200 bg-purple-50 dark:bg-violet-950/30 border border-purple-200 dark:border-violet-500/25 rounded-lg px-3 py-2 mb-3">
                      {generationRuleText}
                    </p>
                  )}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-text mb-1">
                        Select Team
                      </label>
                      <select
                        value={selectedTeamId}
                        onChange={(e) => setSelectedTeamId(e.target.value)}
                        disabled={teamsLoading}
                        className="block w-full pl-3 pr-10 py-2.5 text-sm border-border focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 rounded-lg border bg-surface text-text disabled:opacity-50"
                      >
                        {teamsLoading ? (
                          <option>Loading teams...</option>
                        ) : (
                          <>
                            <option value="" disabled>
                              Select a team...
                            </option>
                            {teamChoices.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name} ({t.slots.length} Pokémon)
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                      {!teamsLoading && userTeams.length === 0 && (
                        <p className="mt-1 text-xs text-red-400">
                          No teams found. Create one in Team Builder first.
                        </p>
                      )}
                      {!teamsLoading &&
                        userTeams.length > 0 &&
                        c.maxGeneration != null &&
                        teamChoices.length === 0 && (
                          <p className="mt-1 text-xs text-amber-400">
                            None of your saved teams meet this championship&apos;s generation
                            limit. Edit or create a team in Team Builder.
                          </p>
                        )}
                    </div>
                    <button
                      type="button"
                      onClick={handleJoin}
                      disabled={
                        actionLoading || isFull || !selectedTeamId || teamChoices.length === 0
                      }
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {actionLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Users className="w-4 h-4" />
                      )}
                      {isFull ? 'Championship Full' : 'Join Championship'}
                    </button>
                  </div>
                </div>
              )}

              {/* Team update for joined players */}
              {isJoined && (
                <div className="bg-surface rounded-xl shadow-lg p-4 sm:p-6 border border-border">
                  <h3 className="text-lg font-semibold text-text mb-3">Your Team</h3>
                  {generationRuleText && (
                    <p className="text-sm text-purple-700 dark:text-violet-200 bg-purple-50 dark:bg-violet-950/30 border border-purple-200 dark:border-violet-500/25 rounded-lg px-3 py-2 mb-3">
                      {generationRuleText}
                    </p>
                  )}
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <select
                        value={selectedTeamId}
                        onChange={(e) => setSelectedTeamId(e.target.value)}
                        disabled={teamsLoading || teamChoices.length === 0}
                        aria-label="Select team"
                        className="block w-full pl-3 pr-10 py-2.5 text-sm border-border focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 rounded-lg border bg-surface text-text disabled:opacity-50"
                      >
                        {teamChoices.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.slots.length} Pokémon)
                          </option>
                        ))}
                      </select>
                      {!teamsLoading &&
                        userTeams.length > 0 &&
                        c.maxGeneration != null &&
                        teamChoices.length === 0 && (
                          <p className="mt-1 text-xs text-amber-400">
                            No eligible teams. Adjust your roster in Team Builder.
                          </p>
                        )}
                    </div>
                    <button
                      type="button"
                      onClick={handleUpdateTeam}
                      disabled={
                        actionLoading || !selectedTeamId || teamChoices.length === 0
                      }
                      className="px-4 py-2.5 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Update
                    </button>
                  </div>
                </div>
              )}

              {/* Seat picker (for pick mode) */}
              {c.seatMode === 'pick' && isJoined && (
                <div className="bg-surface rounded-xl shadow-lg p-4 sm:p-6 border border-border">
                  <SeatPicker
                    size={c.size}
                    participants={c.participants}
                    currentUserUid={user?.uid}
                    onPickSeat={handlePickSeat}
                    disabled={actionLoading}
                  />
                </div>
              )}

              {/* Participant list */}
              <div className="bg-surface rounded-xl shadow-lg p-4 sm:p-6 border border-border">
                <ParticipantList
                  participants={c.participants}
                  size={c.size}
                  hostUid={c.hostUid}
                  currentUserUid={user?.uid}
                />
              </div>

              {/* Host controls */}
              {isHost && (
                <div className="bg-surface rounded-xl shadow-lg p-4 sm:p-6 border border-yellow-500/30">
                  <h3 className="text-lg font-semibold text-text mb-3 flex items-center gap-2">
                    <Crown className="w-5 h-5 text-yellow-500" />
                    Host Controls
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {c.seatMode === 'random' && (
                      <button
                        type="button"
                        onClick={handleRandomize}
                        disabled={actionLoading}
                        className="flex-1 min-w-[140px] bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Shuffle className="w-4 h-4" />
                        Randomize Seeds
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleStart}
                      disabled={actionLoading || !isFull}
                      className="flex-1 min-w-[140px] bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      {isFull ? 'Start Championship' : `Waiting (${c.participants.length}/${c.size})`}
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={actionLoading}
                      className="px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              )}

              {/* Leave button for non-hosts */}
              {isJoined && !isHost && (
                <button
                  type="button"
                  onClick={handleLeave}
                  disabled={actionLoading}
                  className="w-full py-2.5 border border-red-500/40 text-red-400 rounded-lg font-medium hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Leave Championship
                </button>
              )}
            </div>
          )}

          {/* In-progress / Completed: bracket view */}
          {(c.status === 'in_progress' || c.status === 'completed') && (
            <div className="space-y-6">
              <div className="bg-surface rounded-xl shadow-lg p-4 sm:p-6 border border-border">
                <h3 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Tournament Bracket
                </h3>
                <BracketView
                  bracket={c.bracket}
                  participants={c.participants}
                  totalRounds={c.totalRounds}
                  currentRound={c.currentRound}
                  currentUserUid={user?.uid}
                  winnerUid={c.winnerUid}
                  winnerName={c.winnerName}
                  onStartBattle={handleStartBattle}
                />
              </div>

              {/* Host controls during in-progress */}
              {isHost && c.status === 'in_progress' && (
                <div className="bg-surface rounded-xl shadow-lg p-4 sm:p-6 border border-yellow-500/30">
                  <h3 className="text-lg font-semibold text-text mb-3 flex items-center gap-2">
                    <Crown className="w-5 h-5 text-yellow-500" />
                    Host Controls
                  </h3>
                  <div className="space-y-3">
                    {c.bracket
                      .filter(
                        (m) =>
                          m.round === c.currentRound &&
                          m.status !== 'completed' &&
                          m.player1Uid &&
                          m.player2Uid
                      )
                      .map((m) => {
                        const p1 = c.participants.find((p) => p.uid === m.player1Uid);
                        const p2 = c.participants.find((p) => p.uid === m.player2Uid);
                        return (
                          <div
                            key={m.id}
                            className="flex items-center gap-2 text-sm"
                          >
                            <span className="text-muted flex-1">
                              {p1?.name} vs {p2?.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleForfeit(m, m.player1Uid!)}
                              disabled={actionLoading}
                              className="px-2.5 py-1.5 text-xs bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white rounded-md flex items-center gap-1"
                            >
                              <Flag className="w-3 h-3" />
                              Forfeit {p1?.name?.split(' ')[0]}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleForfeit(m, m.player2Uid!)}
                              disabled={actionLoading}
                              className="px-2.5 py-1.5 text-xs bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white rounded-md flex items-center gap-1"
                            >
                              <Flag className="w-3 h-3" />
                              Forfeit {p2?.name?.split(' ')[0]}
                            </button>
                          </div>
                        );
                      })}
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={actionLoading}
                      className="w-full py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Cancel Championship
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-surface rounded-xl shadow-lg p-4 sm:p-6 border border-border">
                <ParticipantList
                  participants={c.participants}
                  size={c.size}
                  hostUid={c.hostUid}
                  currentUserUid={user?.uid}
                />
              </div>

              {isHost && c.status === 'completed' && (
                <div className="bg-surface rounded-xl shadow-lg p-4 sm:p-6 border border-yellow-500/30">
                  <h3 className="text-lg font-semibold text-text mb-3 flex items-center gap-2">
                    <Crown className="w-5 h-5 text-yellow-500" />
                    Host Controls
                  </h3>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={actionLoading}
                    className="w-full py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Championship
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Cancelled state */}
          {c.status === 'cancelled' && (
            <div className="space-y-6">
              <div className="text-center p-6 bg-surface rounded-xl border border-border">
                <XCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-text">Championship Cancelled</h3>
                <p className="text-muted text-sm mt-1">This championship was cancelled by the host.</p>
                {isHost && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={actionLoading}
                    className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Delete Championship
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ChampionshipDetailPage({ championshipId }: Props) {
  return (
    <ProtectedRoute>
      <ChampionshipDetailContent championshipId={championshipId} />
    </ProtectedRoute>
  );
}
