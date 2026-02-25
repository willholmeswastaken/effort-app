import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import * as services from '@/lib/services';

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock('@/lib/services', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    runEffect: vi.fn(),
  };
});

describe('Programs API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if unauthorized', async () => {
    (auth.api.getSession as any).mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/programs');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('should return programs if authorized', async () => {
    (auth.api.getSession as any).mockResolvedValue({ user: { id: 'u1' } });
    (services.runEffect as any).mockResolvedValue([{ id: 'p1', name: 'Prog 1', daysPerWeek: 3 }]);

    const req = new NextRequest('http://localhost/api/programs');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0].name).toBe('Prog 1');
  });
});
