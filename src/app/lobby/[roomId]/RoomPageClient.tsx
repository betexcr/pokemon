'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import UserProfile from '@/components/auth/UserProfile';
import { Users, Copy, Check } from 'lucide-react';

interface RoomData {
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

interface RoomPageClientProps {
  roomId: string;
}

export default function RoomPageClient({ roomId }: RoomPageClientProps) {
  const { user } = useAuth();
  const router = useRouter();
  
  const [room, setRoom] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Mock room data for now - will be replaced with Firebase/Firestore
    const mockRoom: RoomData = {
      id: roomId,
      hostId: user?.uid || 'user1',
      hostName: user?.displayName || 'Trainer Red',
      status: 'waiting',
      createdAt: new Date(),
      maxPlayers: 2,
      currentPlayers: 1
    };
    
    setTimeout(() => {
      setRoom(mockRoom);
      setLoading(false);
    }, 1000);
  }, [roomId, user]);

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy room code:', error);
    }
  };

  const joinRoom = async () => {
    if (!user || !room) return;
    
    setJoining(true);
    try {
      // TODO: Join room in Firestore
      console.log('Joining room:', roomId);
      
      // For now, just update local state
      setRoom(prev => prev ? {
        ...prev,
        guestId: user.uid,
        guestName: user.displayName || 'Guest',
        currentPlayers: 2,
        status: 'ready'
      } : null);
    } catch (error) {
      console.error('Failed to join room:', error);
    } finally {
      setJoining(false);
    }
  };

  const startBattle = () => {
    // TODO: Start battle and redirect to battle runtime
    console.log('Starting battle for room:', roomId);
    router.push(`/battle/runtime?roomId=${roomId}`);
  };

  const isHost = user?.uid === room?.hostId;
  const isGuest = user?.uid === room?.guestId;
  const canJoin = !isHost && !isGuest && room && room.currentPlayers < room.maxPlayers;
  const canStart = isHost && room && room.currentPlayers === room.maxPlayers && room.status === 'ready';

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

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="text-gray-400 text-6xl mb-4">❌</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Room not found</h3>
              <p className="text-gray-600 mb-4">The room you&apos;re looking for doesn&apos;t exist or has been closed.</p>
              <button
                onClick={() => router.push('/lobby')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Back to Lobby
              </button>
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
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Room {roomId}</h2>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{room.currentPlayers}/{room.maxPlayers} players</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    room.status === 'waiting' ? 'text-yellow-600 bg-yellow-100' :
                    room.status === 'ready' ? 'text-green-600 bg-green-100' :
                    room.status === 'battling' ? 'text-red-600 bg-red-100' :
                    'text-gray-600 bg-gray-100'
                  }`}>
                    {room.status}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Room Code:</span>
                <code className="bg-gray-100 px-3 py-1 rounded font-mono text-sm">{roomId}</code>
                <button
                  onClick={copyRoomCode}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title="Copy room code"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4 text-gray-600" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Players */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Host */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">Host</h3>
                {isHost && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">You</span>}
              </div>
              <div className="text-sm text-gray-600">
                <p className="font-medium">{room.hostName}</p>
                <p className="text-gray-500">Ready to battle</p>
              </div>
            </div>

            {/* Guest */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">Guest</h3>
                {isGuest && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">You</span>}
              </div>
              {room.guestName ? (
                <div className="text-sm text-gray-600">
                  <p className="font-medium">{room.guestName}</p>
                  <p className="text-gray-500">Ready to battle</p>
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  <p>Waiting for player...</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-center">
            {canJoin && (
              <button
                onClick={joinRoom}
                disabled={joining}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                {joining ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Joining...</span>
                  </>
                ) : (
                  <span>Join Battle</span>
                )}
              </button>
            )}
            
            {canStart && (
              <button
                onClick={startBattle}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Start Battle
              </button>
            )}
            
            {room.status === 'battling' && (
              <button
                onClick={() => router.push(`/battle/runtime?roomId=${roomId}`)}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Enter Battle
              </button>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How to Play</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start space-x-3">
              <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">1</span>
              <p>Share the room code with a friend or wait for someone to join</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">2</span>
              <p>Make sure you have a team saved in the Team Builder</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">3</span>
              <p>Once both players are ready, the host can start the battle</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">4</span>
              <p>Battle it out and see who&apos;s the better trainer!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
