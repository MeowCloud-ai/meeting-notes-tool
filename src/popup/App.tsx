import { useState, useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import AuthGuard from './components/AuthGuard';
import UserMenu from './components/UserMenu';
import RecordButton from './components/RecordButton';
import Timer from './components/Timer';
import RecordingList from './components/RecordingList';
import RecordingDetail from './pages/RecordingDetail';
import type { Recording } from '../types/database';

interface AppState {
  isRecording: boolean;
  isPaused: boolean;
  startTime: number | null;
  tabId: number | null;
}

const INITIAL_STATE: AppState = {
  isRecording: false,
  isPaused: false,
  startTime: null,
  tabId: null,
};

function MainApp({ user }: { user: User }) {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);

  const fetchState = useCallback(async () => {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_STATE' });
      if (response?.state) {
        setState(response.state as AppState);
      }
    } catch {
      // Extension context may not be available
    }
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  const sendMessage = async (type: string) => {
    setIsLoading(true);
    try {
      const response = await chrome.runtime.sendMessage({ type });
      if (response?.state) {
        setState(response.state as AppState);
      }
    } catch (err) {
      console.error('Message failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { authManager } = await import('../lib/auth');
      await authManager.signOut();
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  if (selectedRecording) {
    return (
      <div className="w-80 p-4" style={{ minHeight: '400px' }}>
        <RecordingDetail
          recording={selectedRecording}
          onBack={() => setSelectedRecording(null)}
        />
      </div>
    );
  }

  return (
    <div className="w-80 p-4 flex flex-col gap-4">
      <h1 className="text-xl font-bold text-center">🐱 MeowMeet</h1>

      <UserMenu
        displayName={user.user_metadata?.['full_name'] as string | null ?? null}
        email={user.email ?? ''}
        avatarUrl={user.user_metadata?.['avatar_url'] as string | null}
        usageUsed={0}
        usageLimit={3}
        onSignOut={handleSignOut}
      />

      <Timer isRunning={state.isRecording && !state.isPaused} startTime={state.startTime} />

      <RecordButton
        isRecording={state.isRecording}
        isPaused={state.isPaused}
        isLoading={isLoading}
        onStart={() => sendMessage('START_RECORDING')}
        onPause={() => sendMessage('PAUSE_RECORDING')}
        onResume={() => sendMessage('RESUME_RECORDING')}
        onStop={() => sendMessage('STOP_RECORDING')}
      />

      <hr className="border-gray-200" />

      <RecordingList onSelectRecording={setSelectedRecording} />
    </div>
  );
}

export default function App() {
  return (
    <AuthGuard>
      {(user) => <MainApp user={user} />}
    </AuthGuard>
  );
}
