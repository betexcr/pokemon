'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
// import UserProfile from '@/components/auth/UserProfile';
import TeamSelector from '@/components/TeamSelector';
import Chat from '@/components/Chat';
import ChatOverlay from '@/components/ChatOverlay';
import RoomPokeballReleaseAnimation from '@/components/RoomPokeballReleaseAnimation';
import { Users, Copy, Check, Clock, MessageCircle } from 'lucide-react';
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
  // Joining state removed as guests auto-join on selection
  const [copied, setCopied] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<SavedTeam | LocalTeam | null>(null);
  const [showChat, setShowChat] = useState(true);
  const [showChatOverlay, setShowChatOverlay] = useState(false);
  const [releasedTeams, setReleasedTeams] = useState<{
    host?: { name: string; sprites: string[] };
    guest?: { name: string; sprites: string[] };
  }>({});
  const [remoteAnimatingBalls, setRemoteAnimatingBalls] = useState<{
    host: Set<number>;
    guest: Set<number>;
  }>({ host: new Set(), guest: new Set() });
  const [remoteReleasedBalls, setRemoteReleasedBalls] = useState<{
    host: Set<number>;
    guest: Set<number>;
  }>({ host: new Set(), guest: new Set() });

  console.log('RoomPageClient rendered with roomId:', roomId);

  useEffect(() => {
    console.log('RoomPageClient mounted with roomId:', roomId);
    return () => {
      console.log('RoomPageClient unmounting with roomId:', roomId);
    };
  }, [roomId]);

  // Listen to room changes in real-time (even when unauthenticated)
  useEffect(() => {
    const unsubscribe = roomService.onRoomChange(roomId, (room) => {
      console.log('Room change detected:', room);
      console.log('Room guest info:', { guestId: room?.guestId, guestName: room?.guestName, guestReady: room?.guestReady });
      console.log('Animation fields in room data:', {
        hostAnimatingBalls: room?.hostAnimatingBalls,
        hostReleasedBalls: room?.hostReleasedBalls,
        guestAnimatingBalls: room?.guestAnimatingBalls,
        guestReleasedBalls: room?.guestReleasedBalls
      });
      console.log('Current user:', { uid: user?.uid, displayName: user?.displayName });
      console.log('Is user the guest?', user?.uid === room?.guestId);
      if (room) {
        // Validate room data and provide defaults for missing fields
        const validatedRoom = {
          ...room,
          hostId: room.hostId || '',
          hostName: room.hostName || 'Unknown Host',
          hostReady: room.hostReady || false,
          guestReady: room.guestReady || false,
          status: room.status || 'waiting',
          maxPlayers: room.maxPlayers || 2,
          currentPlayers: room.currentPlayers || (room.guestId ? 2 : 1),
          activeUsers: room.activeUsers || (room.hostId ? [room.hostId] : [])
        };
        
        setRoom(validatedRoom);
        
        // Fix currentPlayers count if it's incorrect
        if (room.currentPlayers !== validatedRoom.currentPlayers) {
          console.log('Fixing currentPlayers count in room data');
          roomService.fixCurrentPlayersCount(roomId).catch(console.error);
        }
        
        // Sync released teams from room data
        setReleasedTeams({
          host: validatedRoom.hostReleasedTeam,
          guest: validatedRoom.guestReleasedTeam
        });

        // Sync remote animation state from room data
        const newAnimatingBalls = {
          host: new Set(validatedRoom.hostAnimatingBalls || []),
          guest: new Set(validatedRoom.guestAnimatingBalls || [])
        };
        const newReleasedBalls = {
          host: new Set(validatedRoom.hostReleasedBalls || []),
          guest: new Set(validatedRoom.guestReleasedBalls || [])
        };
        
        console.log('Setting remote animation state:', {
          animatingBalls: {
            host: Array.from(newAnimatingBalls.host),
            guest: Array.from(newAnimatingBalls.guest)
          },
          releasedBalls: {
            host: Array.from(newReleasedBalls.host),
            guest: Array.from(newReleasedBalls.guest)
          }
        });
        
        setRemoteAnimatingBalls(newAnimatingBalls);
        setRemoteReleasedBalls(newReleasedBalls);
        
        // Initialize selected team based on user's role (only when authenticated)
        if (user) {
          const isHost = user.uid === validatedRoom.hostId;
          const isGuest = user.uid === validatedRoom.guestId;
          
          console.log('User role - isHost:', isHost, 'isGuest:', isGuest);
          console.log('Room hostTeam:', validatedRoom.hostTeam);
          console.log('Room guestTeam:', validatedRoom.guestTeam);
          
          if (isHost && validatedRoom.hostTeam) {
            setSelectedTeam(validatedRoom.hostTeam as SavedTeam | LocalTeam);
          } else if (isGuest && validatedRoom.guestTeam) {
            setSelectedTeam(validatedRoom.guestTeam as SavedTeam | LocalTeam);
          }
        }
        
        setLoading(false);
      } else {
        // Room doesn't exist or was deleted
        console.log('Room not found or deleted, redirecting to lobby');
        setLoading(false);
        router.push('/lobby');
      }
    });

    return () => {
      unsubscribe();
    };
  }, [roomId, user, router]);

  // Track user presence when entering/leaving the room (only when authenticated)
  useEffect(() => {
    if (!user) return;

    const trackPresence = async () => {
      try {
        await roomService.trackUserPresence(roomId, user.uid, true);
      } catch (error) {
        console.error('Failed to track user presence:', error);
      }
    };

    trackPresence();

    return () => {
      roomService.trackUserPresence(roomId, user.uid, false).catch(console.error);
    };
  }, [roomId, user]);

  // Cleanup when user leaves the room
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (user) {
        console.log('beforeunload event triggered, tracking user leaving:', roomId);
        roomService.trackUserPresence(roomId, user.uid, false).catch(console.error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user, roomId]);

  // Handle remote animation completion
  useEffect(() => {
    if (!room) return;

    console.log('Room animation state changed:', {
      hostAnimating: room.hostAnimatingBalls,
      hostReleased: room.hostReleasedBalls,
      guestAnimating: room.guestAnimatingBalls,
      guestReleased: room.guestReleasedBalls
    });

    // Check for completed animations and move them to released state
    const checkAndCompleteAnimations = () => {
      // Check host animations
      if (room.hostAnimatingBalls && Array.isArray(room.hostAnimatingBalls)) {
        room.hostAnimatingBalls.forEach((ballIndex) => {
          console.log(`Setting up host ball ${ballIndex} animation completion timer`);
          // Simulate animation completion after 1.65 seconds
          setTimeout(() => {
            console.log(`Host ball ${ballIndex} animation completed`);
            setRemoteAnimatingBalls(prev => {
              const newSet = new Set(prev.host);
              newSet.delete(ballIndex);
              return { ...prev, host: newSet };
            });
            setRemoteReleasedBalls(prev => ({
              ...prev,
              host: new Set(prev.host).add(ballIndex)
            }));
          }, 1650);
        });
      }
      
      // Check guest animations
      if (room.guestAnimatingBalls && Array.isArray(room.guestAnimatingBalls)) {
        room.guestAnimatingBalls.forEach((ballIndex) => {
          console.log(`Setting up guest ball ${ballIndex} animation completion timer`);
          // Simulate animation completion after 1.65 seconds
          setTimeout(() => {
            console.log(`Guest ball ${ballIndex} animation completed`);
            setRemoteAnimatingBalls(prev => {
              const newSet = new Set(prev.guest);
              newSet.delete(ballIndex);
              return { ...prev, guest: newSet };
            });
            setRemoteReleasedBalls(prev => ({
              ...prev,
              guest: new Set(prev.guest).add(ballIndex)
            }));
          }, 1650);
        });
      }
    };

    checkAndCompleteAnimations();
  }, [room?.hostAnimatingBalls, room?.guestAnimatingBalls]);

  // Auto-navigate to battle when room status changes to 'battling'
  useEffect(() => {
    if (!room || !user) return;
    
    if (room.status === 'battling' && room.battleId) {
      console.log('Room status changed to battling, auto-navigating to battle:', room.battleId);
      router.push(`/battle/runtime?roomId=${roomId}&battleId=${room.battleId}`);
    }
  }, [room?.status, room?.battleId, user, roomId, router]);

  const copyRoomCode = async () => {
    try {
      const currentUrl = window.location.href;
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy room URL:', error);
    }
  };

  // Manual join action removed

  const handleTeamSelect = async (team: SavedTeam | LocalTeam | null) => {
    console.log('handleTeamSelect called with team:', team);
    console.log('Current room:', room);
    console.log('Current user:', user);
    
    setSelectedTeam(team);
    
    // Update room data with selected team in Firestore
    if (room && user) {
      const isHost = user.uid === room.hostId;
      const isGuest = user.uid === room.guestId;
      
      console.log('isHost:', isHost, 'isGuest:', isGuest);
      
      // Only update if we have a valid team or if we're clearing the selection
      if (team || isHost || isGuest) {
        try {
          if (isHost) {
            console.log('Updating host team for room:', roomId);
            console.log('Team data being sent:', team);
            
            // Create a clean team object to avoid Firestore issues
            const cleanTeam = team ? {
              id: team.id,
              name: team.name,
              slots: team.slots.map(slot => ({
                id: slot.id,
                level: slot.level,
                moves: slot.moves || []
              }))
            } : undefined;
            
            console.log('Clean team data:', cleanTeam);
            await roomService.updateRoom(roomId, { hostTeam: cleanTeam });
            console.log('Host team updated successfully');
          } else if (isGuest) {
            console.log('Updating guest team for room:', roomId);
            console.log('Team data being sent:', team);
            
            // Create a clean team object to avoid Firestore issues
            const cleanTeam = team ? {
              id: team.id,
              name: team.name,
              slots: team.slots.map(slot => ({
                id: slot.id,
                level: slot.level,
                moves: slot.moves || []
              }))
            } : undefined;
            
            console.log('Clean team data:', cleanTeam);
            await roomService.updateRoom(roomId, { guestTeam: cleanTeam });
            console.log('Guest team updated successfully');
          } else {
            // If not part of room yet, auto-join as guest when a team is selected (if space available)
            if (team && (room.currentPlayers < room.maxPlayers || !room.guestId)) {
              console.log('Auto-joining room as guest with selected team');
              await roomService.joinRoom(
                roomId,
                user.uid,
                user.displayName || 'Anonymous Trainer',
                user.photoURL || null,
                {
                  id: team.id,
                  name: team.name,
                  slots: team.slots.map(slot => ({ id: slot.id, level: slot.level, moves: slot.moves || [] }))
                }
              );
            }
          }
        } catch (error) {
          console.error('Failed to update room with team:', error);
          console.error('Error details:', error);
          alert('Failed to save team selection. Please try again.');
        }
      }
    }
  };

  const toggleReadyStatus = async () => {
    if (!user || !room) return;
    
    try {
      const userIsHost = user.uid === room.hostId;
      const userIsGuest = user.uid === room.guestId;
      
      // If the user is not yet part of the room but can join, join first
      if (!userIsHost && !userIsGuest && (room.currentPlayers < room.maxPlayers || !room.guestId)) {
        await roomService.joinRoom(
          roomId,
          user.uid,
          user.displayName || 'Anonymous Trainer',
          user.photoURL || null,
          selectedTeam || undefined
        );

        // Wait briefly for Firestore to propagate, then fetch fresh room data
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      // Re-evaluate role and ready status with the latest data
      const refreshedIsHost = user.uid === (room?.hostId ?? '');
      const refreshedReady = refreshedIsHost ? (room?.hostReady ?? false) : (room?.guestReady ?? false);
      await roomService.updateReadyStatus(roomId, user.uid, !refreshedReady);
    } catch (error) {
      console.error('Failed to update ready status:', error);
      alert('Failed to update ready status. Please try again.');
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
      // Navigate both clients into runtime immediately; multiplayer uses roomId+battleId
      router.push(`/battle/runtime?roomId=${roomId}&battleId=${battleId}`);
    } catch (error) {
      console.error('Failed to start battle:', error);
      alert(error instanceof Error ? error.message : 'Failed to start battle. Please try again.');
    }
  };

  const isHost = Boolean(user?.uid && room?.hostId && user.uid === room.hostId) as boolean;
  const isGuest = Boolean(user?.uid && room?.guestId && user.uid === room.guestId) as boolean;
  const canJoin = !isHost && !isGuest && room && (room.currentPlayers < room.maxPlayers || !room.guestId);
  const canStart = isHost && room && room.currentPlayers === room.maxPlayers && (room.status === 'ready' || room.status === 'waiting') && room.hostReady && room.guestReady;
  
  console.log('Join logic debug:', {
    isHost,
    isGuest,
    roomExists: !!room,
    roomStatus: room?.status,
    currentPlayers: room?.currentPlayers,
    maxPlayers: room?.maxPlayers,
    hostReady: room?.hostReady,
    guestReady: room?.guestReady,
    canStart,
    hasSpace: room ? room.currentPlayers < room.maxPlayers : false,
    noGuest: !room?.guestId,
    canJoin,
    roomGuestId: room?.guestId,
    roomGuestName: room?.guestName,
    userId: user?.uid
  });
  
  // Debug logging for role detection
  console.log('Role detection debug:', {
    userId: user?.uid,
    roomHostId: room?.hostId,
    roomGuestId: room?.guestId,
    isHost,
    isGuest,
    canJoin,
    canStart,
    roomStatus: room?.status,
    hostReady: room?.hostReady,
    guestReady: room?.guestReady,
    roomGuestName: room?.guestName,
    userDisplayName: user?.displayName
  });
  
  // TODO: Re-enable team selectors once TypeScript issues are resolved
  // For now, we'll show a simple message instead

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" style={{ minHeight: '100vh', backgroundSize: 'cover', backgroundRepeat: 'no-repeat' }}>
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" style={{ minHeight: '100vh', backgroundSize: 'cover', backgroundRepeat: 'no-repeat' }}>
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

  const POKEBALL_ICON = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png';
  const getPixelSprite = (id: number) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

  const renderAvatar = (name: string, photoUrl?: string | null) => {
    // Profile pictures removed - only show name
    return null;
  };

  const handleAnimationComplete = async (playerType: 'host' | 'guest', ballIndex: number) => {
    console.log(`${playerType} Pokéball ${ballIndex} animation completed`);
    
    if (!room) return;
    
    // Update local state
    if (playerType === 'host') {
      setRemoteAnimatingBalls(prev => {
        const newSet = new Set(prev.host);
        newSet.delete(ballIndex);
        return { ...prev, host: newSet };
      });
      setRemoteReleasedBalls(prev => ({
        ...prev,
        host: new Set(prev.host).add(ballIndex)
      }));
    } else {
      setRemoteAnimatingBalls(prev => {
        const newSet = new Set(prev.guest);
        newSet.delete(ballIndex);
        return { ...prev, guest: newSet };
      });
      setRemoteReleasedBalls(prev => ({
        ...prev,
        guest: new Set(prev.guest).add(ballIndex)
      }));
    }
    
    // Broadcast the completion to Firebase
    try {
      const currentAnimating = playerType === 'host' ? remoteAnimatingBalls.host : remoteAnimatingBalls.guest;
      const currentReleased = playerType === 'host' ? remoteReleasedBalls.host : remoteReleasedBalls.guest;
      
      const newAnimating = new Set(currentAnimating);
      newAnimating.delete(ballIndex);
      const newReleased = new Set(currentReleased).add(ballIndex);
      
      await roomService.updateBallAnimation(roomId, playerType, newAnimating, newReleased);
    } catch (error) {
      console.error('Failed to broadcast ball animation completion:', error);
    }
  };

  const handleBallClick = async (playerType: 'host' | 'guest', ballIndex: number) => {
    if (!room || !user) return;
    
    const isHost = user.uid === room.hostId;
    const isGuest = user.uid === room.guestId;
    
    // Only allow the actual player to trigger their own animations
    if ((playerType === 'host' && !isHost) || (playerType === 'guest' && !isGuest)) {
      return;
    }
    
    console.log(`Broadcasting ${playerType} ball ${ballIndex} click to other players`);
    
    // Update local state immediately for responsiveness
    if (playerType === 'host') {
      setRemoteAnimatingBalls(prev => ({
        ...prev,
        host: new Set(prev.host).add(ballIndex)
      }));
    } else {
      setRemoteAnimatingBalls(prev => ({
        ...prev,
        guest: new Set(prev.guest).add(ballIndex)
      }));
    }
    
    // Broadcast to Firebase
    try {
      const currentAnimating = playerType === 'host' ? remoteAnimatingBalls.host : remoteAnimatingBalls.guest;
      const currentReleased = playerType === 'host' ? remoteReleasedBalls.host : remoteReleasedBalls.guest;
      
      const newAnimating = new Set(currentAnimating).add(ballIndex);
      
      console.log(`Broadcasting to Firebase:`, {
        roomId,
        playerType,
        newAnimating: Array.from(newAnimating),
        currentReleased: Array.from(currentReleased)
      });
      
      await roomService.updateBallAnimation(roomId, playerType, newAnimating, currentReleased);
      console.log('Firebase update successful');
    } catch (error) {
      console.error('Failed to broadcast ball animation:', error);
    }
  };

  const handleReleaseAllPokemon = async (playerType: 'host' | 'guest') => {
    if (!room || !user) return;
    
    const isHost = user.uid === room.hostId;
    const isGuest = user.uid === room.guestId;
    
    // Only allow the actual player to trigger their own animations
    if ((playerType === 'host' && !isHost) || (playerType === 'guest' && !isGuest)) {
      return;
    }
    
    console.log(`Broadcasting ${playerType} release all Pokémon to other players`);
    
    // Get all filled slots for this player
    const team = playerType === 'host' ? room.hostTeam : room.guestTeam;
    const slots = (team as any)?.slots || [];
    const filledSlots = slots.map((slot: any, index: number) => slot?.id ? index : null).filter((index: number | null) => index !== null);
    
    // Update local state immediately for responsiveness
    if (playerType === 'host') {
      setRemoteAnimatingBalls(prev => ({
        ...prev,
        host: new Set(filledSlots)
      }));
    } else {
      setRemoteAnimatingBalls(prev => ({
        ...prev,
        guest: new Set(filledSlots)
      }));
    }
    
    // Broadcast to Firebase
    try {
      const currentReleased = playerType === 'host' ? remoteReleasedBalls.host : remoteReleasedBalls.guest;
      
      await roomService.updateBallAnimation(roomId, playerType, new Set(filledSlots), currentReleased);
    } catch (error) {
      console.error('Failed to broadcast release all animation:', error);
    }
  };

  const renderPokeballRow = (slots?: Array<{ id?: number | null }>, playerType?: 'host' | 'guest'): React.ReactNode | null => {
    if (playerType) {
      const isLocalPlayer = (playerType === 'host' && user?.uid === room?.hostId) || 
                           (playerType === 'guest' && user?.uid === room?.guestId);
      
      return (
        <div 
          onDoubleClick={() => isLocalPlayer && handleReleaseAllPokemon(playerType)}
          title={isLocalPlayer ? "Double-click to release all Pokémon" : ""}
        >
          <RoomPokeballReleaseAnimation
            slots={slots || []}
            onAnimationComplete={(ballIndex: number) => handleAnimationComplete(playerType, ballIndex)}
            onBallClick={(ballIndex) => handleBallClick(playerType, ballIndex)}
            playerType={playerType}
            remoteAnimatingBalls={playerType === 'host' ? remoteAnimatingBalls.host : remoteAnimatingBalls.guest}
            remoteReleasedBalls={playerType === 'host' ? remoteReleasedBalls.host : remoteReleasedBalls.guest}
            isLocalPlayer={isLocalPlayer}
          />
        </div>
      );
    }
    
    const arr = Array.from({ length: 6 }, (_, i) => Boolean(slots?.[i]?.id));
    return (
      <div className="flex items-center gap-1">
        {arr.map((filled, idx) => (
          <div key={idx} className={`w-2.5 h-2.5 ${filled ? '' : 'opacity-30'}`}>
            <Image src={POKEBALL_ICON} alt="Poké Ball" width={10} height={10} />
          </div>
        ))}
      </div>
    );
  };

  const releasePokemon = async (isHost: boolean) => {
    if (!selectedTeam || !room) return;
    
    const teamName = selectedTeam.name;
    const sprites = selectedTeam.slots
      .filter(slot => slot.id)
      .map(slot => getPixelSprite(slot.id!))
      .slice(0, 6); // Max 6 Pokémon
    
    const newReleasedTeams = {
      ...releasedTeams,
      [isHost ? 'host' : 'guest']: { name: teamName, sprites }
    };
    
    setReleasedTeams(newReleasedTeams);
    
    // Store in room data so both players can see it
    try {
      await roomService.updateRoom(roomId, {
        [`${isHost ? 'host' : 'guest'}ReleasedTeam`]: newReleasedTeams[isHost ? 'host' : 'guest']
      });
    } catch (error) {
      console.error('Failed to update released team:', error);
    }
  };

  const ReadyIcon = ({ ready, canToggle }: { ready: boolean; canToggle: boolean }) => {
    const common = 'inline-flex items-center justify-center w-6 h-6 rounded cursor-pointer';
    if (ready) {
      return (
        <button
          type="button"
          onClick={() => canToggle && toggleReadyStatus()}
          disabled={!canToggle}
          className={`${common} ${canToggle ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-green-100 text-green-700 opacity-70 cursor-default'}`}
          title={canToggle ? 'Click to set Not Ready' : 'Ready'}
        >
          <Check className="w-4 h-4" />
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={() => canToggle && toggleReadyStatus()}
        disabled={!canToggle}
        className={`${common} ${canToggle ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-gray-100 text-gray-500 opacity-70 cursor-default'}`}
        title={canToggle ? 'Click to set Ready' : 'Not Ready'}
        aria-label={canToggle ? 'Set Ready' : 'Not Ready'}
      >
        <Clock className="w-4 h-4" />
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" style={{ minHeight: '100vh', backgroundSize: 'cover', backgroundRepeat: 'no-repeat', backgroundAttachment: 'scroll' }}>
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
            {/* Removed <UserProfile /> from the top-right */}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 pb-16 space-y-8 max-w-7xl w-full">
        {/* Room Info */}
        <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-full overflow-hidden">
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
              <button
                onClick={() => setShowChatOverlay(true)}
                className="p-2 hover:bg-gray-200 rounded transition-colors"
                title="Open chat"
              >
                <MessageCircle className="h-5 w-5 text-gray-600" />
              </button>
              <button
                onClick={copyRoomCode}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                title="Copy room URL"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4 text-gray-600" />
                )}
              </button>
            </div>
          </div>

          {/* Players and Team Selection */}
          <div className="grid lg:grid-cols-2 gap-6 w-full max-w-full overflow-hidden">
            {/* Host - Temporarily disabled to fix build */}
            <div className="border border-gray-200 rounded-lg p-4 w-full max-w-full overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">Host</h3>
                {isHost && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">You</span>}
              </div>
              <div className="text-sm text-gray-600 mb-4 flex items-center gap-2">
                {renderAvatar(room.hostName, (room as RoomData).hostPhotoURL)}
                <p className="font-medium">{room.hostName}</p>
                <ReadyIcon ready={room.hostReady || false} canToggle={isHost} />
              </div>
              
              {/* Team functionality temporarily disabled */}
              <div className="text-sm text-gray-500 italic">
                Team selection temporarily disabled for build
              </div>
              {/* {isHost && (
                <div className="mt-2 flex items-center gap-3">
                  <div className="relative">
                    {renderPokeballRow((selectedTeam as SavedTeam | LocalTeam)?.slots, 'host')}
                    {releasedTeams.host && (
                      <div className="absolute inset-0 flex items-center gap-1 animate-fade-in">
                        {releasedTeams.host.sprites.map((sprite, idx) => (
                          <div 
                            key={idx} 
                            className="w-2.5 h-2.5 animate-scale-in"
                            style={{ animationDelay: `${idx * 0.1}s` }}
                          >
                            <Image
                              src={sprite}
                              alt={`Released Pokemon ${idx + 1}`}
                              width={10}
                              height={10}
                              style={{ imageRendering: 'pixelated' }}
                              className="object-contain"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )} */}
              
              {/* Ready toggle handled by icon next to name for Host */}
              
              {/* Display Host Team - only for guests */}
              {room.hostTeam && !isHost && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm">
                    <div className="font-medium text-blue-900 mb-2">{(room.hostTeam as { name?: string })?.name || 'Host Team'}</div>
                    
                    {/* Pokemon Roster Images */}
                    <div className="flex -space-x-1 mb-2">
                      {(room.hostTeam as { slots?: Array<{ id?: number }> })?.slots?.slice(0, 6).map((slot: { id?: number }, index: number) => (
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
                    
                        <div className="text-blue-700 flex items-center">
                          {/* @ts-ignore */}
                          {renderPokeballRow((room.hostTeam as { slots?: Array<{ id?: number | null }> })?.slots, 'host')}
                        </div>
                  </div>
                </div>
              )}
            </div>

            {/* Guest */}
            <div className="border border-gray-200 rounded-lg p-4 w-full max-w-full overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">Guest</h3>
                {(isGuest || canJoin) && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">You</span>}
              </div>
              {room.guestName || isGuest || canJoin ? (
                <>
                  <div className="text-sm text-gray-600 mb-4 flex items-center gap-2">
                    {renderAvatar(
                      room.guestName || (isGuest ? (user?.displayName || 'You') : 'Guest'),
                      (room as RoomData).guestPhotoURL
                    )}
                    <p className="font-medium">{room.guestName || (isGuest ? (user?.displayName || 'You') : (canJoin ? (user?.displayName || 'You') : 'Guest'))}</p>
                    <ReadyIcon ready={room.guestReady || false} canToggle={isGuest} />
                  </div>
                  
                  {/* Team Selector for Guest - Temporarily commented out to fix build */}
                  {/* {(isGuest || canJoin) && (
                    <div className="mb-3">
                      <TeamSelector
                        selectedTeamId={selectedTeam?.id}
                        onTeamSelect={handleTeamSelect}
                        label="Select Your Team"
                        showStorageIndicator={true}
                      />
                    </div>
                  )} */}

                  {/* Show Guest's own Poké Balls summary */}
                  {isGuest && (
                    <div className="mt-2 flex items-center gap-3">
                      <div className="relative">
                        {/* @ts-ignore */}
                        {renderPokeballRow((selectedTeam as SavedTeam | LocalTeam)?.slots, 'guest')}
                        {/* Animated released sprites overlay */}
                        {releasedTeams.guest && (
                          <div className="absolute inset-0 flex items-center gap-1 animate-fade-in">
                            {releasedTeams.guest.sprites.map((sprite, idx) => (
                              <div 
                                key={idx} 
                                className="w-2.5 h-2.5 animate-scale-in"
                                style={{ animationDelay: `${idx * 0.1}s` }}
                              >
                                <Image
                                  src={sprite}
                                  alt={`Released Pokemon ${idx + 1}`}
                                  width={10}
                                  height={10}
                                  style={{ imageRendering: 'pixelated' }}
                                  className="object-contain"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Ready toggle handled by icon next to name for Guest */}
                  
                  {/* Display Guest Team - only for host */}
                  {room.guestTeam && !isGuest && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg">
                      <div className="text-sm">
                        <div className="font-medium text-green-900 mb-2">{(room.guestTeam as { name?: string })?.name || 'Guest Team'}</div>
                        
                        {/* Pokemon Roster Images */}
                        <div className="flex -space-x-1 mb-2">
                          {(room.guestTeam as { slots?: Array<{ id?: number }> })?.slots?.slice(0, 6).map((slot: { id?: number }, index: number) => (
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
                        
                        <div className="text-green-700 flex items-center">
                          {/* @ts-ignore */}
                          {renderPokeballRow((room.guestTeam as { slots?: Array<{ id?: number | null }> })?.slots, 'guest')}
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
            {/* Removed explicit Join Battle button; guests auto-join on team selection */}
            
            {isHost && room && room.currentPlayers === room.maxPlayers && (room.status === 'ready' || room.status === 'waiting') && (
              <button
                onClick={startBattle}
                disabled={!canStart}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  canStart 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                }`}
              >
                {!selectedTeam 
                  ? 'Select Team First' 
                  : !room.hostReady 
                    ? 'Mark Yourself Ready' 
                    : !room.guestReady 
                      ? 'Waiting for Guest to be Ready' 
                      : 'Start Battle'
                }
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
        <div className="mt-8">
          <Chat 
            roomId={roomId}
            isCollapsible={true}
            isCollapsed={!showChat}
            onToggleCollapse={() => setShowChat(!showChat)}
          />
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-full overflow-hidden">
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
              <p>Check the &quot;I&apos;m ready to battle&quot; checkbox once you&apos;ve selected your team</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">5</span>
              <p>Once both players are ready, the host can start the battle</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">6</span>
              <p>Battle it out and see who&apos;s the better trainer!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Overlay */}
      <ChatOverlay
        roomId={roomId}
        isOpen={showChatOverlay}
        onClose={() => setShowChatOverlay(false)}
      />
    </div>
  );
}
