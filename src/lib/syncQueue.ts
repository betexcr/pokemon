const QUEUE_KEY = 'pokemon-sync-queue'

export interface SyncItem {
  id: string
  type: 'checklist' | 'team'
  payload: any
  createdAt: number
}

function loadQueue(): SyncItem[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveQueue(items: SyncItem[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(items))
  } catch {}
}

export function enqueueSync(item: Omit<SyncItem, 'id' | 'createdAt'>) {
  const queue = loadQueue()
  const existing = queue.findIndex(q => q.type === item.type)
  const entry: SyncItem = {
    ...item,
    id: `${item.type}-${Date.now()}`,
    createdAt: Date.now(),
  }
  if (existing >= 0) {
    queue[existing] = entry
  } else {
    queue.push(entry)
  }
  saveQueue(queue)
  requestBackgroundSync()
}

export function getPendingItems(): SyncItem[] {
  return loadQueue()
}

export function clearCompleted(ids: string[]) {
  const queue = loadQueue().filter(q => !ids.includes(q.id))
  saveQueue(queue)
}

export function clearAll() {
  saveQueue([])
}

function requestBackgroundSync() {
  if (typeof navigator === 'undefined') return
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready.then(reg => {
      (reg as any).sync?.register('pokemon-pending-writes').catch(() => {})
    })
  }
}

export async function processSyncQueue(
  handlers: Record<string, (payload: any) => Promise<void>>
): Promise<void> {
  const queue = loadQueue()
  if (queue.length === 0) return

  const completed: string[] = []
  for (const item of queue) {
    const handler = handlers[item.type]
    if (!handler) continue
    try {
      await handler(item.payload)
      completed.push(item.id)
    } catch (err) {
      console.warn(`Sync failed for ${item.type}:`, err)
    }
  }
  if (completed.length > 0) clearCompleted(completed)
}

export function setupSyncListener(
  handlers: Record<string, (payload: any) => Promise<void>>
) {
  if (typeof navigator === 'undefined') return () => {}

  const onMessage = (event: MessageEvent) => {
    if (event.data?.type === 'SYNC_PENDING_WRITES') {
      processSyncQueue(handlers)
    }
  }
  navigator.serviceWorker?.addEventListener('message', onMessage)

  const onOnline = () => processSyncQueue(handlers)
  window.addEventListener('online', onOnline)

  return () => {
    navigator.serviceWorker?.removeEventListener('message', onMessage)
    window.removeEventListener('online', onOnline)
  }
}
