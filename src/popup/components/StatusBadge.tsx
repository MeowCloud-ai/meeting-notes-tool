import type { RecordingStatus } from '../../types/database';

interface StatusBadgeProps {
  status: RecordingStatus;
}

const STATUS_CONFIG: Record<RecordingStatus, { label: string; className: string }> = {
  recording: { label: '錄音中', className: 'bg-red-100 text-red-700' },
  uploading: { label: '上傳中', className: 'bg-yellow-100 text-yellow-700' },
  transcribing: { label: '轉錄中', className: 'bg-blue-100 text-blue-700' },
  summarizing: { label: '摘要中', className: 'bg-purple-100 text-purple-700' },
  completed: { label: '完成', className: 'bg-green-100 text-green-700' },
  failed: { label: '失敗', className: 'bg-gray-100 text-gray-700' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const isProcessing = status === 'transcribing' || status === 'summarizing';

  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${config.className}`}>
      {isProcessing && (
        <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {config.label}
    </span>
  );
}
