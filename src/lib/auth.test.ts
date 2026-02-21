import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./supabase', () => ({
  supabase: {
    auth: {
      signInWithIdToken: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}));

vi.stubGlobal('chrome', {
  identity: {
    getAuthToken: vi.fn(),
    removeCachedAuthToken: vi.fn(),
  },
  runtime: { lastError: null },
});

import { supabase } from './supabase';
import { AuthManager } from './auth';

const mockAuth = vi.mocked(supabase.auth);
const mockGetAuthToken = vi.mocked(chrome.identity.getAuthToken);

describe('AuthManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuthToken.mockResolvedValue({ token: 'google-token-123', grantedScopes: [] });
  });

  describe('signIn', () => {
    it('should get Google token and sign in with Supabase', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' };
      mockAuth.signInWithIdToken.mockResolvedValue({ data: { user: mockUser, session: null }, error: null } as ReturnType<typeof mockAuth.signInWithIdToken> extends Promise<infer T> ? T : never);

      const manager = new AuthManager();
      const user = await manager.signIn();

      expect(user).toEqual(mockUser);
      expect(mockGetAuthToken).toHaveBeenCalledWith({ interactive: true });
      expect(mockAuth.signInWithIdToken).toHaveBeenCalledWith({ provider: 'google', token: 'google-token-123' });
    });

    it('should throw when Chrome identity fails', async () => {
      mockGetAuthToken.mockResolvedValue({ token: undefined, grantedScopes: [] } as ReturnType<typeof mockGetAuthToken> extends Promise<infer T> ? T : never);

      const manager = new AuthManager();
      await expect(manager.signIn()).rejects.toThrow('Failed to get auth token');
    });

    it('should throw when Supabase sign in fails', async () => {
      mockAuth.signInWithIdToken.mockResolvedValue({ data: { user: null, session: null }, error: { message: 'Invalid token', name: 'AuthError', status: 401 } } as ReturnType<typeof mockAuth.signInWithIdToken> extends Promise<infer T> ? T : never);

      const manager = new AuthManager();
      await expect(manager.signIn()).rejects.toThrow('Invalid token');
    });
  });

  describe('signOut', () => {
    it('should sign out from Supabase', async () => {
      mockAuth.signOut.mockResolvedValue({ error: null });

      const manager = new AuthManager();
      await manager.signOut();

      expect(mockAuth.signOut).toHaveBeenCalled();
    });

    it('should throw when Supabase sign out fails', async () => {
      mockAuth.signOut.mockResolvedValue({ error: { message: 'Network error', name: 'AuthError', status: 500 } });

      const manager = new AuthManager();
      await expect(manager.signOut()).rejects.toThrow('Network error');
    });
  });

  describe('getSession', () => {
    it('should return current session', async () => {
      const mockSession = { user: { id: 'user-1' }, access_token: 'token' };
      mockAuth.getSession.mockResolvedValue({ data: { session: mockSession }, error: null } as ReturnType<typeof mockAuth.getSession> extends Promise<infer T> ? T : never);

      const manager = new AuthManager();
      const session = await manager.getSession();

      expect(session).toEqual(mockSession);
    });

    it('should return null when no session', async () => {
      mockAuth.getSession.mockResolvedValue({ data: { session: null }, error: null });

      const manager = new AuthManager();
      const session = await manager.getSession();

      expect(session).toBeNull();
    });
  });

  describe('onAuthStateChange', () => {
    it('should register and unregister listeners', () => {
      const manager = new AuthManager();
      const callback = vi.fn();

      const unsubscribe = manager.onAuthStateChange(callback);
      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });
  });
});
