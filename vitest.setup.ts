import '@testing-library/jest-dom';

// Mock IntersectionObserver
class IntersectionObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);
