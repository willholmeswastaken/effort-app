import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProgressClient } from './client';
import { useInsightsSummary, useLoggedExercises, useExerciseProgression } from '@/lib/queries/insights';

vi.mock('@/lib/queries/insights', () => ({
  useInsightsSummary: vi.fn(),
  useLoggedExercises: vi.fn(),
  useExerciseProgression: vi.fn(),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  AreaChart: ({ children }: any) => <div>{children}</div>,
  Area: () => <div>Area</div>,
  XAxis: () => <div>XAxis</div>,
  YAxis: () => <div>YAxis</div>,
  Tooltip: () => <div>Tooltip</div>,
}));

describe('Progress Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useExerciseProgression as any).mockReturnValue({ data: [] });
  });

  it('renders skeleton when loading', () => {
    (useInsightsSummary as any).mockReturnValue({ isLoading: true });
    (useLoggedExercises as any).mockReturnValue({ isLoading: true });
    render(<ProgressClient />);
    expect(screen.getByText('Progress')).toBeInTheDocument();
  });

  it('renders insights summary', () => {
    (useInsightsSummary as any).mockReturnValue({ data: { totalWorkouts: 5, totalVolume: 10000 }, isLoading: false });
    (useLoggedExercises as any).mockReturnValue({ data: [], isLoading: false });
    (useExerciseProgression as any).mockReturnValue({ data: [] });

    render(<ProgressClient />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('10.0')).toBeInTheDocument(); // 10000 / 1000
  });
});
