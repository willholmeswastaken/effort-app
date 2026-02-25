import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ProgramDetailClient from './client';

describe('Program Detail Client', () => {
  it('renders program details if found', () => {
    // Uses real data from lib/data.ts
    render(<ProgramDetailClient id="thrst-vol-1-3day" />);
    expect(screen.getByText(/Thrst Volume 1 \(3 Day\)/i)).toBeInTheDocument();
  });

  it('renders not found state', () => {
    render(<ProgramDetailClient id="invalid" />);
    expect(screen.getByText(/Program not found/i)).toBeInTheDocument();
  });
});
