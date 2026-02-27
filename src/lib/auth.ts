import { supabase } from './supabase';
import type { Session, User } from '@supabase/supabase-js';

const GOOGLE_CLIENT_ID = '236935341601-pblbq373pkuo8mk7ibai10u1lcqi5gfc.apps.googleusercontent.com';

export interface OrgInfo {
  orgId: string;
  orgName: string;
  role: string;
}

export class AuthManager {
  private listeners: Set<(user: User | null) => void> = new Set();
  private orgInfo: OrgInfo | null = null;

  constructor() {
    supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      this.listeners.forEach((cb) => cb(user));
    });
  }

  async signIn(): Promise<User> {
    const { idToken, nonce } = await this.getGoogleIdToken();
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
      nonce,
    });

    if (error || !data.user) {
      throw new Error(error?.message ?? 'Sign in failed');
    }

    // Auto-create organization if user doesn't have one
    await this.ensureOrg();

    return data.user;
  }

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  }

  async getSession(): Promise<Session | null> {
    const { data } = await supabase.auth.getSession();
    return data.session;
  }

  async ensureOrg(): Promise<OrgInfo | null> {
    try {
      const { data, error } = await supabase.functions.invoke('ensure-org');
      if (error) {
        console.warn('ensure-org failed:', error);
        return null;
      }
      const result = data as { org_id?: string; org_name?: string; role?: string } | null;
      if (result?.org_id) {
        this.orgInfo = {
          orgId: result.org_id,
          orgName: result.org_name ?? '',
          role: result.role ?? 'member',
        };
      }
      return this.orgInfo;
    } catch {
      console.warn('ensure-org call failed, will retry on next sign-in');
      return null;
    }
  }

  getOrgInfo(): OrgInfo | null {
    return this.orgInfo;
  }

  onAuthStateChange(callback: (user: User | null) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private async getGoogleIdToken(): Promise<{ idToken: string; nonce: string }> {
    const redirectUri = chrome.identity.getRedirectURL();
    const nonce = crypto.randomUUID();
    
    // Google gets the hashed nonce, Supabase gets the raw nonce
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(nonce));
    const hashedNonce = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'id_token');
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('nonce', hashedNonce);
    authUrl.searchParams.set('prompt', 'select_account');

    const responseUrl = await chrome.identity.launchWebAuthFlow({
      url: authUrl.toString(),
      interactive: true,
    });

    if (!responseUrl) {
      throw new Error('Auth flow cancelled');
    }

    // Extract id_token from URL fragment
    const hashParams = new URLSearchParams(
      new URL(responseUrl).hash.substring(1)
    );
    const idToken = hashParams.get('id_token');
    
    if (!idToken) {
      throw new Error('No ID token in response');
    }

    return { idToken, nonce };
  }
}

export const authManager = new AuthManager();
