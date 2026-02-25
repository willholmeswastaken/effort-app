import { describe, it, expect, vi } from 'vitest';
import { Effect, Layer } from 'effect';
import { WorkoutsService, WorkoutsServiceLive } from '../Workouts';
import { DatabaseService } from '../Database';

describe('WorkoutsService', () => {
  it('should handle decimal weights correctly in getLastLifts', async () => {
    // Mock database results
    const mockExerciseLogs = [
      { exerciseId: 'ex1', exerciseLogId: 'log1', startedAt: new Date('2024-01-01') }
    ];
    const mockSetLogs = [
      { exerciseLogId: 'log1', setNumber: 1, reps: 10, weight: '12.50' }
    ];

    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockResolvedValue(mockExerciseLogs)
              })
            }),
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue(mockExerciseLogs)
            })
          }),
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockSetLogs)
          })
        })
      }),
      // Simple mock for the complex chain used in getLastLifts
    } as unknown as any;

    // Redefine select mock to return different things on successive calls
    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockExerciseLogs)
          })
        })
      })
    }).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue(mockSetLogs)
        })
      })
    });

    const layer = WorkoutsServiceLive.pipe(
      Layer.provide(Layer.succeed(DatabaseService, mockDb))
    );

    const program = WorkoutsService.pipe(
      Effect.flatMap((service) => service.getLastLifts('user1', ['ex1'])),
      Effect.provide(layer)
    );

    const result = await Effect.runPromise(program);

    expect(result.get('ex1')).toBeDefined();
    expect(result.get('ex1')![0].sets[0].weight).toBe(12.5);
    expect(typeof result.get('ex1')![0].sets[0].weight).toBe('number');
  });

  it('should handle decimal weights correctly in getWorkoutById', async () => {
    const mockWorkout = {
      id: 'w1',
      programId: 'p1',
      dayId: 'd1',
      startedAt: new Date(),
      day: { title: 'Day 1' },
      exerciseLogs: [
        {
          exerciseId: 'ex1',
          exerciseName: 'Squat',
          exerciseOrder: 0,
          targetSets: 3,
          targetReps: '8-12',
          restSeconds: 90,
          setLogs: [
            { setNumber: 1, reps: 10, weight: '60.50' }
          ]
        }
      ]
    };

    const mockDb = {
      query: {
        workoutLogs: {
          findFirst: vi.fn().mockResolvedValue(mockWorkout)
        }
      }
    } as unknown as any;

    const layer = WorkoutsServiceLive.pipe(
      Layer.provide(Layer.succeed(DatabaseService, mockDb))
    );

    const program = WorkoutsService.pipe(
      Effect.flatMap((service) => service.getWorkoutById('w1')),
      Effect.provide(layer)
    );

    const result = await Effect.runPromise(program);

    expect(result).not.toBeNull();
    expect(result?.exercises[0].sets[0].weight).toBe(60.5); // Number(sl.weight)
    expect(typeof result?.exercises[0].sets[0].weight).toBe('number');
  });
});
