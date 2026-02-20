interface RecordButtonProps {
  isRecording: boolean;
  isPaused: boolean;
  isLoading: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export default function RecordButton({
  isRecording,
  isPaused,
  isLoading,
  onStart,
  onPause,
  onResume,
  onStop,
}: RecordButtonProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-full bg-gray-300 animate-pulse" />
        <span className="text-sm text-gray-500">處理中...</span>
      </div>
    );
  }

  if (!isRecording) {
    return (
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={onStart}
          className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 transition-colors shadow-lg flex items-center justify-center"
          aria-label="開始錄音"
        >
          <div className="w-6 h-6 rounded-full bg-white" />
        </button>
        <span className="text-sm text-gray-600">準備中</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-4">
        {isPaused ? (
          <button
            onClick={onResume}
            className="w-12 h-12 rounded-full bg-green-500 hover:bg-green-600 transition-colors shadow flex items-center justify-center"
            aria-label="繼續錄音"
          >
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        ) : (
          <button
            onClick={onPause}
            className="w-12 h-12 rounded-full bg-yellow-500 hover:bg-yellow-600 transition-colors shadow flex items-center justify-center"
            aria-label="暫停錄音"
          >
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          </button>
        )}

        <div className={`w-16 h-16 rounded-full bg-red-500 flex items-center justify-center ${!isPaused ? 'animate-pulse' : ''}`}>
          <div className="w-6 h-6 rounded-full bg-white" />
        </div>

        <button
          onClick={onStop}
          className="w-12 h-12 rounded-full bg-gray-700 hover:bg-gray-800 transition-colors shadow flex items-center justify-center"
          aria-label="停止錄音"
        >
          <div className="w-5 h-5 bg-white rounded-sm" />
        </button>
      </div>
      <span className="text-sm font-medium text-red-600">
        {isPaused ? '暫停' : '錄音中'}
      </span>
    </div>
  );
}
