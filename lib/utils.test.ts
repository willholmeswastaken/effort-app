import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('should merge classes', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('should handle conditional classes', () => {
    expect(cn('a', true && 'b', false && 'c')).toBe('a b');
  });

  it('should handle tailwind merges', () => {
    expect(cn('px-2 py-2', 'p-4')).toBe('p-4');
  });
});
