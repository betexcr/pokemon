import RoomPageClient from './RoomPageClient'

export default function RoomPage(props: any) {
  const roomId = props?.params?.roomId
  if (!roomId) {
    return null
  }
  return <RoomPageClient roomId={roomId} />
}
