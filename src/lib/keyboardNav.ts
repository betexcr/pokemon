// Page-level arrow-key shortcuts (e.g. ←/→ for previous / next Pokémon) must not steal keys that
// already mean something where the focus is.

type KeyLike = { key: string; altKey: boolean; ctrlKey: boolean; metaKey: boolean; shiftKey: boolean; defaultPrevented: boolean };
type TargetLike = { tagName?: string; isContentEditable?: boolean; closest?: (selector: string) => unknown } | null;

// Widgets that use the arrow keys themselves
const ARROW_WIDGETS = '[role="tablist"],[role="listbox"],[role="slider"],[role="radiogroup"],[role="menu"],[role="menubar"],[role="grid"],[role="tree"],[role="spinbutton"],[role="combobox"]';

/**
 * Whether a ←/→ key press should be left alone instead of triggering page navigation: modifier
 * combinations (Alt+← is browser Back), typing in a field, arrow-key widgets, or an open dialog.
 */
export function shouldIgnoreArrowNavigation(event: KeyLike, target: TargetLike, dialogOpen = false): boolean {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return true;
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return true;
  if (dialogOpen) return true;
  if (!target) return false;
  const tag = (target.tagName ?? '').toUpperCase();
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) return true;
  return !!target.closest?.(ARROW_WIDGETS);
}
