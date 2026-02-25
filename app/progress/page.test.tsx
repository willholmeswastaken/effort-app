import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProgressPage from './page';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: vi.fn() } },
}));

import { QueryClient } from '@tanstack/react-query';

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock('@/lib/get-query-client', () => ({
  getQueryClient: () => new QueryClient(),
}));

describe('Progress Page (Server)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects if not authorized', async () => {
    (auth.api.getSession as any).mockResolvedValue(null);
    await expect(ProgressPage()).rejects.toThrow('NEXT_REDIRECT');
  });

  it('renders boundary if authorized', async () => {
    (auth.api.getSession as any).mockResolvedValue({ user: {} });
    const result = await ProgressPage();
    expect(result).toBeDefined();
  });
});
