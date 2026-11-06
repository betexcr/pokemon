'use client'

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { ChevronDown, Search } from 'lucide-react'

export type RichOption = {
  value: string
  label: string
  /** What the option does, shown in the list so it can be compared before choosing. */
  description?: string | null
  icon?: ReactNode
  /** Small tag after the label (e.g. "Hidden", "+Atk / -SpA"). */
  badge?: ReactNode
  group?: string
}

type Props = {
  id?: string
  value: string
  options: RichOption[]
  onChange: (value: string) => void
  /** Option for "nothing chosen" (value ''), shown first. */
  emptyOption?: Omit<RichOption, 'value' | 'group'>
  ariaLabel: string
  testId?: string
  searchPlaceholder?: string
  /** Show a search box (long lists such as items). */
  searchable?: boolean
  className?: string
}

/**
 * Select with an icon and a description for every option, so players can see what each nature,
 * item or ability does before picking it. Keyboard: Enter / Space / ArrowDown open, arrows move,
 * Enter selects, Escape closes; typing filters when searchable.
 */
export default function RichSelect({
  id,
  value,
  options,
  onChange,
  emptyOption,
  ariaLabel,
  testId,
  searchPlaceholder = 'Search…',
  searchable = false,
  className = '',
}: Props) {
  const autoId = useId()
  const listId = `${id ?? autoId}-list`
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const all = useMemo<RichOption[]>(
    () => (emptyOption ? [{ value: '', ...emptyOption }, ...options] : options),
    [emptyOption, options]
  )
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return all
    return all.filter((o) => `${o.label} ${o.description ?? ''} ${o.group ?? ''}`.toLowerCase().includes(q))
  }, [all, query])
  const selected = all.find((o) => o.value === value) ?? all[0]

  useEffect(() => {
    if (!open) return
    const i = filtered.findIndex((o) => o.value === value)
    setActive(i >= 0 ? i : 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, query])

  useEffect(() => {
    if (!open) return
    if (searchable) searchRef.current?.focus()
    else listRef.current?.focus()
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open, searchable])

  useEffect(() => {
    if (!open) return
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  const choose = (v: string) => {
    onChange(v)
    setOpen(false)
    setQuery('')
    buttonRef.current?.focus()
  }

  const onListKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(filtered.length - 1, i + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(0, i - 1)) }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0) }
    else if (e.key === 'End') { e.preventDefault(); setActive(filtered.length - 1) }
    else if (e.key === 'Enter' || (e.key === ' ' && !searchable)) {
      e.preventDefault()
      const opt = filtered[active]
      if (opt) choose(opt.value)
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      if (e.key === 'Escape') e.preventDefault()
      setOpen(false)
      setQuery('')
      if (e.key === 'Escape') buttonRef.current?.focus()
    }
  }

  let lastGroup: string | undefined
  return (
    <div ref={rootRef} className={`relative min-w-0 ${className}`} onClick={(e) => e.stopPropagation()}>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={`${ariaLabel}: ${selected?.label ?? ''}`}
        data-testid={testId}
        data-value={value}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); setOpen(true) }
        }}
        className="flex w-full min-w-0 items-center gap-2 rounded border border-border bg-surface px-2 py-1 text-left text-xs text-text hover:border-poke-blue/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-poke-blue/50"
      >
        {selected?.icon && <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center">{selected.icon}</span>}
        <span className="truncate font-medium">{selected?.label}</span>
        {selected?.badge && <span className="flex-shrink-0">{selected.badge}</span>}
        <ChevronDown className="ml-auto h-3.5 w-3.5 flex-shrink-0 text-muted" aria-hidden />
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-1 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-border bg-surface shadow-xl">
          {searchable && (
            <div className="flex items-center gap-2 border-b border-border px-2 py-1.5">
              <Search className="h-3.5 w-3.5 text-muted" aria-hidden />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onListKey}
                placeholder={searchPlaceholder}
                aria-label={`Search ${ariaLabel.toLowerCase()}`}
                aria-controls={listId}
                aria-activedescendant={filtered[active] ? `${listId}-${active}` : undefined}
                className="w-full bg-transparent text-xs text-text outline-none placeholder:text-muted"
              />
            </div>
          )}
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            tabIndex={-1}
            aria-label={ariaLabel}
            aria-activedescendant={filtered[active] ? `${listId}-${active}` : undefined}
            onKeyDown={onListKey}
            className="max-h-72 overflow-y-auto py-1 focus:outline-none"
          >
            {filtered.length === 0 && <li className="px-3 py-2 text-xs text-muted">No matches</li>}
            {filtered.map((o, i) => {
              const header = o.group && o.group !== lastGroup ? o.group : null
              lastGroup = o.group
              return (
                <li key={o.value || '__empty'} role="presentation">
                  {header && (
                    <div className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-muted">{header}</div>
                  )}
                  <div
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={o.value === value}
                    data-index={i}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => choose(o.value)}
                    className={`flex cursor-pointer items-start gap-2 px-3 py-1.5 ${i === active ? 'bg-poke-blue/10' : ''} ${o.value === value ? 'font-semibold' : ''}`}
                  >
                    <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center">{o.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 text-xs text-text">
                        <span className="truncate">{o.label}</span>
                        {o.badge}
                      </span>
                      {o.description && <span className="block text-[11px] font-normal leading-snug text-muted">{o.description}</span>}
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
