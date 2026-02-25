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

describe('Insights Progression API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET returns 400 if exerciseId missing', async () => {
    (auth.api.getSession as any).mockResolvedValue({ user: { id: 'u1' } });
    const req = new NextRequest('http://localhost/api/insights/progression');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('GET returns progression if authorized', async () => {
    (auth.api.getSession as any).mockResolvedValue({ user: { id: 'u1' } });
    (services.runEffect as any).mockResolvedValue([{ date: '2023-01-01', maxWeight: 100 }]);

    const req = new NextRequest('http://localhost/api/insights/progression?exerciseId=e1');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveLength(1);
  });
});
