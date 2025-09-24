'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
// import UserProfile from '@/components/auth/UserProfile';
import AppHeader from '@/components/AppHeader';
import TeamSelector from '@/components/TeamSelector';
import Chat from '@/components/Chat';
import ChatOverlay from '@/components/ChatOverlay';
import RoomPokeballReleaseAnimation from '@/components/RoomPokeballReleaseAnimation';
import BattleStartDialog from '@/components/BattleStartDialog';
import FirebaseErrorDebugger from '@/components/FirebaseErrorDebugger';
import ForfeitDialog from '@/components/ForfeitDialog';
import LobbyTransition from '@/components/battle/LobbyTransition';
import TrainerRoster from '@/components/battle/TrainerRoster';
import { GYM_CHAMPIONS } from '@/lib/gym_champions';
import { Users, Copy, MessageCircle, Bug, Check, Swords, Bot } from 'lucide-react';
import type { SavedTeam } from '@/lib/userTeams';
import Image from 'next/image';
import { roomService, type RoomData } from '@/lib/roomService';
import { useBattleErrorLogger } from '@/hooks/useFirebaseErrorLogger';

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
  console.log('🏠 RoomPageClient component rendering for roomId:', roomId);
  const { user } = useAuth();
  console.log('🏠 RoomPageClient auth state:', { hasUser: !!user, userId: user?.uid });
  const router = useRouter();
  const { logBattleError, logRoomError, getErrorSummary } = useBattleErrorLogger();
  
  const [room, setRoom] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);
  // Joining state removed as guests auto-join on selection
  const [copied, setCopied] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<SavedTeam | LocalTeam | null>(null);
  const [showChat, setShowChat] = useState(true);
  const [showChatOverlay, setShowChatOverlay] = useState(false);
  const [lobbyTransitionKey, setLobbyTransitionKey] = useState(0);
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
  const [showBattleStartDialog, setShowBattleStartDialog] = useState(false);
  const [showErrorDebugger, setShowErrorDebugger] = useState(false);
  const [opponentForfeit, setOpponentForfeit] = useState<null | { name: string; isRoomFinished?: boolean }>(null);
  const [roomInitialized, setRoomInitialized] = useState(false);
  // AI Battle mode state
  const [battleMode, setBattleMode] = useState<'multiplayer' | 'ai'>('multiplayer');
  const [selectedAIOpponent, setSelectedAIOpponent] = useState<string>('');
  const [generationFilter, setGenerationFilter] = useState<string>('');
  const [showAITooltip, setShowAITooltip] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  // Prevent cleanup when we intentionally navigate to battle runtime
  const [navigatingToBattle, setNavigatingToBattle] = useState(false);
  // Prevent double-start
  const [startInProgress, setStartInProgress] = useState(false);
  // Synchronous guard to avoid stale state in cleanup closures during navigation
  const navigatingToBattleRef = useRef(false);
  // Grace period after battle begins to suppress redirects/cleanup
  const battleGraceUntilRef = useRef<number>(0);
  // Prevent duplicate battle creation/navigation when status flips to battling
  const creatingBattleRef = useRef(false);
  // Guard to only clear loading once on first snapshot to avoid update loops
  const firstSnapshotSeenRef = useRef(false);
  // Track last processed snapshot to avoid redundant state updates
  const lastSnapshotJsonRef = useRef<string>('');
  // Presence guard to avoid repeated writes causing flicker
  const presenceRegisteredRef = useRef<{ roomId: string; uid: string } | null>(null);
  const presenceWriteTimerRef = useRef<number | null>(null);

  console.log('RoomPageClient rendered with roomId:', roomId);

  useEffect(() => {
    console.log('RoomPageClient mounted with roomId:', roomId);
    return () => {
      console.log('RoomPageClient unmounting with roomId:', roomId);
    };
  }, [roomId]);

  // Trigger lobby transition on mount
  useEffect(() => {
    setLobbyTransitionKey(Date.now());
  }, []);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle browser back/close for host cleanup
  useEffect(() => {
    if (!user?.uid || !room?.hostId || user.uid !== room.hostId) return;

    const handleBeforeUnload = () => {
      // Use navigator.sendBeacon for reliable cleanup on page unload
      if (typeof navigator.sendBeacon === 'function') {
        const data = new FormData();
        data.append('roomId', roomId);
        data.append('userId', user.uid);
        data.append('action', 'leaveRoom');
        
        // In a real app, you'd send this to an API endpoint
        // For now, we'll use the synchronous approach
        console.log('🏁 Host leaving - room should be finished');
      }
    };

    // NOTE: Do not perform cleanup on visibilitychange; quick tab switches during tests/dev
    // can cause transient presence drops (1/2 -> 2/2 flicker). We rely on presence tracking
    // and explicit navigation/unmount cleanup instead.
    const handleVisibilityChange = () => {
      if (navigatingToBattle) return;
      // Intentionally no cleanup on visibility hidden to avoid flicker
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [roomId, user?.uid, room?.hostId, navigatingToBattle]);

  // Cleanup on component unmount (covers browser back button)
  useEffect(() => {
    return () => {
      if (navigatingToBattleRef.current || navigatingToBattle) return; // skip cleanup when moving to battle
      // Also skip if battle is already in progress or created
      if (room?.status === 'battling' || room?.battleId) return;
      // Skip cleanup during Next.js Fast Refresh/dev HMR to avoid finishing rooms during test reloads
      try {
        // @ts-ignore
        const isDevHmr = process.env.NODE_ENV !== 'production' && typeof window !== 'undefined' && ((window as any).__NEXT_HMR || (window as any).__NEXT_DEV_HOT);
        if (isDevHmr) {
          console.log('🏁 Skipping room cleanup on unmount (dev hot refresh)');
          return;
        }
      } catch {}
      if (user?.uid && room?.hostId && user.uid === room.hostId) {
        // Component is unmounting (navigation away)
        roomService.leaveRoom(roomId, user.uid).catch(error => {
          console.error('Failed to finish room on component unmount:', error);
        });
        console.log('🏁 Room finished due to host component unmounting');
      }
    };
  }, [roomId, user?.uid, room?.hostId, navigatingToBattle]);

  // Listen to room changes in real-time (even when unauthenticated)
  useEffect(() => {
    const unsubscribe = roomService.onRoomChange(roomId, (snapshot) => {
      console.log('Room change detected:', snapshot);
      console.log('Room guest info:', { guestId: snapshot?.guestId, guestName: snapshot?.guestName, guestReady: snapshot?.guestReady });
      console.log('Animation fields in room data:', {
        hostAnimatingBalls: snapshot?.hostAnimatingBalls,
        hostReleasedBalls: snapshot?.hostReleasedBalls,
        guestAnimatingBalls: snapshot?.guestAnimatingBalls,
        guestReleasedBalls: snapshot?.guestReleasedBalls
      });
      console.log('Current user:', { uid: user?.uid, displayName: user?.displayName });
      console.log('Is user the guest?', user?.uid === snapshot?.guestId);
      console.log('Is user the host?', user?.uid === snapshot?.hostId);
      console.log('Room status and ready states:', {
        status: snapshot?.status,
        hostReady: snapshot?.hostReady,
        guestReady: snapshot?.guestReady,
        currentPlayers: snapshot?.currentPlayers,
        maxPlayers: snapshot?.maxPlayers,
        battleId: snapshot?.battleId
      });
      
        // If room doesn't exist (was deleted), redirect to main lobby
        if (!snapshot) {
          // Suppress redirect during grace window (guest entering, host navigating)
          if (battleGraceUntilRef.current && Date.now() < battleGraceUntilRef.current) {
            console.log('⏳ Suppressing lobby redirect (grace window active)');
            return;
          }
          if (navigatingToBattleRef.current || navigatingToBattle) {
            console.log('🏁 Snapshot missing during battle navigation, suppressing lobby redirect');
            return;
          }
          console.log('🏁 Room does not exist, redirecting to main lobby');
          setLoading(false);
          // Show a brief message before redirecting
          setOpponentForfeit({ name: 'This lobby no longer exists', isRoomFinished: true });
          // Redirect to main lobby after a short delay
          setTimeout(() => {
            router.push('/lobby');
          }, 2000);
          return;
        }
      
      if (snapshot) {
        // Validate room data and provide defaults for missing fields
        const validatedRoom = {
          ...snapshot,
          hostId: snapshot.hostId || '',
          hostName: snapshot.hostName || 'Unknown Host',
          hostReady: snapshot.hostReady || false,
          guestReady: snapshot.guestReady || false,
          status: snapshot.status || 'waiting',
          maxPlayers: snapshot.maxPlayers || 2,
          currentPlayers: snapshot.currentPlayers || (snapshot.guestId ? 2 : 1),
          activeUsers: snapshot.activeUsers || (snapshot.hostId ? [snapshot.hostId] : [])
        };
        
        // Ensure loading spinner clears only on the first snapshot
        if (!firstSnapshotSeenRef.current) {
          firstSnapshotSeenRef.current = true;
          if (loading) {
            setLoading(false);
          }
        }
        
        // Skip updates if nothing meaningful changed to avoid render loops
        const nextSignature = JSON.stringify({
          hostId: validatedRoom.hostId,
          guestId: validatedRoom.guestId,
          status: validatedRoom.status,
          currentPlayers: validatedRoom.currentPlayers,
          maxPlayers: validatedRoom.maxPlayers,
          hostTeam: validatedRoom.hostTeam,
          guestTeam: validatedRoom.guestTeam,
          hostAnimatingBalls: validatedRoom.hostAnimatingBalls,
          guestAnimatingBalls: validatedRoom.guestAnimatingBalls,
          hostReleasedBalls: validatedRoom.hostReleasedBalls,
          guestReleasedBalls: validatedRoom.guestReleasedBalls,
          battleId: validatedRoom.battleId
        });
        if (lastSnapshotJsonRef.current === nextSignature) {
          return;
        }
        lastSnapshotJsonRef.current = nextSignature;
        
        // Detect opponent leaving: if we were guest and host disappears, or we were host and guest disappears
        // Only show forfeit if we were previously in a room with both players and now one is missing
        if (user && room && roomInitialized) {
          const wasGuest = user.uid === (validatedRoom.guestId || '');
          const wasHost = user.uid === (validatedRoom.hostId || '');
          
          // Only check for forfeit if we were previously part of the room and had an opponent
          const hadOpponent = (room.guestId && room.hostId) || (room.currentPlayers >= 2);
          const opponentLeft = hadOpponent && ((wasHost && !validatedRoom.guestId) || (wasGuest && !validatedRoom.hostId));
          
          if (opponentLeft) {
            setOpponentForfeit({ name: wasHost ? (validatedRoom.guestName || 'Opponent') : (validatedRoom.hostName || 'Opponent') });
          }
        }

        // If room is finished, just show a banner; don't auto-redirect to avoid churn during joins
        if (validatedRoom.status === 'finished') {
          setOpponentForfeit({ name: 'This lobby has already finished', isRoomFinished: true });
        }

        setRoom(validatedRoom);
        
        // Mark room as initialized after first load with a small delay
        if (!roomInitialized) {
          setTimeout(() => {
            setRoomInitialized(true);
          }, 1000); // 1 second delay to ensure room is fully loaded
        }
        
        // Avoid auto-fixing currentPlayers here to prevent write loops from stale state
        
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
        // Only track presence once the user is a participant (host/guest)
        const current = room;
        const isParticipant = Boolean(user && current && (user.uid === current.hostId || user.uid === current.guestId));
        if (!isParticipant) return;
        // Debounce and de-dupe presence writes to avoid loops
        const key = { roomId, uid: user.uid };
        const already = presenceRegisteredRef.current;
        if (already && already.roomId === key.roomId && already.uid === key.uid) {
          return;
        }
        presenceRegisteredRef.current = key;
        if (presenceWriteTimerRef.current) {
          clearTimeout(presenceWriteTimerRef.current);
        }
        presenceWriteTimerRef.current = window.setTimeout(async () => {
          try {
            await roomService.trackUserPresence(roomId, user.uid, true);
          } catch (e) {
            // If write fails, allow retry on next effect
            presenceRegisteredRef.current = null;
          }
        }, 200);
      } catch (error) {
        console.error('Failed to track user presence:', error);
      }
    };

    trackPresence();

    return () => {
      // Only write presence on exit if user is a participant
      const current = room;
      const isParticipant = Boolean(user && current && (user.uid === current.hostId || user.uid === current.guestId));
      if (!isParticipant) return;
      // Cancel pending debounced write
      if (presenceWriteTimerRef.current) {
        clearTimeout(presenceWriteTimerRef.current);
        presenceWriteTimerRef.current = null;
      }
      roomService.trackUserPresence(roomId, user.uid, false).catch(console.error).finally(() => {
        presenceRegisteredRef.current = null;
      });
    };
  }, [roomId, user, room]);

  // Cleanup when user leaves the room
  useEffect(() => {
    const handleBeforeUnload = () => {
      const current = room;
      const uid = user?.uid;
      const isParticipant = Boolean(uid && current && (uid === current.hostId || uid === current.guestId));
      // Do not mark user as leaving if we're navigating into the battle or already battling
      if ((navigatingToBattleRef.current || navigatingToBattle) || current?.status === 'battling' || (battleGraceUntilRef.current && Date.now() < battleGraceUntilRef.current)) {
        return;
      }
      if (isParticipant && uid) {
        console.log('beforeunload event triggered, tracking user leaving:', roomId);
        roomService.trackUserPresence(roomId, uid, false).catch(console.error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user, roomId, room, navigatingToBattle]);

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

  // When room flips to 'battling' and has a battleId, show the start dialog for both players.
  // Navigation happens only when the user confirms the dialog.
  useEffect(() => {
    if (!room || !user) return;
    console.log('🔍 Room status check:', { 
      roomStatus: room.status, 
      hasBattleId: !!room.battleId, 
      battleId: room.battleId,
      showBattleStartDialog,
      userId: user.uid,
      isHost: user.uid === room.hostId,
      isGuest: user.uid === room.guestId
    });
    if (room.status === 'battling' && room.battleId && !showBattleStartDialog) {
      console.log('Room status is battling; opening BattleStartDialog with battleId:', room.battleId);
      
      // For guest, navigate directly to battle instead of opening dialog
      if (user.uid === room.guestId) {
        console.log('🔗 Guest auto-navigating to battle from room status change');
        handleBattleStart().catch((e) => console.error('Guest auto-navigation failed:', e));
        return;
      }
      
      // For host, open the dialog
      setShowBattleStartDialog(true);
      // Extend grace while battling starts
      battleGraceUntilRef.current = Math.max(battleGraceUntilRef.current, Date.now() + 5000);
    }
  }, [room?.status, room?.battleId, user]);


  const copyRoomCode = async () => {
    try {
      // Set navigation guard so cleanup doesn't run while moving into battle
      markNavigating();
      const currentUrl = window.location.href;
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy room URL:', error);
    }
  };

  const handleBackClick = async () => {
    if (!user) {
      // If not authenticated, just navigate back
      router.push('/lobby');
      return;
    }

    try {
      // Leave the room properly (this will mark it as finished if user is host)
      await roomService.leaveRoom(roomId, user.uid);
      console.log('Successfully left room:', roomId);
    } catch (error) {
      console.error('Error leaving room:', error);
      // Continue with navigation even if cleanup fails
    }

    // Navigate back to lobby
    router.push('/lobby');
  };

  // Manual join as guest (deterministic for tests/UI)
  const handleJoinAsGuest = async () => {
    try {
      if (!user || !room) return;
      const userIsParticipant = user.uid === room.hostId || user.uid === room.guestId;
      if (userIsParticipant) return;
      if (room.guestId) return; // already taken
      if (!(room.status === 'waiting' || room.status === 'ready')) return;
      await roomService.joinRoom(
        roomId,
        user.uid,
        user.displayName || 'Anonymous Trainer',
        user.photoURL || null,
        selectedTeam || undefined
      );
    } catch (e) {
      console.error('Join as guest failed:', e);
    }
  };

  const handleTeamSelect = async (team: SavedTeam | LocalTeam | null) => {
    console.log('=== TEAM SELECTION DEBUG ===');
    console.log('handleTeamSelect called with team:', team);
    console.log('Team type:', typeof team);
    console.log('Team structure:', JSON.stringify(team, null, 2));
    console.log('Current room:', room);
    console.log('Current user:', user);
    console.log('User UID:', user?.uid);
    console.log('Room hostId:', room?.hostId);
    console.log('Room guestId:', room?.guestId);
    
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
            } : null;
            
            // Validate team data before sending
            if (!cleanTeam || !cleanTeam.id || !cleanTeam.name || !cleanTeam.slots || cleanTeam.slots.length === 0) {
              console.error('Invalid team data:', cleanTeam);
              alert('Invalid team data. Please select a valid team.');
              return;
            }
            
            console.log('Clean team data:', cleanTeam);
            console.log('=== HOST TEAM UPDATE DEBUG ===');
            console.log('Host UID:', user?.uid);
            console.log('Team being set:', cleanTeam);
            console.log('Team name:', cleanTeam?.name);
            console.log('Team slots:', cleanTeam?.slots?.map(s => ({ id: s.id, level: s.level })));
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
            } : null;
            
            // Validate team data before sending
            if (!cleanTeam || !cleanTeam.id || !cleanTeam.name || !cleanTeam.slots || cleanTeam.slots.length === 0) {
              console.error('Invalid team data:', cleanTeam);
              alert('Invalid team data. Please select a valid team.');
              return;
            }
            
            console.log('Clean team data:', cleanTeam);
            console.log('=== GUEST TEAM UPDATE DEBUG ===');
            console.log('Guest UID:', user?.uid);
            console.log('Team being set:', cleanTeam);
            console.log('Team name:', cleanTeam?.name);
            console.log('Team slots:', cleanTeam?.slots?.map(s => ({ id: s.id, level: s.level })));
            await roomService.updateRoom(roomId, { guestTeam: cleanTeam });
            console.log('Guest team updated successfully');
          } else {
            // If not part of room yet, auto-join as guest only when guest slot is empty
            if (team && !room.guestId && !isHost && !isGuest && (room.status === 'waiting' || room.status === 'ready')) {
              console.log('Auto-joining room as guest with selected team');
              try {
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
              } catch (joinError) {
                console.error('Failed to auto-join room:', joinError);
                // Don't show error alert for auto-join failures, just log them
                // The user can manually join if needed
              }
            }
          }
        } catch (error) {
          console.error('Failed to update room with team:', error);
          console.error('Error details:', error);
          
          // Don't show error alert for specific cases that are handled gracefully
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage.includes('Room is full') || 
              errorMessage.includes('already has a guest') ||
              errorMessage.includes('already in the room') ||
              errorMessage.includes('User not authenticated') ||
              errorMessage.includes('User ID mismatch') ||
              errorMessage.includes('Room not found')) {
            console.log('Room error handled gracefully:', errorMessage);
            return; // Don't show error alert
          }
          
          // Only show alert for unexpected errors
          console.error('Unexpected error during team selection:', errorMessage);
          alert(`Failed to save team selection: ${errorMessage}`);
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
      if (!userIsHost && !userIsGuest && !room.guestId && (room.status === 'waiting' || room.status === 'ready')) {
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
    // Prevent multiple simultaneous battle starts
    if (navigatingToBattleRef.current || navigatingToBattle) {
      console.log('Battle start already in progress, skipping...');
      return;
    }
    
    if (!selectedTeam || !room) {
      alert('Please select a team before starting the battle!');
      setStartInProgress(false);
      return;
    }
    
    // Ensure both teams are present before starting battle
    if (!room.hostTeam || !room.guestTeam) {
      alert('Both players must select their teams before starting the battle!');
      setStartInProgress(false);
      return;
    }
    // Ensure both players are present (2/2) regardless of ready flags
    if (room.currentPlayers !== room.maxPlayers) {
      alert('Both players must be present in the room before starting the battle!');
      setStartInProgress(false);
      return;
    }
    
    // Check if both teams are identical (prevent same team battles)
    // More robust comparison that handles different property orders
    const normalizeTeam = (team: any) => {
      if (!team || !Array.isArray(team)) return team;
      return team.map(pokemon => ({
        id: pokemon.id,
        level: pokemon.level,
        moves: pokemon.moves ? pokemon.moves.sort((a: any, b: any) => a.name.localeCompare(b.name)) : []
      })).sort((a, b) => a.id - b.id);
    };
    
    const normalizedHostTeam = normalizeTeam(room.hostTeam);
    const normalizedGuestTeam = normalizeTeam(room.guestTeam);
    const teamsAreIdentical = JSON.stringify(normalizedHostTeam) === JSON.stringify(normalizedGuestTeam);
    
    if (teamsAreIdentical) {
      alert('Both players have selected the same team! Please ensure each player selects a different team before starting the battle.');
      console.error('🚨 PREVENTION: Both players selected identical teams');
      console.error('Host team:', normalizedHostTeam);
      console.error('Guest team:', normalizedGuestTeam);
      return;
    }
    
    try {
      // Guard cleanup and create battle first to obtain battleId, then mark room battling
      markNavigating();
      // Show start dialog immediately so both players see it while battle initializes
      console.log('🎯 Host setting showBattleStartDialog to true');
      setShowBattleStartDialog(true);
      console.log('✅ Host showBattleStartDialog should now be true');
      // Start grace window (7s) to avoid any redirect/cleanup while both clients sync
      battleGraceUntilRef.current = Date.now() + 7000;
      console.log('✅ Teams and presence confirmed, creating battle...');
      await handleBattleStart();
      // handleBattleStart will navigate and also set navigating guard
    } catch (error) {
      console.error('Failed to start battle:', error);
      setStartInProgress(false);
      navigatingToBattleRef.current = false;
      setNavigatingToBattle(false);
      
      // Log detailed error information
      logBattleError(error as Error, 'start_battle', {
        roomId,
        battleId: `battle_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        userId: user?.uid,
        userEmail: user?.email,
        hasSelectedTeam: !!selectedTeam,
        roomStatus: room?.status,
        operation: 'roomService.startBattle'
      });
      
      alert(error instanceof Error ? error.message : 'Failed to start battle. Please try again.');
    }
  };

  const handleBattleStart = useCallback(async () => {
    if (!user || !room) {
      console.error('❌ Missing user or room data');
      throw new Error('Missing user or room data');
    }
    
    const isHost = Boolean(user?.uid && room?.hostId && user.uid === room.hostId);
    const role = isHost ? 'host' : 'guest';
    
    console.log('🚀 Starting battle with:', { isHost, role, roomId });
    
    // If guest, just navigate to existing battle (host creates it)
    if (!isHost) {
      if (!room.battleId) {
        throw new Error('Battle not available yet. Please wait for host.');
      }
      try {
        const params = new URLSearchParams({
          roomId: roomId,
          battleId: room.battleId,
          role: role,
          isHost: isHost.toString(),
          userId: user.uid,
          userName: user.displayName || 'Anonymous'
        });
        const battleUrl = `/battle/runtime?${params.toString()}`;
        console.log('🔗 Guest navigating to battle:', battleUrl);
        markNavigating();
        router.push(battleUrl);
        return;
      } catch (error) {
        console.error('❌ Guest failed to enter battle:', error);
        throw error;
      }
    }

    // Host path: create battle
    const hostTeam = room.hostTeam as SavedTeam | LocalTeam | null;
    const guestTeam = room.guestTeam as SavedTeam | LocalTeam | null;
    if (!hostTeam || !guestTeam) {
      console.error('❌ Missing team data:', { hostTeam: !!hostTeam, guestTeam: !!guestTeam });
      throw new Error('Both players must select their teams before starting the battle!');
    }
    
    console.log('📋 Team data:', { 
      hostTeamSlots: hostTeam.slots?.length, 
      guestTeamSlots: guestTeam.slots?.length 
    });
    
    try {
      // Import the Cloud Function
      const { httpsCallable } = await import('firebase/functions');
      const { functions } = await import('@/lib/firebase');
      if (!functions) {
        throw new Error('Cloud Functions are unavailable. Firebase configuration is missing.');
      }
      
      // Convert team data to the format expected by the Cloud Function
      const convertTeamToPokemon = (team: SavedTeam | LocalTeam): any[] => {
        return team.slots
          .filter(slot => slot.id !== null)
          .map(slot => ({
            species: `pokemon-${slot.id}`, // Convert to species name format
            level: slot.level || 50,
            types: [], // Will be populated by the Cloud Function
            stats: { hp: 100, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 }, // Will be populated by the Cloud Function
            item: '',
            ability: '',
            moves: (slot.moves || []).map((move: any) => ({
              id: move.id || 'tackle',
              pp: move.pp || 35
            })),
            status: null,
            fainted: false
          }));
      };
      
      const p1Team = convertTeamToPokemon(hostTeam);
      const p2Team = convertTeamToPokemon(guestTeam);
      
      console.log('🎮 Converted teams:', { 
        p1TeamLength: p1Team.length, 
        p2TeamLength: p2Team.length,
        p1Team: p1Team.map(p => p.species),
        p2Team: p2Team.map(p => p.species)
      });
      
      const createBattle = httpsCallable(functions, "createBattleWithTeams");
      const res: any = await createBattle({
        roomId: roomId,
        p1Uid: room.hostId,
        p2Uid: room.guestId,
        p1Team: p1Team,
        p2Team: p2Team
      });
      
      const battleId: string = res.data.battleId;
      
      console.log('✅ Battle created successfully:', battleId);
      
      // Mirror battle into Firestore if missing so UI that reads Firestore can find it
      try {
        const { doc, getDoc, setDoc, serverTimestamp } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');
        if (!db) {
          throw new Error('Firestore is unavailable. Firebase configuration is missing.');
        }
        const battleRef = doc(db, 'battles', battleId);
        const snap = await getDoc(battleRef);
        if (!snap.exists()) {
          console.log('🪞 Creating Firestore mirror for RTDB battle:', battleId);
          await setDoc(battleRef, {
            roomId: roomId,
            hostId: room.hostId,
            hostName: room.hostName || 'Host',
            hostTeam: hostTeam,
            guestId: room.guestId,
            guestName: room.guestName || 'Guest',
            guestTeam: guestTeam,
            currentTurn: 'host',
            turnNumber: 1,
            actions: [],
            battleData: null,
            status: 'waiting',
            phase: 'choice',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
        // Try to hydrate battleData from RTDB so runtime does not hang
        try {
          const { getDatabase, ref, get, child } = await import('firebase/database');
          const firebaseModule = await import('@/lib/firebase');
          const firebaseApp = firebaseModule.default;
          if (!firebaseApp) {
            console.warn('Realtime Database unavailable. Skipping battle hydration.');
          } else {
            const rtdb = getDatabase(firebaseApp);
            const battleNode = ref(rtdb, `/battles/${battleId}`);
            const dataSnap = await get(battleNode).catch(async () => await get(child(ref(rtdb), `battles/${battleId}`)));
            if (dataSnap.exists()) {
              const rtdbBattle = dataSnap.val();
              const initialState = rtdbBattle?.state || rtdbBattle?.battleData || null;
              const turnNumber = rtdbBattle?.turnNumber || 1;
              if (initialState) {
                console.log('🪄 Hydrating Firestore battleData from RTDB');
                const { updateDoc } = await import('firebase/firestore');
                await updateDoc(battleRef, {
                  battleData: initialState,
                  status: 'active',
                  turnNumber,
                  updatedAt: serverTimestamp()
                } as any);
              }
            }
          }
        } catch (hydrateErr) {
          console.warn('Could not hydrate Firestore battleData from RTDB (non-fatal):', hydrateErr);
        }
      } catch (mirrorErr) {
        console.warn('Failed to create Firestore mirror for battle (non-fatal):', mirrorErr);
      }
      
      // Add a small delay to ensure data is written to RTDB
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate to battle with the new battle ID
      const params = new URLSearchParams({
        roomId: roomId,
        battleId: battleId,
        role: role,
        isHost: isHost.toString(),
        userId: user.uid,
        userName: user.displayName || 'Anonymous'
      });
      
      // Update room to battling with battleId so both clients sync, then navigate
      try {
        await roomService.updateRoom(roomId, { status: 'battling', battleId });
      } catch (e) {
        console.warn('Non-fatal: failed to update room to battling before navigation:', e);
      }
      const battleUrl = `/battle/runtime?${params.toString()}`;
      console.log('🔗 Host navigating to battle:', battleUrl);
      markNavigating();
      router.push(battleUrl);
    } catch (error) {
      console.error('❌ Failed to start battle:', error);
      navigatingToBattleRef.current = false;
      setNavigatingToBattle(false);
      throw new Error(`Failed to start battle: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [user, room, roomId, router]);

  const isHost = Boolean(user && user.uid && room?.hostId && user.uid === room.hostId) as boolean;
  const isGuest = Boolean(user && user.uid && room?.guestId && user.uid === room.guestId) as boolean;

  // Fallback: if the start dialog is open with a valid battleId for a while, auto-enter (host only)
  useEffect(() => {
    if (!showBattleStartDialog || !room?.battleId || navigatingToBattleRef.current || navigatingToBattle || !isHost) return;
    const timer = setTimeout(() => {
      console.warn('⚠️ Battle start dialog timeout reached; auto-entering battle');
      handleBattleStart().catch((e) => console.error('Auto-enter battle failed:', e));
    }, 3000);
    return () => clearTimeout(timer);
  }, [showBattleStartDialog, room?.battleId, navigatingToBattle, isHost]);
  // Show join when guest slot is empty and user is not host/guest, regardless of currentPlayers (avoids flicker)
  const canJoin = Boolean(!isHost && !isGuest && room && !room.guestId && (room.status === 'waiting' || room.status === 'ready'));
  // Stable display count based on assignments, not presence/currentPlayers to avoid flicker
  const displayPlayers = (room?.hostId ? 1 : 0) + (room?.guestId ? 1 : 0);
  // Allow host to start when both teams are set, both players are present, and both marked ready
  const canStart = Boolean(
    isHost &&
    room &&
    room.currentPlayers === room.maxPlayers &&
    (room.status === 'ready' || room.status === 'waiting') &&
    room.hostTeam &&
    room.guestTeam &&
    room.hostReady &&
    room.guestReady
  );
  
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

  // E2E helper: auto-ready users and auto-start when both present (guarded by env)
  useEffect(() => {
    const isE2E = process.env.NEXT_PUBLIC_E2E === 'true';
    console.log('🤖 E2E auto-start effect triggered:', { isE2E, hasRoom: !!room, hasUser: !!user });
    if (!isE2E) return;
    if (!room || !user) return;
    const doWork = async () => {
      try {
        const { roomService } = await import('@/lib/roomService');
        // Auto mark ready for current user
        const myReady = user.uid === room.hostId ? room.hostReady : user.uid === room.guestId ? room.guestReady : false;
        const iAmHost = user.uid === room.hostId;
        const bothReady = !!room.hostReady && !!room.guestReady;
        const teamsPresent = !!room.hostTeam && !!room.guestTeam;
        
        console.log('🤖 E2E auto-start conditions:', {
          iAmHost,
          myReady,
          bothReady,
          teamsPresent,
          navigatingToBattle,
          navigatingRef: navigatingToBattleRef.current,
          hostTeam: !!room.hostTeam,
          guestTeam: !!room.guestTeam,
          hostReady: room.hostReady,
          guestReady: room.guestReady,
          roomStatus: room.status,
          currentPlayers: room.currentPlayers,
          maxPlayers: room.maxPlayers,
          hostTeamName: (room.hostTeam as any)?.name,
          guestTeamName: (room.guestTeam as any)?.name,
          roomId: room.id,
          hostId: room.hostId,
          guestId: room.guestId,
          myUid: user.uid
        });
        
        // Ensure user is in the room before updating ready status
        const userIsInRoom = user.uid === room.hostId || user.uid === room.guestId;
        if (!userIsInRoom && !iAmHost) {
          console.log('🤖 E2E guest not in room, joining first');
          try {
            await roomService.joinRoom(
              roomId,
              user.uid,
              user.displayName || 'Anonymous Trainer',
              user.photoURL || null,
              undefined // No team yet, will be selected later
            );
            console.log('🤖 E2E guest joined room successfully');
          } catch (joinError) {
            console.error('🤖 E2E failed to join room:', joinError);
            return; // Exit early if can't join
          }
        }
        
        if (!myReady) {
          console.log('🤖 E2E marking user as ready');
          await roomService.updateReadyStatus(roomId, user.uid, true);
          console.log('🤖 E2E ready status updated successfully');
        }
        
        // Auto-select teams if not present
        const myTeam = iAmHost ? room.hostTeam : room.guestTeam;
        if (!myTeam) {
          console.log('🤖 E2E auto-selecting team for user');
          // Get the first available team from Firestore (same as normal flow)
          try {
            const { getUserTeams } = await import('@/lib/userTeams');
            const teams = await getUserTeams(user.uid);
            if (teams.length > 0) {
              const firstTeam = teams[0];
              console.log('🤖 E2E selecting first available team:', firstTeam.name);
              await handleTeamSelect(firstTeam);
              console.log('🤖 E2E team selected successfully for:', iAmHost ? 'host' : 'guest');
              
              // For debugging, fetch fresh room data after team selection
              if (!iAmHost) {
                try {
                  const { roomService } = await import('@/lib/roomService');
                  const freshRoom = await roomService.getRoom(roomId);
                  console.log('🤖 E2E guest fresh room data after team selection:', {
                    hostReady: freshRoom?.hostReady,
                    guestReady: freshRoom?.guestReady,
                    hasHostTeam: !!freshRoom?.hostTeam,
                    hasGuestTeam: !!freshRoom?.guestTeam,
                    guestId: freshRoom?.guestId,
                    myUid: user.uid
                  });
                } catch (error) {
                  console.error('🤖 E2E guest failed to fetch fresh room data:', error);
                }
              }
            } else {
              console.log('🤖 E2E no teams available, cannot auto-select');
            }
          } catch (error) {
            console.error('🤖 E2E failed to fetch teams:', error);
          }
        }
        // Host auto-start when both ready and can start
        if (iAmHost) {
          // For host, fetch fresh room data to ensure we have the latest state
          try {
            // Add a small delay to allow guest updates to be committed
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const { roomService } = await import('@/lib/roomService');
            const freshRoom = await roomService.getRoom(roomId);
            if (freshRoom) {
              const freshBothReady = !!freshRoom.hostReady && !!freshRoom.guestReady;
              const freshTeamsPresent = !!freshRoom.hostTeam && !!freshRoom.guestTeam;
              
              console.log('🤖 E2E host fresh room data:', {
                freshBothReady,
                freshTeamsPresent,
                hostReady: freshRoom.hostReady,
                guestReady: freshRoom.guestReady,
                hasHostTeam: !!freshRoom.hostTeam,
                hasGuestTeam: !!freshRoom.guestTeam,
                navigatingToBattle,
                navigatingRef: navigatingToBattleRef.current
              });

              if (freshBothReady && freshTeamsPresent && !navigatingToBattleRef.current && !navigatingToBattle) {
                console.log('🤖 E2E host auto-start conditions met with fresh data, starting battle immediately...');
                console.log('🤖 E2E calling startBattle()');
                console.log('🤖 E2E user auth state before battle start:', {
                  hasUser: !!user,
                  uid: user?.uid,
                  email: user?.email,
                  isAnonymous: user?.isAnonymous
                });
                startBattle().catch((e) => {
                  console.error("E2E auto-start failed:", e);
                });
              } else {
                console.log('🤖 E2E host auto-start conditions NOT met with fresh data');
              }
            }
          } catch (error) {
            console.error('🤖 E2E failed to fetch fresh room data:', error);
            // Fallback to original logic
            if (bothReady && teamsPresent && !navigatingToBattleRef.current && !navigatingToBattle) {
              console.log('🤖 E2E host auto-start conditions met (fallback), starting battle immediately...');
              console.log('🤖 E2E calling startBattle()');
              startBattle().catch((e) => {
                console.error("E2E auto-start failed:", e);
              });
            } else {
              console.log('🤖 E2E host auto-start conditions NOT met (fallback):', {
                bothReady,
                teamsPresent,
                navigatingToBattle,
                navigatingRef: navigatingToBattleRef.current
              });
            }
          }
        }
      } catch (e) {
        console.error('🤖 E2E auto-start error:', e);
      }
    };
    doWork();
    
    // Set up a polling interval for E2E auto-start to ensure it runs frequently
    const pollInterval = setInterval(() => {
      if (process.env.NEXT_PUBLIC_E2E === 'true' && room && user) {
        doWork();
      }
    }, 1000); // Poll every second
    
    return () => {
      clearInterval(pollInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [process.env.NEXT_PUBLIC_E2E, user?.uid, roomId, room]);
  
  // Log the actual room object to see all properties
  console.log('Full room object:', room);

  // Additional debugging for Start Battle button visibility
  console.log('Start Battle button visibility check:', {
    isHost,
    roomExists: !!room,
    currentPlayers: room?.currentPlayers,
    maxPlayers: room?.maxPlayers,
    playersMatch: room ? room.currentPlayers === room.maxPlayers : false,
    statusReady: room?.status === 'ready',
    statusWaiting: room?.status === 'waiting',
    statusValid: room ? (room.status === 'ready' || room.status === 'waiting') : false,
    hostReady: room?.hostReady,
    guestReady: room?.guestReady,
    bothReady: room ? (room.hostReady && room.guestReady) : false,
    buttonVisible: isHost && room && room.currentPlayers === room.maxPlayers && (room.status === 'ready' || room.status === 'waiting'),
    buttonEnabled: canStart
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
      <div className="min-h-screen bg-bg text-text" style={{ minHeight: '100vh', backgroundSize: 'cover', backgroundRepeat: 'no-repeat' }}>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-muted">Loading room...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-bg text-text" style={{ minHeight: '100vh', backgroundSize: 'cover', backgroundRepeat: 'no-repeat' }}>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="text-muted text-6xl mb-4">❌</div>
              <h3 className="text-lg font-medium text-text mb-2">Room not found</h3>
              <p className="text-muted mb-4">The room you&apos;re looking for doesn&apos;t exist or has been closed.</p>
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
            onCatchComplete={async (ballIndex: number) => {
              // When catch completes, clear remote released/animating for this index
              try {
                const currentAnimating = playerType === 'host' ? remoteAnimatingBalls.host : remoteAnimatingBalls.guest
                const currentReleased = playerType === 'host' ? remoteReleasedBalls.host : remoteReleasedBalls.guest
                const newAnimating = new Set(currentAnimating)
                const newReleased = new Set(currentReleased)
                newAnimating.delete(ballIndex)
                newReleased.delete(ballIndex)
                await roomService.updateBallAnimation(roomId, playerType, newAnimating, newReleased)
              } catch (e) {
                console.error('Failed to sync catch completion:', e)
              }
            }}
          />
        </div>
      );
    }
    
    const arr = Array.from({ length: 6 }, (_, i) => Boolean(slots?.[i]?.id));
    return (
      <div className="flex items-center gap-3">
        {arr.map((filled, idx) => (
          <div key={idx} className={`w-8 h-8 ${filled ? '' : 'opacity-30'}`}>
            <Image src={POKEBALL_ICON} alt="Poké Ball" width={32} height={32} />
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
    if (ready) {
      return (
        <button
          type="button"
          onClick={() => canToggle && toggleReadyStatus()}
          disabled={!canToggle}
          className=""
          style={{ background: 'none', border: 'none', padding: 0, margin: 0 }}
          title={canToggle ? 'Click to set Not Ready' : 'Ready'}
          data-testid="ready-button"
        >
          <Image
            src="/header-icons/battle_ready_icon.png"
            alt="Ready"
            width={40}
            height={40}
            className=""
          />
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={() => canToggle && toggleReadyStatus()}
        disabled={!canToggle}
        className=""
        style={{ background: 'none', border: 'none', padding: 0, margin: 0 }}
        title={canToggle ? 'Click to set Ready' : 'Not Ready'}
        aria-label={canToggle ? 'Set Ready' : 'Not Ready'}
        data-testid="ready-button"
      >
        <Image
          src="/header-icons/battle_waiting_icon.png"
          alt="Waiting"
          width={40}
          height={40}
          className=""
        />
      </button>
    );
  };

  const markNavigating = () => { navigatingToBattleRef.current = true; setNavigatingToBattle(true); };

  // AI Battle functionality
  const startAIBattle = async () => {
    if (!selectedTeam || !selectedAIOpponent) {
      alert('Please select both your team and an AI opponent!');
      return;
    }

    const champion = GYM_CHAMPIONS.find(c => c.id === selectedAIOpponent);
    if (!champion) {
      alert('AI opponent not found. Please try again.');
      return;
    }

    try {
      // Store the selected team in localStorage for AI battle
      const currentTeamData = selectedTeam.slots.map(slot => ({
        id: slot.id,
        level: slot.level,
        moves: Array.isArray(slot.moves) ? slot.moves : [],
        nature: (slot as any).nature || 'hardy'
      }));
      localStorage.setItem('pokemon-current-team', JSON.stringify(currentTeamData));

      // Generate battle ID and navigate to AI battle
      const battleId = `ai_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const params = new URLSearchParams({
        battleId: battleId,
        player: selectedTeam.id,
        opponentKind: "champion",
        opponentId: champion.id,
      });
      
      const battleUrl = `/battle/runtime?${params.toString()}`;
      markNavigating();
      router.push(battleUrl);
    } catch (error) {
      console.error('Failed to start AI battle:', error);
      alert('Failed to start AI battle. Please try again.');
    }
  };

  const handleAIOpponentSelect = (championId: string) => {
    setSelectedAIOpponent(championId);
    setShowAITooltip(null);
  };

  const handleAIOpponentHover = (championId: string | null) => {
    if (!isMobile) {
      setShowAITooltip(championId);
    }
  };

  return (
    <LobbyTransition playKey={lobbyTransitionKey}>
      <div className="min-h-screen bg-bg text-text" style={{ minHeight: '100vh', backgroundSize: 'cover', backgroundRepeat: 'no-repeat', backgroundAttachment: 'scroll' }} data-testid="lobby-page">
      <AppHeader
        title="Battle Room"
        backLink="/lobby"
        backLabel="Back to Lobby"
        showToolbar={false}
        showThemeToggle={false}
        iconKey="battle"
        showIcon={true}
        rightContent={
          <button
            onClick={() => setShowErrorDebugger(true)}
            className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
            title="View Firebase Error Logs"
          >
            <Bug className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Debug Errors</span>
            <span className="sm:hidden">Debug</span>
          </button>
        }
      />

      <div className="container mx-auto px-4 py-8 pb-16 space-y-8 max-w-7xl w-full">
        {/* Room Info */}
        <div className="bg-surface border border-border rounded-xl shadow-lg p-6 w-full max-w-full overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-text mb-2">Room {roomId}</h2>
              <div className="flex items-center space-x-4 text-sm text-muted">
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{displayPlayers}/{room.maxPlayers} players</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold tracking-wide border ${
                    room.status === 'waiting' ? 'bg-yellow-700/25 text-yellow-100 border-yellow-600' :
                    room.status === 'ready' ? 'bg-green-700/25 text-green-100 border-green-600' :
                    room.status === 'battling' ? 'bg-red-700/25 text-red-100 border-red-600' :
                    'text-muted bg-surface border-border'
                  }`}>
                    {room.status}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 md:space-x-3">
              <button
                onClick={() => setShowChatOverlay(true)}
                className="p-1 md:p-2 hover:bg-gray-200 rounded transition-colors"
                title="Open chat"
              >
                <MessageCircle className="h-4 w-4 md:h-5 md:w-5 text-muted" />
              </button>
              {user?.uid === room.hostId && (
                <button
                  onClick={async () => {
                    if (!confirm('Delete this room?')) return;
                    try {
                      await roomService.deleteRoom(roomId);
                      router.push('/lobby');
                    } catch (err) {
                      console.error('Failed to delete room', err);
                      alert('Failed to delete room');
                    }
                  }}
                  className="px-2 py-1 rounded-md text-xs font-semibold bg-red-600/90 hover:bg-red-700 text-white border border-red-700"
                >
                  Delete
                </button>
              )}
              <button
                onClick={copyRoomCode}
                className="p-0.5 md:p-1 hover:bg-gray-200 rounded transition-colors"
                title="Copy room URL"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4 text-muted" />
                )}
              </button>
            </div>
          </div>

          {/* Battle Mode Selector */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-text mb-3">Battle Mode</h3>
            <div className="flex gap-4">
              <button
                onClick={() => setBattleMode('multiplayer')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  battleMode === 'multiplayer'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Multiplayer</span>
              </button>
              <button
                onClick={() => setBattleMode('ai')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  battleMode === 'ai'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Bot className="w-4 h-4" />
                <span>AI Battle</span>
              </button>
            </div>
          </div>

          {/* Players and Team Selection */}
          <div className="grid lg:grid-cols-2 gap-6 w-full max-w-full overflow-hidden">
            <div className="border border-gray-200 rounded-lg p-4 w-full max-w-full overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-text">Host</h3>
                {isHost && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">You</span>}
              </div>
              <div className="text-sm text-muted mb-4 flex items-center gap-2">
                {renderAvatar(room.hostName, (room as RoomData).hostPhotoURL)}
                <p className="font-medium">{room.hostName}</p>
                <ReadyIcon ready={room.hostReady || false} canToggle={isHost} />
              </div>

              {/* Host Poké Balls: always visible to both players (read-only for guest) */}
              <div className="mt-2 flex items-center gap-3">
                <div className="relative">
                  {renderPokeballRow(
                    (isHost
                      ? (selectedTeam as SavedTeam | LocalTeam)?.slots
                      : ((room.hostTeam as unknown as { slots?: Array<{ id?: number | null }> })?.slots)
                    ) as Array<{ id?: number | null }>,
                    'host'
                  )}
                  {releasedTeams.host && (
                    <div className="absolute inset-0 flex items-center gap-1 animate-fade-in">
                      {releasedTeams.host.sprites.map((sprite, idx) => (
                        <div 
                          key={idx} 
                          className="w-8 h-8 animate-scale-in"
                          style={{ animationDelay: `${idx * 0.1}s` }}
                        >
                          <Image src={sprite} alt="Released Pokemon" width={32} height={32} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {isHost && (
                  <div className="flex-1">
                    <TeamSelector
                      selectedTeamId={selectedTeam?.id}
                      onTeamSelect={handleTeamSelect}
                      label="Select Your Team"
                      showStorageIndicator={true}
                    />
                  </div>
                )}
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
              
              {/* Host team display temporarily disabled */}
            </div>

            {/* Guest / AI Opponent */}
            <div className="border border-gray-200 rounded-lg p-4 w-full max-w-full overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-text">
                  {battleMode === 'ai' ? 'AI Opponent' : 'Guest'}
                </h3>
                {(isGuest || canJoin) && battleMode === 'multiplayer' && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">You</span>
                )}
              </div>
              {battleMode === 'ai' ? (
                /* AI Opponent Selection */
                <div className="space-y-4">
                  {selectedTeam ? (
                    <div className="text-center py-2">
                      <div className="mb-2 p-2 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg">
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">
                          ✓ Team "{selectedTeam.name}" selected
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400">
                          {selectedTeam.slots.filter(slot => slot.id !== null).length}/6 Pokémon
                        </p>
                      </div>
                      <p className="text-sm text-muted mb-2">
                        {isMobile 
                          ? 'Tap once to see details, tap twice to select' 
                          : 'Hover to see details, click to select'
                        }
                      </p>
                      {selectedAIOpponent && (
                        <p className="text-sm font-medium text-text">
                          Selected: {GYM_CHAMPIONS.find(c => c.id === selectedAIOpponent)?.name || 'Unknown Champion'}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg">
                        <p className="text-yellow-800 dark:text-yellow-200 font-medium mb-2">
                          ⚠️ No team selected
                        </p>
                        <p className="text-sm text-yellow-600 dark:text-yellow-400">
                          Please select your team above to choose an AI opponent
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {selectedTeam && (
                    <div className="max-h-60 overflow-y-auto">
                      <TrainerRoster
                        champions={GYM_CHAMPIONS}
                        selectedChampionId={selectedAIOpponent}
                        onChampionSelect={handleAIOpponentSelect}
                        generationFilter={generationFilter}
                        onGenerationFilterChange={setGenerationFilter}
                        showTooltip={showAITooltip}
                        onTrainerHover={handleAIOpponentHover}
                        isMobile={isMobile}
                      />
                    </div>
                  )}
                </div>
              ) : (
                /* Multiplayer Guest Section */
                room.guestName || isGuest || canJoin ? (
                  <>
                    <div className="text-sm text-muted mb-4 flex items-center gap-2">
                      {renderAvatar(
                        room.guestName || (isGuest ? (user?.displayName || 'You') : 'Guest'),
                        (room as RoomData).guestPhotoURL
                      )}
                      <p className="font-medium">{room.guestName || (isGuest ? (user?.displayName || 'You') : 'Guest')}</p>
                      <ReadyIcon ready={room.guestReady || false} canToggle={isGuest} />
                    </div>
                    
                    {/* Team Selector for Guest */}
                    {(isGuest || canJoin) && (
                      <div className="mb-3">
                        <TeamSelector
                          selectedTeamId={selectedTeam?.id}
                          onTeamSelect={handleTeamSelect}
                          label="Select Your Team"
                          showStorageIndicator={true}
                        />
                      </div>
                    )}

                    {/* Show Guest's Poké Balls - visible to both host and guest */}
                    <div className="mt-2 flex items-center gap-3">
                      <div className="relative">
                        {/* @ts-ignore */}
                        {renderPokeballRow(
                          isGuest 
                            ? (selectedTeam as SavedTeam | LocalTeam)?.slots
                            : ((room.guestTeam as unknown as { slots?: Array<{ id?: number | null }> })?.slots) as Array<{ id?: number | null }>,
                          'guest'
                        )}
                        {/* Animated released sprites overlay */}
                        {releasedTeams.guest && (
                          <div className="absolute inset-0 flex items-center gap-1 animate-fade-in">
                            {releasedTeams.guest.sprites.map((sprite, idx) => (
                                <div 
                                  key={idx} 
                                  className="w-8 h-8 animate-scale-in"
                                  style={{ animationDelay: `${idx * 0.1}s` }}
                                >
                                  <Image
                                    src={sprite}
                                    alt={`Released Pokemon ${idx + 1}`}
                                    width={32}
                                    height={32}
                                    style={{ imageRendering: 'pixelated' }}
                                    className="object-contain"
                                  />
                                </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Ready toggle handled by icon next to name for Guest */}
                    
                    {/* Explicit Join control for non-participants */}
                    {!isGuest && canJoin && (
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={handleJoinAsGuest}
                          className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                          data-testid="join-as-guest"
                        >
                          Join as Guest
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-muted">
                    <p>Waiting for player...</p>
                  </div>
                )
              )}
            </div>
          </div>


          {/* Actions */}
          <div className="mt-6 flex justify-center">
            {/* AI Battle Start Button */}
            {battleMode === 'ai' && selectedTeam && selectedAIOpponent && (
              <button
                onClick={startAIBattle}
                className="group relative flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 border-2 border-purple-700 hover:border-purple-800"
                title="Start AI Battle"
              >
                {/* AI Battle Icon */}
                <div className="relative">
                  <Bot className="w-8 h-8 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3" />
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 bg-purple-300 rounded-full opacity-0 group-hover:opacity-30 blur-sm transition-opacity duration-300"></div>
                </div>
                
                {/* Button Text */}
                <span className="transition-all duration-300 group-hover:text-purple-100">
                  Start AI Battle
                </span>

                {/* Animated border effect */}
                <div className="absolute inset-0 rounded-xl border-2 border-transparent bg-gradient-to-r from-purple-300 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
              </button>
            )}
            
            {/* Multiplayer Battle Start Button */}
            {battleMode === 'multiplayer' && isHost && room && room.currentPlayers === room.maxPlayers && (room.status === 'ready' || room.status === 'waiting') && (
              <button
                onClick={async () => {
                  if (startInProgress) return;
                  setStartInProgress(true);
                  try {
                    await startBattle();
                  } catch (e) {
                    setStartInProgress(false);
                  }
                }}
                disabled={!canStart || startInProgress}
                data-testid="start-battle-button"
                className={`group relative flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform ${
                  canStart && !startInProgress
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 border-2 border-yellow-600 hover:border-yellow-700' 
                    : 'bg-gray-500/50 text-gray-300 cursor-not-allowed border-2 border-gray-500'
                }`}
                title={
                  !selectedTeam
                    ? 'Select Team First'
                    : !room.hostTeam
                      ? 'Host must select a team'
                      : !room.guestTeam
                        ? 'Guest must select a team'
                        : !(room.hostReady && room.guestReady)
                          ? 'Both players must be Ready'
                          : startInProgress ? 'Starting…' : 'Start Battle'
                }
              >
                {/* VS Battle Icon */}
                <div className="relative">
                  <Image
                    src="/header-icons/battle.png"
                    alt="VS Battle"
                    width={32}
                    height={32}
                    className={`transition-all duration-300 ${
                      canStart 
                        ? 'group-hover:scale-110 group-hover:rotate-3' 
                        : 'opacity-50'
                    }`}
                  />
                  {/* Glow effect on hover */}
                  {canStart && (
                    <div className="absolute inset-0 bg-yellow-300 rounded-full opacity-0 group-hover:opacity-30 blur-sm transition-opacity duration-300"></div>
                  )}
                </div>
                
                {/* Button Text */}
                <span className={`transition-all duration-300 ${canStart && !startInProgress ? 'group-hover:text-yellow-900' : ''}`}>
                  {!selectedTeam
                    ? 'Select Team First'
                    : !room.hostTeam
                      ? 'Host Team Required'
                      : !room.guestTeam
                        ? 'Waiting for Guest Team'
                        : !(room.hostReady && room.guestReady)
                          ? 'Waiting for Ready'
                          : (startInProgress ? 'Starting…' : 'Start Battle')}
                </span>

                {/* Animated border effect */}
                {canStart && (
                  <div className="absolute inset-0 rounded-xl border-2 border-transparent bg-gradient-to-r from-yellow-300 to-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                )}
              </button>
            )}
            
            {room.status === 'battling' && (
              <button
                onClick={() => {
                  const isHost = Boolean(user?.uid && room?.hostId && user.uid === room.hostId);
                  const role = isHost ? 'host' : 'guest';
                  
                  // Get the Pokemon list from the selected team
                  const pokemonList = selectedTeam?.slots?.filter(slot => slot.id !== null).map(slot => ({
                    id: slot.id,
                    level: slot.level,
                    moves: slot.moves || []
                  })) || [];
                  
                  // Create URL parameters with Pokemon list and user info
                  const params = new URLSearchParams({
                    roomId: roomId,
                    battleId: room?.battleId || '',
                    role: role,
                    isHost: isHost.toString(),
                    userId: user?.uid || '',
                    userName: user?.displayName || 'Anonymous',
                    pokemonList: JSON.stringify(pokemonList)
                  });
                  
                  router.push(`/battle/runtime?${params.toString()}`);
                }}
                className="group relative flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 border-2 border-red-700 hover:border-red-800"
                title="Enter the ongoing battle"
              >
                {/* VS Battle Icon */}
                <div className="relative">
                  <Image
                    src="/header-icons/battle.png"
                    alt="VS Battle"
                    width={32}
                    height={32}
                    className="transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                  />
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 bg-red-300 rounded-full opacity-0 group-hover:opacity-30 blur-sm transition-opacity duration-300"></div>
                </div>
                
                {/* Button Text */}
                <span className="transition-all duration-300 group-hover:text-red-100">
                  Enter Battle
                </span>

                {/* Animated border effect */}
                <div className="absolute inset-0 rounded-xl border-2 border-transparent bg-gradient-to-r from-red-300 to-red-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
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
        <div className="bg-surface border border-border rounded-xl shadow-lg p-6 w-full max-w-full overflow-hidden">
          <h3 className="text-lg font-semibold text-text mb-4">How to Play</h3>
          <div className="space-y-3 text-sm text-muted">
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

      {/* Battle Start Dialog */}
      <BattleStartDialog
        isOpen={showBattleStartDialog}
        onClose={() => setShowBattleStartDialog(false)}
        onBattleStart={handleBattleStart}
        roomId={roomId}
        isHost={isHost}
      />

      {/* Firebase Error Debugger */}
      <FirebaseErrorDebugger
        isOpen={showErrorDebugger}
        onClose={() => setShowErrorDebugger(false)}
      />

      {/* Forfeit Dialog */}
      <ForfeitDialog
        isOpen={!!opponentForfeit}
        opponentName={opponentForfeit?.name || 'Opponent'}
        isRoomFinished={opponentForfeit?.isRoomFinished || room?.status === 'finished'}
        onClose={() => setOpponentForfeit(null)}
      />
      {/* Test/debug hooks */}
      <div data-testid="room-debug" style={{ display: 'none' }}>{JSON.stringify({
        id: room?.id,
        hostId: room?.hostId || '',
        guestId: room?.guestId || '',
        status: room?.status || 'waiting',
        currentPlayers: room?.currentPlayers ?? 0,
        displayPlayers,
      })}</div>
      <div data-testid="user-id" style={{ display: 'none' }}>{user?.uid || ''}</div>
      </div>
    </LobbyTransition>
  );
}
