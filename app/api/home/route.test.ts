import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { auth } from '@/lib/auth';
import * as services from '@/lib/services';
import { headers } from 'next/headers';

vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: vi.fn() } },
}));

vi.mock('@/lib/services', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return { ...actual, runEffect: vi.fn() };
});

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}));

describe('Home API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (headers as any).mockResolvedValue(new Headers());
  });

  it('returns 401 if unauthorized', async () => {
    (auth.api.getSession as any).mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns data if authorized and onboarded', async () => {
    (auth.api.getSession as any).mockResolvedValue({ user: { id: 'u1' } });
    (services.runEffect as any).mockResolvedValue({
      type: 'success',
      activeProgram: { weeks: [] },
    });

    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.type).toBe('success');
  });
});
