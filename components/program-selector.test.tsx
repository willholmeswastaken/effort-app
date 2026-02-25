import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ProgramSelector } from './program-selector';

describe('ProgramSelector', () => {
  it('renders all programs from data', () => {
    render(<ProgramSelector />);
    expect(screen.getByText(/Thrst Volume 1 \(3 Day\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Thrst Volume 1 \(4 Day\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Thrst Volume 1 \(5 Day\)/i)).toBeInTheDocument();
  });

  it('contains correct links', () => {
    render(<ProgramSelector />);
    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', '/program/thrst-vol-1-3day');
  });
});
