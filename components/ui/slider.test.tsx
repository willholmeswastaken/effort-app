import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Slider } from './slider';

describe('Slider', () => {
  it('renders correctly', () => {
    render(<Slider defaultValue={[50]} />);
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });
});
