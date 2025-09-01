"use client";
import { cn } from "@/lib/utils";

interface TabsProps {
  activeTab: 'overview' | 'stats' | 'moves' | 'evolution' | 'matchups';
  onTabChange: (tab: 'overview' | 'stats' | 'moves' | 'evolution' | 'matchups') => void;
}

export default function Tabs({ activeTab, onTabChange }: TabsProps) {
  const items = ["overview","stats","moves","evolution","matchups"] as const;

  return (
    <nav className="sticky top-16 z-30 bg-gray-800 border-b border-gray-700">
      <div className="flex justify-center py-4">
        <ul className="flex gap-2">
          {items.map((id) => (
            <li key={id}>
              <button
                onClick={() => onTabChange(id)}
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-colors rounded",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                  activeTab === id
                    ? "bg-gray-700 text-white"
                    : "text-gray-300 hover:text-white hover:bg-gray-700"
                )}
              >
                {capitalize(id)}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

const capitalize = (s:string)=>s[0].toUpperCase()+s.slice(1);
