'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Trophy, Users, Crown, Plus, Filter, X } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import OfflineBanner from '@/components/OfflineBanner';
import { championshipService } from '@/lib/championshipService';
import type {
  Championship,
  ChampionshipSize,
  ChampionshipStatus,
  SeatMode,
} from '@/lib/championship/types';

const ALL = 'all' as const;

type SpotFilter = typeof ALL | 'open' | 'full';
type RoleFilter = typeof ALL | 'host' | 'joined' | 'not_joined';

function ChampionshipHubPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [openChampionships, setOpenChampionships] = useState<Championship[]>([]);
  const [myChampionships, setMyChampionships] = useState<Championship[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formSize, setFormSize] = useState<ChampionshipSize>(8);
  const [formSeatMode, setFormSeatMode] = useState<SeatMode>('random');
  const [formMaxGeneration, setFormMaxGeneration] = useState<'all' | number>('all');

  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<typeof ALL | ChampionshipStatus>(ALL);
  const [filterSize, setFilterSize] = useState<typeof ALL | ChampionshipSize>(ALL);
  const [filterSeatMode, setFilterSeatMode] = useState<typeof ALL | SeatMode>(ALL);
  const [filterSpots, setFilterSpots] = useState<SpotFilter>(ALL);
  const [filterRole, setFilterRole] = useState<RoleFilter>(ALL);

  const filterChampionships = useCallback(
    (list: Championship[]) => {
      const q = filterSearch.trim().toLowerCase();
      const uid = user?.uid;
      return list.filter((c) => {
        if (q) {
          const nameMatch = c.name.toLowerCase().includes(q);
          const hostMatch = c.hostName.toLowerCase().includes(q);
          if (!nameMatch && !hostMatch) return false;
        }
        if (filterStatus !== ALL && c.status !== filterStatus) return false;
        if (filterSize !== ALL && c.size !== filterSize) return false;
        if (filterSeatMode !== ALL && c.seatMode !== filterSeatMode) return false;
        if (filterSpots === 'open' && c.participants.length >= c.size) return false;
        if (filterSpots === 'full' && c.participants.length < c.size) return false;
        if (filterRole !== ALL && uid) {
          const isHost = c.hostUid === uid;
          const isJoined = c.participants.some((p) => p.uid === uid);
          if (filterRole === 'host' && !isHost) return false;
          if (filterRole === 'joined' && (!isJoined || isHost)) return false;
          if (filterRole === 'not_joined' && (isHost || isJoined)) return false;
        }
        return true;
      });
    },
    [filterSearch, filterStatus, filterSize, filterSeatMode, filterSpots, filterRole, user?.uid]
  );

  const filteredOpen = useMemo(
    () => filterChampionships(openChampionships),
    [openChampionships, filterChampionships]
  );
  const filteredMine = useMemo(
    () => filterChampionships(myChampionships),
    [myChampionships, filterChampionships]
  );

  const filtersActive =
    filterSearch.trim() !== '' ||
    filterStatus !== ALL ||
    filterSize !== ALL ||
    filterSeatMode !== ALL ||
    filterSpots !== ALL ||
    filterRole !== ALL;

  const clearFilters = () => {
    setFilterSearch('');
    setFilterStatus(ALL);
    setFilterSize(ALL);
    setFilterSeatMode(ALL);
    setFilterSpots(ALL);
    setFilterRole(ALL);
  };

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    async function load() {
      try {
        setLoadError(null);
        const [open, mine] = await Promise.all([
          championshipService.getOpenChampionships(),
          championshipService.getUserChampionships(user!.uid),
        ]);
        setOpenChampionships(open);
        setMyChampionships(mine);
      } catch (err) {
        console.error('Failed to load championships:', err);
        setLoadError('Failed to load championships. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const handleCreate = async () => {
    if (!user || !formName.trim()) return;
    setCreating(true);
    try {
      const id = await championshipService.createChampionship(
        user.uid,
        user.displayName || 'Anonymous Trainer',
        formName.trim(),
        formSize,
        formSeatMode,
        user.photoURL || undefined,
        formMaxGeneration === 'all' ? undefined : formMaxGeneration
      );
      router.push(`/championship/${id}`);
    } catch (err) {
      console.error('Failed to create championship:', err);
      alert('Failed to create championship. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const sizeOptions: ChampionshipSize[] = [4, 8, 16, 32];

  return (
    <div className="fixed inset-0 flex flex-col bg-bg text-text overflow-hidden">
      <OfflineBanner requiresNetwork blockedMessage="Championships require an internet connection." />
      <AppHeader
        title="Championships"
        backLink="/"
        backLabel="Back to PokéDex"
        showToolbar={true}
        showThemeToggle={false}
        iconKey="championship"
        showIcon={true}
      />

      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-12">
          {/* Create Championship Section */}
          <div className="bg-surface rounded-xl shadow-lg p-4 sm:p-6 mb-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-text flex items-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  Create Championship
                </h2>
                <p className="text-muted text-sm mt-1">
                  Set up a tournament bracket and invite trainers to compete
                </p>
              </div>
              {!showForm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New
                </button>
              )}
            </div>

            {showForm && (
              <div className="space-y-4 mt-4 pt-4 border-t border-border">
                <div>
                  <label className="block text-sm font-medium text-text mb-1">
                    Championship Name
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Kanto Grand Tournament"
                    className="block w-full px-3 py-2.5 rounded-lg border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    maxLength={50}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-1">
                    Bracket Size
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {sizeOptions.map((s) => (
                      <button
                        key={s}
                        onClick={() => setFormSize(s)}
                        className={`py-2.5 rounded-lg font-semibold text-sm border transition-colors ${
                          formSize === s
                            ? 'bg-yellow-600 text-white border-yellow-500'
                            : 'bg-surface text-muted border-border hover:border-yellow-500/50'
                        }`}
                      >
                        {s} Players
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted mt-1">
                    {Math.log2(formSize)} rounds · Single elimination
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-1">
                    Seeding Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setFormSeatMode('random')}
                      className={`py-2.5 rounded-lg font-medium text-sm border transition-colors ${
                        formSeatMode === 'random'
                          ? 'bg-yellow-600 text-white border-yellow-500'
                          : 'bg-surface text-muted border-border hover:border-yellow-500/50'
                      }`}
                    >
                      🎲 Random Seeding
                    </button>
                    <button
                      onClick={() => setFormSeatMode('pick')}
                      className={`py-2.5 rounded-lg font-medium text-sm border transition-colors ${
                        formSeatMode === 'pick'
                          ? 'bg-yellow-600 text-white border-yellow-500'
                          : 'bg-surface text-muted border-border hover:border-yellow-500/50'
                      }`}
                    >
                      🎯 Pick Your Seat
                    </button>
                  </div>
                  <p className="text-xs text-muted mt-1">
                    {formSeatMode === 'random'
                      ? 'Players will be randomly assigned to bracket positions'
                      : 'Players can choose their preferred seed/position'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-1">
                    Pokémon allowed
                  </label>
                  <select
                    value={formMaxGeneration === 'all' ? 'all' : String(formMaxGeneration)}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFormMaxGeneration(v === 'all' ? 'all' : Number.parseInt(v, 10));
                    }}
                    className="block w-full pl-3 pr-10 py-2.5 text-sm border-border focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 rounded-lg border bg-surface text-text"
                  >
                    <option value="all">All generations</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((g) => (
                      <option key={g} value={g}>
                        Through Gen {g} (cumulative National Dex)
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted mt-1">
                    Limits saved teams so every filled slot uses a Pokémon introduced by this
                    generation or earlier.
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleCreate}
                    disabled={creating || !formName.trim()}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {creating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Trophy className="w-4 h-4" />
                        Create Championship
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2.5 rounded-lg border border-border text-muted hover:text-text transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* List filters */}
          <div className="bg-surface rounded-xl shadow-lg p-4 sm:p-6 mb-6 border border-border">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h2 className="text-lg font-semibold text-text flex items-center gap-2">
                <Filter className="w-5 h-5 text-muted" />
                Filter lists
              </h2>
              {filtersActive && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 text-sm text-yellow-500 hover:text-yellow-400"
                >
                  <X className="w-4 h-4" />
                  Clear
                </button>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-medium text-muted mb-1">Search name or host</label>
                <input
                  type="search"
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  placeholder="Championship or host name…"
                  className="w-full pl-3 pr-3 py-2 text-sm rounded-lg border border-border bg-bg text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-yellow-600/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as typeof ALL | ChampionshipStatus)}
                  className="w-full pl-3 pr-8 py-2 text-sm rounded-lg border border-border bg-bg text-text"
                >
                  <option value={ALL}>All statuses</option>
                  <option value="open">Open</option>
                  <option value="seeding">Seeding</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Bracket size</label>
                <select
                  value={filterSize}
                  onChange={(e) => setFilterSize(e.target.value as typeof ALL | ChampionshipSize)}
                  className="w-full pl-3 pr-8 py-2 text-sm rounded-lg border border-border bg-bg text-text"
                >
                  <option value={ALL}>All sizes</option>
                  <option value={4}>4</option>
                  <option value={8}>8</option>
                  <option value={16}>16</option>
                  <option value={32}>32</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Seat mode</label>
                <select
                  value={filterSeatMode}
                  onChange={(e) => setFilterSeatMode(e.target.value as typeof ALL | SeatMode)}
                  className="w-full pl-3 pr-8 py-2 text-sm rounded-lg border border-border bg-bg text-text"
                >
                  <option value={ALL}>All modes</option>
                  <option value="random">Random</option>
                  <option value="pick">Pick seat</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Slots</label>
                <select
                  value={filterSpots}
                  onChange={(e) => setFilterSpots(e.target.value as SpotFilter)}
                  className="w-full pl-3 pr-8 py-2 text-sm rounded-lg border border-border bg-bg text-text"
                >
                  <option value={ALL}>Any</option>
                  <option value="open">Has open spots</option>
                  <option value="full">Full roster</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">My role</label>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value as RoleFilter)}
                  className="w-full pl-3 pr-8 py-2 text-sm rounded-lg border border-border bg-bg text-text"
                >
                  <option value={ALL}>Any</option>
                  <option value="host">I&apos;m the host</option>
                  <option value="joined">I&apos;m joined (not host)</option>
                  <option value="not_joined">I&apos;m not in this one</option>
                </select>
              </div>
            </div>
          </div>

          {/* My Championships */}
          {myChampionships.length > 0 && (
            <div className="bg-surface rounded-xl shadow-lg p-4 sm:p-6 mb-6 border border-border">
              <h2 className="text-xl font-semibold text-text mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                My Championships
              </h2>
              <p className="text-sm text-muted mb-3">
                Showing {filteredMine.length} of {myChampionships.length}
              </p>
              <div className="grid gap-3">
                {filteredMine.length === 0 ? (
                  <p className="text-sm text-muted py-6 text-center">No championships match these filters.</p>
                ) : (
                  filteredMine.map((c) => (
                    <ChampionshipCard
                      key={c.id}
                      championship={c}
                      onClick={() => router.push(`/championship/${c.id}`)}
                      currentUserId={user?.uid}
                      onDelete={c.hostUid === user?.uid ? async () => {
                        if (!confirm('Delete this championship? This cannot be undone.')) return;
                        try {
                          await championshipService.deleteChampionship(c.id, user!.uid);
                          setMyChampionships((prev) => prev.filter((ch) => ch.id !== c.id));
                          setOpenChampionships((prev) => prev.filter((ch) => ch.id !== c.id));
                        } catch (err) {
                          alert(err instanceof Error ? err.message : 'Failed to delete');
                        }
                      } : undefined}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {/* Open Championships */}
          <div className="bg-surface rounded-xl shadow-lg p-4 sm:p-6 border border-border">
            <h2 className="text-xl font-semibold text-text mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Open Championships
            </h2>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto mb-4" />
                <p className="text-muted">Loading championships...</p>
              </div>
            ) : loadError ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-lg font-medium text-text mb-2">Could not load championships</h3>
                <p className="text-muted mb-4">{loadError}</p>
                <button
                  onClick={() => { setLoading(true); setLoadError(null); window.location.reload(); }}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : openChampionships.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🏆</div>
                <h3 className="text-lg font-medium text-text mb-2">No open championships</h3>
                <p className="text-muted">Be the first to create a tournament!</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted mb-3">
                  Showing {filteredOpen.length} of {openChampionships.length}
                </p>
                {filteredOpen.length === 0 ? (
                  <p className="text-sm text-muted py-6 text-center">No championships match these filters.</p>
                ) : (
                  <div className="grid gap-3">
                    {filteredOpen.map((c) => (
                      <ChampionshipCard
                        key={c.id}
                        championship={c}
                        onClick={() => router.push(`/championship/${c.id}`)}
                        currentUserId={user?.uid}
                        onDelete={c.hostUid === user?.uid ? async () => {
                          if (!confirm('Delete this championship? This cannot be undone.')) return;
                          try {
                            await championshipService.deleteChampionship(c.id, user!.uid);
                            setOpenChampionships((prev) => prev.filter((ch) => ch.id !== c.id));
                            setMyChampionships((prev) => prev.filter((ch) => ch.id !== c.id));
                          } catch (err) {
                            alert(err instanceof Error ? err.message : 'Failed to delete');
                          }
                        } : undefined}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function ChampionshipCard({
  championship: c,
  onClick,
  currentUserId,
  onDelete,
}: {
  championship: Championship;
  onClick: () => void;
  currentUserId?: string;
  onDelete?: () => void;
}) {
  const statusColors: Record<string, string> = {
    open: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-700/25 dark:text-green-100 dark:border-green-600',
    seeding: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-700/25 dark:text-yellow-100 dark:border-yellow-600',
    in_progress: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-700/25 dark:text-blue-100 dark:border-blue-600',
    completed: 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-700/40 dark:text-gray-200 dark:border-gray-600',
    cancelled: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-700/25 dark:text-red-100 dark:border-red-600',
  };

  const isHost = c.hostUid === currentUserId;
  const isJoined = c.participants.some((p) => p.uid === currentUserId);

  return (
    <button
      onClick={onClick}
      className="w-full text-left border border-border rounded-lg p-4 hover:shadow-md transition-shadow bg-surface"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-text truncate mr-2">{c.name}</h3>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isHost && onDelete && c.status !== 'in_progress' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-red-600/90 hover:bg-red-700 text-white border border-red-700"
              aria-label="Delete championship"
            >
              Delete
            </button>
          )}
          {isHost && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300 dark:bg-yellow-600/30 dark:text-yellow-200 dark:border-yellow-600">
              Host
            </span>
          )}
          {isJoined && !isHost && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-600/30 dark:text-blue-200 dark:border-blue-600">
              Joined
            </span>
          )}
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${
              statusColors[c.status] ?? statusColors.open
            }`}
          >
            {c.status.replace('_', ' ')}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-muted">
        <span>{c.participants.length}/{c.size} trainers</span>
        <span>{c.seatMode === 'random' ? '🎲 Random' : '🎯 Pick'}</span>
        <span>by {c.hostName}</span>
        {typeof c.maxGeneration === 'number' &&
          c.maxGeneration >= 1 &&
          c.maxGeneration <= 9 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-800 border border-purple-300 dark:bg-violet-600/25 dark:text-violet-200 dark:border-violet-500/50">
              Through Gen {c.maxGeneration}
            </span>
          )}
      </div>
      {c.status === 'completed' && c.winnerName && (
        <div className="mt-2 text-sm text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
          <Crown className="w-3.5 h-3.5" /> Champion: {c.winnerName}
        </div>
      )}
    </button>
  );
}

export default function ProtectedChampionshipHubPage() {
  return (
    <ProtectedRoute>
      <ChampionshipHubPage />
    </ProtectedRoute>
  );
}
