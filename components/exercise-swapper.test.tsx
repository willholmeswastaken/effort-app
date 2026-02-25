import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ExerciseSwapper } from './exercise-swapper';

describe('ExerciseSwapper', () => {
  const currentExercise = { id: 'e1', name: 'Old' } as any;
  const availableExercises = [{ id: 'e2', name: 'New' }] as any;
  const onSwap = vi.fn();

  it('renders trigger button', () => {
    render(
      <ExerciseSwapper
        currentExercise={currentExercise}
        availableExercises={availableExercises}
        onSwap={onSwap}
      />
    );
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls onSwap when an alternative is selected', () => {
    render(
      <ExerciseSwapper
        currentExercise={currentExercise}
        availableExercises={availableExercises}
        onSwap={onSwap}
      />
    );

    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('New'));
    expect(onSwap).toHaveBeenCalledWith(availableExercises[0]);
  });
});
