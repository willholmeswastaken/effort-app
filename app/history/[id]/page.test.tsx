import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import HistoryDetailPage from './page';
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

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

describe('History Detail Page (Server)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders workout details if found', async () => {
    (auth.api.getSession as any).mockResolvedValue({ user: { id: 'u1' } });
    (services.runEffect as any).mockResolvedValue({
      type: 'success',
      workout: {
        dayTitle: 'Full Body',
        startedAt: new Date(),
        exercises: [],
      },
    });

    const result = await HistoryDetailPage({ params: Promise.resolve({ id: 'w1' }) });
    render(result as any);
    expect(screen.getByText('Full Body')).toBeInTheDocument();
  });

  it('renders not found state', async () => {
    (auth.api.getSession as any).mockResolvedValue({ user: { id: 'u1' } });
    (services.runEffect as any).mockResolvedValue({ type: 'notFound' });

    const result = await HistoryDetailPage({ params: Promise.resolve({ id: 'w1' }) });
    render(result as any);
    expect(screen.getByText(/Workout not found/i)).toBeInTheDocument();
  });
});
