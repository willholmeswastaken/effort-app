import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Input } from './input';

describe('Input', () => {
  it('renders correctly', () => {
    render(<Input placeholder="Test Placeholder" />);
    expect(screen.getByPlaceholderText('Test Placeholder')).toBeInTheDocument();
  });

  it('handles input value', () => {
    render(<Input defaultValue="initial" />);
    const input = screen.getByDisplayValue('initial') as HTMLInputElement;
    expect(input.value).toBe('initial');
  });
});
