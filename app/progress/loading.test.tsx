import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Loading from './loading';

describe('Progress Loading', () => {
  it('renders correctly', () => {
    const { container } = render(<Loading />);
    expect(container).toBeInTheDocument();
  });
});
