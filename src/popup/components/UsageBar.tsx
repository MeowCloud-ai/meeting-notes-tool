interface UsageBarProps {
  used: number;
  limit: number;
}

export default function UsageBar({ used, limit }: UsageBarProps) {
  const percentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const isWarning = percentage >= 66;
  const isFull = used >= limit;

  return (
    <div className="space-y-1" data-testid="usage-bar">
      <div className="flex justify-between text-xs text-gray-400">
        <span>本月用量</span>
        <span className={isFull ? 'text-red-500 font-medium' : ''}>
          {used}/{limit} 場
        </span>
      </div>
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isFull ? 'bg-red-500' : isWarning ? 'bg-[#F59E0B]' : 'bg-[#7C3AED]'
          }`}
          style={{ width: `${percentage}%` }}
          data-testid="usage-bar-fill"
        />
      </div>
    </div>
  );
}
