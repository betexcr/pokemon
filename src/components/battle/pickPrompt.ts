/** Heading and hint for a pick that pauses the battle (pivot, faint replacement, revive, ...). */
export type PickReason = 'pivot' | 'baton-pass' | 'shed-tail' | 'revival-blessing' | 'faint';

export function pickPrompt(reason: PickReason | null | undefined): { heading: string; hint: string } {
  switch (reason) {
    case 'faint':
      return { heading: 'Choose your next Pokémon', hint: 'Your Pokémon fainted. Pick who goes in next.' };
    case 'baton-pass':
      return { heading: 'Choose a Pokémon to send in', hint: 'Baton Pass: pick who receives the stat changes.' };
    case 'shed-tail':
      return { heading: 'Choose a Pokémon to send in', hint: 'Shed Tail: pick who gets the substitute.' };
    case 'revival-blessing':
      return { heading: 'Choose a Pokémon to revive', hint: 'Revival Blessing brings a fainted Pokémon back with half its HP.' };
    default:
      return { heading: 'Choose a Pokémon to send in', hint: 'Pick which Pokémon comes in to finish the turn.' };
  }
}
