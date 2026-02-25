import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resetWorkoutAction } from './actions';
import { auth } from '@/lib/auth';
import * as services from '@/lib/services';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

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

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Workout Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resets workout successfully', async () => {
    (auth.api.getSession as any).mockResolvedValue({ user: { id: 'u1' } });
    (services.runEffect as any).mockResolvedValue({ programId: 'p1', dayId: 'd1' });

    const result = await resetWorkoutAction('w1');
    expect(result.success).toBe(true);
    expect(revalidatePath).toHaveBeenCalled();
  });
});
