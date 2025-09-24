'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Swords } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { roomService, type RoomData } from '@/lib/roomService';
import LinkWithTransition from '@/components/LinkWithTransition';
import { useLobbyTransition } from '@/hooks/useLobbyTransition';

function LobbyPage() {
  const { user } = useAuth();
  const router = useRouter();
  const lobbyTransition = useLobbyTransition();
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingRoom, setCreatingRoom] = useState(false);
  // const [roomCode, setRoomCode] = useState('');

  // Load rooms from Firebase
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubscribe = roomService.onRoomsChange((rooms) => {
      setRooms(rooms);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const createRoom = async () => {
    if (!user) return;
    
    setCreatingRoom(true);
    try {
      // Create room in Firestore
      const roomId = await roomService.createRoom(
        user.uid,
        user.displayName || 'Anonymous Trainer',
        user.photoURL || null
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

  const joinRoom = (roomId: string) => {
    if (!user) return;
    lobbyTransition(roomId);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-bg text-text" style={{ minHeight: '100vh', backgroundSize: 'cover', backgroundRepeat: 'no-repeat' }}>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-muted">Loading battle lobbies...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-text" style={{ minHeight: '100vh', backgroundSize: 'cover', backgroundRepeat: 'no-repeat' }}>
      <AppHeader
        title="Battle Lobby"
        backLink="/"
        backLabel="Back to PokéDex"
        showToolbar={true}
        showThemeToggle={false}
        iconKey="battle"
        showIcon={true}
      />

      <div className="container mx-auto px-4 py-8 pb-16">
        {/* Create Room Section */}
        <div className="bg-surface rounded-xl shadow-lg p-6 mb-8 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-text mb-2">Create Battle Room</h2>
              <p className="text-muted">Start a new battle and invite friends to join</p>
            </div>
            <button
              onClick={createRoom}
              disabled={creatingRoom}
              data-testid="create-room-button"
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
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
        <div className="bg-surface rounded-xl shadow-lg p-6 border border-border">
          <h2 className="text-xl font-semibold text-text mb-6">Available Battle Rooms</h2>
          
          {rooms.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted text-6xl mb-4">⚔️</div>
              <h3 className="text-lg font-medium text-text mb-2">No rooms available</h3>
              <p className="text-muted">Be the first to create a battle room!</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => (
                <div
                  key={room.id}
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
                    disabled={room.status !== 'waiting' || room.currentPlayers >= room.maxPlayers}
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-colors border
                      ${room.status === 'waiting' && room.currentPlayers < room.maxPlayers
                        ? 'bg-green-600 hover:bg-green-700 text-white border-green-700'
                        : 'bg-gray-600/40 text-gray-300 border-gray-600 cursor-not-allowed'}
                    `}
                  >
                    {room.status === 'waiting' && room.currentPlayers < room.maxPlayers
                      ? 'Join Battle'
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
