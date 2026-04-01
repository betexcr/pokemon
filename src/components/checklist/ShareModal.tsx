"use client";
import React, { useMemo, useState, useEffect, useRef, useId } from "react";
import { useChecklist } from "./ChecklistProvider";
import { useDexData } from "@/lib/checklist/dex.client";

function toBase64(str: string) {
  if (typeof window === "undefined") return Buffer.from(str).toString("base64");
  return btoa(unescape(encodeURIComponent(str)));
}

export default function ShareModal() {
  const { state } = useChecklist();
  const [open, setOpen] = useState(false);
  const { dex, gens } = useDexData();
  const titleId = useId();
  const descId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const snapshot = useMemo(() => {
    const total = dex.length;
    const caught = Object.keys(state.caught).length;
    const percent = Math.round((caught / Math.max(1, total)) * 100);
    const share = {
      id: "local",
      createdAt: Date.now(),
      totals: { caught, percent },
      gens: gens.reduce<Record<number, { caught: number; total: number }>>((acc, g) => {
        const totalG = dex.filter((d) => d.gen === g).length;
        const caughtG = dex.filter((d) => d.gen === g && state.caught[d.id]).length;
        acc[g] = { caught: caughtG, total: totalG };
        return acc;
      }, {}),
      selection: Object.keys(state.caught).map(Number),
    };
    return share;
  }, [state.caught, dex, gens]);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const payload = toBase64(JSON.stringify(snapshot));
    const url = new URL(window.location.href);
    url.searchParams.set("share", payload);
    return url.toString();
  }, [snapshot]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const [copied, setCopied] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => { if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current) }
  }, [])

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  }

  return (
    <div>
      <button
        className="px-3 py-1 rounded bg-purple-600 hover:bg-purple-700 text-white text-sm"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-haspopup="dialog"
        type="button"
      >
        Share Progress
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descId}
          ref={dialogRef}
        >
          <div className="w-full max-w-lg rounded-lg bg-white dark:bg-gray-800 p-4 shadow-lg">
            <div className="flex justify-between items-center mb-3">
              <h2 id={titleId} className="text-lg font-semibold">Share Snapshot</h2>
              <button
                ref={closeRef}
                className="text-sm"
                onClick={() => setOpen(false)}
                aria-label="Close dialog"
                type="button"
              >
                Close
              </button>
            </div>
            <p id={descId} className="text-sm text-gray-600 dark:text-gray-300 mb-2">Copy this link to share your progress:</p>
            <div className="flex gap-2 mb-3">
              <input className="flex-1 text-sm rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1" readOnly value={shareUrl} aria-label="Share link URL" />
              <button className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-sm" onClick={copy} type="button">{copied ? 'Copied!' : 'Copy'}</button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">This uses a URL-encoded snapshot. No server needed.</p>
          </div>
        </div>
      )}
    </div>
  );
}
