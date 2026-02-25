import { describe, it, expect, vi, beforeEach } from 'vitest';
import HomePage from './page';
import { auth } from '@/lib/auth';
import { getHomeDataDirect } from '@/lib/server/home-data';
import { redirect } from 'next/navigation';

vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: vi.fn() } },
}));

vi.mock('@/lib/server/home-data', () => ({
  getHomeDataDirect: vi.fn(),
}));

import { QueryClient } from '@tanstack/react-query';

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock('@/lib/get-query-client', () => ({
  getQueryClient: () => new QueryClient(),
}));

describe('Home Page (Server)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to login if no session', async () => {
    (auth.api.getSession as any).mockResolvedValue(null);
    await expect(HomePage()).rejects.toThrow('NEXT_REDIRECT');
  });

  it('redirects if home data specifies redirect', async () => {
    (auth.api.getSession as any).mockResolvedValue({ user: { id: 'u1' } });
    (getHomeDataDirect as any).mockResolvedValue({ type: 'redirect', to: '/onboarding' });
    await expect(HomePage()).rejects.toThrow('NEXT_REDIRECT');
  });
});
