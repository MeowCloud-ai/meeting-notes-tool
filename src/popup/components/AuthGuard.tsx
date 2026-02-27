import { useState, useEffect, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { authManager } from '../../lib/auth';
import LoginPage from './LoginPage';

interface AuthGuardProps {
  children: (user: User) => ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authManager.getSession().then((session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const unsubscribe = authManager.onAuthStateChange(setUser);
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="w-80 min-h-[400px] bg-white flex flex-col">
        <div className="gradient-signature h-[3px] w-full shrink-0" />
        <div className="flex-1 flex items-center justify-center">
          <span className="animate-spin text-2xl">⏳</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <LoginPage
        onSignIn={async () => {
          await authManager.signIn();
        }}
      />
    );
  }

  return <>{children(user)}</>;
}
