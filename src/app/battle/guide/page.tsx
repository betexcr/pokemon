'use client'

import { useState } from 'react'
import AppHeader from '@/components/AppHeader'
import TypeBadge from '@/components/TypeBadge'
import { TYPES } from '@/lib/type/data'
import { calcEffectiveness } from '@/lib/type/utils'
import { NATURES } from '@/data/natures'

const SECTIONS = [
  'Type Effectiveness',
  'Status Conditions',
  'Weather & Terrain',
  'Natures & Stats',
  'Priority & Speed',
  'Damage Formula',
  'Abilities',
  'Items',
] as const

type Section = (typeof SECTIONS)[number]

export default function BattleGuidePage() {
  const [active, setActive] = useState<Section>('Type Effectiveness')

  return (
    <div className="min-h-screen bg-bg text-text">
      <AppHeader
        title="Battle Guide"
        subtitle="Everything you need to know about Pokemon battles"
        backLink="/battle"
        backLabel="Back to Battle"
        iconKey="battle"
        showIcon={true}
        showToolbar={true}
      />

      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Section Tabs */}
        <nav className="mb-8 flex flex-wrap gap-2" aria-label="Guide sections">
          {SECTIONS.map(s => (
            <button
              key={s}
              onClick={() => setActive(s)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-colors ${
                active === s
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-border text-muted hover:bg-surface/60'
              }`}
            >
              {s}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="space-y-6">
          {active === 'Type Effectiveness' && <TypeEffectivenessSection />}
          {active === 'Status Conditions' && <StatusConditionsSection />}
          {active === 'Weather & Terrain' && <WeatherTerrainSection />}
          {active === 'Natures & Stats' && <NaturesSection />}
          {active === 'Priority & Speed' && <PrioritySection />}
          {active === 'Damage Formula' && <DamageFormulaSection />}
          {active === 'Abilities' && <AbilitiesSection />}
          {active === 'Items' && <ItemsSection />}
        </div>
      </main>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-surface p-6">
      <h2 className="text-xl font-bold mb-4 text-text">{title}</h2>
      {children}
    </section>
  )
}

function TypeEffectivenessSection() {
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <Card title="Type Effectiveness">
      <p className="text-sm text-muted mb-4">
        Every type has strengths and weaknesses against other types. Super-effective moves deal 2x damage,
        not-very-effective deal 0.5x, and immune matchups deal 0x. Dual-typed Pokemon multiply these together (e.g., 4x or 0.25x).
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              <th className="p-1 text-left text-muted sticky left-0 bg-surface z-10">Atk &#x2193; / Def &#x2192;</th>
              {TYPES.map(t => (
                <th key={t} className="p-1 text-center">
                  <TypeBadge type={t.toLowerCase()} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TYPES.map(atk => (
              <tr key={atk} className="border-t border-border/40">
                <td className="p-1 sticky left-0 bg-surface z-10"><TypeBadge type={atk.toLowerCase()} /></td>
                {TYPES.map(def => {
                  const eff = calcEffectiveness(atk, [def])
                  const bg =
                    eff >= 2 ? 'bg-green-200 dark:bg-green-900/60 text-green-900 dark:text-green-200' :
                    eff <= 0 ? 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400' :
                    eff < 1 ? 'bg-red-200 dark:bg-red-900/60 text-red-900 dark:text-red-200' : ''
                  return (
                    <td
                      key={def}
                      className={`p-1 text-center font-mono ${bg}`}
                      onMouseEnter={() => setHovered(`${atk}->${def}`)}
                      onMouseLeave={() => setHovered(null)}
                      title={`${atk} vs ${def}: ${eff}x`}
                    >
                      {eff === 1 ? '' : eff === 0 ? '0' : `${eff}`}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted mt-3">
        Green = super effective (2x), Red = not very effective (0.5x), Gray = no effect (0x). Empty = neutral (1x).
      </p>
    </Card>
  )
}

function StatusConditionsSection() {
  const statuses = [
    { name: 'Burn', icon: '🔥', effect: 'Halves physical attack. Deals 1/16 max HP damage each turn. Fire-types are immune.' },
    { name: 'Paralysis', icon: '⚡', effect: 'Halves speed. 25% chance of being unable to move each turn. Electric-types are immune.' },
    { name: 'Poison', icon: '☠️', effect: 'Deals 1/8 max HP damage each turn. Poison and Steel-types are immune.' },
    { name: 'Badly Poisoned', icon: '💀', effect: 'Damage increases each turn (1/16, 2/16, 3/16...). Resets on switch. Poison and Steel-types are immune.' },
    { name: 'Sleep', icon: '💤', effect: 'Cannot move for 1-3 turns. Some moves (Sleep Talk, Snore) can still be used.' },
    { name: 'Freeze', icon: '❄️', effect: 'Cannot move. 20% chance to thaw each turn. Fire moves and Scald thaw the user. Ice-types are immune.' },
    { name: 'Confusion', icon: '💫', effect: 'Volatile condition (1-4 turns). 33% chance to hit self for 40 base power typeless physical damage.' },
  ]

  return (
    <Card title="Status Conditions">
      <p className="text-sm text-muted mb-4">
        Only one main status (burn/paralysis/poison/sleep/freeze) can be active at a time. Confusion is a volatile
        condition and stacks with main status. Switching out clears volatile conditions.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {statuses.map(s => (
          <div key={s.name} className="rounded-lg border border-border p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{s.icon}</span>
              <span className="font-semibold text-sm">{s.name}</span>
            </div>
            <p className="text-xs text-muted">{s.effect}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}

function WeatherTerrainSection() {
  const weathers = [
    { name: 'Sun (Harsh Sunlight)', effect: 'Fire moves 1.5x, Water moves 0.5x. Solar Beam charges instantly. Abilities: Drought, Chlorophyll, Solar Power.' },
    { name: 'Rain', effect: 'Water moves 1.5x, Fire moves 0.5x. Thunder and Hurricane never miss. Abilities: Drizzle, Swift Swim, Rain Dish.' },
    { name: 'Sandstorm', effect: 'Rock-types get 1.5x Sp.Def. Deals 1/16 chip to non-Rock/Ground/Steel. Abilities: Sand Stream, Sand Rush.' },
    { name: 'Snow', effect: 'Ice-types get 1.5x Defense. Blizzard never misses. Abilities: Snow Warning, Slush Rush, Ice Body.' },
  ]

  const terrains = [
    { name: 'Electric Terrain', effect: 'Grounded Pokemon cannot fall asleep. Electric moves 1.3x for grounded Pokemon.' },
    { name: 'Grassy Terrain', effect: 'Grounded Pokemon heal 1/16 HP each turn. Grass moves 1.3x, Earthquake/Bulldoze/Magnitude halved.' },
    { name: 'Psychic Terrain', effect: 'Grounded Pokemon are immune to priority moves. Psychic moves 1.3x for grounded Pokemon.' },
    { name: 'Misty Terrain', effect: 'Grounded Pokemon cannot be statused or confused. Dragon moves halved on grounded targets.' },
  ]

  return (
    <Card title="Weather & Terrain">
      <h3 className="font-semibold text-sm mb-3">Weather</h3>
      <div className="grid gap-3 sm:grid-cols-2 mb-6">
        {weathers.map(w => (
          <div key={w.name} className="rounded-lg border border-border p-3">
            <span className="font-semibold text-sm block mb-1">{w.name}</span>
            <p className="text-xs text-muted">{w.effect}</p>
          </div>
        ))}
      </div>
      <h3 className="font-semibold text-sm mb-3">Terrain</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {terrains.map(t => (
          <div key={t.name} className="rounded-lg border border-border p-3">
            <span className="font-semibold text-sm block mb-1">{t.name}</span>
            <p className="text-xs text-muted">{t.effect}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted mt-3">Weather and terrain each last 5 turns (8 with the appropriate extension item).</p>
    </Card>
  )
}

function NaturesSection() {
  const statLabel: Record<string, string> = {
    attack: 'Atk', defense: 'Def', 'special-attack': 'SpA', 'special-defense': 'SpD', speed: 'Spe'
  }

  return (
    <Card title="Natures & Stats">
      <p className="text-sm text-muted mb-4">
        Each nature increases one stat by 10% and decreases another by 10%. Neutral natures have no effect.
        There are 6 stats: HP, Attack, Defense, Special Attack, Special Defense, and Speed.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="py-1 px-2 text-left text-muted">Nature</th>
              <th className="py-1 px-2 text-left text-green-600">+10%</th>
              <th className="py-1 px-2 text-left text-red-500">-10%</th>
            </tr>
          </thead>
          <tbody>
            {NATURES.filter(n => n.increasedStat).map(n => (
              <tr key={n.value} className="border-b border-border/40">
                <td className="py-1 px-2 font-medium">{n.label}</td>
                <td className="py-1 px-2 text-green-600">{statLabel[n.increasedStat!]}</td>
                <td className="py-1 px-2 text-red-500">{statLabel[n.decreasedStat!]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted mt-3">
        Neutral natures: Hardy, Docile, Serious, Bashful, Quirky. These have no stat modifications.
      </p>
    </Card>
  )
}

function PrioritySection() {
  const priorities = [
    { bracket: '+5', moves: 'Helping Hand' },
    { bracket: '+4', moves: 'Protect, Detect, Endure, King\'s Shield, Spiky Shield, Baneful Bunker' },
    { bracket: '+3', moves: 'Fake Out, Quick Guard, Wide Guard' },
    { bracket: '+2', moves: 'Extreme Speed, First Impression, Feint' },
    { bracket: '+1', moves: 'Aqua Jet, Bullet Punch, Ice Shard, Mach Punch, Quick Attack, Shadow Sneak, Sucker Punch, Water Shuriken, Accelerock' },
    { bracket: '0', moves: 'Most moves' },
    { bracket: '-1', moves: 'Vital Throw' },
    { bracket: '-3', moves: 'Focus Punch' },
    { bracket: '-5', moves: 'Avalanche, Revenge' },
    { bracket: '-6', moves: 'Whirlwind, Roar, Dragon Tail, Circle Throw' },
    { bracket: '-7', moves: 'Trick Room' },
  ]

  return (
    <Card title="Priority & Speed">
      <p className="text-sm text-muted mb-4">
        Moves execute in priority order first, then by speed within the same priority bracket. Higher priority always goes first regardless of speed.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="py-1 px-2 text-left text-muted w-20">Priority</th>
              <th className="py-1 px-2 text-left text-muted">Example Moves</th>
            </tr>
          </thead>
          <tbody>
            {priorities.map(p => (
              <tr key={p.bracket} className="border-b border-border/40">
                <td className="py-1 px-2 font-mono font-bold">{p.bracket}</td>
                <td className="py-1 px-2">{p.moves}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 rounded-lg border border-border p-3">
        <h4 className="font-semibold text-sm mb-1">Speed Mechanics</h4>
        <ul className="text-xs text-muted space-y-1 list-disc list-inside">
          <li>Paralysis halves speed.</li>
          <li>Tailwind doubles team speed for 4 turns.</li>
          <li>Trick Room reverses speed order within each priority bracket for 5 turns.</li>
          <li>Choice Scarf multiplies speed by 1.5x.</li>
          <li>Abilities like Swift Swim and Chlorophyll double speed in their respective weather.</li>
        </ul>
      </div>
    </Card>
  )
}

function DamageFormulaSection() {
  return (
    <Card title="Damage Formula">
      <p className="text-sm text-muted mb-4">The core damage formula used since Generation V:</p>
      <div className="rounded-lg border border-border bg-gray-50 dark:bg-gray-800/50 p-4 font-mono text-sm text-center mb-4">
        Damage = ((2*Level/5 + 2) * Power * A/D) / 50 + 2) * Modifier
      </div>
      <h3 className="font-semibold text-sm mb-2">Key Modifiers</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { name: 'STAB', desc: '1.5x if the move type matches one of the attacker\'s types.' },
          { name: 'Type Effectiveness', desc: '0x, 0.25x, 0.5x, 1x, 2x, or 4x based on type chart.' },
          { name: 'Critical Hit', desc: '1.5x damage. Ignores negative attack mods and positive defense mods. ~4.17% base rate.' },
          { name: 'Weather', desc: 'Sun: Fire 1.5x, Water 0.5x. Rain: Water 1.5x, Fire 0.5x.' },
          { name: 'Burn', desc: 'Physical attacks deal 0.5x when burned (except Facade).' },
          { name: 'Random Factor', desc: 'Final damage multiplied by random 85%-100% roll.' },
        ].map(m => (
          <div key={m.name} className="rounded-lg border border-border p-3">
            <span className="font-semibold text-sm block mb-1">{m.name}</span>
            <p className="text-xs text-muted">{m.desc}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}

function AbilitiesSection() {
  const categories = [
    {
      title: 'Weather Setting',
      abilities: [
        { name: 'Drought', desc: 'Sets Sun on entry.' },
        { name: 'Drizzle', desc: 'Sets Rain on entry.' },
        { name: 'Sand Stream', desc: 'Sets Sandstorm on entry.' },
        { name: 'Snow Warning', desc: 'Sets Snow on entry.' },
      ]
    },
    {
      title: 'Speed Boosting',
      abilities: [
        { name: 'Swift Swim', desc: '2x speed in Rain.' },
        { name: 'Chlorophyll', desc: '2x speed in Sun.' },
        { name: 'Sand Rush', desc: '2x speed in Sandstorm.' },
        { name: 'Slush Rush', desc: '2x speed in Snow.' },
        { name: 'Speed Boost', desc: '+1 Speed at end of each turn.' },
      ]
    },
    {
      title: 'Defensive',
      abilities: [
        { name: 'Intimidate', desc: '-1 Attack to opponents on entry.' },
        { name: 'Multiscale', desc: 'Halves damage at full HP.' },
        { name: 'Sturdy', desc: 'Survives any single hit at full HP with 1 HP.' },
        { name: 'Magic Guard', desc: 'Only takes damage from direct attacks.' },
        { name: 'Regenerator', desc: 'Heals 1/3 HP on switch-out.' },
      ]
    },
    {
      title: 'Offensive',
      abilities: [
        { name: 'Adaptability', desc: 'STAB moves deal 2x instead of 1.5x.' },
        { name: 'Huge Power / Pure Power', desc: 'Doubles Attack stat.' },
        { name: 'Protean / Libero', desc: 'Changes type to match the used move (once per switch-in).' },
        { name: 'Sheer Force', desc: '+30% power for moves with secondary effects (removes the secondary effect).' },
      ]
    },
  ]

  return (
    <Card title="Abilities Overview">
      <p className="text-sm text-muted mb-4">
        Each Pokemon has one active ability. Abilities activate passively and can dramatically influence battle outcomes.
      </p>
      {categories.map(cat => (
        <div key={cat.title} className="mb-4">
          <h3 className="font-semibold text-sm mb-2">{cat.title}</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {cat.abilities.map(a => (
              <div key={a.name} className="flex gap-2 text-xs">
                <span className="font-medium text-text min-w-[120px]">{a.name}</span>
                <span className="text-muted">{a.desc}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </Card>
  )
}

function ItemsSection() {
  const items = [
    { name: 'Leftovers', desc: 'Restores 1/16 max HP each turn.' },
    { name: 'Choice Band / Specs / Scarf', desc: '1.5x Attack / Sp.Atk / Speed respectively, but locks into one move.' },
    { name: 'Life Orb', desc: '1.3x damage but costs 10% max HP per attack.' },
    { name: 'Focus Sash', desc: 'Survives any hit at full HP with 1 HP (one-time use).' },
    { name: 'Heavy-Duty Boots', desc: 'Immune to entry hazards.' },
    { name: 'Eviolite', desc: '1.5x Defense and Sp.Def for NFE (not fully evolved) Pokemon.' },
    { name: 'Assault Vest', desc: '1.5x Sp.Def, but cannot use status moves.' },
    { name: 'Sitrus Berry', desc: 'Restores 25% HP when HP drops below 50%.' },
    { name: 'Lum Berry', desc: 'Cures any status condition once.' },
    { name: 'Rocky Helmet', desc: 'Deals 1/6 max HP to attackers that make contact.' },
  ]

  return (
    <Card title="Common Battle Items">
      <p className="text-sm text-muted mb-4">
        Each Pokemon can hold one item. Items can provide healing, power boosts, protection, or strategic utility.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map(item => (
          <div key={item.name} className="rounded-lg border border-border p-3">
            <span className="font-semibold text-sm block mb-1">{item.name}</span>
            <p className="text-xs text-muted">{item.desc}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}
