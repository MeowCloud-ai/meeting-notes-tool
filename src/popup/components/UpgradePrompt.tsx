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
    <div className="p-4 aurora-bg rounded-xl shadow-card text-center space-y-2.5" data-testid="upgrade-prompt">
      <p className="text-sm font-medium text-gray-800">🐱 本月免費額度已用完</p>
      <p className="text-xs text-gray-500">升級到 Starter 方案，享受更多功能</p>
      <button
        onClick={handleUpgrade}
        className="px-5 py-2 bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white text-sm font-medium btn-pill shadow-primary-glow hover:opacity-90 transition-all"
        data-testid="upgrade-button"
      >
        升級方案
      </button>
    </div>
  );
}
