import RoomPageClient from './RoomPageClient'

export async function generateStaticParams() {
  // For static export, we'll generate a few common room IDs
  // In a real app, you might want to fetch these from a database
  return [
    { roomId: 'demo-room-1' },
    { roomId: 'demo-room-2' },
    { roomId: 'demo-room-3' }
  ]
}

export default async function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params
  if (!roomId) return null
  return <RoomPageClient roomId={roomId} />
}
