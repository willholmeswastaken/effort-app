import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SummaryPage from './page';
import { useRouter } from 'next/navigation';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

describe('Summary Page', () => {
  const replace = vi.fn();
  const push = vi.fn();

  const storage: any = {};

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ replace, push });

    // Reset storage
    Object.keys(storage).forEach(key => delete storage[key]);

    // Mock storage
    global.sessionStorage = {
      getItem: vi.fn((key) => storage[key] || null),
      setItem: vi.fn((key, val) => { storage[key] = val; }),
      removeItem: vi.fn((key) => { delete storage[key]; }),
    } as any;
    global.localStorage = {
      getItem: vi.fn((key) => storage[key] || null),
      setItem: vi.fn((key, val) => { storage[key] = val; }),
      removeItem: vi.fn((key) => { delete storage[key]; }),
    } as any;
  });

  it('redirects if no last workout id', () => {
    render(<SummaryPage />);
    expect(replace).toHaveBeenCalledWith('/');
  });

  it('renders workout summary if found in storage', async () => {
    sessionStorage.setItem('last_workout_id', 'w1');
    localStorage.setItem('workout_history', JSON.stringify([{ id: 'w1', dayName: 'Legs', durationSeconds: 600 }]));

    render(<SummaryPage />);
    expect(await screen.findByText(/Legs/)).toBeInTheDocument();
    expect(screen.getByText(/10:00/)).toBeInTheDocument();
  });

  it('handles rating a workout', async () => {
    sessionStorage.setItem('last_workout_id', 'w1');
    localStorage.setItem('workout_history', JSON.stringify([{ id: 'w1', dayName: 'Legs', durationSeconds: 600 }]));

    render(<SummaryPage />);
    const stars = await screen.findAllByRole('button');
    // Button indices: 0-4 are stars, 5 is Done, 6 is View details
    fireEvent.click(stars[2]); // 3 stars

    const history = JSON.parse(localStorage.getItem('workout_history')!);
    expect(history[0].rating).toBe(3);
  });
});
