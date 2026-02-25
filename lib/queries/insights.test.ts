import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchInsightsSummary, insightsKeys } from './insights';

describe('Insights Queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('fetchInsightsSummary fetches correctly', async () => {
    const mockData = { totalWorkouts: 10 };
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    const result = await fetchInsightsSummary();
    expect(result).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledWith('/api/insights', expect.anything());
  });

  it('insightsKeys returns correct keys', () => {
    expect(insightsKeys.summary()).toEqual(['insights', 'summary']);
  });
});
