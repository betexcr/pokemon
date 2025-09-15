import ProtectedRoute from '@/components/auth/ProtectedRoute';
import RoomPageClient from './RoomPageClient';

// Generate static params for static export
export async function generateStaticParams() {
  // Return some sample room IDs for static generation
  // This allows the page to be statically exported while still supporting dynamic room IDs
  return [
    { roomId: 'BATTLE' },
    { roomId: 'BATTLE01' },
    { roomId: 'BATTLE123' },
    { roomId: 'DUEL01' },
    { roomId: 'DUEL123' },
    { roomId: 'FIGHT01' },
    { roomId: 'FIGHT123' },
    { roomId: 'GAME01' },
    { roomId: 'GAME123' },
    { roomId: 'MATCH01' },
    { roomId: 'MATCH123' },
    { roomId: 'POKE01' },
    { roomId: 'POKE123' },
    { roomId: 'POKEMON' },
    { roomId: 'ROOM01' },
    { roomId: 'ROOM123' },
    { roomId: 'TEAM01' },
    { roomId: 'TEAM123' },
    { roomId: 'TEST01' },
    { roomId: 'TRAINER' },
    { roomId: 'A1B2C3' },
    { roomId: 'ABC123' },
    { roomId: 'PR8DKU' },
    { roomId: 'X1Y2Z3' },
    { roomId: 'XYZ789' }
  ];
}

interface RoomPageProps {
  params: Promise<{ roomId: string }>;
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { roomId } = await params;
  
  return (
    <ProtectedRoute>
      <RoomPageClient roomId={roomId} />
    </ProtectedRoute>
  );
}
