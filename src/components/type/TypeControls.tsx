"use client";

import { TYPES, type TypeName } from '@/lib/type/data';
import TypeBadge from '@/components/type/TypeBadge';
import TypeSelect from '@/components/type/TypeSelect';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type Mode = 'wheel' | 'matrix';

export default function TypeControls({ initialMode, initialAttacker, initialDefenders }: { initialMode: Mode; initialAttacker?: TypeName; initialDefenders?: TypeName[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  // Derive current values from URL first, falling back to provided initials
  const urlMode = (sp.get('mode') as Mode) || initialMode;
  const urlAttacker = (sp.get('attacker') as TypeName) || initialAttacker || 'Fire';
  const [mode, setMode] = useState<Mode>(urlMode);
  const [attacker, setAttacker] = useState<TypeName>(urlAttacker);
  const [def1, setDef1] = useState<TypeName | ''>(() => {
    const defs = sp.get('defender');
    if (defs) {
      const [d1] = defs.split(',').filter(Boolean) as TypeName[];
      return (d1 as TypeName) || initialDefenders?.[0] || 'Grass';
    }
    return initialDefenders?.[0] || 'Grass';
  });
  const [def2, setDef2] = useState<TypeName | ''>(() => {
    const defs = sp.get('defender');
    if (defs) {
      const [, d2] = defs.split(',').filter(Boolean) as TypeName[];
      return (d2 as TypeName) || initialDefenders?.[1] || '';
    }
    return initialDefenders?.[1] || '';
  });

  // Keep local state in sync when URL search params change (e.g., wheel clicks)
  useEffect(() => {
    const nextMode = ((sp.get('mode') as Mode) || initialMode);
    if (nextMode !== mode) setMode(nextMode);
    const nextAttacker = (sp.get('attacker') as TypeName) || initialAttacker || 'Fire';
    if (nextAttacker !== attacker) setAttacker(nextAttacker);
    const defs = sp.get('defender') || '';
    const [nextD1, nextD2] = defs.split(',').filter(Boolean) as TypeName[];
    if ((nextD1 || 'Grass') !== def1) setDef1((nextD1 as TypeName) || 'Grass');
    if ((nextD2 || '') !== def2) setDef2((nextD2 as TypeName) || '');
  }, [sp, initialMode, initialAttacker]);

  useEffect(() => {
    const usp = new URLSearchParams(sp.toString());
    usp.set('mode', mode);
    if (attacker) usp.set('attacker', attacker);
    else usp.delete('attacker');
    const defs = [def1, def2].filter(Boolean).join(',');
    if (defs) usp.set('defender', defs);
    else usp.delete('defender');
    router.replace(`${pathname}?${usp.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, attacker, def1, def2]);

  // Removed custom attacker change handler - using default behavior

  return (
    <form className="flex flex-col gap-3" aria-label="Type controls">
      <div className="flex gap-2">
        <button 
          type="button" 
          onClick={() => setMode('wheel')} 
          aria-pressed={mode === 'wheel'} 
          className={`px-4 py-2 rounded-lg border font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            mode === 'wheel' 
              ? 'bg-blue-600 hover:bg-blue-700 border-blue-600 text-white shadow-sm' 
              : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
          }`}
        >
          Wheel
        </button>
        <button 
          type="button" 
          onClick={() => setMode('matrix')} 
          aria-pressed={mode === 'matrix'} 
          className={`px-4 py-2 rounded-lg border font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            mode === 'matrix' 
              ? 'bg-blue-600 hover:bg-blue-700 border-blue-600 text-white shadow-sm' 
              : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
          }`}
        >
          Matrix
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <TypeSelect value={attacker} onChange={(v) => setAttacker((v || 'Fire') as TypeName)} label="Attacker" />
        <TypeSelect value={def1} onChange={setDef1} allowEmpty label="Defender 1" />
        <TypeSelect value={def2} onChange={setDef2} allowEmpty label="Defender 2" />
      </div>
    </form>
  );
}
