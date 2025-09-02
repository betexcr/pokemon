"use client";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface TabsProps {
  activeTab: 'overview' | 'stats' | 'moves' | 'evolution' | 'matchups';
  onTabChange: (tab: 'overview' | 'stats' | 'moves' | 'evolution' | 'matchups') => void;
}

export default function Tabs({ activeTab, onTabChange }: TabsProps) {
  const items = ["overview","stats","moves","evolution","matchups"] as const;
  const [hovered, setHovered] = useState<typeof items[number] | null>(null);

  return (
    <nav className="sticky top-16 z-30 bg-white dark:bg-gray-800 mt-5 md:mt-6" style={{ marginTop: 12 }}>
      <div className="flex justify-center py-5">
        <div className="flex flex-wrap justify-center gap-4">
          {items.map((id) => {
            const isActive = activeTab === id;
            const isHovered = hovered === id;
            const baseStyle: React.CSSProperties = {
              paddingInline: 20,
              paddingBlock: 10,
              fontSize: 16,
              borderRadius: 9999,
              transition: 'all 150ms ease',
              borderWidth: 1
            };
            const activeStyle: React.CSSProperties = isActive
              ? { backgroundColor: '#dc2626', borderColor: '#dc2626', color: '#ffffff', boxShadow: '0 1px 2px rgba(0,0,0,0.15)' }
              : {};
            const hoverStyle: React.CSSProperties = !isActive && isHovered
              ? { backgroundColor: '#fee2e2', borderColor: '#fca5a5', color: '#b91c1c', transform: 'translateY(-2px)', boxShadow: '0 4px 10px rgba(0,0,0,0.08)' }
              : {};

            return (
              <button
                key={id}
                role="tab"
                aria-selected={isActive}
                onClick={() => onTabChange(id)}
                onMouseEnter={() => setHovered(id)}
                onMouseLeave={() => setHovered(null)}
                className={cn(
                  "rounded-full font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500",
                  isActive
                    ? "text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                )}
                style={{ ...baseStyle, ...activeStyle, ...hoverStyle }}
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
