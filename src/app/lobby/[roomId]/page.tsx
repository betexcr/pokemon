import ProtectedRoute from '@/components/auth/ProtectedRoute';
import RoomPageClient from './RoomPageClient';

// Generate static params for common room IDs (for static export)
export async function generateStaticParams() {
  // Generate some common room codes for static export
  const commonRoomIds = ['ABC123', 'XYZ789', 'BATTLE', 'POKEMON', 'TRAINER'];
  
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
