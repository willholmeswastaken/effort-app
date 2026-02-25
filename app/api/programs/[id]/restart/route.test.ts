import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import * as services from '@/lib/services';
import { revalidatePath } from 'next/cache';

vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: vi.fn() } },
}));

vi.mock('@/lib/services', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return { ...actual, runEffect: vi.fn() };
});

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Program Restart API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('restarts program successfully', async () => {
    (auth.api.getSession as any).mockResolvedValue({ user: { id: 'u1' } });
    (services.runEffect as any).mockResolvedValue('new-instance-id');

    const req = new NextRequest('http://localhost/api/programs/p1/restart', { method: 'POST' });
    const res = await POST(req, { params: Promise.resolve({ id: 'p1' }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.instanceId).toBe('new-instance-id');
    expect(revalidatePath).toHaveBeenCalledWith('/');
  });
});
