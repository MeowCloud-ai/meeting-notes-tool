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
    <div className="w-80 min-h-[400px] flex flex-col aurora-bg">
      {/* Gradient Signature Line */}
      <div className="gradient-signature h-[3px] w-full shrink-0" />

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-5">
        <img src="/icons/logo-aurora.svg" alt="MeowMeet" className="w-16 h-16" />
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">MeowMeet</h1>
          <p className="text-sm text-gray-500 mt-1">
            一鍵錄音，AI 自動產出會議摘要
          </p>
        </div>

        <div className="w-full mt-2 space-y-3">
          <button
            onClick={handleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-[#7C3AED] text-white text-sm font-medium btn-pill shadow-primary-glow hover:opacity-90 disabled:opacity-50 transition-all"
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

        <div className="mt-4 text-xs text-gray-400 space-y-1.5 text-center">
          <p>🎤 自動錄音會議音訊</p>
          <p>📝 AI 產出逐字稿與摘要</p>
          <p>✅ 自動提取待辦事項</p>
        </div>
      </div>
    </div>
  );
}
