"use client";
import { cn } from "@/lib/utils";

interface TabsProps {
  activeTab: 'overview' | 'stats' | 'moves' | 'evolution' | 'matchups';
  onTabChange: (tab: 'overview' | 'stats' | 'moves' | 'evolution' | 'matchups') => void;
}

export default function Tabs({ activeTab, onTabChange }: TabsProps) {
  const items = ["overview","stats","moves","evolution","matchups"] as const;

  return (
    <nav className="sticky top-16 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex justify-center py-4">
        <div className="flex gap-2">
          {items.map((id) => (
            <button
              key={id}
              role="tab"
              aria-selected={activeTab === id}
              onClick={() => onTabChange(id)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors border",
                // Default inactive style
                "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300",
                "hover:bg-gray-100 dark:hover:bg-gray-700",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-poke-red",
                // Active tab
                activeTab === id && "bg-poke-red text-white border-poke-red"
              )}
            >
              {capitalize(id)}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

const capitalize = (s:string)=>s[0].toUpperCase()+s.slice(1);
