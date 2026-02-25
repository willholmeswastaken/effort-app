import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExerciseSwapDrawer } from './exercise-swap-drawer';
import { useMuscleGroups } from '@/lib/queries';

vi.mock('@/lib/queries', () => ({
  useMuscleGroups: vi.fn(),
}));

// Mock Image
vi.mock('next/image', () => ({
  default: ({ src, alt }: any) => <img src={src} alt={alt} />,
}));

// Mock scrollTo
Element.prototype.scrollTo = vi.fn();

describe('ExerciseSwapDrawer', () => {
  const mockMuscleGroups = [
    {
      id: 'mg1',
      name: 'Chest',
      exercises: [
        { id: 'e1', name: 'Bench Press', targetSets: 3, targetReps: '8-12' },
      ],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useMuscleGroups as any).mockReturnValue({ data: mockMuscleGroups, isLoading: false });
  });

  it('renders drawer content when open', () => {
    render(
      <ExerciseSwapDrawer
        open={true}
        onOpenChange={vi.fn()}
        onExerciseSelect={vi.fn()}
        currentExerciseName="Old Exercise"
      />
    );
    expect(screen.getByText(/Swap Exercise/i)).toBeInTheDocument();
    expect(screen.getByText(/Replacing:/i)).toBeInTheDocument();
    expect(screen.getByText('Old Exercise')).toBeInTheDocument();
  });

  it('filters exercises by search query', () => {
    render(
      <ExerciseSwapDrawer
        open={true}
        onOpenChange={vi.fn()}
        onExerciseSelect={vi.fn()}
        currentExerciseName="Old Exercise"
      />
    );

    const searchInput = screen.getByPlaceholderText(/Search exercises/i);
    fireEvent.change(searchInput, { target: { value: 'Bench' } });

    expect(screen.getByText('Bench Press')).toBeInTheDocument();
  });
});
