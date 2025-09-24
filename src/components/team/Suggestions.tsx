"use client";

import type { TeamAnalysis } from '@/lib/team/engine';
import { suggestImprovements } from '@/lib/team/engine';

export default function Suggestions({ analysis }: { analysis: TeamAnalysis }) {
  const tips = suggestImprovements(analysis);
  return (
    <div className="rounded border p-3 bg-white/60 dark:bg-gray-900/40">
      <h3 className="font-semibold mb-2">AI-Powered Team Suggestions</h3>
      {tips.length > 0 ? (
        <ul className="list-disc list-inside text-sm space-y-1">
          {tips.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      ) : (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p>🤖 AI is analyzing your team...</p>
          <p className="mt-2 text-xs">Add more Pokémon to get personalized suggestions for improving type coverage, weaknesses, and team synergy.</p>
        </div>
      )}
    </div>
  );
}

