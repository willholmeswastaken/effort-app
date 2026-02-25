import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { UserMenu } from './user-menu';
import { useSession } from '@/lib/auth-client';

vi.mock('@/lib/auth-client', () => ({
  useSession: vi.fn(),
  signOut: vi.fn(),
}));

describe('UserMenu', () => {
  it('renders avatar if session exists', async () => {
    (useSession as any).mockReturnValue({ data: { user: { name: 'Test User' } } });

    render(<UserMenu />);
    // Wait for useEffect to mount
    expect(await screen.findByText('T')).toBeInTheDocument();
  });

  it('renders pulse if no session', () => {
    (useSession as any).mockReturnValue({ data: null });
    const { container } = render(<UserMenu />);
    expect(container.firstChild).toHaveClass('animate-pulse');
  });
});
