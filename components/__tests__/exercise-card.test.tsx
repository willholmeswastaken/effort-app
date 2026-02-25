import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ExerciseCard } from '../exercise-card';
import { Exercise, SetLog } from '@/lib/types';

// Mock Lucide icons
vi.mock('lucide-react', () => {
  const Icon = () => null;
  return {
    Plus: Icon,
    History: Icon,
    ChevronRight: Icon,
    X: Icon,
    XIcon: Icon,
    ArrowRightLeft: Icon,
    Check: Icon,
    Loader2: Icon,
    Play: Icon,
    Star: Icon,
    Pause: Icon,
    ChevronLeft: Icon,
  };
});

// Mock useLastLifts hook
vi.mock('@/lib/queries', () => ({
  useLastLifts: vi.fn().mockReturnValue({ data: {}, isLoading: false }),
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: () => null,
}));

describe('ExerciseCard', () => {
  const mockExercise: Exercise = {
    id: 'ex1',
    name: 'Test Exercise',
    targetSets: 3,
    targetReps: '8-12',
  };

  const mockSets: SetLog[] = [
    { reps: 10, weight: 12.5, completed: true }
  ];

  it('should render the weight correctly', () => {
    render(
      <ExerciseCard
        exercise={mockExercise}
        sets={mockSets}
        onSetsChange={vi.fn()}
      />
    );

    const weightInput = screen.getByPlaceholderText('—') as HTMLInputElement;
    expect(weightInput.value).toBe('12.5');
  });

  it('should preserve trailing dots while typing', async () => {
    const onSetFieldChange = vi.fn();
    render(
      <ExerciseCard
        exercise={mockExercise}
        sets={mockSets}
        onSetsChange={vi.fn()}
        onSetFieldChange={onSetFieldChange}
      />
    );

    const weightInput = screen.getByPlaceholderText('—') as HTMLInputElement;

    // Type "12."
    await act(async () => {
      fireEvent.change(weightInput, { target: { value: '12.' } });
    });

    // Input should show "12."
    expect(weightInput.value).toBe('12.');

    // onSetFieldChange should have been called with 12 (parsed float)
    expect(onSetFieldChange).toHaveBeenCalledWith(0, 'weight', 12);

    // Type "12.5"
    await act(async () => {
      fireEvent.change(weightInput, { target: { value: '12.5' } });
    });

    expect(weightInput.value).toBe('12.5');
    expect(onSetFieldChange).toHaveBeenCalledWith(0, 'weight', 12.5);
  });

  it('should clear local weights on blur', async () => {
    render(
      <ExerciseCard
        exercise={mockExercise}
        sets={mockSets}
        onSetsChange={vi.fn()}
        onSetFieldChange={vi.fn()}
      />
    );

    const weightInput = screen.getByPlaceholderText('—') as HTMLInputElement;

    // Type something that would be formatted differently as a number
    await act(async () => {
      fireEvent.change(weightInput, { target: { value: '12.0' } });
    });

    expect(weightInput.value).toBe('12.0');

    // Blur the input
    await act(async () => {
      fireEvent.blur(weightInput);
    });

    // Now it should fallback to the canonical state which is 12.5 from mockSets
    // Wait, in a real scenario the parent would update the state to 12.0 -> 12.
    // But here mockSets is static.
    expect(weightInput.value).toBe('12.5');
  });
});
