'use client'

import { useEffect, useMemo, useState } from 'react'
import RichSelect, { type RichOption } from '@/components/team/RichSelect'
import { NATURES, type NatureName, type NatureStat } from '@/data/natures'
import { ITEM_CATEGORIES, getBattleItem, itemSpriteUrl, itemsForSpecies, sanitizeBattleItem } from '@/lib/battle-items-catalog'
import { getAbility } from '@/lib/api'

// Team-builder pickers that explain every option in the list (what a nature raises / lowers, what
// an item or ability does), so players can compare before choosing, not only after.

const STAT_SHORT: Record<NatureStat, string> = {
  attack: 'Atk', defense: 'Def', 'special-attack': 'SpA', 'special-defense': 'SpD', speed: 'Spe',
}
const STAT_LONG: Record<NatureStat, string> = {
  attack: 'Attack', defense: 'Defense', 'special-attack': 'Sp. Atk', 'special-defense': 'Sp. Def', speed: 'Speed',
}

const NATURE_OPTIONS: RichOption[] = NATURES.map((n) => {
  const neutral = !n.increasedStat || !n.decreasedStat
  return {
    value: n.value,
    label: n.label,
    group: neutral ? 'Neutral' : `Raises ${STAT_LONG[n.increasedStat!]}`,
    badge: neutral ? (
      <span className="text-[10px] text-muted">±0</span>
    ) : (
      <span className="text-[10px]">
        <span className="text-green-600 dark:text-green-400">+{STAT_SHORT[n.increasedStat!]}</span>
        {' / '}
        <span className="text-red-500 dark:text-red-400">-{STAT_SHORT[n.decreasedStat!]}</span>
      </span>
    ),
    description: neutral
      ? 'No stat changes.'
      : `Raises ${STAT_LONG[n.increasedStat!]} by 10%, lowers ${STAT_LONG[n.decreasedStat!]} by 10%.`,
  }
}).sort((a, b) => (a.group === 'Neutral' ? 1 : 0) - (b.group === 'Neutral' ? 1 : 0) || (a.group ?? '').localeCompare(b.group ?? ''))

export function NaturePicker({ id, value, onChange, testId }: { id?: string; value: string; onChange: (v: NatureName) => void; testId?: string }) {
  return (
    <RichSelect
      id={id}
      value={value}
      options={NATURE_OPTIONS}
      onChange={(v) => onChange(v as NatureName)}
      ariaLabel="Nature"
      testId={testId}
      searchable
      searchPlaceholder="Search natures or stats…"
    />
  )
}

function ItemIcon({ id }: { id: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={itemSpriteUrl(id)} alt="" width={24} height={24} loading="lazy" className="h-6 w-6 object-contain [image-rendering:pixelated]" />
}

export function ItemPicker({
  id,
  species,
  value,
  onChange,
  testId,
}: {
  id?: string
  species: string
  value: string | undefined
  onChange: (v: string | undefined) => void
  testId?: string
}) {
  const options = useMemo<RichOption[]>(() => {
    const available = itemsForSpecies(species)
    // Catalogue order within each category, categories in their usual order
    return ITEM_CATEGORIES.flatMap((category) =>
      available
        .filter((i) => i.category === category)
        .map((i) => ({ value: i.id, label: i.label, description: i.effect, group: category, icon: <ItemIcon id={i.id} /> }))
    )
  }, [species])
  return (
    <RichSelect
      id={id}
      value={getBattleItem(value)?.id ?? ''}
      options={options}
      emptyOption={{ label: 'No item', description: 'Holds nothing.', icon: <span className="text-sm text-muted">—</span> }}
      onChange={(v) => onChange(sanitizeBattleItem(v))}
      ariaLabel="Held item"
      testId={testId}
      searchable
      searchPlaceholder="Search items or effects…"
    />
  )
}

type AbilityEntry = { ability: { name: string }; is_hidden: boolean; slot: number }

// Descriptions are fetched once per ability name and shared by every slot
const abilityDescriptionCache = new Map<string, Promise<string | null>>()
function fetchAbilityDescription(name: string): Promise<string | null> {
  let p = abilityDescriptionCache.get(name)
  if (!p) {
    p = getAbility(name)
      .then((data) => {
        const en = data.effect_entries?.find((e) => e.language?.name === 'en')
        return (en?.short_effect || en?.effect || null)?.replace(/\s+/g, ' ').trim() || null
      })
      .catch(() => {
        abilityDescriptionCache.delete(name)
        return null
      })
    abilityDescriptionCache.set(name, p)
  }
  return p
}

const titleCase = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

export function AbilityPicker({
  id,
  abilities,
  value,
  onChange,
  testId,
}: {
  id?: string
  abilities: AbilityEntry[]
  value: string | undefined
  onChange: (v: string) => void
  testId?: string
}) {
  const sorted = useMemo(
    () => [...abilities].sort((a, b) => Number(a.is_hidden) - Number(b.is_hidden) || a.slot - b.slot),
    [abilities]
  )
  const [descriptions, setDescriptions] = useState<Record<string, string | null>>({})
  const names = sorted.map((a) => a.ability.name).join(',')
  useEffect(() => {
    let cancelled = false
    for (const a of sorted) {
      fetchAbilityDescription(a.ability.name).then((d) => {
        if (!cancelled) setDescriptions((prev) => (prev[a.ability.name] === d ? prev : { ...prev, [a.ability.name]: d }))
      })
    }
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [names])

  const defaultName = sorted.find((a) => !a.is_hidden)?.ability.name ?? sorted[0]?.ability.name
  const options = sorted.map<RichOption>((a) => ({
    value: a.ability.name,
    label: titleCase(a.ability.name),
    badge: a.is_hidden ? <span className="rounded bg-purple-500/15 px-1 text-[10px] font-medium text-purple-700 dark:text-purple-300">Hidden</span> : undefined,
    description: descriptions[a.ability.name] ?? 'Loading description…',
  }))

  return (
    <RichSelect
      id={id}
      value={value ?? ''}
      options={options}
      emptyOption={{
        label: `Default${defaultName ? ` (${titleCase(defaultName)})` : ''}`,
        description: defaultName ? descriptions[defaultName] ?? 'The first regular ability.' : 'The first regular ability.',
      }}
      onChange={onChange}
      ariaLabel="Ability"
      testId={testId}
    />
  )
}
