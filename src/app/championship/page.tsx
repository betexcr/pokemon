'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Trophy, Users, Crown, Plus } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import OfflineBanner from '@/components/OfflineBanner';
import { championshipService } from '@/lib/championshipService';
import type { Championship, ChampionshipSize, SeatMode } from '@/lib/championship/types';

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
        user.photoURL || undefined
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

          {/* My Championships */}
          {myChampionships.length > 0 && (
            <div className="bg-surface rounded-xl shadow-lg p-4 sm:p-6 mb-6 border border-border">
              <h2 className="text-xl font-semibold text-text mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                My Championships
              </h2>
              <div className="grid gap-3">
                {myChampionships.map((c) => (
                  <ChampionshipCard
                    key={c.id}
                    championship={c}
                    onClick={() => router.push(`/championship/${c.id}`)}
                    currentUserId={user?.uid}
                  />
                ))}
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
              <div className="grid gap-3">
                {openChampionships.map((c) => (
                  <ChampionshipCard
                    key={c.id}
                    championship={c}
                    onClick={() => router.push(`/championship/${c.id}`)}
                    currentUserId={user?.uid}
                  />
                ))}
              </div>
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
}: {
  championship: Championship;
  onClick: () => void;
  currentUserId?: string;
}) {
  const statusColors: Record<string, string> = {
    open: 'bg-green-700/25 text-green-100 border-green-600',
    seeding: 'bg-yellow-700/25 text-yellow-100 border-yellow-600',
    in_progress: 'bg-blue-700/25 text-blue-100 border-blue-600',
    completed: 'bg-gray-700/40 text-gray-200 border-gray-600',
    cancelled: 'bg-red-700/25 text-red-100 border-red-600',
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
          {isHost && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-600/30 text-yellow-200 border border-yellow-600">
              Host
            </span>
          )}
          {isJoined && !isHost && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-600/30 text-blue-200 border border-blue-600">
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
      <div className="flex items-center gap-4 text-sm text-muted">
        <span>{c.participants.length}/{c.size} trainers</span>
        <span>{c.seatMode === 'random' ? '🎲 Random' : '🎯 Pick'}</span>
        <span>by {c.hostName}</span>
      </div>
      {c.status === 'completed' && c.winnerName && (
        <div className="mt-2 text-sm text-yellow-400 flex items-center gap-1">
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
