import type { RecordingStatus } from '../../types/database';

interface StatusBadgeProps {
  status: RecordingStatus;
}

const STATUS_CONFIG: Record<RecordingStatus, { label: string; className: string }> = {
  recording: { label: '錄音中', className: 'bg-red-50 text-red-600' },
  uploading: { label: '上傳中', className: 'bg-amber-50 text-amber-600' },
  transcribing: { label: '轉錄中', className: 'bg-blue-50 text-blue-600' },
  summarizing: { label: '摘要中', className: 'bg-[#7C3AED]/10 text-[#7C3AED]' },
  completed: { label: '完成', className: 'bg-emerald-50 text-emerald-600' },
  failed: { label: '失敗', className: 'bg-gray-100 text-gray-500' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const isProcessing = status === 'transcribing' || status === 'summarizing';

  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 btn-pill font-medium ${config.className}`}>
      {isProcessing && (
        <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {config.label}
    </span>
  );
}
