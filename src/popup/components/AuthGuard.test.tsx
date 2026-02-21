import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

vi.mock('../../lib/auth', () => ({
  authManager: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn().mockReturnValue(() => {}),
    signIn: vi.fn(),
  },
}));

import { authManager } from '../../lib/auth';
import AuthGuard from './AuthGuard';

const mockGetSession = vi.mocked(authManager.getSession);

describe('AuthGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authManager.onAuthStateChange).mockReturnValue(() => {});
  });

  it('shows loading state initially', () => {
    mockGetSession.mockReturnValue(new Promise(() => {}));
    render(<AuthGuard>{() => <div>Main Content</div>}</AuthGuard>);
    expect(screen.getByText('⏳')).toBeInTheDocument();
  });

  it('shows login page when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    render(<AuthGuard>{() => <div>Main Content</div>}</AuthGuard>);

    await waitFor(() => {
      expect(screen.getByTestId('google-sign-in')).toBeInTheDocument();
    });
    expect(screen.queryByText('Main Content')).not.toBeInTheDocument();
  });

  it('shows children when authenticated', async () => {
    const mockUser = { id: 'user-1', email: 'test@example.com' };
    mockGetSession.mockResolvedValue({ user: mockUser } as ReturnType<typeof mockGetSession> extends Promise<infer T> ? T : never);
    render(<AuthGuard>{(user) => <div>Welcome {user.email}</div>}</AuthGuard>);

    await waitFor(() => {
      expect(screen.getByText('Welcome test@example.com')).toBeInTheDocument();
    });
  });
});
