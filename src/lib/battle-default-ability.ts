// Battle Pokémon need an active ability for ability effects (Intimidate, Levitate, Sturdy, ...) to run.
// Team slots rarely name one, so fall back to the species' primary ability from PokeAPI data.

type AbilityEntry = string | { ability?: { name?: string }; name?: string; is_hidden?: boolean; slot?: number };

function toId(name: unknown): string | undefined {
  if (typeof name !== 'string') return undefined;
  const id = name.trim().toLowerCase().replace(/[\s_]+/g, '-');
  return id || undefined;
}

/**
 * Ability a battle Pokémon starts with: an ability already in play (persisted between multiplayer turns),
 * then one chosen on the team slot, then the species' first non-hidden ability.
 */
export function resolveBattleAbility(
  raw: { currentAbility?: unknown; ability?: unknown } | null | undefined,
  abilities: AbilityEntry[] | null | undefined,
): string | undefined {
  const current = toId(raw?.currentAbility);
  if (current) return current;
  const chosen = typeof raw?.ability === 'object' && raw?.ability !== null
    ? toId((raw.ability as { name?: unknown }).name)
    : toId(raw?.ability);
  if (chosen) return chosen;

  const list = Array.isArray(abilities) ? abilities : [];
  const parsed = list
    .map((entry) =>
      typeof entry === 'string'
        ? { id: toId(entry), hidden: false, slot: 0 }
        : { id: toId(entry?.ability?.name ?? entry?.name), hidden: !!entry?.is_hidden, slot: entry?.slot ?? 0 },
    )
    .filter((e): e is { id: string; hidden: boolean; slot: number } => !!e.id);
  const visible = parsed.filter((e) => !e.hidden).sort((a, b) => a.slot - b.slot);
  return (visible[0] ?? parsed[0])?.id;
}
