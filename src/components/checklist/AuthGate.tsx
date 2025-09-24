"use client";
import React, { useEffect, useMemo, useState } from "react";
import { firebaseClient } from "@/lib/firebase/client";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { useChecklist } from "./ChecklistProvider";

export default function AuthGate() {
  const { setUid } = useChecklist();
  const { auth, GoogleAuthProvider } = useMemo(() => firebaseClient(), []);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
        setEmail(user.email ?? user.displayName ?? "");
      } else {
        setUid(null);
        setEmail(null);
      }
    });
    return () => unsub();
  }, [auth, setUid]);

  async function handleSignIn() {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }

  async function handleSignOut() {
    await signOut(auth);
  }

  return (
    <div className="flex items-center gap-3">
      {email ? (
        <>
          <span className="text-sm text-gray-600 dark:text-gray-300">{email}</span>
          <span className="inline-flex items-center gap-1 text-green-600 text-sm" aria-label="Sync on">
            <span className="h-2 w-2 rounded-full bg-green-500" /> Sync on
          </span>
          <button className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-sm" onClick={handleSignOut}>
            Sign out
          </button>
        </>
      ) : (
        <button className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm" onClick={handleSignIn}>
          Sign in with Google
        </button>
      )}
    </div>
  );
}

