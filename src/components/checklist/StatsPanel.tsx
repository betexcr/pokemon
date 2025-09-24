"use client";
import React, { useMemo } from "react";
import { useDexData } from "@/lib/checklist/dex.client";
import { useChecklist } from "./ChecklistProvider";

export default function StatsPanel() {
  const { state, streak } = useChecklist();
  const { dex, gens } = useDexData();

  const total = dex.length;
  const caught = Object.keys(state.caught).length;
  const percent = Math.round((caught / Math.max(1, total)) * 100);

  const perGen = useMemo(() => {
    const map: Record<number, { total: number; caught: number }> = {};
    for (const g of gens) map[g] = { total: 0, caught: 0 };
    for (const d of dex) {
      map[d.gen].total += 1;
      if (state.caught[d.id]) map[d.gen].caught += 1;
    }
    return map;
  }, [state.caught, dex, gens]);

  const completed = gens.filter((g) => perGen[g].total > 0 && perGen[g].caught === perGen[g].total);

  return (
    <aside className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-800">
      <div className="mb-3">
        <div className="text-sm font-medium">Totals</div>
        <div className="text-sm text-gray-700 dark:text-gray-300">
          {caught} of {total} caught ({percent}%)
        </div>
      </div>

      <div className="mb-3">
        <div className="text-sm font-medium mb-1">Per Gen</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-1 text-sm">
          {gens.map((g) => (
            <div key={g} className="flex justify-between">
              <span>Gen {g}</span>
              <span>
                {perGen[g].caught}/{perGen[g].total}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <div className="text-sm font-medium mb-1">Badges</div>
        {completed.length === 0 ? (
          <div className="text-sm text-gray-500">No complete gens yet.</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {completed.map((g) => (
              <span key={g} className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200 border border-amber-200 dark:border-amber-700">
                Gen {g} Complete
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="text-sm font-medium">Streak</div>
        <div className="text-sm text-gray-700 dark:text-gray-300">{streak} day{streak === 1 ? "" : "s"}</div>
      </div>
    </aside>
  );
}

