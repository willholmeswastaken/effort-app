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

describe('Exercise Last Lifts API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST returns last lifts successfully', async () => {
    (auth.api.getSession as any).mockResolvedValue({ user: { id: 'u1' } });
    const mockMap = new Map([['e1', [{ date: new Date(), sets: [] }]]]);
    (services.runEffect as any).mockResolvedValue(mockMap);

    const req = new NextRequest('http://localhost/api/exercises/last-lifts', {
      method: 'POST',
      body: JSON.stringify({ exerciseIds: ['e1'] }),
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.e1).toBeDefined();
  });
});
