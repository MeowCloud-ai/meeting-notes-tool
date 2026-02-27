import type { Recording } from '../../types/database';
import StatusBadge from './StatusBadge';

interface RecordingItemProps {
  recording: Recording;
  onClick: () => void;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function RecordingItem({ recording, onClick }: RecordingItemProps) {
  const date = new Date(recording.created_at).toLocaleDateString('zh-TW');

  return (
    <button
      className="w-full text-left p-3 rounded-xl hover:bg-gray-50 transition-all shadow-card border border-gray-100/60 bg-white"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm text-gray-900 truncate flex-1">{recording.title}</span>
        <StatusBadge status={recording.status} />
      </div>
      <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
        <span className="font-mono">{formatDuration(recording.duration_seconds)}</span>
        <span>·</span>
        <span>{date}</span>
      </div>
    </button>
  );
}
