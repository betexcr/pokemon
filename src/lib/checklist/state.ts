import type { ProgressState } from "./types";
import { loadLocal, saveLocal, nowState } from "./storage.local";
import { loadCloud, saveCloud } from "./storage.firebase";

export function unionMaps(a: Record<number, true> = {}, b: Record<number, true> = {}) {
  const out: Record<number, true> = { ...a };
  for (const k of Object.keys(b)) out[+k] = true;
  return out;
}

// On sign-in: hydrate merged state
export async function hydrateState(uid: string | null): Promise<ProgressState> {
  const local = loadLocal() ?? nowState();
  if (!uid) return local;

  const cloud = await loadCloud(uid);
  if (!cloud) {
    await saveCloud(uid, local);
    return local;
  }
  const merged: ProgressState = {
    caught: unionMaps(local.caught, cloud.caught),
    seen: unionMaps(local.seen ?? {}, cloud.seen ?? {}),
    updatedAt: Math.max(local.updatedAt, cloud.updatedAt),
  };
  saveLocal(merged);
  await saveCloud(uid, merged);
  return merged;
}

export function toggleCaught(state: ProgressState, id: number, on: boolean): ProgressState {
  const next = { ...state, caught: { ...state.caught }, updatedAt: Date.now() };
  if (on) next.caught[id] = true;
  else delete next.caught[id];
  return next;
}

