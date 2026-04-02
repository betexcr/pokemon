"use client";
import { cn } from "@/lib/utils";
import type { KeyboardEvent } from "react";

interface TabsProps {
  activeTab: 'stats' | 'moves' | 'evolution' | 'matchups';
  onTabChange: (tab: 'stats' | 'moves' | 'evolution' | 'matchups') => void;
}

export default function Tabs({ activeTab, onTabChange }: TabsProps) {
  const items = ["stats","moves","evolution","matchups"] as const;
  const activeIndex = items.findIndex((item) => item === activeTab);

  const onTabKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const key = event.key;
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(key)) return;
    event.preventDefault();
    let nextIndex = activeIndex;
    if (key === "ArrowRight") nextIndex = (activeIndex + 1) % items.length;
    if (key === "ArrowLeft") nextIndex = (activeIndex - 1 + items.length) % items.length;
    if (key === "Home") nextIndex = 0;
    if (key === "End") nextIndex = items.length - 1;
    onTabChange(items[nextIndex]);
  };

  return (
    <nav className="bg-white dark:bg-gray-800 mt-3">
      <div className="flex justify-center py-5">
        <div
          className="flex flex-wrap justify-center gap-4"
          role="tablist"
          aria-label="Pokemon details sections"
          onKeyDown={onTabKeyDown}
        >
          {items.map((id) => {
            const isActive = activeTab === id;

            return (
              <button
                key={id}
                type="button"
                role="tab"
                id={`pokemon-tab-${id}`}
                aria-controls={`pokemon-tabpanel-${id}`}
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                onClick={() => onTabChange(id)}
                className={cn(
                  "px-5 py-2.5 text-base rounded-full border font-semibold transition-all duration-150",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500",
                  isActive
                    ? "bg-red-600 border-red-600 text-white shadow-sm dark:bg-red-700 dark:border-red-700"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-100 dark:border-gray-700 hover:bg-red-100 hover:border-red-300 hover:text-red-700 dark:hover:bg-red-950/40 dark:hover:border-red-800 dark:hover:text-red-300 hover:-translate-y-0.5 hover:shadow-md"
                )}
              >
                {capitalize(id)}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

const capitalize = (s:string)=>s[0].toUpperCase()+s.slice(1);
