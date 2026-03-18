"use client";

import type { TeamAnalysis, RoleEntry, AbilitySynergy, MoveSynergy } from '@/lib/team/engine';

const ROLE_COLORS: Record<string, string> = {
  'Physical Sweeper': 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  'Special Sweeper': 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  'Mixed Attacker': 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  'Physical Wall': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  'Special Wall': 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
  'Pivot': 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  'Support': 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300',
  'Hazard Setter': 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  'Hazard Remover': 'bg-lime-100 text-lime-800 dark:bg-lime-900/40 dark:text-lime-300',
  'Speed Control': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
};

function RoleBadge({ role }: { role: string }) {
  const color = ROLE_COLORS[role] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>{role}</span>;
}

function SynergyCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded border border-border p-3 bg-white/60 dark:bg-gray-900/40">
      <h4 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">{title}</h4>
      {children}
    </div>
  );
}

export default function SynergyPanel({ analysis }: { analysis: TeamAnalysis }) {
  const { abilitySynergies, moveSynergies, roles, roleWarnings } = analysis;
  const hasContent = roles.length > 0;

  if (!hasContent) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm">Team Synergy</h3>

      {/* Roles */}
      {roles.length > 0 && (
        <SynergyCard title="Team Roles">
          <div className="space-y-1.5">
            {roles.map((r, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="capitalize text-text truncate mr-2">{r.pokemon}</span>
                <RoleBadge role={r.role} />
              </div>
            ))}
          </div>
        </SynergyCard>
      )}

      {/* Ability Synergies */}
      {abilitySynergies.length > 0 && (
        <SynergyCard title="Ability Synergies">
          <ul className="space-y-1.5 text-xs">
            {abilitySynergies.map((s, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0">&#x2713;</span>
                <span className="text-text">
                  <span className="font-medium capitalize">{s.pokemon[0]}</span>
                  {' + '}
                  <span className="font-medium capitalize">{s.pokemon[1]}</span>
                  {' — '}
                  <span className="text-muted">{s.label}</span>
                </span>
              </li>
            ))}
          </ul>
        </SynergyCard>
      )}

      {/* Move Synergies */}
      {moveSynergies.length > 0 && (
        <SynergyCard title="Move Combos">
          <ul className="space-y-1.5 text-xs">
            {moveSynergies.map((s, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0">&#x25C6;</span>
                <span className="text-text">{s.label}</span>
              </li>
            ))}
          </ul>
        </SynergyCard>
      )}

      {/* Warnings */}
      {roleWarnings.length > 0 && (
        <SynergyCard title="Balance Warnings">
          <ul className="space-y-1.5 text-xs">
            {roleWarnings.map((w, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0">&#x26A0;</span>
                <span className="text-text">{w}</span>
              </li>
            ))}
          </ul>
        </SynergyCard>
      )}
    </div>
  );
}
