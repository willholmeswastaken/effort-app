import { describe, it, expect } from 'vitest';
import { GET, POST } from './route';

describe('Auth API', () => {
  it('exports GET and POST handlers', () => {
    expect(GET).toBeDefined();
    expect(POST).toBeDefined();
  });
});
