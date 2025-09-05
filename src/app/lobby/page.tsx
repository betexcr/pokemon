'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import UserProfile from '@/components/auth/UserProfile';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

interface LobbyRoom {
  id: string;
  hostId: string;
  hostName: string;
  hostTeam?: string;
  guestId?: string;
  guestName?: string;
  guestTeam?: string;
  status: 'waiting' | 'ready' | 'battling' | 'finished';
  createdAt: Date;
  maxPlayers: number;
  currentPlayers: number;
}

function LobbyPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState<LobbyRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [roomCode, setRoomCode] = useState('');

  // Mock data for now - will be replaced with Firebase/Firestore
  useEffect(() => {
    const mockRooms: LobbyRoom[] = [
      {
        id: 'room1',
        hostId: 'user1',
        hostName: 'Trainer Red',
        status: 'waiting',
        createdAt: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
        maxPlayers: 2,
        currentPlayers: 1
      },
      {
        id: 'room2',
        hostId: 'user2',
        hostName: 'Trainer Blue',
        status: 'waiting',
        createdAt: new Date(Date.now() - 1000 * 60 * 2), // 2 minutes ago
        maxPlayers: 2,
        currentPlayers: 1
      }
    ];
    
    setTimeout(() => {
      setRooms(mockRooms);
      setLoading(false);
    }, 1000);
  }, []);

  const createRoom = async () => {
    if (!user) return;
    
    setCreatingRoom(true);
    try {
      // Generate a random room code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      setRoomCode(code);
      
      // TODO: Create room in Firestore
      console.log('Creating room with code:', code);
      
      // For now, just redirect to the room
      router.push(`/lobby/${code}`);
    } catch (error) {
      console.error('Failed to create room:', error);
    } finally {
      setCreatingRoom(false);
    }
  };

  const joinRoom = (roomId: string) => {
    router.push(`/lobby/${roomId}`);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    return `${minutes} minutes ago`;
  };

  const getStatusColor = (status: LobbyRoom['status']) => {
    switch (status) {
      case 'waiting': return 'text-yellow-600 bg-yellow-100';
      case 'ready': return 'text-green-600 bg-green-100';
      case 'battling': return 'text-red-600 bg-red-100';
      case 'finished': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading battle lobbies...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/')}
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                ← Back to Pokédex
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Battle Lobby</h1>
            </div>
            <UserProfile />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Create Room Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Create Battle Room</h2>
              <p className="text-gray-600">Start a new battle and invite friends to join</p>
            </div>
            <button
              onClick={createRoom}
              disabled={creatingRoom}
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
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Available Battle Rooms</h2>
          
          {rooms.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">⚔️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms available</h3>
              <p className="text-gray-600">Be the first to create a battle room!</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">{room.hostName}&apos;s Room</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(room.status)}`}>
                      {room.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
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
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg font-medium transition-colors"
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
