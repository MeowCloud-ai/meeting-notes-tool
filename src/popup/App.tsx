import { useState, useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import AuthGuard from './components/AuthGuard';
import UserMenu from './components/UserMenu';
import RecordButton from './components/RecordButton';
import MicStatus from './components/MicStatus';
import Timer from './components/Timer';
import RecordingList from './components/RecordingList';
import RecordingDetail from './pages/RecordingDetail';
import { planManager } from '../lib/plan';
import type { Recording } from '../types/database';

interface AppState {
  isRecording: boolean;
  isPaused: boolean;
  startTime: number | null;
  tabId: number | null;
  micEnabled: boolean;
}

const INITIAL_STATE: AppState = {
  isRecording: false,
  isPaused: false,
  startTime: null,
  tabId: null,
  micEnabled: false,
};

function MainApp({ user }: { user: User }) {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [usageUsed, setUsageUsed] = useState(0);
  const [usageLimit, setUsageLimit] = useState(30);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [listKey, setListKey] = useState(0);

  const fetchState = useCallback(async () => {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_STATE' });
      if (response?.state) {
        const prev = state.isRecording;
        const next = (response.state as AppState).isRecording;
        setState(response.state as AppState);
        // When recording stops, refresh the list
        if (prev && !next) {
          setListKey((k) => k + 1);
        }
      }
      if (response?.processing) {
        setProcessing(response.processing as string);
      } else {
        setProcessing(null);
      }
      if (response?.lastError) {
        setLastError(response.lastError as string);
      }
    } catch {
      // Extension context may not be available
    }
  }, [state.isRecording]);

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 2000);
    return () => clearInterval(interval);
  }, [fetchState]);

  // Fetch real usage from Supabase
  useEffect(() => {
    planManager.getUsage(user.id).then((u) => {
      setUsageUsed(Math.round(u.minutesUsed));
      setUsageLimit(u.minutesLimit);
    }).catch(() => {
      // Fallback to defaults
    });
  }, [user.id, listKey]);

  // Fetch org info
  useEffect(() => {
    import('../lib/auth').then(({ authManager }) => {
      const org = authManager.getOrgInfo();
      if (org) {
        setOrgName(org.orgName);
      }
    }).catch(() => {});
  }, []);

  const sendMessage = async (type: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await chrome.runtime.sendMessage({ type });
      if (response?.success === false) {
        setError(response.error || 'Unknown error');
        console.error('Recording error:', response.error);
      } else if (response?.state) {
        setState(response.state as AppState);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
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
      <div className="w-80 bg-white flex flex-col" style={{ minHeight: '400px' }}>
        {/* Gradient Signature Line */}
        <div className="gradient-signature h-[3px] w-full shrink-0" />
        <div className="p-4">
          <RecordingDetail
            recording={selectedRecording}
            onBack={() => setSelectedRecording(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white flex flex-col">
      {/* Gradient Signature Line */}
      <div className="gradient-signature h-[3px] w-full shrink-0" />

      <div className="p-4 flex flex-col gap-4">
        <div className="flex items-center justify-center gap-2">
          <img src="/icons/logo-aurora.svg" alt="MeowMeet" className="w-8 h-8" />
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">MeowMeet</h1>
        </div>

        <UserMenu
          displayName={user.user_metadata?.['full_name'] as string | null ?? null}
          email={user.email ?? ''}
          avatarUrl={user.user_metadata?.['avatar_url'] as string | null}
          orgName={orgName}
          usageUsed={usageUsed}
          usageLimit={usageLimit}
          onSignOut={handleSignOut}
        />

        {(error || lastError) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-600">
            <div className="flex justify-between items-start">
              <span>⚠️ {error || lastError}</span>
              {lastError && !error && (
                <button
                  onClick={() => {
                    chrome.runtime.sendMessage({ type: 'CLEAR_ERROR' });
                    setLastError(null);
                  }}
                  className="text-red-400 hover:text-red-600 ml-1"
                >✕</button>
              )}
            </div>
          </div>
        )}
        {processing && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-2 text-xs text-purple-600 animate-pulse">
            ⏳ {processing}
          </div>
        )}

        <Timer isRunning={state.isRecording && !state.isPaused} startTime={state.startTime} />

        <MicStatus isRecording={state.isRecording} micEnabled={state.micEnabled} />

        <RecordButton
          isRecording={state.isRecording}
          isPaused={state.isPaused}
          isLoading={isLoading}
          onStart={() => sendMessage('START_RECORDING')}
          onPause={() => sendMessage('PAUSE_RECORDING')}
          onResume={() => sendMessage('RESUME_RECORDING')}
          onStop={() => sendMessage('STOP_RECORDING')}
        />

        <hr className="border-gray-100" />

        <RecordingList key={listKey} onSelectRecording={setSelectedRecording} />
      </div>
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
