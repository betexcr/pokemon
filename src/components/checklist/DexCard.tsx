"use client";

import React from "react";
import { useInView } from "@/hooks/useInView";
import type { DexEntry } from "@/lib/checklist/types";

type DexCardProps = {
  entry: DexEntry;
  isCaught: boolean;
  onToggleCaught: (id: number, checked: boolean) => void;
};

export default function DexCard({ entry, isCaught, onToggleCaught }: DexCardProps) {
  const { ref, inView } = useInView<HTMLLabelElement>({ rootMargin: "300px" });

  return (
    <label
      ref={ref}
      className="group border rounded-lg p-2 flex flex-col gap-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">#{entry.id}</span>
        <input
          type="checkbox"
          aria-checked={isCaught}
          checked={isCaught}
          onChange={(e) => onToggleCaught(entry.id, e.target.checked)}
          aria-label={`Caught ${entry.name}`}
          className="h-4 w-4 accent-green-600"
        />
      </div>
      <div className="aspect-square bg-gray-50 dark:bg-gray-900 rounded flex items-center justify-center overflow-hidden">
        {inView ? (
          <img src={entry.sprite} alt={entry.name} className="object-contain w-full h-full" loading="lazy" />
        ) : (
          <div className="w-full h-full" aria-hidden />
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm">{entry.name}</span>
      </div>
      <div className="flex gap-1">
        {entry.types.map((t) => (
          <span key={t} className="text-[10px] px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-700">{t}</span>
        ))}
      </div>
      <div className={`h-1 rounded ${isCaught ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"}`} />
    </label>
  );
}


