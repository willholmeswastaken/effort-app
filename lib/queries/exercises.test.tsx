import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMuscleGroups } from './exercises';
import React from 'react';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('Exercises Queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('useMuscleGroups fetches correctly', async () => {
    const mockGroups = [{ id: 'mg1', name: 'Chest', exercises: [] }];
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockGroups,
    });

    const { result } = renderHook(() => useMuscleGroups(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockGroups);
  });
});
