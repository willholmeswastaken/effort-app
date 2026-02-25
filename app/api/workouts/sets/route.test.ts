import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
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

describe('Workouts Sets API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('upserts set successfully', async () => {
    (auth.api.getSession as any).mockResolvedValue({ user: { id: 'u1' } });
    (services.runEffect as any).mockResolvedValue({});

    const req = new NextRequest('http://localhost/api/workouts/sets', {
      method: 'POST',
      body: JSON.stringify({ workoutLogId: 'w1', exerciseId: 'e1', setNumber: 1, reps: 10, weight: 100 }),
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
