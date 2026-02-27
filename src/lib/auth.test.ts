import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./supabase', () => ({
  supabase: {
    auth: {
      signInWithIdToken: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
  },
}));

vi.stubGlobal('chrome', {
  identity: {
    getRedirectURL: vi.fn().mockReturnValue('https://redirect.test'),
    launchWebAuthFlow: vi.fn(),
  },
  runtime: { lastError: null },
});

vi.stubGlobal('crypto', {
  randomUUID: vi.fn().mockReturnValue('test-nonce-uuid'),
  subtle: {
    digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
  },
});

import { supabase } from './supabase';
import { AuthManager } from './auth';

const mockAuth = vi.mocked(supabase.auth);
const mockLaunchWebAuthFlow = vi.mocked(chrome.identity.launchWebAuthFlow);

describe('AuthManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signIn', () => {
    it('should launch web auth flow and sign in with Supabase', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' };
      mockLaunchWebAuthFlow.mockResolvedValue(
        'https://redirect.test#id_token=google-id-token-123&token_type=Bearer',
      );
      mockAuth.signInWithIdToken.mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null,
      } as ReturnType<typeof mockAuth.signInWithIdToken> extends Promise<infer T> ? T : never);

      const manager = new AuthManager();
      const user = await manager.signIn();

      expect(user).toEqual(mockUser);
      expect(mockLaunchWebAuthFlow).toHaveBeenCalledWith(
        expect.objectContaining({ interactive: true }),
      );
      expect(mockAuth.signInWithIdToken).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'google', token: 'google-id-token-123' }),
      );
    });

    it('should throw when auth flow is cancelled', async () => {
      mockLaunchWebAuthFlow.mockResolvedValue(undefined as unknown as string);

      const manager = new AuthManager();
      await expect(manager.signIn()).rejects.toThrow('Auth flow cancelled');
    });

    it('should throw when Supabase sign in fails', async () => {
      mockLaunchWebAuthFlow.mockResolvedValue(
        'https://redirect.test#id_token=token-123&token_type=Bearer',
      );
      mockAuth.signInWithIdToken.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid token', name: 'AuthError', status: 401 },
      } as ReturnType<typeof mockAuth.signInWithIdToken> extends Promise<infer T> ? T : never);

      const manager = new AuthManager();
      await expect(manager.signIn()).rejects.toThrow('Invalid token');
    });
  });

  describe('ensureOrg', () => {
    it('stores org info on success', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { org_id: 'org-1', org_name: 'Test Org', role: 'admin' },
        error: null,
      });

      const manager = new AuthManager();
      const org = await manager.ensureOrg();
      expect(org).toEqual({ orgId: 'org-1', orgName: 'Test Org', role: 'admin' });
      expect(manager.getOrgInfo()).toEqual(org);
    });

    it('returns null on failure', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: { message: 'Failed', name: 'FunctionsError', context: {} },
      } as ReturnType<typeof supabase.functions.invoke> extends Promise<infer T> ? T : never);

      const manager = new AuthManager();
      const org = await manager.ensureOrg();
      expect(org).toBeNull();
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
      mockAuth.signOut.mockResolvedValue({
        error: { message: 'Network error', name: 'AuthError', status: 500 },
      });

      const manager = new AuthManager();
      await expect(manager.signOut()).rejects.toThrow('Network error');
    });
  });

  describe('getSession', () => {
    it('should return current session', async () => {
      const mockSession = { user: { id: 'user-1' }, access_token: 'token' };
      mockAuth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      } as ReturnType<typeof mockAuth.getSession> extends Promise<infer T> ? T : never);

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
