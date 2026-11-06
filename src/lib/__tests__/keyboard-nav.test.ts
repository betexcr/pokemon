import { describe, it, expect } from 'vitest';
import { shouldIgnoreArrowNavigation } from '../keyboardNav';

const key = (k: string, mods: Partial<{ altKey: boolean; ctrlKey: boolean; metaKey: boolean; shiftKey: boolean; defaultPrevented: boolean }> = {}) => ({
  key: k, altKey: false, ctrlKey: false, metaKey: false, shiftKey: false, defaultPrevented: false, ...mods,
});
const el = (tagName: string, closestMatch = false, isContentEditable = false) => ({ tagName, isContentEditable, closest: () => (closestMatch ? {} : null) });

describe('shouldIgnoreArrowNavigation (← / → previous / next Pokémon)', () => {
  it('navigates on plain ← / → with focus on the page', () => {
    expect(shouldIgnoreArrowNavigation(key('ArrowLeft'), el('BODY'))).toBe(false);
    expect(shouldIgnoreArrowNavigation(key('ArrowRight'), el('BUTTON'))).toBe(false);
    expect(shouldIgnoreArrowNavigation(key('ArrowRight'), null)).toBe(false);
  });

  it('ignores other keys and modifier combinations (Alt+← is browser Back)', () => {
    expect(shouldIgnoreArrowNavigation(key('ArrowUp'), el('BODY'))).toBe(true);
    expect(shouldIgnoreArrowNavigation(key('ArrowLeft', { altKey: true }), el('BODY'))).toBe(true);
    expect(shouldIgnoreArrowNavigation(key('ArrowLeft', { metaKey: true }), el('BODY'))).toBe(true);
    expect(shouldIgnoreArrowNavigation(key('ArrowRight', { shiftKey: true }), el('BODY'))).toBe(true);
    expect(shouldIgnoreArrowNavigation(key('ArrowRight', { defaultPrevented: true }), el('BODY'))).toBe(true);
  });

  it('leaves the arrows to fields, arrow-key widgets and open dialogs', () => {
    expect(shouldIgnoreArrowNavigation(key('ArrowLeft'), el('INPUT'))).toBe(true);
    expect(shouldIgnoreArrowNavigation(key('ArrowLeft'), el('TEXTAREA'))).toBe(true);
    expect(shouldIgnoreArrowNavigation(key('ArrowLeft'), el('SELECT'))).toBe(true);
    expect(shouldIgnoreArrowNavigation(key('ArrowLeft'), el('DIV', false, true))).toBe(true);
    // e.g. a focused tab in the detail page tab list
    expect(shouldIgnoreArrowNavigation(key('ArrowRight'), el('BUTTON', true))).toBe(true);
    expect(shouldIgnoreArrowNavigation(key('ArrowRight'), el('BODY'), true)).toBe(true);
  });
});
