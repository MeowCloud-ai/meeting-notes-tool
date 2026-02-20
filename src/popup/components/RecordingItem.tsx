import type { Recording } from '../../types/database';

interface RecordingItemProps {
  recording: Recording;
}

const STATUS_COLORS: Record<string, string> = {
  recording: 'bg-red-100 text-red-700',
  uploading: 'bg-yellow-100 text-yellow-700',
  transcribing: 'bg-blue-100 text-blue-700',
  summarizing: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-gray-100 text-gray-700',
};

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function RecordingItem({ recording }: RecordingItemProps) {
  const colorClass = STATUS_COLORS[recording.status] ?? 'bg-gray-100 text-gray-700';
  const date = new Date(recording.created_at).toLocaleDateString('zh-TW');

  return (
    <button
      className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
      onClick={() => {
        /* Phase 2 Sprint 2: navigate to detail */
      }}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm truncate flex-1">{recording.title}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${colorClass}`}>
          {recording.status}
        </span>
      </div>
      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
        <span>{formatDuration(recording.duration_seconds)}</span>
        <span>·</span>
        <span>{date}</span>
      </div>
    </button>
  );
}
