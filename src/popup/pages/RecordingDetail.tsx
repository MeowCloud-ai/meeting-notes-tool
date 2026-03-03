import { useState, useEffect, useCallback } from 'react';
import type { Recording, Transcript, Summary } from '../../types/database';
import { getTranscript, getSummary } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import StatusBadge from '../components/StatusBadge';
import TabSwitcher from '../components/TabSwitcher';
import TranscriptView from '../components/TranscriptView';
import SummaryView from '../components/SummaryView';
import type { RecordingStatus } from '../../types';

interface RecordingDetailProps {
  recording: Recording;
  onBack: () => void;
}

const TABS = ['逐字稿', '摘要'];
const PROCESSING_STATUSES: RecordingStatus[] = ['uploading', 'transcribing', 'summarizing'];
const POLL_INTERVAL_MS = 3000;

export default function RecordingDetail({ recording, onBack }: RecordingDetailProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStatus, setCurrentStatus] = useState<RecordingStatus>(recording.status);

  const fetchData = useCallback(async () => {
    const [tx, sm] = await Promise.all([
      getTranscript(recording.id),
      getSummary(recording.id),
    ]);
    setTranscript(tx);
    setSummary(sm);

    // Also refresh recording status
    const { data } = await supabase
      .from('recordings')
      .select('status')
      .eq('id', recording.id)
      .maybeSingle();
    if (data?.status) {
      setCurrentStatus(data.status as RecordingStatus);
    }

    return data?.status as RecordingStatus | undefined;
  }, [recording.id]);

  // Initial fetch
  useEffect(() => {
    async function init() {
      setLoading(true);
      await fetchData();
      setLoading(false);
    }
    init();
  }, [fetchData]);

  // Poll while processing
  useEffect(() => {
    if (!PROCESSING_STATUSES.includes(currentStatus)) return;

    const timer = setInterval(async () => {
      const status = await fetchData();
      if (status && !PROCESSING_STATUSES.includes(status as RecordingStatus)) {
        clearInterval(timer);
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [currentStatus, fetchData]);

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="text-sm text-gray-400 hover:text-[#7C3AED] transition-colors"
        >
          ← 返回
        </button>
        <h2 className="text-sm font-semibold text-gray-800 truncate flex-1">
          {recording.title}
        </h2>
        <StatusBadge status={currentStatus} />
      </div>

      {/* Tabs */}
      <TabSwitcher tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Content */}
      {loading ? (
        <div className="text-center text-sm text-gray-300 py-8">載入中...</div>
      ) : activeTab === 0 ? (
        transcript && transcript.content?.trim() ? (
          <TranscriptView transcript={transcript} />
        ) : (
          <div className="text-center text-sm text-gray-300 py-8">
            {currentStatus === 'transcribing' ? '轉錄中，請稍候...' :
             transcript && !transcript.content?.trim() ? '錄音中無語音內容（可能是靜音或太短）' :
             '尚無逐字稿'}
          </div>
        )
      ) : summary ? (
        <SummaryView summary={summary} />
      ) : (
        <div className="text-center text-sm text-gray-300 py-8">
          {currentStatus === 'summarizing' ? '摘要產生中，請稍候...' : '尚無摘要'}
        </div>
      )}
    </div>
  );
}
