import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HomeClient } from './home-client';
import { useHomeData, usePrograms, useUpdatePreferences, useRestartProgram } from '@/lib/queries';

vi.mock('@/lib/queries', () => ({
  useHomeData: vi.fn(),
  usePrograms: vi.fn(),
  useUpdatePreferences: vi.fn(),
  useRestartProgram: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock('@/components/user-menu', () => ({
  UserMenu: () => <div data-testid="user-menu" />,
}));

describe('HomeClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useUpdatePreferences as any).mockReturnValue({ isPending: false });
    (useRestartProgram as any).mockReturnValue({ isPending: false });
    (usePrograms as any).mockReturnValue({ data: [], isLoading: false });
  });

  it('renders skeleton when loading', () => {
    (useHomeData as any).mockReturnValue({ isLoading: true });
    render(<HomeClient />);
    expect(document.querySelector('main')).toBeInTheDocument();
  });

  it('renders empty state when no program', () => {
    (useHomeData as any).mockReturnValue({ data: null, isLoading: false });
    render(<HomeClient />);
    expect(screen.getByText(/Start Your Fitness Journey/i)).toBeInTheDocument();
  });

  it('renders active program details', () => {
    const mockData = {
      activeProgram: {
        name: 'My Program',
        weeks: [{ id: 'w1', weekNumber: 1, days: [] }],
      },
      userPreferences: { activeProgramId: 'p1' },
      isProgramComplete: false,
    };
    (useHomeData as any).mockReturnValue({ data: mockData, isLoading: false });

    render(<HomeClient />);
    expect(screen.getByText('My Program')).toBeInTheDocument();
    // Use getAllByText since "Week 1" appears in both the header and the tabs
    expect(screen.getAllByText(/Week 1/i).length).toBeGreaterThan(0);
  });
});
