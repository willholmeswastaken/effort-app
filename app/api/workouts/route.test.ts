import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
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

describe('Workouts API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET returns 401 if unauthorized', async () => {
    (auth.api.getSession as any).mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/workouts');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('POST returns 400 if body is missing fields', async () => {
    (auth.api.getSession as any).mockResolvedValue({ user: { id: 'u1' } });
    const req = new NextRequest('http://localhost/api/workouts', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('POST starts a workout and returns id', async () => {
    (auth.api.getSession as any).mockResolvedValue({ user: { id: 'u1' } });
    (services.runEffect as any).mockResolvedValue({ workoutId: 'w1' });

    const req = new NextRequest('http://localhost/api/workouts', {
      method: 'POST',
      body: JSON.stringify({ programId: 'p1', dayId: 'd1' }),
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.id).toBe('w1');
  });
});
