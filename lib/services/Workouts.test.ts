import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Effect, Layer } from 'effect';
import { WorkoutsService, WorkoutsServiceLive } from './Workouts';
import { DatabaseService } from './Database';
import * as schema from '@/lib/db/schema';

describe('WorkoutsService', () => {
  const mockDb = {
    query: {
      workoutLogs: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      exerciseLogs: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      exercises: {
        findFirst: vi.fn(),
      },
      workoutDays: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    select: vi.fn(),
  };

  const DatabaseServiceMock = Layer.succeed(DatabaseService, mockDb as any);
  const TestLayer = Layer.provide(WorkoutsServiceLive, DatabaseServiceMock);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('startWorkout', () => {
    it('should return existing workout if found', async () => {
      mockDb.query.workoutLogs.findFirst.mockResolvedValue({ id: 'existing-id' });

      const result = await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const service = yield* WorkoutsService;
            return yield* service.startWorkout({ userId: 'u1', programId: 'p1', dayId: 'd1' });
          }),
          TestLayer
        )
      );

      expect(result).toBe('existing-id');
      expect(mockDb.query.workoutLogs.findFirst).toHaveBeenCalled();
    });

    it('should create new workout if not found', async () => {
      mockDb.query.workoutLogs.findFirst.mockResolvedValue(null);
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'new-id' }]),
        }),
      });

      const result = await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const service = yield* WorkoutsService;
            return yield* service.startWorkout({ userId: 'u1', programId: 'p1', dayId: 'd1' });
          }),
          TestLayer
        )
      );

      expect(result).toBe('new-id');
      expect(mockDb.insert).toHaveBeenCalledWith(schema.workoutLogs);
    });
  });

  describe('pauseWorkout', () => {
    it('should update status to paused', async () => {
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 'w1' }]),
          }),
        }),
      });

      await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const service = yield* WorkoutsService;
            return yield* service.pauseWorkout('w1', 'u1');
          }),
          TestLayer
        )
      );

      expect(mockDb.update).toHaveBeenCalledWith(schema.workoutLogs);
    });

    it('should throw error if workout not found', async () => {
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const effect = Effect.provide(
        Effect.gen(function* () {
          const service = yield* WorkoutsService;
          return yield* service.pauseWorkout('w1', 'u1');
        }),
        TestLayer
      );

      await expect(Effect.runPromise(effect)).rejects.toThrow('Workout not found or unauthorized');
    });
  });

  describe('getHistory', () => {
    it('should return mapped history logs', async () => {
      const mockLogs = [
        {
          id: '1',
          programId: 'p1',
          dayId: 'd1',
          startedAt: new Date(),
          completedAt: new Date(),
          durationSeconds: 3600,
          rating: 5,
          day: { title: 'Day 1' },
          exerciseLogs: [{ exerciseId: 'e1' }, { exerciseId: 'e2' }],
        },
      ];
      mockDb.query.workoutLogs.findMany.mockResolvedValue(mockLogs);

      const result = await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const service = yield* WorkoutsService;
            return yield* service.getHistory('u1');
          }),
          TestLayer
        )
      );

      expect(result).toHaveLength(1);
      expect(result[0].dayTitle).toBe('Day 1');
      expect(result[0].exerciseCount).toBe(2);
    });
  });

  describe('upsertSet', () => {
    it('should upsert a set and update snapshot', async () => {
      mockDb.query.workoutLogs.findFirst.mockResolvedValue({ id: 'w1' });
      mockDb.query.exerciseLogs.findFirst.mockResolvedValue({ id: 'el1' });
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          onConflictDoUpdate: vi.fn().mockResolvedValue({}),
        }),
      });
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([{ setNumber: 1, reps: 10, weight: '100' }]),
          }),
        }),
      });
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({}),
        }),
      });

      await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const service = yield* WorkoutsService;
            return yield* service.upsertSet({
              userId: 'u1',
              workoutLogId: 'w1',
              exerciseId: 'e1',
              exerciseName: 'Bench Press',
              exerciseOrder: 0,
              setNumber: 1,
              reps: 10,
              weight: 100,
            });
          }),
          TestLayer
        )
      );

      expect(mockDb.insert).toHaveBeenCalledWith(schema.setLogs);
      expect(mockDb.update).toHaveBeenCalledWith(schema.exerciseLogs);
    });
  });

  describe('resumeWorkout', () => {
    it('should calculate and update accumulated pause seconds', async () => {
      const now = new Date();
      const lastPausedAt = new Date(now.getTime() - 60000); // 60 seconds ago
      mockDb.query.workoutLogs.findFirst.mockResolvedValue({
        id: 'w1',
        status: 'paused',
        lastPausedAt,
        accumulatedPauseSeconds: 10,
      });
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({}),
        }),
      });

      const result = await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const service = yield* WorkoutsService;
            return yield* service.resumeWorkout('w1', 'u1');
          }),
          TestLayer
        )
      );

      expect(result.accumulatedPauseSeconds).toBeGreaterThanOrEqual(70);
      expect(mockDb.update).toHaveBeenCalledWith(schema.workoutLogs);
    });
  });

  describe('getWorkoutById', () => {
    it('should return detailed workout data', async () => {
      mockDb.query.workoutLogs.findFirst.mockResolvedValue({
        id: 'w1',
        programId: 'p1',
        dayId: 'd1',
        day: { title: 'Day 1' },
        exerciseLogs: [
          {
            exerciseId: 'e1',
            exerciseName: 'E1',
            exerciseOrder: 0,
            setLogs: [{ setNumber: 1, reps: 10, weight: '100' }],
          },
        ],
      });

      const result = await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const service = yield* WorkoutsService;
            return yield* service.getWorkoutById('w1');
          }),
          TestLayer
        )
      );

      expect(result?.id).toBe('w1');
      expect(result?.exercises[0].sets[0].weight).toBe(100);
    });
  });

  describe('getWorkoutSession', () => {
    it('should return session data from denormalized fields', async () => {
      mockDb.query.workoutLogs.findFirst.mockResolvedValue({
        id: 'w1',
        programId: 'p1',
        dayId: 'd1',
        startedAt: new Date(),
        status: 'active',
        programName: 'Program 1',
        dayTitle: 'Day 1',
        dayExercisesSnapshot: JSON.stringify([{ id: 'e1', name: 'Exercise 1' }]),
      });
      mockDb.query.exerciseLogs.findMany.mockResolvedValue([
        {
          exerciseId: 'e1',
          exerciseName: 'Exercise 1',
          exerciseOrder: 0,
          setsSnapshot: JSON.stringify([{ setNumber: 1, reps: 10, weight: '100' }]),
        },
      ]);

      const result = await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const service = yield* WorkoutsService;
            return yield* service.getWorkoutSession('w1');
          }),
          TestLayer
        )
      );

      expect(result?.workout.programName).toBe('Program 1');
      expect(result?.exercises[0].name).toBe('Exercise 1');
      expect(result?.workout.programName).toBe('Program 1');
      expect(result?.exercises[0].name).toBe('Exercise 1');
      expect(result?.sets[0].weight).toBe(100);
    });
  });

  describe('resetWorkout', () => {
    it('should delete exercise logs and reset workout log', async () => {
      mockDb.query.workoutLogs.findFirst.mockResolvedValue({
        id: 'w1',
        programId: 'p1',
        dayId: 'd1',
      });
      mockDb.delete.mockReturnValue({
        where: vi.fn().mockResolvedValue({}),
      });
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({}),
        }),
      });

      const result = await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const service = yield* WorkoutsService;
            return yield* service.resetWorkout('w1', 'u1');
          }),
          TestLayer
        )
      );

      expect(result.programId).toBe('p1');
      expect(mockDb.delete).toHaveBeenCalledWith(schema.exerciseLogs);
      expect(mockDb.update).toHaveBeenCalledWith(schema.workoutLogs);
    });
  });

  describe('deleteWorkout', () => {
    it('should delete the workout log', async () => {
      mockDb.delete.mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'w1' }]),
        }),
      });

      await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const service = yield* WorkoutsService;
            return yield* service.deleteWorkout('w1', 'u1');
          }),
          TestLayer
        )
      );

      expect(mockDb.delete).toHaveBeenCalledWith(schema.workoutLogs);
    });
  });

  describe('completeWorkout', () => {
    it('should update workout status to completed', async () => {
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 'w1' }]),
          }),
        }),
      });

      await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const service = yield* WorkoutsService;
            return yield* service.completeWorkout({
              workoutLogId: 'w1',
              userId: 'u1',
              durationSeconds: 3600,
              rating: 5,
            });
          }),
          TestLayer
        )
      );

      expect(mockDb.update).toHaveBeenCalledWith(schema.workoutLogs);
    });
  });

  describe('swapExercise', () => {
    it('should update existing exercise log on swap', async () => {
      mockDb.query.exerciseLogs.findFirst.mockResolvedValue({ id: 'el1' });
      mockDb.query.exercises.findFirst.mockResolvedValue({ id: 'e2', name: 'New Ex' });
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({}),
        }),
      });
      mockDb.query.workoutLogs.findFirst.mockResolvedValue({
        id: 'w1',
        dayExercisesSnapshot: JSON.stringify([{ id: 'e1', name: 'Old Ex' }]),
      });

      await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const service = yield* WorkoutsService;
            return yield* service.swapExercise({
              workoutLogId: 'w1',
              exerciseOrder: 0,
              newExerciseId: 'e2',
              newExerciseName: 'New Ex',
            });
          }),
          TestLayer
        )
      );

      expect(mockDb.update).toHaveBeenCalledWith(schema.exerciseLogs);
    });
  });

  describe('getExerciseHistory', () => {
    it('should return grouped exercise history', async () => {
      const mockData = [
        {
          workoutDate: new Date(),
          setNumber: 1,
          reps: 10,
          weight: '100',
        },
      ];
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue(mockData),
                }),
              }),
            }),
          }),
        }),
      });

      const result = await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const service = yield* WorkoutsService;
            return yield* service.getExerciseHistory('u1', 'e1');
          }),
          TestLayer
        )
      );

      expect(result).toHaveLength(1);
      expect(result[0].sets[0].weight).toBe(100);
    });
  });

  describe('getCompletedDayIds', () => {
    it('should return a set of completed day IDs', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ dayId: 'd1' }, { dayId: 'd2' }]),
        }),
      });

      const result = await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const service = yield* WorkoutsService;
            return yield* service.getCompletedDayIds('u1', 'p1');
          }),
          TestLayer
        )
      );

      expect(result.has('d1')).toBe(true);
      expect(result.has('d2')).toBe(true);
      expect(result.size).toBe(2);
    });
  });

  describe('getMostRecentWorkout', () => {
    it('should return in-progress workout', async () => {
      mockDb.query.workoutLogs.findFirst.mockResolvedValue({
        id: 'w1',
        programId: 'p1',
        dayId: 'd1',
        startedAt: new Date(),
        exerciseLogs: [
          {
            id: 'el1',
            setLogs: [{ updatedAt: new Date() }],
          },
        ],
      });

      const result = await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const service = yield* WorkoutsService;
            return yield* service.getMostRecentWorkout('u1', 'p1', 'd1');
          }),
          TestLayer
        )
      );

      expect(result?.workoutLogId).toBe('w1');
    });
  });

  describe('getLastLifts', () => {
    it('should return last lifts for given exercises', async () => {
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue([
                { exerciseId: 'e1', exerciseLogId: 'el1', startedAt: new Date() },
              ]),
            }),
          }),
        }),
      }).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([
              { exerciseLogId: 'el1', setNumber: 1, reps: 10, weight: '100' },
            ]),
          }),
        }),
      });

      const result = await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const service = yield* WorkoutsService;
            return yield* service.getLastLifts('u1', ['e1']);
          }),
          TestLayer
        )
      );

      expect(result.has('e1')).toBe(true);
      expect(result.get('e1')![0].sets[0].weight).toBe(100);
    });
  });

  describe('rateWorkout', () => {
    it('should update workout rating', async () => {
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 'w1' }]),
          }),
        }),
      });

      await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const service = yield* WorkoutsService;
            return yield* service.rateWorkout('w1', 'u1', 5);
          }),
          TestLayer
        )
      );

      expect(mockDb.update).toHaveBeenCalledWith(schema.workoutLogs);
    });
  });

  describe('startWorkoutAndGetSession', () => {
    it('should start a new workout and return session data', async () => {
      mockDb.query.workoutLogs.findFirst.mockResolvedValueOnce(null) // for existing check
        .mockResolvedValueOnce({ // for getWorkoutSession
          id: 'w1',
          programId: 'p1',
          dayId: 'd1',
          startedAt: new Date(),
          status: 'active',
          programName: 'Program 1',
          dayTitle: 'Day 1',
          dayExercisesSnapshot: JSON.stringify([{ id: 'e1', name: 'Exercise 1' }]),
        });

      mockDb.query.workoutDays.findFirst.mockResolvedValue({
        id: 'd1',
        title: 'Day 1',
        week: {
          program: { name: 'Program 1' },
        },
        dayExercises: [
          {
            exercise: { id: 'e1', name: 'Exercise 1' },
          },
        ],
      });

      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'w1' }]),
        }),
      });

      mockDb.query.exerciseLogs.findMany.mockResolvedValue([]);

      const result = await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const service = yield* WorkoutsService;
            return yield* service.startWorkoutAndGetSession({
              userId: 'u1',
              programId: 'p1',
              dayId: 'd1',
            });
          }),
          TestLayer
        )
      );

      expect(result.workoutId).toBe('w1');
      expect(result.session.workout.programName).toBe('Program 1');
    });
  });

  describe('getCompletedWorkout', () => {
    it('should return completed workout with exercises', async () => {
      mockDb.query.workoutLogs.findFirst.mockResolvedValue({
        id: 'w1',
        startedAt: new Date(),
        completedAt: new Date(),
        durationSeconds: 3600,
        rating: 5,
        exerciseLogs: [
          {
            exerciseId: 'e1',
            exercise: { name: 'Exercise 1' },
            setLogs: [{ setNumber: 1, reps: 10, weight: '100' }],
          },
        ],
      });

      const result = await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const service = yield* WorkoutsService;
            return yield* service.getCompletedWorkout('u1', 'p1', 'd1');
          }),
          TestLayer
        )
      );

      expect(result?.id).toBe('w1');
      expect(result?.exercises).toHaveLength(1);
    });
  });
});
