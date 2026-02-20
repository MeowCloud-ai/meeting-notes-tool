import type { Summary } from '../../types/database';
import ActionItemCard from './ActionItemCard';
import KeyDialogueCard from './KeyDialogueCard';

interface SummaryViewProps {
  summary: Summary;
}

export default function SummaryView({ summary }: SummaryViewProps) {
  return (
    <div className="flex flex-col gap-3 max-h-96 overflow-y-auto">
      {/* Raw Summary */}
      {summary.raw_summary && (
        <div className="p-2 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">{summary.raw_summary}</p>
        </div>
      )}

      {/* Highlights */}
      {summary.highlights.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-1">📌 重點結論</h3>
          <ul className="flex flex-col gap-1">
            {summary.highlights.map((h, i) => (
              <li key={i} className="text-sm text-gray-800 pl-4 relative before:content-['•'] before:absolute before:left-1 before:text-gray-400">
                {h}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Items */}
      {summary.action_items.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-1">✅ 待辦事項</h3>
          <div className="flex flex-col gap-1">
            {summary.action_items.map((item, i) => (
              <ActionItemCard key={i} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Key Dialogues */}
      {summary.key_dialogues.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-1">💬 關鍵對話</h3>
          <div className="flex flex-col gap-1">
            {summary.key_dialogues.map((d, i) => (
              <KeyDialogueCard key={i} dialogue={d} />
            ))}
          </div>
        </div>
      )}

      {summary.highlights.length === 0 &&
        summary.action_items.length === 0 &&
        summary.key_dialogues.length === 0 &&
        !summary.raw_summary && (
          <p className="text-sm text-gray-400 text-center py-4">尚無摘要內容</p>
        )}
    </div>
  );
}
