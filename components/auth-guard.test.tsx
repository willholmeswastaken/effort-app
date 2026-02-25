import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AuthGuard } from './auth-guard';
import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

vi.mock('@/lib/auth-client', () => ({
  useSession: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

describe('AuthGuard', () => {
  it('renders children if session exists', () => {
    (useSession as any).mockReturnValue({ data: { user: {} }, isPending: false });
    (useRouter as any).mockReturnValue({ replace: vi.fn() });

    render(<AuthGuard>Protected Content</AuthGuard>);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('renders fallback if pending', () => {
    (useSession as any).mockReturnValue({ data: null, isPending: true });
    render(<AuthGuard fallback={<div>Loading...</div>}>Protected</AuthGuard>);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('redirects to login if no session', () => {
    const replace = vi.fn();
    (useSession as any).mockReturnValue({ data: null, isPending: false });
    (useRouter as any).mockReturnValue({ replace });

    render(<AuthGuard>Protected</AuthGuard>);
    expect(replace).toHaveBeenCalledWith('/login');
  });
});
