import type { EvolutionChain } from '@/types/pokemon';
import type { Method } from './types';

// Evolution methods, shared by /evolutions/ and the Evolution tab of the Pokémon detail page so both
// describe and badge evolutions the same way.

type EvolutionDetail = EvolutionChain['chain']['evolves_to'][number]['evolution_details'][number];

/** Icon shown before an evolution method (same symbols on every page). */
export function methodIcon(kind: string): string {
  switch (kind) {
    case 'stone':
      return '💎';
    case 'trade':
      return '🔁';
    case 'friendship':
      return '💖';
    case 'location':
      return '📍';
    case 'special':
      return '✨';
    default:
      return '⬡';
  }
}

/** PokeAPI evolution_details entry → structured method. */
export function mapMethod(detail?: EvolutionDetail): Method {
  if (!detail) return { kind: 'special', hint: 'Special' };
  const trigger = detail.trigger?.name;

  // Collect possible conditions for a rich description
  const parts: string[] = [];
  if (detail.min_level != null) parts.push(`Level ${detail.min_level}`);
  if (detail.item?.name) parts.push(`${formatName(detail.item.name)}`);
  if (trigger === 'trade') parts.push('Trade');
  if (detail.held_item?.name) parts.push(`Hold ${formatName(detail.held_item.name)}`);
  if (detail.min_happiness != null) parts.push('High Friendship');
  if (detail.min_affection != null) parts.push('High Affection');
  if (detail.min_beauty != null) parts.push('High Beauty');
  if (detail.location?.name) parts.push(`At ${formatName(detail.location.name)}`);
  if (detail.known_move?.name) parts.push(`Know ${formatName(detail.known_move.name)}`);
  if (detail.known_move_type?.name) parts.push(`Know ${formatName(detail.known_move_type.name)}-type Move`);
  if (detail.party_species?.name) parts.push(`With ${formatName(detail.party_species.name)} in party`);
  if (detail.party_type?.name) parts.push(`With ${formatName(detail.party_type.name)}-type in party`);
  if (detail.time_of_day) parts.push(detail.time_of_day === 'day' ? 'Daytime' : 'Nighttime');
  if (detail.gender != null) parts.push(detail.gender === 1 ? 'Female' : detail.gender === 2 ? 'Male' : 'Gendered');
  if (detail.needs_overworld_rain) parts.push('While Raining');
  if (detail.trade_species?.name) parts.push(`Trade for ${formatName(detail.trade_species.name)}`);
  if (detail.turn_upside_down) parts.push('Hold device upside down');
  if (detail.relative_physical_stats != null) {
    parts.push(
      detail.relative_physical_stats > 0
        ? 'Atk > Def'
        : detail.relative_physical_stats < 0
        ? 'Atk < Def'
        : 'Atk = Def'
    );
  }

  // Prefer specific kinds when singular/simple; otherwise return a composed special hint.
  if (detail.min_level != null && parts.length === 1) return { kind: 'level', level: detail.min_level };
  if (detail.item?.name && parts.length === (trigger === 'trade' ? 2 : 1)) return { kind: 'stone', item: formatName(detail.item.name) };
  if (trigger === 'trade' && !detail.trade_species?.name && parts.length <= 2) {
    return detail.held_item?.name ? { kind: 'trade', item: formatName(detail.held_item.name) } : { kind: 'trade' };
  }
  if (detail.min_happiness != null && parts.length <= 2) {
    return detail.time_of_day ? { kind: 'friendship', time: detail.time_of_day as any } : { kind: 'friendship' };
  }
  if (detail.location?.name && parts.length === 1) return { kind: 'location', place: formatName(detail.location.name) };
  if (detail.held_item?.name && parts.length === 1) return { kind: 'heldItem', item: formatName(detail.held_item.name) };
  if (detail.known_move?.name && parts.length === 1) return { kind: 'move', move: formatName(detail.known_move.name) };
  if (detail.time_of_day && parts.length === 1) return { kind: 'time', time: detail.time_of_day as any };

  // Complex or multi-condition — return a composed special description
  const hint = parts.join(' + ').replace(/\s+/g, ' ').trim() || formatName(trigger || 'special');
  return { kind: 'special', hint };
}

function formatName(s?: string | null) {
  if (!s) return '';
  return s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
