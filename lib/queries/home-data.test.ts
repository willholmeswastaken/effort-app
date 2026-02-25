import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchHomeData, homeKeys } from './home-data';

describe('Home Data Queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('fetchHomeData fetches correctly', async () => {
    const mockData = { type: 'success' };
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    const result = await fetchHomeData();
    expect(result).toEqual(mockData);
  });

  it('homeKeys returns correct keys', () => {
    expect(homeKeys.data()).toEqual(['home', 'data']);
  });
});
