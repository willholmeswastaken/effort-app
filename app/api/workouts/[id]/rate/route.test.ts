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

describe('Workout Rate API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST rates workout successfully', async () => {
    (auth.api.getSession as any).mockResolvedValue({ user: { id: 'u1' } });
    (services.runEffect as any).mockResolvedValue({});

    const req = new NextRequest('http://localhost/api/workouts/w1/rate', {
      method: 'POST',
      body: JSON.stringify({ rating: 5 }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'w1' }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
