import ProtectedRoute from '@/components/auth/ProtectedRoute';
import RoomPageClient from './RoomPageClient';

// Generate static params for common room IDs (for static export)
export async function generateStaticParams() {
  // For static export, we'll generate a fallback page that handles dynamic room IDs
  // The actual room handling will be done client-side
  return [
    { roomId: 'fallback' }
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
