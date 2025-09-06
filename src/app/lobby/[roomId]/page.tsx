import ProtectedRoute from '@/components/auth/ProtectedRoute';
import RoomPageClient from './RoomPageClient';

// Generate static params for static export
export async function generateStaticParams() {
  // Return empty array to let client-side routing handle all dynamic room IDs
  // This ensures that any room ID (including dynamically generated ones) 
  // will be handled by the client-side routing in the main page
  return [];
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
