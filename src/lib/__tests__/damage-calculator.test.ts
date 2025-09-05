import { 
  calculateTypeEffectiveness, 
  calculateDamage, 
  calculateComprehensiveDamage,
  getStatStageMultiplier,
  getWeatherModifier,
  getBurnModifier,
  getStabMultiplier,
  getCriticalHitChance,
  TypeName 
} from '../damage-calculator';

describe('Damage Calculator', () => {
  describe('Type Effectiveness', () => {
    test('should calculate single type effectiveness correctly', () => {
      expect(calculateTypeEffectiveness('Fire', ['Grass'])).toBe(2);
      expect(calculateTypeEffectiveness('Water', ['Fire'])).toBe(2);
      expect(calculateTypeEffectiveness('Electric', ['Ground'])).toBe(0);
      expect(calculateTypeEffectiveness('Normal', ['Ghost'])).toBe(0);
    });

    test('should calculate dual type effectiveness correctly', () => {
      // Fire vs Grass/Poison (Bulbasaur) = 2 * 0.5 = 1
      expect(calculateTypeEffectiveness('Fire', ['Grass', 'Poison'])).toBe(1);
      
      // Electric vs Water/Flying (Gyarados) = 2 * 2 = 4
      expect(calculateTypeEffectiveness('Electric', ['Water', 'Flying'])).toBe(4);
      
      // Fighting vs Normal/Ghost (Snorlax) = 2 * 0 = 0
      expect(calculateTypeEffectiveness('Fighting', ['Normal', 'Ghost'])).toBe(0);
    });

    test('should handle unknown types gracefully', () => {
      expect(calculateTypeEffectiveness('Fire', ['Unknown'] as TypeName[])).toBe(1);
    });
  });

  describe('Stat Stage Multipliers', () => {
    test('should calculate positive stat stages correctly', () => {
      expect(getStatStageMultiplier(0)).toBe(1);
      expect(getStatStageMultiplier(1)).toBe(1.5);
      expect(getStatStageMultiplier(2)).toBe(2);
      expect(getStatStageMultiplier(6)).toBe(4);
    });

    test('should calculate negative stat stages correctly', () => {
      expect(getStatStageMultiplier(-1)).toBe(2/3);
      expect(getStatStageMultiplier(-2)).toBe(0.5);
      expect(getStatStageMultiplier(-6)).toBe(0.25);
    });
  });

  describe('Weather Modifiers', () => {
    test('should apply rain weather correctly', () => {
      expect(getWeatherModifier('Water', 'Rain')).toBe(1.5);
      expect(getWeatherModifier('Fire', 'Rain')).toBe(0.5);
      expect(getWeatherModifier('Grass', 'Rain')).toBe(1);
    });

    test('should apply sun weather correctly', () => {
      expect(getWeatherModifier('Fire', 'Sun')).toBe(1.5);
      expect(getWeatherModifier('Water', 'Sun')).toBe(0.5);
      expect(getWeatherModifier('Grass', 'Sun')).toBe(1);
    });

    test('should handle no weather correctly', () => {
      expect(getWeatherModifier('Fire', 'None')).toBe(1);
      expect(getWeatherModifier('Water', 'None')).toBe(1);
    });
  });

  describe('Burn Modifiers', () => {
    test('should apply burn penalty to physical moves', () => {
      expect(getBurnModifier(true, true, false)).toBe(0.5);
    });

    test('should not apply burn penalty to special moves', () => {
      expect(getBurnModifier(true, false, false)).toBe(1);
    });

    test('should not apply burn penalty with Guts ability', () => {
      expect(getBurnModifier(true, true, true)).toBe(1);
    });

    test('should not apply burn penalty when not burned', () => {
      expect(getBurnModifier(false, true, false)).toBe(1);
    });
  });

  describe('STAB Multipliers', () => {
    test('should apply normal STAB correctly', () => {
      expect(getStabMultiplier('Fire', ['Fire'], false)).toBe(1.5);
      expect(getStabMultiplier('Water', ['Water'], false)).toBe(1.5);
    });

    test('should apply Adaptability STAB correctly', () => {
      expect(getStabMultiplier('Fire', ['Fire'], true)).toBe(2);
      expect(getStabMultiplier('Water', ['Water'], true)).toBe(2);
    });

    test('should not apply STAB for non-matching types', () => {
      expect(getStabMultiplier('Fire', ['Water'], false)).toBe(1);
      expect(getStabMultiplier('Fire', ['Water'], true)).toBe(1);
    });
  });

  describe('Critical Hit Chances', () => {
    test('should have correct base critical hit rate', () => {
      let crits = 0;
      const iterations = 10000;
      
      for (let i = 0; i < iterations; i++) {
        if (getCriticalHitChance()) crits++;
      }
      
      const rate = crits / iterations;
      expect(rate).toBeCloseTo(0.0625, 1); // 6.25%
    });

    test('should have higher crit rate for high crit moves', () => {
      let crits = 0;
      const iterations = 10000;
      
      for (let i = 0; i < iterations; i++) {
        if (getCriticalHitChance(0.0625, true)) crits++;
      }
      
      const rate = crits / iterations;
      expect(rate).toBeCloseTo(0.125, 1); // 12.5%
    });
  });

  describe('Basic Damage Calculation', () => {
    test('should calculate damage with basic parameters', () => {
      const damage = calculateDamage({
        level: 50,
        movePower: 100,
        attackStat: 100,
        defenseStat: 100,
        isCrit: false,
        stab: 1.5,
        typeEffect: 2,
        weatherMod: 1,
        burnMod: 1,
        otherMods: 1
      });

      expect(damage).toBeGreaterThan(0);
      expect(typeof damage).toBe('number');
    });

    test('should apply critical hit multiplier', () => {
      const normalDamage = calculateDamage({
        level: 50,
        movePower: 100,
        attackStat: 100,
        defenseStat: 100,
        isCrit: false,
        stab: 1,
        typeEffect: 1,
        weatherMod: 1,
        burnMod: 1,
        otherMods: 1
      });

      const critDamage = calculateDamage({
        level: 50,
        movePower: 100,
        attackStat: 100,
        defenseStat: 100,
        isCrit: true,
        stab: 1,
        typeEffect: 1,
        weatherMod: 1,
        burnMod: 1,
        otherMods: 1
      });

      expect(critDamage).toBeGreaterThan(normalDamage);
    });
  });

  describe('Comprehensive Damage Calculation', () => {
    test('should calculate damage with all modifiers', () => {
      const result = calculateComprehensiveDamage({
        level: 50,
        movePower: 100,
        moveType: 'Fire',
        attackerTypes: ['Fire'],
        defenderTypes: ['Grass'],
        attackStat: 100,
        defenseStat: 100,
        attackStatStages: 1,
        defenseStatStages: 0,
        isPhysical: true,
        weather: 'Sun',
        isBurned: false,
        hasGuts: false,
        hasAdaptability: false,
        hasLifeOrb: true,
        hasExpertBelt: false,
        hasReflect: false,
        hasLightScreen: false,
        isMultiTarget: false,
        terrain: 'None',
        hasTintedLens: false,
        hasFilter: false,
        hasSolidRock: false,
        hasMultiscale: false,
        isFullHp: true,
        hasHugePower: false,
        hasPurePower: false,
        hasSniper: false,
        isHighCritMove: false,
        hasSuperLuck: false
      });

      expect(result.damage).toBeGreaterThan(0);
      expect(result.effectiveness).toBe(2); // Fire vs Grass
      expect(result.effectivenessText).toBe('super_effective');
      expect(typeof result.critical).toBe('boolean');
    });

    test('should handle immunity correctly', () => {
      const result = calculateComprehensiveDamage({
        level: 50,
        movePower: 100,
        moveType: 'Fighting',
        attackerTypes: ['Fighting'],
        defenderTypes: ['Ghost'],
        attackStat: 100,
        defenseStat: 100,
        isPhysical: true
      });

      expect(result.damage).toBe(0);
      expect(result.effectiveness).toBe(0);
      expect(result.effectivenessText).toBe('no_effect');
    });

    test('should apply stat stage modifiers correctly', () => {
      const result = calculateComprehensiveDamage({
        level: 50,
        movePower: 100,
        moveType: 'Normal',
        attackerTypes: ['Normal'],
        defenderTypes: ['Normal'],
        attackStat: 100,
        defenseStat: 100,
        attackStatStages: 2, // +2 Attack
        defenseStatStages: -1, // -1 Defense
        isPhysical: true
      });

      expect(result.damage).toBeGreaterThan(0);
    });

    test('should apply ability modifiers correctly', () => {
      const normalResult = calculateComprehensiveDamage({
        level: 50,
        movePower: 100,
        moveType: 'Normal',
        attackerTypes: ['Normal'],
        defenderTypes: ['Normal'],
        attackStat: 100,
        defenseStat: 100,
        isPhysical: true,
        hasHugePower: false
      });

      const hugePowerResult = calculateComprehensiveDamage({
        level: 50,
        movePower: 100,
        moveType: 'Normal',
        attackerTypes: ['Normal'],
        defenderTypes: ['Normal'],
        attackStat: 100,
        defenseStat: 100,
        isPhysical: true,
        hasHugePower: true
      });

      expect(hugePowerResult.damage).toBeGreaterThan(normalResult.damage);
    });
  });
});
