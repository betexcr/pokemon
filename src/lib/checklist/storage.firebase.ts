import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { firebaseClient, getDb } from "@/lib/firebase/client";
import type { ProgressState } from "./types";

export async function loadCloud(uid: string): Promise<ProgressState | null> {
  const db = getDb();
  const ref = doc(db, "users", uid, "dex", "default");
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const d = snap.data() as any;
  return {
    caught: Object.fromEntries((d.caught ?? []).map((id: number) => [id, true])),
    seen: Object.fromEntries((d.seen ?? []).map((id: number) => [id, true])),
    updatedAt: typeof d.updatedAt === "number" ? d.updatedAt : Date.now(),
  };
}

export async function saveCloud(uid: string, state: ProgressState) {
  const db = getDb();
  const ref = doc(db, "users", uid, "dex", "default");
  await setDoc(
    ref,
    {
      caught: Object.keys(state.caught).map(Number),
      seen: Object.keys(state.seen ?? {}).map(Number),
      updatedAt: state.updatedAt,
      clientId: "web-v1",
      ts: serverTimestamp(),
    },
    { merge: true }
  );
}

