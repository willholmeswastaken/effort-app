import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Effect, Layer } from 'effect';
import { UserService, UserServiceLive } from './User';
import { DatabaseService } from './Database';
import * as schema from '@/lib/db/schema';

describe('UserService', () => {
  const mockDb = {
    query: {
      userPreferences: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(),
  };

  const DatabaseServiceMock = Layer.succeed(DatabaseService, mockDb as any);
  const TestLayer = Layer.provide(UserServiceLive, DatabaseServiceMock);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPreferences', () => {
    it('should return user preferences', async () => {
      mockDb.query.userPreferences.findFirst.mockResolvedValue({
        activeProgramId: 'p1',
        hasOnboarded: true,
      });

      const result = await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const service = yield* UserService;
            return yield* service.getPreferences('u1');
          }),
          TestLayer
        )
      );

      expect(result.activeProgramId).toBe('p1');
      expect(result.hasOnboarded).toBe(true);
    });

    it('should return defaults if no preferences found', async () => {
      mockDb.query.userPreferences.findFirst.mockResolvedValue(null);

      const result = await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const service = yield* UserService;
            return yield* service.getPreferences('u1');
          }),
          TestLayer
        )
      );

      expect(result.activeProgramId).toBeNull();
      expect(result.hasOnboarded).toBe(false);
    });
  });

  describe('updatePreferences', () => {
    it('should insert or update preferences', async () => {
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          onConflictDoUpdate: vi.fn().mockResolvedValue({}),
        }),
      });

      await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const service = yield* UserService;
            return yield* service.updatePreferences('u1', { activeProgramId: 'p2' });
          }),
          TestLayer
        )
      );

      expect(mockDb.insert).toHaveBeenCalledWith(schema.userPreferences);
    });
  });

  describe('ensurePreferences', () => {
    it('should ensure preferences exist', async () => {
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          onConflictDoNothing: vi.fn().mockResolvedValue({}),
        }),
      });

      await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const service = yield* UserService;
            return yield* service.ensurePreferences('u1');
          }),
          TestLayer
        )
      );

      expect(mockDb.insert).toHaveBeenCalledWith(schema.userPreferences);
    });
  });
});
