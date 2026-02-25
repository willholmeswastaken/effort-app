import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getHomeDataDirect } from './home-data';
import { ProgramsService, UserService } from '@/lib/services';
import { Effect, Layer } from 'effect';

// Mock the services module to control runEffect
vi.mock('@/lib/services', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    runEffect: vi.fn(),
  };
});

const mockUser = {
  getPreferences: vi.fn(),
};

const mockPrograms = {
  getProgramForHome: vi.fn(),
};

const TestLayer = Layer.mergeAll(
  Layer.succeed(UserService, mockUser as any),
  Layer.succeed(ProgramsService, mockPrograms as any)
);

describe('Home Data Server Utility', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const services = await import('@/lib/services');
    // Implement runEffect to actually run the effect provided to it
    (services.runEffect as any).mockImplementation((effect: any) =>
      Effect.runPromise(Effect.provide(effect, TestLayer))
    );
  });

  it('returns success data if user is onboarded', async () => {
    mockUser.getPreferences.mockReturnValue(Effect.succeed({ hasOnboarded: true, activeProgramId: 'p1' }));
    mockPrograms.getProgramForHome.mockReturnValue(Effect.succeed({ id: 'p1', weeks: [] }));

    const result = await getHomeDataDirect('u1');
    expect(result.type).toBe('success');
    expect(mockUser.getPreferences).toHaveBeenCalledWith('u1');
  });

  it('returns redirect if not onboarded', async () => {
    mockUser.getPreferences.mockReturnValue(Effect.succeed({ hasOnboarded: false }));

    const result = await getHomeDataDirect('u1');
    expect(result.type).toBe('redirect');
    expect(result.to).toBe('/onboarding');
  });

  it('returns redirect on catchAll', async () => {
    mockUser.getPreferences.mockReturnValue(Effect.fail(new Error('Fail')));

    const result = await getHomeDataDirect('u1');
    expect(result.type).toBe('redirect');
    expect(result.to).toBe('/onboarding');
  });
});
