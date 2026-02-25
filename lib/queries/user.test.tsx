import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUserPreferences } from './user';
import React from 'react';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('User Queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('useUserPreferences fetches correctly', async () => {
    const mockPrefs = { activeProgramId: 'p1', hasOnboarded: true };
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockPrefs,
    });

    const { result } = renderHook(() => useUserPreferences(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockPrefs);
  });
});
