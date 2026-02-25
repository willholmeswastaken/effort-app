import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OnboardingClient } from './client';
import { useUpdatePreferences } from '@/lib/queries';

vi.mock('@/lib/queries', () => ({
  useUpdatePreferences: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe('Onboarding Client', () => {
  const programs = [
    { id: 'p1', name: '3 Day', description: '', daysPerWeek: 3, weekCount: 4 },
  ];

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    (useUpdatePreferences as any).mockReturnValue({ mutate: vi.fn(), isPending: false });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('navigates through steps', () => {
    render(<OnboardingClient programs={programs} />);

    expect(screen.getByText(/Welcome to EffortApp/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Get Started/i));

    // Step transition with timeout
    act(() => {
      vi.advanceTimersByTime(350);
    });

    expect(screen.getByText(/Choose Your Program/i)).toBeInTheDocument();
  });

  it('selects a program and completes onboarding', () => {
    const mutate = vi.fn();
    (useUpdatePreferences as any).mockReturnValue({ mutate, isPending: false });

    render(<OnboardingClient programs={programs} />);

    // Go to step 1
    fireEvent.click(screen.getByText(/Get Started/i));
    act(() => { vi.advanceTimersByTime(350); });

    // Select program
    fireEvent.click(screen.getByText('3 Day'));

    // Complete
    fireEvent.click(screen.getByText('Continue'));
    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ activeProgramId: 'p1', hasOnboarded: true }),
      expect.anything()
    );
  });
});
