import '@testing-library/jest-dom';
import { vi } from 'vitest';

class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

window.ResizeObserver = MockResizeObserver as any;

class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

window.IntersectionObserver = MockIntersectionObserver as any;

// Mock next/navigation redirect to throw like real Next.js
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url) => {
    const error = new Error('NEXT_REDIRECT');
    (error as any).digest = `NEXT_REDIRECT;replace;${url};307;`;
    throw error;
  }),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  })),
  usePathname: vi.fn(() => ''),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));
