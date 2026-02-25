import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WorkoutSessionClient from './client';
import {
  useWorkoutSession,
  useUpsertSet,
  useCompleteWorkout,
  useRateWorkout,
  usePauseWorkout,
  useResumeWorkout,
  useResetWorkout,
  useDeleteWorkout,
  useSwapExercise
} from '@/lib/queries';

vi.mock('@/lib/queries', () => ({
  useWorkoutSession: vi.fn(),
  useUpsertSet: vi.fn(),
  useCompleteWorkout: vi.fn(),
  useRateWorkout: vi.fn(),
  usePauseWorkout: vi.fn(),
  useResumeWorkout: vi.fn(),
  useResetWorkout: vi.fn(),
  useDeleteWorkout: vi.fn(),
  useSwapExercise: vi.fn(),
  useLastLifts: vi.fn(() => ({ data: null, isLoading: false })),
  useMuscleGroups: vi.fn(() => ({ data: [], isLoading: false })),
  workoutKeys: { session: vi.fn() },
  homeKeys: { all: [] },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    setQueryData: vi.fn(),
    invalidateQueries: vi.fn(),
  }),
}));

describe('Workout Session Client', () => {
  const mockSession = {
    workout: { id: 'w1', dayTitle: 'Upper Body', status: 'active', startedAt: new Date().toISOString() },
    exercises: [{ id: 'e1', name: 'Pushups', targetSets: 3, targetReps: '10' }],
    sets: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useWorkoutSession as any).mockReturnValue({ data: mockSession, isLoading: false });
    (useUpsertSet as any).mockReturnValue({ mutate: vi.fn() });
    (useCompleteWorkout as any).mockReturnValue({ mutate: vi.fn() });
    (useRateWorkout as any).mockReturnValue({ mutate: vi.fn() });
    (usePauseWorkout as any).mockReturnValue({ mutate: vi.fn() });
    (useResumeWorkout as any).mockReturnValue({ mutate: vi.fn() });
    (useResetWorkout as any).mockReturnValue({ mutate: vi.fn() });
    (useDeleteWorkout as any).mockReturnValue({ mutate: vi.fn() });
    (useSwapExercise as any).mockReturnValue({ mutate: vi.fn() });
  });

  it('renders workout session details', () => {
    render(<WorkoutSessionClient workoutId="w1" />);
    expect(screen.getByText('Upper Body')).toBeInTheDocument();
    expect(screen.getByText('Pushups')).toBeInTheDocument();
  });

  it('handles finish workout', () => {
    const mutate = vi.fn();
    (useCompleteWorkout as any).mockReturnValue({ mutate, isPending: false });

    render(<WorkoutSessionClient workoutId="w1" />);
    fireEvent.click(screen.getByText(/Finish Workout/i));

    expect(mutate).toHaveBeenCalled();
  });
});
