import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: vi.fn() } },
}));

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue([]),
  },
}));

describe('Insights Exercises API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET returns logged exercises successfully', async () => {
    (auth.api.getSession as any).mockResolvedValue({ user: { id: 'u1' } });
    (db.orderBy as any).mockResolvedValue([
      { exerciseId: 'e1', exerciseName: 'Ex 1', workoutDate: new Date(), maxWeight: 100 },
      { exerciseId: 'e1', exerciseName: 'Ex 1', workoutDate: new Date(Date.now() - 86400000), maxWeight: 80 },
    ]);

    const req = new NextRequest('http://localhost/api/insights/exercises');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0].currentMax).toBe(100);
    expect(data[0].changePercent).toBeDefined();
  });

  it('GET returns 500 on db error', async () => {
    (auth.api.getSession as any).mockResolvedValue({ user: { id: 'u1' } });
    (db.orderBy as any).mockRejectedValue(new Error('DB Error'));

    const req = new NextRequest('http://localhost/api/insights/exercises');
    const res = await GET(req);
    expect(res.status).toBe(500);
  });
});
