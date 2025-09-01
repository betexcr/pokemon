"use client";
import { cn } from "@/lib/utils";

interface TabsProps {
  activeTab: 'overview' | 'stats' | 'moves' | 'evolution' | 'matchups';
  onTabChange: (tab: 'overview' | 'stats' | 'moves' | 'evolution' | 'matchups') => void;
}

export default function Tabs({ activeTab, onTabChange }: TabsProps) {
  const items = ["overview","stats","moves","evolution","matchups"] as const;

  return (
    <nav className="sticky top-16 z-30 bg-bg/80 backdrop-blur">
      <div className="flex justify-center py-4">
        <ul className="flex gap-3">
          {items.map((id) => (
            <li key={id}>
              <button
                onClick={() => onTabChange(id)}
                className={cn(
                  "rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-poke-blue",
                  activeTab === id
                    ? "bg-red-500 text-white shadow-sm"
                    : "text-text hover:bg-gray-100"
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
