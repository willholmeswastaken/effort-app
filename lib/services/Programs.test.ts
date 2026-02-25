import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Effect, Layer } from 'effect';
import { ProgramsService, ProgramsServiceLive } from './Programs';
import { DatabaseService } from './Database';
import * as schema from '@/lib/db/schema';

describe('ProgramsService', () => {
  const mockDb = {
    query: {
      programs: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      workoutDays: {
        findFirst: vi.fn(),
      },
    },
    select: vi.fn(),
    update: vi.fn(),
  };

  const DatabaseServiceMock = Layer.succeed(DatabaseService, mockDb as any);
  const TestLayer = Layer.provide(ProgramsServiceLive, DatabaseServiceMock);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all programs', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockResolvedValue([{ id: 'p1', name: 'Program 1' }]),
      });

      const result = await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const service = yield* ProgramsService;
            return yield* service.getAll();
          }),
          TestLayer
        )
      );

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Program 1');
    });
  });

  describe('getAllWithMeta', () => {
    it('should return programs with week count', async () => {
      mockDb.query.programs.findMany.mockResolvedValue([
        { id: 'p1', name: 'P1', weeks: [{ id: 'w1' }, { id: 'w2' }] },
      ]);

      const result = await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const service = yield* ProgramsService;
            return yield* service.getAllWithMeta();
          }),
          TestLayer
        )
      );

      expect(result[0].weekCount).toBe(2);
    });
  });

  describe('getById', () => {
    it('should return program by id', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ id: 'p1' }]),
        }),
      });

      const result = await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const service = yield* ProgramsService;
            return yield* service.getById('p1');
          }),
          TestLayer
        )
      );

      expect(result?.id).toBe('p1');
    });
  });

  describe('getWithDays', () => {
    it('should return program with full hierarchy', async () => {
      mockDb.query.programs.findFirst.mockResolvedValue({
        id: 'p1',
        weeks: [
          {
            id: 'w1',
            weekNumber: 1,
            days: [
              {
                id: 'd1',
                title: 'Day 1',
                dayOrder: 1,
                dayExercises: [{ exercise: { id: 'e1', name: 'Ex 1' } }],
              },
            ],
          },
        ],
      });

      const result = await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const service = yield* ProgramsService;
            return yield* service.getWithDays('p1');
          }),
          TestLayer
        )
      );

      expect(result?.weeks[0].days[0].exercises[0].name).toBe('Ex 1');
    });
  });

  describe('getDayWithExercises', () => {
    it('should return day with exercises', async () => {
      mockDb.query.workoutDays.findFirst.mockResolvedValue({
        id: 'd1',
        title: 'Day 1',
        week: { program: { id: 'p1', name: 'Prog 1' } },
        dayExercises: [{ exercise: { id: 'e1', name: 'Ex 1' } }],
      });

      const result = await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const service = yield* ProgramsService;
            return yield* service.getDayWithExercises('p1', 'd1');
          }),
          TestLayer
        )
      );

      expect(result?.programName).toBe('Prog 1');
    });
  });

  describe('getProgramForHome', () => {
    it('should return program with completion status', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ dayId: 'd1', completedAt: new Date() }]),
        }),
      });
      mockDb.query.programs.findFirst.mockResolvedValue({
        id: 'p1',
        weeks: [
          {
            id: 'w1',
            days: [{ id: 'd1', title: 'Day 1', dayExercises: [1, 2] }],
          },
        ],
      });

      const result = await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const service = yield* ProgramsService;
            return yield* service.getProgramForHome('p1', 'u1');
          }),
          TestLayer
        )
      );

      expect(result?.weeks[0].days[0].isCompleted).toBe(true);
    });
  });

  describe('createProgramInstance', () => {
    it('should update user preferences with new instance id', async () => {
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({}),
        }),
      });

      const result = await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const service = yield* ProgramsService;
            return yield* service.createProgramInstance('u1', 'p1');
          }),
          TestLayer
        )
      );

      expect(result).toBeDefined();
      expect(mockDb.update).toHaveBeenCalledWith(schema.userPreferences);
    });
  });
});
