import { useState } from 'react';
import type { KeyDialogue } from '../../types/database';

interface KeyDialogueCardProps {
  dialogue: KeyDialogue;
}

export default function KeyDialogueCard({ dialogue }: KeyDialogueCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <button
      className="w-full text-left p-2 rounded-lg bg-blue-50 border border-blue-100 transition-colors hover:bg-blue-100"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center gap-2">
        <span className="text-base">💬</span>
        <span className="text-sm font-medium text-gray-700">{dialogue.speaker}</span>
        <span className="text-xs text-gray-400 ml-auto">{expanded ? '▲' : '▼'}</span>
      </div>
      {expanded && (
        <p className="text-sm text-gray-800 mt-1 pl-6">{dialogue.text}</p>
      )}
    </button>
  );
}
