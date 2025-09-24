"use client";

import { useEffect, useRef, useState } from 'react';
import TypeBadge from '@/components/type/TypeBadge';
import { TYPES, type TypeName } from '@/lib/type/data';

export default function TypeSelect({
  value,
  onChange,
  allowEmpty = false,
  label = '',
}: {
  value: TypeName | '';
  onChange: (v: TypeName | '') => void;
  allowEmpty?: boolean;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!btnRef.current) return;
      if (!(e.target instanceof Element)) return;
      if (!e.target.closest('[data-typeselect-root]')) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div className="relative" data-typeselect-root>
      {label && <label className="block text-sm font-medium mb-1">{label}</label>}
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full rounded border bg-white/80 dark:bg-gray-900/60 px-2 py-2 flex items-center justify-between gap-2"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {value ? (
          <TypeBadge type={value as TypeName} />
        ) : (
          <span className="text-sm text-gray-500">—</span>
        )}
        <svg className="w-4 h-4 opacity-70" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.25 8.29a.75.75 0 01-.02-1.08z" clipRule="evenodd" />
        </svg>
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 w-full max-h-64 overflow-auto rounded border bg-white dark:bg-gray-900 shadow-lg p-2"
        >
          {allowEmpty && (
            <li className="mb-2">
              <button
                type="button"
                className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-sm border border-gray-200 dark:border-gray-700"
                onClick={() => { onChange(''); setOpen(false); }}
              >
                <span className="text-gray-500 font-medium">— None —</span>
              </button>
            </li>
          )}
          <div className="grid grid-cols-1 gap-1">
            {TYPES.map((t) => (
              <li key={t} role="option" aria-selected={value === t}>
                <button
                  type="button"
                  className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150 flex items-center justify-between ${value === t ? 'bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-400 dark:ring-blue-500' : ''}`}
                  onClick={() => { onChange(t); setOpen(false); }}
                >
                  <TypeBadge type={t} />
                  {value === t && (
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </li>
            ))}
          </div>
        </ul>
      )}
    </div>
  );
}


