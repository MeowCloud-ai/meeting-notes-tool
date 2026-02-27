interface UserMenuProps {
  displayName: string | null;
  email: string;
  avatarUrl?: string | null;
  usageUsed: number;
  usageLimit: number;
  onSignOut: () => void;
}

export default function UserMenu({
  displayName,
  email,
  avatarUrl,
  usageUsed,
  usageLimit,
  onSignOut,
}: UserMenuProps) {
  return (
    <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50/80 shadow-card" data-testid="user-menu">
      <div className="w-8 h-8 rounded-full bg-[#7C3AED]/10 flex items-center justify-center overflow-hidden flex-shrink-0">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm">👤</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{displayName ?? email}</p>
        <p className="text-xs text-gray-400">
          {usageUsed}/{usageLimit} 分鐘已用
        </p>
      </div>

      <button
        onClick={onSignOut}
        className="text-xs text-gray-400 hover:text-[#7C3AED] px-2 py-1 btn-pill transition-colors"
        data-testid="sign-out-button"
      >
        登出
      </button>
    </div>
  );
}
