import { useState, useEffect } from 'react';
import type { Recording, Transcript, Summary } from '../../types/database';
import { getTranscript, getSummary } from '../../lib/api';
import StatusBadge from '../components/StatusBadge';
import TabSwitcher from '../components/TabSwitcher';
import TranscriptView from '../components/TranscriptView';
import SummaryView from '../components/SummaryView';

interface RecordingDetailProps {
  recording: Recording;
  onBack: () => void;
}

const TABS = ['逐字稿', '摘要'];

export default function RecordingDetail({ recording, onBack }: RecordingDetailProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [tx, sm] = await Promise.all([
        getTranscript(recording.id),
        getSummary(recording.id),
      ]);
      setTranscript(tx);
      setSummary(sm);
      setLoading(false);
    }

    fetchData();
  }, [recording.id]);

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← 返回
        </button>
        <h2 className="text-sm font-semibold text-gray-800 truncate flex-1">
          {recording.title}
        </h2>
        <StatusBadge status={recording.status} />
      </div>

      {/* Tabs */}
      <TabSwitcher tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Content */}
      {loading ? (
        <div className="text-center text-sm text-gray-400 py-8">載入中...</div>
      ) : activeTab === 0 ? (
        transcript ? (
          <TranscriptView transcript={transcript} />
        ) : (
          <div className="text-center text-sm text-gray-400 py-8">
            {recording.status === 'transcribing' ? '轉錄中，請稍候...' : '尚無逐字稿'}
          </div>
        )
      ) : summary ? (
        <SummaryView summary={summary} />
      ) : (
        <div className="text-center text-sm text-gray-400 py-8">
          {recording.status === 'summarizing' ? '摘要產生中，請稍候...' : '尚無摘要'}
        </div>
      )}
    </div>
  );
}
