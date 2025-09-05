'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import UserProfile from '@/components/auth/UserProfile';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

interface RoomPlayer {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  teamId?: string;
  teamName?: string;
  isReady: boolean;
  joinedAt: Date;
}

interface BattleRoom {
  id: string;
  code: string;
  hostId: string;
  players: RoomPlayer[];
  status: 'waiting' | 'ready' | 'battling' | 'finished';
  createdAt: Date;
  maxPlayers: number;
  battleId?: string;
}

function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const roomId = params.roomId as string;
  
  const [room, setRoom] = useState<BattleRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Mock room data - will be replaced with Firebase/Firestore
  useEffect(() => {
    if (!user) return;

    const mockRoom: BattleRoom = {
      id: roomId,
      code: roomId.toUpperCase(),
      hostId: 'user1',
      players: [
        {
          id: user.uid,
          name: user.displayName || 'Anonymous Trainer',
          email: user.email || '',
          photoURL: user.photoURL || undefined,
          isReady: false,
          joinedAt: new Date()
        }
      ],
      status: 'waiting',
      createdAt: new Date(Date.now() - 1000 * 60 * 5),
      maxPlayers: 2
    };

    setTimeout(() => {
      setRoom(mockRoom);
      setLoading(false);
    }, 1000);
  }, [roomId, user]);

  const copyRoomLink = async () => {
    const roomLink = `${window.location.origin}/lobby/${roomId}`;
    try {
      await navigator.clipboard.writeText(roomLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const toggleReady = () => {
    if (!room || !user) return;
    
    // TODO: Update ready status in Firestore
    setRoom(prev => {
      if (!prev) return null;
      return {
        ...prev,
        players: prev.players.map(player => 
          player.id === user.uid 
            ? { ...player, isReady: !player.isReady }
            : player
        )
      };
    });
  };

  const leaveRoom = async () => {
    if (!user) return;
    
    setLeaving(true);
    try {
      // TODO: Remove player from room in Firestore
      console.log('Leaving room:', roomId);
      router.push('/lobby');
    } catch (error) {
      console.error('Failed to leave room:', error);
    } finally {
      setLeaving(false);
    }
  };

  const startBattle = async () => {
    if (!room || !user || room.hostId !== user.uid) return;
    
    try {
      // TODO: Start battle in Firestore
      console.log('Starting battle for room:', roomId);
      router.push(`/battle/online/${roomId}`);
    } catch (error) {
      console.error('Failed to start battle:', error);
    }
  };

  const canStartBattle = room && 
    room.hostId === user?.uid && 
    room.players.length >= 2 && 
    room.players.every(player => player.isReady) &&
    room.status === 'waiting';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading room...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Room Not Found</h2>
            <p className="text-gray-600 mb-6">The battle room you&apos;re looking for doesn&apos;t exist or has been closed.</p>
            <button
              onClick={() => router.push('/lobby')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Back to Lobby
            </button>
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
                onClick={() => router.push('/lobby')}
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                ← Back to Lobby
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Battle Room</h1>
            </div>
            <UserProfile />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Room Info */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Room Code: {room.code}</h2>
              <p className="text-gray-600">Share this code with friends to invite them to battle</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={copyRoomLink}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  copySuccess 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                {copySuccess ? '✓ Copied!' : 'Copy Link'}
              </button>
              <button
                onClick={leaveRoom}
                disabled={leaving}
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {leaving ? 'Leaving...' : 'Leave Room'}
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="font-medium text-gray-900">Status</div>
              <div className="text-gray-600 capitalize">{room.status}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="font-medium text-gray-900">Players</div>
              <div className="text-gray-600">{room.players.length}/{room.maxPlayers}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="font-medium text-gray-900">Created</div>
              <div className="text-gray-600">{room.createdAt.toLocaleTimeString()}</div>
            </div>
          </div>
        </div>

        {/* Players */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Players</h3>
          
          <div className="space-y-4">
            {room.players.map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                  player.id === user?.uid 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    {player.photoURL ? (
                      <img
                        src={player.photoURL}
                        alt={player.name}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-gray-600 font-medium">
                          {player.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    {player.id === room.hostId && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white">👑</span>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <div className="font-medium text-gray-900">
                      {player.name}
                      {player.id === user?.uid && <span className="text-blue-600 ml-2">(You)</span>}
                    </div>
                    <div className="text-sm text-gray-600">
                      {player.teamName ? `Team: ${player.teamName}` : 'No team selected'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    player.isReady 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {player.isReady ? 'Ready' : 'Not Ready'}
                  </div>
                  
                  {player.id === user?.uid && (
                    <button
                      onClick={toggleReady}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        player.isReady
                          ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {player.isReady ? 'Unready' : 'Ready Up'}
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {/* Empty slots */}
            {Array.from({ length: room.maxPlayers - room.players.length }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className="flex items-center justify-center p-4 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50"
              >
                <div className="text-center">
                  <div className="text-gray-400 text-2xl mb-2">👤</div>
                  <div className="text-gray-500">Waiting for player...</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Battle Controls */}
        {room.hostId === user?.uid && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Battle Controls</h3>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">
                  {room.players.length < 2 
                    ? 'Waiting for more players to join...'
                    : !room.players.every(player => player.isReady)
                    ? 'All players must be ready to start the battle'
                    : 'Ready to start the battle!'
                  }
                </p>
              </div>
              
              <button
                onClick={startBattle}
                disabled={!canStartBattle}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Start Battle
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Export the protected version as default
export default function ProtectedRoomPage() {
  return (
    <ProtectedRoute>
      <RoomPage />
    </ProtectedRoute>
  );
}
