'use client';

import type { Metadata } from 'next';
import { TYPES, type TypeName } from '@/lib/type/data';
import { parseTypesCSV } from '@/lib/type/utils';
import TypeBadge from '@/components/type/TypeBadge';
import AppHeader from '@/components/AppHeader';
import { categorize } from '@/lib/type/utils';
// Removed TypeTooltip import - using Tooltip instead
import TypeControls from '@/components/type/TypeControls';
import TypeWheel from '@/components/type/TypeWheel';
import TypeMatrix from '@/components/type/TypeMatrix';
import Tooltip from '@/components/Tooltip';
// Removed unused imports
import { useSearchParams, useRouter } from 'next/navigation';
import { useSmartBackNavigation, useReferrerStorage } from '@/hooks/useSmartBackNavigation';

// Note: Metadata is handled by layout.tsx for client components

type SearchParams = { [k: string]: string | string[] | undefined };

export default function Page() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = (searchParams.get('mode') as string) === 'matrix' ? 'matrix' : 'wheel';
  const attacker = (searchParams.get('attacker') as TypeName) || 'Fire';
  const defenders = parseTypesCSV(searchParams.get('defender') || '') as TypeName[];

  // Store current page as referrer for smart back navigation
  useReferrerStorage()
  
  // Use smart back navigation
  const { backLink, backLabel } = useSmartBackNavigation({
    defaultBackLink: '/insights',
    defaultBackLabel: 'Back to Insights'
  })

  // Handle type clicks from the wheel
  const handleTypeClick = (type: TypeName) => {
    // Update URL params using router to trigger re-render
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('attacker', type);
    router.replace(`?${newSearchParams.toString()}`);
  };

  return (
    <>
      <AppHeader title="Type Matchup Explorer" backLink={backLink} backLabel={backLabel} showToolbar={true} />
      <main className="mx-auto max-w-7xl px-4 py-8 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
      <header className="lg:col-span-2">
        <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-fuchsia-500 to-rose-500 dark:from-blue-400 dark:via-fuchsia-400 dark:to-rose-400">Type Matchup Explorer ⚔️</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">Visualize strengths, weaknesses, and immunities. Wheel is interactive; matrix works without JS.</p>
      </header>

      <aside className="lg:sticky lg:top-4 lg:self-start rounded-md border p-4 bg-white/60 dark:bg-gray-900/40 backdrop-blur-md shadow-sm">
        <TypeControls 
          initialMode={mode} 
          initialAttacker={attacker} 
          initialDefenders={defenders}
        />
        <div className="mt-4 bg-gradient-to-br from-blue-500/30 via-fuchsia-500/30 to-rose-500/30 p-[1px] rounded-lg">
          <div className="rounded-md border p-4 bg-white/60 dark:bg-gray-900/40 backdrop-blur-md shadow-sm transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-md">
            <PreviewBanner attacker={attacker} defenders={defenders} />
          </div>
        </div>
      </aside>

      <section>
        {mode === 'wheel' ? (
          <>
            <noscript>
              <p className="mb-2 rounded border bg-yellow-50 text-yellow-800 p-2">JavaScript disabled: showing table fallback.</p>
            </noscript>
            <TypeWheel 
              attacker={attacker} 
              defenders={defenders} 
              onTypeClick={handleTypeClick}
            />
          </>
        ) : (
          <>
            <noscript>
              <MatrixFallbackSSR attacker={attacker} />
            </noscript>
            <TypeMatrix attacker={attacker} defenders={defenders} />
          </>
        )}
      </section>
    </main>
    </>
  );
}

function MatrixFallbackSSR({ attacker }: { attacker: TypeName }) {
  // Minimal semantic SSR table. Client version enhances interactions.
  return (
    <table className="w-full text-xs border mt-2" role="table" aria-label="Type effectiveness matrix">
      <thead>
        <tr>
          <th className="p-2 border text-left">Attacker \\ Defender</th>
          {TYPES.map((d) => (
            <th key={d} className="p-2 border text-left">{d}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {TYPES.map((a) => (
          <tr key={a} className={a === attacker ? 'bg-blue-50' : ''}>
            <th scope="row" className="p-2 border text-left">{a}</th>
            {TYPES.map((d) => (
              <td key={a + d} className="p-2 border">x{/* SSR fallback keeps neutral for simplicity */}1</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TooltipContent({ attacker, defenders }: { attacker: TypeName; defenders: TypeName[] }) {
  const cats = categorize(attacker);
  const { calcEffectiveness } = require('@/lib/type/utils');
  
  const currentEffectiveness = calcEffectiveness(attacker, defenders.length ? defenders : []);
  const effectivenessText = currentEffectiveness === 0 ? "Doesn't affect" : 
                           currentEffectiveness >= 4 ? 'Devastatingly effective!' : 
                           currentEffectiveness === 2 ? 'Super effective!' : 
                           currentEffectiveness < 1 ? 'Not very effective…' : 'Neutral';
  
  return (
    <div className="space-y-4">
      {/* Current matchup preview */}
      <div className="p-3 bg-gradient-to-r from-orange-100 to-orange-200 dark:from-orange-900/40 dark:to-orange-800/40 rounded-lg border border-orange-300 dark:border-orange-700">
        <div className="font-bold text-orange-900 dark:text-orange-100 text-sm">
          {attacker} ➡️ {defenders.join('/') || '—'} = x{currentEffectiveness}
        </div>
        <div className="text-orange-700 dark:text-orange-300 text-xs mt-1">
          {effectivenessText}
        </div>
      </div>
      
      {/* All types grid with highlighting */}
      <div>
        <div className="font-semibold mb-3 text-gray-800 dark:text-gray-200 text-sm">Type Effectiveness Grid</div>
        <div className="grid grid-cols-4 gap-1.5">
          {TYPES.map((type) => {
            const effectiveness = calcEffectiveness(attacker, [type]);
            const isSelected = type === attacker || defenders.includes(type);
            const isSuperEffective = effectiveness >= 2;
            const isNotVeryEffective = effectiveness < 1 && effectiveness > 0;
            const isImmune = effectiveness === 0;
            
            let bgColor = 'bg-gray-200 dark:bg-gray-700';
            let textColor = 'text-gray-700 dark:text-gray-300';
            let borderColor = 'border-gray-300 dark:border-gray-600';
            
            if (isSelected) {
              bgColor = 'bg-indigo-200 dark:bg-indigo-800';
              textColor = 'text-indigo-900 dark:text-indigo-100';
              borderColor = 'border-indigo-400 dark:border-indigo-500';
            } else if (isSuperEffective) {
              bgColor = 'bg-red-200 dark:bg-red-800';
              textColor = 'text-red-900 dark:text-red-100';
              borderColor = 'border-red-400 dark:border-red-500';
            } else if (isNotVeryEffective) {
              bgColor = 'bg-blue-200 dark:bg-blue-800';
              textColor = 'text-blue-900 dark:text-blue-100';
              borderColor = 'border-blue-400 dark:border-blue-500';
            } else if (isImmune) {
              bgColor = 'bg-gray-400 dark:bg-gray-600';
              textColor = 'text-gray-800 dark:text-gray-200';
              borderColor = 'border-gray-500 dark:border-gray-500';
            }
            
            return (
              <div
                key={type}
                className={`px-2 py-1.5 rounded text-center border text-xs font-medium ${bgColor} ${textColor} ${borderColor}`}
                title={`${attacker} vs ${type}: x${effectiveness}`}
              >
                <div className="font-semibold">{type}</div>
                <div className="text-xs opacity-75">x{effectiveness}</div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Legend */}
      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-200 dark:bg-red-800 rounded border border-red-400 dark:border-red-500"></div>
            <span className="text-gray-700 dark:text-gray-300">Super Effective (2x+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-200 dark:bg-blue-800 rounded border border-blue-400 dark:border-blue-500"></div>
            <span className="text-gray-700 dark:text-gray-300">Not Very Effective (0.5x)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-400 dark:bg-gray-600 rounded border border-gray-500 dark:border-gray-500"></div>
            <span className="text-gray-700 dark:text-gray-300">No Effect (0x)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-indigo-200 dark:bg-indigo-800 rounded border border-indigo-400 dark:border-indigo-500"></div>
            <span className="text-gray-700 dark:text-gray-300">Selected Types</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewBanner({ attacker, defenders }: { attacker: TypeName; defenders: TypeName[] }) {
  const { calcEffectiveness } = require('@/lib/type/utils');
  const mult: number = calcEffectiveness(attacker, defenders.length ? defenders : []);
  const phrase = mult === 0 ? "Doesn't affect" : mult >= 4 ? 'Devastatingly effective!' : mult === 2 ? 'Super effective!' : mult < 1 ? 'Not very effective…' : 'Neutral';
  const color = mult === 0 ? 'bg-gray-200 dark:bg-gray-800' : mult >= 2 ? 'bg-orange-100 dark:bg-orange-900/40' : mult < 1 ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-gray-100 dark:bg-gray-900/40';
  return (
    <div className={`mt-4 rounded border p-2 text-xs ${color}`} aria-live="polite">
      Preview: {attacker} ➜ {defenders.join('/') || '—'} = x{mult} — {phrase}
    </div>
  );
}
