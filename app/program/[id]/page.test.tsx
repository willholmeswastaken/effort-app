import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ProgramPage from './page';

vi.mock('./client', () => ({
  default: ({ id }: { id: string }) => <div data-testid="client">{id}</div>,
}));

describe('Program Page (Server)', () => {
  it('renders client component with id', async () => {
    const result = await ProgramPage({ params: Promise.resolve({ id: 'p1' }) });
    render(result as any);
    expect(document.querySelector('[data-testid="client"]')).toHaveTextContent('p1');
  });
});
