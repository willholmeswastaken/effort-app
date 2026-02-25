import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HistoryClient } from './client';
import { useQuery } from '@tanstack/react-query';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));

vi.mock('@/lib/queries/history', () => ({
  historyKeys: { list: vi.fn() },
  fetchWorkoutHistory: vi.fn(),
}));

describe('History Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    (useQuery as any).mockReturnValue({ data: [], isLoading: true });
    render(<HistoryClient />);
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('renders history logs', () => {
    const mockLogs = [
      { id: '1', dayTitle: 'Upper Body', startedAt: new Date(), durationSeconds: 3600 },
    ];
    (useQuery as any).mockReturnValue({ data: mockLogs, isLoading: false });

    render(<HistoryClient />);
    expect(screen.getByText('Upper Body')).toBeInTheDocument();
    expect(screen.getByText(/60m/)).toBeInTheDocument();
  });

  it('renders empty state', () => {
    (useQuery as any).mockReturnValue({ data: [], isLoading: false });
    render(<HistoryClient />);
    expect(screen.getByText(/No sessions yet/i)).toBeInTheDocument();
  });
});
