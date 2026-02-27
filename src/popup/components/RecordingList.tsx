import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import type { Recording } from '../../types/database';
import RecordingItem from './RecordingItem';

interface RecordingListProps {
  onSelectRecording: (recording: Recording) => void;
}

export default function RecordingList({ onSelectRecording }: RecordingListProps) {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecordings(): Promise<void> {
      const { data } = await supabase
        .from('recordings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (data) setRecordings(data as Recording[]);
      setLoading(false);
    }

    fetchRecordings();
    const interval = setInterval(fetchRecordings, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleTitleUpdate = useCallback((id: string, newTitle: string) => {
    setRecordings((prev) =>
      prev.map((r) => (r.id === id ? { ...r, title: newTitle } : r)),
    );
  }, []);

  if (loading) {
    return <div className="text-center text-sm text-gray-300 py-4">載入中...</div>;
  }

  if (recordings.length === 0) {
    return <div className="text-center text-sm text-gray-300 py-4">尚無錄音記錄</div>;
  }

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-gray-600">歷史錄音</h2>
      {recordings.map((rec) => (
        <RecordingItem
          key={rec.id}
          recording={rec}
          onClick={() => onSelectRecording(rec)}
          onTitleUpdate={handleTitleUpdate}
        />
      ))}
    </div>
  );
}
