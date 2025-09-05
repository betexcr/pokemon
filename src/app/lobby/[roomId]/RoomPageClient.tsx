'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import UserProfile from '@/components/auth/UserProfile';
import TeamSelector from '@/components/TeamSelector';
import Chat from '@/components/Chat';
import { Users, Copy, Check, MessageCircle } from 'lucide-react';
import type { SavedTeam } from '@/lib/userTeams';
import Image from 'next/image';
import { roomService, type RoomData } from '@/lib/roomService';

// Local storage team type (simpler version)
interface LocalTeam {
  id: string;
  name: string;
  slots: Array<{ id: number | null; level: number; moves: unknown[] }>;
}

// Function to get Pokemon image URL
const getPokemonImageUrl = (pokemonId: number | null): string => {
  if (!pokemonId) return '/placeholder-pokemon.png';
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`;
};

// RoomData is now imported from roomService

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
  const [selectedTeam, setSelectedTeam] = useState<SavedTeam | LocalTeam | null>(null);
  const [showChat, setShowChat] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Listen to room changes in real-time
    const unsubscribe = roomService.onRoomChange(roomId, (room) => {
      if (room) {
        setRoom(room);
        setLoading(false);
      } else {
        // Room doesn't exist or was deleted
        setLoading(false);
        router.push('/lobby');
      }
    });

    return () => unsubscribe();
  }, [roomId, user, router]);

  // Cleanup when user leaves the room
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (user && room) {
        roomService.leaveRoom(roomId, user.uid);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (user && room) {
        roomService.leaveRoom(roomId, user.uid);
      }
    };
  }, [user, room, roomId]);

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
    if (!user || !room || !selectedTeam) return;
    
    setJoining(true);
    try {
      await roomService.joinRoom(
        roomId,
        user.uid,
        user.displayName || 'Anonymous Trainer',
        selectedTeam
      );
      console.log('Successfully joined room:', roomId);
    } catch (error) {
      console.error('Failed to join room:', error);
      alert('Failed to join room. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  const handleTeamSelect = (team: SavedTeam | LocalTeam | null) => {
    setSelectedTeam(team);
    
    // Update room data with selected team
    if (room && user) {
      const isHost = user.uid === room.hostId;
      const isGuest = user.uid === room.guestId;
      
      setRoom(prev => prev ? {
        ...prev,
        ...(isHost && { hostTeam: team || undefined }),
        ...(isGuest && { guestTeam: team || undefined })
      } : null);
    }
  };

  const startBattle = async () => {
    if (!selectedTeam || !room) {
      alert('Please select a team before starting the battle!');
      return;
    }
    
    try {
      // Generate a unique battle ID
      const battleId = `battle_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      
      // Update room status to battling and set battle ID
      await roomService.startBattle(roomId, battleId);
      
      console.log('Starting battle for room:', roomId, 'with team:', selectedTeam);
      router.push(`/battle/runtime?roomId=${roomId}&teamId=${selectedTeam.id}&battleId=${battleId}`);
    } catch (error) {
      console.error('Failed to start battle:', error);
      alert('Failed to start battle. Please try again.');
    }
  };

  const isHost = Boolean(user?.uid && room?.hostId && user.uid === room.hostId) as boolean;
  const isGuest = Boolean(user?.uid && room?.guestId && user.uid === room.guestId) as boolean;
  const canJoin = !isHost && !isGuest && room && room.currentPlayers < room.maxPlayers;
  const canStart = isHost && room && room.currentPlayers === room.maxPlayers && room.status === 'ready';
  
  // TODO: Re-enable team selectors once TypeScript issues are resolved
  // For now, we'll show a simple message instead

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

          {/* Players and Team Selection */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Host */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">Host</h3>
                {isHost && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">You</span>}
              </div>
              <div className="text-sm text-gray-600 mb-4">
                <p className="font-medium">{room.hostName}</p>
                <p className="text-gray-500">Ready to battle</p>
              </div>
              
              {/* Team Selector for Host - Temporarily disabled */}
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600">Team selector temporarily disabled</p>
              </div>
              
              {/* Display Host Team */}
              {Boolean(room.hostTeam && !isHost) && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm">
                    <div className="font-medium text-blue-900 mb-2">{(room.hostTeam as any)?.name || 'Host Team'}</div>
                    
                    {/* Pokemon Roster Images */}
                    <div className="flex -space-x-1 mb-2">
                      {(room.hostTeam as any)?.slots?.slice(0, 6).map((slot: any, index: number) => (
                        <div
                          key={index}
                          className="relative w-8 h-8 rounded-full border-2 border-white bg-gray-100 overflow-hidden"
                        >
                          {slot.id ? (
                            <Image
                              src={getPokemonImageUrl(slot.id)}
                              alt={`Pokemon ${slot.id}`}
                              fill
                              className="object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/placeholder-pokemon.png';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="text-blue-700">
                      {room.hostTeam.slots.filter(slot => slot.id).length} Pokémon selected
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Guest */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">Guest</h3>
                {isGuest && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">You</span>}
              </div>
              {room.guestName ? (
                <>
                  <div className="text-sm text-gray-600 mb-4">
                    <p className="font-medium">{room.guestName}</p>
                    <p className="text-gray-500">Ready to battle</p>
                  </div>
                  
                  {/* Team Selector for Guest - Temporarily disabled */}
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600">Team selector temporarily disabled</p>
                  </div>
                  
                  {/* Display Guest Team */}
                  {Boolean(room.guestTeam && !isGuest) && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg">
                      <div className="text-sm">
                        <div className="font-medium text-green-900 mb-2">{(room.guestTeam as any)?.name || 'Guest Team'}</div>
                        
                        {/* Pokemon Roster Images */}
                        <div className="flex -space-x-1 mb-2">
                          {(room.guestTeam as any)?.slots?.slice(0, 6).map((slot: any, index: number) => (
                            <div
                              key={index}
                              className="relative w-8 h-8 rounded-full border-2 border-white bg-gray-100 overflow-hidden"
                            >
                              {slot.id ? (
                                <Image
                                  src={getPokemonImageUrl(slot.id)}
                                  alt={`Pokemon ${slot.id}`}
                                  fill
                                  className="object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = '/placeholder-pokemon.png';
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        <div className="text-green-700">
                          {room.guestTeam.slots.filter(slot => slot.id).length} Pokémon selected
                        </div>
                      </div>
                    </div>
                  )}
                </>
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
                disabled={!selectedTeam}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                {selectedTeam ? 'Start Battle' : 'Select Team First'}
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

        {/* Chat Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <MessageCircle className="h-5 w-5" />
              <span>Room Chat</span>
            </h3>
            <button
              onClick={() => setShowChat(!showChat)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              {showChat ? 'Hide Chat' : 'Show Chat'}
            </button>
          </div>
          
          {showChat && (
            <Chat 
              roomId={roomId}
              className="max-h-96"
            />
          )}
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
              <p>Select your team from the dropdown above (create teams in the Team Builder first)</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">3</span>
              <p>Use the chat to communicate with your opponent</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">4</span>
              <p>Once both players have selected teams, the host can start the battle</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">5</span>
              <p>Battle it out and see who&apos;s the better trainer!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
