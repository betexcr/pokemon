"use client";

import { useEffect, useRef, useState } from 'react';

type Props = {
  label: string;
  children: React.ReactNode;
  content: React.ReactNode;
};

export default function TypeTooltip({ label, children, content }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div ref={ref} className="relative inline-block" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={label}
        className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
        onFocus={() => setOpen(true)}
        onBlur={(e) => {
          if (!ref.current?.contains(e.relatedTarget as Node)) setOpen(false);
        }}
      >
        {children}
      </button>
      {open && (
        <div role="dialog" aria-label={`${label} details`} className="absolute z-20 mt-2 w-80 rounded-lg border bg-white dark:bg-gray-900 p-4 shadow-xl">
          {content}
        </div>
      )}
    </div>
  );
}

