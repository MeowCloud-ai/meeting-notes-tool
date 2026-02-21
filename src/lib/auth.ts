import { supabase } from './supabase';
import type { Session, User } from '@supabase/supabase-js';

export class AuthManager {
  private listeners: Set<(user: User | null) => void> = new Set();

  constructor() {
    supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      this.listeners.forEach((cb) => cb(user));
    });
  }

  async signIn(): Promise<User> {
    const token = await this.getGoogleToken();
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token,
    });

    if (error || !data.user) {
      throw new Error(error?.message ?? 'Sign in failed');
    }

    return data.user;
  }

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);

    // Also revoke the Chrome identity token
    try {
      const token = await this.getCachedToken();
      if (token) {
        chrome.identity.removeCachedAuthToken({ token });
      }
    } catch {
      // Best effort
    }
  }

  async getSession(): Promise<Session | null> {
    const { data } = await supabase.auth.getSession();
    return data.session;
  }

  onAuthStateChange(callback: (user: User | null) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private async getGoogleToken(): Promise<string> {
    const result = await chrome.identity.getAuthToken({ interactive: true });
    if (!result.token) {
      throw new Error('Failed to get auth token');
    }
    return result.token;
  }

  private async getCachedToken(): Promise<string | null> {
    try {
      const result = await chrome.identity.getAuthToken({ interactive: false });
      return result.token ?? null;
    } catch {
      return null;
    }
  }
}

export const authManager = new AuthManager();
