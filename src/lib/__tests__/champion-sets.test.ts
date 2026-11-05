import { describe, it, expect } from 'vitest';
import { CHAMPION_SETS } from '@/data/champion-sets';
import { GYM_CHAMPIONS } from '../gym_champions';
import { getBattleItem } from '../battle-items-catalog';
import { evTotal, sanitizeEvs } from '../battle-evs';
import { NATURES } from '@/data/natures';
import { isTeraType } from '../team-battle-tera';

describe('champion sets (generated data)', () => {
  it('line up with the champion teams', () => {
    for (const [id, sets] of Object.entries(CHAMPION_SETS)) {
      const champ = GYM_CHAMPIONS.find((c) => c.id === id);
      expect(champ, id).toBeDefined();
      expect(sets.length, id).toBe(champ!.team.slots.length);
      champ!.team.slots.forEach((slot, i) => {
        // Early leaders keep level-up moves; from level 30 every slot has a set
        if (slot.level < 30) expect(sets[i], `${id}#${i}`).toBeNull();
        else expect(sets[i], `${id}#${i}`).not.toBeNull();
      });
    }
  });

  it('only use legal, engine-supported values', () => {
    const natures = new Set(NATURES.map((n) => n.value));
    for (const [id, sets] of Object.entries(CHAMPION_SETS)) {
      for (const set of sets) {
        if (!set) continue;
        if (set.moves) {
          expect(set.moves.length, id).toBeGreaterThanOrEqual(2);
          expect(set.moves.length, id).toBeLessThanOrEqual(4);
          expect(new Set(set.moves).size, id).toBe(set.moves.length);
        }
        if (set.item) expect(getBattleItem(set.item), `${id} ${set.item}`).toBeDefined();
        expect(natures.has(set.nature as never), `${id} ${set.nature}`).toBe(true);
        expect(evTotal(set.evs)).toBeLessThanOrEqual(510);
        expect(sanitizeEvs(set.evs) ?? {}).toEqual(Object.fromEntries(Object.entries(set.evs).filter(([, v]) => v > 0)));
        if (set.teraType) expect(isTeraType(set.teraType), `${id} ${set.teraType}`).toBe(true);
      }
    }
  });

  it('give the late game champions full competitive sets', () => {
    const cynthia = CHAMPION_SETS['cynthia-champion-sinnoh'];
    const garchomp = cynthia[cynthia.length - 1]!;
    expect(garchomp.moves).toContain('earthquake');
    expect(garchomp.item).toBeDefined();
    expect(evTotal(garchomp.evs)).toBe(508);
  });
});
