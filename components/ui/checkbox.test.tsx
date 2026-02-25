import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Checkbox } from './checkbox';

describe('Checkbox', () => {
  it('renders correctly', () => {
    render(<Checkbox id="test-check" />);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });
});
