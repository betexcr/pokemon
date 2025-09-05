import ProtectedRoute from '@/components/auth/ProtectedRoute';
import RoomPageClient from './RoomPageClient';

// Generate static params for common room IDs (for static export)
export async function generateStaticParams() {
  // Generate a comprehensive list of room codes for static export
  const commonRoomIds = [
    'ABC123', 'XYZ789', 'BATTLE', 'POKEMON', 'TRAINER',
    'PR8DKU', 'TEST01', 'ROOM01', 'GAME01', 'BATTLE01',
    'POKE01', 'TEAM01', 'FIGHT01', 'MATCH01', 'DUEL01',
    // Add more common patterns
    'A1B2C3', 'X1Y2Z3', 'ROOM123', 'GAME123', 'BATTLE123',
    'POKE123', 'TEAM123', 'FIGHT123', 'MATCH123', 'DUEL123'
  ];
  
  return commonRoomIds.map((roomId) => ({
    roomId: roomId,
  }));
}

interface RoomPageProps {
  params: { roomId: string };
}

export default function RoomPage({ params }: RoomPageProps) {
  return (
    <ProtectedRoute>
      <RoomPageClient roomId={params.roomId} />
    </ProtectedRoute>
  );
}
