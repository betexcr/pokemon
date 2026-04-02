import { describe, it, expect } from 'vitest';
import type { CompiledMove } from '../adapters/pokeapiMoveAdapter';
import tackleFixture from './fixtures/moves/tackle.compiled.json';

describe('committed move fixtures', () => {
  it('tackle.compiled.json has fields the engine expects', () => {
    const m = tackleFixture as CompiledMove;
    expect(m.name).toBe('tackle');
    expect(m.type).toBe('Normal');
    expect(m.category).toBe('Physical');
    expect(typeof m.power).toBe('number');
    expect(m.priority).toBe(0);
  });
});
