'use client'

import React from "react";
import { useRotatingFact } from "@/hooks/useRotatingFact";
import { Sparkles, Heart, Star, Ribbon } from 'lucide-react'

type Props = {
  variant?: "cute"|"beauty"|"cool"|"tough"|"clever"|"all";
  className?: string;
};

const bucketByVariant: Record<NonNullable<Props["variant"]>, string[]|undefined> = {
  cute: ["cute-audience-1","match-bonus-1","audience-boredom-1"],
  beauty: ["beauty-stage-1","match-bonus-1","crowd-meter-1"],
  cool: ["cool-spotlight-1","match-bonus-1","judge-reaction-1"],
  tough: ["tough-momentum-1","judge-reaction-1","intro-talent-structure"],
  clever: ["clever-chain-1","combo-example-1","practice-mode-1"],
  all: undefined,
};

const variantStyles = {
  cute: {
    bg: "bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30",
    border: "border-pink-200 dark:border-pink-700",
    text: "text-pink-700 dark:text-pink-300",
    icon: "🌸",
    sparkle: "bg-pink-300/60"
  },
  beauty: {
    bg: "bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30",
    border: "border-rose-200 dark:border-rose-700",
    text: "text-rose-700 dark:text-rose-300",
    icon: "🌹",
    sparkle: "bg-rose-300/60"
  },
  cool: {
    bg: "bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30",
    border: "border-blue-200 dark:border-blue-700",
    text: "text-blue-700 dark:text-blue-300",
    icon: "❄️",
    sparkle: "bg-blue-300/60"
  },
  tough: {
    bg: "bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30",
    border: "border-red-200 dark:border-red-700",
    text: "text-red-700 dark:text-red-300",
    icon: "💪",
    sparkle: "bg-red-300/60"
  },
  clever: {
    bg: "bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30",
    border: "border-green-200 dark:border-green-700",
    text: "text-green-700 dark:text-green-300",
    icon: "🧠",
    sparkle: "bg-green-300/60"
  },
  all: {
    bg: "bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30",
    border: "border-purple-200 dark:border-purple-700",
    text: "text-purple-700 dark:text-purple-300",
    icon: "✨",
    sparkle: "bg-purple-300/60"
  }
};

export default function ContestFunFactCard({ variant = "all", className = "" }: Props) {
  const bucketIds = bucketByVariant[variant];
  const { fact, index, total } = useRotatingFact({ intervalMs: 12000, bucketIds });
  const styles = variantStyles[variant];

  const handleSparkle = (e: React.MouseEvent) => {
    const card = e.currentTarget.closest("div") as HTMLDivElement;
    if (!card) return;
    card.style.transform = "scale(1.02)";
    setTimeout(() => (card.style.transform = ""), 150);
  };

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl p-4 sm:p-5
        shadow-lg ${styles.bg} backdrop-blur border ${styles.border}
        transition-all duration-300 hover:shadow-xl hover:scale-[1.01]
        ${className}
      `}
      aria-live="polite"
    >
      {/* Sparkle aura */}
      <div className={`pointer-events-none absolute -top-6 -right-6 h-20 w-20 rounded-full blur-2xl opacity-40 ${styles.sparkle}`} />
      <div className={`pointer-events-none absolute -bottom-8 -left-8 h-24 w-24 rounded-full blur-3xl opacity-30 ${styles.sparkle}`} />

      <div className="flex items-start gap-3">
        <div className="text-2xl leading-none select-none animate-bounce" aria-hidden>
          {styles.icon}
        </div>
        <div className="flex-1">
          <p className={`text-sm uppercase tracking-wide ${styles.text} mb-1 font-bold`}>
            Fun Contest Fact
          </p>
          <p className="text-base sm:text-lg font-medium text-slate-800 dark:text-slate-100 leading-relaxed">
            {fact.text}
          </p>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex gap-1 flex-wrap">
              {fact.tags.slice(0,3).map(tag => (
                <span
                  key={tag}
                  className={`text-xs rounded-full px-2 py-0.5 ${styles.text} bg-white/50 dark:bg-black/20`}
                >
                  {tag}
                </span>
              ))}
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {index+1}/{total}
            </span>
          </div>
        </div>
        <button
          onClick={handleSparkle}
          className={`
            ml-2 rounded-full px-3 py-1 text-xs border transition-all duration-200
            ${styles.border} ${styles.text} bg-white/50 hover:bg-white/80
            dark:bg-black/20 dark:hover:bg-black/40
            hover:scale-110 active:scale-95
          `}
          aria-label="Sparkle!"
        >
          <Sparkles className="w-3 h-3 inline mr-1" />
          Sparkle
        </button>
      </div>

      {/* Floating sparkles animation */}
      <div className="absolute top-2 right-2 opacity-0 animate-ping">
        <Star className="w-4 h-4 text-yellow-400" />
      </div>
    </div>
  );
}
