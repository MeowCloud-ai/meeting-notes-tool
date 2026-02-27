interface MicStatusProps {
  isRecording: boolean;
  micEnabled: boolean;
}

export default function MicStatus({ isRecording, micEnabled }: MicStatusProps) {
  if (!isRecording) return null;

  return (
    <div
      className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${
        micEnabled
          ? 'bg-emerald-50 text-emerald-600'
          : 'bg-gray-100 text-gray-400'
      }`}
      data-testid="mic-status"
    >
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
        {micEnabled ? (
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
        ) : (
          <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.55-.9l4.17 4.18L21 19.73 4.27 3z" />
        )}
      </svg>
      <span>{micEnabled ? '麥克風開' : '僅錄分頁'}</span>
    </div>
  );
}
