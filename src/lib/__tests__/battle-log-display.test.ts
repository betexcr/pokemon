import { describe, it, expect } from 'vitest';
import { battleLogToDisplayLines } from '../battle-log-display';

describe('battleLogToDisplayLines', () => {
  it('marks engine_warning entries', () => {
    const lines = battleLogToDisplayLines([
      { type: 'move_used', message: 'Pikachu used Thunderbolt!' },
      { type: 'engine_warning', message: 'move data unavailable' },
    ] as unknown[]);
    expect(lines).toHaveLength(2);
    expect(lines[0].isEngineWarning).toBe(false);
    expect(lines[1].isEngineWarning).toBe(true);
    expect(lines[1].message).toContain('unavailable');
  });

  it('handles string entries', () => {
    expect(battleLogToDisplayLines(['Hello'])).toEqual([{ message: 'Hello', isEngineWarning: false }]);
  });
});
