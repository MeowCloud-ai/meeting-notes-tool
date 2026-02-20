import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Recording } from '../../types/database';
import RecordingItem from './RecordingItem';

export default function RecordingList() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecordings() {
      const { data } = await supabase
        .from('recordings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (data) setRecordings(data as Recording[]);
      setLoading(false);
    }

    fetchRecordings();
  }, []);

  if (loading) {
    return <div className="text-center text-sm text-gray-400 py-4">載入中...</div>;
  }

  if (recordings.length === 0) {
    return <div className="text-center text-sm text-gray-400 py-4">尚無錄音記錄</div>;
  }

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-gray-700">歷史錄音</h2>
      {recordings.map((rec) => (
        <RecordingItem key={rec.id} recording={rec} />
      ))}
    </div>
  );
}
