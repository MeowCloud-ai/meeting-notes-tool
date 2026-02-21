interface UpgradePromptProps {
  onUpgrade?: () => void;
}

export default function UpgradePrompt({ onUpgrade }: UpgradePromptProps) {
  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      window.open('https://meowmeet.app/pricing', '_blank');
    }
  };

  return (
    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-center space-y-2" data-testid="upgrade-prompt">
      <p className="text-sm font-medium text-amber-800">🐱 本月免費額度已用完</p>
      <p className="text-xs text-amber-600">升級到 Starter 方案，享受更多功能</p>
      <button
        onClick={handleUpgrade}
        className="px-4 py-1.5 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600 transition-colors"
        data-testid="upgrade-button"
      >
        升級方案
      </button>
    </div>
  );
}
