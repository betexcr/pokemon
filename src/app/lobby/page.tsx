'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Swords } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { roomService, type RoomData } from '@/lib/roomService';
import { getUserTeams, type SavedTeam } from '@/lib/userTeams';
import LinkWithTransition from '@/components/LinkWithTransition';
import { useLobbyTransition } from '@/hooks/useLobbyTransition';

function LobbyPage() {
  const { user } = useAuth();
  const router = useRouter();
  const lobbyTransition = useLobbyTransition();
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [userTeams, setUserTeams] = useState<SavedTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [creatingRoom, setCreatingRoom] = useState(false);
  // const [roomCode, setRoomCode] = useState('');

  // Load rooms from Firebase
  useEffect(() => {
    if (!user) {
      setRoomsLoading(false);
      return;
    }

    const unsubscribe = roomService.onRoomsChange((rooms) => {
      setRooms(rooms);
      setRoomsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Load user teams
  useEffect(() => {
    async function loadTeams() {
      if (user) {
        try {
          const teams = await getUserTeams(user.uid);
          setUserTeams(teams);
          if (teams.length > 0) {
            setSelectedTeamId(teams[0].id);
          }
        } catch (error) {
          console.error('Failed to load teams:', error);
        } finally {
          setTeamsLoading(false);
        }
      } else {
        setTeamsLoading(false);
      }
    }
    loadTeams();
  }, [user]);

  const createRoom = async () => {
    if (!user) return;

    if (!selectedTeamId) {
      alert('Please select a team first!');
      return;
    }

    const selectedTeam = userTeams.find(t => t.id === selectedTeamId);
    if (!selectedTeam) {
      alert('Selected team not found.');
      return;
    }

    setCreatingRoom(true);
    try {
      // Create room in Firestore
      const roomId = await roomService.createRoom(
        user.uid,
        user.displayName || 'Anonymous Trainer',
        user.photoURL || null,
        selectedTeam
      );

      // setRoomCode(roomId);
      console.log('Created room with ID:', roomId);

      // Redirect to the room with lobby transition
      lobbyTransition(roomId);
    } catch (error) {
      console.error('Failed to create room:', error);
      alert('Failed to create room. Please try again.');
    } finally {
      setCreatingRoom(false);
    }
  };

  const joinRoom = async (roomId: string) => {
    if (!user) return;

    if (!selectedTeamId) {
      alert('Please select a team first!');
      return;
    }

    const selectedTeam = userTeams.find(t => t.id === selectedTeamId);
    if (!selectedTeam) {
      alert('Selected team not found.');
      return;
    }

    try {
      await roomService.joinRoom(
        roomId,
        user.uid,
        user.displayName || 'Anonymous Trainer',
        user.photoURL || null,
        selectedTeam
      );
      lobbyTransition(roomId);
    } catch (error) {
      console.error('Failed to join room:', error);
      alert('Failed to join room. Please try again.');
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));

    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    return `${minutes} minutes ago`;
  };

  const getStatusColor = (status: RoomData['status']) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-700/25 text-yellow-100 border-yellow-600';
      case 'ready': return 'bg-green-700/25 text-green-100 border-green-600';
      case 'battling': return 'bg-red-700/25 text-red-100 border-red-600';
      case 'finished': return 'bg-gray-700/40 text-gray-200 border-gray-600';
      default: return 'bg-surface text-muted border-border';
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-bg text-text overflow-hidden">
      <AppHeader
        title="Battle Lobby"
        backLink="/"
        backLabel="Back to PokéDex"
        showToolbar={true}
        showThemeToggle={false}
        iconKey="battle"
        showIcon={true}
      />

      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-12">
        {/* Create Room Section */}
        <div className="bg-surface rounded-xl shadow-lg p-4 sm:p-6 mb-6 border border-border">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="w-full md:w-auto flex-1">
              <h2 className="text-xl font-semibold text-text mb-2">Battle Preparation</h2>
              <p className="text-muted mb-4">Select your team and start a battle</p>

              <div className="relative max-w-md">
                <label className="block text-sm font-medium text-text mb-1">Select Team</label>
                <div className="relative">
                  <select
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    disabled={teamsLoading}
                    className="block w-full pl-3 pr-10 py-3 text-base border-border focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg border bg-surface text-text disabled:opacity-50"
                  >
                    {teamsLoading ? (
                      <option>Loading teams...</option>
                    ) : (
                      <>
                        <option value="" disabled>Select a team...</option>
                        {userTeams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.name} ({team.slots.length} Pokémon)
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted">
                    <Swords className="h-4 w-4" />
                  </div>
                </div>
                {!teamsLoading && userTeams.length === 0 && (
                  <p className="mt-2 text-sm text-red-500">
                    You don't have any teams yet! Go to the Team Builder to create one.
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={createRoom}
              disabled={creatingRoom || !selectedTeamId || teamsLoading}
              data-testid="create-room-button"
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              {creatingRoom ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <span>+</span>
                  <span>Create Room</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Available Rooms */}
        <div className="bg-surface rounded-xl shadow-lg p-4 sm:p-6 border border-border">
          <h2 className="text-xl font-semibold text-text mb-6">Available Battle Rooms</h2>

          {roomsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-muted">Loading rooms...</p>
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted text-6xl mb-4">⚔️</div>
              <h3 className="text-lg font-medium text-text mb-2">No rooms available</h3>
              <p className="text-muted">Be the first to create a battle room!</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  data-testid="battle-room-card"
                  className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow bg-surface"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-text">{room.hostName}&apos;s Room</h3>
                    <div className="flex items-center gap-2">
                      {user?.uid === room.hostId && (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!confirm('Delete this room?')) return;
                            try {
                              await roomService.deleteRoom(room.id);
                            } catch (err) {
                              console.error('Failed to delete room', err);
                              alert('Failed to delete room');
                            }
                          }}
                          className="px-2 py-1 rounded-md text-[10px] font-semibold bg-red-600/90 hover:bg-red-700 text-white border border-red-700"
                          aria-label="Delete room"
                        >
                          Delete
                        </button>
                      )}
                      <span className={`px-2 py-1 rounded-full text-[10px] sm:text-xs font-semibold tracking-wide uppercase border ${getStatusColor(room.status)}`}>
                        {room.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-muted mb-4">
                    <div className="flex justify-between">
                      <span>Players:</span>
                      <span>{room.currentPlayers}/{room.maxPlayers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Created:</span>
                      <span>{formatTimeAgo(room.createdAt)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => joinRoom(room.id)}
                    disabled={room.status !== 'waiting' || room.currentPlayers >= room.maxPlayers || !selectedTeamId}
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-colors border
                      ${room.status === 'waiting' && room.currentPlayers < room.maxPlayers
                        ? (selectedTeamId ? 'bg-green-600 hover:bg-green-700 text-white border-green-700' : 'bg-gray-600/40 text-gray-300 border-gray-600 cursor-not-allowed')
                        : 'bg-gray-600/40 text-gray-300 border-gray-600 cursor-not-allowed'}
                    `}
                  >
                    {room.status === 'waiting' && room.currentPlayers < room.maxPlayers
                      ? (selectedTeamId ? 'Join Battle' : 'Select Team to Join')
                      : room.status === 'waiting'
                        ? 'Room Full'
                        : 'In Progress'
                    }
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      </main>
    </div>
  );
}

// Export the protected version as default
export default function ProtectedLobbyPage() {
  return (
    <ProtectedRoute>
      <LobbyPage />
    </ProtectedRoute>
  );
}
