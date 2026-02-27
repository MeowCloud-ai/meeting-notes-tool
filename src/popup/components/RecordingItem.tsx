import type { Recording } from '../../types/database';
import { supabase } from '../../lib/supabase';
import StatusBadge from './StatusBadge';
import EditableTitle from './EditableTitle';

interface RecordingItemProps {
  recording: Recording;
  onClick: () => void;
  onTitleUpdate?: (id: string, newTitle: string) => void;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function RecordingItem({ recording, onClick, onTitleUpdate }: RecordingItemProps) {
  const date = new Date(recording.created_at).toLocaleDateString('zh-TW');

  const handleSaveTitle = async (newTitle: string): Promise<void> => {
    const { error } = await supabase
      .from('recordings')
      .update({ title: newTitle })
      .eq('id', recording.id);

    if (error) throw error;
    onTitleUpdate?.(recording.id, newTitle);
  };

  return (
    <button
      className="w-full text-left p-3 rounded-xl hover:bg-gray-50 transition-all shadow-card border border-gray-100/60 bg-white"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <EditableTitle value={recording.title} onSave={handleSaveTitle} />
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
