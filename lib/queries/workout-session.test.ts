import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchWorkoutSession, workoutQueryKeys } from './workout-session';

describe('Workout Session Queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('fetchWorkoutSession fetches correctly', async () => {
    const mockData = { workout: { id: 'w1' } };
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    const result = await fetchWorkoutSession('w1');
    expect(result).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledWith('/api/workouts/w1/session', expect.anything());
  });

  it('workoutQueryKeys returns correct keys', () => {
    expect(workoutQueryKeys.history()).toEqual(['workouts', 'history']);
    expect(workoutQueryKeys.session('w1')).toEqual(['workouts', 'session', 'w1']);
  });
});
