import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useWorkoutHistory, useStartWorkout } from './workouts';
import React from 'react';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('Workouts Queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('useWorkoutHistory fetches history correctly', async () => {
    const mockHistory = [{ id: '1', dayTitle: 'Day 1' }];
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockHistory,
    });

    const { result } = renderHook(() => useWorkoutHistory(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockHistory);
    expect(global.fetch).toHaveBeenCalledWith('/api/workouts');
  });

  it('useStartWorkout executes mutation correctly', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'new-workout-id' }),
    });

    const { result } = renderHook(() => useStartWorkout(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({ programId: 'p1', dayId: 'd1' });

    expect(global.fetch).toHaveBeenCalledWith('/api/workouts', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ programId: 'p1', dayId: 'd1' }),
    }));
  });
});
