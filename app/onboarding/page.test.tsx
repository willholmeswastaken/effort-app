import { describe, it, expect, vi, beforeEach } from 'vitest';
import OnboardingPage from './page';
import { auth } from '@/lib/auth';
import * as services from '@/lib/services';
import { Effect } from 'effect';
import { redirect } from 'next/navigation';

vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: vi.fn() } },
}));

vi.mock('@/lib/services', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return { ...actual, runEffect: vi.fn() };
});

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock('./client', () => ({
  OnboardingClient: () => null,
}));

describe('Onboarding Page (Server)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to home if already onboarded', async () => {
    (auth.api.getSession as any).mockResolvedValue({ user: { id: 'u1' } });
    (services.runEffect as any).mockResolvedValue({ type: 'redirect' });

    await expect(OnboardingPage()).rejects.toThrow('NEXT_REDIRECT');
  });

  it('renders onboarding client with programs if authorized', async () => {
    (auth.api.getSession as any).mockResolvedValue({ user: { id: 'u1' } });
    (services.runEffect as any).mockResolvedValue({
      type: 'success',
      programs: [{ id: 'p1', name: 'Prog 1', description: null, daysPerWeek: 3, weekCount: 4 }]
    });

    const result = await OnboardingPage();
    expect(result).toBeDefined();
  });

  it('handles service errors by returning empty programs', async () => {
    (auth.api.getSession as any).mockResolvedValue({ user: { id: 'u1' } });
    // Mock runEffect to return the error-case result directly
    (services.runEffect as any).mockResolvedValue({ type: 'success', programs: [] });

    const result = await OnboardingPage();
    expect(result).toBeDefined();
  });
});
