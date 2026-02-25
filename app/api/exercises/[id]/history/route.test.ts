import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
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

describe('Exercise History API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET returns history successfully', async () => {
    (auth.api.getSession as any).mockResolvedValue({ user: { id: 'u1' } });
    (services.runEffect as any).mockResolvedValue([{ workoutDate: '2023-01-01', sets: [] }]);

    const req = new NextRequest('http://localhost/api/exercises/e1/history');
    const res = await GET(req, { params: Promise.resolve({ id: 'e1' }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveLength(1);
  });
});
