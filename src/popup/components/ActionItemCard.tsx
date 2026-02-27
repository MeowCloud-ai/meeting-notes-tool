import { useState } from 'react';
import type { ActionItem } from '../../types/database';

interface ActionItemCardProps {
  item: ActionItem;
}

export default function ActionItemCard({ item }: ActionItemCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = [item.text, item.assignee && `負責人: ${item.assignee}`, item.due_date && `期限: ${item.due_date}`]
      .filter(Boolean)
      .join('\n');

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-start gap-2 p-2.5 rounded-xl bg-emerald-50/60 shadow-card">
      <span className="text-base mt-0.5">✅</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800">{item.text}</p>
        {item.assignee && (
          <p className="text-xs text-gray-400 mt-0.5">👤 {item.assignee}</p>
        )}
        {item.due_date && (
          <p className="text-xs text-gray-400">📅 {item.due_date}</p>
        )}
      </div>
      <button
        onClick={handleCopy}
        className="text-xs text-gray-300 hover:text-[#7C3AED] shrink-0 transition-colors"
        title="複製"
      >
        {copied ? '✓' : '📋'}
      </button>
    </div>
  );
}
