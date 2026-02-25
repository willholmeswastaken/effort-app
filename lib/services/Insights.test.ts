import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Effect, Layer } from 'effect';
import { InsightsService, InsightsServiceLive } from './Insights';
import { DatabaseService } from './Database';
import * as schema from '@/lib/db/schema';

describe('InsightsService', () => {
  const mockDb = {
    query: {
      workoutLogs: {
        findMany: vi.fn(),
      },
    },
  };

  const DatabaseServiceMock = Layer.succeed(DatabaseService, mockDb as any);
  const TestLayer = Layer.provide(InsightsServiceLive, DatabaseServiceMock);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSummary', () => {
    it('should calculate summary correctly', async () => {
      const mockWorkouts = [
        {
          startedAt: new Date(),
          completedAt: new Date(),
          durationSeconds: 3600,
          rating: 5,
          exerciseLogs: [
            {
              setLogs: [{ reps: 10, weight: '100' }, { reps: 10, weight: '110' }],
            },
          ],
        },
      ];
      mockDb.query.workoutLogs.findMany.mockResolvedValue(mockWorkouts);

      const result = await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const service = yield* InsightsService;
            return yield* service.getSummary('u1');
          }),
          TestLayer
        )
      );

      expect(result.totalWorkouts).toBe(1);
      expect(result.totalVolume).toBe(2100);
      expect(result.averageRating).toBe(5);
    });
  });

  describe('getExerciseProgression', () => {
    it('should return progression points', async () => {
      const mockWorkouts = [
        {
          startedAt: new Date(),
          exerciseLogs: [
            {
              setLogs: [{ weight: '100' }, { weight: '120' }],
            },
          ],
        },
      ];
      mockDb.query.workoutLogs.findMany.mockResolvedValue(mockWorkouts);

      const result = await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const service = yield* InsightsService;
            return yield* service.getExerciseProgression('u1', 'e1');
          }),
          TestLayer
        )
      );

      expect(result).toHaveLength(1);
      expect(result[0].maxWeight).toBe(120);
    });
  });
});
