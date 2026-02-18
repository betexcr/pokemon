'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import UserDropdown from '@/components/UserDropdown';
import { roomService, type RoomData } from '@/lib/roomService';
import { getUserTeams, type SavedTeam } from '@/lib/userTeams';
import { hasFirebaseClientConfig } from '@/lib/firebase/client';
import { cleanupAllRooms } from '@/lib/cleanupRooms';
import { ChevronDown, Shield, Users } from 'lucide-react';

export default function LobbyPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [userTeams, setUserTeams] = useState<SavedTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [cleaningUp, setCleaningUp] = useState(false);
  const firebaseAvailable = hasFirebaseClientConfig;

  // Load rooms from Firebase
  useEffect(() => {
    if (!user || !firebaseAvailable) {
      setLoading(false);
      return;
    }

    const unsubscribe = roomService.onRoomsChange((rooms) => {
      setRooms(rooms);
      setLoading(false);
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
        }
      }
    }
    loadTeams();
  }, [user]);

  // Ensure page starts at top when lobby loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const createRoom = async () => {
    if (!firebaseAvailable) {
      alert('Multiplayer battles require Firebase configuration.');
      return;
    }
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
        selectedTeam // Pass the full team object
      );
      
      console.log('Created room with ID:', roomId);
      
      // Redirect to the room
      router.push(`/lobby/${roomId}`);
    } catch (error) {
      console.error('Failed to create room:', error);
      alert('Failed to create room. Please try again.');
    } finally {
      setCreatingRoom(false);
    }
  };

  const joinRoom = async (roomId: string) => {
    if (!firebaseAvailable) {
      alert('Multiplayer battles require Firebase configuration.');
      return;
    }
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
      // We need to pass the team when joining. 
      // roomService.joinRoom signature: (roomId, guestId, guestName, guestPhotoURL, guestTeam)
      await roomService.joinRoom(
        roomId,
        user.uid,
        user.displayName || 'Anonymous Trainer',
        user.photoURL || null,
        selectedTeam
      );
      router.push(`/lobby/${roomId}`);
    } catch (error) {
      console.error('Failed to join room:', error);
      alert('Failed to join room. Please try again.');
    }
  };

  const handleCleanup = async () => {
    if (!firebaseAvailable) {
      alert('Multiplayer battles require Firebase configuration.');
      return;
    }
    if (!user) return;
    
    setCleaningUp(true);
    try {
      await cleanupAllRooms();
      alert('All rooms have been cleaned up successfully!');
    } catch (error) {
      console.error('Failed to cleanup rooms:', error);
      alert('Failed to cleanup rooms. Please try again.');
    } finally {
      setCleaningUp(false);
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
      case 'waiting': return 'text-yellow-600 bg-yellow-100';
      case 'ready': return 'text-green-600 bg-green-100';
      case 'battling': return 'text-red-600 bg-red-100';
      case 'finished': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (!firebaseAvailable) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4 text-center">
        <div className="text-5xl">⚠️</div>
        <p className="text-lg font-semibold text-text">Multiplayer lobby unavailable</p>
        <p className="max-w-md text-sm text-muted-foreground">
          Firebase credentials are missing. Add your project keys to the environment to enable online battles.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading battle lobbies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* PokéDex Header */}
      <div className="bg-surface border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/')}
                className="text-poke-blue hover:text-poke-blue/80 transition-colors flex items-center space-x-2"
              >
                <span>←</span>
                <span>Back to PokéDex</span>
              </button>
              <h1 className="text-2xl font-bold text-text">PokéDex - Battle Lobby</h1>
            </div>
            <UserDropdown />
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-full">
        <div className="container mx-auto px-4 py-8">
          
        {/* Team Selection & Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="w-full md:w-auto flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Battle Preparation</h2>
              <p className="text-gray-600 mb-4">Select your team and start a battle</p>
              
              <div className="relative max-w-md">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Team</label>
                <div className="relative">
                  <select
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    className="block w-full pl-3 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg border bg-gray-50"
                  >
                    <option value="" disabled>Select a team...</option>
                    {userTeams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name} ({team.slots.length} Pokémon)
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
                {userTeams.length === 0 && (
                  <p className="mt-2 text-sm text-red-500">
                    You don't have any teams yet! Go to the Team Builder to create one.
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <button
                onClick={handleCleanup}
                disabled={cleaningUp}
                className="w-full sm:w-auto bg-red-100 hover:bg-red-200 text-red-700 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
              >
                {cleaningUp ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                ) : (
                  <Shield className="h-4 w-4" />
                )}
                <span>Clean Rooms</span>
              </button>
              
              <button
                onClick={createRoom}
                disabled={creatingRoom || !selectedTeamId}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
              >
                {creatingRoom ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Users className="h-5 w-5" />
                    <span>Create Room</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Available Rooms */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Available Battle Rooms</h2>
          
          {rooms.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
              <div className="text-gray-300 text-6xl mb-4">⚔️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms available</h3>
              <p className="text-gray-500">Be the first to create a battle room!</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow bg-gray-50/50"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {room.hostPhotoURL ? (
                        <img src={room.hostPhotoURL} alt={room.hostName} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border-2 border-white shadow-sm">
                          {room.hostName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium text-gray-900">{room.hostName}</h3>
                        <p className="text-xs text-gray-500">Host</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(room.status)}`}>
                      {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="space-y-3 text-sm text-gray-600 mb-5 bg-white p-3 rounded-lg border border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5" />
                        Players
                      </span>
                      <span className="font-medium">{room.currentPlayers}/{room.maxPlayers}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Created</span>
                      <span>{formatTimeAgo(room.createdAt)}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => joinRoom(room.id)}
                    disabled={room.status !== 'waiting' || room.currentPlayers >= room.maxPlayers || !selectedTeamId}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2.5 px-4 rounded-lg font-medium transition-colors shadow-sm"
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
      </div>
    </div>
  );
}
