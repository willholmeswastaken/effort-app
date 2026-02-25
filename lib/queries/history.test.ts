import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchWorkoutHistory, historyKeys } from './history';

describe('History Queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('fetchWorkoutHistory fetches correctly', async () => {
    const mockData = [{ id: '1' }];
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    const result = await fetchWorkoutHistory();
    expect(result).toEqual(mockData);
  });

  it('returns correct query options', async () => {
    const { getHistoryQueryOptions } = await import('./history');
    const options = { limit: 10 };
    const queryOptions = getHistoryQueryOptions(options);
    expect(queryOptions.queryKey).toContain(10);
  });
});
