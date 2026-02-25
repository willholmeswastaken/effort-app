import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { db } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      muscleGroups: {
        findMany: vi.fn(),
      },
    },
  },
}));

describe('Exercises API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET returns muscle groups successfully', async () => {
    (db.query.muscleGroups.findMany as any).mockResolvedValue([{ id: 'mg1', name: 'Chest', exercises: [] }]);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0].name).toBe('Chest');
  });
});
