import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExerciseCard } from './exercise-card';
import { useLastLifts } from '@/lib/queries';

vi.mock('@/lib/queries', () => ({
  useLastLifts: vi.fn(),
}));

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
window.IntersectionObserver = MockIntersectionObserver as any;

describe('ExerciseCard', () => {
  const mockExercise = {
    id: 'e1',
    name: 'Bench Press',
    targetSets: 3,
    targetReps: '8-12',
    restSeconds: 90,
  };

  const mockSets = [{ reps: 0, weight: 0, completed: false }];
  const onSetsChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useLastLifts as any).mockReturnValue({ data: null, isLoading: false });
  });

  it('renders exercise name and target', () => {
    render(<ExerciseCard exercise={mockExercise} sets={mockSets} onSetsChange={onSetsChange} />);
    expect(screen.getByText('Bench Press')).toBeInTheDocument();
    expect(screen.getByText(/Target: 3 × 8-12/i)).toBeInTheDocument();
  });

  it('calls onSetsChange when adding a set', () => {
    render(<ExerciseCard exercise={mockExercise} sets={mockSets} onSetsChange={onSetsChange} />);
    fireEvent.click(screen.getByText(/Add Set/i));
    expect(onSetsChange).toHaveBeenCalled();
  });

  it('handles reps change', async () => {
    render(<ExerciseCard exercise={mockExercise} sets={mockSets} onSetsChange={onSetsChange} />);
    const repsInput = screen.getByPlaceholderText('8');
    fireEvent.change(repsInput, { target: { value: '10' } });
    expect(onSetsChange).toHaveBeenCalled();
  });
});
