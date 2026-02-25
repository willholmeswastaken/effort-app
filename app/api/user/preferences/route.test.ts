import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PUT } from './route';
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

describe('User Preferences API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET returns preferences if authorized', async () => {
    (auth.api.getSession as any).mockResolvedValue({ user: { id: 'u1' } });
    (services.runEffect as any).mockResolvedValue({ hasOnboarded: true });

    const req = new NextRequest('http://localhost/api/user/preferences');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.hasOnboarded).toBe(true);
  });

  it('PUT updates preferences if authorized', async () => {
    (auth.api.getSession as any).mockResolvedValue({ user: { id: 'u1' } });
    (services.runEffect as any).mockResolvedValue({});

    const req = new NextRequest('http://localhost/api/user/preferences', {
      method: 'PUT',
      body: JSON.stringify({ hasOnboarded: true }),
    });
    const res = await PUT(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
