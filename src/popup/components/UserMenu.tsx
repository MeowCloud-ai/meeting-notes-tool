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
    <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50" data-testid="user-menu">
      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden flex-shrink-0">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm">👤</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{displayName ?? email}</p>
        <p className="text-xs text-gray-500">
          {usageUsed}/{usageLimit} 場已用
        </p>
      </div>

      <button
        onClick={onSignOut}
        className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1"
        data-testid="sign-out-button"
      >
        登出
      </button>
    </div>
  );
}
