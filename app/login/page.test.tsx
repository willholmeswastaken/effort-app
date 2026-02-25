import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LoginPage from './page';
import { signIn } from '@/lib/auth-client';

vi.mock('@/lib/auth-client', () => ({
  signIn: {
    social: vi.fn(),
  },
}));

describe('Login Page', () => {
  it('renders sign in button', () => {
    render(<LoginPage />);
    expect(screen.getByText(/Continue with GitHub/i)).toBeInTheDocument();
  });

  it('calls signIn on button click', () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByText(/Continue with GitHub/i));
    expect(signIn.social).toHaveBeenCalledWith({
      provider: 'github',
      callbackURL: '/',
    });
  });
});
