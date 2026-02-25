import { describe, it, expect } from 'vitest';
import { exercises, programs } from './data';

describe('Data', () => {
  it('should have exercises', () => {
    expect(Object.keys(exercises).length).toBeGreaterThan(0);
    expect(exercises['bench-press']).toBeDefined();
  });

  it('should have programs', () => {
    expect(programs).toHaveLength(3);
    expect(programs[0].name).toContain('3 Day');
  });
});
