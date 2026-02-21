import { useState } from 'react';

interface LoginPageProps {
  onSignIn: () => Promise<void>;
}

export default function LoginPage({ onSignIn }: LoginPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await onSignIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-80 p-6 flex flex-col items-center gap-4">
      <div className="text-4xl">🐱</div>
      <h1 className="text-xl font-bold">MeowMeet</h1>
      <p className="text-sm text-gray-500 text-center">
        一鍵錄音，AI 自動產出會議摘要
      </p>

      <div className="w-full mt-4 space-y-3">
        <button
          onClick={handleSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          data-testid="google-sign-in"
        >
          {isLoading ? (
            <span className="animate-spin">⏳</span>
          ) : (
            <span>🔑</span>
          )}
          <span>{isLoading ? '登入中...' : 'Sign in with Google'}</span>
        </button>

        {error && (
          <p className="text-sm text-red-500 text-center" data-testid="sign-in-error">
            {error}
          </p>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-400 space-y-1 text-center">
        <p>🎤 自動錄音會議音訊</p>
        <p>📝 AI 產出逐字稿與摘要</p>
        <p>✅ 自動提取待辦事項</p>
      </div>
    </div>
  );
}
