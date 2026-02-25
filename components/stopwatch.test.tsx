import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Stopwatch } from './stopwatch';

describe('Stopwatch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders initial time of 0:00', () => {
    const startTime = Date.now();
    render(<Stopwatch startTime={startTime} />);
    expect(screen.getByText('0:00')).toBeInTheDocument();
  });

  it('updates time after 1 second', () => {
    const startTime = Date.now();
    render(<Stopwatch startTime={startTime} />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText('0:01')).toBeInTheDocument();
  });

  it('formats hours correctly', () => {
    const startTime = Date.now() - (3600 * 1000); // 1 hour ago
    render(<Stopwatch startTime={startTime} />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText('1:00:01')).toBeInTheDocument();
  });
});
