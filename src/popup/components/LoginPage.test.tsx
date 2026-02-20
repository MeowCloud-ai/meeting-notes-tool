import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from './LoginPage';

describe('LoginPage', () => {
  it('renders sign in button and branding', () => {
    render(<LoginPage onSignIn={vi.fn()} />);
    expect(screen.getByText('MeowMeet')).toBeInTheDocument();
    expect(screen.getByTestId('google-sign-in')).toBeInTheDocument();
    expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
  });

  it('calls onSignIn when button clicked', async () => {
    const onSignIn = vi.fn().mockResolvedValue(undefined);
    render(<LoginPage onSignIn={onSignIn} />);

    fireEvent.click(screen.getByTestId('google-sign-in'));
    await waitFor(() => {
      expect(onSignIn).toHaveBeenCalled();
    });
  });

  it('shows error when sign in fails', async () => {
    const onSignIn = vi.fn().mockRejectedValue(new Error('Auth failed'));
    render(<LoginPage onSignIn={onSignIn} />);

    fireEvent.click(screen.getByTestId('google-sign-in'));
    await waitFor(() => {
      expect(screen.getByTestId('sign-in-error')).toHaveTextContent('Auth failed');
    });
  });

  it('shows loading state during sign in', async () => {
    const onSignIn = vi.fn().mockImplementation(() => new Promise(() => {}));
    render(<LoginPage onSignIn={onSignIn} />);

    fireEvent.click(screen.getByTestId('google-sign-in'));
    await waitFor(() => {
      expect(screen.getByText('登入中...')).toBeInTheDocument();
    });
  });
});
