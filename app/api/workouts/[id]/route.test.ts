import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PATCH } from './route';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import * as services from '@/lib/services';

vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: vi.fn() } },
}));

vi.mock('@/lib/services', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return { ...actual, runEffect: vi.fn() };
});

describe('Workout ID API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET returns workout successfully', async () => {
    (auth.api.getSession as any).mockResolvedValue({ user: { id: 'u1' } });
    (services.runEffect as any).mockResolvedValue({ id: 'w1' });

    const req = new NextRequest('http://localhost/api/workouts/w1');
    const res = await GET(req, { params: Promise.resolve({ id: 'w1' }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.id).toBe('w1');
  });

  it('PATCH completes workout successfully', async () => {
    (auth.api.getSession as any).mockResolvedValue({ user: { id: 'u1' } });
    (services.runEffect as any).mockResolvedValue({});

    const req = new NextRequest('http://localhost/api/workouts/w1', {
      method: 'PATCH',
      body: JSON.stringify({ durationSeconds: 3600, rating: 5 }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'w1' }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
