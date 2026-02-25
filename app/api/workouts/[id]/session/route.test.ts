import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import * as services from '@/lib/services';
import { headers } from 'next/headers';

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: vi.fn() } },
}));

vi.mock('@/lib/services', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return { ...actual, runEffect: vi.fn() };
});

describe('Workout Session API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (headers as any).mockResolvedValue(new Headers());
  });

  it('GET returns workout session successfully', async () => {
    (auth.api.getSession as any).mockResolvedValue({ user: { id: 'u1' } });
    (services.runEffect as any).mockResolvedValue({
      workout: { id: 'w1', startedAt: new Date() },
      exercises: [],
      sets: []
    });

    const req = new NextRequest('http://localhost/api/workouts/w1/session');
    const res = await GET(req, { params: Promise.resolve({ id: 'w1' }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.workout.id).toBe('w1');
  });

  it('GET returns 404 if error in result', async () => {
    (auth.api.getSession as any).mockResolvedValue({ user: { id: 'u1' } });
    (services.runEffect as any).mockResolvedValue({ error: 'Not found' });

    const req = new NextRequest('http://localhost/api/workouts/w1/session');
    const res = await GET(req, { params: Promise.resolve({ id: 'w1' }) });
    expect(res.status).toBe(404);
  });

  it('GET returns 500 if runEffect throws', async () => {
    (auth.api.getSession as any).mockResolvedValue({ user: { id: 'u1' } });
    (services.runEffect as any).mockImplementation(() => {
      throw new Error('Async error');
    });

    const req = new NextRequest('http://localhost/api/workouts/w1/session');
    const res = await GET(req, { params: Promise.resolve({ id: 'w1' }) });
    expect(res.status).toBe(500);
  });
});
