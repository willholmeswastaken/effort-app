import { describe, it, expect, vi, beforeEach } from 'vitest';
import HistoryPage from './page';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

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

describe('History Page (Server)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to login if no session', async () => {
    (auth.api.getSession as any).mockResolvedValue(null);
    await expect(HistoryPage()).rejects.toThrow('NEXT_REDIRECT');
  });

  it('renders HydrationBoundary if authorized', async () => {
    (auth.api.getSession as any).mockResolvedValue({ user: { id: 'u1' } });
    const result = await HistoryPage();
    expect(result).toBeDefined();
  });
});
