import { describe, it, expect, vi, beforeEach } from 'vitest';
import WorkoutPage from './page';
import { auth } from '@/lib/auth';
import * as services from '@/lib/services';
import { redirect } from 'next/navigation';

vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: vi.fn() } },
}));

vi.mock('@/lib/services', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return { ...actual, runEffect: vi.fn() };
});

import { QueryClient } from '@tanstack/react-query';

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock('@/lib/get-query-client', () => ({
  getQueryClient: () => new QueryClient(),
}));

vi.mock('./client', () => ({
  default: () => null,
}));

describe('Workout Page (Server)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects if no session', async () => {
    (auth.api.getSession as any).mockResolvedValue(null);
    await expect(WorkoutPage({ params: Promise.resolve({ programId: 'p1', dayId: 'd1' }) }))
      .rejects.toThrow('NEXT_REDIRECT');
  });

  it('renders boundary if authorized and started', async () => {
    (auth.api.getSession as any).mockResolvedValue({ user: { id: 'u1' } });
    (services.runEffect as any).mockResolvedValueOnce({
      workoutId: 'w1',
      sessionData: { exercises: [] }
    });

    const result = await WorkoutPage({ params: Promise.resolve({ programId: 'p1', dayId: 'd1' }) });
    expect(result).toBeDefined();
  });
});
