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

export default function RoomPage(props: any) {
  const roomId = props?.params?.roomId
  if (!roomId) {
    return null
  }
  return <RoomPageClient roomId={roomId} />
}
