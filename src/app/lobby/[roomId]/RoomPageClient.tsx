'use client'

import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2, Users, AlertCircle, LogOut, PlayCircle } from 'lucide-react'
import { roomService, type RoomData } from '@/lib/roomService'
import { useAuth } from '@/contexts/AuthContext'
import { getUserTeams } from '@/lib/userTeams'

type StoredSlot = {
  id: number
  level: number
  moves: Array<{ name: string }>
  nature?: string
}

interface RoomPageClientProps {
  roomId: string
}

export default function RoomPageClient({ roomId }: RoomPageClientProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [room, setRoom] = useState<RoomData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const joinAttemptedRef = useRef(false)
  const navigationTriggeredRef = useRef(false)
  const [cachedTeam, setCachedTeam] = useState<StoredSlot[] | null>(null)

  const extractRawSlots = useCallback((source: unknown): any[] | null => {
    if (!source) return null
    let payload = source

    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload)
      } catch (error) {
        console.warn('Failed to parse team payload string', error)
        return null
      }
    }

    if (Array.isArray(payload)) {
      return payload
    }

    if (payload && typeof payload === 'object') {
      const candidateKeys = ['slots', 'team', 'members']
      for (const key of candidateKeys) {
        const value = (payload as Record<string, unknown>)[key]
        if (Array.isArray(value)) {
          return value
        }
      }
    }

    return null
  }, [])

  const normalizeSlots = useCallback((slots: any[] | null): StoredSlot[] => {
    if (!Array.isArray(slots)) return []

    return slots
      .map((slot) => {
        if (!slot || typeof slot !== 'object') return null

        const rawId = (slot as any).id ?? (slot as any).pokemonId ?? (slot as any).speciesId
        const id = typeof rawId === 'number' && Number.isFinite(rawId)
          ? rawId
          : parseInt(String(rawId ?? ''), 10)
        if (!Number.isFinite(id)) return null

        const rawLevel = (slot as any).level
        const level = typeof rawLevel === 'number' && rawLevel > 0 ? rawLevel : 50

        const rawMoves = Array.isArray((slot as any).moves) ? (slot as any).moves : []
        const moves = rawMoves
          .map((move: any) => {
            if (!move) return null
            if (typeof move === 'string') {
              return { name: move }
            }
            const name = move.name || move.id || null
            if (typeof name === 'string' && name.trim().length > 0) {
              return { name: name.trim() }
            }
            return null
          })
          .filter(Boolean) as Array<{ name: string }>

        const nature = typeof (slot as any).nature === 'string' ? (slot as any).nature : undefined

        return {
          id,
          level,
          moves,
          nature
        }
      })
      .filter(Boolean) as StoredSlot[]
  }, [])

  const processTeamSource = useCallback((source: unknown): StoredSlot[] | null => {
    const rawSlots = extractRawSlots(source)
    if (!rawSlots) return null
    const normalized = normalizeSlots(rawSlots)
    return normalized.length > 0 ? normalized : null
  }, [extractRawSlots, normalizeSlots])

  const loadTeamFromLocal = useCallback((): StoredSlot[] | null => {
    if (typeof window === 'undefined') return null

    const savedTeamsRaw = window.localStorage.getItem('pokemon-team-builder')
    if (savedTeamsRaw) {
      try {
        const parsed = JSON.parse(savedTeamsRaw)
        const entries: unknown[] = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed?.teams)
            ? (parsed.teams as unknown[])
            : [parsed]

        for (const entry of entries) {
          const normalized = processTeamSource(entry)
          if (normalized) {
            return normalized
          }
        }
      } catch (error) {
        console.warn('Failed to parse team-builder cache', error)
      }
    }

    const currentTeamRaw = window.localStorage.getItem('pokemon-current-team')
    if (currentTeamRaw) {
      const normalized = processTeamSource(currentTeamRaw)
      if (normalized) {
        return normalized
      }
    }

    return null
  }, [processTeamSource])

  const loadTeamFromRemote = useCallback(async (): Promise<StoredSlot[] | null> => {
    if (!user) return null
    try {
      const teams = await getUserTeams(user.uid)
      for (const team of teams) {
        const normalized = processTeamSource(team)
        if (normalized) {
          return normalized
        }
      }
    } catch (error) {
      console.warn('Failed to load team from Firestore', error)
    }
    return null
  }, [processTeamSource, user])

  const ensureTeam = useCallback(async (): Promise<StoredSlot[] | null> => {
    const localTeam = loadTeamFromLocal()
    if (localTeam) {
      setCachedTeam(localTeam)
      return localTeam
    }

    if (cachedTeam && cachedTeam.length > 0) {
      return cachedTeam
    }

    const remoteTeam = await loadTeamFromRemote()
    if (remoteTeam) {
      setCachedTeam(remoteTeam)
      return remoteTeam
    }

    return null
  }, [cachedTeam, loadTeamFromLocal, loadTeamFromRemote])

  const toFirestoreTeam = useCallback((slots: StoredSlot[]): Array<Record<string, unknown>> => {
    return slots.map((slot) => {
      const moveNames = slot.moves
        .map((move) => move?.name?.trim())
        .filter((name): name is string => Boolean(name))
        .slice(0, 4)

      const base: Record<string, unknown> = {
        id: slot.id,
        level: slot.level,
        moves: moveNames
      }

      if (slot.nature) {
        base.nature = slot.nature
      }

      return base
    })
  }, [])

  type StoredSlot = {
    id: number | null
    level?: number
    moves?: Array<string | { name?: string | null; id?: string | null }>
    nature?: string
  }

  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    const loadRoom = async () => {
      try {
        setLoading(true)
        const initial = await roomService.getRoom(roomId)
        if (initial) {
          setRoom(initial)
        }
        unsubscribe = roomService.onRoomChange(roomId, (nextRoom) => {
          setRoom(nextRoom)
        })
        setError(null)
      } catch (err) {
        console.error('Failed to load room', err)
        setError('Failed to load battle room. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    loadRoom()

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [roomId])

  const isHost = useMemo(() => {
    if (!user || !room) return false
    return room.hostId === user.uid
  }, [room, user])

  const isGuest = useMemo(() => {
    if (!user || !room) return false
    return room.guestId === user.uid
  }, [room, user])

  useEffect(() => {
    let cancelled = false

    const hydrateTeam = async () => {
      const localTeam = loadTeamFromLocal()
      if (!cancelled && localTeam) {
        setCachedTeam(localTeam)
        return
      }

      const remoteTeam = await loadTeamFromRemote()
      if (!cancelled && remoteTeam) {
        setCachedTeam(remoteTeam)
      }
    }

    void hydrateTeam()

    return () => {
      cancelled = true
    }
  }, [loadTeamFromLocal, loadTeamFromRemote])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleStorageChange = () => {
      const localTeam = loadTeamFromLocal()
      if (localTeam) {
        setCachedTeam(localTeam)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [loadTeamFromLocal])

  useEffect(() => {
    if (!room) return

    const sourceTeam = isHost ? room.hostTeam : isGuest ? room.guestTeam : null
    const normalized = processTeamSource(sourceTeam)
    if (normalized) {
      setCachedTeam(normalized)
    }
  }, [isGuest, isHost, processTeamSource, room])

  useEffect(() => {
    if (!room || !user) return
    if (navigationTriggeredRef.current) return

    const isParticipant = room.hostId === user.uid || room.guestId === user.uid
    if (!isParticipant) return

    if (room.battleId && room.status === 'battling') {
      goToBattle()
    }
  }, [room, user])

  useEffect(() => {
    if (!room || !user) return

    // Host never auto-joins as guest
    if (room.hostId === user.uid) {
      joinAttemptedRef.current = true
      return
    }

    // Another guest already claimed the spot
    if (room.guestId && room.guestId !== user.uid) {
      joinAttemptedRef.current = true
      return
    }

    // Already joined this session
    if (joinAttemptedRef.current || room.guestId === user.uid) {
      joinAttemptedRef.current = true
      return
    }

    joinAttemptedRef.current = true

    const displayName = user.displayName || 'Guest Trainer'
    const photoURL = user.photoURL || null

    void roomService
      .joinRoom(roomId, user.uid, displayName, photoURL)
      .then(() => {
        setActionMessage('Joined room as guest')
      })
      .catch((err) => {
        console.error('Failed to join room as guest', err)
        joinAttemptedRef.current = false
        setActionError(err instanceof Error ? err.message : 'Unable to join this room right now.')
      })
  }, [room, roomId, user])

  const handleReadyToggle = async () => {
    if (!room || !user) return
    setBusy(true)
    setActionError(null)
    try {
      const nextReadyState = isHost ? !room.hostReady : !room.guestReady

      const updates: Record<string, unknown> = isHost
        ? { hostReady: nextReadyState }
        : { guestReady: nextReadyState }

      if (nextReadyState) {
        const teamPayload = await ensureTeam()
        if (!teamPayload || teamPayload.length === 0) {
          setActionMessage(null)
          setActionError('Select a team in the Team Builder before readying up.')
          setBusy(false)
          return
        }

        if (isHost) {
          updates.hostTeam = toFirestoreTeam(teamPayload)
        } else if (isGuest) {
          updates.guestTeam = toFirestoreTeam(teamPayload)
        }
      }

      await roomService.updateRoom(roomId, updates)
      setActionMessage('Readiness updated')
      setActionError(null)
    } catch (err) {
      console.error('Failed to toggle ready', err)
      setActionError('Failed to update ready status. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const handleLeaveRoom = async () => {
    if (!room || !user) return
    setBusy(true)
    setActionError(null)
    try {
      await roomService.leaveRoom(roomId, user.uid)
      router.push('/lobby')
    } catch (err) {
      console.error('Failed to leave room', err)
      setActionError('Unable to leave the room. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const handleStartBattle = async () => {
    if (!room || !isHost) return
    setBusy(true)
    setActionError(null)
    setActionMessage(null)
    try {
      await roomService.startBattle(roomId, room.battleId ?? '')
      setActionMessage('Battle started! Redirecting…')
      goToBattle()
    } catch (err) {
      console.error('Failed to start battle', err)
      setActionError(err instanceof Error ? err.message : 'Failed to start battle.')
    } finally {
      setBusy(false)
    }
  }

  const goToBattle = () => {
    if (!room?.battleId || !user) return
    const params = new URLSearchParams({
      battleId: room.battleId,
      roomId: room.id,
      playerUid: user.uid
    })
    navigationTriggeredRef.current = true
    router.push(`/battle/runtime?${params.toString()}`)
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg text-text">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <p className="text-lg font-semibold">You must be signed in to view battle rooms.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg text-text">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-poke-blue" />
          <p className="text-muted-foreground">Loading battle room…</p>
        </div>
      </div>
    )
  }

  if (error || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg text-text">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <p className="text-lg font-semibold">{error || 'Battle room not found.'}</p>
          <button
            onClick={() => router.push('/lobby')}
            className="px-4 py-2 bg-poke-blue text-white rounded-lg shadow hover:bg-poke-blue/90"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    )
  }

  const bothReady = room.hostReady && room.guestReady

  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <button
          onClick={() => router.push('/lobby')}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to lobby
        </button>

        <header className="space-y-2">
          <h1 className="text-3xl font-bold">Battle Room</h1>
          <p className="text-muted-foreground">Room ID: <code className="text-sm bg-muted px-2 py-1 rounded">{roomId}</code></p>
        </header>

        {actionMessage && (
          <div className="rounded-lg border border-emerald-500 bg-emerald-50 px-4 py-3 text-emerald-700">
            {actionMessage}
          </div>
        )}

        {actionError && (
          <div className="rounded-lg border border-red-500 bg-red-50 px-4 py-3 text-red-700">
            {actionError}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Host</h2>
              {room.hostReady ? (
                <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" /> Ready
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                  <AlertCircle className="w-4 h-4" /> Not ready
                </span>
              )}
            </div>
            <p className="text-muted-foreground">{room.hostName || 'Waiting for host…'}</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Guest</h2>
              {room.guestId ? (
                room.guestReady ? (
                  <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" /> Ready
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                    <AlertCircle className="w-4 h-4" /> Not ready
                  </span>
                )
              ) : (
                <span className="text-sm text-muted-foreground">Waiting for opponent…</span>
              )}
            </div>
            <p className="text-muted-foreground">{room.guestName || 'No guest yet'}</p>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>
              {room.currentPlayers}/{room.maxPlayers} trainers in room · Status: <strong className="capitalize">{room.status}</strong>
            </span>
          </div>

          <div className="flex flex-wrap gap-3">
            {(isHost || isGuest) && (
              <button
                onClick={handleReadyToggle}
                disabled={busy}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  (isHost ? room.hostReady : room.guestReady)
                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                    : 'bg-poke-blue text-white hover:bg-poke-blue/90'
                } ${busy ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <CheckCircle2 className="w-4 h-4" />
                {isHost ? (room.hostReady ? 'Unready' : 'Ready Up') : room.guestReady ? 'Unready' : 'Ready Up'}
              </button>
            )}

            <button
              onClick={handleLeaveRoom}
              disabled={busy}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors bg-muted hover:bg-muted/80 ${busy ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <LogOut className="w-4 h-4" /> Leave Room
            </button>

            {room.battleId && (
              <button
                onClick={goToBattle}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors bg-green-600 text-white hover:bg-green-700"
              >
                <PlayCircle className="w-4 h-4" /> Enter Battle
              </button>
            )}
          </div>

          {isHost && (
            <div className="rounded-lg border border-dashed border-border p-4">
              <h3 className="text-sm font-semibold mb-2">Host Controls</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Wait until both trainers are ready, then start the match.
              </p>
              <button
                onClick={handleStartBattle}
                disabled={!bothReady || busy}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  bothReady ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-muted text-muted-foreground cursor-not-allowed'
                } ${busy ? 'opacity-60' : ''}`}
              >
                <PlayCircle className="w-4 h-4" />
                Start Battle
              </button>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-dashed border-border bg-card/40 p-6 text-sm text-muted-foreground space-y-2">
          <h3 className="text-base font-semibold text-foreground">Team Selection</h3>
          <p>
            Team selection UI has moved. Use the main lobby page to set your team before entering the room. Your chosen roster automatically syncs to the battle document when the host starts the match.
          </p>
        </section>
      </div>
    </div>
  )
}
